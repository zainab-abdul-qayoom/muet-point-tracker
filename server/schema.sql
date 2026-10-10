-- ====================================================================
-- MUET POINT TRACKER — SQLite Database Schema & Reference Data
-- Mehran University of Engineering & Technology, Jamshoro
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. Users Table (Student, Driver, Admin)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  roll_no TEXT,
  role TEXT NOT NULL CHECK(role IN ('Student', 'Driver', 'Admin')),
  department TEXT,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bus Routes
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  origin TEXT,
  destination TEXT,
  distance TEXT,
  est_time TEXT,
  status TEXT DEFAULT 'Active',
  color TEXT,
  service_hours TEXT
);

-- 3. Route Stops
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

-- 4. Fleet Vehicles (Buses)
CREATE TABLE IF NOT EXISTS buses (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  plate TEXT NOT NULL,
  route_id TEXT,
  driver_id TEXT,
  driver_name TEXT,
  status TEXT DEFAULT 'Arriving',
  capacity INTEGER DEFAULT 65,
  passengers INTEGER DEFAULT 0,
  speed TEXT DEFAULT '38 km/h',
  eta TEXT DEFAULT '5 min',
  current_lat REAL,
  current_lng REAL,
  current_location_name TEXT,
  next_stop_name TEXT,
  is_online INTEGER DEFAULT 1,
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- 5. Active Driver Trips
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

-- 6. Announcements & Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT,
  severity TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Incident Reports
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  bus_id TEXT,
  driver_id TEXT,
  category TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Administrative Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  performed_by TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_roll ON users(LOWER(roll_no));
CREATE INDEX IF NOT EXISTS idx_stops_route ON stops(route_id);
CREATE INDEX IF NOT EXISTS idx_buses_route ON buses(route_id);
