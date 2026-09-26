# OPEN SOURCE REUSE REGISTER

**Project:** Umbrella — Climate-Adaptive Microfinance Intelligence Platform  
**Document Version:** 1.0.0  
**Last Updated:** September 2026  
**Status:** Living Engineering Record  

This document serves as Umbrella's official compliance and architectural register for all external open-source software, datasets, algorithms, and specifications.

---

## 1. Classification Governance & Principles

Every third-party software artifact or dataset considered by Umbrella is strictly classified into one of four tiers:

| Tier | Definition | Inclusion Standard |
|:---|:---|:---|
| **INTEGRATED** | Code, libraries, or hosted APIs directly consumed and executed by the Umbrella application at runtime. | Code is wrapped behind an Umbrella-owned adapter interface. Attribution is enforced in code, UI, and documentation. |
| **ADAPTED** | Conceptual architectures, mathematical algorithms, or formulas reimplemented cleanly within Umbrella in native Python. | No external third-party copyleft code is copied into Umbrella. Formulations and references are cited with academic and open-source attribution. |
| **REFERENCED** | External repositories inspected solely for domain modeling, taxonomy, enterprise design patterns, or scientific benchmarks. | No runtime execution. Used for architectural requirements and specification design only. |
| **PLANNED** | High-value candidate libraries, external services, or datasets targeted for post-MVP releases. | Must have a predefined Umbrella interface/abstraction in the core architecture so integration requires zero refactoring of the risk engine. |

> [!IMPORTANT]
> **Strict Truth-in-Advertising Rule:** Never present a `REFERENCED` or `PLANNED` repository as an implemented runtime feature in product documentation, API responses, or hackathon presentations.

---

## 2. Updated MVP Data Pipeline Architecture

```
                       ┌────────────────────────────┐
                       │      Open-Meteo API        │
                       │ (3–7 Day Weather Forecast) │
                       │    (LIVE / MOCK Fallback)  │
                       └─────────────┬──────────────┘
                                     │
                                     ▼
                       ┌────────────────────────────┐
                       │  OpenMeteoWeatherProvider  │
                       │ (Umbrella Weather Adapter) │
                       └─────────────┬──────────────┘
                                     │
┌────────────────────────────┐       │
│ CGIAR Climatology Normal   │       │
│ (30-year baseline tables,  │       │
│ P95 thresholds, CHIRPS)    │       │
│    [LOCAL_DATASET]         │       │
└─────────────┬──────────────┘       │
              ▼                      │
┌────────────────────────────┐       │       ┌────────────────────────────┐
│    CGIARClimateProvider    │       │       │  Physical Terrain Profiles │
│  (Climatology Adapter)     │       │       │ (Drainage, Slope, Texture) │
└─────────────┬──────────────┘       │       └─────────────┬──────────────┘
              │                      │                     │
              └──────────────────────┼─────────────────────┘
                                     ▼
                      ┌────────────────────────────┐
                      │    Flood Hazard Engine     │
                      │ (Flood Hazard Model v1.0)  │
                      └──────────────┬─────────────┘
                                     │
                                     ▼
                      ┌────────────────────────────┐
                      │   FloodHazardEvaluation    │ ──────► [Early Warning Signal]
                      │  (Pure Physical 0–100)     │
                      └──────────────┬─────────────┘
                                     │
┌────────────────────────────┐       │
│ SyntheticPortfolioProvider │       │
│ (JLGs, Loans, Capital)     │       │
│        [SYNTHETIC]         │       │
└─────────────┬──────────────┘       │
              ▼                      │
┌────────────────────────────┐       │
│  PortfolioExposureEngine   │       │
│ (Capital Exposure in INR)  │       │
└─────────────┬──────────────┘       │
              │                      │
              ▼                      ▼
       ┌────────────────────────────────────┐
       │       PortfolioImpactEngine        │
       │     (PortfolioPriority-v1.0)       │
       │ Combines Hazard (60%) & Cap (40%)  │
       └─────────────────┬──────────────────┘
                         │
                         ▼
       ┌────────────────────────────────────┐
       │       PortfolioClimateImpact       │
       │   (Operational Risk Priority)      │
       └─────────────────┬──────────────────┘
                         │
                         ▼
       ┌────────────────────────────────────┐
       │        RecommendationEngine        │
       │   (Advisories for Human Review)    │
       └─────────────────┬──────────────────┘
                         │
                         ▼
       ┌────────────────────────────────────┐
       │     MFIRecommendationResponse      │
       │  System Advisory vs Human Decision │
       └────────────────────────────────────┘
```

---

