# Umbrella — Climate Risk Command Center for Microfinance (UI Documentation)

## Executive Summary

The **Umbrella Climate Risk Command Center** is a professional, institutional-grade product interface tailored for Microfinance Institution (MFI) risk officers, operations management, and field credit coordinators.

Built on top of the verified Umbrella Python backend and Flood Hazard Model v1.0, the Command Center answers five fundamental operational questions within seconds of opening:
1. **Where is climate risk increasing?** — Real-time and retrospective geospatial heatmaps across the pilot district (Darbhanga, Bihar).
2. **Which borrower clusters are geographically exposed?** — Interactive Leaflet map with verified OSM district boundary polygons and 10 operational village nodes.
3. **How much portfolio value is exposed?** — Clear separation of capital volume (INR) and active Joint Liability Groups (JLGs) marked with explicit `SYNTHETIC` provenance.
4. **Why did Umbrella assign this risk level?** — Transparent 5-factor Hazard Explainability decomposition where component contributions strictly sum to the composite hazard score.
5. **What should the lender investigate or consider doing?** — Non-prescriptive decision-support advisories (repayment grace window, field assessment alerts, SMS templates) paired with formal human credit officer authorization workflows.

---

## 1. Visual Direction & Design System

The Command Center rejects "crypto dashboard" aesthetics, neon saturation, and consumer weather widgets in favor of an **institutional financial intelligence and geospatial monitoring design system**:
- **Palette**: Dark slate institutional theme (`#090d16` base, `#0f172a` surfaces, `#1e293b` elevated cards, `#334155` subtle borders).
- **Typography**: High legibility sans-serif paired with monospace numerals for financial amounts, geographic coordinates, and model scores.
- **Risk Colors**: Restrained, unambiguous semantic levels:
  - `LOW` (< 30): Emerald (`#10b981`)
  - `MODERATE` / `MEDIUM` (30 - 49): Amber (`#f59e0b`)
  - `HIGH` (50 - 69): Orange (`#f97316`)
  - `SEVERE` / `CRITICAL` (≥ 70): Rose / Red (`#ef4444`)
- **Performance Optimization**: Complies with modern web guidance (`interactions-in-complex-layouts`) utilizing `content-visibility: auto` and `contain-intrinsic-size` to isolate layout reflows during heavy data table and map interactions.

---

## 2. Page Hierarchy & Functional Specifications

### 2.1 `/dashboard` — Primary Command Center
The central operational screen for MFI risk management:
- **KPI Summary Cards**:
  - *Peak Physical Hazard*: Highest composite score among clusters, severity level, and forecast horizon.
  - *Active High-Risk Clusters*: Count of clusters exceeding the 50.0 hazard threshold.
  - *Portfolio Capital Exposed*: Total outstanding loan volume in INR across exposed zones (explicitly tagged `SYNTHETIC`).
  - *Clients Exposed*: Total active women borrowers across monitored JLG centers.
- **Geospatial Map & Layer Toggle**:
  - Interactive Leaflet map featuring official OpenStreetMap Darbhanga district boundary (`Relation: 1568263`).
  - 10 operational cluster markers with radius and color scaling.
  - Layer toggle: Switch between *Physical Climate Hazard* (pure environmental risk) and *Lender Priority Index* (hazard + capital weighting).
- **Cluster Ranking & Slide-Over Drawer**:
  - Quick cluster list sorted by priority or hazard.
  - Clicking any cluster opens `ClusterDetailDrawer` showing terrain hydrology, elevation, river distance, explainability decomposition, synthetic portfolio exposure, and decision-support guidance.
- **Operational Registry Table**:
  - Comprehensive 10-cluster table with sorting, hazard levels, portfolio values, borrowers, and review status.

---

