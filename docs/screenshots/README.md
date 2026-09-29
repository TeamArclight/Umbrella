# Umbrella UI Screenshot Register & Verification Gallery

This directory contains the canonical, unedited, full-fidelity UI screenshots of the **Umbrella Climate Risk Command Center for Microfinance**, captured from the working Next.js production build (`http://127.0.0.1:3000`) and connected FastAPI backend (`http://127.0.0.1:8000`).

All screenshots were generated automatically using headless Google Chrome via [`scripts/capture_screenshots.ps1`](../../scripts/capture_screenshots.ps1) with full compositor rendering and verified virtual-time asynchronous data hydration.

---

## 1. Screenshot Catalogue Matrix

| # | Filename | Resolution | Route / Query State | Screen Title | Demo Script Alignment |
|---|---|---|---|---|---|
| **01** | `01_command_center_dashboard.png` | 1440 × 900 | `/dashboard` | Multi-Cluster Risk Cockpit | Step 1: Command Center Overview |
| **02** | `02_live_flood_risk_radar.png` | 1440 × 900 | `/live-risk` | Live Flood Hazard Radar | Step 2: Flood Hazard Model & Physical Drivers |
| **03** | `03_historical_replay_t7.png` | 1440 × 900 | `/historical-replay?date=2020-07-18` | Historical Replay (T-7 Early Warning) | Step 3: Anti-Leakage Retrospective Replay (T-7) |
| **04** | `04_historical_replay_t0_peak.png` | 1440 × 900 | `/historical-replay?date=2020-07-25` | Historical Replay (T0 Peak Crest) | Step 3: Disaster Breach Peak Validation (T0) |
| **05** | `05_portfolio_exposure_scatter.png` | 1440 × 900 | `/portfolio` | Portfolio Exposure & Decoupled Scatter | Step 4: Physical Hazard ≠ Financial Exposure |
| **06** | `06_action_center_early_warning.png` | 1440 × 900 | `/actions` | Operational Early-Warning Action Center | Step 5: Early-Warning Operational Advisories |
| **07** | `07_resilience_catalog.png` | 1440 × 900 | `/green-finance` (Step 1) | Resilience Asset Catalog & Recommendations | Step 6: 6-Technology Resilience Catalog |
| **08** | `08_green_finance_calculator.png` | 1440 × 900 | `/green-finance` (Step 2) | Reducing-Balance Green Finance Calculator | Step 7: Indicative Loan Structuring |
| **09** | `09_human_decision_modal.png` | 1440 × 900 | `/actions?modal=true` | Human Decision-Support Authorization Modal | Step 8: Mandatory Human Credit Officer Review |
| **10** | `10_field_verification_checklist.png` | 1440 × 900 | `/field-officer` | Field Officer Verification & Evidence Capture | Step 9: Offline-Capable Field Verification |
| **11** | `11_dual_track_impact_dashboard.png` | 1440 × 900 | `/impact` | Dual-Track Impact & Avoided Loss Dashboard | Step 10: Dual-Track Impact Measurement |
| **12** | `12_asset_lifecycle_traceability.png` | 1440 × 900 | `/assets/AST-DAR-HAY-001` | Append-Only Asset Audit Trail & Cryptographic Log | Step 11: End-to-End Asset Traceability |
| **13** | `13_mobile_field_officer.png` | 390 × 844 | `/field-officer` (Mobile Viewport) | Mobile Field Officer Verification View | Field Operations Form Factor |
| **14** | `14_mobile_command_center.png` | 390 × 844 | `/dashboard` (Mobile Viewport) | Mobile Executive Command Center | Branch Manager / Field Form Factor |

---

## 2. Screenshot Visual Breakdown & Scientific Grounding

