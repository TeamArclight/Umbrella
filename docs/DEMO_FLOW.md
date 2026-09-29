# Umbrella 3-Minute Live Demonstration Flow & Pitch Script

**Platform:** Umbrella — Climate-Adaptive Microfinance Platform  
**Target Repository:** `TeamArclight/Umbrella`  
**Pitch Duration:** 3 Minutes (180 Seconds)  
**Presenter Roles:** Lead Architect / Presenter  

---

## 1. 3-Minute Walkthrough Matrix

| Screen & URL | Action | What to Say (Verbatim / Core Idea) | What NOT to Claim | Expected Result | Fallback Protocol |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Minute 0:00 – 0:35**<br>**Command Center**<br>`/` | Land on Command Center. Point to Darbhanga, Bihar district map, 10 operational clusters, and the decoupling metric cards. | *"This is Umbrella — the climate risk command center for rural microfinance. In flood-prone districts like Darbhanga, Bihar, climate shocks devastate vulnerable Joint Liability Groups. Umbrella begins with an unbreakable scientific principle: Physical climate hazard does NOT change simply because an MFI has more loans in a village. We strictly separate physical hazard from financial portfolio exposure."* | **DO NOT claim:**<br>• We predict borrower credit defaults.<br>• We replace credit bureaus.<br>• We use real borrower names. | Interactive map renders 10 clusters with live hazard badges; Hayaghat highlighted with high operational priority. Global status bar shows API connected. | If backend is offline, status bar turns red; restart backend via terminal. In offline mode, map and clusters load from cached local GeoJSON seamlessly. |
| **Minute 0:35 – 1:05**<br>**Live Risk Monitor**<br>`/live-risk` | Switch forecast horizon from 3-day to 5-day to 7-day. Click on Hayaghat cluster to show 5-factor hazard explainability. | *"Umbrella ingests high-resolution ensemble weather forecasts directly from Open-Meteo. Our versioned Flood Hazard Model v1.0 evaluates rainfall burst, accumulated precipitation, antecedent soil moisture, and local elevation. Notice the green 'LIVE' badge. Instead of waiting for default after a flood, Umbrella detects exposure in advance to trigger proactive resilience."* | **DO NOT claim:**<br>• This is our proprietary satellite radar in space.<br>• AI generates these weather forecasts. | Dynamic recalculation of rainfall totals and hazard scores across 3, 5, and 7-day horizons. Detailed daily bar cards appear. | If internet is down or Open-Meteo rate-limits, amber alert banner appears: `DEMO / MOCK DATA ACTIVE`. Point to amber badge as proof of demo resilience. |
| **Minute 1:05 – 1:35**<br>**Historical Replay**<br>`/historical-replay` | Scrub the July 2020 flood replay slider to July 24, 2020. Show Copernicus Sentinel-1 SAR evidence and ERA5 reanalysis. | *"We backtested our model against the catastrophic July 2020 North Bihar flood. Here, ERA5 reanalysis and Copernicus Sentinel-1 radar ground-truth validate how Umbrella would have alerted branch managers 5 days before peak inundation breached the Bagmati river embankments at Hayaghat."* | **DO NOT claim:**<br>• We have live real-time Sentinel-1 streaming.<br>• We detect individual houses from space. | Inundation extent, river gauge levels (48.68m danger mark), and ERA5 precipitation charts update chronologically. | Replay data is fully local in `HistoricalEventReplayEngine`. Works 100% offline with zero dependencies. |
| **Minute 1:35 – 2:10**<br>**Green Finance & Human Authorization**<br>`/green-finance` | Select Hayaghat, show rule-based recommendations (Hermetic Silo, Solar Pump). Test reducing EMI calculator. Click 'Approve Application' as human officer. | *"Early warning is useless without proactive finance. Umbrella recommends pre-screened adaptation assets tailored to local livelihoods. Here, we calculate a transparent reducing-balance loan for a ₹25,000 elevated grain silo. Most importantly: Umbrella strictly rejects autonomous AI approvals. Every green loan requires explicit human credit officer authorization with timestamped audit notes."* | **DO NOT claim:**<br>• AI autonomously approved this loan.<br>• Blockchain smart contracts disburse funds. | Amortization schedule calculates EMI (₹1,436/mo). Application transitions from `UNDER_REVIEW` to `APPROVED` to `DISBURSED`, spawning a tracked `ResilienceAsset`. | If state machine transition is attempted illegally, deterministic HTTP 400 alert prevents invalid jump. |
| **Minute 2:10 – 2:40**<br>**Field Verification**<br>`/field-officer` | Open mobile field inspector UI. Enter matching GPS coordinates (PASS). Demonstrate SHA-256 duplicate image check. | *"How does the lender verify the asset was actually deployed? Our mobile field inspector interface validates physical installation. It checks mandatory checklists, verifies GPS geofencing within 1000m, and performs cryptographic SHA-256 hash checking to prevent recycling demonstration photos across multiple loan files."* | **DO NOT claim:**<br>• Computer vision AI scans the picture for fraud.<br>• Facial recognition verifies the borrower. | GPS distance displays <500m (PASS). Uploaded photo generates unique SHA-256 hash. Status transitions to `VERIFIED`. | If GPS is out of bounds (>1000m), system displays amber `FLAGGED` status and prompts human supervisor review. |
| **Minute 2:40 – 3:00**<br>**Dual-Track Impact & Carbon Scenario**<br>`/impact` | Navigate to Impact dashboard. Highlight Track 1 (Resilience) vs Track 2 (Uncertified Avoided Emissions). Adjust carbon scenario slider. | *"Finally, Umbrella closes the loop with dual-track impact reporting. Track 1 measures real adaptation: grain saved, livestock sheltered, and microfinance borrowers protected. Track 2 computes uncertified activity-based emissions avoided using UNFCCC AMS-I.A methodologies for displaced diesel pumping. We provide scenario valuation for blended finance without making fake carbon credit claims."* | **DO NOT claim:**<br>• These are certified tradable carbon credits.<br>• Verra or Gold Standard certified this project. | Portfolio summary renders verified assets, borrowers covered, and avoided $t\text{CO}_2\text{e}$. Slider dynamically updates illustrative INR/USD economic scenarios. | Pre-calculated aggregates load instantly from in-memory engine. |