### 2.2 `/live-risk` — Live Meteorological Monitor
Monitors short-range monsoon exposure using live weather feeds:
- **Data Provenance**: Prominent `LIVE FORECAST` badge (or `DEMO / MOCK WEATHER` if API fallback is active).
- **Ensemble Breakdown**: Displays accumulated precipitation (mm), peak daily burst (mm/day), and topsoil moisture from Open-Meteo High-Resolution Ensemble (ECMWF & DWD ICON).
- **Day-by-Day Forecast Breakdown**: 3, 5, or 7-day forecast cards for the selected cluster.
- **Hazard Explainability Integration**: Instant visual check of the 5 constituent factors summing to the live score.

---

### 2.3 `/historical-replay` — July 2020 North Bihar Flood Replay
Enables forensic retrospective simulation of the July 2020 disaster:
- **Retrospective Disclaimer**: Prominent `RETROSPECTIVE REANALYSIS (ERA5)` badge with mandatory disclaimer:
  > *"Retrospective Reanalysis Mode: Environmental drivers derived from ECMWF ERA5 and ERA5-Land. Strictly evaluated using anti-leakage time bounds: for snapshot date T, strictly zero meteorological data > T is accessible."*
- **Chronological Horizontal Timeline**:
  - Six standardized event milestones: $T-7$ (July 18), $T-5$ (July 20), $T-3$ (July 22), $T-1$ (July 24), $T_0$ Peak (July 25), $T+3$ (July 28).
  - Automated Play/Pause player (2.8s intervals) and step buttons.
  - Map and cluster statistics dynamically update at every snapshot date.
- **Observed Event Evidence Panel (`ObservedEvidencePanel`)**:
  - *Status*: Strictly displays `Evidence available — flood extent processing pending`.
  - *Central Water Commission (CWC) River Gauges*: Real crest levels for Hayaghat (50.82m vs 48.68m DL, +2.14m above danger), Jhanjharpur (52.45m vs 50.0m DL), and Kamtaul (51.7m vs 50.0m DL).
  - *Copernicus Sentinel-1 SAR Radar*: Acquisition passes (July 11, 17, 23, 29, 2020) over Relative Orbits 121 and 48 (IW GRD VV+VH).
  - *ISRO Bhuvan Maps*: Formal references to satellite inundation spatial layers.

---

### 2.4 `/portfolio` — Microfinance Exposure Registry
Deep analysis of institutional lending presence:
- **Mandatory Synthetic Banner**:
  > *"SYNTHETIC DEMO PORTFOLIO: All borrower counts, Joint Liability Groups (JLGs), and loan balances are deterministic synthetic demo values. Umbrella tracks institutional capital exposed to geographic hazards — it does NOT predict individual borrower credit default."*
- **Capital Distribution Across Hazard Tiers**:
  - Severe Tier (≥ 70): Highest intervention urgency.
  - High Tier (50 - 69): Pre-emptive field contact suggested.
  - Moderate Tier (30 - 49): Monitored drainage conditions.
  - Low Tier (< 30): Normal business operations.
- **Sortable Cluster Priority Table**:
  - Sort by Priority Index, Physical Hazard, or Outstanding Capital.
  - Demonstrates decoupling: two villages with identical physical hazard have identical hazard scores regardless of whether portfolio is ₹2 Lakh or ₹80 Lakh.

---

### 2.5 `/actions` — Decision Support Action Center
Institutional governance and credit officer authorization queue:
- **Human-in-the-Loop Architecture**:
  - System recommendations are non-prescriptive advisories.
  - Umbrella **never** alters core banking loan terms or automatically executes restructuring without formal credit officer authorization.
- **Workflow Statuses**: `PENDING_REVIEW`, `ACKNOWLEDGED`, `ACTIONED`, `DISMISSED`.
- **Action Modal (`ActionModal`)**:
  - Captures Reviewing Officer Name / ID.
  - Approved Grace Period Days (defaulting to system suggestion).
  - Freeform operational notes (e.g. dispatching field credit coordinator, inspecting embankment breach).
  - Generates immutable, auditable local decision records.

---

