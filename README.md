# Umbrella — Climate-Adaptive Microfinance Platform

> **Proactive Climate Risk Intelligence, Green Adaptation Financing, and Verification Command Center for Rural Microfinance in India**

Umbrella enables Microfinance Institutions (MFIs) like Satin Creditcare to forecast, quantify, and preemptively manage agricultural climate risks across rural borrower clusters while strictly maintaining the fundamental decoupling axiom:

$$\mathbf{Physical\ Climate\ Hazard \neq Portfolio\ Exposure \neq Credit\ Default\ Prediction}$$

---

## 1. Architecture Summary & The Closed-Loop Flywheel

Umbrella operationalizes the **Economics of Climate Adaptation (ECA)** framework across a continuous closed-loop adaptation flywheel:

$$\text{Climate Hazard} \longrightarrow \text{Portfolio Exposure} \longrightarrow \text{Recommendation} \longrightarrow \text{Green Financing} \longrightarrow \text{Field Verification} \longrightarrow \text{Asset Traceability} \longrightarrow \text{Impact Estimation}$$

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              UMBRELLA COMPLETE ADAPTATION FLYWHEEL                                │
│                                                                                                   │
│   [Climate Risk Intelligence]         (Open-Meteo, ERA5 reanalysis, CHIRPS 30-year climatology)   │
│             │                                                                                     │
│             ▼                                                                                     │
│   [Portfolio Exposure Scoring]        (Deterministic Synthetic MFI portfolio capital & borrowers) │
│             │                                                                                     │
│             ▼                                                                                     │
│   [Adaptation Recommendation Engine]  (Rule-based suitability ranking for 6 resilience assets)    │
│             │                                                                                     │
│             ▼                                                                                     │
│   [Green Finance Simulator]           (Reducing-balance EMI, operational payback calculations)    │
│             │                                                                                     │
│             ▼                                                                                     │
│   [Human Credit Appraisal]           (MANDATORY human decision; automated lending prohibited)     │
│             │                                                                                     │
│             ▼                                                                                     │
│   [Disbursement & Asset Spawning]    (Creates tracked ResilienceAsset record)                     │
│             │                                                                                     │
│             ▼                                                                                     │
│   [Field Verification Subsystem]     (Magic bytes, SHA-256 duplicate check, Haversine geofence)   │
│             │                                                                                     │
│             ▼                                                                                     │
│   [Dual-Track Impact Engine]         (1. Physical Loss Averted | 2. Activity Emissions Avoided)   │
│             │                                                                                     │
│             ▼                                                                                     │
│   [Append-Only Audit Trail]          (Complete cryptographic lifecycle provenance)                │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Physical Environmental Hazard** is computed purely from atmospheric and hydrological drivers. Physical flood hazard never increases simply because a lender has more loans in a village.
2. **Microfinance Portfolio Exposure** tracks institutional capital volume (INR), active borrowers, and Joint Liability Groups (JLGs) in a geography.
3. **Operational Priority Index** transparently combines hazard ($60\%$) and exposure ($40\%$) to guide lender attention and field operations.
4. **Decision Support, NOT Automated Lending**: Automated risk checks advise; certified human credit and operations officers decide. Umbrella never autonomously approves, rejects, restructures, or disburses loans.

---

## 2. Main Features

