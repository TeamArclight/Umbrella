# FLOOD HAZARD MODEL V1.0 SPECIFICATION

**Document Version:** 1.0.0  
**Status:** Implemented and Verified  
**Model Identifier:** `Flood Hazard Model v1.0`  
**Target Phenomenon:** Short-Range Flood Exposure Risk (Flash waterlogging, agricultural inundation, and catchment backwater)

---

## 1. Overview & Scientific Design

Flood Hazard Model v1.0 calculates an explainable, pure physical flood hazard score on a scale of **$0$ to $100$**.

The model evaluates meteorological forecasts, historical climatological extremes, and geographic terrain susceptibility. In accordance with Umbrella's core architectural principle, **zero microfinance portfolio metrics** (loan capital, borrower counts, repayment statuses) enter this calculation.

```
Forecast Accumulation (0.35) ──┐
Peak Intensity Burst  (0.25) ──┤
Soil Saturation       (0.15) ──┼──► Sum of Contributions ──► Composite Hazard Score (0–100)
Climate Anomaly       (0.10) ──┤
Terrain Drainage      (0.15) ──┘
```

---

## 2. Mathematical Formulation & Component Breakdown

The composite flood hazard score is the linear sum of five normalized physical components:

$$\text{Hazard Score} = \sum_{i=1}^5 \text{Contribution}_i = \sum_{i=1}^5 (\text{Normalized Score}_i \times \text{Weight}_i)$$

Where $\sum_{i=1}^5 \text{Weight}_i = 0.35 + 0.25 + 0.15 + 0.10 + 0.15 = 1.00$.

| # | Component Name | Raw Measurement | Normalization Formula | Weight | Physical Rationale |
|:---|:---|:---|:---|:---:|:---|
| **1** | **Forecast Accumulation** | $R_{\text{cum}}$: Cumulative rainfall over horizon ($\text{mm}$) | $\min\left(100, \frac{R_{\text{cum}}}{1.5 \times \text{P95}_{\text{daily}}} \times 100\right)$ | **0.35** | Sustained multi-day volume exceeds root zone capacity and local drainage ditches. |
| **2** | **Peak Intensity Burst** | $R_{\text{peak}}$: Maximum single-day precipitation ($\text{mm/day}$) | If $R_{\text{peak}} \ge \text{P99} \implies 100$<br>If $R_{\text{peak}} \ge \text{P95} \implies 70 + \frac{R_{\text{peak}} - \text{P95}}{\text{P99} - \text{P95}} \times 30$<br>Else $\implies \frac{R_{\text{peak}}}{\text{P95}} \times 70$ | **0.25** | Short-duration deluge overwhelms bunds, causing flash waterlogging regardless of multi-day totals. |
| **3** | **Soil Saturation** | $\theta$: Volumetric topsoil water content ($0-10\text{cm}$) in $m^3/m^3$ | $\min\left(100, \max\left(0, \frac{\theta - 0.15}{0.45 - 0.15} \times 100\right)\right)$ | **0.15** | Pre-saturated soils lose water infiltration capacity, translating incoming rain into immediate surface runoff. |
| **4** | **Climate Anomaly** | $A$: Ratio of forecast rainfall to 30-year expected normal | $\min\left(100, \frac{A}{3.0} \times 100\right)$ | **0.10** | Unseasonal deviations (e.g. $3\times$ seasonal average) catch farmers unprepared mid-season. |
| **5** | **Terrain Susceptibility** | $D$: Drainage capacity ($0-1$)<br>$S$: Slope gradient ($\%$)<br>$P$: River proximity ($\text{km}$) | $\text{Risk} = (1 - D) \times 60 + \max\left(0, \frac{3 - S}{3}\right) \times 30 + \max\left(0, \frac{5 - P}{5}\right) \times 10$<br>Score $= \min(100, \text{Risk})$ | **0.15** | Low-lying basins, flat slopes ($<1\%$), and river proximity retain floodwaters. |

---

## 3. Supported Temporal Horizons

The model supports three explicit forecast horizons:
- `3 DAYS` (`NEXT_3_DAYS`): Flash flood and acute downpour early warning.
- `5 DAYS` (`NEXT_5_DAYS`): Standard operational planning and center-meeting scheduling window.
- `7 DAYS` (`NEXT_7_DAYS`): Medium-range regional hydrological advisory.

