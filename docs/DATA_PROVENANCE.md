# DATA PROVENANCE & DATA MODALITY REGISTER

**Document Version:** 1.0.0  
**Status:** Living Engineering Standard  
**Core Requirement:** Every Umbrella API response must answer: *"Where did this number come from?"*

---

## 1. Data Modality Classifications

Umbrella rigorously tracks the execution modality of every data stream using five explicit source labels:

| Modality Tag | Definition | Application in Umbrella |
|:---|:---|:---|
| **`LIVE`** | Genuine data retrieved in real time over an authenticated network socket from an external provider. | Open-Meteo weather forecasts retrieved when internet access is active. |
| **`REANALYSIS`** | Historical meteorological reconstructions based on physical numerical models assimilating multi-source observations (ERA5 / ERA5-Land). | Open-Meteo Historical Archive API data for disaster benchmark replay. **Never labelled as LIVE or ARCHIVED_FORECAST.** |
| **`CACHED`** | Previously retrieved live data stored in local memory or Redis to reduce API latency and comply with rate limits. | Climatological query cache. |
| **`LOCAL_DATASET`** | Authoritative empirical data pre-extracted from external open-source scientific products and bundled locally. | 30-year CHIRPS v2.0 / AgERA5 historical climatological normals and P95 extreme rainfall tables. |
| **`ADAPTED`** | Scientific formulas or statistical equations reimplemented cleanly in native Python based on peer-reviewed literature. | CLIMADA $H \times E \times V$ framework and Flood Hazard Model v1.0. |
| **`MOCK`** | Deterministic simulated fallback payloads triggered when live network connectivity is severed or during offline testing. | Open-Meteo offline fallback response. **Must never masquerade as LIVE.** |
| **`SYNTHETIC`** | Statistically consistent demo microfinance portfolio records generated for testing and demonstration. | `SyntheticPortfolioProvider` (Joint Liability Groups, borrower accounts, loan sizes). |


---

## 2. Upstream Data Streams & Provenance Schema

### 1. Short-Range Weather Forecasts
- **Provider:** Open-Meteo (`https://api.open-meteo.com`)
- **Attribution Notice:** *"Weather data by Open-Meteo.com"*
- **Underlying Models:** ECMWF IFS, DWD ICON Global, NOAA GFS
- **Variables Retrieved:**
  - `precipitation_sum` ($\text{mm}$)
  - `rain_sum` ($\text{mm}$)
  - `precipitation_probability_max` ($\%$)
  - `soil_moisture_0_to_10cm_mean` ($m^3/m^3$)
  - `temperature_2m_max`, `temperature_2m_min` ($^\circ\text{C}$)
- **Provenance Attributes Tracked:**
  ```json
  {
    "provider_name": "Open-Meteo",
    "data_source_mode": "LIVE",
    "forecast_horizon_days": 5,
    "forecast_start_date": "2026-09-26",
    "forecast_end_date": "2026-09-30",
    "retrieved_at": "2026-09-26T15:50:00Z",
    "fallback_reason": null,
    "attribution": "Weather data by Open-Meteo.com"
  }
  ```
- **Fallback Integrity Rule:** If network failure occurs, `data_source_mode` transitions to `"MOCK"`, and `fallback_reason` contains the exact exception message.

---

### 2. Historical Climate Baselines
- **Provider:** CGIAR Climate Data Hub / CHIRPS / AgERA5
- **Modality:** `LOCAL_DATASET`
- **Citation:** Funk et al., 2015, *The climate hazards group infrared precipitation with stations—a new environmental record for monitoring extremes*, Scientific Data.
- **Spatial Resolution:** $0.05^\circ \times 0.05^\circ$ ($\approx 5.5\text{ km}$)
- **Baseline Normal Window:** 30 years (1991–2020)
- **Provenance Attributes Tracked:**
  ```json
  {
    "dataset_name": "CHIRPS v2.0 / AgERA5 Climatology",
    "data_source_mode": "LOCAL_DATASET",
    "baseline_period": "1991-2020 (30-year climatological normal)",
    "spatial_resolution": "0.05 deg (~5.5 km)",
    "month": 7,
    "historical_monthly_mean_rainfall_mm": 280.0,
    "p95_daily_rainfall_mm": 65.0,
    "p99_daily_rainfall_mm": 110.0,
    "source_attribution": "Funk et al., 2015 (CHIRPS) / CGIAR Climate Data Hub methodology"
  }
  ```

---

### 3. Pilot Geography & Physical Terrain
- **Registry:** `umbrella.config.geography.PILOT_LOCATIONS`
- **Modality:** `DEMO_PILOT`
- **Attributes:**
  - Administrative Hierarchy: State $\rightarrow$ District $\rightarrow$ Village Node
  - Physical Susceptibility: Mean elevation ($\text{m}$), slope gradient ($\%$) from SRTM DEM, drainage capacity index ($0 - 1$), soil classification, river proximity ($\text{km}$).

---

### 4. Microfinance Portfolio Exposure
- **Provider:** `SyntheticPortfolioProvider`
- **Modality:** `SYNTHETIC`
- **Disclaimer:**
  ```json
  {
    "data_type": "SYNTHETIC",
    "portfolio_source": "SyntheticPortfolioProvider (Deterministic Demo Generator)",
    "currency": "INR",
    "disclaimer": "SYNTHETIC DEMO DATA: Generated for demonstration and structural testing. Does not represent actual borrower records, proprietary MFI portfolios, or Satin Creditcare data."
  }
  ```