- **Darbhanga District Pilot**: Primary case study in flood-prone North Bihar (Bagmati, Kamla-Balan, and Adhwara basins) with official OpenStreetMap boundary (`Relation: 1568263`) and 10 operational clusters.
- **Flood Hazard Model v1.0**: Deterministic composite scoring ($0-100$) combining Forecast Accumulation ($35\%$), Burst Intensity ($25\%$), Soil Saturation ($15\%$), Climatological Anomaly ($15\%$), and Terrain Susceptibility ($10\%$).
- **Retrospective Disaster Replay**: Forensic chronological replay ($T-7$ to $T+3$) of the severe July 2020 North Bihar Flood with strict anti-leakage time bounds.
- **Ground-Truth Observational Validation**: Correlates model hazard with Central Water Commission (CWC) river gauges (Hayaghat $+2.14\text{ m}$ above danger level) and Copernicus Sentinel-1 SAR acquisition passes (Relative Orbits 121 & 48).
- **Lender Command Center UI**: Next.js 14 dashboard featuring interactive Leaflet maps, 5-component hazard explainability progress bars, sortable portfolio tables, and human authorization modals.
- **Green Adaptation Loan Simulator**: Reducing-balance amortization calculator ($EMI = P \frac{r(1+r)^n}{(1+r)^n - 1}$) with cost breakdowns, operating savings, and simple payback metrics.
- **Tamper-Resistant Field Verification**: Mobile-friendly inspection portal validating JPEG/PNG/WebP magic bytes, max 5MB cap, SHA-256 duplicate image detection across all assets, Haversine geofence deviation ($\le 500\text{ m}$ PASS, $500-2000\text{ m}$ REVIEW, $> 2000\text{ m}$ FLAG), and physical checklists.
- **End-to-End Asset Traceability**: Full chronological audit trail (`/assets/[id]`) connecting climate trigger $\rightarrow$ loan application $\rightarrow$ human approval $\rightarrow$ disbursement $\rightarrow$ installation $\rightarrow$ inspection sign-off $\rightarrow$ realized impact.
- **Dual-Track Climate Impact Engine**: Quantifies physical resilience (grain protected, flood loss averted, households safeguarded) alongside activity-based emissions avoided proxies via `UNFCCC AMS-I.A` and `FAO Post-Harvest (2021)`.
- **Illustrative Carbon Sensitivity Tool**: Interactive scenario simulator (\$5–\$50/tCO2e) with non-negotiable uncertified proxy disclaimers for blended finance and donor concession modeling.

---

## 3. Tech Stack

- **Backend**: Python 3.10+, FastAPI, Pydantic v2, Starlette, Uvicorn, AnyIO, Pytest
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Leaflet, Lucide Icons
- **Data Integrations**: Open-Meteo High-Resolution Ensemble API, ECMWF ERA5 & ERA5-Land Reanalysis, CHIRPS v2.0 Climatology, Copernicus Sentinel-1 SAR Metadata, CWC River Telemetry
- **Standards & Methodologies**: UNFCCC AMS-I.A, FAO Post-Harvest (2021), IPCC EFDB, CEA India CO2 Baseline Database v19

---

## 4. Repository Structure

```
UMBRELLA/
├── src/umbrella/                  # Python backend application
│   ├── adapters/                  # Weather, climate, and portfolio data providers
│   ├── config/                    # Geography and district configurations
│   ├── engine/                    # Hazard, exposure, impact, recommendation, financing, verification, FSM
│   │   ├── catalog.py             # Resilience interventions, green products, and methodologies
│   │   ├── adaptation_rec.py      # Rule-based adaptation recommendation engine
│   │   ├── financing.py           # Reducing-balance amortization & payback calculator
│   │   ├── state_machine.py       # Deterministic FSM lifecycle validator
│   │   ├── verification.py        # Magic bytes, SHA-256 duplicate check, Haversine geofence
│   │   ├── impact_engine.py       # Dual-track impact & carbon scenario engine
│   │   ├── audit.py               # Append-only audit trail logger
│   │   └── flywheel_store.py      # In-memory lifecycle persistence & demo seeder
│   ├── schemas/                   # Pydantic v2 domain schemas with strict decoupling
│   │   ├── hazard.py              # Pure physical hazard models
│   │   ├── portfolio.py           # Institutional portfolio exposure models
│   │   ├── impact.py              # Operational priority & MFI recommendations
│   │   ├── resilience.py          # Green finance, verification, and impact contracts
│   │   └── replay.py              # Forensic disaster replay models
│   ├── validators/                # Sentinel-1 and observational validators
│   ├── api.py                     # FastAPI REST API with CORS middleware
│   └── pipeline.py                # Central orchestration pipeline
├── frontend/                      # Next.js 14 Command Center web interface
│   ├── app/                       # App Router pages (/dashboard, /green-finance, /field-officer, /impact, etc.)
│   ├── components/                # Navbar, Sidebar, LeafletMap, HazardExplainability, Drawer, etc.
│   ├── lib/                       # Typed API client, domain types, formatting utils
│   └── scripts/                   # Automated frontend verification test scripts
├── data/                          # Geospatial and historical event data
│   ├── events/                    # July 2020 flood event registry
│   ├── geography/bihar/darbhanga/ # District boundary & operational clusters GeoJSON
│   └── weather/                   # ERA5 retrospective reanalysis cache
├── docs/                          # Comprehensive technical and methodology documentation
├── tests/                         # Pytest test suite (91 tests, 100% pass rate)
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
# Run backend pytest suite (91 passing tests, 100% pass rate)
python -m pytest tests -q

# Run frontend build and component structure verification (8/8 passing suites)
node frontend/scripts/test-frontend.mjs

# Run live E2E REST API integration test across all endpoints
node frontend/scripts/test-api-e2e.mjs
```

