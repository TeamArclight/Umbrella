# Climate Impact & Emissions Avoidance Methodology

## 1. Principles & Dual-Track Evaluation

Umbrella evaluates climate impact through two strictly separated tracks:
1. **Primary Adaptation & Operational Resilience**: Physical loss prevention, household livelihoods protected, grain storage secured, and farm water reliability.
2. **Defensible Activity-Based Emissions Avoided**: Quantified operational proxies based on empirical conversion factors.

### Critical Regulatory & Market Boundary
> [!CAUTION]
> **Umbrella produces uncertified operational proxies (`ESTIMATED_EMISSIONS_AVOIDED`), NOT certified carbon credits.**
> These estimates cannot be monetized, traded on voluntary carbon exchanges (e.g., Verra, Gold Standard), or used for compliance offsets without formal Project Design Document (PDD) submission, baseline monitoring, and independent Third-Party Validation and Verification Body (VVB) accreditation.

---

## 2. Integrated Impact Methodologies

Umbrella embeds two peer-reviewed, institutional methodologies:

```
                                 [ Resilience Intervention ]
                                              │
         ┌────────────────────────┬───────────┴───────────┬────────────────────────┐
         ▼                        ▼                       ▼                        ▼
 [ UNFCCC AMS-I.A Proxy ]  [ FAO Post-Harvest ]   [ Solar Drying Proxy ]   [ Micro-Drip Benchmark ]
 - Solar Irrigation Pump   - Hermetic Grain Silo  - Portable Solar Dryer   - Micro-Drip Irrigation
 - 650 L diesel displaced  - 240 kg grain saved   - 96 kg spoilage saved   - 180 L diesel saved
 - 1.74 tCO₂e/yr           - 0.28 tCO₂e/yr        - 0.11 tCO₂e/yr          - 0.48 tCO₂e/yr
 - IPCC EFDB (2.68 kg/L)   - FAO Spoilage (1.15)  - FAO Biomass (1.15)     - IPCC EFDB (2.68 kg/L)
```

> **Pure Adaptation Non-Fabrication Rule**: Non-mitigation interventions—specifically **Raised Community Livestock Shelters** and **Drainage Culverts & Bunding**—are labeled `mitigation_supported: false` and `NOT_APPLICABLE`. Umbrella explicitly refuses to fabricate synthetic carbon offsets for pure climate adaptation assets.

### 2.1 Solar Irrigation Pump (UNFCCC AMS-I.A Methodology-Informed Proxy)
- **Scope**: Small-scale diesel pump replacement with 2–3 HP solar photovoltaic array.
- **Activity Data**: 650 liters diesel displaced per year (typical operational load for 1–2 hectare smallholder irrigation in North Bihar).
- **Formula**:
  $$\text{Emissions Avoided (tCO}_2\text{e/yr)} = \frac{650 \text{ L/yr} \times 2.68 \text{ kg CO}_2\text{e/L}}{1000} = 1.742 \text{ tCO}_2\text{e/yr}$$
- **Emission Factor**: $2.68 \text{ kg CO}_2\text{e/liter}$ (IPCC Guidelines for National Greenhouse Gas Inventories, Vol 2: Energy).

### 2.2 Raised Hermetic Grain Silo (FAO/ICRISAT Post-Harvest Waste Proxy)
- **Scope**: Post-harvest cereal preservation in flood-prone saucer basins, eliminating monsoonal floodwater soak and anaerobic decomposition.
- **Activity Data**: 1,500 kg capacity silo; prevents 16% rotting loss (240 kg cereal grain preserved annually).
- **Formula**:
  $$\text{Emissions Avoided (tCO}_2\text{e/yr)} = \frac{240 \text{ kg saved} \times 1.15 \text{ kg CO}_2\text{e/kg}}{1000} = 0.276 \text{ tCO}_2\text{e/yr}$$
- **Emission Factor**: $1.15 \text{ kg CO}_2\text{e/kg}$ decayed biomass (FAO Food Wastage Footprint: Impacts on Natural Resources, 2013).

