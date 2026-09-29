# Umbrella Product Truth Table (Evaluator & Judge Guide)

**Platform:** Umbrella — Climate-Adaptive Microfinance Platform  
**Target Repository:** `TeamArclight/Umbrella`  
**Purpose:** Clear and unambiguous statement of what Umbrella implements vs. what it strictly avoids.  
**Audience:** Judges, Technical Auditors, NBFC-MFI Risk Committees, Evaluators.  

---

## 1. Truth Matrix: Capability vs. Deliberate Boundary

| Platform Capability / Claim | Actual Implementation | What Umbrella Does NOT Claim |
| :--- | :--- | :--- |
| **Physical Climate Hazard** | Evaluates **physics-based environmental hazard** using Open-Meteo rainfall intensity, cumulative forecasts, antecedent precipitation index (API), and local topography (elevation). Model is versioned as `Flood Hazard Model v1.0`. | **Does NOT modify hazard based on financial exposure.** A village does not become more physically flood-prone because an MFI disbursed ₹80 lakh in loans there versus ₹2 lakh. |
| **Portfolio Exposure** | Evaluates **MFI balance sheet exposure** using synthetic Joint Liability Group (JLG) loan book metrics: total active loans, outstanding principal, cluster concentration, and borrower livelihood sensitivity. | **Does NOT claim to ingest real borrower PII.** All borrower names, JLG numbers, and loan IDs are synthetic demonstration models. |
| **Operational Priority** | Combines physical hazard and financial exposure into an operational triage score to help branch managers allocate field response resources. | **Does NOT claim to be a single "village risk" black box.** Hazard and Exposure remain independently accessible and auditable. |
| **Loan Underwriting & Decisions** | Enforces a strict **human-in-the-loop state machine**. All approvals, rejections, and condition modifications require an authenticated `HumanDecision` with officer ID, timestamp, and justification. | **Does NOT perform autonomous AI credit underwriting.** Umbrella will never autonomously approve or disburse a loan. |
| **Credit Scoring & Defaults** | Tracks climate resilience asset installation and repayment schedule scenarios. | **Does NOT claim to predict borrower credit defaults**, replace credit bureaus (CIBIL/Equifax), or compute automated default probability models. |
| **Field Verification & Inspection** | Performs automated integrity checks on field officer mobile submissions: GPS Haversine distance offset ($\le 1000\text{m}$), chronological timestamp validation, checklist completeness, magic-byte MIME type validation, and **SHA-256 duplicate image detection**. | **Does NOT claim to perform "AI Fraud Detection" or "Computer Vision Asset Recognition".** SHA-256 matches exact duplicate image files to prevent recycling demonstration photos across loans; it does not analyze image contents or run facial recognition. |
| **Carbon & Emissions Impact** | Calculates **unregistered, uncertified operational proxy estimates** based on activity data (liters of diesel displaced by solar pumps; kilograms of grain spoilage prevented by hermetic silos) aligned with UNFCCC AMS-I.A, AMS-I.E, and ICAR methodologies. | **Does NOT claim to issue, trade, or guarantee certified carbon credits.** Explicitly disclaims registration with Verra, Gold Standard, or CDM. Provides illustrative carbon pricing scenarios ($15–$25/tonne) purely as educational and planning simulations. |
| **Historical Replay** | Replays real meteorological and hydrological conditions during the **July 2020 Darbhanga flood disaster** using ERA5/ERA5-Land reanalysis, CHIRPS normals, and Copernicus Sentinel-1 SAR inundation extents. | **Does NOT claim live real-time radar ingestion.** Historical satellite radar data represents curated, verified observational evidence from July 2020. |
| **Demonstration Resilience** | Features **deterministic offline mock fallbacks** for all weather feeds, geography lookups, and historical replay endpoints. When offline, displays a clear amber badge/banner. | **Does NOT hide fallback state.** Never pretends mock data is live API data when upstream services fail. |

---

## 2. Institutional Decision Boundaries

```
[ Climate Hazard Alert ] (Physics / Open-Meteo)
         │
         ▼
[ Portfolio Exposure Audit ] (Synthetic MFI Loan Book)
         │
         ▼
[ Operational Priority Ranking ] (Resource Triage)
         │
         ▼
[ Adaptation Recommendation ] (Rule-Based Agronomic Catalog)
         │
         ▼
[ Green Finance Loan Structuring ] (Deterministic Reducing EMI Calculator)
         │
         ▼
┌──────────────────────────────────────────────┐
│  MANDATORY HUMAN CREDIT OFFICER REVIEW       │  ◄── NO AUTONOMOUS LOAN APPROVAL
│  Officer ID: OFF-001 | Reason Required       │
└──────────────────────────────────────────────┘
         │
         ▼
[ Loan Disbursement & Asset Deployment ]
         │
         ▼
[ Field Officer Inspection & Evidence Upload ]
         │
         ▼
[ Automated Integrity Checks ] (GPS + Time + SHA-256 Duplicate Check)
         │
         ▼
┌──────────────────────────────────────────────┐
│  SUPERVISORY HUMAN VERIFICATION DECISION     │  ◄── HUMAN OVERRIDE CAPABILITY
│  Field Supervisor Review & Confirmation      │
└──────────────────────────────────────────────┘
         │
         ▼
[ Dual-Track Impact Reporting ]
  ├─ Track 1: Operational Resilience (Borrowers protected, assets installed)
  └─ Track 2: Uncertified Proxy Emissions Avoided (UNFCCC AMS-I.A aligned)
```

---

## 3. Disclaimers for Evaluators

1. **Synthetic Portfolio:** Any resemblance of borrower names, loan balances, or group IDs to living persons or real MFI clients in Darbhanga is purely coincidental.
2. **Operational Tool:** Umbrella is engineered as decision-support infrastructure for risk committees, branch managers, and field credit officers—not as an automated consumer credit algorithm.
3. **Open Standards:** Built on open standards, open-access meteorological data (Copernicus, Open-Meteo, CHIRPS), and transparent Python calculations.
