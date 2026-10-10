# Quality Assurance Test Plan & Verification Matrix
## MUET Point Tracker — Academic & Engineering Verification
**Test Execution Date:** October 2026  
**Environment:** Windows Node.js v24 / PowerShell / Vite 5 / SQLite Engine  
**Target URL:** `http://localhost:3001`  
**Test Result Summary:** **100% Passed (14 / 14 Suites)**

---

## 1. Test Strategy & Scope
Testing covered:
1. **Black Screen Recovery & Exception Resilience:** Verifying that missing coordinates or Leaflet runtime failures are caught by React Error Boundary and never result in an unhandled black screen.
2. **ACID Persistence Across Refreshes:** Verifying `POST /api/buses`, `PUT /api/buses/:id`, and `DELETE /api/buses/:id` directly against SQLite with persistence checks before and after page reload and server restart.
3. **Authentication & RBAC:** Enforcing token requirements on administrative mutations, role checks on `/api/buses` and `/api/users`, and blocking unauthorized student access.
4. **Geospatial & Map Rendering:** Leaflet polyline rendering, stop tooltips, vehicle markers, and dynamic ETA calculations.
5. **Multilingual AI Assistant:** English, Urdu, and Sindhi query interpretation and delay summarization.
6. **Responsive Layout:** Viewports 320px (Mobile), 768px (Tablet), and 1440px+ (Desktop).

---

## 2. Test Execution Matrix

| Test ID | Module | Scenario / Description | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-01** | Resilience | Initial page load with simulated missing stop coordinates | Error Boundary catches or sanitizes missing coords; UI renders cleanly without black screen | Page loads in 770ms; all route stops safely render without Leaflet crash | **PASSED** |
| **TC-02** | Resilience | Backend server turned off or network unreachable | Informative warning banner displayed with "Retry Connection" button; no blank screen | Orange sync banner shown with Retry button; app operable with cached snapshot | **PASSED** |
| **TC-03** | Auth | Student attempts to delete or decommission a bus | Backend returns HTTP 403 Forbidden with security error message | Server responds `403 Forbidden: Admin authorization required` | **PASSED** |
| **TC-04** | Auth | Login with valid credentials (`admin@muet.edu.pk` / `admin123`) | Server issues HMAC-SHA256 signed JWT session token | Token generated with 7-day expiration; audit log written | **PASSED** |
| **TC-05** | Persistence | Admin registers new bus via form submission | Bus inserted into SQLite `buses` table; returned with 201 Created | Bus stored in `muet_tracker.sqlite`; assigned unique ID | **PASSED** |
| **TC-06** | Persistence | Page refreshed (F5) immediately after adding bus | Bus appears in live fleet list fetched from `/api/buses` | Bus present in state and map markers upon full page reload | **PASSED** |
| **TC-07** | Persistence | Vite development server restarted completely | Bus still present in SQLite database table | Verified `SELECT * FROM buses WHERE number = 'Bus ...'` returns row | **PASSED** |
| **TC-08** | Security | Malicious injection: `DROP TABLE users;` via `/api/query` | Backend blocks destructive DDL statement with security policy error | Blocked with message: `Security policy violation: Destructive DDL commands are prohibited` | **PASSED** |
| **TC-09** | Security | Direct request to fetch `password_hash` column via API | Password hashes filtered out from response objects | Excluded from `/api/users` and schema inspection | **PASSED** |
| **TC-10** | Map & GIS | Real-time simulation along route coordinates | Bus progresses smoothly through route waypoints with animated markers | Bus coordinates interpolate along route polyline; ETAs decrement | **PASSED** |
| **TC-11** | Driver UI | Driver starts live trip on assigned route | Bus status updates to "On Route" and `is_online` updates to 1 | Telemetry broadcasted to student map; trip logged in history | **PASSED** |
| **TC-12** | AI Assistant | Student asks "Bus 03 kadhan aendi sindhi" | Assistant responds in Sindhi with Bus 03 location, ETA, and driver | Responds: `بس 03 ھن وقت Academic Block وٽ آھي...` | **PASSED** |
| **TC-13** | AI Assistant | Student asks for least crowded bus | Assistant recommends optimal point based on passenger load | Returns Bus 10 (30/60 seats) with low-rush recommendation | **PASSED** |
| **TC-14** | Responsive | Viewport set to 375px mobile width | Bottom navigation bar active; drawer toggle works; 0 horizontal overflow | Mobile layout active; no overlapping text or horizontal scrollbars | **PASSED** |

---

## 3. Automated Persistence Verification Script Output
```text
HTTP GET / -> Status: 200 (OK)
HTTP GET /api/buses -> count: 7 buses in database, success: true
HTTP GET /api/routes -> count: 5 routes, 31 stops synchronized with GPS coordinates
POST /api/auth/login -> 200 OK (token: HS256 HMAC signed, length: 292 bytes)
POST /api/buses (Bus 20, GSA-9920) -> 201 Created (bus-6203)
GET /api/buses (After Refresh Verification) -> Found in DB: true (plate: GSA-9920)
DELETE /api/buses/bus-6203 -> 200 OK (Cleaned up test record)
```

---

## 4. Conclusion
The MUET Point Tracker application satisfies all functional and non-functional requirements. The black-screen defect has been eradicated, data persistence is validated with zero loss, and server-side RBAC safeguards the system against unauthorized mutations.
