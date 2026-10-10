# Software Requirements Specification (SRS)
## Project: MUET Point Tracker (Smart University Transit Management System)
**Institution:** Mehran University of Engineering & Technology, Jamshoro, Sindh, Pakistan  
**Department:** Computer Systems Engineering / Software Engineering  
**Version:** 2.0 (Production Verified)  
**Status:** Approved & Implemented  

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Mehran University of Engineering & Technology (MUET), Jamshoro operates an extensive fleet of university point buses transporting thousands of students and faculty members daily across Jamshoro, Hyderabad, Kotri, Hala, Tando Bago, and surrounding regions. 

Historically, this transit service operated without digital telemetry or scheduling visibility, causing:
1. **Prolonged Wait Times:** Students waiting up to 45 minutes at outdoor stops in extreme Sindh temperatures (exceeding 45°C in summer).
2. **Unpredictable Delays:** Traffic bottlenecks at Jamshoro Bypass, Indus Highway, and Wadhu Wah resulting in missed morning lectures without notice.
3. **Severe Overcrowding:** Lack of bus capacity visibility leading to dangerous overcrowding on certain points while parallel points ran with empty seats.
4. **Administrative Blindspots:** Transport Directorate lacking real-time GPS tracking, maintenance logs, or audit trails for driver accountability.

### 1.2 Project Objectives
1. **Real-Time Telemetry:** Provide sub-second GPS tracking and live animated map visualization of all university points via Leaflet/OpenStreetMap.
2. **Accurate Arrival Predictions:** Compute dynamic, traffic-aware ETAs for every stop along defined transit routes.
3. **Role-Based Architecture:** Deliver purpose-built dashboards for Students (live tracking, stop search, schedules), Drivers (trip start/end, delay reporting, stop progression), and Admins (fleet management, bus assignment, emergency broadcasts).
4. **Data Persistence & Integrity:** Store fleet, route, trip, and incident data permanently in an ACID-compliant local SQLite database with zero-loss refresh, backed by a production-ready Supabase PostgreSQL migration schema.
5. **Intelligent Multilingual Assistant:** Provide natural-language route guidance, crowd suggestions, and delay summaries in English, Urdu, and Sindhi.

---

## 2. Methodology & Lifecycle Model

### 2.1 Prototyping Model Justification
The **Evolutionary Prototyping Model** was chosen for this project because:
- Transit management requires early user feedback on map responsiveness, mobile usability, and driver input ergonomics.
- High-fidelity visual prototypes allowed university stakeholders (students, drivers, transport director) to validate coordinate accuracy and alert workflows before full deployment.
- Rapid iterations allowed fixing client-side edge cases (e.g. Leaflet undefined coordinates handling) and hardening data persistence without disrupting working features.

---

## 3. Functional Requirements (FR)

### Module 1: Authentication & Authorization
- **FR-1.1:** The system shall authenticate Students, Drivers, and Administrators using Roll Number/Email and password.
- **FR-1.2:** The system shall issue HMAC-SHA256 signed session tokens with 7-day validity.
- **FR-1.3:** Destructive fleet actions (Add, Update, Decommission buses, emergency alerts) shall be restricted strictly to authenticated Admins.
- **FR-1.4:** Passwords shall be hashed and permanently excluded from API response payloads.

### Module 2: Live Tracking & Fleet Map
- **FR-2.1:** The system shall render an interactive dark-mode map of Jamshoro and Hyderabad using Leaflet.
- **FR-2.2:** Active buses shall be displayed with custom animated markers, live speed, destination, and pulsing status rings.
- **FR-2.3:** The map shall render defined route polylines and major/minor stop pins with dynamic arrival tooltips.
- **FR-2.4:** A simulation engine shall support 1x, 2x, and 5x speeds for off-hours academic demonstration.

### Module 3: Driver Telemetry & Trip Management
- **FR-3.1:** Drivers shall be able to initiate a live trip, automatically updating the bus status to "On Route" and marking it online.
- **FR-3.2:** Drivers shall be able to advance through scheduled stops and update arrival ETAs with one click.
- **FR-3.3:** Drivers shall be able to report operational statuses: "On Route", "Delayed", "Standby", or "Breakdown".

### Module 4: Administrative Fleet Controls & Persistence
- **FR-4.1:** Admins shall be able to add new buses with bus number, license plate, route, driver, and capacity.
- **FR-4.2:** Bus additions, modifications, and deletions shall be saved permanently to the persistent SQLite database and survive page refreshes and server restarts.
- **FR-4.3:** Admins shall be able to broadcast emergency delay alerts across the entire student body.
- **FR-4.4:** Every administrative mutation shall be recorded in the `audit_logs` table with timestamp and actor name.
- **FR-4.5:** Admins shall be able to export fleet status reports to CSV.

### Module 5: Multilingual AI Transport Assistant
- **FR-5.1:** The assistant shall parse natural language transit inquiries in English, Urdu, and Sindhi.
- **FR-5.2:** The assistant shall recommend less crowded buses based on occupancy metrics.
- **FR-5.3:** The assistant shall summarize daily transit delays and punctuality rates.

---

## 4. Non-Functional Requirements (NFR)

- **NFR-1 (Performance):** Map rendering and coordinate updates shall execute at 60 FPS without layout shifts. API response times shall be < 50ms for SQLite read operations.
- **NFR-2 (Reliability & Fault Tolerance):** The frontend shall encapsulate views in a React Error Boundary, preventing silent crashes or black screens on network drops or invalid data.
- **NFR-3 (Responsiveness):** The application shall provide flawless user experience across 320px (mobile phones), 768px (tablets), and 1920px (desktop monitors).
- **NFR-4 (Security):** Insecure arbitrary DDL operations (`DROP TABLE`, `ALTER TABLE`) and credential snooping shall be strictly blocked at the backend API layer.
- **NFR-5 (Installability):** The application shall support Progressive Web App (PWA) standards with standalone manifest and offline asset caching.
