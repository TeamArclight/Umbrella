# Umbrella Demo Dataset & Deterministic Seed Catalog

**Platform:** Umbrella Climate-Adaptive Microfinance Platform  
**Target Repository:** `TeamArclight/Umbrella`  
**Pilot District:** Darbhanga District, Bihar, India (`IND-BIH-2020-07`)  
**Reset Endpoint:** `POST /api/v1/demo/reset`  

---

## 1. Overview & Data Philosophy

To ensure repeatable, bulletproof live demonstrations for hackathon judges, investment committees, and partner MFIs, Umbrella embeds a **100% deterministic demo dataset**.

- **Geographic Layer**: 10 real operational administrative clusters across Darbhanga District, grounded in official Census 2011 coordinates and SRTM terrain attributes.
- **Meteorological Layer**: Real Open-Meteo NWP forecasts (live) and verified Copernicus ERA5 retrospective reanalysis (historical July 2020 flood).
- **Portfolio Layer**: Synthetic Joint Liability Groups (JLGs), borrower personas, loan balances, and payment schedules modeled strictly on the RBI 2022 microfinance framework. No real borrower Personally Identifiable Information (PII) is included.

---

## 2. 10 Operational Pilot Clusters (Darbhanga District, Bihar)

| Village ID | Cluster / Block Name | Coordinates (Lat, Lon) | Elevation (m) | Nearest River System | Dominant Agricultural Livelihood | Crop Flood Vulnerability | Historical July 2020 Impact |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `VIL-DAR-HAY` | **Hayaghat** | 26.0370°N, 85.9117°E | 46.0 m | Bagmati River (0.4 km) | Paddy & Makhana | 0.90 | Bagmati breached Left Embankment at Dewasi; Railway Bridge 16 submerged. |
| `VIL-DAR-BAH` | **Bahadurpur** | 26.0908°N, 85.9943°E | 45.0 m | Bagmati / Adhwara (1.2 km) | Paddy & Maize | 0.85 | Backwater flooding from Bagmati overflow; suburban paddy fields inundated. |
| `VIL-DAR-KEO` | **Keoti** | 26.2947°N, 85.9465°E | 54.0 m | Khiroi River (2.1 km) | Paddy & Wheat | 0.75 | National Highway 527C submerged, severing northern emergency transit. |
| `VIL-DAR-SIN` | **Singhwara** | 26.1915°N, 85.7628°E | 48.0 m | Khiroi / Western Basin (2.8 km) | Paddy & Vegetables | 0.80 | Prolonged surface waterlogging; drainage channels backflowing. |
| `VIL-DAR-BIR` | **Biraul** | 25.9984°N, 86.1432°E | 44.0 m | Kamala Balan (0.8 km) | Paddy & Fisheries | 0.92 | Kamala Balan embankment breached at Madanpur; severe saucer inundation. |
| `VIL-DAR-KUS` | **Kusheshwar Asthan** | 25.8242°N, 86.1367°E | 41.0 m | Kosi-Kamala Confluence (0.5 km) | Fisheries & Livestock | 0.95 | Deepest wetland depression in North Bihar; waterlogged for 45+ days. |
| `VIL-DAR-BEN` | **Benipur** | 26.0521°N, 86.1458°E | 47.0 m | Kamala Tributary (3.2 km) | Paddy & Pulses | 0.70 | Embankment seepage into agricultural lowlands; standing crops choked. |
| `VIL-DAR-JAL` | **Jale** | 26.3682°N, 85.8324°E | 58.0 m | Adhwara System (1.9 km) | Maize & Paddy | 0.65 | Flash hill runoff from Nepal foothills; rapid crest and drainage. |
| `VIL-DAR-MAN` | **Manigachhi** | 26.2341°N, 86.1873°E | 49.0 m | Kamala Balan Western (2.4 km) | Paddy & Horticulture | 0.75 | Inundation of seed nurseries and vegetable patches along canals. |
| `VIL-DAR-HAN` | **Hanuman Nagar** | 25.9612°N, 85.8241°E | 45.0 m | Bagmati Southern (1.1 km) | Paddy & Dairy | 0.88 | Breached floodwaters overflowing into residential courtyards and cattle sheds. |

---

## 3. Resilience Interventions Catalog (6 Assets)

