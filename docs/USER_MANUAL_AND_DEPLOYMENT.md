# User Manual & Deployment Guide
## MUET Point Tracker — Mehran University of Engineering & Technology

---

## 1. Quick Start Guide (Local Environment)

### 1.1 Prerequisites
- **Node.js:** v18.0.0 or later (v24 LTS recommended)
- **Web Browser:** Google Chrome, Edge, Firefox, or Safari (Modern Evergreen)
- **Local Port:** `3001`

### 1.2 Starting the Application
From the `muet-point-tracker` directory:
```powershell
# Install dependencies (if not already installed)
npm install

# Start the full-stack development server on port 3001
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3001
```

---

## 2. User Manual by Role

### 2.1 Student User Guide
1. **Personalized Dashboard:**
   - View your assigned/favorite route (e.g. **Route 02: Main Campus ➔ Tando Bago**).
   - See the nearest bus arriving at your stop with countdown minutes (e.g. **Bus 03 ETA 4 min**).
   - Check seating comfort level (**Optimal**, **Comfortable**, or **Crowded**).
2. **Live Map & Bus Telemetry:**
   - Click **Live Map** in the sidebar or mobile bottom bar.
   - Click on any moving bus marker to inspect speed, driver name, phone number, and upcoming stops.
   - Click the "Center MUET" button to reorient the camera to the main campus roundabout.
3. **Multilingual AI Transport Assistant:**
   - Click the floating green **AI Assistant** button (sparkles icon) at the bottom right.
   - Ask questions naturally:
     - *English:* "When is Bus 03 coming to Academic Block?"
     - *Urdu:* "Bus 03 kab pohnchegi?"
     - *Sindhi:* "Bus 03 kadhan aendi sindhi"
     - *Crowd check:* "Suggest least crowded bus"
4. **Stop QR Codes & Delay Reports:**
   - Click **Report Delay** to notify transport administrators of traffic blockages or missed points.
   - Click **QR Scanner** at bus stops to verify stop identity and timetable.

### 2.2 Driver User Guide
1. **Role Switcher / Login:**
   - Click **Driver** in the top navigation role switcher (or log in as `DRV-7712` / `driver123`).
2. **Active Trip Controls:**
   - View your assigned vehicle (**Bus 03 - GSA-4412**) and route.
   - Click **Start Live Trip**: Broadcasts your live status to student dashboards as "On Route".
   - Click **Next Stop**: Dynamically advances your location to the upcoming stop and decrements student ETAs.
   - Click **Report Status**: Switch between "On Time", "Delayed (Traffic)", or "Breakdown".
   - Click **End Trip**: Concludes the route and returns vehicle to Standby.

### 2.3 Administrator User Guide
1. **Accessing the Admin Portal:**
   - Click **Admin** in the top navigation role switcher (or log in as `admin@muet.edu.pk` / `admin123`).
2. **Fleet Management (Add / Edit / Decommission Buses):**
   - Click **Fleet Overview** ➔ **Add New Bus**.
   - Enter the Bus Number (e.g. `Bus 15`), License Plate (e.g. `GSA-8815`), Route, Assigned Driver, and Seating Capacity.
   - Click **Register Vehicle**: The bus is permanently stored in the SQLite database and will remain visible across page reloads and server restarts.
   - Use the **Decommission (Trash)** button to retire a bus from the fleet.
3. **Emergency Broadcast Alerts:**
   - Click **Emergency Alert** in the top bar or Admin dashboard.
   - Enter alert title, severity (Warning, Critical, Update), and details (e.g. *Indus Highway Bypass Diversion*).
   - Click **Broadcast Alert**: Instantly displays an amber banner across all student devices.
4. **Audit Logs & Live Database Console:**
   - Go to **Academic Submission** ➔ **Database Console**.
   - Inspect live SQLite tables (`users`, `buses`, `routes`, `stops`, `audit_logs`).
   - Run custom SELECT and inspection queries safely.
5. **CSV Fleet Export:**
   - Click **Export Fleet Report (CSV)** on the Admin dashboard to download an Excel-ready report of all vehicles.

---

## 3. Database Management & Migration

### 3.1 SQLite Database Location & Safety
- **Primary Database File:** `muet_tracker.sqlite`
- **Safety Backup File:** `muet_tracker.sqlite.backup`
- The database is configured with **Write-Ahead Logging (WAL)** and **Foreign Key Enforcement** (`PRAGMA foreign_keys = ON`).

### 3.2 Migrating to Supabase PostgreSQL (Optional)
If you decide to deploy on Supabase cloud:
1. Log in to your Supabase project dashboard at `https://supabase.com`.
2. Open the **SQL Editor** tab.
3. Copy the contents of `server/supabase_schema.sql` and click **Run**.
4. Set the following environment variables in your `.env` file:
   ```env
   DB_ENGINE=supabase
   SUPABASE_URL=https://your-supabase-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Restart your server. The application will connect directly to your Supabase cloud PostgreSQL database with complete Row-Level Security enabled.
