# REUSE AUDIT: OPEN-SOURCE ECOSYSTEM EVALUATION

**Project:** Umbrella — Climate-Adaptive Microfinance Intelligence Platform  
**Document Version:** 1.0.0  
**Audit Date:** September 2026  
**Status:** Approved / Baseline Architecture  
**Scope:** Evaluation of 8 candidate external open-source repositories prior to implementation.

---

## 1. Executive Summary & Audit Policy

Umbrella follows a **reuse-first but loosely coupled** architecture. The objective of this audit is to rigorously assess eight candidate repositories identified in the system strategy to ensure:
1. **Zero Domain Model Pollution:** External data models or raw schemas are never allowed to leak into Umbrella's core business or risk engine.
2. **License Compliance:** Strict adherence to Open Source Initiative (OSI) licenses. Copyleft licenses (GPL-3.0, AGPL-3.0) must never infect Umbrella's proprietary or Apache-2.0 core code.
3. **Hackathon Feasibility:** Heavyweight scientific or enterprise platforms (ESA SNAP, Spring Boot/Java core banking, C++ land sector engines, GEE authentications) are isolated or stubbed with synthetic/hosted adapters to ensure zero build blockage.
4. **Adapter-Driven Isolation:** Every external integration is encapsulated behind an Umbrella-owned abstract base class (interface), allowing plug-and-play swaps.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   UMBRELLA APPLICATION CORE                           │
│                                                                                        │
│   ┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────────────────┐   │
│   │  FloodHazardEngine  │    │  VillageRiskEngine  │    │   RecommendationEngine   │   │
│   └──────────▲──────────┘    └──────────▲──────────┘    └────────────▲─────────────┘   │
│              │                          │                            │                 │
├──────────────┼──────────────────────────┼────────────────────────────┼─────────────────┤
│              │ UMBRELLA ADAPTER INTERFACE LAYER (Boundary)           │                 │
│              │                          │                            │                 │
│   ┌──────────┴──────────┐    ┌──────────┴──────────┐    ┌────────────┴─────────────┐   │
│   │   WeatherProvider   │    │ClimateDataProvider  │    │    PortfolioProvider     │   │
│   │     (Interface)     │    │     (Interface)     │    │       (Interface)        │   │
│   └──────────▲──────────┘    └──────────▲──────────┘    └────────────▲─────────────┘   │
├──────────────┼──────────────────────────┼────────────────────────────┼─────────────────┤
│              │ IMPLEMENTATION ADAPTERS (External / Synthetic)        │                 │
│              │                          │                            │                 │
│   ┌──────────┴──────────┐    ┌──────────┴──────────┐    ┌────────────┴─────────────┐   │
│   │ OpenMeteoWeather    │    │ CGIARClimate        │    │ SyntheticPortfolio       │   │
│   │ Provider (Hosted)   │    │ Provider / Fallback │    │ Provider (Active MVP)    │   │
│   └──────────▲──────────┘    └──────────▲──────────┘    └────────────▲─────────────┘   │
└──────────────┼──────────────────────────┼────────────────────────────┼─────────────────┘
               │                          │                            │
   [Open-Meteo REST API]         [CHIRPS/AgERA5/CGIAR]         [Synthetic Microfinance]
