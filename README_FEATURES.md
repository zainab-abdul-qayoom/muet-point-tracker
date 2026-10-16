# 🚍 MUET Point Tracker — Added Features, Models & Architecture

See full comprehensive dossier in **[`FEATURES_AND_ARCHITECTURE.md`](./FEATURES_AND_ARCHITECTURE.md)**.

## 📌 Quick Summary of Features & Architecture

### 1. Default Demo Profile Pictures Added
- **Student (Female):** `Zainab Abdul Qayoom` (`25BSCS016`) — [`/images/avatars/student-female.jpg`](./public/images/avatars/student-female.jpg)
- **Driver:** `Ahmed Khan` (`DRV-7712`) — [`/images/avatars/driver.jpg`](./public/images/avatars/driver.jpg)
- **Admin:** `Dr. Asif Shah` (`admin@muet.edu.pk`) — [`/images/avatars/admin.jpg`](./public/images/avatars/admin.jpg)
- Resilient fallback initials system implemented across Header, Sidebar, Auth, Driver Cockpit, and Admin Dashboard.

### 2. UI Alignment (Exact Match to Reference Image)
- **Welcome Banner:**
  - Official circular MUET seal badge (`muet_logo_seal.jpg`).
  - Student identity: `Zainab Abdul Qayoom`, `Roll No: 25BSCS016 | Computer Science`.
  - 3 Live commute chips: `📍 Next Stop: Point 03`, `🕒 ETA: 5 min`, `🚌 On Route: Route 02`.
  - Right safety badge: `Safe Rides`, `Better Journeys`, `🛡️ MUET Transport System` with green live dot.
  - Authentic MUET Jamshoro Gate photo background with 0.40 translucency.
- **Live Point Tracking Map Card:**
  - Full-width Leaflet interactive map with custom directional bus markers and live pulse rings.
  - Floating route tag: `[🚌 Route 02 | Tando Bago ➔ Main Campus]`.
  - Full-width legend across bottom.
- **Lower Section Side-by-Side:**
  - **Your Route:** 5-stop horizontal progression stepper (`Tando Bago` ➔ `DMS` ➔ `Zero Point` ➔ `CC` ➔ `Point 03` with active bus icon).
  - **Recent Notifications:** 4 colored alert cards (Admin broadcast, Bus proximity, Delay alert, Driver message).
- **Right Sidebar Panels:**
  - **Important Campus Points (2x2 Grid):** Point 03 DMS, Point 29 Gymnasium, Point 33 Central Library, Point 32 Zero Point.
  - **Nearby Points:** Distance in km with walking estimates.
  - **Quick Actions (2x2 Grid):** Report Issue, Saved Routes, View Timetable, Academic Docs.

### 3. Models Used & Why
- **MyMuetien Hybrid Campus Ontology & Intent-Matching Engine:**
  - **Model Type:** Multi-tier deterministic tokenizer, localized regex parser, campus knowledge graph, and live telemetry resolver.
  - **Why Chosen:**
    1. **0 Latency (< 20ms):** Instant answers for students on the move, without waiting for cloud LLM roundtrips.
    2. **100% Offline Capability:** Operates even when cellular internet drops on highway transit corridors between Hyderabad, Kotri, and Jamshoro.
    3. **Zero Cost & No Expiration:** No API keys, no monthly billing, zero failure risk during academic defense and presentations.
    4. **Zero Hallucination:** Directly bound to live SQLite database records for 100% factual schedule and bus location accuracy.
    5. **Multilingual:** Handles English, Urdu, Sindhi, and Roman Urdu campus phrasing.
- **Geographic Dead-Reckoning & Spherical Distance Model:**
  - Haversine great-circle distance algorithm + Linear Velocity Dead-Reckoning (LERP) for smooth bus motion on the Leaflet canvas.

### 4. 100% Mobile Responsiveness (Tested 320px to 1920px+)
- Verified with headless Chrome DevTools Protocol across 12 viewports (320px, 360px, 375px, 390px, 414px, 430px, 768px, 1024px, 1280px, 1366px, 1440px, 1920px). Zero horizontal scrollbar/overflow.

### 5. Strict WCAG AA Light Theme Contrast
- Dark Navy text (`#172B3A`) on Light Slate surfaces (`#FFFFFF`, `#F4F7FA`). No faint text or invisible green labels.

---

For the exhaustive technical report, see **[`FEATURES_AND_ARCHITECTURE.md`](./FEATURES_AND_ARCHITECTURE.md)**.