| Intervention ID | Name | Category | Indicative Cost (₹) | Target Hazard | Supported Livelihoods | Mitigation Supported | Indicative Emissions Proxy |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: | :---: |
| `raised-hermetic-silo` | Elevated Hermetic Grain Silo | Post-Harvest Storage | ₹15,000 | FLOOD, WATERLOGGING | Paddy, Maize, Makhana | **YES** | 0.276 tCO2e/yr (FAO proxy) |
| `portable-solar-dryer` | Portable Solar Conduction Dryer | Post-Harvest Processing | ₹24,000 | FLOOD, HUMIDITY | Vegetables, Spices, Makhana | **YES** | 0.110 tCO2e/yr (Biomass proxy) |
| `flood-livestock-shelter` | Raised Community Livestock Shelter | Livestock Protection | ₹65,000 | FLOOD, EXTREME_HEAT | Dairy, Cattle, Goats | **NO** | `NOT_APPLICABLE` (0.0) |
| `solar-irrigation-pump` | Solar Micro-Irrigation Pump (2-3 HP)| Clean Energy / Irrigation | ₹55,000 | DROUGHT, FLOOD | Paddy, Vegetables, Wheat | **YES** | 1.742 tCO2e/yr (AMS-I.A proxy) |
| `micro-drip-irrigation` | Micro-Drip Irrigation Kit | Water Conservation | ₹18,000 | DROUGHT, WATERLOGGING | Vegetables, Horticulture | **YES** | 0.482 tCO2e/yr (Pumping proxy) |
| `drainage-culvert-improvement` | Farm Drainage Culvert & Raised Bund | Land Drainage | ₹28,000 | FLOOD, WATERLOGGING | Paddy, Vegetables, Fisheries | **NO** | `NOT_APPLICABLE` (0.0) |

---

## 4. Indicative Green Finance Products (3 Offerings)

| Product ID | Product Name | Eligible Interventions | Amount Range (₹) | Annual Interest Rate | Standard Tenure | Grace Period Policy |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `prod-micro-adaptation` | Micro Resilience Loan | Silos, Solar Dryers, Drainage | ₹10,000 – ₹40,000 | 13.5% p.a. | 12 months | 30-day installation grace; flood alert repayment review |
| `prod-solar-equipment` | Productive Solar Asset Loan | Solar Pumps, Solar Dryers | ₹30,000 – ₹80,000 | 12.0% p.a. | 24 months | 60-day installation & commissioning grace period |
| `prod-farm-resilience` | Community Farm & Livestock Credit | Shelters, Drip Kits, Drainage | ₹15,000 – ₹65,000 | 14.0% p.a. | 18 months | 45-day pre-monsoon construction grace window |

---

## 5. Pre-Seeded Flywheel Demonstration Records

To demonstrate every phase of the flywheel without cold-start delay, the system pre-seeds 4 representative records across the lifecycle:

### Record 1: Fully Verified & Measured Flywheel
- **Application ID**: `APP-DAR-HAY-001`
- **Asset ID**: `AST-DAR-HAY-001` (`SILO-HAY-2026-089`)
- **Verification ID**: `VRF-DAR-HAY-001`
- **Cluster**: Hayaghat (`VIL-DAR-HAY`)
- **Borrower**: Sunita Devi (`JLG-HAY-01`), Paddy Farmer
- **Intervention**: Elevated Hermetic Grain Silo (`prod-micro-adaptation`, ₹15,000 loan)
- **Lifecycle Status**: `VERIFIED`
- **Field Evidence**: Inspected by Field Officer Amit Kumar (42 m GPS offset, plinth height 1.25 m verified); confirmed by Branch Manager Sanjay Mishra.
- **Estimated Impact**: 0.276 tCO2e/yr avoided + ₹12,000/yr post-harvest loss prevented.

### Record 2: Pending Field Verification
- **Application ID**: `APP-DAR-KUS-002`
- **Asset ID**: `AST-DAR-KUS-002` (`LIV-KUS-2026-014`)
- **Cluster**: Kusheshwar Asthan (`VIL-DAR-KUS`)
- **Borrower**: Poonam Kumari (`JLG-KUS-02`), Dairy Producer
- **Intervention**: Raised Community Livestock Shelter (`prod-farm-resilience`, ₹50,000 loan)
- **Lifecycle Status**: `VERIFICATION_PENDING` (Pure adaptation asset; mitigation `NOT_APPLICABLE`).

### Record 3: Under Risk Officer Review (Live Decision Demo)
- **Application ID**: `APP-DAR-BIR-003`
- **Cluster**: Biraul (`VIL-DAR-BIR`)
- **Borrower**: Rekha Devi (`JLG-BIR-01`), Paddy Farmer
- **Intervention**: Solar Micro-Irrigation Pump (`prod-solar-equipment`, ₹50,000 loan)
- **Lifecycle Status**: `UNDER_REVIEW` (Ready for live demonstration of human approval/rejection).

### Record 4: Drafted from Early Warning Alert
- **Application ID**: `APP-DAR-GHA-004`
- **Cluster**: Ghanshyampur (`VIL-DAR-GHA`)
- **Borrower**: Meena Devi (`JLG-GHA-03`), Makhana Harvester
- **Intervention**: Portable Solar Dryer (`prod-micro-adaptation`, ₹25,000 loan)
- **Lifecycle Status**: `DRAFT` (Generated automatically from cluster early warning recommendation).

---

## 6. How to Reset the Demo State

During a presentation or between jury evaluations, reset the entire system state to these clean seed records at any time:

```bash
# Via cURL:
curl -X POST http://127.0.0.1:8000/api/v1/demo/reset

# Response:
{
  "status": "RESET_SUCCESSFUL",
  "applications_seeded": 4,
  "assets_seeded": 2,
  "verifications_seeded": 1,
  "timestamp": "2026-09-30T00:36:00Z"
}
```

Or click **"Reset Presentation State"** from the Umbrella Command Center navbar.
