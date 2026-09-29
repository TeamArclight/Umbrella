# Umbrella System Architecture (Final Pre-Submission Specification)

**Platform:** Umbrella Climate-Adaptive Microfinance Platform  
**Target Repository:** `TeamArclight/Umbrella`  
**Architecture Paradigm:** Decoupled Closed-Loop Climate Adaptation Flywheel  
**Current Release:** v0.1.0-sankalp-demo  

---

## 1. High-Level Architectural Diagram

The diagram below illustrates the end-to-end data flow, separating physical climate observation, financial portfolio exposure, human decision gates, field operations, and impact estimation:

```mermaid
flowchart TD
    subgraph DataSources["External Climate & Upstream Sources"]
        OM["Open-Meteo NWP Forecast API\n(ECMWF IFS & DWD ICON)"]
        ERA5["ECMWF ERA5 / ERA5-Land\n(Retrospective Reanalysis)"]
        CHIRPS["CHIRPS / CGIAR Toolkit\n(30-Year Climatology)"]
        CWC["Central Water Commission\n(River Gauge Telemetry)"]
        S1["Copernicus Sentinel-1 SAR\n(Radar Flood Metadata)"]
    end

    subgraph Adapters["Umbrella Integration Adapters"]
        WA["WeatherAdapter\n(Live / Fallback Mock)"]
        HRA["HistoricalReplayAdapter\n(Anti-Leakage Slicing)"]
        SPA["SyntheticPortfolioAdapter\n(Deterministic MFI Model)"]
    end

    subgraph CoreEngines["Deterministic Core Engines"]
        FHM["Flood Hazard Model v1.0\n(0-100 Physical Hazard Score)"]
        PEE["Portfolio Exposure Engine\n(Decoupled Capital at Risk)"]
        OPE["Operational Priority Engine\n(0.60 Hazard + 0.40 Capital)"]
        ARE["Adaptation Recommendation Engine\n(Rule-Based Hazard Matching)"]
        FCE["Financing Calculator Engine\n(Reducing Balance Amortization)"]
        VRE["Verification Engine\n(GPS Offset & SHA-256 Digest)"]
        IEE["Dual-Track Impact Engine\n(Adaptation + Mitigation Proxies)"]
    end

    subgraph HumanGates["Mandatory Human-in-the-Loop Decision Gates"]
        G1{"Risk Officer Gate\n(Early Warning Review)"}
        G2{"Credit Officer Gate\n(Loan Approval Review)"}
        G3{"Branch Manager Gate\n(Physical Verification Signoff)"}
    end

    subgraph DataStore["Flywheel State & Audit Trail"]
        FS["Flywheel In-Memory Store\n(Applications, Assets, Verifications)"]
        ATL["Append-Only Audit Log\n(Sha-256 Hashed Event Chain)"]
    end

    subgraph Presentation["User Interfaces (Next.js 14)"]
        DASH["Command Center Dashboard\n(/dashboard)"]
        RISK["Risk Intelligence & Radar\n(/live-risk)"]
        REPLAY["Historical Flood Replay\n(/historical-replay)"]
        PORT["Portfolio Scatter Map\n(/portfolio)"]
        ACT["Action Center & Catalog\n(/actions)"]
        GF["Green Finance Simulator\n(/green-finance)"]
        FLD["Mobile Field Officer PWA\n(/field-officer)"]
        IMP["Impact & ESG Dashboard\n(/impact)"]
        TRC["Asset Traceability View\n(/assets/[id])"]
    end

    OM --> WA
    ERA5 --> HRA
    CHIRPS --> HRA
    CWC --> HRA
    S1 --> HRA

    WA --> FHM
    HRA --> FHM
    SPA --> PEE

    FHM --> OPE
    PEE --> OPE

    OPE --> ARE
    ARE --> G1
    G1 --> ACT

    ACT --> FCE
    FCE --> G2
    G2 --> FS

    FS --> FLD
    FLD --> VRE
    VRE --> G3
    G3 --> FS

    FS --> IEE
    IEE --> IMP

    G1 -.-> ATL
    G2 -.-> ATL
    G3 -.-> ATL
    VRE -.-> ATL

    FS --> DASH
    FHM --> RISK
    HRA --> REPLAY
    PEE --> PORT
    FS --> TRC
```

---