Requests specifying unsupported horizons (e.g., 10 or 14 days) are rejected with `HTTP 400 Bad Request`.

---

## 4. Severity Classification Thresholds

| Hazard Score Range | Severity Level | Physical Meaning |
|:---:|:---:|:---|
| **$0.0 - 24.9$** | **`LOW`** | Rainfall and moisture within normal historical tolerances; regular runoff. |
| **$25.0 - 49.9$** | **`MODERATE`** | Elevated rainfall; localized ponding possible in low spots and unpaved farm roads. |
| **$50.0 - 74.9$** | **`HIGH`** | Significant waterlogging expected; field inundation likely in poorly drained soils. |
| **$75.0 - 100.0$** *(or peak $\ge$ P99)* | **`SEVERE`** | Severe flood risk; crop submergence, breached bunds, and village access disruptions. |

---

## 5. End-to-End Reproducibility Example

Given Village `Sirikonda` (`VIL-TEL-001`) with a 5-day forecast during peak monsoon:
- Forecast Cumulative Rainfall: $150.0\text{ mm}$
- Peak Single-Day Rain: $60.0\text{ mm}$
- Historical P95 Threshold: $65.0\text{ mm}$, Historical P99: $110.0\text{ mm}$
- Topsoil Moisture: $0.350\text{ m}^3/\text{m}^3$
- Historical Monthly Mean: $280.0\text{ mm}$ (Expected 5-day baseline $= 46.7\text{ mm}$, Anomaly Ratio $= 3.21$)
- Terrain Drainage Index: $0.35$, Slope: $1.2\%$, River Distance: $3.5\text{ km}$

Component calculations:
1. Accumulation: $\text{Norm} = 100.0 \implies \text{Contrib} = 100.0 \times 0.35 = \mathbf{35.00}$
2. Peak Intensity: $\text{Norm} = 64.62 \implies \text{Contrib} = 64.62 \times 0.25 = \mathbf{16.15}$
3. Soil Saturation: $\text{Norm} = 66.67 \implies \text{Contrib} = 66.67 \times 0.15 = \mathbf{10.00}$
4. Climate Anomaly: $\text{Norm} = 100.0 \implies \text{Contrib} = 100.0 \times 0.10 = \mathbf{10.00}$
5. Terrain Susceptibility: $\text{Norm} = 60.00 \implies \text{Contrib} = 60.00 \times 0.15 = \mathbf{9.00}$

$$\text{Final Hazard Score} = 35.00 + 16.15 + 10.00 + 10.00 + 9.00 = \mathbf{80.2} \implies \mathbf{SEVERE}$$

Every element is exposed in the API response under `components` for third-party auditability.

---

## 6. Historical Replay Mode: `Flood Hazard Model Historical Replay v1.0`

When running retrospective simulations over historical benchmarks (e.g. `IND-BIH-2020-07`), the model operates in historical replay mode:
1. **Mathematical Identicality**: Uses identical component weights ($0.35, 0.25, 0.15, 0.10, 0.15$) and normalization functions.
2. **Reanalysis Driving Data**: Driven by ECMWF ERA5 and ERA5-Land reanalysis (`data_source_mode: REANALYSIS`) across the lookback window $[T - 4, T]$.
3. **Causal Anti-Leakage**: Weather records beyond snapshot date $T$ are strictly forbidden.
4. **Empirical Ground Truth Alignment**: In Hayaghat (`VIL-DAR-HAY`), the model evaluates:
   - $T-7$ (`2020-07-17`): **27.4 / 100** (`MODERATE`)
   - $T-5$ (`2020-07-19`): **56.8 / 100** (`HIGH`)
   - $T-3$ (`2020-07-21`): **83.1 / 100** (`SEVERE`)
   - $T-1$ (`2020-07-23`): **86.4 / 100** (`SEVERE`)
   - $T_0$ (`2020-07-24`): **85.7 / 100** (`SEVERE`)
   - $T+3$ (`2020-07-27`): **68.2 / 100** (`HIGH`)

This directly mirrors the physical hydrograph of the Bagmati river at CWC Hayaghat, which crested at 50.82 m (+2.14 m above Danger Level) on July 25, 2020.

