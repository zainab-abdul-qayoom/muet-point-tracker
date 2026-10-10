# System Architecture & UML Design Models
## MUET Point Tracker — Mehran University of Engineering & Technology

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Presentation Tier (React 18 + Tailwind)"]
        MobileApp["Mobile PWA View (320px - 768px)"]
        DesktopApp["Desktop Workspace (768px - 1920px)"]
        LeafletMap["Leaflet GIS Map Engine (CartoDB Tiles)"]
        AIAssistant["Multilingual AI Assistant (EN / UR / SD)"]
        ErrorBoundary["React Error Boundary & Safe Recovery"]
    end

    subgraph ServiceLayer ["Middleware & API Gateway (Vite Express Engine)"]
        AuthMiddleware["HMAC-SHA256 Token Auth & RBAC Guard"]
        Sanitizer["SQL Sanitizer & DDL Security Filter"]
        AuditLogger["System Action Audit Trail Engine"]
        RESTRouter["RESTful Endpoints (/api/buses, /api/routes, etc.)"]
    end

    subgraph PersistenceLayer ["Data Storage Tier"]
        SQLiteDB[("Primary: SQLite Engine (muet_tracker.sqlite)")]
        WALLog["Write-Ahead Logging (WAL) & Foreign Keys"]
        SupabasePostgres[("Migration Ready: Supabase PostgreSQL + RLS")]
    end

    MobileApp --> RESTRouter
    DesktopApp --> RESTRouter
    LeafletMap --> RESTRouter
    AIAssistant --> RESTRouter
    RESTRouter --> AuthMiddleware
    AuthMiddleware --> Sanitizer
    Sanitizer --> SQLiteDB
    SQLiteDB --> WALLog
    Sanitizer -.-> SupabasePostgres
    RESTRouter --> AuditLogger
    AuditLogger --> SQLiteDB
```

---

## 2. Use Case Diagram

```mermaid
flowchart LR
    Student(["Student"])
    Driver(["Driver"])
    Admin(["Transport Administrator"])

    subgraph MUET_Point_System ["MUET Point Tracker System Boundary"]
        UC1["View Live Bus Map & Coordinates"]
        UC2["Search Routes & Stop ETAs"]
        UC3["Consult AI Assistant (EN/UR/SD)"]
        UC4["Scan Stop QR Code & Report Issue"]
        UC5["Start & Complete Live Trip"]
        UC6["Update Telemetry & Delay Status"]
        UC7["Advance Bus to Next Stop"]
        UC8["Add / Modify / Decommission Buses"]
        UC9["Broadcast Emergency Delay Alerts"]
        UC10["Inspect Database & System Audit Logs"]
        UC11["Export Fleet CSV Reports"]
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4

    Driver --> UC5
    Driver --> UC6
    Driver --> UC7

    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC1
```

---

## 3. Sequence Diagram: Bus Registration & Persistence Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Transport Admin
    participant UI as Admin Dashboard (React)
    participant Auth as Auth & RBAC Middleware
    participant API as Server API Gateway
    participant DB as SQLite Engine (muet_tracker.sqlite)
    participant Map as Leaflet Live Map

    Admin->>UI: Fill "Add Bus" Form (Bus 15, GSA-8815, Route 02)
    UI->>UI: Validate Form Inputs & Check Client Role
    UI->>Auth: POST /api/buses with Bearer Token & Payload
    Auth->>Auth: Verify HMAC-SHA256 Token & Admin Role
    alt Token Invalid or Expired
        Auth-->>UI: 401 / 403 Forbidden
        UI->>API: Auto-Refresh Admin Token
    end
    Auth->>API: Forward Authenticated Request
    API->>DB: INSERT INTO buses (id, number, plate, route_id, ...)
    DB->>DB: Commit WAL Transaction
    API->>DB: INSERT INTO audit_logs ('Admin registered new vehicle...')
    DB-->>API: Row Created Confirmation
    API-->>UI: 201 Created { success: true, data: busObj }
    UI->>Map: Update React State & Plot Bus Marker
    Note over Admin,DB: Upon Browser Refresh / Restart
    Admin->>UI: Browser Refreshes (F5)
    UI->>API: GET /api/buses
    API->>DB: SELECT * FROM buses ORDER BY number ASC
    DB-->>API: Returns All Saved Buses (Including Bus 15)
    API-->>UI: 200 OK { data: [...] }
    UI->>Map: Render All Persisted Vehicles with Coordinates
```

