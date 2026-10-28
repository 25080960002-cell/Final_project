# Master Implementation Plan: APLIKASI MAPAN v1
**System Name:** APLIKASI MAPAN (Manajemen & Analisis Prediksi Agri Nusantara)  
**Version:** 1.0.0  
**Target Environment:** Dockerized VPS (Linux/Ubuntu), PostgreSQL with PostGIS, Python (FastAPI/Django), Flutter/React Native (Mobile), React/Next.js (Web Dashboard).

---

## 1. Executive Summary & Product Scope

APLIKASI MAPAN is an integrated digital agriculture management and yield prediction platform designed for multi-tenant agricultural organizations (Koperasi, Gapoktan, and Agri-enterprises).

### 1.1 Key Value Propositions
* **Offline-First Field Logging:** Field workers and farmers can record operational activities without cellular connection.
* **Spatial Land Mapping:** Interactive polygon-based geometry drawing and accurate acreage computation via GeoJSON and PostGIS.
* **Automated Yield & Weather Prediction:** Background calculation engines combining internal crop math models with real-time weather API feeds.
* **Multi-Tenant Hierarchy:** Organization-level data isolation supporting Super Admins, Field Managers, and Farmers.

### 1.2 In-Scope for v1
1. **Mobile App (Offline-First):**
   * Auth via Phone Number + PIN/OTP with local session caching.
   * GeoJSON land boundary polygon mapping.
   * Offline daily operational logging (planting, fertilizing, pest control, harvesting) with SQLite queue sync.
   * Compressed photo upload via Cloud Storage pre-signed URLs.
2. **Web Dashboard (Manager / Admin):**
   * Auth via Email + Password.
   * Spatial GIS map view of all managed land plots.
   * Predictive yield dashboard and risk/weather warning monitors.
   * Organization, user, and crop cycle management.
3. **Core Engine & Backend:**
   * Python (FastAPI / Django) REST API with PostGIS spatial query engine.
   * Celery background workers for automated weather sync and prediction re-calculation.
   * Queue-based event log processor with idempotency key validation.
   * Firebase Cloud Messaging (FCM) push notification system.

### 1.3 Out-of-Scope for v1
* Direct IoT sensor integration (soil moisture, local weather stations).
* In-app e-commerce marketplace or commodity trading.
* Automated satellite image analysis (NDVI / remote sensing).

---

## 2. Technical Architecture & Tech Stack

```
+-----------------------------------------------------------------------+
|                             CLIENT TIER                               |
|  +---------------------------------+  +----------------------------+  |
|  | Mobile App (Flutter/RN)         |  | Web Dashboard (React/Next) |  |
|  | - Offline SQLite Queue          |  | - Spatial GIS Viewer       |  |
|  | - Local Polygon Drawing (Leaflet)|  | - Analytical Dashboard     |  |
|  +---------------------------------+  +----------------------------+  |
+-----------------------------------++----------------------------------+
                                    || (HTTPS / REST API)
+-----------------------------------vv----------------------------------+
|                            BACKEND TIER                               |
|  +-----------------------------------------------------------------+  |
|  | FastAPI / Django REST API                                       |  |
|  | - Multi-tenant Middleware & Auth Service                        |  |
|  | - Queue Replay & Idempotency Handler                            |  |
|  | - Pre-signed URL Generator (S3 / GCS)                           |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------++----------------------------------+
                                    ||
   +--------------------------------++--------------------------------+
   |                                                                  |
+--v-------------------------------+  +-------------------------------v--+
|          DATABASE TIER           |  |      BACKGROUND WORKERS       |
| PostgreSQL + PostGIS Extension   |  | Redis + Celery Worker         |
| - Spatial Polygon Storage        |  | - Cron Job Weather Aggregator |
| - Operational Logs & Yield Math  |  | - FCM Notification Queue      |
+----------------------------------+  +----------------------------------+
```

| Component | Technology / Service | Role / Purpose |
| :--- | :--- | :--- |
| **Mobile App** | Flutter / React Native | Cross-platform mobile client for farmers |
| **Web Dashboard** | React / Next.js | Admin and managerial web panel |
| **Backend API** | Python (FastAPI / Django) | Primary application server and business logic |
| **Spatial Database** | PostgreSQL + PostGIS | Relational DB with native GIS spatial query capabilities |
| **Task Queue** | Redis + Celery | Async background processing and scheduled cron jobs |
| **Media Storage** | Cloud Object Storage (S3/GCS/MinIO)| Compressed photo storage via Direct Pre-signed URLs |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Alert notifications for weather/harvest alerts |
| **Weather Data API** | OpenWeatherMap / BMKG Open API | Real-time weather forecasting source |

---

## 3. Data Model & Database Schema

### 3.1 ERD & Table Specifications