## 3. Scientific Distinctions & Terminology Standard

To prevent misrepresentation and maintain scientific rigor, all team members, UI labels, APIs, and reports must adhere to the following definitions:

1. **Weather Forecast:** An atmospheric model prediction of meteorological conditions (precipitation, temperature, wind, soil moisture) over a short-term horizon (3, 5, or 7 days). *Not a flood guarantee.*
2. **Climate Indicator:** A statistical measure derived from historical meteorological observations (e.g., rainfall anomaly, historical 95th percentile precipitation, 30-year monthly mean).
3. **Hazard Risk (Short-Range Flood Exposure Risk):** A computed indicator of physical severity of inundation or waterlogging based strictly on meteorological and terrain signals. **Zero portfolio metrics enter this calculation.**
4. **Observed Hazard:** Verified empirical evidence that a disaster event has physically occurred (e.g., surface water extent extracted from Sentinel-1 SAR imagery).
5. **Credit Exposure:** The quantitative monetary balance of loan capital and number of borrowing households physically located in an area threatened by a hazard.
6. **Credit Default Prediction (NOT IN MVP):** A probabilistic statistical model predicting an individual borrower's contractual failure to repay a loan.
   > [!CAUTION]
   > **Prohibited Phrasing:** *"Umbrella predicts which borrowers will default."*  
   > **Approved Phrasing:** *"Umbrella identifies climate-exposed borrower groups, vulnerable loan capital, and proactive operational priority."*

---

## 4. Detailed Repository Classification

---

### Category A: INTEGRATED

Repositories, libraries, or hosted APIs directly consumed and executed by Umbrella over network sockets.