### 2.6 `/green-finance` — Climate Adaptation Catalog
Resilience products designed for smallholder farmers in floodplains:
- **Adaptation Products**:
  1. *Solar Micro-Irrigation Pump Set (1-2 HP)*: Displaces diesel pumps; PM-KUSUM subsidy integration.
  2. *Portable Solar Tunnel Agro-Dryer*: Prevents aflatoxin mold and crop spoilage during flash rains.
  3. *Elevated Hermetic Grain Silo*: Watertight storage protecting seed grains when courtyard waters rise.
  4. *Gravity-Fed Micro Drip Kit*: Water-efficient winter vegetable cropping on residual flood silt.
- **Mandatory Carbon Disclaimer**:
  > *"UNCERTIFIED OPERATIONAL ESTIMATE: Emissions avoided metrics represent activity-based proxy calculations (ESTIMATED_EMISSIONS_AVOIDED). They strictly do NOT constitute certified carbon credits, offsets, or guaranteed revenue."*
- **Interactive Calculator**: Simulates deployment volume and aggregate emissions avoided across borrower communities.

---

### 2.7 `/methodology` — Model Documentation & Attribution
Complete transparent mathematical and scientific documentation:
- **Fundamental Architectural Axiom**:
  $$\text{Physical Climate Hazard} \neq \text{Portfolio Exposure} \neq \text{Credit Default Prediction}$$
- **Flood Hazard Model v1.0 Formula**:
  $$\text{Hazard Score} = 0.35 \times \text{Accum} + 0.25 \times \text{Burst} + 0.15 \times \text{Soil} + 0.15 \times \text{Anomaly} + 0.10 \times \text{Terrain}$$
- **Portfolio Priority Formula**:
  $$\text{Priority Score} = 0.60 \times \text{Hazard Score} + 0.40 \times \text{Normalized Capital Exposure Score}$$
- **Open-Source Attribution Registry**:
  - *Open-Meteo*: CC-BY 4.0 API data, AGPL-3.0 server code.
  - *CGIAR Climate Data Hub / CHIRPS*: MIT License (Funk et al., 2015).
  - *Economics of Climate Adaptation (ECA) / CLIMADA*: GPL-3.0 conceptual inspiration; clean-room Python implementation.
  - *Copernicus Sentinel-1 SAR*: ESA Open Access Policy.
  - *Central Water Commission (CWC)*: Ministry of Jal Shakti, Government of India.

---

## 3. Persistent Layout Elements

1. **Left Sidebar (`Sidebar.tsx`)**:
   - Persistent brand identity, pilot district badge (`Darbhanga, Bihar · 10 Clusters`), full page navigation links with active state highlights, and institutional architecture footer.
2. **Top Header (`Navbar.tsx`)**:
   - Active pilot status, horizon selector pills (`3D`, `5D`, `7D`), live evaluation refresh button, and last updated timestamp.
3. **Global Status Dock (`GlobalStatusBar.tsx`)**:
   - Fixed bottom status line monitoring live API connectivity (`Connected :8000`), Open-Meteo weather status, CGIAR climatology normal, Sentinel-1 SAR registry, and synthetic portfolio mode.

---

## 4. How to Run & Verify

### Starting Backend & Frontend Concurrently

```bash
# Terminal 1: Start FastAPI Backend
cd c:\Users\user\Documents\UMBRELLA\src
python -m uvicorn umbrella.api:app --host 127.0.0.1 --port 8000

# Terminal 2: Start Next.js Frontend
cd c:\Users\user\Documents\UMBRELLA\frontend
npm run start -p 3000
# (or for development: npm run dev)
```

The Command Center is immediately accessible in any browser at:
`http://localhost:3000/dashboard`

### Automated Verification Suites

```bash
# 1. Run Complete Backend Pytest Suite (56 tests, 89% coverage)
python -m pytest

# 2. Run Frontend Build & Structure Verification
node frontend/scripts/test-frontend.mjs

# 3. Run E2E REST API Integration Test (All 11 endpoints verified)
node frontend/scripts/test-api-e2e.mjs
```
