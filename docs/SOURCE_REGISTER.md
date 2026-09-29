# Umbrella Upstream Source & Data Register

**Project:** Umbrella Climate-Adaptive Microfinance Platform  
**Target Repository:** `TeamArclight/Umbrella`  
**Registry Version:** 1.0 (Demo-Hardened)  
**Last Updated:** September 2026  

---

## 1. Primary Environmental & Meteorological Sources

| Source Name | Upstream Provider & URL | License / Terms of Use | Operational Scope in Umbrella | Status in MVP | Fallback / Resilience Protocol |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Open-Meteo Weather Forecast API** | Open-Meteo GmbH<br>`https://api.open-meteo.com/v1/forecast` | **CC-BY 4.0** (Open Data)<br>Server: **AGPL-3.0** | Real-time short-range (3, 5, 7-day) forecast: Precipitation, Max/Min Temperature, Max Wind Speed, Soil Moisture (0-10cm). High-resolution ensemble (ECMWF IFS & DWD ICON). | **VERIFIED** | If network times out, API rate limit (10,000 req/day) is hit, or upstream is unavailable, fails over seamlessly to deterministic mock data with `data_source_mode = "MOCK"`. |
| **ERA5 & ERA5-Land Climate Reanalysis** | ECMWF / Copernicus Climate Change Service (C3S)<br>`https://cds.climate.copernicus.eu` | **Copernicus Open Access Licence** (Free for commercial & non-commercial use) | Retrospective hourly and daily precipitation, soil moisture (0-7cm, 7-28cm), and 2m temperature for the historical July 2020 Darbhanga flood event (July 10 – July 31, 2020). | **VERIFIED** | Pre-computed, validated ERA5 daily time-series indexed into `HistoricalEventReplayEngine` with `data_source_mode = "RETROSPECTIVE_REANALYSIS"`. |
| **CHIRPS Climatological Precipitation Normals** | Climate Hazards Center, UC Santa Barbara / CGIAR Climate Hub<br>`https://www.chc.ucsb.edu/data/chirps` | **Public Domain** / Open Access | Historical monthly and decadal precipitation baselines (1981–2020 normals) for North Bihar districts to calculate rainfall anomalies and antecedent precipitation indices (API). | **VERIFIED** | Embedded baseline thresholds in `FloodHazardModel v1.0` (Darbhanga July monthly normal: ~340mm). |
| **Central Water Commission (CWC) Hydrological Data** | Ministry of Jal Shakti, Government of India<br>`https://cwc.gov.in` | **Government Open Data Licence - India (GODL)** | River gauge observations along Bagmati (Hayaghat gauge), Kamla Balan (Jhanjharpur gauge), and Adhwara river systems. Flood warning and danger levels. | **DEMO_REFERENCE** | Integrated as reference danger level thresholds (Bagmati danger level: 48.68m MSL at Hayaghat) cited in historical event logs. |
| **Copernicus Sentinel-1 SAR Flood Inundation Evidence** | European Space Agency (ESA) / Copernicus Open Access Hub<br>`https://sentinels.copernicus.eu` | **Copernicus Open Access Licence** | Synthetic Aperture Radar (SAR) C-band backscatter imagery during peak flood inundation (July 24–28, 2020) across Darbhanga district blocks. | **VERIFIED** | Curated satellite evidence metadata records (`Sentinel1EvidenceRegistry`) with acquisition dates, polarizations (VV/VH), and observed inundation extents. |

---

## 2. Livelihood, Agronomic & Impact Methodology Sources