```sql
-- Enable Spatial GIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Tenants (Organizations/Koperasi)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'KOPERASI',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'FARMER')),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    pin_hash VARCHAR(255),
    fcm_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Lands Table (Spatial Polygon)
CREATE TABLE lands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    boundary_polygon GEOMETRY(Polygon, 4326) NOT NULL, -- WGS 84 spatial reference
    calculated_area_ha NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Planting Cycles Table
CREATE TABLE planting_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
    commodity_type VARCHAR(100) NOT NULL,
    planting_date DATE NOT NULL,
    estimated_harvest_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HARVESTED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Operational Logs Table (Idempotent & Sync-ready)
CREATE TABLE operational_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planting_cycle_id UUID NOT NULL REFERENCES planting_cycles(id) ON DELETE CASCADE,
    idempotency_key UUID UNIQUE NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('PLANTING', 'FERTILIZING', 'PEST_CONTROL', 'IRRIGATION', 'HARVEST')),
    cost NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Predictions Table
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planting_cycle_id UUID UNIQUE NOT NULL REFERENCES planting_cycles(id) ON DELETE CASCADE,
    forecast_yield_kg NUMERIC(12, 2) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    weather_snapshot JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Offline Synchronization Strategy

To guarantee seamless mobile operation in low-connectivity rural environments, the system utilizes a **Queue-Based Event Log Pattern**:

1. **Local Storage:** All actions taken on the mobile app are stored immediately in a local SQLite table acting as an outbound queue.
2. **Payload Generation:** Each queue entry contains a client-generated UUID `idempotency_key`, `client_timestamp`, and the payload data.
3. **Queue Replay Sync:**
   * When internet connectivity is detected, the app transmits batched event logs to `/api/v1/sync/replay`.
   * The backend validates each log's `idempotency_key`. If already processed, it gracefully acknowledges success without re-inserting.
4. **Photo Upload Workflow:**
   * Photos are compressed locally on the device (target max size: 300 KB).
   * App requests a signed pre-upload URL from backend `/api/v1/media/upload-url`.
   * App uploads the photo directly to S3/Cloud Storage, then attaches the public object URL to the event log payload.

---

## 5. Yield Prediction & Weather Calculation Logic

Yield forecasts are computed using a composite approach combining static agronomical formulas with dynamic environmental coefficients:

$$\text{Yield}_{\text{predicted}} = \text{Area (ha)} \times \text{BaseYield}_{\text{commodity}} \times C_{\text{weather}} \times C_{\text{operational}}$$

* **BaseYield:** Benchmark harvest yield per hectare for specific commodities (e.g., Rice: $5.5\text{ tons/ha}$, Corn: $6.0\text{ tons/ha}$).
* **$C_{\text{weather}}$ (Weather Index):** Computed by Celery workers scraping 7-day forecast APIs. Excessive rainfall or drought penalties adjust $C_{\text{weather}} \in [0.5, 1.1]$.
* **$C_{\text{operational}}$ (Compliance Factor):** Score calculated based on timely fertilizing and pest control logs recorded by the farmer.

---

## 6. Development Milestones & Roadmap

### **Phase 1: Foundation & API Scaffolding (Weeks 1–2)**
* Set up Dockerized PostgreSQL with PostGIS extension.
* Develop FastAPI/Django project structure with JWT authentication and multi-tenant authorization middleware.
* Create core database migrations (`tenants`, `users`, `lands`, `planting_cycles`, `operational_logs`).

### **Phase 2: Mobile App Core & Offline Sync Engine (Weeks 3–4)**
* Build Flutter/React Native shell with SQLite local database.
* Implement GIS polygon drawing interface for land boundary mapping.
* Build offline queue engine and background sync manager with idempotency support.

### **Phase 3: Web Dashboard & Spatial GIS Viewer (Weeks 5–6)**
* Implement React/Next.js manager dashboard.
* Build interactive map visualization displaying land polygons, active crop cycles, and statuses using Mapbox/Leaflet.
* Build CSV/Excel export features for organizational reporting.

### **Phase 4: Weather Sync Engine, Prediction & FCM Notifications (Weeks 7–8)**
* Configure Redis & Celery background task scheduler.
* Implement OpenWeather/BMKG API scraper and yield prediction algorithm.
* Integrate Firebase Cloud Messaging (FCM) to trigger risk notifications to farmer devices.

### **Phase 5: End-to-End Testing & Deployment (Weeks 9–10)**
* Perform field stress testing for offline sync reliability and memory profiling on budget smartphones.
* Deploy to Dockerized VPS host with SSL certificate, automated backup scripts, and Nginx reverse proxy.

---

## 7. Operational Risks & Mitigation Matrix

| Risk Factor | Potential Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Low-end Smartphone Performance** | Map rendering lags on budget mobile devices. | Simplify GeoJSON polygons using Douglas-Peucker algorithm before client-side rendering. |
| **Weather API Rate Limits / Cost** | Rate limits exceeded when fetching forecast data for hundreds of plots. | Aggregate weather queries per district/sub-district instead of individual land coordinates. |
| **Extended Offline State Conflicts** | Out-of-date states when client remains offline for weeks. | Enforce `client_timestamp` validation and apply server-side conflict resolution policies prioritizing structural lifecycle events. |
| **Large Photo Upload Bandwidth Usage** | High data usage and failed uploads on weak 2G/3G connections. | Mandatory client-side image compression ($< 300\text{ KB}$) and automatic retry on background worker reconnect. |

---

## 8. Definition of Done (v1 Release Checklist)
- [ ] Database spatial queries (`ST_Area`, `ST_Contains`) benchmarked under $50\text{ms}$.
- [ ] Mobile app functions completely without internet connection for zero-drop offline logging.
- [ ] Queue replay verified with $100\%$ duplicate rejection under network simulation stress.
- [ ] Production environment fully deployed via Docker Compose on secure cloud VPS infrastructure.