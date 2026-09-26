# Umbrella — Climate-Adaptive Microfinance Platform

> **Proactive Climate Risk Intelligence & Operational Command Center for Rural Microfinance in India**

Umbrella enables Microfinance Institutions (MFIs) like Satin Creditcare to forecast, quantify, and preemptively manage agricultural climate risks across rural borrower clusters while strictly maintaining the fundamental decoupling axiom:

$$\mathbf{Physical\ Climate\ Hazard \neq Portfolio\ Exposure \neq Credit\ Default\ Prediction}$$

---

## 1. Architecture Summary

Umbrella is built on the **Economics of Climate Adaptation (ECA)** framework, maintaining strict decoupling:
1. **Physical Environmental Hazard** is computed purely from atmospheric and hydrological drivers (Open-Meteo NWP forecasts, ERA5 reanalysis, and CHIRPS climatology normals). Physical flood hazard never increases simply because a lender has more loans in a village.
2. **Microfinance Portfolio Exposure** tracks institutional capital volume (INR), active borrowers, and Joint Liability Groups (JLGs) in a geography.
3. **Operational Priority Index** transparently combines hazard ($60\%$) and exposure ($40\%$) to guide lender attention and field operations.
4. **Human Decision Support** provides explainable, non-prescriptive guidance (suggested grace periods, SMS warnings, field inspection directives) requiring human authorization before implementation.

---

## 2. Main Features

- **Darbhanga District Pilot**: Primary case study in flood-prone North Bihar (Bagmati, Kamla-Balan, and Adhwara basins) with official OpenStreetMap boundary (`Relation: 1568263`) and 10 operational clusters.
- **Flood Hazard Model v1.0**: Deterministic composite scoring ($0-100$) combining Forecast Accumulation ($35\%$), Burst Intensity ($25\%$), Soil Saturation ($15\%$), Climatological Anomaly ($15\%$), and Terrain Susceptibility ($10\%$).
- **Retrospective Disaster Replay**: Forensic chronological replay ($T-7$ to $T+3$) of the severe July 2020 North Bihar Flood with strict anti-leakage time bounds.
- **Ground-Truth Observational Validation**: Correlates model hazard with Central Water Commission (CWC) river gauges (Hayaghat $+2.14\text{ m}$ above danger level) and Copernicus Sentinel-1 SAR acquisition passes (Relative Orbits 121 & 48).
- **Lender Command Center UI**: Next.js 14 dashboard featuring interactive Leaflet maps, 5-component hazard explainability progress bars, sortable portfolio tables, and human authorization modals.
- **Green Adaptation Catalog**: Smallholder climate resilience financing products (solar pumps, solar dryers, elevated hermetic silos, micro-drip kits) with proxy emissions calculations.

---

## 3. Tech Stack

- **Backend**: Python 3.10+, FastAPI, Pydantic v2, Starlette, Uvicorn, AnyIO, Pytest
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Leaflet, Lucide Icons
- **Data Integrations**: Open-Meteo High-Resolution Ensemble API, ECMWF ERA5 & ERA5-Land Reanalysis, CHIRPS v2.0 Climatology, Copernicus Sentinel-1 SAR Metadata, CWC River Telemetry

---

## 4. Repository Structure

```
UMBRELLA/
├── src/umbrella/                  # Python backend application
│   ├── adapters/                  # Weather, climate, and portfolio data providers
│   ├── config/                    # Geography and district configurations
│   ├── engine/                    # Hazard, exposure, impact, recommendation, replay engines
│   ├── schemas/                   # Pydantic domain schemas with strict separation
│   ├── validators/                # Sentinel-1 and observational validators
│   ├── api.py                     # FastAPI REST API with CORS middleware
│   └── pipeline.py                # Central orchestration pipeline
├── frontend/                      # Next.js 14 Command Center web interface
│   ├── app/                       # App Router pages (/dashboard, /live-risk, etc.)
│   ├── components/                # LeafletMap, HazardExplainability, Drawer, etc.
│   ├── lib/                       # Typed API client, domain types, formatting utils
│   └── scripts/                   # Automated frontend verification test scripts
├── data/                          # Geospatial and historical event data
│   ├── events/                    # July 2020 flood event registry
│   ├── geography/bihar/darbhanga/ # District boundary & operational clusters GeoJSON
│   └── weather/                   # ERA5 retrospective reanalysis cache
├── docs/                          # Comprehensive technical and methodology documentation
├── tests/                         # Pytest test suite (56 tests, 89% coverage)
├── .gitignore                     # Production exclusions (secrets, caches, build output)
├── .env.example                   # Environment configuration template
└── pyproject.toml                 # Python packaging and test configuration
```

---

## 5. Quickstart & How to Run

### Requirements
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node v24.15)

### Running the Backend REST Service
```bash
# Start FastAPI backend on port 8000
python -m uvicorn umbrella.api:app --host 127.0.0.1 --port 8000
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### Running the Frontend Command Center
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start Next.js production server on port 3000
npm run start
# (or for development: npm run dev)
```
Access the Command Center at: `http://localhost:3000/dashboard`

---

## 6. Testing & Automated Verification

```bash
# Run backend pytest suite (56 passing tests, 89% coverage)
python -m pytest

# Run frontend build and component structure verification
node frontend/scripts/test-frontend.mjs

# Run live E2E REST API integration test across all 11 endpoints
node frontend/scripts/test-api-e2e.mjs
```

---

## 7. Data Provenance & Disclaimers

### Data Provenance Taxonomy
Every data point in Umbrella is marked with explicit provenance:
- `LIVE`: Real-time weather forecasts fetched directly from Open-Meteo.
- `REANALYSIS`: Retrospective historical weather from ECMWF ERA5 / ERA5-Land.
- `OBSERVATION`: Satellite SAR metadata (Sentinel-1) or CWC river gauge records.
- `DERIVED`: Deterministic models (Flood Hazard Model v1.0, Priority Index).
- `LOCAL_DATASET`: Static climatological normal tables (CHIRPS 30-year normal).
- `SYNTHETIC`: Generated demonstration data (all borrower accounts and loan volumes).

### Mandatory Disclaimers
1. **Synthetic Portfolio Disclaimer**: All borrower names, counts, loan balances, and Joint Liability Groups (JLGs) are deterministic synthetic demo figures. They do **not** represent actual borrower records, proprietary MFI portfolios, or Satin Creditcare client data.
2. **Credit Default Disclaimer**: Umbrella evaluates capital exposed to geographic climate hazards. It does **not** predict individual borrower creditworthiness, credit scores, or probability of default.
3. **Historical Replay Disclaimer**: Retrospective replay mode uses ECMWF ERA5 reanalysis and adheres strictly to anti-leakage causality: for any historical snapshot date $T$, zero meteorological data $> T$ is accessible.
4. **Carbon Metrics Disclaimer**: Emissions avoided are activity-based operational proxies (`ESTIMATED_EMISSIONS_AVOIDED`) and do not constitute certified carbon credits or guaranteed revenue.
5. **Human Decision Support**: Umbrella provides non-prescriptive decision support. It never automatically modifies core banking contracts or restructures loans without human authorization.

---

## 8. Current Development Status

- **Status**: Production-ready Case Study & Institutional Command Center.
- **Backend**: Verified FastAPI REST service, 56 passing tests, 89% test coverage.
- **Frontend**: Next.js 14 App Router application with 8 static routes compiled, verified E2E connectivity, and interactive Leaflet geospatial visualization.
- **Pilot**: Darbhanga District, Bihar (10 operational clusters, July 2020 North Bihar Flood event).
