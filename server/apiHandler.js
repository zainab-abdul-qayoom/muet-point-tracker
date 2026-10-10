import { getDatabase, getAllBuses, createBus, updateBusById, deleteBusById } from './db.js';
import { generateToken, authenticateRequest, verifyToken, hashPassword, verifyPassword } from './auth.js';

/**
 * Common REST API Request Handler for MUET Point Tracker
 * Used by both the Vite development server and the standalone production Node server.
 */
export async function handleApiRequest(req, res) {
  const db = getDatabase();
  res.setHeader('Content-Type', 'application/json');

  const readJsonBody = () => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (err) {
          reject(err);
        }
      });
      req.on('error', reject);
    });
  };

  try {
    const host = req.headers.host || 'localhost:3001';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const urlObj = new URL(req.url, `${protocol}://${host}`);
    const pathname = urlObj.pathname;

    // 0. HEALTH CHECK
    if (pathname === '/api/health' && req.method === 'GET') {
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'MUET Point Tracker Transit API',
        uptime: process.uptime(),
        database: 'SQLite (Connected)'
      }));
      return;
    }

    // 1. AUTH: Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readJsonBody();
      const { identifier, password } = body;

      if (!identifier || !password) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Roll No/Email and password are required' }));
        return;
      }

      const cleanIdentifier = identifier.trim();
      const user = db.prepare(`
        SELECT id, name, email, roll_no, role, department, password_hash
        FROM users
        WHERE LOWER(email) = LOWER(?) OR LOWER(roll_no) = LOWER(?)
      `).get(cleanIdentifier, cleanIdentifier);

      if (!user || !verifyPassword(password, user.password_hash)) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'Invalid credentials. Please verify your Roll No/Email and password.' }));
        return;
      }

      // Auto-upgrade password to scrypt hash if stored in legacy plaintext format
      if (!user.password_hash.startsWith('scrypt:')) {
        const upgradedHash = hashPassword(password);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(upgradedHash, user.id);
      }

      const { password_hash, ...safeUser } = user;
      const token = generateToken(safeUser);

      db.prepare('INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)').run(
        `User authenticated: ${safeUser.name} (${safeUser.role})`,
        safeUser.name
      );

      res.end(JSON.stringify({ success: true, token, user: safeUser }));
      return;
    }

    // 2. AUTH: Register Student (STUDENT ROLE ONLY)
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await readJsonBody();
      const { fullName, rollNo, email, password, confirmPassword, department } = body;

      if (!fullName || !rollNo || !password) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Full name, Roll Number, and Password are required.' }));
        return;
      }

      if (confirmPassword && password !== confirmPassword) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Password and Confirm Password do not match.' }));
        return;
      }

      if (password.length < 6) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Password must be at least 6 characters long.' }));
        return;
      }

      const cleanRollNo = rollNo.trim().toUpperCase();
      const cleanEmail = (email && email.trim()) 
        ? email.trim().toLowerCase() 
        : `${cleanRollNo.toLowerCase()}@student.muet.edu.pk`;

      // Strict MUET Roll Number Pattern: 2-digit year + 4-letter department + 3-digit number (e.g. 25BSCS016)
      const rollPattern = /^[0-9]{2}[A-Z]{4}[0-9]{3}$/;
      if (!rollPattern.test(cleanRollNo)) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          success: false,
          error: `Invalid Roll Number format "${cleanRollNo}". Must follow official MUET format: 2-digit year + 4-letter department + 3-digit number (e.g., 25BSCS016).`
        }));
        return;
      }

      const existing = db.prepare(`
        SELECT id, roll_no, email FROM users 
        WHERE LOWER(email) = LOWER(?) OR LOWER(roll_no) = LOWER(?)
      `).get(cleanEmail, cleanRollNo);

      if (existing) {
        res.statusCode = 409;
        const isRoll = existing.roll_no && existing.roll_no.toUpperCase() === cleanRollNo;
        res.end(JSON.stringify({ 
          success: false, 
          error: isRoll ? `Roll Number "${cleanRollNo}" is already registered. Please sign in instead.` : `Email address "${cleanEmail}" is already registered.`
        }));
        return;
      }

      const id = `usr-${Date.now().toString().slice(-4)}`;
      const hashedPassword = hashPassword(password);

      // STRICT ENFORCEMENT: Public registration creates Student accounts ONLY
      db.prepare(`
        INSERT INTO users (id, name, email, roll_no, role, department, password_hash)
        VALUES (?, ?, ?, ?, 'Student', ?, ?)
      `).run(id, fullName.trim(), cleanEmail, cleanRollNo, department?.trim() || 'Computer Systems Engineering', hashedPassword);

      const safeUser = { 
        id, 
        name: fullName.trim(), 
        email: cleanEmail, 
        roll_no: cleanRollNo, 
        role: 'Student', 
        department: department?.trim() || 'Computer Systems Engineering' 
      };
      const token = generateToken(safeUser);

      db.prepare('INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)').run(
        `New student registered: ${safeUser.name} (${cleanRollNo})`,
        safeUser.name
      );

      res.statusCode = 201;
      res.end(JSON.stringify({ success: true, token, user: safeUser }));
      return;
    }

    // 3. AUTH: Verify Session Token
    if (pathname === '/api/auth/verify' && req.method === 'GET') {
      const decoded = authenticateRequest(req);
      if (!decoded || !decoded.id) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'Session expired or invalid token' }));
        return;
      }

      const user = db.prepare(`
        SELECT id, name, email, roll_no, role, department 
        FROM users 
        WHERE id = ?
      `).get(decoded.id);

      if (!user) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'User account no longer exists' }));
        return;
      }

      res.end(JSON.stringify({ success: true, user }));
      return;
    }

    // 4. BUSES: GET (Public/Student Read)
    if (pathname === '/api/buses' && req.method === 'GET') {
      const rows = getAllBuses(db);
      res.end(JSON.stringify({ success: true, data: rows }));
      return;
    }

    // 5. BUSES: POST (ADMIN ONLY)
    if (pathname === '/api/buses' && req.method === 'POST') {
      const user = authenticateRequest(req);
      if (!user || user.role !== 'Admin') {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Admin authorization required to register new buses' }));
        return;
      }

      const body = await readJsonBody();
      if (!body.number || !body.plate) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Bus number and license plate are required' }));
        return;
      }

      const newBus = createBus(db, body, user.name);
      res.statusCode = 201;
      res.end(JSON.stringify({ success: true, data: newBus }));
      return;
    }

    // 6. BUSES: PUT /api/buses/:id (ADMIN or DRIVER)
    if (pathname.startsWith('/api/buses/') && req.method === 'PUT') {
      const user = authenticateRequest(req);
      if (!user || (user.role !== 'Admin' && user.role !== 'Driver')) {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Authorized access required to update vehicle' }));
        return;
      }

      const busId = pathname.split('/')[3];
      const body = await readJsonBody();
      const updated = updateBusById(db, busId, body, user.name);

      if (!updated) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Bus not found' }));
        return;
      }

      res.end(JSON.stringify({ success: true, data: updated }));
      return;
    }

    // 7. BUSES: DELETE /api/buses/:id (ADMIN ONLY)
    if (pathname.startsWith('/api/buses/') && req.method === 'DELETE') {
      const user = authenticateRequest(req);
      if (!user || user.role !== 'Admin') {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Admin authorization required to decommission vehicles' }));
        return;
      }

      const busId = pathname.split('/')[3];
      const success = deleteBusById(db, busId, user.name);

      if (!success) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Bus not found' }));
        return;
      }

      res.end(JSON.stringify({ success: true, message: 'Bus deleted successfully' }));
      return;
    }

    // 8. ROUTES: GET
    if (pathname === '/api/routes' && req.method === 'GET') {
      const routes = db.prepare('SELECT * FROM routes ORDER BY number ASC').all();
      const stops = db.prepare('SELECT * FROM stops ORDER BY stop_order ASC').all();
      const populated = routes.map((r) => {
        const routeStops = stops.filter((s) => s.route_id === r.id).map((s) => ({
          ...s,
          coords: [Number(s.lat), Number(s.lng)],
          eta: s.eta_text || '5 min'
        }));
        const pathCoordinates = routeStops.length > 1 ? routeStops.map((s) => s.coords) : [];
        return {
          ...r,
          stops: routeStops,
          pathCoordinates
        };
      });
      res.end(JSON.stringify({ success: true, data: populated }));
      return;
    }

    // 9. USERS: GET (ADMIN ONLY)
    if (pathname === '/api/users' && req.method === 'GET') {
      const user = authenticateRequest(req);
      if (!user || user.role !== 'Admin') {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Admin role required to access user list' }));
        return;
      }

      // Sensitive password_hash column is strictly excluded for student privacy
      const rows = db.prepare('SELECT id, name, email, roll_no, role, department, created_at FROM users').all();
      res.end(JSON.stringify({ success: true, data: rows }));
      return;
    }

    // 10. NOTIFICATIONS: GET & POST
    if (pathname === '/api/notifications' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
      res.end(JSON.stringify({ success: true, data: rows }));
      return;
    }

    if (pathname === '/api/notifications' && req.method === 'POST') {
      const user = authenticateRequest(req);
      if (!user || user.role !== 'Admin') {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Admin role required to broadcast alerts' }));
        return;
      }

      const body = await readJsonBody();
      const notifId = `notif-${Date.now()}`;
      db.prepare(`
        INSERT INTO notifications (id, title, message, category, severity, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(notifId, body.title, body.message, body.category || 'alert', body.severity || 'warning');

      db.prepare('INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)').run(
        `Emergency alert broadcasted: "${body.title}"`,
        user.name
      );

      res.statusCode = 201;
      res.end(JSON.stringify({ success: true, data: { id: notifId, ...body } }));
      return;
    }

    // 11. SCHEMA: GET
    if (pathname === '/api/schema' && req.method === 'GET') {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      const tableDetails = {};
      tables.forEach((t) => {
        const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
        const safeCols = cols.map(c => c.name === 'password_hash' ? { ...c, type: 'HIDDEN' } : c);
        tableDetails[t.name] = {
          columns: safeCols,
          rowCount: db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get().count
        };
      });
      res.end(JSON.stringify({ success: true, data: tableDetails }));
      return;
    }

    // 12. SECURE SQL QUERY EXECUTION (ADMIN ONLY & SANITIZED)
    if (pathname === '/api/query' && req.method === 'POST') {
      const user = authenticateRequest(req);
      if (!user || user.role !== 'Admin') {
        res.statusCode = 403;
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Forbidden: Server-side authentication and Admin role permissions are required to execute database inspection queries.' 
        }));
        return;
      }

      const body = await readJsonBody();
      const query = (body.query || '').trim();

      if (!query) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Query string is required' }));
        return;
      }

      // Enforce security policy: Block destructive DDL and credential sniffing
      const upperQuery = query.toUpperCase();
      if (upperQuery.includes('DROP TABLE') || upperQuery.includes('TRUNCATE') || upperQuery.includes('ALTER TABLE')) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Security policy violation: Destructive DDL commands are prohibited.' }));
        return;
      }

      if (/password_hash/i.test(query)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Security policy violation: Direct query of student password hashes is restricted.' }));
        return;
      }

      if (upperQuery.startsWith('SELECT') || upperQuery.startsWith('PRAGMA') || upperQuery.startsWith('EXPLAIN')) {
        const rows = db.prepare(query).all();
        
        db.prepare('INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)').run(
          `SQL query executed: ${query.slice(0, 60)}...`,
          user.name
        );

        res.end(JSON.stringify({ success: true, rows, count: rows.length }));
      } else {
        db.exec(query);
        
        db.prepare('INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)').run(
          `SQL command executed: ${query.slice(0, 60)}...`,
          user.name
        );

        res.end(JSON.stringify({ success: true, message: 'Statement executed successfully' }));
      }
      return;
    }

    // Fallback 404 for unknown /api endpoint
    res.statusCode = 404;
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