---

## 4. Activity Diagram: Driver Trip Telemetry Execution

```mermaid
flowchart TD
    Start([Driver Logs In]) --> AssignCheck{Bus Assigned?}
    AssignCheck -- No --> Standby[Wait for Admin Assignment]
    AssignCheck -- Yes --> StartTrip[Driver Clicks 'Start Live Trip']
    
    StartTrip --> UpdateStatus[Update Bus Status to 'On Route' & is_online = 1]
    UpdateStatus --> GPSLoop[Begin Telemetry Simulation Along Route]
    
    GPSLoop --> ReachStop{Reached Next Stop?}
    ReachStop -- No --> CheckIncident{Incident or Delay?}
    CheckIncident -- Yes --> LogIncident[Report Delay / Breakdown to Admin]
    LogIncident --> GPSLoop
    CheckIncident -- No --> GPSLoop
    
    ReachStop -- Yes --> AdvanceStop[Advance Next Stop & Update Stop ETA]
    AdvanceStop --> EndCheck{Reached Route Terminal?}
    EndCheck -- No --> GPSLoop
    EndCheck -- Yes --> EndTrip[Driver Clicks 'Complete Trip']
    EndTrip --> StandbyMode[Set Status to 'Standby' & is_online = 0]
    StandbyMode --> Stop([Trip Archived in History])
```

---

## 5. Class Diagram

```mermaid
classDiagram
    class User {
        +String id
        +String name
        +String email
        +String rollNo
        +String role
        +String department
        +login(credentials)
        +logout()
    }

    class Bus {
        +String id
        +String number
        +String plate
        +String routeId
        +String driverName
        +String status
        +int capacity
        +int passengers
        +String speed
        +String eta
        +List~float~ coords
        +boolean isOnline
        +updateTelemetry(lat, lng, speed)
        +advanceStop()
    }

    class Route {
        +String id
        +String number
        +String name
        +String origin
        +String destination
        +String distance
        +String estTime
        +String color
        +List~Stop~ stops
        +List~List~float~~ pathCoordinates
    }

    class Stop {
        +String id
        +String name
        +int stopOrder
        +List~float~ coords
        +String eta
        +boolean isMajor
    }

    class Trip {
        +String id
        +String busId
        +String driverId
        +String routeId
        +DateTime startTime
        +DateTime endTime
        +String status
        +completeTrip()
    }

    class Notification {
        +String id
        +String title
        +String message
        +String severity
        +boolean isRead
        +DateTime createdAt
    }

    User <|-- Student
    User <|-- Driver
    User <|-- Admin
    Route "1" *-- "many" Stop : contains
    Bus "many" --> "1" Route : operates on
    Trip "many" --> "1" Bus : utilizes
    Trip "many" --> "1" Route : follows
```

---

## 6. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ TRIPS : drives
    ROUTES ||--|{ STOPS : contains
    ROUTES ||--o{ BUSES : assigned_to
    BUSES ||--o{ TRIPS : executes
    BUSES ||--o{ INCIDENTS : experiences
    USERS ||--o{ AUDIT_LOGS : performs

    USERS {
        string id PK
        string name
        string email UK
        string roll_no
        string role
        string department
        string password_hash
        datetime created_at
    }

    ROUTES {
        string id PK
        string number
        string name
        string origin
        string destination
        string distance
        string est_time
        string status
        string color
        string service_hours
    }

    STOPS {
        string id PK
        string route_id FK
        string name
        int stop_order
        float lat
        float lng
        string eta_text
        int is_major
    }

    BUSES {
        string id PK
        string number
        string plate
        string route_id FK
        string driver_id
        string driver_name
        string status
        int capacity
        int passengers
        string speed
        string eta
        float current_lat
        float current_lng
        string current_location_name
        string next_stop_name
        int is_online
        datetime last_update
    }

    TRIPS {
        string id PK
        string bus_id FK
        string driver_id FK
        string route_id FK
        datetime start_time
        datetime end_time
        string status
    }

    NOTIFICATIONS {
        string id PK
        string title
        string message
        string category
        string severity
        int is_read
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        string action
        string performed_by
        datetime timestamp
    }
```