#### 1. Open-Meteo
- **Repository:** [`open-meteo/open-meteo`](https://github.com/open-meteo/open-meteo)
- **Primary Purpose:** Automated ingestion of point-based 3–7 day short-range weather forecasts for pilot village coordinates.
- **License:** Server source: GNU Affero General Public License v3.0 (AGPL-3.0); Hosted API: Free for non-commercial use with mandatory attribution under Creative Commons Attribution 4.0 International (CC-BY 4.0).
- **Umbrella Module:** `adapters.weather.open_meteo` (implements `WeatherProvider`)
- **Integration Status:** `INTEGRATED` (Hosted REST API)
- **Data Source Modes:** `LIVE` (when online), `MOCK` (when fallback is triggered with documented reason).
- **Files / Packages Used:**
  - Upstream: Hosted API endpoint (`https://api.open-meteo.com/v1/forecast`).
  - Umbrella Adapter: `OpenMeteoWeatherProvider` class in `src/umbrella/adapters/weather.py`.
- **Datasets Accessed:**
  - European Centre for Medium-Range Weather Forecasts (ECMWF) IFS & AIFS.
  - Deutscher Wetterdienst (DWD) ICON Global / ICON-EU.
  - National Oceanic and Atmospheric Administration (NOAA) GFS.
- **Units:**
  - Precipitation: Millimeters ($\text{mm}$)
  - Precipitation Probability: Percentage ($0 - 100\%$)
  - Temperature & Apparent Temperature: Degrees Celsius ($^\circ\text{C}$)
  - Wind Speed: Kilometers per hour ($\text{km/h}$)
  - Soil Moisture ($0 - 10\text{cm}$): Volumetric water content ($m^3/m^3$)
- **Spatial Resolution:** Seamless point interpolation from underlying NWP grids ($0.1^\circ \times 0.1^\circ$ to $0.25^\circ \times 0.25^\circ$, approx. $11\text{km} - 25\text{km}$).
- **Temporal Resolution:** Daily summaries over 3, 5, or 7-day rolling horizons.
- **Preprocessing Performed:**
  - Stripping raw Open-Meteo metadata and transforming into typed `UmbrellaWeatherForecast`.
  - Calculating cumulative forecast rainfall over requested horizon (3, 5, or 7 days).
  - Extracting peak single-day burst downpours.
- **Attribution Requirements:**
  - Must display: *"Weather data by Open-Meteo.com"* in web interfaces and export payloads.
- **Known Limitations:**
  - Rate limited to 10,000 daily API calls under free non-commercial tier.
  - Requires active internet connectivity; offline testing is supported via explicitly labelled `MOCK` fallback.

---

### Category B: ADAPTED & LOCAL DATASET

Conceptual architectures, mathematical algorithms, or pre-extracted empirical datasets packaged within Umbrella without runtime cloud API coupling.

#### 2. CGIAR Climate Data Toolkit
- **Repository:** [`CGIAR-Climate-Data-Hub/climate-toolkit`](https://github.com/CGIAR-Climate-Data-Hub/climate-toolkit)
- **Primary Purpose:** Historical climate baseline calculations, precipitation climatology percentiles (P95/P99), and anomaly detection.
- **License:** MIT License (Permissive)
- **Umbrella Module:** `adapters.climate.cgiar` (implements `ClimateDataProvider`, `HistoricalClimateProvider`)
- **Integration Status:** `ADAPTED` (Formulas & methodology) / `LOCAL_DATASET` (Pre-calibrated 30-year climatology baseline tables)
- **Truthful Implementation Audit:**
  > [!IMPORTANT]
  > Umbrella does **NOT** maintain a live Google Earth Engine authenticated session at runtime. Live GEE authentication would require cloud service account keys and introduce operational fragility during hackathons.  
  > Instead, CGIAR's anomaly methodology and CHIRPS/AgERA5 30-year climatological normal statistics (1991–2020) for pilot agrarian districts are pre-calibrated and packaged locally as a `LOCAL_DATASET`.
- **Files / Packages Used:**
  - Concepts adapted from `climate_toolkit.calculate_hazards.hazards` and `apis.catalog`.
  - Umbrella Adapter: `CGIARClimateProvider` in `src/umbrella/adapters/climate.py`.
- **Datasets Accessed:**
  - **CHIRPS v2.0:** Climate Hazards Center InfraRed Precipitation with Station data ($0.05^\circ$ resolution).
  - **AgERA5:** Agricultural reanalysis for temperature and precipitation ($0.1^\circ$ resolution).
- **Units:**
  - Daily & Monthly Precipitation: Millimeters ($\text{mm}$)
  - Historical Mean Precipitation: Millimeters ($\text{mm}$)
  - 95th and 99th Percentile Extreme Rainfall: Millimeters ($\text{mm}$)
- **Attribution Requirements:**
  - *"Data processing methodology adapted from CGIAR Climate Data Hub Toolkit (MIT License); CHIRPS v2.0 (Funk et al., 2015)."*
  - Daily & Monthly Precipitation: Millimeters ($\text{mm}$)
  - Historical Mean Precipitation: Millimeters ($\text{mm}$)
  - Rainfall Anomaly: Millimeters deviation from normal ($\Delta\text{mm}$) and percentage deviation ($\%$)
  - 95th Percentile Extreme Rainfall: Millimeters ($\text{mm}$)
- **Spatial Resolution:**
  - CHIRPS: $0.05^\circ \times 0.05^\circ$ ($\approx 5.5\text{km}$).
  - AgERA5: $0.1^\circ \times 0.1^\circ$ ($\approx 10\text{km}$).
- **Temporal Resolution:** 30-year historical baseline (1991–2020) and daily rolling historical observations.
- **Preprocessing Performed:**
  - Extracting historical monthly mean and 95th percentile daily precipitation for target pilot coordinates.
  - Computing antecedent 14-day rainfall accumulation.
  - Comparing 3-day forecast totals against historical extreme event thresholds to derive rainfall anomaly multipliers.
- **Attribution Requirements:**
  - Acknowledge CGIAR Climate Data Hub: *"Data processing methodology adapted from CGIAR Climate Data Hub Toolkit (MIT License)."*
  - Original CHIRPS citation: Funk et al., 2015, Sci. Data.
- **Known Limitations:**
  - Live runtime access to full Google Earth Engine backend requires GCP service account authentication.
  - For standalone hackathon execution, Umbrella uses pre-extracted climatological baseline profiles for target pilot regions to ensure 100% reliable offline/online operation.

---

### Category B: ADAPTED

Conceptual architectures, mathematical algorithms, or formulas reimplemented cleanly within Umbrella in native Python without copying third-party code.

#### 3. CLIMADA (Economics of Climate Adaptation)
- **Repository:** [`CLIMADA-project/climada_python`](https://github.com/CLIMADA-project/climada_python)
- **Primary Purpose:** Methodology benchmark for climate impact and risk modeling.
- **License:** GNU General Public License v3.0 (GPL-3.0) — **Copyleft quarantine active**.
- **Umbrella Module:** `engine.risk` (`VillageRiskEngine`, `ExplainableVillageRiskEngine`)
- **Integration Status:** `ADAPTED`
- **Files / Packages Used:**
  - Zero code files copied from upstream.
  - Conceptual formulation adapted: $\text{Impact} = f(\text{Hazard}, \text{Exposure}, \text{Vulnerability})$.
- **Adaptation & Modifications:**
  - Umbrella adapts CLIMADA's continuous catastrophe calculus into an explainable, multi-factor scoring model suitable for community microfinance:
    $$\text{Hazard Score} = \min\left(100, \frac{\text{Forecast Rainfall (mm)}}{\text{Historical P95 Threshold (mm)}} \times 50 + \text{Antecedent Soil Factor}\right)$$
    $$\text{Vulnerability Score} = \text{Topographic Slope Factor} \times 0.4 + \text{Drainage Factor} \times 0.3 + \text{Crop Stage Sensitivity} \times 0.3$$
    $$\text{Village Risk Index} = (\text{Hazard Score} \times 0.5) + (\text{Vulnerability Score} \times 0.3) + (\text{Exposure Weight} \times 0.2)$$
  - Transparent component attribution: outputs explain exactly which factor drove the risk.
- **Attribution Requirements:**
  - Acknowledge conceptual foundation: *"Risk calculation architecture conceptually inspired by the Economics of Climate Adaptation (ECA) / CLIMADA framework."*
- **Known Limitations:**
  - Does not compute physical 2D hydrodynamic water velocities or building structural collapse damage functions.

---

### Category C: REFERENCED

Repositories inspected solely for domain modeling, taxonomy, enterprise design patterns, or scientific benchmarks.

#### 4. Apache Fineract
- **Repository:** [`apache/fineract`](https://github.com/apache/fineract)
- **Primary Purpose:** Microfinance domain standard for Joint Liability Groups (JLGs), loan schedules, and portfolio metrics.
- **License:** Apache License 2.0 (Permissive)
- **Umbrella Module:** Domain model reference for `schemas.portfolio` and `adapters.portfolio`
- **Integration Status:** `REFERENCED`
- **Files / Packages Used:**
  - None directly copied.
  - Domain concepts referenced: `Client`, `Group`, `LoanProduct`, `Disbursal`, `RepaymentSchedule`, `PrincipalOutstanding`, `PortfolioAtRisk` (PAR).
- **Attribution Requirements:**
  - Apache Fineract is a registered trademark of the Apache Software Foundation.
- **Known Limitations:**
  - Enterprise Java platform; not executed during hackathon MVP.

#### 5. moja global FLINT (Full Lands INtegration Tool)
- **Repository:** [`moja-global/FLINT`](https://github.com/moja-global/FLINT)
- **Primary Purpose:** Methodological benchmark for land-sector greenhouse gas (GHG) accounting and auditability.
- **License:** Mozilla Public License 2.0 (MPL-2.0)
- **Umbrella Module:** Methodology reference for `engine.carbon` (`ProxyCarbonBenefitEngine`)
- **Integration Status:** `REFERENCED`
- **Files / Packages Used:** None.
- **Attribution Requirements:**
  - moja global and FLINT cited in carbon methodology documentation.
- **Known Limitations:**
  - C++ land simulator; not deployed in MVP. MVP outputs "Estimated Emissions Avoided (tCO₂e)" as an uncertified operational indicator.

---

### Category D: PLANNED

High-value candidate libraries, external services, or datasets targeted for post-MVP releases.

#### 6. climate_indices
- **Repository:** [`monocongo/climate_indices`](https://github.com/monocongo/climate_indices)
- **Primary Purpose:** Established drought index calculation (SPI, SPEI, PET, Palmer PDSI).
- **License:** BSD-3-Clause
- **Umbrella Module:** `hazards.drought` (`ClimateIndicesDroughtEngine` implementing `HazardEngine`)
- **Integration Status:** `PLANNED`
- **Planned Interface:** `HazardEngine` under `src/umbrella/hazards/drought/`
- **Prerequisites for Activation:**
  - Continuous 30-year monthly precipitation time series for target geographies.
  - Completion of flood-first MVP milestone.
- **Known Limitations:**
  - Computationally intensive statistical fitting requiring `scipy` and `numba`.

#### 7. FLOODPY
- **Repository:** [`kleok/FLOODPY`](https://github.com/kleok/FLOODPY)
- **Primary Purpose:** Ex-post satellite SAR (Sentinel-1) flood extent mapping to validate early-warning risk predictions.
- **License:** GNU General Public License v3.0 (GPL-3.0) — Must remain isolated in an asynchronous worker/service to prevent GPL contamination.
- **Umbrella Module:** `validators.satellite` (`Sentinel1FloodValidator` implementing `ObservedFloodValidator`)
- **Integration Status:** `PLANNED`
- **Prerequisites for Activation:**
  - Copernicus Dataspace Ecosystem API keys.
  - Cloud storage bucket for multi-gigabyte Sentinel-1 GRD imagery.
- **Known Limitations:**
  - Sentinel-1 revisit time is 6–12 days; cannot provide real-time early warning. Useful only for post-event audit.

#### 8. UNDP India DiCRA
- **Repository:** [`undpindia/dicra`](https://github.com/undpindia/dicra)
- **Primary Purpose:** High-resolution geospatial datasets for Indian agricultural climate resilience (LULC 10m, Soil Organic Carbon, Crop Intensity).
- **License:** MIT License
- **Umbrella Module:** `adapters.vulnerability.dicra` (`DiCRAVulnerabilityProvider` implementing `VulnerabilityDataProvider`)
- **Integration Status:** `PLANNED` (Currently referenced for synthetic village baseline parameter calibration).
- **Prerequisites for Activation:**
  - Direct GeoJSON/vector tile pipeline for pilot state districts.
- **Known Limitations:**
  - Coverage concentrated in select Indian states (e.g., Telangana pilot region).

---

## 5. Comprehensive Software License & Attribution Inventory

```
====================================================================================================
UMBRELLA THIRD-PARTY LICENSE NOTICE FILE
====================================================================================================

1. Open-Meteo
   - Service: Open-Meteo Weather Forecast API
   - Website: https://open-meteo.com
   - Repository: https://github.com/open-meteo/open-meteo
   - Source Code License: GNU AGPL-3.0
   - API Data Terms: Creative Commons Attribution 4.0 International (CC-BY 4.0)
   - Mandatory Notice: "Weather data by Open-Meteo.com"
   - Data Providers: ECMWF, DWD, NOAA.

2. CGIAR Climate Data Toolkit
   - Repository: https://github.com/CGIAR-Climate-Data-Hub/climate-toolkit
   - Copyright (c) 2024 CGIAR Climate Data Hub
   - License: MIT License
   - Citation: CGIAR Climate Data Hub (2024). Climate Data Toolkit for location-based climate analysis.

3. monocongo / climate_indices
   - Repository: https://github.com/monocongo/climate_indices
   - Copyright (c) 2017 James Adams
   - License: BSD 3-Clause License

4. Apache Fineract
   - Repository: https://github.com/apache/fineract
   - Copyright (c) The Apache Software Foundation
   - License: Apache License, Version 2.0

5. CLIMADA Project
   - Repository: https://github.com/CLIMADA-project/climada_python
   - Copyright (c) ETH Zurich, CLIMADA contributors
   - License: GNU General Public License v3.0 (GPL-3.0)
   - Usage in Umbrella: Architectural concept only; zero code reused.

6. FLOODPY
   - Repository: https://github.com/kleok/FLOODPY
   - Copyright (c) 2021-2024 Kleanthis Karamvasis, Alekos Falagas
   - License: GNU General Public License v3.0 (GPL-3.0)
   - Usage in Umbrella: Concept for post-event SAR validation; zero code embedded.

7. UNDP India DiCRA
   - Repository: https://github.com/undpindia/dicra
   - Copyright (c) 2022 UNDP India & Partners
   - License: MIT License

8. moja global FLINT
   - Repository: https://github.com/moja-global/FLINT
   - Copyright (c) moja global contributors
   - License: Mozilla Public License 2.0 (MPL-2.0)
   - Usage in Umbrella: Conceptual reference for carbon accounting; zero code embedded.

9. OpenStreetMap (OSM)
   - Product: Administrative District Boundary for Darbhanga (Relation 1568263)
   - Copyright: (c) OpenStreetMap contributors
   - License: Open Data Commons Open Database License 1.0 (ODbL)
   - Attribution: "Data by OpenStreetMap, under ODbL"

10. ECMWF Copernicus Climate Change Service (ERA5 / ERA5-Land)
   - Product: Daily Reanalysis Precipitation, Temperature, Soil Moisture
   - Access: Open-Meteo Historical Archive API
   - License: Creative Commons Attribution 4.0 International (CC-BY 4.0)
   - Attribution: "Generated using Copernicus Climate Change Service information (2020)"

11. Central Water Commission (CWC), Ministry of Jal Shakti
   - Product: River Gauge Flood Levels and Hydrographs (Hayaghat, Jhanjharpur, Kamtaul)
   - Provider: Government of India Open Data / CWC Hydrological Bulletins

12. National Remote Sensing Centre (NRSC) / ISRO
   - Product: Bhuvan Disaster Management Support Flood Inundation Maps (Bihar Flood 2020)
   - Provider: Indian Space Research Organisation (ISRO)
====================================================================================================
```