```

---

## 2. Comprehensive Repository-by-Repository Audit

---

### Audit 1: CGIAR Climate Data Toolkit

- **Repository:** [`CGIAR-Climate-Data-Hub/climate-toolkit`](https://github.com/CGIAR-Climate-Data-Hub/climate-toolkit)
- **Primary Role:** Climate and historical environmental data foundation
- **Upstream License:** MIT License (Permissive)
- **Upstream Tech Stack:** Python 3.10+, Google Earth Engine API (`earthengine_api`), `xarray`, `xclim`, `xee`, `pydantic`, `typer`, FastAPI.

#### 1. Is it still relevant to Umbrella?
**Yes.** CGIAR's toolkit provides authoritative access patterns, dataset mappings, and calculation methodologies for global agricultural and climate datasets: CHIRPS v2/v3 (precipitation), AgERA5 (temperature and precipitation), ERA5 reanalysis, NASA POWER, TerraClimate, and SoilGrids. It is highly relevant for establishing historical rainfall baselines, precipitation percentiles, and anomaly detection.

#### 2. What exact functionality is useful?
- Dataset catalog and parameter conventions for CHIRPS (0.05° resolution daily precipitation) and AgERA5.
- Logic for calculating historical rainfall percentiles, cumulative totals, and seasonal baseline anomalies.
- Formulas for climate hazard indicators (e.g., standard precipitation anomaly and drought/flood thresholding).

#### 3. Can it be consumed as a library/API?
**Partially.** The toolkit can be installed via Python (`climate-toolkit`), and it contains an optional FastAPI service layer (`apis/main.py`). However, its full runtime relies on Google Earth Engine (`earthengine-api` and `xee`), which requires Google Cloud Project credentials (`GCP_PROJECT_ID` and authenticated service account keys). For a self-contained hackathon build, directly executing GEE-backed calls introduces authentication latency and failure risks.

#### 4. Would direct code reuse create licensing problems?
**No.** It is licensed under the permissive MIT License. Code, formulas, and schema logic can be legally reused or adapted provided the original copyright notice is retained.

#### 5. Is it lightweight enough for a hackathon?
**No for full library installation; Yes for adapted lightweight client/catalog.** Full installation pulls heavy geospatial dependencies (`earthengine-api`, `xee`, `xclim`, `xarray`), requiring 500MB+ virtual environment footprint and GCP authentication. Directly importing the full package would violate the requirement that audit and setup must not block the build.

#### 6. Should Umbrella integrate, adapt, reference, or postpone it?
**ADAPTED & LOCAL DATASET.**
- **Integration Status:** `ADAPTED` (anomaly formulas & percentiles) / `LOCAL_DATASET` (pre-calibrated 30-year CHIRPS / AgERA5 baseline normal tables).
- Umbrella adapts CGIAR's dataset descriptors, units, and baseline anomaly logic into an Umbrella-native provider.
- In production/testing, `CGIARClimateProvider` operates via pre-computed historical climatology tables without requiring live Google Earth Engine cloud authentication.

#### 7. What exact Umbrella interface should isolate it?
- Interface: `ClimateDataProvider` (and its specialized sub-interface `HistoricalClimateProvider`).
- Implementation: `CGIARClimateProvider`.
- Umbrella's `FloodHazardEngine` consumes normalized `HistoricalClimateRecord` models and never interacts with CGIAR or GEE internal objects.

#### 8. What dependencies would it introduce?
- Required: `requests` / `httpx`, `pydantic`.
- Avoided for MVP: `earthengine-api`, `xee`, `xclim`, `xarray`.

---

### Audit 2: Open-Meteo

- **Repository:** [`open-meteo/open-meteo`](https://github.com/open-meteo/open-meteo)
- **Primary Role:** 3–7 day short-range weather forecast provider
- **Upstream License:** GNU Affero General Public License v3.0 (AGPL-3.0) for the server source code; Public hosted API is free for non-commercial use with CC-BY 4.0 data attribution.
- **Upstream Tech Stack:** Swift (backend engine), FlatBuffers/JSON, Docker.

#### 1. Is it still relevant to Umbrella?
**Yes, critical.** Open-Meteo is the primary source for short-range (3–7 day) meteorological forecasting for Umbrella's flood-first MVP.

#### 2. What exact functionality is useful?
- Point-coordinate (latitude, longitude) weather forecasts at hourly and daily intervals.
- Key forecast variables:
  - `precipitation_sum` (mm)
  - `precipitation_probability_max` (%)
  - `temperature_2m_max` and `temperature_2m_min` (°C)
  - `apparent_temperature_max` (°C)
  - `wind_speed_10m_max` (km/h)
  - `soil_moisture_0_to_10cm_mean` ($m^3/m^3$)
  - Multi-day cumulative rainfall forecast.

#### 3. Can it be consumed as a library/API?
**Yes, via hosted REST API.** Umbrella uses the hosted Open-Meteo API (`https://api.open-meteo.com/v1/forecast`) rather than cloning or compiling the Swift repository.