### `01_command_center_dashboard.png` (Desktop 1440 × 900)
- **Route:** `/dashboard`
- **Key Visual Elements:**
  - Executive KPI summary ribbon: Total Portfolio Outstanding (₹1.87 Cr across 10 pilot clusters in Darbhanga, Bihar), High/Critical Risk Concentration, Active Grace Periods, and Avoided Losses.
  - Interactive Leaflet Cluster Map: Styled OpenStreetMap basemap with color-coded cluster markers (Green, Yellow, Red) showing spatial distribution across Hayaghat, Gaura Bauram, Kusheshwar Asthan, and Singhwara.
  - Urgent Operational Actions Feed: Cluster-by-cluster status badges, immediate recommended grace extensions, and priority ranking.
  - Global Presentation Mode Bar at the top: Step 1 active indicator with navigation buttons.

### `02_live_flood_risk_radar.png` (Desktop 1440 × 900)
- **Route:** `/live-risk`
- **Key Visual Elements:**
  - Multi-Horizon Toggle: 3-Day, 5-Day, and 7-Day forecast horizons.
  - Data Provenance Badge: Clearly marked as `NWP FORECAST: Open-Meteo Weather Forecast API (ECMWF IFS & DWD ICON)`.
  - Flood Hazard Model v1.0 4-Component Decomposition Card:
    - 5-Day Cumulative Rainfall (mm) & ERA5-derived 95th Percentile Anomaly (40% weight).
    - CWC River Station Gauge Levels (Bagmati corridor: Hayaghat and Benibad) with distance attenuation (30% weight).
    - Catchment Runoff & Upstream Inundation Index (20% weight).
    - Topographic Elevation & Drainage Impedance (10% weight).
  - Cluster Hazard Ranking Table with interactive drill-down.

### `03_historical_replay_t7.png` (Desktop 1440 × 900)
- **Route:** `/historical-replay?date=2020-07-18`
- **Key Visual Elements:**
  - Strict Anti-Leakage Demonstration: Evaluates conditions at **July 18, 2020 (T-7)** with strictly zero knowledge of subsequent crest levels.
  - Data Provenance Badge: `REANALYSIS: ERA5 / ERA5-Land (ECMWF Copernicus CDS) & CHIRPS Climatology`.
  - Timeline Stepper: T-7 selected; hazard score reads ~42.3 (Moderate Elevated Risk) driven by persistent upstream catchment precipitation in Nepal foothills.
  - CWC Hayaghat Gauge status: Below Warning Level (43.85 m vs WL 44.72 m).
  - System Advisory: Proactive warning window identified 7 days prior to catastrophic crest.

### `04_historical_replay_t0_peak.png` (Desktop 1440 × 900)
- **Route:** `/historical-replay?date=2020-07-25`
- **Key Visual Elements:**
  - Peak Embankment Breach Phase: Evaluates conditions at **July 25, 2020 (T0)**.
  - Hazard Score: Surges to **89.5 / 100 (CRITICAL_FLOOD_HAZARD)**.
  - Central Water Commission Gauge Ground-Truth: CWC Station Hayaghat recorded 48.96 m (Historical Flood Level HFL), exceeding Danger Level (45.72 m) by +3.24 m.
  - Sentinel-1 SAR Satellite Confirmation: Dual-polarization GRD scene evidence (acquisition dates July 19 & July 31, 2020) confirming extensive standing water across 64.2% of agricultural land.
  - Decoupling Verification: High hazard confirmed purely by environmental physical drivers, completely independent of loan balances.

### `05_portfolio_exposure_scatter.png` (Desktop 1440 × 900)
- **Route:** `/portfolio`
- **Key Visual Elements:**
  - Decoupled Physical Hazard vs Portfolio Exposure: Highlighting the core architectural correction:
    $$\text{Physical Hazard} \neq \text{Portfolio Exposure} \neq \text{Credit Default}$$
  - Quadrant Scatter Plot:
    - *High Hazard / High Exposure:* Immediate priority for proactive grace and liquidity relief (e.g. Hayaghat, Gaura Bauram).
    - *High Hazard / Low Exposure:* High physical danger requiring borrower safety alerts, but modest balance sheet risk (e.g. Kusheshwar Asthan East).
    - *Low Hazard / High Exposure:* High financial balance, zero climate justification for blanket moratoriums.
    - *Low Hazard / Low Exposure:* Normal business operations.
  - Synthetic JLG Portfolio Profile: Group loan distribution, livelihood breakdowns (Paddy, Dairy, Fisheries, Rural Retail), and PAR30 indicators.