---

## 2. Key Speaking Transitions (Memorize These)

1. **Opening Hook (0:00):**  
   *"When floods hit rural Bihar, microfinance borrowers lose their crops, their assets, and their livelihoods. Umbrella turns reactive recovery into proactive, climate-adaptive microfinance."*

2. **Decoupling Axiom (0:25):**  
   *"A village's physical flood hazard must not increase simply because an MFI disbursed ₹80 lakh in loans there versus ₹2 lakh. Hazard is physics; exposure is finance."*

3. **Human Governance (1:45):**  
   *"Umbrella does not replace human credit officers with a black-box AI. It empowers them with explainable climate intelligence and enforces mandatory human loan authorization."*

4. **Honest Carbon Accounting (2:45):**  
   *"We do not sell unverified carbon credits. We calculate defensible, activity-based proxy emissions according to published UNFCCC formulas to unlock legitimate blended finance."*

---

## 3. Emergency Presentation Fallbacks

* **Wi-Fi Down:** Do not panic. Refresh `/live-risk`. The system automatically displays the amber `MOCK` fallback badge and banner. State: *"Notice our resilient architecture: Umbrella automatically falls back to deterministic, pre-validated mock data without crashing."*
* **Browser Reload:** All pages are standard client-side Next.js routes. Hit CTRL+R anytime without losing application state (backend in-memory store persists across frontend reloads).
* **Resetting Data:** If you ran through a demo loan and want a clean slate before presenting to a judge, call `POST http://localhost:8000/api/v1/demo/reset` or restart `uvicorn`.
