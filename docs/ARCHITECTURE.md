# UMBRELLA SYSTEM ARCHITECTURE

**Document Version:** 2.0.0  
**Status:** Approved Architectural Baseline  
**Scope:** Core domain decoupling, data flow, interface boundaries, and decision-support contracts.

---

## 1. Foundational Architecture Principle: Strict Decoupling

Umbrella adheres to a **reuse-first but loosely coupled** architecture with a fundamental scientific separation of concerns:

$$\mathbf{Physical\ Climate\ Hazard} \neq \mathbf{Microfinance\ Portfolio\ Exposure} \neq \mathbf{Credit\ Default\ Prediction}$$

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       UMBRELLA CORE PIPELINE                                          │
│                                                                                                       │
│   ┌───────────────────────────┐    ┌───────────────────────────┐    ┌─────────────────────────────┐   │
│   │      WeatherProvider      │    │    ClimateDataProvider    │    │      Physical Terrain       │   │
│   │    (Open-Meteo Hosted)    │    │   (CHIRPS/AgERA5 Normal)  │    │     (Drainage, Slope)       │   │
│   └─────────────┬─────────────┘    └─────────────┬─────────────┘    └──────────────┬──────────────┘   │
│                 │                                │                                 │                  │
│                 └────────────────────────┐       │       ┌─────────────────────────┘                  │
│                                          ▼       ▼       ▼                                            │
│                              ┌───────────────────────────────────────┐                                │
│                              │          FloodHazardEngine            │                                │
│                              │       (Flood Hazard Model v1.0)       │                                │
│                              └───────────────────┬───────────────────┘                                │
│                                                  │                                                    │
│                                                  ▼                                                    │
│                                     ┌─────────────────────────┐                                       │
│                                     │  FloodHazardEvaluation  │ ─────────► [Early Warning Signal]     │
│                                     │ (Pure Physical 0 - 100) │                                       │
│                                     └────────────┬────────────┘                                       │
│                                                  │                                                    │
│  ┌─────────────────────────────────┐             │                                                    │
│  │        PortfolioProvider        │             │                                                    │
│  │ (SyntheticPortfolioProvider)    │             │                                                    │
│  └────────────────┬────────────────┘             │                                                    │
│                   │                              │                                                    │
│                   ▼                              │                                                    │
│  ┌─────────────────────────────────┐             │                                                    │
│  │     PortfolioExposureEngine     │             │                                                    │
│  └────────────────┬────────────────┘             │                                                    │
│                   │                              │                                                    │
│                   ▼                              ▼                                                    │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────────┐                        │
│  │        PortfolioExposure        │──►│        PortfolioImpactEngine        │                        │
│  │       (Capital, Borrowers)      │   │     (PortfolioPriority-v1.0)        │                        │
│  └─────────────────────────────────┘   └──────────────────┬──────────────────┘                        │
│                                                           │                                           │
│                                                           ▼                                           │
│                                                ┌─────────────────────┐                                │
│                                                │PortfolioClimate     │                                │
│                                                │Impact (0 - 100)     │                                │
│                                                └──────────┬──────────┘                                │
│                                                           │                                           │
│                                                           ▼                                           │
│                                                ┌─────────────────────┐                                │
│                                                │RecommendationEngine │                                │
│                                                └──────────┬──────────┘                                │
│                                                           │                                           │
│                                                           ▼                                           │
│                                                ┌─────────────────────┐                                │
│                                                │MFIRecommendation    │                                │
│                                                │Response             │                                │
│                                                │ (Advisory vs Human) │                                │
│                                                └─────────────────────┘                                │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Why Decoupling Matters: The Two-Village Demonstration
A village's physical flood hazard must **never** increase simply because a microfinance institution (MFI) deployed more capital or added borrower groups there:

- **Village A:** Identical rainfall ($175\text{ mm}$), identical drainage, portfolio balance $= \text{₹}2\text{ Lakh}$.
  - Physical Flood Hazard Score $= \mathbf{78/100\ (HIGH)}$.
- **Village B:** Identical rainfall ($175\text{ mm}$), identical drainage, portfolio balance $= \text{₹}80\text{ Lakh}$.
  - Physical Flood Hazard Score $= \mathbf{78/100\ (HIGH)}$.

Their physical hazard scores remain identical ($78 = 78$). Only their **portfolio exposure** and resulting **operational priority score** differ.

---

## 2. Distinct Core Concepts

### A. Physical Flood Hazard (`FloodHazardEvaluation`)
- **Domain:** Pure physical meteorology, surface hydrology, and terrain drainage.
- **Range:** $0 - 100$ (normalized severity index).
- **Constituent Inputs:**
  1. Forecast accumulated precipitation (3, 5, or 7 days)
  2. Peak single-day downpour intensity
  3. Antecedent topsoil saturation ($m^3/m^3$)
  4. Historical climate anomaly ratio relative to 30-year normal
  5. Terrain drainage capacity, topographic slope gradient, and river proximity
- **Strict Prohibition:** Contains **zero** borrower counts, loan balances, JLG structures, or repayment statuses.

### B. Microfinance Portfolio Exposure (`PortfolioExposure`)
- **Domain:** Institutional financial capital and client presence geographically situated in a village node.
- **Metrics:** `borrowers_exposed`, `groups_exposed`, `active_loans_exposed`, `outstanding_amount` (INR), `green_loans_exposed`.
- **Classification:** Strictly marked as `data_type: "SYNTHETIC"`.
- **Notice:** This is not physical climate risk.

