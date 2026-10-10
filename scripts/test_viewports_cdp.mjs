import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const TEMP_USER_DATA = "C:\\Users\\LENOVO\\AppData\\Local\\Temp\\muet_cdp_profile";
const SCREENSHOT_DIR = "C:\\Users\\LENOVO\\Desktop\\muet-point-tracker-deployment\\test-screenshots";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.id++;
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.value;
  }

  async captureScreenshot(filename) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), buffer);
    console.log(`    [Screenshot Captured] ${filename}`);
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await delay(300);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log('--- STARTING CDP AUTOMATED RESPONSIVE & CHATBOT VERIFICATION ---');

  // 1. Launch Chrome with remote debugging
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check'
  ], { stdio: 'ignore' });

  await delay(2000);

  try {
    const targets = await getJson('http://127.0.0.1:9222/json');
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    if (!pageTarget) throw new Error('No CDP target page found');

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    console.log('Connected to Chrome DevTools Protocol via WebSocket');

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    // 2. Navigate to localhost:3001
    console.log('\nNavigating to http://localhost:3001...');
    await client.send('Page.navigate', { url: 'http://localhost:3001' });
    await delay(2000);

    // 3. Test Viewports on Auth Page (Logged Out)
    const requiredWidths = [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1366, 1440, 1920];
    console.log('\n--- 1. TESTING VIEWPORT WIDTHS (AUTH / SIGN-IN PAGE) ---');

    for (const w of requiredWidths) {
      await client.setViewport(w, 800);
      const overflow = await client.evaluate(`
        ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
          bodyScrollWidth: document.body.scrollWidth
        })
      `);

      const status = overflow.hasOverflow ? 'FAILED (Horizontal scroll detected!)' : 'PASSED (No horizontal scroll)';
      console.log(`  Viewport ${w}px: ${status} [scrollWidth: ${overflow.scrollWidth}px, innerWidth: ${overflow.innerWidth}px]`);
    }

    // Capture screenshots of Auth Page
    await client.setViewport(375, 812);
    await client.captureScreenshot('auth_mobile_375.png');

    await client.setViewport(1280, 800);
    await client.captureScreenshot('auth_desktop_1280.png');

    // 4. Authenticate as Student
    console.log('\n--- 2. AUTHENTICATING AS STUDENT (25BSCS016) ---');
    await client.evaluate(`
      (function() {
        const studentBtn = document.querySelector('button[title*="Student: 25BSCS016"]');
        if (studentBtn) studentBtn.click();
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      })()
    `);
    await delay(3000);

    const loggedInUser = await client.evaluate(`
      (function() {
        const u = sessionStorage.getItem('muet_tracker_user');
        return u ? JSON.parse(u) : null;
      })()
    `);
    console.log('Logged in user:', loggedInUser?.name, '| Role:', loggedInUser?.role);

    // 5. Test Viewports on Authenticated Dashboard
    console.log('\n--- 3. TESTING VIEWPORT WIDTHS (AUTHENTICATED STUDENT DASHBOARD) ---');
    for (const w of requiredWidths) {
      await client.setViewport(w, 800);
      const overflow = await client.evaluate(`
        ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth
        })
      `);

      const status = overflow.hasOverflow ? 'FAILED' : 'PASSED';
      console.log(`  Viewport ${w}px: ${status} [scrollWidth: ${overflow.scrollWidth}px, innerWidth: ${overflow.innerWidth}px]`);
    }

    await client.setViewport(375, 812);
    await client.captureScreenshot('dashboard_mobile_375.png');

    await client.setViewport(1280, 800);
    await client.captureScreenshot('dashboard_desktop_1280.png');

    // 6. Test MyMuetien Floating Chatbot Bubble
    console.log('\n--- 4. TESTING FLOATING MyMuetien ASSISTANT BUBBLE ---');
    const bubbleInfo = await client.evaluate(`
      (function() {
        const btn = document.querySelector('button[aria-label="Open MyMuetien AI Assistant"]');
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return {
          found: true,
          text: btn.innerText.replace(/\\s+/g, ' ').trim(),
          visible: rect.width > 0 && rect.height > 0,
          right: window.innerWidth - rect.right,
          bottom: window.innerHeight - rect.bottom
        };
      })()
    `);
    console.log('Bubble info:', JSON.stringify(bubbleInfo));

    // 7. Click to Open MyMuetien Chat Panel
    console.log('\n--- 5. OPENING MyMuetien CHAT PANEL & SENDING MESSAGE ---');
    await client.evaluate(`
      (function() {
        const btn = document.querySelector('button[aria-label="Open MyMuetien AI Assistant"]');
        if (btn) btn.click();
      })()
    `);
    await delay(600);

    // Verify Chat Panel Open
    const panelHeader = await client.evaluate(`
      (function() {
        const h3 = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('MyMuetien'));
        return h3 ? h3.textContent.trim() : null;
      })()
    `);
    console.log('Chat panel opened with header:', panelHeader);

    // Capture open chat screenshot at mobile and desktop
    await client.setViewport(375, 812);
    await client.captureScreenshot('chatbot_mobile_open_375.png');

    await client.setViewport(1280, 800);
    await client.captureScreenshot('chatbot_desktop_open_1280.png');

    // Send a message via quick prompt
    console.log('Sending message to MyMuetien via quick prompt...');
    await client.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const promptBtn = buttons.find(b => b.textContent.includes('When is Bus 03'));
        if (promptBtn) promptBtn.click();
      })()
    `);
    await delay(1800);

    await client.captureScreenshot('chatbot_conversation_active.png');

    const messageCount = await client.evaluate(`
      (function() {
        const msgs = document.querySelectorAll('.whitespace-pre-line');
        return Array.from(msgs).map(m => m.textContent.slice(0, 80) + '...');
      })()
    `);
    console.log('Received response from MyMuetien:');
    messageCount.forEach((m, idx) => console.log(`  [${idx + 1}] ${m}`));

    // Minimize / Close Chat
    await client.evaluate(`
      (function() {
        const closeBtn = document.querySelector('button[aria-label="Close MyMuetien"]');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await delay(400);

    // 8. Test Data-Heavy Admin Fleet View
    console.log('\n--- 6. TESTING DATA-HEAVY ADMIN FLEET TABLE VIEW ---');
    // Switch to Admin
    await client.evaluate(`
      (async function() {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: 'admin@muet.edu.pk', password: 'admin123' })
        });
        const data = await res.json();
        if (data.success && data.user && data.token) {
          sessionStorage.setItem('muet_tracker_token', data.token);
          sessionStorage.setItem('muet_tracker_user', JSON.stringify({ ...data.user, isAuthenticated: true }));
          sessionStorage.setItem('muet_active_tab', 'admin-fleet');
          window.location.reload();
        }
      })()
    `);
    await delay(2500);

    for (const w of [320, 375, 768, 1280]) {
      await client.setViewport(w, 800);
      const overflow = await client.evaluate(`
        ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth
        })
      `);
      console.log(`  Admin Fleet Viewport ${w}px: ${overflow.hasOverflow ? 'FAILED' : 'PASSED'} [scrollWidth: ${overflow.scrollWidth}px, innerWidth: ${overflow.innerWidth}px]`);
    }

    await client.setViewport(375, 812);
    await client.captureScreenshot('fleet_admin_mobile_375.png');

    await client.setViewport(1280, 800);
    await client.captureScreenshot('fleet_admin_desktop_1280.png');

    client.close();
    console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
