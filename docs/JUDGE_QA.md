# Umbrella Judge & Evaluator Q&A Playbook (25 Defensible Answers)

**Platform:** Umbrella Climate-Adaptive Microfinance Platform  
**Target Repository:** `TeamArclight/Umbrella`  
**Purpose:** Direct, transparent, and technically rigorous answers to evaluation inquiries.  

---

## Category 1: Decoupling & Climate Hazard Modeling

### Q1: Why do you claim that Physical Climate Hazard does not depend on loan exposure? Isn't risk usually Hazard × Exposure × Vulnerability?
**Answer:** In the classical IPCC/UNDRR risk framework, total *disaster risk* incorporates exposure. However, in credit risk modeling, conflating physical hazard with loan balance creates a dangerous feedback loop: a village's probability of experiencing an extreme 150mm downpour does not increase simply because an MFI disbursed ₹50 lakh instead of ₹5 lakh there. By strictly decoupling physical hazard (0–100) from portfolio exposure, our hazard model remains physically objective. We combine them transparently in our *Operational Priority Index* (0.60 Hazard + 0.40 Normalized Capital Exposure) to guide human triage.

### Q2: Why did you choose a deterministic formula for Flood Hazard Model v1.0 instead of a deep learning or XGBoost model?
**Answer:** In microfinance risk management, black-box ML models are unexplainable and prone to severe overfitting on sparse rural weather stations. Our 5-parameter formula (35% accumulation, 25% peak burst, 15% soil saturation, 15% historical anomaly, 10% terrain susceptibility) is 100% deterministic, auditable, and physically explainable to credit committees, RBI auditors, and branch managers.

### Q3: What happens if Open-Meteo goes offline or throttles your API key during a live deployment?
**Answer:** Umbrella implements an automated failover protocol. Every adapter call catches network timeouts and HTTP errors, seamlessly falling back to cached or deterministic mock observations with an explicit `data_source_mode = "MOCK"` provenance flag. The UI displays an amber status badge, ensuring zero application crashes and full transparency.

### Q4: Why pilot in Darbhanga District, Bihar?
**Answer:** Darbhanga is one of India's most flood-vulnerable agrarian regions, situated at the confluence of the Bagmati, Kamala Balan, and Adhwara river systems. It has extensive microfinance operations (including Satin Creditcare), high smallholder paddy and makhana dependency, and official gauge ground truth from the Central Water Commission (CWC).

### Q5: How does your model account for localized topography in flat floodplain basins?
**Answer:** Floodplains are not completely flat; minor elevation depressions of 1–2 meters create permanent "saucers" (chaurs). We incorporate SRTM 30m digital elevation data, slope gradients, and river proximity into our 10% terrain susceptibility index, distinguishing well-drained uplands from natural retention basins like Kusheshwar Asthan.

---

## Category 2: Data Engineering & Anti-Leakage

### Q6: What is "anti-leakage" in your historical replay engine, and how do you guarantee it?
**Answer:** Anti-leakage guarantees that when replaying a historical flood at snapshot date $T_s$, all meteorological and hydrological data from $t > T_s$ are strictly excluded from the calculation. In `src/umbrella/engine/historical_replay.py`, weather slices are hard-filtered by `r["date"] <= snapshot_date.isoformat()`. A risk alert at $T-7$ is completely blind to peak downpours at $T_0$.

### Q7: Why does your historical replay cite CWC Benibad gauge levels when Hayaghat is the target cluster?
**Answer:** CWC monitors the Bagmati River across the Muzaffarpur-Darbhanga corridor. The Benibad gauge is located immediately upstream (Danger Level 48.68m, peak crest 50.82m in July 2020), while Hayaghat is the downstream railway crossing (Danger Level 45.72m, historical HFL 48.96m). Floodwaters surging past danger levels across this entire corridor submerged East Central Railway Bridge 16 at Hayaghat, halting rail traffic.

### Q8: What role does Copernicus Sentinel-1 SAR play if you are not processing raw radar imagery in real time?
**Answer:** Sentinel-1 C-band Synthetic Aperture Radar provides cloud-penetrating spatial evidence of floodwaters. Rather than running multi-gigabyte edge raster processing during a web demo, we maintain a curated metadata registry (`Sentinel1EvidenceRegistry`) documenting relative orbits (121 and 48), acquisition timestamps, and polarization modes, with status explicitly labeled `EVIDENCE_AVAILABLE_NOT_PROCESSED`.

### Q9: Where did you get the 30-year rainfall baselines?
**Answer:** We ingested monthly climatological normals from the CHIRPS v2.0 dataset (Climate Hazards Center, UCSB) and AgERA5 reanalysis, utilizing the analytical methodology established by the open-source CGIAR Climate Data Hub Toolkit.

---

## Category 3: Green Finance & Banking Regulations

### Q10: How does Umbrella comply with RBI's 2022 Microfinance Master Direction?
**Answer:** Umbrella strictly follows the *RBI (Regulatory Framework for Microfinance Loans) Directions, 2022*:
1. All microfinance loans are collateral-free for households with annual income $\le$ ₹3,00,000.
2. We enforce the mandatory 50% debt-service ratio (outflow cap).
3. Zero prepayment penalties are assessed on green adaptation loans.
4. Ticket sizes (₹10,000–₹80,000) and 5-member Joint Liability Groups (JLGs) are synthetic demonstration assumptions modeled on standard rural MFI operations.

### Q11: Does your platform automate loan approval or disbursement?
**Answer:** No. Umbrella strictly rejects autonomous AI lending. All early warning advisories, loan restructurings, and green loan approvals pass through mandatory human decision gates. A qualified loan officer or branch manager must inspect the recommendation, review borrower records, and provide an authenticated digital confirmation.

