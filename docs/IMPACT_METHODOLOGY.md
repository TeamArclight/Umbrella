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
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
 [ UNFCCC AMS-I.A (Small-Scale) ]                       [ FAO Post-Harvest (2021) ]
 - Scope: Solar Pumping & Drying                        - Scope: Hermetic Silos & Drying
 - Baseline: Small diesel pumps & grid                  - Baseline: 15% post-harvest grain loss
 - Formula: Liters saved × 2.68 kg CO₂e/L               - Formula: kg grain saved × 0.85 kg CO₂e/kg
 - Source: IPCC EFDB & CEA India v19                    - Source: FAO & IRRI Cradle-to-Farmgate LCA
```

### 2.1 UNFCCC AMS-I.A: Solar Irrigation & Solar Drying
- **Scope**: Displacement of fossil-fuel combustion (diesel irrigation pumps) and non-renewable grid electricity with stand-alone solar photovoltaic and thermal systems.
- **Formulas**:
  - **Diesel Displacement**:
    $$\text{Emissions Avoided (tCO}_2\text{e/yr)} = \frac{\text{Diesel Displaced (liters/yr)} \times EF_{\text{diesel}}}{1000}$$
    Where $EF_{\text{diesel}} = 2.68 \text{ kg CO}_2\text{e/liter}$ (IPCC Guidelines for National Greenhouse Gas Inventories).
  - **Grid Electricity Displacement**:
    $$\text{Emissions Avoided (tCO}_2\text{e/yr)} = \frac{\text{Electricity Generated (kWh/yr)} \times EF_{\text{grid}}}{1000}$$
    Where $EF_{\text{grid}} = 0.71 \text{ kg CO}_2\text{e/kWh}$ (Central Electricity Authority of India, Eastern Regional Grid CO2 Baseline Database v19).

### 2.2 FAO Post-Harvest Loss Avoidance (2021)
- **Scope**: Reduction of qualitative and quantitative grain storage losses due to monsoon flood inundation, humidity, and weevil infestation using hermetic grain silos.
- **Baseline**: In flood-prone North Bihar districts (e.g., Darbhanga), open bamboo/mud granaries suffer 12–20% post-harvest spoilage during monsoon flooding (FAO / ICAR baseline avg 15%).
- **Formula**:
  $$\text{Emissions Avoided (tCO}_2\text{e/yr)} = \frac{\text{Grain Protected (kg/yr)} \times \Delta\text{Loss Rate} \times EF_{\text{grain}}}{1000}$$
  Where:
  - $\Delta\text{Loss Rate} = 0.15$ (15% loss prevented)
  - $EF_{\text{grain}} = 0.85 \text{ kg CO}_2\text{e/kg paddy rice}$ (Cradle-to-farmgate embodied carbon footprint including field methane, fertilizer, and irrigation energy; IRRI / FAO LCA benchmark).

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
