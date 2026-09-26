# Historical Event Replay: Methodology and Architecture

## 1. Overview and Scientific Motivation

The **Historical Event Replay Engine** enables Umbrella to evaluate historical disaster events retrospectively, testing how the early warning pipeline would have behaved day-by-day during documented extreme climate events.

### Core Scientific Principles:
1. **Retrospective Causality (Anti-Leakage Guarantee)**:
   A decision-support model evaluated at point in time $T_{\text{snap}}$ must NEVER look into the future. For any evaluation at date $T_{\text{snap}}$, the engine strictly restricts meteorological, hydrological, and environmental inputs to dates $t \le T_{\text{snap}}$. Future peak rainfall, embankment breach occurrences, and post-peak water retreat are mathematically inaccessible.
2. **Honest Provenance (`data_source_mode: REANALYSIS`)**:
   Retrospective ECMWF ERA5 and ERA5-Land reanalysis is strictly labelled `REANALYSIS` or `RETROSPECTIVE_REANALYSIS`. It is never misrepresented as `LIVE` or `ARCHIVED_FORECAST`. Umbrella does not claim to have "predicted" a historical event with foresight; it proves that the model responds accurately when driven by reconstructed meteorological observations.
3. **Preservation of Genuine Non-Monotonic Fluctuations**:
   Real-world weather does not monotonically increase. Precipitation spikes during convective bursts and subsides between bands. Artificial smoothing or monotonic forcing is scientifically fraudulent. Umbrella preserves genuine daily fluctuations while capturing antecedent soil moisture buildup.
4. **Physical Hazard Decoupling**:
   A village's physical flood hazard score (0–100) depends exclusively on meteorological accumulation, downpour intensity, soil saturation, climatological anomaly, and physical terrain drainage. It does NOT increase simply because a microfinance institution disburses more loans in that village.

---

## 2. Chronological Snapshot Timeline: July 2020 Darbhanga Flood (`IND-BIH-2020-07`)

The benchmark replay evaluates six standardized time snapshots relative to the event peak date ($T_0 = \text{July 24, 2020}$):

| Snapshot | Date | Offset | Real-World Environmental Context | ERA5 5-Day Rainfall | Soil Moisture | Simulated Hazard Score (Hayaghat) | Hazard Level |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| **$T-7$** | `2020-07-17` | -7 days | Pre-flood baseline; normal river levels; soil moisture building up. | 33.8 mm | 0.38 $\text{m}^3/\text{m}^3$ | **27.4 / 100** | `MODERATE` |
| **$T-5$** | `2020-07-19` | -5 days | Onset of intense monsoon downpours across Nepal terai and North Bihar. | 75.6 mm | 0.40 $\text{m}^3/\text{m}^3$ | **56.8 / 100** | `HIGH` |
| **$T-3$** | `2020-07-21` | -3 days | Severe cloudburst; single-day peak rainfall reaches 55.5 mm/day. Catchments primed. | 164.4 mm | 0.43 $\text{m}^3/\text{m}^3$ | **83.1 / 100** | `SEVERE` |
| **$T-1$** | `2020-07-23` | -1 day | Hydrodynamic pressure crests; Kamla Balan crosses DL by 2.45 m; NH-527C cut off near Keoti. | 190.0 mm | 0.43 $\text{m}^3/\text{m}^3$ | **86.4 / 100** | `SEVERE` |
| **$T_0$ (Peak)** | `2020-07-24` | 0 days | CWC Hayaghat gauge surpasses all-time record reaching 50.82 m (+2.14 m above DL). Embankment breached at Dewasi. Railway line submerged. | 160.0 mm | 0.42 $\text{m}^3/\text{m}^3$ | **85.7 / 100** | `SEVERE` |
| **$T+3$** | `2020-07-27` | +3 days | Local rain decreases to 19 mm/day; extensive backwater spread into Kusheshwar Asthan and Biraul saucer depressions (*chaurs*). | 79.5 mm | 0.42 $\text{m}^3/\text{m}^3$ | **68.2 / 100** | `HIGH` |

---

## 3. Anti-Leakage Implementation

The anti-leakage mechanism is enforced at the interface level in `HistoricalWeatherProvider.get_snapshot_weather`:

```python
def get_snapshot_weather(
    self,
    latitude: float,
    longitude: float,
    snapshot_date: date,
    lookback_days: int = 5,
) -> UmbrellaWeatherForecast:
  start_date = snapshot_date - timedelta(days=lookback_days - 1)
  # Lookback window terminates STRICTLY on snapshot_date
  return self.get_historical_weather(
      latitude=latitude,
      longitude=longitude,
      start_date=start_date,
      end_date=snapshot_date,
  )
```

In `HistoricalEventReplayEngine.evaluate_snapshot`, causality is verified defensively:

```python
# Defense against future data leakage
for df in weather.daily_forecasts:
  if df.forecast_date > snapshot_date:
    raise ValueError(
        f"ANTI-LEAKAGE BREACH: Weather forecast contains date"
        f" {df.forecast_date} which is after snapshot date {snapshot_date}."
    )
```

---

## 4. Decoupling Verification

To mathematically prove decoupling, `HistoricalEventReplayEngine` tests identical environmental parameters against two vastly different portfolio scales:
- **Village A (Small MFI Portfolio)**: ₹1.0 Lakh ($0.05\times$ scale multiplier)
- **Village B (Large MFI Portfolio)**: ₹80.0 Lakh ($40.0\times$ scale multiplier)

### Output Comparison:
- **Village A**: Physical Hazard Score = **85.7 / 100** (`SEVERE`)
- **Village B**: Physical Hazard Score = **85.7 / 100** (`SEVERE`)
- **Physical Hazard Delta**: **0.00** (Zero variance)
- **Operational Priority Score**:
  - Village A: Priority Score = **53.8 / 100** (`MEDIUM`)
  - Village B: Priority Score = **89.4 / 100** (`CRITICAL`)

This proves that financial portfolio balance influences **where the MFI directs field agents first**, but has **zero influence on physical hazard evaluation**.

---

## 5. REST API Usage

### Replay Single Village Across Entire Timeline
```http
GET /api/v1/events/IND-BIH-2020-07/replay/VIL-DAR-HAY?lookback_days=5
```

### Replay All Operational Clusters in District at Peak Flood
```http
GET /api/v1/events/IND-BIH-2020-07/replay?lookback_days=5&snapshot_date=2020-07-24
```

### Fetch Remote Sensing Observational Validation Report
```http
GET /api/v1/events/IND-BIH-2020-07/evidence
```