### `06_action_center_early_warning.png` (Desktop 1440 × 900)
- **Route:** `/actions`
- **Key Visual Elements:**
  - Multi-Cluster Action Cards: Clear division between System Operational Advisories (rule-based suggested grace periods: +7, +14, +21 days) and Human Management Status.
  - SMS Advisory Dispatch Templates: Pre-composed localized warning broadcasts for field credit officers and JLG group animators.
  - Filtering by Action State: ALL, PENDING REVIEW, ACKNOWLEDGED, ACTIONED.

### `07_resilience_catalog.png` (Desktop 1440 × 900)
- **Route:** `/green-finance` (Step 1 View)
- **Key Visual Elements:**
  - Catalog of 6 Verified Resilience Technologies:
    1. Raised Silo & Seed Bank (₹18,000)
    2. Solar Micro-Cold Storage Unit (₹85,000)
    3. Portable Solar Agri-Dryer (₹28,000)
    4. Solar High-Efficiency DC Irrigation Pump (₹65,000)
    5. Flood-Resilient Elevated Goat Shelter (₹34,000)
    6. Community Bio-Fertilizer Digester (₹22,000)
  - Rule-Based Recommendation Engine: Contextual fit ranking based on cluster topography, drainage, and primary livelihood.

### `08_green_finance_calculator.png` (Desktop 1440 × 900)
- **Route:** `/green-finance` (Step 2 View)
- **Key Visual Elements:**
  - Reducing-Balance Loan Amortization Engine:
    - Interactive sliders for Intervention Cost (₹10,000 - ₹150,000), Borrower Margin Contribution (₹0 - ₹30,000), Indicative Annual Rate (8.0% - 24.0% p.a.), and Tenure (6 - 36 months).
    - Equated Monthly Installment (EMI) Breakdown: Financed Principal, Monthly Repayment, Total Interest, and Total Payable.
    - Indicative Operational Payback Period: Calculated from avoided crop/spoilage loss vs capital investment.
  - Explicit RBI 2022 Regulatory Disclaimer: Synthetic demo terms, non-binding indicative modeling.

### `09_human_decision_modal.png` (Desktop 1440 × 900)
- **Route:** `/actions?modal=true`
- **Key Visual Elements:**
  - Modal Window: "Human Decision-Support Authorization".
  - Required Credit Officer Credentials: Senior Credit Officer Name, Staff Employee ID.
  - Decision Radios: `ACKNOWLEDGED`, `ACTIONED`, `DISMISSED`.
  - Overrideable Grace Period: Officer-approved grace days with mandatory documented justification text field.
  - Enforced Institutional Guardrail: System cannot autonomously disburse loans, extend grace, or modify loan contracts without human approval.

### `10_field_verification_checklist.png` (Desktop 1440 × 900)
- **Route:** `/field-officer`
- **Key Visual Elements:**
  - Field Inspection Task List: Showing pre-seeded assets in Hayaghat (`AST-DAR-HAY-001`, `AST-DAR-HAY-002`) and Gaura Bauram.
  - 4-Point Physical Verification Protocol:
    1. Physical Installation Confirmation (Elevated base >= 1.2 m above flood line).
    2. Operational Condition Rating (EXCELLENT, SATISFACTORY, COMPROMISED, DAMAGED).
    3. GPS Geotag Coordinate Verification (Haversine threshold <= 150 m of registered cluster coordinates).
    4. Evidence Photo Hash (SHA-256 integrity hash for image auditability).
  - Offline-first synchronization badge: Local browser queue status.

