# Historical Data Sources and Remote Sensing Registry

## 1. Meteorological Reanalysis Foundation

### ECMWF ERA5 and ERA5-Land (via Open-Meteo Historical Archive API)
- **Primary Source**: European Centre for Medium-Range Weather Forecasts (ECMWF) Copernicus Climate Change Service (C3S).
- **Access Interface**: Open-Meteo Historical Weather API (`https://archive-api.open-meteo.com/v1/archive`).
- **Spatial Resolution**: $\sim 0.1^\circ \times 0.1^\circ$ ($\sim 9\text{--}11\text{ km}$).
- **Temporal Cadence**: Daily aggregated UTC observations.
- **Variables Retrieved**:
  - `precipitation_sum` ($\text{mm}$): Total daily precipitation.
  - `rain_sum` ($\text{mm}$): Liquid phase precipitation sum.
  - `temperature_2m_max` and `temperature_2m_min` ($^\circ\text{C}$): Air temperature range.
  - `soil_moisture_0_to_7cm_mean` ($\text{m}^3/\text{m}^3$): Volumetric topsoil water content.
  - `wind_speed_10m_max` ($\text{km/h}$): Surface wind speed.
- **Provenance Tag**: `data_source_mode: REANALYSIS` (or `RETROSPECTIVE_REANALYSIS`).
- **Attribution & License**: Creative Commons Attribution 4.0 International (CC-BY 4.0). Reanalysis data by ECMWF and Open-Meteo.com.

---

## 2. Climatological Baseline Foundation

### CHIRPS v2.0 and AgERA5 Climatological Normals (via CGIAR Climate Data Hub Toolkit)
- **Methodology**: Multi-decadal historical rainfall baseline tables (1991–2020 normals) inspired by the open-source CGIAR Climate Data Hub Toolkit.
- **Metrics Tracked**:
  - 30-year monthly mean precipitation ($\text{mm}$).
  - 95th percentile ($P_{95}$) daily downpour threshold ($\text{mm/day}$).
  - 99th percentile ($P_{99}$) extreme downpour threshold ($\text{mm/day}$).
- **License**: MIT License (CGIAR Climate Data Hub). Clean-room algorithmic integration.

---

## 3. Hydrological River Gauges (Central Water Commission - CWC)

Real-world water level gauge records from the Central Water Commission (CWC), Lower Ganga Basin Division, provide empirical ground truth for riverine crests during the July 2020 benchmark flood:

| Gauge Station | River Basin | Warning Level | Danger Level (DL) | Historical HFL | July 2020 Crest (PWL) | Crest Date | Exceedance Above DL | Impact On Embankments & Infrastructure |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Hayaghat** | Bagmati | 47.68 m | 48.68 m | 50.60 m | **50.82 m** | 2020-07-25 | **+2.14 m** | Surpassed all-time historical HFL; Railway Bridge 16 tracks submerged; train operations suspended; breach at Dewasi. |
| **Jhanjharpur** | Kamala Balan | 49.00 m | 50.00 m | 52.85 m | **52.45 m** | 2020-07-23 | **+2.45 m** | High hydrostatic pressure transmitted downstream to Biraul block; breach at Madanpur. |
| **Kamtaul** | Adhwara | 49.00 m | 50.00 m | 52.00 m | **51.70 m** | 2020-07-24 | **+1.70 m** | Spillway overflow into Keoti and Singhwara blocks; NH-527C submerged. |

---

## 4. Remote Sensing and Synthetic Aperture Radar (SAR) Registry

Satellite observations corroborate the spatial extent and timing of surface water inundation across Darbhanga district:

### 4.1 ISRO / NRSC Bhuvan Flood Disaster Management Support Programme
- **Agency**: National Remote Sensing Centre (NRSC), Indian Space Research Organisation (ISRO).
- **Product**: Cumulative and Daily Flood Inundation Maps (Bihar Flood 2020).
- **Key Maps Documented**:
  - `NRSC/2020/22` (Observation Date: 20-Jul-2020): Initial inundation along river channels.
  - `NRSC/2020/23` (Observation Date: 24-Jul-2020): Peak flood extent covering **82,400 hectares** in Darbhanga district alone.
  - `NRSC/2020/24` (Observation Date: 28-Jul-2020): Post-peak waterlogging spreading into southern saucer depressions.

### 4.2 Copernicus Sentinel-1 Synthetic Aperture Radar (SAR)
- **Constellation**: Sentinel-1A and Sentinel-1B (European Space Agency / Copernicus).
- **Sensor**: C-band Synthetic Aperture Radar (SAR) (5.405 GHz).
- **Mode & Polarization**: Interferometric Wide (IW) Swath, Ground Range Detected (GRD), dual polarization ($\text{VV} + \text{VH}$).
- **Relative Orbits over Darbhanga**: Orbit 121 (Ascending) and Orbit 48 (Descending).
- **Scene Acquisition Timeline**:
  - `2020-07-11` (Orbit 121): Pre-flood baseline; normal water bodies and dry agricultural parcels.
  - `2020-07-17` (Orbit 48): Rising water levels in river channels and initial embankment seepage.
  - `2020-07-23` (Orbit 121): Heavy inundation coinciding with embankment breaches at Dewasi and Madanpur.
  - `2020-07-29` (Orbit 48): Peak spatial waterlogging across low-lying saucer basins (Kusheshwar Asthan, Biraul).
- **Validation Status**: `EVIDENCE_AVAILABLE_NOT_PROCESSED` (Registered in Umbrella schema `ObservedFloodValidationResult` with explicit sensor and orbit parameters).

---

## 5. Administrative and Operational Disaster Reports

- **Bihar State Disaster Management Authority (BSDMA)**: Daily Flood Situation Reports (July 15 – August 5, 2020).
- **India Meteorological Department (IMD)**: Daily District Rainfall Bulletins (July 2020).
- **East Central Railway (ECR)**: Circulars announcing passenger train cancellations due to track submergence at Hayaghat Bridge 16 (July 24, 2020).