### Q12: How do your green finance interest rates compare to commercial microfinance rates?
**Answer:** Standard microfinance loans in India typically range from 20% to 26% p.a. Our indicative green finance products model benchmark rates of 12.0% to 14.0% p.a. by factoring in blended finance capital, state subsidies (e.g., PM-KUSUM), and donor first-loss default guarantees.

### Q13: What is the benefit to the MFI if interest rates are lower?
**Answer:** Climate adaptation reduces climate-driven portfolio default. By financing elevated silos or solar pumps, smallholder borrowers preserve their harvests and maintain cash flows during flood seasons, drastically reducing 90+ day portfolio-at-risk (PAR) and operational write-offs.

---

## Category 4: Carbon Impact & Methodology Realism

### Q14: Are your emissions avoided figures certified carbon credits?
**Answer:** Absolutely not. We state emphatically in our UI, documentation, and API schemas: **"Uncertified operational proxy only. Not certified carbon credits."** Generating compliance or voluntary credits (Verra/Gold Standard) requires formal Project Design Documents (PDD), continuous empirical monitoring, and third-party VVB auditing. Umbrella provides indicative operational proxies for internal ESG reporting and donor facility tracking.

### Q15: Why did you remove references to UNFCCC AMS-I.E for grain silos and solar dryers?
**Answer:** Because rigorous factual integrity matters. UNFCCC AMS-I.E specifically governs "Switch from non-renewable biomass for thermal applications by the user" (clean cookstoves), not agricultural storage. Silo emissions abatement is properly modeled using FAO/ICRISAT post-harvest food waste decay factors (1.15 kg CO2e/kg spoiled grain), and solar dryers use an indicative biomass spoilage proxy.

### Q16: How do you calculate solar irrigation pump emissions avoided?
**Answer:** We use an AMS-I.A methodology-informed proxy: replacing a 3–5 HP diesel pump consuming 650 liters of diesel per year with a zero-emission solar PV array. Applying the standard IPCC 2006 emission factor of 2.68 kg CO2e per liter yields:
$$\frac{650 \text{ L} \times 2.68 \text{ kg CO}_2\text{e/L}}{1000} = 1.742 \text{ tCO}_2\text{e/year}$$

### Q17: Do all resilience interventions generate emissions avoided?
**Answer:** No. Interventions like Raised Community Livestock Shelters and Farm Drainage Culverts/Bunds provide pure adaptation resilience without fossil fuel displacement. Umbrella labels these as `mitigation_supported: false` (`NOT_APPLICABLE`) and reports 0 emissions avoided. We refuse to fabricate synthetic carbon offsets for pure adaptation assets.

---

## Category 5: Field Operations & Verification

### Q18: How does Umbrella prevent "ghost assets" where loans are disbursed but equipment is never installed?
**Answer:** Our Field Officer Verification Protocol requires on-site mobile inspection. The officer captures GPS coordinates and installation photos. Umbrella's verification engine checks that the device location is within 100 meters of expected cadastral homestead coordinates, requires mandatory physical checklist confirmations, and computes SHA-256 photo hashes to prevent duplicate image submissions.

### Q19: What happens if a field officer submits a duplicate photo from an existing installation?
**Answer:** Umbrella computes a SHA-256 digest of the uploaded photo. The `VerificationEngine` checks this digest against a repository-wide hash index. If the hash has already been registered to another asset, the verification is automatically rejected with an `EVIDENCE_DUPLICATE_DETECTED` warning flag.

### Q20: Can field officers complete verifications without mobile data connectivity in remote villages?
**Answer:** Yes. The Field Officer interface is designed as an offline-first mobile web application. Officers can complete checklists and capture photos locally; records are held in browser storage and synchronized via `/api/v1/verifications` once connectivity is restored.

### Q21: Who signs off on the field verification?
**Answer:** The verification workflow requires a two-level human hierarchy: the field officer submits evidence from the village, and the branch manager or operations supervisor reviews the automated GPS/photo audit summary to execute final confirmation (`CONFIRMED`).

---

## Category 6: Architecture, Security & Production Readiness

### Q22: Is Umbrella an immutable blockchain or distributed ledger platform?
**Answer:** No. Umbrella does not use blockchain, cryptocurrency, or distributed ledgers. Our audit trail is an append-only application data store (`AuditTrailLogger`) backed by structured Pydantic models. SHA-256 is used strictly for cryptographic evidence checksums and duplicate prevention.

### Q23: Is Umbrella "production-ready"?
**Answer:** No, and we do not claim it is. Umbrella is a working, tested, demo-hardened hackathon MVP pilot. While it features 98 passing backend tests, 87% test coverage, zero TypeScript errors, and complete offline failover resilience, production banking deployment would require SOC2 certification, core banking system (Finacle/Mambu) connectors, and institutional penetration testing.

### Q24: What is the technology stack?
**Answer:** 
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, Uvicorn, Starlette TestClient, Pytest, Coverage.
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Leaflet GIS mapping, Lucide Icons.
- **Testing**: 98 automated backend tests (100% passing), 8 frontend verification suites.

### Q25: How does a new MFI onboard an additional flood-prone district?
**Answer:** Adding a new district requires two configuration steps:
1. Provide a GeoJSON boundary file and village centroid GeoJSON in `data/geography/{state}/{district}/`.
2. Configure 30-year monthly precipitation normals and elevation attributes in `src/umbrella/config/geography.py`. The hazard engine and flywheel immediately adapt to the new geography without code modifications.
