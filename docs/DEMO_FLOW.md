# Umbrella End-to-End Flywheel Demo Flow

## 1. Overview & Narrative

This walkthrough guides reviewers, MFI risk executives, and examiners through Umbrella's complete closed-loop climate microfinance flywheel:

$$\text{Climate Hazard} \longrightarrow \text{Portfolio Exposure} \longrightarrow \text{Recommendation} \longrightarrow \text{Green Financing} \longrightarrow \text{Field Verification} \longrightarrow \text{Traceability} \longrightarrow \text{Impact Estimation}$$

Every stage grounds mathematical rigor, auditable human oversight, and absolute separation of physical risk from financial exposure.

---

## 2. Step-by-Step Guided Walkthrough

### Step 1: Real India Pilot & Decoupled Climate Risk
- **Navigate to**: `http://localhost:3000/dashboard` or `/live-risk`
- **What to Observe**:
  - Operational Command Center focused on **Darbhanga District, Bihar** across 10 operational clusters (Hayaghat, Kusheshwar Asthan, Biraul, Ghanshyampur, etc.).
  - **Decoupling Axiom in Action**: Notice how Physical Hazard (0–100) is derived purely from rainfall, soil moisture, elevation, and river proximity. Portfolio Exposure (Outstanding ₹) is displayed independently.
  - Click on **Hayaghat** on the interactive map:
    - View the 5-component Hazard Explainability breakdown (Forecast Accumulation 35%, Peak Burst 25%, Soil Saturation 15%, Historical Anomaly 15%, Terrain Susceptibility 10%).
    - Note the Operational Priority Index combining 60% Hazard and 40% Exposure.

### Step 2: Historical Flood Replay & Ground-Truth Validation
- **Navigate to**: `http://localhost:3000/historical-replay`
- **What to Observe**:
  - Replay the catastrophic **July 2020 North Bihar Flood Event** (`event-darbhanga-2020`).
  - Scrub across the multi-day progression timeline.
  - Review the ground-truth Sentinel-1 SAR Copernicus flood extent evidence cards and ERA5 retrospective validation.

### Step 3: Climate-Ground Adaptation Recommendations
- **Navigate to**: `http://localhost:3000/actions` or `/green-finance`
- **What to Observe**:
  - High flood hazard in Hayaghat triggers automated adaptation recommendations.
  - Select **Hayaghat Cluster** in the dropdown.
  - Notice the prioritized interventions:
    1. **Raised Hermetic Grain Silo** (Suitability 94/100, designed for flood storage preservation).
    2. **Portable Solar Grain Dryer** (Suitability 88/100, prevents post-flood mold spoilage).
    3. **Flood-Resilient Elevated Livestock Shelter** (Suitability 82/100, protects smallholder dairy/goats).
  - Inspect the transparent trigger rationale, exclusions, and technical specifications.

### Step 4: Green Finance Simulation & Application Submission
- **Navigate to**: `http://localhost:3000/green-finance`
- **What to Observe**:
  - Scroll to **Step 2: Indicative Loan Amortization Calculator**.
  - Select Product: **Micro-Adaptation Loan (`prod-micro-adaptation`)**.
  - Adjust the inputs:
    - Asset Capital Cost: ₹25,000
    - Borrower Down Payment: ₹2,500 (Net Financed: ₹22,500)
    - Loan Tenure: 18 Months
    - Annual Interest Rate: 18.0% p.a.
  - Observe instant deterministic recalculation:
    - Monthly Installment (EMI): ₹1,436 / month
    - Total Interest: ₹3,348
    - Upfront Processing Fee (2%): ₹450
    - Estimated Annual Operational Benefit: ₹7,800 / year
    - Simple Payback Period: ~2.9 years
  - Scroll to **Step 3: Submit New Application**:
    - Enter Borrower Name (e.g., "Devi Sharma"), Village ("Hayaghat"), and click **Submit Application**.
    - An application is generated with status `UNDER_REVIEW`.

### Step 5: Human Officer Credit Appraisal
- **On the same page (`/green-finance`)**:
  - Scroll down to **Step 4: Pending Loan Applications**.
  - Expand the application for review.
  - Note the non-negotiable warning: *Decision support only — Automated approval is strictly prohibited.*
  - Enter Officer ID (e.g., `OFFICER-PATNA-04`) and review notes (e.g., `Field inspection completed; borrower owns elevated platform; approved for JLG Cycle 3`).
  - Click **Approve Application**.
  - Application transitions to `APPROVED`. Click **Disburse & Create Asset** to transition to `DISBURSED` and spawn a tracked `ResilienceAsset`.

### Step 6: Mobile Field Officer Verification
- **Navigate to**: `http://localhost:3000/field-officer`
- **What to Observe**:
  - Responsive field audit layout designed for low-bandwidth mobile tablets.
  - Select the newly installed asset or an existing demo asset (`ASSET-DAR-001`).
  - Complete the dynamic physical inspection checklist (Plinth height $\ge 60$cm, Hermetic seal intact, Concrete base anchored).
  - Test the **Geofence Verification**:
    - Enter coordinates matching Hayaghat (`25.9620, 85.9080`): Result shows `PASS (<500m)`.
    - Enter distant coordinates (`26.5000, 86.2000`): Result automatically updates to `FLAG (>2000m)`.
  - Upload evidence photo:
    - Engine tests magic bytes (JPEG/PNG/WebP) and computes SHA-256 hash.
  - Enter Field Inspector ID and submit **Final Verification Decision** (`VERIFIED`).

### Step 7: Complete Asset Traceability View
- **Navigate to**: `http://localhost:3000/assets/asset-demo-001` (or click View Details on any asset)
- **What to Observe**:
  - Comprehensive chronological audit trail from hazard alert to post-installation impact:
    - Hazard Level $\rightarrow$ Adaptation Recommendation $\rightarrow$ Application $\rightarrow$ Human Decision $\rightarrow$ Disbursement $\rightarrow$ Physical Installation $\rightarrow$ Field Verification $\rightarrow$ Realized Impact.
  - Full cryptographic verification evidence and append-only audit trail logs.

### Step 8: Resilience Impact & Carbon Scenario Modeling
- **Navigate to**: `http://localhost:3000/impact`
- **What to Observe**:
  - **Dual-Track Impact Dashboard**:
    - Track 1 (Primary Adaptation): 42.5 metric tons of grain protected, ₹4.85 lakh losses prevented, 120 households made flood-resilient.
    - Track 2 (Activity-Based Emissions Avoided): 18.42 $\text{tCO}_2\text{e}$ calculated strictly via `UNFCCC AMS-I.A` and `FAO Post-Harvest (2021)`.
  - **Illustrative Carbon Scenario Sensitivity Slider**:
    - Drag the price slider from \$5 to \$50 / $\text{tCO}_2\text{e}$.
    - Observe dynamic illustrative blended finance value in USD and INR.
    - Note the bold institutional disclaimer: *Strictly uncertified operational proxy; not tradeable carbon credits.*
  - Review the embedded methodology documentation cards with transparent baseline equations.

---

## 3. Demo Reset Utility

To reset the database back to its pristine seed state at any time during a live presentation:
- Click the **Reset Demo State** button in the top navigation or execute:
```bash
curl -X POST http://localhost:8000/api/v1/demo/reset
```