#### 4. Would direct code reuse create licensing problems?
**No, because we consume the hosted network API.** The open-meteo server repository is AGPL-3.0. If Umbrella cloned, modified, or linked against the Swift code, Umbrella would trigger AGPL copyleft requirements. Calling the public HTTP endpoint over standard network boundaries does not contaminate Umbrella's codebase. Commercial usage constraints require attribution ("Weather data by Open-Meteo.com") and adherence to non-commercial rate limits (10,000 daily requests free).

#### 5. Is it lightweight enough for a hackathon?
**Yes, exceptionally lightweight.** Consuming the public REST API requires only standard HTTP requests, zero local setup, and zero compilation.

#### 6. Should Umbrella integrate, adapt, reference, or postpone it?
**INTEGRATED.**
- **Integration Status:** `INTEGRATED` via `OpenMeteoWeatherProvider`.
- All HTTP queries, error handling, rate-limiting, and payload normalization happen inside this adapter.

#### 7. What exact Umbrella interface should isolate it?
- Interface: `WeatherProvider`.
- Implementation: `OpenMeteoWeatherProvider`.
- Normalized output: `UmbrellaWeatherForecast` containing daily time-series records (`ForecastDay`: `date`, `rainfall_mm`, `precipitation_probability_pct`, `temp_max_c`, `soil_moisture`, etc.). Open-Meteo's nested dictionary structures are discarded at the adapter boundary.

#### 8. What dependencies would it introduce?
- `requests` or `httpx`, `pydantic`.

---

### Audit 3: climate_indices