## 2. Core Engine Decoupling Axiom

The mathematical core of Umbrella is founded on strict separation between physical hazard and financial capital:

$$\mathbf{Physical\ Climate\ Hazard\ (0-100) \neq Portfolio\ Capital\ Exposure\ (\text{₹}) \neq Credit\ Default\ Risk}$$

```mermaid
classDiagram
    class PhysicalHazardModel {
        +float forecast_accumulation_mm
        +float peak_burst_mm_day
        +float soil_saturation_ratio
        +float historical_anomaly_pct
        +float terrain_susceptibility
        +calculate_hazard_score() float
    }

    class PortfolioExposureEngine {
        +string village_id
        +float total_outstanding_inr
        +int active_borrowers_count
        +float average_loan_ticket_inr
        +calculate_exposure_metrics()
    }

    class OperationalPriorityEngine {
        +float physical_hazard_score
        +float normalized_capital_exposure
        +derive_priority_score() float
    }

    PhysicalHazardModel --> OperationalPriorityEngine : Hazard (60% Weight)
    PortfolioExposureEngine --> OperationalPriorityEngine : Capital (40% Weight)
```

---

## 3. The 7-Stage Closed-Loop Flywheel

Umbrella operationalizes the Economics of Climate Adaptation (ECA) framework across a continuous closed-loop cycle:

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Risk & Operations Officer
    actor Borrower as JLG Smallholder Borrower
    actor Field as Field Verification Officer
    participant Umbrella as Umbrella Platform
    participant Engine as Impact Engine
    participant Audit as Append-Only Audit Log

    Officer->>Umbrella: 1. Monitor live NWP hazard alerts & historical replay
    Umbrella->>Officer: 2. Priority alert generated (Hazard: 85, Capital: ₹28L)
    Officer->>Borrower: 3. Dispatch SMS alert & recommend adaptation loan
    Borrower->>Officer: 4. Apply for Green Loan (e.g. Raised Hermetic Silo)
    Officer->>Umbrella: 5. Human Approval Gate (Confirm loan restructuring/approval)
    Umbrella->>Audit: Record immutable application decision event
    Umbrella->>Field: 6. Assign on-site physical installation verification
    Field->>Umbrella: 7. Submit GPS coordinates, checklist, & photo SHA-256
    Umbrella->>Audit: Verify GPS offset (< 100m) & check duplicate hash
    Officer->>Umbrella: 8. Branch Manager confirmation signoff
    Umbrella->>Engine: 9. Calculate dual-track impact (Food saved + emissions avoided)
    Engine->>Umbrella: 10. Update ESG roll-up & return learning to portfolio risk
```

---

## 4. Key Subsystem Specifications

### 4.1 Weather & Replay Adapters
- **Live Mode**: Calls `https://api.open-meteo.com/v1/forecast` using asynchronous HTTP. Extracts 3, 5, and 7-day precipitation sums, peak 24-hour bursts, 2m temperature extremes, and topsoil volumetric moisture (0–10 cm).
- **Fallback Mode**: Deterministic, verified mock tables activate automatically upon network timeout or rate limiting, with `data_source_mode = "MOCK"`.
- **Anti-Leakage Replay**: Restricts input slices to $t \le T_{\text{snapshot}}$, strictly preventing future data leakage during historical evaluation.

### 4.2 Recommendation & Green Finance Engines
- **Recommendation Engine**: Rule-based matching between hazard severity (`MODERATE`, `HIGH`, `SEVERE`), dominant crop type (paddy, makhana, vegetables), and borrower livelihood.
- **Financing Calculator**: Monthly reducing-balance EMI calculations with transparent disclosure of principal, interest, upfront processing fees, and operational payback periods.

### 4.3 Field Verification & Tamper Prevention
- **Haversine GPS Verification**: Evaluates spherical distance between field officer device coordinates and cadastral homestead records. Offsets $\le 100\text{ m}$ receive a `PASSED` rating.
- **SHA-256 Duplicate Check**: Prevents reuse of past installation photos across multiple loan applications.

### 4.4 Append-Only Audit Trail
- Every state transition across applications, assets, and verifications generates a structured `AuditEvent` containing an event ID, entity ID, action type, actor ID, timestamp, and metadata payload.
- The log is append-only, providing end-to-end traceability for internal audits and regulatory inspections.