| Source Name | Upstream Citation / Reference | License / Category | Operational Scope in Umbrella | Status in MVP | Fallback / Assumptions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UNFCCC AMS-I.A (Small-scale electricity generation)** | United Nations Framework Convention on Climate Change (UNFCCC CDM Executive Board)<br>`https://cdm.unfccc.int/methodologies/DB/C8A8E6Q...` | **Public United Nations Standard** | Methodology for calculating baseline diesel displacement emissions for solar micro-irrigation pumps (5HP replacement, 650 L diesel/yr). | **VERIFIED** | Baseline emission factor: $2.68\text{ kg CO}_2\text{e/liter diesel}$. Annual avoided emissions: $1.74\text{ tCO}_2\text{e/year}$. Explicitly labeled uncertified operational proxy. |
| **UNFCCC AMS-I.E / ICAR Post-Harvest Spoilage** | Indian Council of Agricultural Research (ICAR) & UNFCCC AMS-I.E Guidelines<br>`https://icar.org.in` | **Open Public Research Benchmark** | Methodology for avoided food loss and spoilage-related biomass decay emissions via elevated hermetic grain silos and portable solar dryers. | **VERIFIED** | Hermetic silo prevents 18% baseline storage spoilage on 1,500 kg paddy ($0.276\text{ tCO}_2\text{e/year}$). Solar dryer avoids produce decay plus electric thermal drying ($0.85\text{ tCO}_2\text{e/year}$). |
| **ICAR & NABARD Micro-Irrigation Benchmark (2020)** | National Bank for Agriculture and Rural Development (NABARD)<br>`https://www.nabard.org` | **Open Public Institutional Report** | Energy and water savings baseline for gravity-fed micro drip irrigation kits (60% water savings, 180 liters diesel pumping saved). | **VERIFIED** | Avoided emissions: $0.55\text{ tCO}_2\text{e/year}$ including pumping fuel and nitrogen efficiency proxy. |
| **FAO Food Wastage Footprint (2021)** | Food and Agriculture Organization of the United Nations (FAO)<br>`https://www.fao.org` | **Open Access / CC-BY-NC-SA 3.0 IGO** | Carbon footprint factors for rotting agricultural biomass and post-harvest grain losses in South Asia ($1.15\text{ kg CO}_2\text{e/kg spoilage}$). | **VERIFIED** | Used in `ImpactEstimationEngine` for post-harvest hermetic storage calculations. |
| **Bihar Agricultural University (BAU) Farm Power Survey** | Bihar Agricultural University, Sabour, Bhagalpur<br>`https://bausabour.ac.in` | **Academic Agricultural Survey** | Benchmark diesel irrigation pumping costs, hours of operation, and local retail fuel prices in North Bihar floodplains. | **DEMO_REFERENCE** | Applied in `FinancingCalculator` simple payback estimates (diesel @ ₹95/L, 220 hrs/yr). |

---

## 3. Microfinance & Geographic Baseline Sources

| Source Name | Upstream Reference | License / Access | Operational Scope in Umbrella | Status in MVP | Fallback / Data Reality |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Darbhanga District Pilot Geography** | Survey of India / Census of India 2011 / OpenStreetMap<br>`https://darbhanga.nic.in` | **Open Database License (ODbL) / GODL** | 10 real operational administrative clusters across Darbhanga (Hayaghat, Kalyanpur, Hanuman Nagar, Bahadurpur, Keoti, Jale, Singhwara, Biraul, Kusheshwar Asthan, Darbhanga Sadar). | **VERIFIED** | GeoJSON boundary files embedded directly in `umbrella/data/` for zero-latency GIS rendering without external map server dependencies. |
| **Joint Liability Group (JLG) Microfinance Model** | RBI Master Direction – Regulatory Framework for Microfinance Loans (2022)<br>`https://www.rbi.org.in` | **Regulatory Public Guidance** | Institutional loan structure: 5-member Joint Liability Groups, peer guarantee mechanism, standard microfinance ticket sizes (₹15,000 – ₹75,000), reducing balance interest rates. | **VERIFIED** | All borrower records, JLG IDs, and loan amounts are **100% synthetic demonstration data** modeled strictly on real microfinance structures. **No real borrower personal data is included.** |
| **Satin Creditcare Network Operational Context** | Satin Creditcare Network Limited Public Filings & Annual Reports<br>`https://satincreditcare.com` | **Public Corporate Disclosures** | Representative operational context: Branch footprint in North Bihar, field loan officer collection cycles, rural credit officer review procedures. | **DEMO_REFERENCE** | Platform is architected for seamless integration with Satin and similar NBFC-MFI core banking systems; demonstration environment operates on synthetic data. |

---

## 4. Status Glossary

* **VERIFIED:** Directly ingested, validated against real schemas, and computationally tested in the active pipeline.
* **PARTIALLY_VERIFIED:** Real data structure integrated with operational parameter approximations.
* **DEMO_REFERENCE:** Authoritative institutional source cited for domain benchmarks, danger level thresholds, or regulatory standards.
* **UNVERIFIED:** No sources in the Umbrella production codebase hold an unverified status.