---

### 5. Retrospective Reanalysis (Historical Disasters)
- **Provider:** Open-Meteo Historical Archive API (ECMWF ERA5 / ERA5-Land)
- **Modality:** `REANALYSIS`
- **Citation:** Hersbach et al., 2020, *The ERA5 global reanalysis*, Quarterly Journal of the Royal Meteorological Society; Muñoz-Sabater et al., 2021 (ERA5-Land).
- **Spatial Resolution:** $\sim 0.1^\circ \times 0.1^\circ$ ($\sim 9\text{--}11\text{ km}$)
- **Provenance Attributes Tracked:**
  ```json
  {
    "provider_name": "Open-Meteo Historical Archive (ECMWF ERA5 / ERA5-Land)",
    "data_source_mode": "REANALYSIS",
    "forecast_horizon_days": 5,
    "forecast_start_date": "2020-07-20",
    "forecast_end_date": "2020-07-24",
    "retrieved_at": "2020-07-24T00:00:00Z",
    "attribution": "Reanalysis data by ECMWF ERA5 / Open-Meteo.com"
  }
  ```
- **Integrity Rule:** In historical event replay, the data source mode is strictly labelled `REANALYSIS`. Never labelled as `LIVE` or `ARCHIVED_FORECAST`.

---

### 6. Ground-Truth Observational Validation
- **CWC River Gauges:** Central Water Commission (Ministry of Jal Shakti, Government of India).
  - Stations: Hayaghat (Bagmati, DL 48.68m, crest 50.82m), Jhanjharpur (Kamala Balan, DL 50.00m, crest 52.45m), Kamtaul (Adhwara, DL 50.00m, crest 51.70m).
- **Satellite Inundation Maps:** ISRO / NRSC Bhuvan Flood Disaster Management Support Programme (Map IDs 2020/22, 2020/23, 2020/24).
- **Copernicus Sentinel-1 SAR:** European Space Agency C-band Synthetic Aperture Radar.
  - Acquisition dates: 2020-07-11, 2020-07-17, 2020-07-23, 2020-07-29.
  - Validation Status: `EVIDENCE_AVAILABLE_NOT_PROCESSED` (Instrument mode, orbit numbers, and polarizations cataloged).

---

### 7. Resilience Interventions & Green Finance Product Catalog
- **Provider:** Curated Agricultural Resilience Catalog (`src/umbrella/engine/catalog.py`)
- **Modality:** `DERIVED` / `SOURCED`
- **Intervention Specifications**:
  - `raised-hermetic-silo`: Metal/composite hermetic storage elevated on masonry plinth ($\ge 60\text{ cm}$). Derived from ICAR and IRRI post-harvest engineering standards.
  - `solar-irrigation-pump`: 2 HP DC surface pump with elevated PV mount ($\ge 1.5\text{ m}$). Sourced from PM-KUSUM Component-B technical specifications.
  - `portable-solar-dryer`: Polycarbonate greenhouse-tunnel dryer with DC ventilation fan. Derived from CSIR-CFTRI post-harvest preservation benchmarks.
  - `flood-livestock-shelter`: Elevated communal/individual shed platform ($\ge 1.0\text{ m}$) with non-slip ramps and fodder racks.
- **Financial Pricing Benchmarks**:
  - Micro-adaptation rates ($16.0\% - 18.0\%$ p.a., 2% processing fee) modeled on Reserve Bank of India (Regulatory Framework for Microfinance Loans) Directions, 2022.

---

### 8. Climate Impact & Emissions Avoidance Provenance
- **Methodology 1:** `UNFCCC-AMS-I.A` (Small-scale renewable electricity & heat generation).
  - Scope: Stand-alone agricultural solar systems replacing diesel generation.
  - Emission Factors:
    - Ag Diesel: $2.68\text{ kg CO}_2\text{e/liter}$ (`SOURCED`, IPCC EFDB Mobile Agricultural Machinery).
    - Grid Baseline: $0.71\text{ kg CO}_2\text{e/kWh}$ (`SOURCED`, CEA India Eastern Regional Grid v19).
- **Methodology 2:** `FAO-POST-HARVEST-2021` (Food loss and waste prevention).
  - Scope: Hermetic storage preventing spoilage of harvested paddy/wheat during monsoonal waterlogging.
  - Baselines:
    - North Bihar Monsoonal Spoilage Baseline: $15.0\%$ (`SOURCED`, ICAR Bihar post-harvest surveys).
    - Embodied Carbon Footprint of Rice: $0.85\text{ kg CO}_2\text{e/kg}$ (`SOURCED`, IRRI / FAO Cradle-to-Farmgate LCA).
- **Illustrative Economic Sensitivity Parameters**:
  - Carbon Price Range: \$5 – \$50 / $\text{tCO}_2\text{e}$ (`DEMO_ASSUMPTION`, baseline \$15/tCO2e).
  - Exchange Rate: ₹83.0 / \$1 USD (`DEMO_ASSUMPTION`).
  - **Explicit Non-Credit Disclaimer**: All avoided carbon outputs are tagged `ESTIMATED_EMISSIONS_AVOIDED` and carry non-negotiable disclaimers that they are not certified carbon credits or tradable offsets.


