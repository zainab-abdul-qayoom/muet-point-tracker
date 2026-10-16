import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const TEMP_USER_DATA = "C:\\Users\\LENOVO\\AppData\\Local\\Temp\\muet_cdp_profile_chatbot";
const ARTIFACT_DIR = "C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\c2874eef-5550-4d03-aaad-de98cbf0b53a";
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
    const localPath = path.join(SCREENSHOT_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(localPath, buffer);
    fs.writeFileSync(artifactPath, buffer);
    console.log(`    [Screenshot Saved] ${filename} (Local + Artifact)`);
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
  console.log('=== STARTING CHATBOT LIGHT & DARK THEME VERIFICATION ===\n');

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

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    console.log('Navigating to http://localhost:3001...');
    await client.send('Page.navigate', { url: 'http://localhost:3001' });
    await delay(2000);

    // 1. Authenticate as Student
    console.log('Authenticating as Student (25BSCS016)...');
    await client.evaluate(`
      (function() {
        const studentBtn = document.querySelector('button[title*="Student: 25BSCS016"]');
        if (studentBtn) studentBtn.click();
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      })()
    `);
    await delay(2500);

    // 2. Open Chatbot in Dark Theme
    console.log('\n--- 1. TESTING DARK THEME (DEFAULT) ---');
    await client.evaluate(`
      (function() {
        const btn = document.querySelector('button[aria-label="Open MyMuetien AI Assistant"]');
        if (btn) btn.click();
      })()
    `);
    await delay(600);

    // Send a message via quick prompt "Next point?" to render rich answer card
    await client.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const promptBtn = buttons.find(b => b.textContent.includes('Next point?'));
        if (promptBtn) promptBtn.click();
      })()
    `);
    await delay(1500);

    // Capture screenshots in Dark Theme at 1440px and 360px
    await client.setViewport(1440, 900);
    await client.captureScreenshot('chatbot_dark_1440.png');

    await client.setViewport(360, 740);
    await client.captureScreenshot('chatbot_dark_360.png');

    const darkStyles = await client.evaluate(`
      (function() {
        const panel = document.querySelector('.mm-panel');
        const header = document.querySelector('.mm-header');
        const botBubble = document.querySelector('.mm-bubble-bot');
        const userBubble = document.querySelector('.mm-bubble-user');
        const richCard = document.querySelector('.mm-card');
        const chip = document.querySelector('.mm-chip');
        const input = document.querySelector('.mm-input');

        return {
          panelBg: window.getComputedStyle(panel).backgroundColor,
          headerBg: window.getComputedStyle(header).backgroundColor,
          botBubbleBg: botBubble ? window.getComputedStyle(botBubble).backgroundColor : null,
          botBubbleColor: botBubble ? window.getComputedStyle(botBubble).color : null,
          userBubbleBg: userBubble ? window.getComputedStyle(userBubble).backgroundColor : null,
          userBubbleColor: userBubble ? window.getComputedStyle(userBubble).color : null,
          richCardBg: richCard ? window.getComputedStyle(richCard).backgroundColor : null,
          chipColor: chip ? window.getComputedStyle(chip).color : null,
          inputBg: input ? window.getComputedStyle(input).backgroundColor : null,
          inputColor: input ? window.getComputedStyle(input).color : null
        };
      })()
    `);
    console.log('Dark Theme Computed Styles:');
    console.log(JSON.stringify(darkStyles, null, 2));

    // 3. Switch Theme to Light while panel is open (LIVE update test)
    console.log('\n--- 2. SWITCHING THEME TO LIGHT WHILE PANEL IS OPEN (LIVE UPDATE) ---');
    await client.evaluate(`
      (function() {
        // Toggle theme to light directly via document element
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('theme-light');
        document.body.classList.add('theme-light');
        localStorage.setItem('muet_tracker_theme', 'light');
      })()
    `);
    await delay(600);

    // Verify computed styles in Light Theme
    const lightStyles = await client.evaluate(`
      (function() {
        const panel = document.querySelector('.mm-panel');
        const header = document.querySelector('.mm-header');
        const botBubble = document.querySelector('.mm-bubble-bot');
        const userBubble = document.querySelector('.mm-bubble-user');
        const richCard = document.querySelector('.mm-card');
        const chip = document.querySelector('.mm-chip');
        const input = document.querySelector('.mm-input');
        const muted = document.querySelector('.mm-muted');

        return {
          panelBg: window.getComputedStyle(panel).backgroundColor,
          headerBg: window.getComputedStyle(header).backgroundColor,
          botBubbleBg: botBubble ? window.getComputedStyle(botBubble).backgroundColor : null,
          botBubbleColor: botBubble ? window.getComputedStyle(botBubble).color : null,
          userBubbleBg: userBubble ? window.getComputedStyle(userBubble).backgroundColor : null,
          userBubbleColor: userBubble ? window.getComputedStyle(userBubble).color : null,
          richCardBg: richCard ? window.getComputedStyle(richCard).backgroundColor : null,
          chipColor: chip ? window.getComputedStyle(chip).color : null,
          inputBg: input ? window.getComputedStyle(input).backgroundColor : null,
          inputColor: input ? window.getComputedStyle(input).color : null,
          mutedColor: muted ? window.getComputedStyle(muted).color : null
        };
      })()
    `);
    console.log('Light Theme Computed Styles:');
    console.log(JSON.stringify(lightStyles, null, 2));

    // Capture screenshots in Light Theme at 1440px and 360px
    await client.setViewport(1440, 900);
    await client.captureScreenshot('chatbot_light_1440.png');

    await client.setViewport(360, 740);
    await client.captureScreenshot('chatbot_light_360.png');

    client.close();
    console.log('\n=== CHATBOT VERIFICATION COMPLETED SUCCESSFULLY ===');
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