### `11_dual_track_impact_dashboard.png` (Desktop 1440 × 900)
- **Route:** `/impact`
- **Key Visual Elements:**
  - Dual-Track Impact Ledger:
    - **Track 1: Household Financial Resilience:** Avoided harvest spoilage (₹), continuity of milk yield (liters/day), repayment grace compliance (%), and portfolio recovery rate.
    - **Track 2: Indicative Environmental Proxies:** Transparent diesel substitution (0.482 tCO2e/yr for solar pumps based on 180 L diesel saved * 2.68 kg/L; 0.110 tCO2e/yr indicative drying spoilage proxy).
  - Explicit Disclaimer: Emission reductions are uncertified operational estimates; Umbrella makes no certified voluntary carbon credit claims.

### `12_asset_lifecycle_traceability.png` (Desktop 1440 × 900)
- **Route:** `/assets/AST-DAR-HAY-001`
- **Key Visual Elements:**
  - Full Asset Specification: Asset ID `AST-DAR-HAY-001`, Raised Flood-Resilient Seed Storage Silo, Beneficiary Geeta Devi (JLG-HAY-04), Village Hayaghat.
  - Append-Only Application Audit Log:
    - Step 1: Environmental Risk Trigger (Hazard 82.4, High Flood Risk).
    - Step 2: Indicative Loan Structuring (Principal ₹15,000, 12 months, 13.5% p.a.).
    - Step 3: Human Officer Authorization (Officer OFF-RISK-019, Rakesh Kumar).
    - Step 4: Physical Disbursement & Registration.
    - Step 5: Field Officer On-Site Geotagged Verification (Passed, Score 4.8/5.0).
  - Cryptographic Verification Block: SHA-256 inspection evidence digest confirming immutable application record integrity.

### `13_mobile_field_officer.png` (Mobile 390 × 844)
- **Route:** `/field-officer` (iPhone 14 / Mobile Viewport)
- **Key Visual Elements:**
  - Single-column, touch-optimized field inspection workflow designed for rural credit coordinators on low-bandwidth smartphones.
  - Prominent verification status cards, large touch targets for camera upload, GPS capture button, and condition rating selector.

### `14_mobile_command_center.png` (Mobile 390 × 844)
- **Route:** `/dashboard` (iPhone 14 / Mobile Viewport)
- **Key Visual Elements:**
  - Responsive mobile layout of executive metrics, cluster warning cards, and quick action buttons.
  - Proves the platform operates seamlessly across both enterprise desktop cockpits and field mobile devices.

---

## 3. Presentation & Demonstration Mapping

| Hackathon Demo Segment | Time Window | Primary Screen | Backup Screenshot |
|---|---|---|---|
| **1. Hook & The Climate-MFI Disconnect** | 0:00 – 0:30 | `/dashboard` | `01_command_center_dashboard.png` |
| **2. Physical Hazard Engine (Decoupling Axiom)** | 0:30 – 1:00 | `/live-risk` & `/portfolio` | `02_live_flood_risk_radar.png`, `05_portfolio_exposure_scatter.png` |
| **3. Ground-Truth Historical Replay (Darbhanga 2020)** | 1:00 – 1:30 | `/historical-replay` | `03_historical_replay_t7.png`, `04_historical_replay_t0_peak.png` |
| **4. Green Finance & Loan Structuring** | 1:30 – 2:00 | `/green-finance` | `07_resilience_catalog.png`, `08_green_finance_calculator.png` |
| **5. Human Governance & Field Verification** | 2:00 – 2:30 | `/actions` & `/field-officer` | `09_human_decision_modal.png`, `10_field_verification_checklist.png` |
| **6. Impact Ledger & Cryptographic Audit Trail** | 2:30 – 3:00 | `/impact` & `/assets/[id]` | `11_dual_track_impact_dashboard.png`, `12_asset_lifecycle_traceability.png` |

---
*Generated automatically by Umbrella Build & Verification Toolchain for Sankalp Hackathon Submission Candidate.*