### 2.3 Portable Solar Conduction Dryer (Indicative Biomass Spoilage Proxy)
- **Scope**: Rapid solar drying of chili, turmeric, and vegetables, preventing high-humidity mold rot.
- **Scientific Clarification**: Previously referenced against UNFCCC AMS-I.E; corrected because AMS-I.E strictly governs thermal biomass energy/cookstoves, not agricultural drying. Model uses an indicative post-harvest biomass waste reduction proxy.
- **Activity Data**: 800 kg produce processed/year; prevents 12% moisture decay (96 kg crop preserved).
- **Formula**:
  $$\text{Emissions Avoided (tCO}_2\text{e/yr)} = \frac{96 \text{ kg saved} \times 1.15 \text{ kg CO}_2\text{e/kg}}{1000} = 0.110 \text{ tCO}_2\text{e/yr}$$

### 2.4 Micro-Drip Irrigation Kit (Indicative Agricultural Pumping Benchmark)
- **Scope**: Gravity-fed low-pressure drip irrigation reducing pumping water requirement by 60%.
- **Activity Data**: Saves 180 liters of diesel fuel annually across a 0.5-acre vegetable parcel.
- **Formula**:
  $$\text{Emissions Avoided (tCO}_2\text{e/yr)} = \frac{180 \text{ L/yr} \times 2.68 \text{ kg CO}_2\text{e/L}}{1000} = 0.482 \text{ tCO}_2\text{e/yr}$$
- **Note**: Transparent physical calculation without arbitrary additive constants.

---

## 3. Assumptions & Provenance Taxonomy

Every parameter utilized by the impact engine is explicitly labeled:

| Parameter | Value | Provenance Class | Source Citation / Justification |
| :--- | :--- | :--- | :--- |
| Diesel Emission Factor | $2.68 \text{ kg CO}_2\text{e/L}$ | `SOURCED` | IPCC Emission Factor Database (EFDB), stationary/mobile ag diesel. |
| India Eastern Grid Factor | $0.71 \text{ kg CO}_2\text{e/kWh}$ | `SOURCED` | CEA India CO2 Baseline Database v19 (Eastern Region). |
| Rice Embodied Footprint | $0.85 \text{ kg CO}_2\text{e/kg}$ | `SOURCED` | IRRI & FAO Global Food Losses and Waste LCA studies for South Asia. |
| Monsoonal Grain Loss Baseline | $15.0\%$ | `SOURCED` | ICAR & State Agricultural Universities Bihar Post-Harvest Surveys. |
| Silo Loss Reduction Factor | $95.0\%$ | `DERIVED` | Hermetic sealed silos prevent $\sim 95\%$ of flood and pest loss. |
| Solar Pump Diesel Displacement | $350 \text{ L/yr}$ | `DERIVED` | 2 HP pump operating 250 irrigation hours/year displacing diesel pump. |
| Carbon Price Sensitivity Range | \$5 – \$50 / $\text{tCO}_2\text{e}$ | `DEMO_ASSUMPTION` | Illustrative scenario range for blended finance and donor concession modeling. Default baseline \$15/$\text{tCO}_2\text{e}$. |
| USD to INR Exchange Rate | ₹83.0 / \$1 | `DEMO_ASSUMPTION` | Standard illustrative FX benchmark for currency conversion. |

---

## 4. Illustrative Carbon Sensitivity Modeling

For MFI sustainability committees, ESG investors, and blended finance facilities, Umbrella provides an interactive sensitivity model to evaluate hypothetical co-financing potential:

$$\text{Illustrative Carbon Value (USD)} = \text{Annual Emissions Avoided (tCO}_2\text{e)} \times P_{\text{carbon}}$$

$$\text{Illustrative Carbon Value (INR)} = \text{Illustrative Carbon Value (USD)} \times 83.0$$

- **Disclaimers Embedded in All Reports & Views**:
  - "Illustrative economic proxy only. Not certified carbon credits."
  - "Carbon revenues cannot be factored into borrower creditworthiness assessments or collateral calculations."
