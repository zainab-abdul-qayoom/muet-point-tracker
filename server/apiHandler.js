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
        SELECT id, name, email, roll_no, role, department, password_hash, avatar
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
      safeUser.rollNo = safeUser.roll_no;
      if (!safeUser.avatar) {
        if (safeUser.role === 'Driver') safeUser.avatar = '/images/avatars/driver.jpg';
        else if (safeUser.role === 'Admin') safeUser.avatar = '/images/avatars/admin.jpg';
        else safeUser.avatar = '/images/avatars/student-female.jpg';
      }
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

      // Flexible MUET Roll Number Pattern: 2 or 4-digit batch + department code + 1 to 4 digits (e.g. 25CS16, 25BSCS016, 25ME01, 24SW45)
      const rollPattern = /^(?:20)?[0-9]{2}[-\s]?[A-Z]{2,6}[-\s]?[0-9]{1,4}$/i;
      if (!rollPattern.test(cleanRollNo)) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          success: false,
          error: `Invalid Roll Number format "${cleanRollNo}". Allowed formats include 2 or 3 digits (e.g., 25CS16, 25BSCS016, 25ME01, 24SW45).`
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
        rollNo: cleanRollNo,
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
        SELECT id, name, email, roll_no, role, department, avatar 
        FROM users 
        WHERE id = ?
      `).get(decoded.id);

      if (!user) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'User account no longer exists' }));
        return;
      }

      const safeUser = { ...user, rollNo: user.roll_no };
      if (!safeUser.avatar) {
        if (safeUser.role === 'Driver') safeUser.avatar = '/images/avatars/driver.jpg';
        else if (safeUser.role === 'Admin') safeUser.avatar = '/images/avatars/admin.jpg';
        else safeUser.avatar = '/images/avatars/student-female.jpg';
      }

      res.end(JSON.stringify({ success: true, user: safeUser }));
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
    if (pathname.startsWith('/api/buses/') && !pathname.includes('/location') && req.method === 'PUT') {
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

    // 6b. BUSES: POST /api/buses/:id/location — Driver GPS location update
    if (pathname.match(/^\/api\/buses\/[^/]+\/location$/) && req.method === 'POST') {
      const user = authenticateRequest(req);
      if (!user || (user.role !== 'Driver' && user.role !== 'Admin')) {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Driver authorization required' }));
        return;
      }

      const busId = pathname.split('/')[3];
      const body = await readJsonBody();
      const { lat, lng, accuracy } = body;

      if (lat == null || lng == null) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'lat and lng are required' }));
        return;
      }

      const bus = db.prepare('SELECT id, driver_id, driver_name FROM buses WHERE id = ?').get(busId);
      if (!bus) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Bus not found' }));
        return;
      }

      // Drivers can only update their own bus; Admins can update any
      if (user.role === 'Driver' && bus.driver_id && bus.driver_id !== user.id && bus.driver_name !== user.name) {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: You can only update your own assigned bus' }));
        return;
      }

      db.prepare(`
        UPDATE buses SET
          current_lat = ?,
          current_lng = ?,
          last_update = CURRENT_TIMESTAMP,
          is_online = 1
        WHERE id = ?
      `).run(Number(lat), Number(lng), busId);

      res.end(JSON.stringify({
        success: true,
        message: 'Location updated',
        lat: Number(lat),
        lng: Number(lng),
        accuracy: accuracy || null
      }));
      return;
    }

    // 6c. TRIPS: POST /api/trips — Start a new trip
    if (pathname === '/api/trips' && req.method === 'POST') {
      const user = authenticateRequest(req);
      if (!user || (user.role !== 'Driver' && user.role !== 'Admin')) {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Driver authorization required' }));
        return;
      }

      const body = await readJsonBody();
      const { bus_id, route_id } = body;
      if (!bus_id) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'bus_id is required' }));
        return;
      }

      // End any existing active trip for this driver first
      db.prepare(`
        UPDATE trips SET status = 'Completed', end_time = CURRENT_TIMESTAMP
        WHERE driver_id = ? AND status = 'Active'
      `).run(user.id);

      const tripId = `trip-${Date.now()}`;
      db.prepare(`
        INSERT INTO trips (id, bus_id, driver_id, route_id, status)
        VALUES (?, ?, ?, ?, 'Active')
      `).run(tripId, bus_id, user.id, route_id || 'route-01');

      db.prepare(`UPDATE buses SET status = 'On Route', is_online = 1, driver_id = ? WHERE id = ?`).run(user.id, bus_id);

      res.statusCode = 201;
      res.end(JSON.stringify({ success: true, data: { id: tripId, bus_id, driver_id: user.id, status: 'Active' } }));
      return;
    }

    // 6d. TRIPS: GET /api/trips/active — Get active trip for current driver or any active
    if (pathname === '/api/trips/active' && req.method === 'GET') {
      const user = authenticateRequest(req);
      let trip;
      if (user && user.role === 'Driver') {
        trip = db.prepare(`
          SELECT t.*, b.current_lat, b.current_lng, b.number as bus_number
          FROM trips t LEFT JOIN buses b ON t.bus_id = b.id
          WHERE t.driver_id = ? AND t.status = 'Active'
          ORDER BY t.start_time DESC LIMIT 1
        `).get(user.id);
      } else {
        trip = db.prepare(`
          SELECT t.*, b.current_lat, b.current_lng, b.number as bus_number
          FROM trips t LEFT JOIN buses b ON t.bus_id = b.id
          WHERE t.status = 'Active'
          ORDER BY t.start_time DESC LIMIT 1
        `).get();
      }
      res.end(JSON.stringify({ success: true, data: trip || null }));
      return;
    }

    // 6e. TRIPS: PUT /api/trips/:id/end — End a trip
    if (pathname.match(/^\/api\/trips\/[^/]+\/end$/) && req.method === 'PUT') {
      const user = authenticateRequest(req);
      if (!user || (user.role !== 'Driver' && user.role !== 'Admin')) {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden' }));
        return;
      }

      const tripId = pathname.split('/')[3];
      const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
      if (!trip) {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Trip not found' }));
        return;
      }
      if (user.role === 'Driver' && trip.driver_id !== user.id) {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Not your trip' }));
        return;
      }

      db.prepare(`UPDATE trips SET status = 'Completed', end_time = CURRENT_TIMESTAMP WHERE id = ?`).run(tripId);
      db.prepare(`UPDATE buses SET status = 'Inactive', is_online = 0 WHERE id = ?`).run(trip.bus_id);

      res.end(JSON.stringify({ success: true, message: 'Trip ended' }));
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
      if (!user || (user.role !== 'Admin' && user.role !== 'Driver')) {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Admin or Driver role required to broadcast alerts' }));
        return;
      }

      const body = await readJsonBody();
      const notifId = `notif-${Date.now()}`;
      db.prepare(`
        INSERT INTO notifications (id, title, message, category, severity, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(notifId, body.title, body.message, body.category || 'alert', body.severity || 'warning');

      db.prepare('INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)').run(
        `Emergency alert broadcasted by ${user.name} (${user.role}): "${body.title}"`,
        user.name
      );

      res.statusCode = 201;
      res.end(JSON.stringify({ success: true, data: { id: notifId, ...body } }));
      return;
    }

    // 10b. NOTIFICATIONS: PUT /api/notifications/read — Mark all or single notification as read
    if (pathname === '/api/notifications/read' && req.method === 'PUT') {
      const user = authenticateRequest(req);
      if (!user) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
        return;
      }
      try {
        const body = await readJsonBody().catch(() => ({}));
        if (body && body.id) {
          db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(body.id);
        } else {
          db.prepare('UPDATE notifications SET is_read = 1').run();
        }
      } catch {
        db.prepare('UPDATE notifications SET is_read = 1').run();
      }
      res.end(JSON.stringify({ success: true, message: 'Notifications marked as read' }));
      return;
    }
    // 12. ISSUES: POST - create new issue (authenticated)
    if (pathname === '/api/issues' && req.method === 'POST') {
      const user = authenticateRequest(req);
      if (!user) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
        return;
      }
      const body = await readJsonBody();
      const { title, description } = body;
      if (!title || !description) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Title and description are required' }));
        return;
      }
      const issueId = `issue-${Date.now()}`;
      db.prepare(`
        INSERT INTO issues (id, user_id, title, description, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'Open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(issueId, user.id, title, description);
      db.prepare('INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)').run(
        `User ${user.name} submitted issue ${issueId}`,
        user.name
      );
      res.statusCode = 201;
      res.end(JSON.stringify({ success: true, data: { id: issueId, title, description, status: 'Open' } }));
      return;
    }
    // 13. ISSUES: GET - retrieve issues (admin gets all, others get own)
    if (pathname === '/api/issues' && req.method === 'GET') {
      const user = authenticateRequest(req);
      if (!user) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
        return;
      }
      let rows;
      if (user.role === 'Admin') {
        rows = db.prepare('SELECT * FROM issues ORDER BY created_at DESC').all();
      } else {
        rows = db.prepare('SELECT * FROM issues WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
      }
      res.end(JSON.stringify({ success: true, data: rows }));
      return;
    }

    // 14. ISSUES: PUT /api/issues/:id (Admin only) - update issue status
    if (pathname.match(/^\/api\/issues\/[^/]+$/) && req.method === 'PUT') {
      const user = authenticateRequest(req);
      if (!user || user.role !== 'Admin') {
        res.statusCode = 403;
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Admin role required to update issue status' }));
        return;
      }
      const issueId = pathname.split('/')[3];
      const body = await readJsonBody();
      const { status } = body;
      if (!status) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Status is required' }));
        return;
      }
      db.prepare('UPDATE issues SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, issueId);
      db.prepare('INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)').run(
        `Admin ${user.name} updated issue ${issueId} to ${status}`,
        user.name
      );
      res.end(JSON.stringify({ success: true, message: 'Issue updated successfully' }));
      return;
    }
    // 11. SCHEMA: GET

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