- **Repository:** [`monocongo/climate_indices`](https://github.com/monocongo/climate_indices)
- **Primary Role:** Established climate-index calculations (SPI, SPEI, PET, Palmer indices)
- **Upstream License:** BSD-3-Clause (Permissive)
- **Upstream Tech Stack:** Python 3.10+, `numpy`, `scipy`, `numba`, `structlog`, `hatchling`.

#### 1. Is it still relevant to Umbrella?
**Yes, for secondary/future drought hazard extensions.** It is the gold-standard reference implementation for the Standardized Precipitation Index (SPI) and Standardized Precipitation Evapotranspiration Index (SPEI).

#### 2. What exact functionality is useful?
- `climate_indices.indices.spi`: Fits monthly/daily precipitation to a Gamma or Pearson Type III distribution to calculate multi-scale drought/wetness deviations (-3 to +3).
- `climate_indices.indices.spei`: Incorporates Potential Evapotranspiration (PET via Thornthwaite or Penman-Monteith) to compute moisture deficit indices.
- `climate_indices.flood`: Antecedent precipitation and flood indicator utilities.

#### 3. Can it be consumed as a library/API?
**Yes.** It is packaged on PyPI (`pip install climate_indices`) and has a typed public Python API (`climate_indices.indices`).

#### 4. Would direct code reuse create licensing problems?
**No.** BSD-3-Clause is permissive and compatible with any downstream license, provided copyright attribution is preserved.

#### 5. Is it lightweight enough for a hackathon?
**Moderate.** It pulls in `numba`, `scipy`, and `llvmlite`, which occasionally encounter compilation issues on certain Windows environments without pre-built C++ wheels. Furthermore, calculating valid SPI requires continuous 30-year monthly precipitation time series.

#### 6. Should Umbrella integrate, adapt, reference, or postpone it?
**POSTPONE / PLANNED for Drought Extension.**
- **Integration Status:** `PLANNED`.
- For the flood-first MVP, drought hazard prediction is intentionally out of scope.
- Architectural accommodation: The hazard abstraction layer is designed so `ClimateIndicesDroughtEngine` can be added without modifying the risk or portfolio pipelines.

#### 7. What exact Umbrella interface should isolate it?
- Interface: `HazardEngine` (under `hazards/drought/`).
- Planned Implementation: `ClimateIndicesDroughtEngine`.

#### 8. What dependencies would it introduce?
- `climate_indices`, `numpy`, `scipy`, `numba`. (Deferred for MVP).

---

### Audit 4: Apache Fineract

- **Repository:** [`apache/fineract`](https://github.com/apache/fineract)
- **Primary Role:** Microfinance domain model and enterprise core banking reference
- **Upstream License:** Apache License 2.0 (Permissive)
- **Upstream Tech Stack:** Java 17/21, Spring Boot, Gradle, MariaDB/PostgreSQL, Flyway, OpenAPI/REST.

#### 1. Is it still relevant to Umbrella?
**Yes, as a domain reference.** Apache Fineract is the industry benchmark for digital microfinance institutions (MFIs) serving joint liability groups (JLGs) and smallholder farmers.

#### 2. What exact functionality is useful?
- Domain models: `Client` (farmer/borrower), `Group` / `Center` (village-level borrowing group), `LoanProduct`, `LoanAccount`, `RepaymentSchedule`, `Disbursal`, `PrincipalOutstanding`, and `PortfolioAtRisk` (PAR).
- Portfolio risk aggregation concepts: Calculating outstanding loan exposure per administrative boundary or village center.

#### 3. Can it be consumed as a library/API?
**No as a library; Yes as an external enterprise service via REST API.** Fineract is a Java enterprise platform. It cannot be imported into Python. Running the full Fineract dockerized stack requires 4GB+ RAM, MariaDB, and extensive seed data.

#### 4. Would direct code reuse create licensing problems?
**No.** Apache-2.0 is fully permissive.

#### 5. Is it lightweight enough for a hackathon?
**No.** Running an enterprise core banking platform for a hackathon demo introduces immense operational overhead and failure points with zero incremental climate intelligence value.

#### 6. Should Umbrella integrate, adapt, reference, or postpone it?
**REFERENCED (Domain model) & PLANNED (Enterprise Connector).**
- **Integration Status:** `REFERENCED` for domain schema design; `PLANNED` for `FineractPortfolioProvider`.
- **MVP Implementation:** Umbrella implements `SyntheticPortfolioProvider` conforming to `PortfolioProvider`. It generates realistic, statistically grounded microfinance borrower groups, loan balances, crop cycles, and geographic coordinates matching target pilot villages.

#### 7. What exact Umbrella interface should isolate it?
- Interface: `PortfolioProvider`.
- Active MVP Implementation: `SyntheticPortfolioProvider`.
- Future Enterprise Implementation: `FineractPortfolioProvider`.
- Normalized Models: `BorrowerGroup`, `LoanPortfolio`, `VillageExposure`.

#### 8. What dependencies would it introduce?
- None for MVP (pure Python/Pydantic).

---

### Audit 5: CLIMADA (CLIMADA Python)

- **Repository:** [`CLIMADA-project/climada_python`](https://github.com/CLIMADA-project/climada_python)
- **Primary Role:** Climate-risk methodology reference (Economics of Climate Adaptation - ECA)
- **Upstream License:** GNU General Public License v3.0 (GPL-3.0) (Strict Copyleft)
- **Upstream Tech Stack:** Python, `cartopy`, `geopandas`, `rasterio`, `netCDF4`, `scipy`, `sparse`.

#### 1. Is it still relevant to Umbrella?
**Yes, as the primary conceptual foundation for risk modelling.** CLIMADA's core equation:
$$\text{Impact} = \text{Hazard} \times \text{Exposure} \times \text{Vulnerability}$$
is the scientifically validated formula for catastrophe and climate adaptation assessment.

#### 2. What exact functionality is useful?
- Conceptual separation into four distinct pillars:
  1. **Hazard:** Physical intensity, spatial frequency, and return periods of environmental events.
  2. **Exposure:** Geographic location and monetary value of assets/borrowers at risk.
  3. **Vulnerability (Impact Functions):** Mathematical curves translating physical hazard intensity into percentage asset damage or livelihood disruption.
  4. **Impact / Risk:** Resulting expected financial loss, portfolio vulnerability, and risk score.

#### 3. Can it be consumed as a library/API?
**Technically yes, but legally and operationally inadvisable.** Direct import forces GPL-3.0 license inheritance onto Umbrella and requires heavy geospatial C-libraries (`gdal`, `geos`, `proj`, `cartopy`) notoriously difficult to install on Windows development machines.

#### 4. Would direct code reuse create licensing problems?
**YES (CRITICAL).** CLIMADA is licensed under GPL-3.0. Copying any code from CLIMADA into Umbrella would require the entire Umbrella platform to be released under GPL-3.0. Copying code is strictly forbidden.

#### 5. Is it lightweight enough for a hackathon?
**No.** CLIMADA is designed for global macro-economic catastrophe modeling, not lightweight real-time microfinance risk dashboards.

#### 6. Should Umbrella integrate, adapt, reference, or postpone it?
**ADAPTED (Conceptual Model Only).**
- **Integration Status:** `ADAPTED`.
- Umbrella cleanly adapts the CLIMADA conceptual framework while strictly decoupling physical hazard from financial exposure:
  - `Hazard`: Physical flood hazard (0-100) via `FloodHazardEngine` (strictly environmental; zero portfolio inputs).
  - `Exposure`: Loan balances + borrower count in the village via `PortfolioExposureEngine` (marked SYNTHETIC).
  - `Operational Impact / Priority`: Operational risk prioritization via `PortfolioImpactEngine`.

#### 7. What exact Umbrella interface should isolate it?
- Interface: `PortfolioImpactEngine`.
- Implementation: `PortfolioImpactEngine` (`PortfolioPriority-v1.0`).

#### 8. What dependencies would it introduce?
- Zero external dependencies beyond Umbrella's internal `pydantic` models.

---

### Audit 6: FLOODPY

- **Repository:** [`kleok/FLOODPY`](https://github.com/kleok/FLOODPY)
- **Primary Role:** Observed flood mapping and water surface delineation from Sentinel-1 SAR imagery
- **Upstream License:** GNU General Public License v3.0 (GPL-3.0) (Strict Copyleft)
- **Upstream Tech Stack:** Python, Jupyter, ESA SNAP (`snappy`), PyTorch (Vision Transformer), `rasterio`, Copernicus Open Access Hub / CDSE downloaders.

#### 1. Is it still relevant to Umbrella?
**Yes, as a historical validation and ex-post audit tool.** FLOODPY can ingest Sentinel-1 Synthetic Aperture Radar (SAR) Ground Range Detected (GRD) imagery, apply speckle filtering and adaptive thresholding (Bimodal/Kittler-Illingworth/Otsu), and map inundated areas regardless of cloud cover.

#### 2. What exact functionality is useful?
- Statistical and machine-learning thresholding for water vs. non-water classification from SAR backscatter ($\sigma_0$).
- Historical event replay: Validating whether areas flagged by Umbrella as "High Risk" 4 days prior actually experienced flood inundation.

#### 3. Can it be consumed as a library/API?
**No.** FLOODPY is structured primarily as research scripts and Jupyter notebooks, tightly coupled to local ESA SNAP installations (`aux/snappy_conf_perm.sh`) and local file paths.

#### 4. Would direct code reuse create licensing problems?
**YES.** FLOODPY is GPL-3.0. Embedding its code into Umbrella's runtime would contaminate the codebase.

#### 5. Is it lightweight enough for a hackathon?
**No.** Downloading multi-gigabyte Sentinel-1 GRD scenes and executing SAR preprocessing pipelines cannot be run within a low-latency web request.

#### 6. Should Umbrella integrate, adapt, reference, or postpone it?
**POSTPONE / PLANNED for Validation Module.**
- **Integration Status:** `PLANNED` (Historical Event Validation).
- It is strictly **NOT** on the critical path for the MVP early warning pipeline.
- **Critical Scientific Distinction:** Umbrella must clearly maintain the distinction between **predictive early-warning flood risk** (forecast rainfall + hydrology proxy) and **observed flood detection** (satellite radar after inundation).

#### 7. What exact Umbrella interface should isolate it?
- Interface: `ObservedFloodValidator` / `HistoricalEventValidator`.
- Implementation: `FloodpySatelliteValidator` (external asynchronous job).

#### 8. What dependencies would it introduce?
- Heavy: `torch`, `torchvision`, `snappy`, `gdal`, `scikit-image`. (Deferred).

---

### Audit 7: UNDP India DiCRA

- **Repository:** [`undpindia/dicra`](https://github.com/undpindia/dicra)
- **Primary Role:** India-specific agricultural and climate resilience geospatial datasets
- **Upstream License:** MIT License (Permissive)
- **Upstream Tech Stack:** Python, Jupyter, GeoJSON, Shapefiles, Mapbox/Deck.gl.

#### 1. Is it still relevant to Umbrella?
**Yes.** DiCRA provides open-access curated layers specifically for climate-resilient agriculture in India, including high-resolution Land Use/Land Cover (ESA Sentinel-2 10m), Crop Intensity (ICRISAT/MODIS 250m), Soil Organic Carbon (SoilGrids 250m), and district-level vulnerability indicators.

#### 2. What exact functionality is useful?
- Baseline environmental and agricultural vulnerability metrics for Indian pilot districts (e.g., Telangana, Bihar, Odisha).
- Soil drainage and water retention proxies based on Soil Organic Carbon and soil texture.
- Agricultural calendar and cropping pattern context (kharif vs. rabi seasons).

#### 3. Can it be consumed as a library/API?
**As static data layers / GeoJSON assets.** DiCRA is a data repository and visualization platform, not a callable Python API package. Datasets are published as GeoJSON, GeoTIFF, and tabular downloads.

#### 4. Would direct code reuse create licensing problems?
**No.** The code is MIT licensed, and data layers are open data under CC-BY 4.0 or respective institutional open access licenses.

#### 5. Is it lightweight enough for a hackathon?
**Yes, when pre-extracted as district-level lookup tables.** Raw full-state GeoTIFFs are hundreds of megabytes, but extracting village- or block-level vulnerability weights into compact JSON/CSV lookup files makes it instantaneous and reliable.

#### 6. Should Umbrella integrate, adapt, reference, or postpone it?
**REFERENCED (Vulnerability weights) & PLANNED (Dynamic geospatial overlay).**
- **Integration Status:** `REFERENCED` (informing vulnerability parameters) / `PLANNED` (direct GeoJSON layer streaming).
- Pilot district vulnerability factors (crop intensity, baseline drainage) are integrated into Umbrella's synthetic village profiles.

#### 7. What exact Umbrella interface should isolate it?
- Interface: `VulnerabilityDataProvider`.
- Implementation: `DiCRAVulnerabilityProvider` (backed by static district/block parameter profiles).

#### 8. What dependencies would it introduce?
- Compact JSON/GeoJSON parser (`json`, `pydantic`).

---

### Audit 8: moja global FLINT

- **Repository:** [`moja-global/FLINT`](https://github.com/moja-global/FLINT)
- **Primary Role:** Carbon-accounting and land-sector greenhouse gas methodology reference
- **Upstream License:** Mozilla Public License 2.0 (MPL-2.0)
- **Upstream Tech Stack:** C++, CMake, Boost, SQLite/PostgreSQL, GDAL, Docker.

#### 1. Is it still relevant to Umbrella?
**Yes, as a methodology benchmark.** FLINT (Full Lands INtegration Tool) is an IPCC Tier 2/Tier 3 compliant greenhouse gas accounting engine for forest and agricultural land sectors.

#### 2. What exact functionality is useful?
- Carbon accounting rigor: Separating activity data, emission factors, carbon pools (above-ground biomass, below-ground biomass, soil organic matter), baseline counterfactuals, and project intervention scenarios.
- Audit trail architecture: Ensuring carbon claims cite specific methodologies, dates, and uncertainty bounds.

#### 3. Can it be consumed as a library/API?
**No.** FLINT is a high-performance C++ modeling engine requiring specialized toolchains, spatial configuration files, and compiled modules.

#### 4. Would direct code reuse create licensing problems?
**MPL-2.0 is file-level copyleft.** While MPL-2.0 allows integration in larger works without relicensing the entire project, porting or compiling C++ code into a Python hackathon prototype is completely counterproductive.

#### 5. Is it lightweight enough for a hackathon?
**No.** Compiling and configuring FLINT requires days of setup and enterprise-grade cluster infrastructure.

#### 6. Should Umbrella integrate, adapt, reference, or postpone it?
**REFERENCED (Methodology Only).**
- **Integration Status:** `REFERENCED`.
- Umbrella's MVP carbon module uses an explainable, transparent proxy model:
  $$\text{Emissions Avoided} = \text{Adoption Area} \times \text{Practice Emission Reduction Factor}$$
  (e.g., solar water pumps replacing diesel pump sets; direct seeded rice replacing continuous flooding).
- **Mandatory Disclaimer:** Umbrella outputs **"Estimated Emissions Avoided (tCO₂e)"** and strictly does **NOT** claim certified carbon offsets, tradable credits, or guaranteed carbon monetization.

#### 7. What exact Umbrella interface should isolate it?
- Interface: `CarbonBenefitEngine`.
- Implementation: `ProxyEmissionsAvoidedEngine`.

#### 8. What dependencies would it introduce?
- Zero external dependencies.

---

## 3. Comparative Audit Synthesis Matrix

| Repository | Upstream License | Upstream Tech | Practical Feasibility | Umbrella Role | Integration Strategy | Isolating Interface |
|:---|:---|:---|:---|:---|:---|:---|
| **CGIAR Climate Toolkit** | MIT | Python / GEE / xarray | Medium (GEE auth barrier) | Historical climate baseline | **ADAPTED / LOCAL_DATASET** | `ClimateDataProvider` (`CGIARClimateProvider`) |
| **Open-Meteo** | AGPL-3.0 / CC-BY 4.0 API | Swift / REST | High (Instant REST calls) | 3–7 day weather forecast | **INTEGRATED** | `WeatherProvider` (`OpenMeteoWeatherProvider`) |
| **climate_indices** | BSD-3-Clause | Python / Numba / Scipy | Medium (Requires 30y history) | Drought calculation (SPI/SPEI) | **PLANNED** (Post-MVP) | `HazardEngine` (`ClimateIndicesDroughtEngine`) |
| **Apache Fineract** | Apache-2.0 | Java / Spring Boot | Low (Enterprise Java platform) | Microfinance domain model | **REFERENCED / PLANNED** | `PortfolioProvider` (`SyntheticPortfolioProvider`) |
| **CLIMADA** | GPL-3.0 | Python / Cartopy / GDAL | Low (Strict GPL copyleft) | Decoupled priority triage | **ADAPTED** (Concepts only) | `PortfolioImpactEngine` |
| **FLOODPY** | GPL-3.0 | Python / ESA SNAP / PyTorch | Low (Heavy SAR preprocessing) | Observed flood verification | **PLANNED** (Ex-post audit) | `ObservedFloodValidator` |
| **UNDP India DiCRA** | MIT | GeoJSON / Python | High (Static layer profiles) | India agricultural vulnerability | **REFERENCED / PLANNED** | `VulnerabilityDataProvider` |
| **moja global FLINT** | MPL-2.0 | C++ / CMake / Boost | Low (Enterprise C++ simulator) | Carbon accounting rigor | **REFERENCED** (Methodology only)| `RecommendationEngine` |

---

## 4. Key Architectural & Operational Guidelines

1. **Immediate Execution & Decoupled Pipeline:**
   - Active Weather Provider: `OpenMeteoWeatherProvider` calling the public endpoint (`LIVE` mode with explicit `MOCK` fallback).
   - Active Historical Climate: `CGIARClimateProvider` using packaged 30-year climatological baseline normal tables (`LOCAL_DATASET`).
   - Active Physical Flood Hazard: `FloodHazardEngine` computing pure environmental flood hazard (0–100) with zero portfolio contamination.
   - Active Portfolio Provider: `SyntheticPortfolioProvider` generating deterministic, realistic village-level borrower groups (explicitly labelled `SYNTHETIC`).
   - Active Operational Priority: `PortfolioImpactEngine` combining separate hazard and exposure into an operational attention index.
   - Active Decision Support: `RecommendationEngine` providing non-prescriptive advisories for human officer review (`PENDING_REVIEW`).

2. **Strict Copyleft Quarantine:**
   - No GPL-3.0 code from CLIMADA or FLOODPY may be copied or distributed inside Umbrella.
   - No AGPL-3.0 code from Open-Meteo server may be embedded; only the public HTTP REST API is consumed.

3. **Attribution & Notice Management:**
   - Maintain third-party notices in `docs/OPEN_SOURCE_REUSE.md`.
   - Display required attributions in API responses and frontend views ("Weather data by Open-Meteo.com").
