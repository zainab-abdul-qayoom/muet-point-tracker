import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword } from './auth.js';

export function getDatabasePath() {
  if (process.env.DB_PATH) return path.resolve(process.env.DB_PATH);
  if (process.env.DATA_DIR) return path.resolve(process.env.DATA_DIR, 'muet_tracker.sqlite');
  return path.resolve(process.cwd(), 'muet_tracker.sqlite');
}

let dbInstance = null;

export function getDatabase() {
  if (dbInstance) return dbInstance;

  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(dbPath);

  // Enable WAL mode & foreign keys
  dbInstance.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      roll_no TEXT,
      role TEXT NOT NULL,
      department TEXT,
      password_hash TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL,
      name TEXT NOT NULL,
      origin TEXT,
      destination TEXT,
      distance TEXT,
      est_time TEXT,
      status TEXT,
      color TEXT,
      service_hours TEXT
    );

    CREATE TABLE IF NOT EXISTS stops (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      name TEXT NOT NULL,
      stop_order INTEGER,
      lat REAL,
      lng REAL,
      eta_text TEXT,
      is_major INTEGER DEFAULT 0,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS buses (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL,
      plate TEXT NOT NULL,
      route_id TEXT,
      driver_id TEXT,
      driver_name TEXT,
      status TEXT,
      capacity INTEGER,
      passengers INTEGER,
      speed TEXT,
      eta TEXT,
      current_lat REAL,
      current_lng REAL,
      current_location_name TEXT,
      next_stop_name TEXT,
      is_online INTEGER DEFAULT 1,
      last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      bus_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      status TEXT DEFAULT 'Active',
      FOREIGN KEY (bus_id) REFERENCES buses(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT,
      severity TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      bus_id TEXT,
      driver_id TEXT,
      category TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      performed_by TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: create issues table if not exists
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  seedInitialData(dbInstance);

  return dbInstance;
}

function seedInitialData(db) {
  // Check if users already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    // Migration: Upgrade existing plaintext passwords to secure scrypt hashes
    const existingUsers = db.prepare('SELECT id, password_hash FROM users').all();
    for (const u of existingUsers) {
      if (u.password_hash && !u.password_hash.startsWith('scrypt:')) {
        const hashed = hashPassword(u.password_hash);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashed, u.id);
      }
    }

    // Ensure avatar column exists on existing installations
    try {
      db.exec('ALTER TABLE users ADD COLUMN avatar TEXT');
    } catch {}

    // Populate avatars for demo users
    db.prepare("UPDATE users SET avatar = '/images/avatars/student-female.jpg' WHERE id = 'usr-01' OR roll_no = '25BSCS016'").run();
    db.prepare("UPDATE users SET avatar = '/images/avatars/driver.jpg' WHERE id = 'usr-02' OR roll_no = 'DRV-7712'").run();
    db.prepare("UPDATE users SET avatar = '/images/avatars/admin.jpg' WHERE id = 'usr-03' OR email = 'admin@muet.edu.pk'").run();

    // Migrate Zainab's roll to standard format if it still has any old legacy format
    db.prepare("UPDATE users SET roll_no = '25BSCS016' WHERE id = 'usr-01' AND roll_no IN ('MUET-2023-CS-001', '25BSCS001')").run();

    // Ensure standard demo roll number 25BSCS016 is also available
    const has25BSCS = db.prepare('SELECT id FROM users WHERE UPPER(roll_no) = ?').get('25BSCS016');
    if (!has25BSCS) {
      db.prepare(`
        INSERT INTO users (id, name, email, roll_no, role, department, password_hash, avatar)
        VALUES (?, ?, ?, ?, 'Student', ?, ?, ?)
      `).run('usr-25bscs', 'Bilal Ahmed', 'bilal.25bscs016@muet.edu.pk', '25BSCS016', 'Computer Systems Engineering', hashPassword('password123'), '/images/avatars/student-female.jpg');
    }

    // Idempotent migration: Ensure campus locations exist in stops
    const campusStops = [
      ['s-zp', 'route-02', 'Zero Point', 2, 25.4070, 68.2625, '2 min', 1],
      ['s-cc', 'route-02', 'Central Cafeteria (CC)', 3, 25.4072, 68.2628, '3 min', 1],
      ['s-ccps', 'route-02', 'CC Point Stand near Central Cafeteria', 4, 25.4074, 68.2630, '4 min', 1],
      ['s-cl', 'route-02', 'Central Library (CL)', 5, 25.4045, 68.2585, '6 min', 1],
      ['s-gym', 'route-02', 'Gymnasium', 6, 25.4020, 68.2570, '9 min', 1],
      ['s-dms', 'route-02', 'DMS', 7, 25.4050, 68.2605, '12 min', 1]
    ];
    for (const [id, rId, name, order, lat, lng, eta, major] of campusStops) {
      const exists = db.prepare('SELECT id FROM stops WHERE id = ? OR name = ?').get(id, name);
      if (!exists) {
        db.prepare(`
          INSERT INTO stops (id, route_id, name, stop_order, lat, lng, eta_text, is_major)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, rId, name, order, lat, lng, eta, major);
      }
    }

    // Idempotent migration: Ensure key numbered points (Point 3, Point 29, Point 32, Point 33) exist
    const numberedPoints = [
      ['bus-03', 'Bus 03', 'GSA-4412', 'route-02', 'drv-03', 'Ahmed Khan', 'Arriving', 65, 48, '38 km/h', '4 min', 25.4080, 68.2635, 'Academic Block', 'Zero Point', 1],
      ['bus-29', 'Bus 29', 'GSA-7829', 'route-02', 'drv-29', 'Mukhtiar Chandio', 'On Route', 65, 44, '36 km/h', '5 min', 25.4074, 68.2630, 'CC Point Stand', 'Central Library (CL)', 1],
      ['bus-32', 'Bus 32', 'GSA-8932', 'route-04', 'drv-32', 'Abdul Sattar', 'On Route', 65, 51, '40 km/h', '8 min', 25.4045, 68.2585, 'Central Library (CL)', 'Gymnasium', 1],
      ['bus-33', 'Bus 33', 'GSA-9133', 'route-01', 'drv-33', 'Naveed Solangi', 'Arriving', 65, 38, '35 km/h', '3 min', 25.4070, 68.2625, 'Zero Point', 'DMS', 1]
    ];
    for (const [id, num, plate, rId, dId, dName, st, cap, pass, spd, eta, lat, lng, loc, next, online] of numberedPoints) {
      const exists = db.prepare('SELECT id FROM buses WHERE id = ? OR number = ?').get(id, num);
      if (!exists) {
        db.prepare(`
          INSERT INTO buses (id, number, plate, route_id, driver_id, driver_name, status, capacity, passengers, speed, eta, current_lat, current_lng, current_location_name, next_stop_name, is_online)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, num, plate, rId, dId, dName, st, cap, pass, spd, eta, lat, lng, loc, next, online);
      }
    }

    return;
  }

  // Insert Users with secure scrypt hashes
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, roll_no, role, department, password_hash, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('usr-01', 'Zainab Abdul Qayoom', 'zainab@gmail.com', '25BSCS016', 'Student', 'Computer Science', hashPassword('password123'), '/images/avatars/student-female.jpg');
  insertUser.run('usr-25bscs', 'Bilal Ahmed', 'bilal.25bscs016@muet.edu.pk', '25BSCS016', 'Student', 'Computer Systems Engineering', hashPassword('password123'), '/images/avatars/student-female.jpg');
  insertUser.run('usr-02', 'Ahmed Khan', 'ahmed.driver@muet.edu.pk', 'DRV-7712', 'Driver', 'Transport Section', hashPassword('driver123'), '/images/avatars/driver.jpg');
  insertUser.run('usr-03', 'Dr. Asif Shah', 'admin@muet.edu.pk', 'ADM-001', 'Admin', 'Transport Directorate', hashPassword('admin123'), '/images/avatars/admin.jpg');

  // Insert Routes
  const insertRoute = db.prepare(`
    INSERT INTO routes (id, number, name, origin, destination, distance, est_time, status, color, service_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRoute.run('route-01', 'Route 01', 'Main Campus ➔ Hala', 'Main Campus', 'Hala', '42 km', '55 min', 'Active', '#22c55e', '07:00 AM - 04:30 PM');
  insertRoute.run('route-02', 'Route 02', 'Main Campus ➔ Tando Bago', 'Main Campus', 'Tando Bago', '18 km', '35 min', 'Active', '#10b981', '07:30 AM - 05:00 PM');
  insertRoute.run('route-03', 'Route 03', 'Main Campus ➔ DMC / Kotri', 'Main Campus', 'DMC', '14 km', '25 min', 'Active', '#a855f7', '07:45 AM - 05:00 PM');
  insertRoute.run('route-04', 'Route 04', 'Main Campus ➔ Hyderabad City', 'Main Campus', 'Hyderabad City', '22 km', '40 min', 'Active', '#f97316', '07:15 AM - 05:30 PM');
  insertRoute.run('route-05', 'Route 05', 'Main Campus ➔ Qasimabad', 'Main Campus', 'Qasimabad', '16 km', '28 min', 'Active', '#06b6d4', '07:30 AM - 05:00 PM');

  // Insert Stops for all routes
  const insertStop = db.prepare(`
    INSERT INTO stops (id, route_id, name, stop_order, lat, lng, eta_text, is_major)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialStops = [
    // Route 01: Hala
    ['h-01', 'route-01', 'Main Campus Terminal', 1, 25.4057, 68.2618, '0 min', 1],
    ['h-02', 'route-01', 'MUET Main Gate', 2, 25.4110, 68.2660, '4 min', 1],
    ['h-03', 'route-01', 'Jamshoro Bypass / Toll', 3, 25.4350, 68.2800, '10 min', 1],
    ['h-04', 'route-01', 'Al-Manzar Indus View', 4, 25.4450, 68.3000, '16 min', 0],
    ['h-05', 'route-01', 'Hatri Bypass', 5, 25.4700, 68.3400, '25 min', 1],
    ['h-06', 'route-01', 'Matiari Phatak', 6, 25.5950, 68.4450, '38 min', 1],
    ['h-07', 'route-01', 'Khandu Stop', 7, 25.6900, 68.4300, '46 min', 0],
    ['h-08', 'route-01', 'Hala N-5 City Gate', 8, 25.8100, 68.4200, '55 min', 1],
    // Route 02: Tando Bago
    ['s-01', 'route-02', 'Main Campus (Starting Point)', 1, 25.4057, 68.2618, '0 min', 1],
    ['s-zp', 'route-02', 'Zero Point', 2, 25.4070, 68.2625, '2 min', 1],
    ['s-cc', 'route-02', 'Central Cafeteria (CC)', 3, 25.4072, 68.2628, '3 min', 1],
    ['s-ccps', 'route-02', 'CC Point Stand near Central Cafeteria', 4, 25.4074, 68.2630, '4 min', 1],
    ['s-04', 'route-02', 'Central Library (CL)', 5, 25.4045, 68.2585, '6 min', 1],
    ['s-gym', 'route-02', 'Gymnasium', 6, 25.4020, 68.2570, '9 min', 1],
    ['s-dms', 'route-02', 'DMS', 7, 25.4050, 68.2605, '12 min', 1],
    ['s-02', 'route-02', 'Academic Block', 8, 25.4080, 68.2635, '15 min', 1],
    ['s-03', 'route-02', 'Engineering Faculty', 9, 25.4065, 68.2600, '18 min', 0],
    ['s-05', 'route-02', 'Sports Complex', 10, 25.4020, 68.2570, '22 min', 0],
    ['s-06', 'route-02', 'Tando Bago Terminal (End Point)', 11, 25.3100, 68.3800, '35 min', 1],
    // Route 03: DMC / Kotri
    ['d-01', 'route-03', 'Main Campus Terminal', 1, 25.4057, 68.2618, '0 min', 1],
    ['d-02', 'route-03', 'Thermal Power Station Stop', 2, 25.3950, 68.2850, '6 min', 0],
    ['d-03', 'route-03', 'Kotri Barrage Bridge', 3, 25.3700, 68.3100, '12 min', 1],
    ['d-04', 'route-03', 'SITE Area Kotri', 4, 25.3550, 68.3050, '18 min', 0],
    ['d-05', 'route-03', 'DMC City Hospital', 5, 25.3400, 68.3200, '25 min', 1],
    // Route 04: Hyderabad City
    ['c-01', 'route-04', 'Main Campus Terminal', 1, 25.4057, 68.2618, '0 min', 1],
    ['c-02', 'route-04', 'Jamshoro Bypass', 2, 25.4200, 68.2700, '7 min', 0],
    ['c-03', 'route-04', 'Sindh University Gate', 3, 25.4130, 68.2750, '12 min', 0],
    ['c-04', 'route-04', 'Hyderabad Toll Plaza', 4, 25.4100, 68.3100, '18 min', 1],
    ['c-05', 'route-04', 'Qasim Chowk', 5, 25.4000, 68.3450, '24 min', 1],
    ['c-06', 'route-04', 'Gul Center', 6, 25.3950, 68.3680, '32 min', 1],
    ['c-07', 'route-04', 'Haider Chowk Terminal', 7, 25.3900, 68.3720, '40 min', 1],
    // Route 05: Qasimabad
    ['q-01', 'route-05', 'Main Campus Terminal', 1, 25.4057, 68.2618, '0 min', 1],
    ['q-02', 'route-05', 'MUET Main Gate', 2, 25.4110, 68.2660, '4 min', 1],
    ['q-03', 'route-05', 'Nasim Nagar Chowk', 3, 25.3960, 68.3280, '15 min', 1],
    ['q-04', 'route-05', 'Prince Town', 4, 25.3880, 68.3360, '20 min', 0],
    ['q-05', 'route-05', 'Alamdar Chowk Qasimabad', 5, 25.3820, 68.3420, '28 min', 1]
  ];

  for (const s of initialStops) {
    insertStop.run(...s);
  }

  // Insert Buses
  const insertBus = db.prepare(`
    INSERT INTO buses (id, number, plate, route_id, driver_id, driver_name, status, capacity, passengers, speed, eta, current_lat, current_lng, current_location_name, next_stop_name, is_online)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBus.run('bus-01', 'Bus 01', 'GSA-2041', 'route-01', 'drv-01', 'Rasheed Ahmed', 'Arriving', 65, 52, '42 km/h', '2 min', 25.4110, 68.2660, 'MUET Main Gate', 'Jamshoro Bypass', 1);
  insertBus.run('bus-03', 'Bus 03', 'GSA-4412', 'route-02', 'drv-03', 'Ahmed Khan', 'Arriving', 65, 48, '38 km/h', '4 min', 25.4080, 68.2635, 'Academic Block', 'Zero Point', 1);
  insertBus.run('bus-05', 'Bus 05', 'GSA-3390', 'route-03', 'drv-05', 'Tariq Baloch', 'On Route', 60, 58, '45 km/h', '8 min', 25.3700, 68.3100, 'Kotri Barrage', 'SITE Area Kotri', 1);
  insertBus.run('bus-07', 'Bus 07', 'GSA-5108', 'route-04', 'drv-07', 'Ghulam Nabi', 'On Route', 65, 42, '40 km/h', '12 min', 25.4000, 68.3450, 'Qasim Chowk', 'Gul Center', 1);
  insertBus.run('bus-29', 'Bus 29', 'GSA-7829', 'route-02', 'drv-29', 'Mukhtiar Chandio', 'On Route', 65, 44, '36 km/h', '5 min', 25.4074, 68.2630, 'CC Point Stand', 'Central Library (CL)', 1);
  insertBus.run('bus-32', 'Bus 32', 'GSA-8932', 'route-04', 'drv-32', 'Abdul Sattar', 'On Route', 65, 51, '40 km/h', '8 min', 25.4045, 68.2585, 'Central Library (CL)', 'Gymnasium', 1);
  insertBus.run('bus-33', 'Bus 33', 'GSA-9133', 'route-01', 'drv-33', 'Naveed Solangi', 'Arriving', 65, 38, '35 km/h', '3 min', 25.4070, 68.2625, 'Zero Point', 'DMS', 1);
  insertBus.run('bus-11', 'Bus 11', 'GSA-3312', 'route-02', 'drv-11', 'Mansoor Jamali', 'Maintenance', 65, 0, '0 km/h', 'Offline', 25.4020, 68.2570, 'Transport Workshop', 'N/A', 0);
  insertBus.run('bus-12', 'Bus 12', 'GSA-4902', 'route-01', 'drv-12', 'Khadim Hussain', 'Inactive', 65, 0, '0 km/h', 'Standby', 25.4057, 68.2618, 'Main Campus Terminal', 'N/A', 0);

  // Insert Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, title, message, category, severity, is_read)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run('notif-01', 'Bus 03 is delayed by 5 minutes', 'Heavy traffic buildup near Jamshoro Bypass road works. Expected to reach Academic Block shortly.', 'alert', 'warning', 0);
  insertNotif.run('notif-02', 'Route 2 is temporarily closed', 'Diversion in place via Wadhu Wah road due to drainage maintenance work by municipal corporation.', 'alert', 'danger', 0);
  insertNotif.run('notif-03', 'New route added: Main Campus ➔ DMC', 'Transport Section has initiated an additional morning and afternoon point service for medical campus students.', 'update', 'success', 1);

  // Insert Initial Audit Log
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)
  `);
  insertAudit.run('System initialized with SQLite persistent database schema', 'System');
}

export function getAllBuses(db) {
  return db.prepare('SELECT * FROM buses ORDER BY number ASC').all();
}

export function createBus(db, busData, adminName = 'Admin') {
  const id = busData.id || `bus-${Date.now().toString().slice(-4)}`;
  const stmt = db.prepare(`
    INSERT INTO buses (
      id, number, plate, route_id, driver_id, driver_name, status,
      capacity, passengers, speed, eta, current_lat, current_lng,
      current_location_name, next_stop_name, is_online, last_update
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    id,
    busData.number,
    busData.plate,
    busData.route_id || busData.routeId || 'route-04',
    busData.driver_id || busData.driverId || 'drv-01',
    busData.driver_name || busData.driverName || 'Assigned Driver',
    busData.status || 'Arriving',
    Number(busData.capacity) || 65,
    Number(busData.passengers) || 0,
    busData.speed || '40 km/h',
    busData.eta || '5 min',
    Number(busData.current_lat || (busData.coords ? busData.coords[0] : 25.4057)),
    Number(busData.current_lng || (busData.coords ? busData.coords[1] : 68.2618)),
    busData.current_location_name || busData.currentLocationName || 'Main Campus Terminal',
    busData.next_stop_name || busData.nextStopName || 'Academic Block',
    busData.is_online !== undefined ? (busData.is_online ? 1 : 0) : 1
  );

  db.prepare(`INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)`).run(
    `Admin added new vehicle: ${busData.number} (${busData.plate})`,
    adminName
  );

  return db.prepare('SELECT * FROM buses WHERE id = ?').get(id);
}

export function updateBusById(db, id, busData, performedBy = 'System') {
  const current = db.prepare('SELECT * FROM buses WHERE id = ?').get(id);
  if (!current) return null;

  const updatedStatus = busData.status !== undefined ? busData.status : current.status;
  const updatedDriver = busData.driver_name !== undefined ? busData.driver_name : current.driver_name;
  const updatedRoute = busData.route_id !== undefined ? busData.route_id : current.route_id;
  const updatedOnline = busData.is_online !== undefined ? (busData.is_online ? 1 : 0) : current.is_online;

  db.prepare(`
    UPDATE buses 
    SET status = ?, driver_name = ?, route_id = ?, is_online = ?, last_update = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(updatedStatus, updatedDriver, updatedRoute, updatedOnline, id);

  db.prepare(`INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)`).run(
    `Modified bus details for ${id}: status=${updatedStatus}`,
    performedBy
  );

  return db.prepare('SELECT * FROM buses WHERE id = ?').get(id);
}

export function deleteBusById(db, id, adminName = 'Admin') {
  const bus = db.prepare('SELECT * FROM buses WHERE id = ?').get(id);
  if (!bus) return false;

  db.prepare('DELETE FROM buses WHERE id = ?').run(id);

  db.prepare(`INSERT INTO audit_logs (action, performed_by) VALUES (?, ?)`).run(
    `Admin decommissioned vehicle: ${bus.number} (${id})`,
    adminName
  );

  return true;
}

