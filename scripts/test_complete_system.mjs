import http from 'node:http';
import fs from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import { getDatabase } from '../server/db.js';
import { verifyPassword } from '../server/auth.js';

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      if (typeof postData === 'string') {
        req.write(postData);
      } else {
        req.write(JSON.stringify(postData));
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   MUET POINT TRACKER — COMPREHENSIVE VERIFICATION  ');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:3001';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // TEST SUITE 1: HEALTH & ASSETS
  console.log('--- TEST SUITE 1: API Health & Static Assets ---');
  try {
    const health = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    assert(health.statusCode === 200, 'GET /api/health returns 200 OK');
    assert(health.json && health.json.status === 'ok', 'Health status is "ok"');
    assert(health.json && health.json.database.includes('SQLite'), 'Database is reported as SQLite connected');
  } catch (e) {
    assert(false, `Health check failed: ${e.message}`);
  }

  try {
    const gateImg = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/images/muet-gate-background.jpg',
      method: 'GET'
    });
    assert(gateImg.statusCode === 200, 'MUET gate image route returns 200 OK');
    assert(gateImg.headers['content-type']?.includes('image'), 'MUET gate content-type is image');
  } catch (e) {
    assert(false, `Gate image check failed: ${e.message}`);
  }

  try {
    const sealImg = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/assets/muet_logo_seal.jpg',
      method: 'GET'
    });
    assert(sealImg.statusCode === 200, 'MUET official logo seal returns 200 OK');
    assert(sealImg.headers['content-type']?.includes('image'), 'MUET logo seal content-type is image');
  } catch (e) {
    assert(false, `Seal image check failed: ${e.message}`);
  }

  // TEST SUITE 2: DATABASE HASHING INTEGRITY
  console.log('\n--- TEST SUITE 2: Database Password Hashing Integrity ---');
  const db = getDatabase();
  const allUsers = db.prepare('SELECT id, name, email, roll_no, role, password_hash FROM users').all();
  assert(allUsers.length >= 3, `Database has ${allUsers.length} users (Admin, Driver, Students)`);

  let allHashed = true;
  for (const u of allUsers) {
    if (!u.password_hash || !u.password_hash.startsWith('scrypt:')) {
      allHashed = false;
      console.error(`User ${u.email || u.roll_no} does not have scrypt hash: ${u.password_hash}`);
    }
  }
  assert(allHashed, 'All existing user accounts have secure scrypt:salt:hash formatted passwords');

  // Verify known demo passwords work with verifyPassword
  const adminUser = allUsers.find((u) => u.role === 'Admin');
  assert(adminUser && verifyPassword('admin123', adminUser.password_hash), 'Admin scrypt hash verifies successfully against "admin123"');

  const driverUser = allUsers.find((u) => u.role === 'Driver');
  assert(driverUser && verifyPassword('driver123', driverUser.password_hash), 'Driver scrypt hash verifies successfully against "driver123"');

  // TEST SUITE 3: STUDENT REGISTRATION & ROLL NUMBER VALIDATION
  console.log('\n--- TEST SUITE 3: Student Registration & MUET Roll Number Validation ---');
  // Attempt invalid roll number format (e.g. 24-SE-999)
  const invalidRollRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Invalid Roll Student',
      rollNo: '24-SE-999',
      department: 'Software Engineering',
      password: 'mypassword123',
      confirmPassword: 'mypassword123'
    }
  );
  assert(invalidRollRes.statusCode === 400, 'Invalid Roll Number format (24-SE-999) rejected with 400 Bad Request');
  assert(invalidRollRes.json?.error?.includes('25BSCS016'), 'Error message references official format example "25BSCS016"');

  // Attempt duplicate roll number using existing seeded demo student (25BSCS016)
  const dupRollRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Duplicate Student',
      rollNo: '25BSCS016',
      email: 'unique_email_test@muet.edu.pk',
      department: 'Computer Systems Engineering',
      password: 'mypassword123',
      confirmPassword: 'mypassword123'
    }
  );
  assert(dupRollRes.statusCode === 409, 'Registration with duplicate Roll Number (25BSCS016) rejected with 409 Conflict');
  assert(dupRollRes.json?.error?.includes('already registered'), 'Duplicate roll error message is informative');

  // Mismatched passwords
  const mismatchRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Mismatch Student',
      rollNo: '25BSCS789',
      email: 'mismatch@muet.edu.pk',
      password: 'password123',
      confirmPassword: 'password456'
    }
  );
  assert(mismatchRes.statusCode === 400, 'Mismatched passwords rejected with 400 Bad Request');

  // Register valid new student with lowercase input to verify automatic uppercase conversion
  const randDigits = Math.floor(100 + Math.random() * 899).toString();
  const testRollLower = `25bscs${randDigits}`;
  const testRollUpper = `25BSCS${randDigits}`;
  const testEmail = `student_${randDigits}@muet.edu.pk`;

  const regRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Aftab Ahmed Memon',
      rollNo: testRollLower, // lowercase input
      email: testEmail,
      department: 'Software Engineering',
      password: 'SafeStudentPass123',
      confirmPassword: 'SafeStudentPass123'
    }
  );
  assert(regRes.statusCode === 201, `Valid Student registration (${testRollUpper}) returns 201 Created`);
  assert(regRes.json?.success === true, 'Registration payload reports success: true');
  assert(regRes.json?.user?.roll_no === testRollUpper, 'Roll number is normalized to uppercase on storage');
  assert(regRes.json?.user?.role === 'Student', 'Public registration strictly assigns role "Student"');
  assert(regRes.json?.user?.password_hash === undefined, 'Sensitive password hash is NOT exposed in response payload');

  const studentToken = regRes.json?.token;
  const testStudentId = regRes.json?.user?.id;

  // TEST SUITE 4: AUTHENTICATION & LOGIN
  console.log('\n--- TEST SUITE 4: Authentication & Login ---');
  // Wrong password
  const badLoginRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      identifier: testRollUpper,
      password: 'WrongPassword999'
    }
  );
  assert(badLoginRes.statusCode === 401, 'Invalid password returns 401 Unauthorized');

  // Student login with newly registered roll number
  const studentLoginRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      identifier: testRollUpper,
      password: 'SafeStudentPass123'
    }
  );
  assert(studentLoginRes.statusCode === 200, 'Student login by new roll number returns 200 OK');
  assert(studentLoginRes.json?.user?.name === 'Aftab Ahmed Memon', 'Correct student profile returned');

  // Seeded Demo Student login (25BSCS016)
  const demoStudentLogin = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      identifier: '25BSCS016',
      password: 'password123'
    }
  );
  assert(demoStudentLogin.statusCode === 200, 'Demo Student (25BSCS016) login returns 200 OK');
  assert(demoStudentLogin.json?.user?.role === 'Student', 'Demo Student role verified');

  // Legacy Student login (MUET-2023-CS-001)
  const legacyStudentLogin = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      identifier: 'MUET-2023-CS-001',
      password: 'password123'
    }
  );
  assert(legacyStudentLogin.statusCode === 200, 'Preserved legacy account (MUET-2023-CS-001) login returns 200 OK');

  // Admin login
  const adminLoginRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      identifier: 'admin@muet.edu.pk',
      password: 'admin123'
    }
  );
  assert(adminLoginRes.statusCode === 200, 'Admin login returns 200 OK');
  assert(adminLoginRes.json?.user?.role === 'Admin', 'Admin profile verified');
  const adminToken = adminLoginRes.json?.token;

  // Driver login
  const driverLoginRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      identifier: 'DRV-7712',
      password: 'driver123'
    }
  );
  assert(driverLoginRes.statusCode === 200, 'Driver login by driver ID returns 200 OK');
  assert(driverLoginRes.json?.user?.role === 'Driver', 'Driver profile verified');

  // Verify token endpoint
  const verifyRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/verify',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(verifyRes.statusCode === 200, 'Session token verification returns 200 OK');
  assert(verifyRes.json?.user?.role === 'Admin', 'Verified user has Admin role');

  // TEST SUITE 5: ROLE-BASED ACCESS CONTROL (RBAC)
  console.log('\n--- TEST SUITE 5: Role-Based Access Control (RBAC) ---');
  // Student trying to add a bus
  const studentAddBus = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/buses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    },
    {
      number: 'Unauthorized Bus',
      plate: 'HACK-01'
    }
  );
  assert(studentAddBus.statusCode === 403, 'Student access to Admin bus creation returns 403 Forbidden');

  // Student trying to read user list
  const studentUsers = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentUsers.statusCode === 403, 'Student access to Admin user directory returns 403 Forbidden');

  // Admin access to user list
  const adminUsers = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminUsers.statusCode === 200, 'Admin can access user directory (200 OK)');
  const containsHashes = adminUsers.json?.data?.some((u) => u.password_hash !== undefined);
  assert(!containsHashes, 'User directory API does NOT leak password_hash to client');

  // TEST SUITE 6: BUS PERSISTENCE IN SQLITE
  console.log('\n--- TEST SUITE 6: Permanent Bus Persistence in SQLite ---');
  const testBusNumber = `Bus 88-QA-${Date.now().toString().slice(-4)}`;
  const testBusPlate = `HYD-88-${Date.now().toString().slice(-4)}`;

  const addBusRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/buses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    },
    {
      number: testBusNumber,
      plate: testBusPlate,
      route_id: 'route-04',
      driver_name: 'Ghulam Mustafa Chandio',
      capacity: 65,
      status: 'On Route'
    }
  );
  assert(addBusRes.statusCode === 201, 'Admin successfully adds bus (201 Created)');
  const createdBusId = addBusRes.json?.data?.id;

  // Direct database query verification
  const dbBus = db.prepare('SELECT * FROM buses WHERE id = ?').get(createdBusId);
  assert(dbBus && dbBus.number === testBusNumber, 'Bus record physically exists in SQLite database');

  // Verify bus via GET /api/buses
  const listBusesRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/buses',
    method: 'GET'
  });
  const foundInList = listBusesRes.json?.data?.find((b) => b.id === createdBusId);
  assert(foundInList !== undefined, 'Newly added bus is returned in public GET /api/buses response');

  // Clean up test entities so database remains clean
  if (createdBusId) {
    db.prepare('DELETE FROM buses WHERE id = ?').run(createdBusId);
    console.log(`  [CLEANUP] Deleted temporary test bus ${createdBusId}`);
  }
  if (testStudentId) {
    db.prepare('DELETE FROM users WHERE id = ?').run(testStudentId);
    console.log(`  [CLEANUP] Deleted temporary test student ${testStudentId}`);
  }

  // TEST SUITE 7: STANDALONE PRODUCTION SERVER VERIFICATION
  console.log('\n--- TEST SUITE 7: Standalone Production Server (server/server.js) ---');
  const TEST_PROD_PORT = 3009;
  const prodProcess = spawn('node', ['server/server.js'], {
    env: { ...process.env, PORT: TEST_PROD_PORT }
  });

  let prodStarted = false;
  await new Promise((resolve) => {
    prodProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Production Server running')) {
        prodStarted = true;
        resolve();
      }
    });
    prodProcess.stderr.on('data', (d) => console.error('Prod err:', d.toString()));
    setTimeout(resolve, 3000); // Wait up to 3s
  });

  assert(prodStarted, `Production server started successfully on port ${TEST_PROD_PORT}`);

  try {
    const prodHealth = await request({
      hostname: 'localhost',
      port: TEST_PROD_PORT,
      path: '/api/health',
      method: 'GET'
    });
    assert(prodHealth.statusCode === 200, 'Production server serves API endpoint /api/health');

    const prodFrontend = await request({
      hostname: 'localhost',
      port: TEST_PROD_PORT,
      path: '/',
      method: 'GET'
    });
    assert(prodFrontend.statusCode === 200, 'Production server serves built dist/index.html frontend');
    assert(prodFrontend.data.includes('<div id="root">'), 'index.html contains React root mount point');
  } catch (e) {
    assert(false, `Production server test error: ${e.message}`);
  } finally {
    prodProcess.kill();
  }

  // TEST SUITE 8: DUAL THEMES IMPLEMENTATION & PERSISTENCE
  console.log('\n--- TEST SUITE 8: Dual Themes (Default & Light Theme) ---');
  const indexCss = fs.readFileSync('src/index.css', 'utf8');
  assert(indexCss.includes('.theme-light'), 'src/index.css defines .theme-light styles');
  assert(indexCss.includes('#ffffff') && indexCss.includes('#f8fafc'), 'Light theme includes clean white cards and slate page backgrounds');
  assert(indexCss.includes('#2563eb'), 'Light theme applies professional blue accents (#2563eb)');
  assert(fs.existsSync('src/components/common/ThemeSwitcher.jsx'), 'ThemeSwitcher.jsx component exists');
  const themeSwitcherCode = fs.readFileSync('src/components/common/ThemeSwitcher.jsx', 'utf8');
  assert(themeSwitcherCode.includes('Default Theme') && themeSwitcherCode.includes('Light Theme'), 'ThemeSwitcher provides exactly two choices: Default Theme and Light Theme');
  const headerCode = fs.readFileSync('src/components/common/Header.jsx', 'utf8');
  assert(headerCode.includes('<ThemeSwitcher'), 'Header includes ThemeSwitcher component');
  const authPageCode = fs.readFileSync('src/components/auth/AuthPage.jsx', 'utf8');
  assert(authPageCode.includes('<ThemeSwitcher'), 'AuthPage includes ThemeSwitcher component');

  // TEST SUITE 9: FIRST-ADMIN PROVISIONING SCRIPT & AUDIT LOGS
  console.log('\n--- TEST SUITE 9: First-Admin Provisioning & Audit Trail ---');
  assert(fs.existsSync('scripts/create_admin.mjs'), 'scripts/create_admin.mjs exists');
  const provAdminEmail = `cli_admin_${Date.now().toString().slice(-4)}@muet.edu.pk`;
  const provAdminPass = 'SuperAdminSecretPass77';
  
  execSync(`node scripts/create_admin.mjs --email ${provAdminEmail} --name "Director Fleet" --password ${provAdminPass}`, { stdio: 'pipe' });
  
  const provUser = db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = ?').get(provAdminEmail);
  assert(provUser && provUser.role === 'Admin', 'CLI provisioning created valid Admin record');
  assert(provUser.password_hash.startsWith('scrypt:'), 'Provisioned Admin password is scrypt hashed');
  assert(verifyPassword(provAdminPass, provUser.password_hash), 'Provisioned Admin password verifies successfully');

  const auditEntry = db.prepare('SELECT * FROM audit_logs WHERE action LIKE ?').get(`%${provAdminEmail}%`);
  assert(auditEntry !== undefined, 'Administrative action logged to audit_logs table');

  // Clean up provisioned test admin
  if (provUser) {
    db.prepare('DELETE FROM users WHERE id = ?').run(provUser.id);
    console.log(`  [CLEANUP] Deleted test provisioned admin ${provUser.id}`);
  }

  // TEST SUITE 10: ACADEMIC DOCUMENTATION & RESPONSIVE GUARDS
  console.log('\n--- TEST SUITE 10: Academic Documentation & Responsive Architecture ---');
  assert(fs.existsSync('docs/PROJECT_REPORT_README.md'), 'docs/PROJECT_REPORT_README.md exists');
  const reportContent = fs.readFileSync('docs/PROJECT_REPORT_README.md', 'utf8');
  assert(reportContent.includes('Mermaid') || reportContent.includes('sequenceDiagram'), 'Academic report contains Mermaid UML diagrams');
  assert(reportContent.includes('Viva Voce Preparation'), 'Academic report contains viva voce preparation section');
  assert(reportContent.includes('320px'), 'Responsive testing matrix documented for all required viewports');

  console.log('\n====================================================');
  console.log(`   TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
