# Green Finance & Micro-Adaptation Framework

## 1. Executive Summary & Principles

Umbrella integrates green microfinance not as an automated loan underwriting bot, but as an **auditable, climate-grounded decision support system**. It bridges physical climate hazard intelligence with targeted resilience financing for vulnerable microfinance borrowers in climate-exposed regions like Darbhanga, Bihar.

### Non-Negotiable Operating Principles
1. **Decision Support, NOT Automated Lending**: Umbrella never autonomously approves, rejects, restructures, or disburses loans. All scoring, recommendation triggers, and financial calculations provide transparent advisory input to certified MFI credit officers and operations managers.
2. **Strict Separation of Physical Hazard and Financial Exposure**: A village's physical flood hazard is determined exclusively by rainfall, soil saturation, river proximity, and terrain elevation. It does not increase simply because an MFI has a higher portfolio concentration in that village.
3. **Physical Asset ≠ Financial Instrument**: A physical resilience intervention (e.g., a raised hermetic grain silo) has intrinsic physical characteristics (elevation offset, capacity, material lifespan). A green finance loan (e.g., a 24-month reducing-balance micro-loan) is a distinct financial instrument with its own principal, rate, tenure, and amortization schedule.
4. **Transparent Assumption Tagging**: Every financial parameter, benefit metric, and emissions factor is explicitly classified as `SOURCED`, `DERIVED`, or `DEMO_ASSUMPTION` with clear citations.

---

## 2. Indicative Product Catalog

Umbrella includes three pre-configured indicative green finance products tailored to microfinance borrowers and joint liability groups (JLGs):

| Product ID | Product Name | Target Interventions | Amount Range (₹) | Tenure Range | Benchmark Rate | Processing Fee |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `prod-micro-adaptation` | Micro-Adaptation Loan | Silos, solar dryers, small water storage | ₹10,000 – ₹35,000 | 12 – 24 months | 18.0% p.a. | 2.0% |
| `prod-solar-equipment` | Solar Equipment Loan | Solar irrigation pumps, solar dryers | ₹25,000 – ₹80,000 | 18 – 36 months | 16.0% p.a. | 2.0% |
| `prod-farm-resilience` | Farm Resilience Loan | Drip irrigation, livestock shelters, drainage | ₹15,000 – ₹60,000 | 12 – 30 months | 17.0% p.a. | 2.0% |

> **Regulatory Note**: In compliance with RBI Directions for Microfinance Loans (2022), interest rates and fees shown are indicative and subject to individual MFI board-approved policies and risk-based pricing frameworks.

---

## 3. Financial Calculation Engine

### 3.1 Reducing-Balance Amortization
All loan calculations employ standard monthly reducing-balance compounding:

$$EMI = P \cdot \frac{r(1+r)^n}{(1+r)^n - 1}$$

Where:
- $P$ = Financed Principal Amount ($\text{Capital Cost} - \text{Down Payment}$)
- $r$ = Monthly interest rate ($\frac{\text{Annual Nominal Rate}}{12 \times 100}$)
- $n$ = Loan tenure in months

From this, the engine derives:
- **Total Interest Payable**: $(EMI \times n) - P$
- **Total Repayment Amount**: $EMI \times n$
- **Upfront Processing Fee**: $P \times \text{fee\_percentage}$
- **Total Cost of Financing**: $\text{Total Interest} + \text{Processing Fee}$

### 3.2 Savings & Simple Payback Estimation
For productive assets that displace operational expenditures (e.g., replacing diesel with solar pumping) or prevent inventory loss (e.g., hermetic grain storage avoiding mold and flood spoilage):

$$\text{Annual Net Operational Benefit} = \text{Annual OpEx Savings} + \text{Annual Loss Reduction} - \text{Annual Maintenance Cost}$$

$$\text{Simple Payback Period (years)} = \frac{P}{\text{Annual Net Operational Benefit}}$$

### 3.3 Cash Flow Feasibility Index
The engine evaluates borrower debt service feasibility by comparing monthly net savings to the monthly loan installment:

$$\text{Feasibility Ratio} = \frac{\text{Monthly Net Operational Benefit}}{EMI}$$

- $\text{Feasibility} \ge 1.0$: Asset operational savings fully offset or exceed the debt installment.
- $0.5 \le \text{Feasibility} < 1.0$: Asset yields substantial savings, requiring partial cross-subsidy from core household income.
- $\text{Feasibility} < 0.5$: High debt burden relative to direct operational savings; requires thorough review of alternative household cash flows.

---

## 4. End-to-End Application Lifecycle

1. **Hazard-Triggered Recommendation**: Field and risk teams receive climate hazard alerts for clusters (e.g., Hayaghat Flood Hazard 78/100). The adaptation recommendation engine surfaces pre-screened interventions suitable for local livelihoods and flood depth.
2. **Financing Scenario Simulation**: The loan officer or borrower configures the capital cost, down payment, and preferred tenure. The calculator dynamically renders the monthly EMI, total interest, and payback horizon.
3. **Application Formulation & Submission**: A formal application record (`GF-APP-XXXX`) is submitted with borrower identifiers, village geography, requested asset, and financing terms. Lifecycle transitions to `UNDER_REVIEW`.
4. **Human Officer Decision**: An authorized credit or operations manager reviews the full dossier, automated hazard checks, and field capacity before issuing a signed decision (`APPROVED`, `REJECTED`, or `ADDITIONAL_INFO_REQUIRED`) accompanied by mandatory review notes.
5. **Disbursement & Installation**: Upon disbursement, the application transitions to `DISBURSED`, spawning a unique tracked `ResilienceAsset` record (`ASSET-XXXX`). Upon physical delivery and installation, status becomes `INSTALLED` and triggers verification.