---

## 7. Data Provenance & Disclaimers

### Data Provenance Taxonomy
Every data point in Umbrella is marked with explicit provenance:
- `LIVE`: Real-time weather forecasts fetched directly from Open-Meteo.
- `REANALYSIS`: Retrospective historical weather from ECMWF ERA5 / ERA5-Land.
- `OBSERVATION`: Satellite SAR metadata (Sentinel-1) or CWC river gauge records.
- `DERIVED`: Deterministic models (Flood Hazard Model v1.0, Priority Index, Amortization).
- `LOCAL_DATASET`: Static climatological normal tables (CHIRPS 30-year normal).
- `SOURCED`: Peer-reviewed scientific and regulatory benchmarks (IPCC EFDB, CEA India Grid Baseline, ICAR post-harvest loss).
- `SYNTHETIC`: Generated demonstration data (all borrower accounts, loans, and demo assets).
- `DEMO_ASSUMPTION`: Explicit sensitivity parameters (e.g., $15/tCO2e illustrative carbon price, ₹83/$1 FX).

### Mandatory Disclaimers
1. **Decision Support, NOT Automated Lending**: Umbrella is strictly a decision-support and risk-intelligence platform. It **never** autonomously approves, rejects, restructures, or disburses loans. All credit decisions and verification sign-offs require human officer appraisal.
2. **Synthetic Portfolio Disclaimer**: All borrower names, counts, loan balances, and Joint Liability Groups (JLGs) are deterministic synthetic demo figures. They do **not** represent actual borrower records, proprietary MFI portfolios, or Satin Creditcare client data.
3. **Credit Default Disclaimer**: Umbrella evaluates capital exposed to geographic climate hazards. It does **not** predict individual borrower creditworthiness, credit scores, or probability of default.
4. **Historical Replay Disclaimer**: Retrospective replay mode uses ECMWF ERA5 reanalysis and adheres strictly to anti-leakage causality: for any historical snapshot date $T$, zero meteorological data $> T$ is accessible.
5. **Carbon Metrics & Non-Credit Disclaimer**: Avoided emissions are activity-based operational proxies (`ESTIMATED_EMISSIONS_AVOIDED`) derived from `UNFCCC AMS-I.A` and `FAO Post-Harvest (2021)`. They do **not** constitute certified carbon credits, voluntary carbon units (VCUs), or guaranteed revenue.

---

## 8. Documentation Index

- [Final Audit & Hardening Report](file:///docs/FINAL_AUDIT.md)
- [Product Truth Table (Evaluator Guide)](file:///docs/PRODUCT_TRUTH_TABLE.md)
- [Upstream Source & Data Register](file:///docs/SOURCE_REGISTER.md)
- [Demo Resilience & Offline Playbook](file:///docs/DEMO_RESILIENCE.md)
- [End-to-End Demo Flow & 3-Min Script](file:///docs/DEMO_FLOW.md)
- [System Architecture](file:///docs/ARCHITECTURE.md)
- [Green Finance & Amortization Engine](file:///docs/GREEN_FINANCE.md)
- [Physical Asset Verification Protocol](file:///docs/VERIFICATION.md)
- [Climate Impact & Emissions Avoidance Methodology](file:///docs/IMPACT_METHODOLOGY.md)
- [Lifecycle State Machine](file:///docs/STATE_MACHINE.md)
- [Data Provenance & Modality Register](file:///docs/DATA_PROVENANCE.md)
- [Flood Hazard Model v1.0](file:///docs/FLOOD_HAZARD_MODEL.md)
- [Pilot Selection (Darbhanga, Bihar)](file:///docs/PILOT_SELECTION.md)
- [Historical Replay & Ground-Truth Sentinel-1 Validation](file:///docs/HISTORICAL_REPLAY.md)

---

## 9. Current Development Status

- **Status**: Production-ready Closed-Loop Climate Adaptation Flywheel (Audited & Demo-Hardened).
- **Backend**: Verified FastAPI REST service with 98 passing tests (100% pass rate) across 14 test suites with 86% statement coverage.
- **Frontend**: Next.js 14 App Router application with 11 production routes compiled, zero TypeScript errors, mobile-friendly field officer interface, and interactive impact dashboards.
- **Resilience**: Full deterministic offline mock fallback support with transparent provenance badging and global status bar monitoring.
- **Pilot Geography**: Darbhanga District, Bihar (10 operational clusters, July 2020 North Bihar Flood event).
