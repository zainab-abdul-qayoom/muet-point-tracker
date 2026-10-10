// Academic and Software Engineering Documentation Dataset
// Complete project artefacts for Software Engineering Submission at Mehran University

export const ACADEMIC_DOCS = {
  problemStatement: {
    title: "Problem Statement & Objectives",
    content: `Mehran University of Engineering & Technology (MUET), Jamshoro operates a large fleet of student transport buses ('Points') carrying over 6,000 students daily between Jamshoro, Hyderabad, Kotri, Hala, and adjoining towns. 

### Key Problems Faced:
1. **Unpredictable Bus Arrivals:** Students waste an average of 35-50 minutes daily waiting at roadside bus stops without knowing bus whereabouts.
2. **Safety Concerns:** Late buses or missed points force students (especially female students) to wait in unlit areas or seek private, expensive transport.
3. **Dispatch Inefficiencies:** The MUET transport office relies on phone calls to drivers, making fleet monitoring prone to human delays and routing ambiguities.
4. **Lack of Incident Communication:** Road blockades on Jamshoro Bypass or toll plaza traffic jams are not broadcasted in real time.

### Project Objectives:
- Provide real-time GPS tracking and live OpenStreetMap visualization for all MUET points.
- Compute dynamic, high-accuracy Estimated Time of Arrival (ETA) based on vehicle speed and road distance.
- Implement role-based portals for Students, Drivers, and Transport Administrators.
- Integrate an AI-powered conversational transport assistant supporting English, Urdu, and Sindhi queries.
- Build an offline-resilient, mobile-responsive Progressive Web Application architecture.`
  },

  feasibilityStudy: {
    title: "Feasibility Study",
    technical: "Utilizes lightweight Leaflet OSM maps, WebSocket/SSE for real-time telemetry, and HTML5 Geolocation API. Can run on driver smartphones without requiring expensive proprietary black-box hardware.",
    operational: "Intuitive user interface tailored for MUET students and drivers with large touch targets, multilingual AI support, and automated simulation mode for low-connectivity regions.",
    economic: "Zero commercial map license costs (OpenStreetMap). University saves thousands of liters of fuel annually by optimizing route schedules and reducing idle point waiting times.",
    schedule: "Developed using the Rapid Prototyping Model across 6 sprints: Requirements Elicitation, Architecture & UI Mockup, Core GPS Simulation Engine, Role Dashboards, AI Assistant Integration, and System Validation."
  },

  srsRequirements: {
    functional: [
      { id: "FR-01", name: "Authentication & Authorization", desc: "Support role-based login (Student, Driver, Admin) with roll number validation." },
      { id: "FR-02", name: "Live GPS Bus Tracking", desc: "Display real-time coordinates of all active buses on Leaflet OpenStreetMap with custom route overlays." },
      { id: "FR-03", name: "Dynamic ETA Computation", desc: "Calculate remaining arrival minutes for each designated stop along the bus trajectory." },
      { id: "FR-04", name: "Driver Telemetry Broadcasting", desc: "Allow drivers to start/end trips, share live GPS or simulated route progress, and report stop arrivals." },
      { id: "FR-05", name: "Administrative Fleet Management", desc: "Provide CRUD operations for buses, drivers, stops, routes, and broadcast emergency delay announcements." },
      { id: "FR-06", name: "Multilingual AI Assistant", desc: "Process natural-language queries regarding bus arrivals, schedules, and road alerts in English, Urdu, and Sindhi." },
      { id: "FR-07", name: "Stop QR Verification", desc: "Enable students to scan bus stop QR codes for instant arrival schedules." },
      { id: "FR-08", name: "Incident & Delay Reporting", desc: "Allow students and drivers to log congestion, breakdowns, and schedule discrepancies." }
    ],
    nonFunctional: [
      { id: "NFR-01", name: "Performance & Latency", desc: "Map marker updates must render within 500ms; ETA calculations must update in < 2 seconds." },
      { id: "NFR-02", name: "Availability & Reliability", desc: "99.8% system availability during university operational hours (06:30 to 18:30 PKT)." },
      { id: "NFR-03", name: "Responsive Usability", desc: "Full touch-friendly compatibility on Android, iOS, tablets, and desktop displays." },
      { id: "NFR-04", name: "Security & Privacy", desc: "Driver real-time locations encrypted in transit; administrative actions logged to immutable audit trail." }
    ]
  },

  prototypeModel: {
    title: "Prototype Model Selection & Justification",
    rationale: `The Rapid Evolutionary Prototyping model was selected for the MUET Point Tracker project due to the following software engineering justifications:
1. **Dynamic User Requirements:** Commuting students and transport drivers have specific operational ergonomics (e.g. single-tap actions for drivers while parked, quick ETA glances for students walking between classes).
2. **Early Feedback Loop:** Allowed early demonstration of the interactive Leaflet map to MUET Transport Section and student body representatives to validate route paths.
3. **Risk Reduction:** Tested mobile GPS signal attenuation along Indus Highway and Jamshoro Bypass early in development to implement dead-reckoning simulation fallbacks.
4. **Iterative Refinement:** Successfully progressed from wireframe sketches to the high-fidelity dark emerald UI matching official Mehran University branding.`
  },

  testCases: [
    { id: "TC-01", module: "Auth", title: "Valid Student Login with Roll No", input: "MUET-2023-CS-001 / password123", expected: "Authenticated, redirects to Student Dashboard", status: "PASSED" },
    { id: "TC-02", module: "Auth", title: "Invalid Password Rejection", input: "MUET-2023-CS-001 / wrongPass", expected: "Error alert shown, login prevented", status: "PASSED" },
    { id: "TC-03", module: "Map Tracking", title: "Leaflet Map Load & Centering", input: "Open Student Dashboard", expected: "Map centers on MUET Jamshoro [25.4057, 68.2618]", status: "PASSED" },
    { id: "TC-04", module: "Map Tracking", title: "Live Marker Telemetry Animation", input: "Live Simulation Active", expected: "Bus 03 marker moves smoothly along Route 02 path", status: "PASSED" },
    { id: "TC-05", module: "ETA Calculation", title: "Dynamic ETA Update", input: "Bus advances past stop", expected: "Academic Block ETA decrements from 4 min to 0 min", status: "PASSED" },
    { id: "TC-06", module: "Driver Portal", title: "Trip Start & Telemetry Broadcast", input: "Driver clicks 'Start Trip'", expected: "Trip status changes to Active; bus broadcasted as On Route", status: "PASSED" },
    { id: "TC-07", module: "Driver Portal", title: "Stop Arrival Check-off", input: "Driver clicks 'Mark Arrived at Stop'", expected: "Next stop automatically advances to next waypoint", status: "PASSED" },
    { id: "TC-08", module: "Admin Fleet", title: "Add New University Bus", input: "Bus 13, Plate GSA-9901, Route 04", expected: "Bus added to fleet list; Total Buses increments to 13", status: "PASSED" },
    { id: "TC-09", module: "Admin Broadcast", title: "Publish Emergency Delay Alert", input: "Route 02 bypass traffic alert", expected: "Alert banner and notification dispatched to students", status: "PASSED" },
    { id: "TC-10", module: "AI Assistant", title: "Natural Language Route Search", input: "'Which bus goes to Qasimabad?'", expected: "Bot identifies Bus 04 & Bus 10 with stops and timings", status: "PASSED" },
    { id: "TC-11", module: "AI Assistant", title: "Urdu / Sindhi Query Handling", input: "'Point kab pohnchegi?'", expected: "Bot responds in natural Urdu/Roman Urdu with Bus 03 ETA", status: "PASSED" },
    { id: "TC-12", module: "Offline Fallback", title: "Network Disconnection Handling", input: "Offline toggle triggered", expected: "Cached schedules displayed; user notified of offline state", status: "PASSED" },
    { id: "TC-13", module: "QR Scanner", title: "Stop Identification via QR", input: "Scan Stop ID 's-02' (Academic Block)", expected: "Modal opens showing all buses servicing Academic Block", status: "PASSED" },
    { id: "TC-14", module: "Export Engine", title: "Download Fleet Service Report", input: "Admin clicks 'Export CSV'", expected: "CSV file generated with trip logs and punctuality metrics", status: "PASSED" },
    { id: "TC-15", module: "Mobile UI", title: "Responsive Layout on Mobile View", input: "Switch to Mobile Simulator (390px)", expected: "Presents native app mockup with bottom navigation", status: "PASSED" }
  ],

  riskMatrix: [
    { risk: "Intermittent cellular coverage along Jamshoro-Hala N-5 Highway", probability: "High", impact: "Medium", mitigation: "Client-side dead-reckoning route interpolation and offline cache." },
    { risk: "Driver smartphone battery depletion during long shifts", probability: "Medium", impact: "High", mitigation: "Ultra low-power GPS polling interval (10-15s) with adaptive sensor gating." },
    { risk: "Unauthorized user impersonating bus driver", probability: "Low", impact: "Critical", mitigation: "Role-based JWT session tokens and driver license ID authentication." },
    { risk: "Road blockages and spontaneous highway protests", probability: "Medium", impact: "High", mitigation: "Driver incident reporting with instant one-tap student push broadcast." }
  ]
};
