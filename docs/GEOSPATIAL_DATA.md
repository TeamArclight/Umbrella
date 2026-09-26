# Geospatial Data and Boundary Documentation

## 1. Overview

Umbrella integrates official, validated geospatial data to model real Indian administrative units and operational rural clusters. The primary pilot geography is **Darbhanga District, Bihar**, modeled at two hierarchical tiers:
1. **District Administrative Boundary**: Full boundary polygon (`district.geojson`).
2. **Operational Village / Block Clusters**: Point features (`villages.geojson`) with detailed physical terrain, drainage, and agricultural attributes.

---

## 2. District Boundary Specifications

- **District**: Darbhanga
- **State**: Bihar, India
- **OSM Relation ID**: `1568263` (`admin_level=5`, `boundary=administrative`)
- **License**: Open Data Commons Open Database License (ODbL) 1.0 (© OpenStreetMap contributors)
- **Geometry Type**: GeoJSON `Polygon` / `FeatureCollection`
- **Bounding Box**:
  - Minimum Longitude: $85.6766766^\circ \text{E}$
  - Maximum Longitude: $86.4161211^\circ \text{E}$
  - Minimum Latitude: $25.7195614^\circ \text{N}$
  - Maximum Latitude: $26.4464342^\circ \text{N}$
- **File Location**: `data/geography/bihar/darbhanga/district.geojson`

---

## 3. Operational Village Clusters (Darbhanga Pilot)

Umbrella models 10 real operational clusters representing the district's diverse geographic sub-regions (headwater streams, central river corridors, and southern wetland saucer depressions):

| Cluster ID | Block / Village Name | Latitude | Longitude | Elevation (AMSL) | Slope (%) | Drainage Index (0–1) | Nearest River & Distance | Dominant Crop | Crop Stage Susceptibility |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :---: |
| `VIL-DAR-HAY` | **Hayaghat** | $26.0370^\circ \text{N}$ | $85.9117^\circ \text{E}$ | 46.0 m | 0.3% | 0.15 (Poor) | Bagmati River (0.4 km) | Kharif Paddy & Makhana | 0.90 |
| `VIL-DAR-BAH` | **Bahadurpur** | $26.0908^\circ \text{N}$ | $85.9943^\circ \text{E}$ | 45.0 m | 0.4% | 0.20 (Poor) | Bagmati / Adhwara (1.2 km) | Kharif Paddy & Maize | 0.85 |
| `VIL-DAR-KEO` | **Keoti** | $26.2947^\circ \text{N}$ | $85.9465^\circ \text{E}$ | 54.0 m | 0.6% | 0.35 (Moderate) | Khiroi River (2.1 km) | Paddy & Wheat | 0.75 |
| `VIL-DAR-SIN` | **Singhwara** | $26.1915^\circ \text{N}$ | $85.7628^\circ \text{E}$ | 48.0 m | 0.5% | 0.30 (Moderate) | Khiroi / Western Basin (2.8 km) | Paddy & Mustard | 0.75 |
| `VIL-DAR-BIR` | **Biraul** | $25.9565^\circ \text{N}$ | $86.1801^\circ \text{E}$ | 42.0 m | 0.2% | 0.12 (Severe) | Kamala Balan (0.9 km) | Paddy & Makhana | 0.92 |
| `VIL-DAR-KUS` | **Kusheshwar Asthan** | $25.8301^\circ \text{N}$ | $86.2664^\circ \text{E}$ | 42.0 m | 0.2% | 0.10 (Severe) | Kamala-Balan & Kareh (0.5 km) | Paddy & Wetland Fisheries | 0.95 |
| `VIL-DAR-BEN` | **Benipur** | $26.0754^\circ \text{N}$ | $86.1245^\circ \text{E}$ | 52.0 m | 0.5% | 0.40 (Fair) | Kamala Balan Canal (2.4 km) | Paddy & Maize | 0.70 |
| `VIL-DAR-JAL` | **Jale** | $26.3563^\circ \text{N}$ | $85.7690^\circ \text{E}$ | 51.0 m | 0.7% | 0.45 (Fair) | Adhwara Streams (1.6 km) | Paddy & Vegetables | 0.65 |
| `VIL-DAR-MAN` | **Manigachhi** | $26.1815^\circ \text{N}$ | $86.1449^\circ \text{E}$ | 50.0 m | 0.5% | 0.40 (Fair) | Kamala Overflow (3.1 km) | Paddy & Pulses | 0.70 |
| `VIL-DAR-HAN` | **Hanuman Nagar** | $26.1531^\circ \text{N}$ | $85.9068^\circ \text{E}$ | 52.0 m | 0.4% | 0.25 (Poor) | Bagmati Loop (1.5 km) | Paddy & Maize | 0.80 |

- **File Location**: `data/geography/bihar/darbhanga/villages.geojson`

---

## 4. Mathematical Containment Verification

Every cluster coordinate is verified to reside strictly within the official Darbhanga district boundary polygon via standard 2D ray-casting point-in-polygon testing:

$$\text{RayCastingContainment}(\text{lon}_i, \text{lat}_i, \mathcal{P}_{\text{Darbhanga}}) = \text{True} \quad \forall i \in \{1, \dots, 10\}$$

Automated regression tests in `tests/test_geography.py` continuously validate this geometric property against any unintentional coordinate drift.

---

## 5. Metadata and Elevation Calibration

- **Digital Elevation Model (DEM)**: Copernicus DEM GLO-90m (30m/90m spatial resolution) sampled via Open-Meteo Elevation API.
- **Topographical Slopes**: Derived from regional digital elevation gradients.
- **Drainage Efficiency Indices**: Calibrated from Bihar State Disaster Management Authority (BSDMA) District Disaster Management Plan flood-hazard micro-zonation tables.