### C. Portfolio Climate Impact & Priority (`PortfolioClimateImpact`)
- **Domain:** Operational risk triage answering *"Where should the lender focus attention and deploy field staff first?"*
- **Composition:** Combines the independently computed `hazard_score` ($60\%$ weight) and normalized `portfolio_exposure` ($40\%$ weight).
- **Integrity Guarantee:** Preserves the uncorrupted raw hazard score and raw portfolio exposure amounts in the output. Exposes intermediate calculations transparently.

---

## 3. Explicit Scientific Boundaries

> [!CAUTION]
> **NO BORROWER CREDIT DEFAULT PREDICTION:**  
> Umbrella's MVP does **NOT** predict individual borrower credit default, creditworthiness, or willingness to repay.  
> Actual borrower default modeling requires individual longitudinal repayment logs, credit bureau scores, socioeconomic household surveys, out-of-sample temporal train/test validation, and algorithmic bias auditing.  
> Umbrella strictly computes **geographically exposed portfolio capital** and **climate hazard exposure**.

> [!NOTE]
> **UNCERTIFIED OPERATIONAL CARBON ESTIMATES:**  
> Carbon accounting metrics generated by the recommendation engine are labelled strictly as `ESTIMATED_EMISSIONS_AVOIDED`. They are operational activity proxies (e.g. promoting solar pumps over diesel pump sets) and do not constitute certified carbon credits, offsets, or tradeable commodities.

---

## 4. Human Decision-Support Contract

Umbrella provides **decision-support advisories**, never automated execution of loan contracts:

```
┌───────────────────────────────────────┐
│     SystemRecommendation (Draft)      │
│  - Suggested grace period window      │
│  - Operational advisories             │
│  - Draft SMS alert template           │
│  - Priority review groups             │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│          HumanDecisionRecord          │
│  - status: PENDING_REVIEW             │
│  - reviewed_by: null                  │
│  - approved_grace_period_days: null   │
│  - approved_actions: []               │
│  - reviewer_notes: null               │
└───────────────────────────────────────┘
```

- **Prohibited system language:** *"Grant moratorium"*, *"Approve restructuring"*, *"Change loan contract"*.
- **Approved advisory language:** *"Consider repayment flexibility for affected groups"*, *"Prioritize rapid field assessment"*, *"Send early-warning communication"*.

---

## 5. Historical Event Replay & Ground-Truth Validation Architecture

Version 2.1.0 introduces retrospective disaster replay capabilities, enabling historical simulation over documented extreme flood benchmarks:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              HISTORICAL EVENT REPLAY ENGINE                            │
│                                                                                        │
│  [Historical Event Registry]                                                           │
│  (data/events/flood_events.json)                                                       │
│         │                                                                              │
│         ├── Event ID: IND-BIH-2020-07                                                  │
│         ├── Peak Flood Date: 2020-07-24                                                │
│         └── Snapshots: [T-7, T-5, T-3, T-1, T0, T+3]                                   │
│                                                                                        │
│  [Retrospective Snapshot Evaluation (Anti-Leakage Causality)]                         │
│  For each snapshot T_k:                                                                │
│  ┌─────────────────────────────────┐      ┌─────────────────────────────────────────┐  │
│  │ HistoricalWeatherProvider       │      │ ClimateDataProvider                     │  │
│  │ (Open-Meteo ERA5 / ERA5-Land)   │      │ (CGIAR 30-Year July Climatology)        │  │
│  │ Window: [T_k - 4 days, T_k]     │      └────────────────────┬────────────────────┘  │
│  │ data_source_mode: REANALYSIS    │                           │                       │
│  └────────────────┬────────────────┘                           │                       │
│                   │                                            │                       │
│                   └──────────────────┬─────────────────────────┘                       │
│                                      ▼                                                 │
│                        ┌───────────────────────────┐                                   │
│                        │     FloodHazardEngine     │                                   │
│                        │ (Flood Hazard Model v1.0) │                                   │
│                        └─────────────┬─────────────┘                                   │
│                                      │                                                 │
│                                      ▼                                                 │
│                   [Pure Physical Hazard Score: 0 to 100]                               │
│                                      │                                                 │
│          ┌───────────────────────────┴───────────────────────────┐                     │
│          ▼                                                       ▼                     │
│  ┌───────────────────────────────┐              ┌───────────────────────────────────┐  │
│  │ Independent Synthetic MFI     │              │ ObservedFloodValidator            │  │
│  │ Portfolio Exposure            │              │ (Ground-Truth Remote Sensing)     │  │
│  │ (Strictly SYNTHETIC)          │              ├───────────────────────────────────┤  │
│  └───────────────┬───────────────┘              │ - Copernicus Sentinel-1A/1B SAR   │  │
│                  │                              │   (Acquisitions: Jul 11,17,23,29) │  │
│                  ▼                              │ - ISRO Bhuvan Maps 2020/22-24     │  │
│  ┌───────────────────────────────┐              │ - CWC Hayaghat Gauge (50.82 m)    │  │
│  │ Combined Operational Priority │              └───────────────────────────────────┘  │
│  │ (PortfolioClimateImpact)      │                                                     │
│  └───────────────┬───────────────┘                                                     │
│                  │                                                                     │
│                  ▼                                                                     │
│  ┌───────────────────────────────┐                                                     │
│  │ RecommendationEngine          │                                                     │
│  │ (Decision-Support Advisories) │                                                     │
│  └───────────────────────────────┘                                                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Real Geography Hierarchy
- **State Tier**: Bihar, India
- **District Tier**: Darbhanga (`data/geography/bihar/darbhanga/district.geojson`, OSM Relation 1568263)
- **Cluster Tier**: 10 real operational blocks (`villages.geojson`) with calibrated elevation, slope, drainage index, and river proximity.
- **Topological Integrity**: Mathematical point-in-polygon containment continuously audited.

