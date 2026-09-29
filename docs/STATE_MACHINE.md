# Application & Asset Lifecycle State Machine

## 1. Overview & Core Tenet

Umbrella manages the complete lifecycle of climate-resilience microfinance applications and physical assets through a deterministic, auditable finite state machine (FSM). 

```
                                      ┌──────────────┐
                                      │    DRAFT     │
                                      └──────┬───────┘
                                             │ [submit / rec]
                                             ▼
                                      ┌──────────────┐
                                      │ RECOMMENDED  │
                                      └──────┬───────┘
                                             │ [formal submit]
                                             ▼
                                      ┌──────────────┐
                                      │ UNDER_REVIEW │
                                      └──────┬───────┘
                        ┌────────────────────┴────────────────────┐
                        │ [Human Officer Decision]                │ [Human Officer Decision]
                        ▼                                         ▼
                 ┌──────────────┐                          ┌──────────────┐
                 │   APPROVED   │                          │   REJECTED   │
                 └──────┬───────┘                          └──────────────┘
                        │ [disburse loan]
                        ▼
                 ┌──────────────┐
                 │  DISBURSED   │
                 └──────┬───────┘
                        │ [physical delivery & installation]
                        ▼
                 ┌──────────────┐
                 │  INSTALLED   │ ──────► [Creates Tracked ResilienceAsset]
                 └──────┬───────┘
                        │ [request verification]
                        ▼
                 ┌──────────────────────┐
                 │ VERIFICATION_PENDING │
                 └──────────┬───────────┘
        ┌───────────────────┴───────────────────┐
        │ [Human Inspector Decision]            │ [Human Inspector Decision]
        ▼                                       ▼
 ┌──────────────┐                        ┌──────────────┐
 │   VERIFIED   │                        │   REJECTED   │
 └──────┬───────┘                        └──────────────┘
        │ [loan maturity / asset decommission]
        ▼
 ┌──────────────┐
 │    CLOSED    │
 └──────────────┘
```

> [!IMPORTANT]
> **Automated Lending Prohibition**: The transition from `UNDER_REVIEW` to `APPROVED` or `REJECTED` **CANNOT** be executed automatically by an algorithm, AI model, or timer. It strictly requires an authorized human officer identifier (`officer_id`), official role, and non-empty review justification notes.

---

## 2. Permitted Transitions & State Rules

| Current State | Next State | Permitted Actor | Required Preconditions & Guards |
| :--- | :--- | :--- | :--- |
| `DRAFT` | `RECOMMENDED` | Adaptation Engine / Loan Officer | Physical hazard score & village profile evaluated. |
| `DRAFT` | `UNDER_REVIEW` | Loan Officer | Financing terms configured, borrower consent recorded. |
| `RECOMMENDED` | `UNDER_REVIEW` | Loan Officer | Formal application submitted with borrower identity. |
| `UNDER_REVIEW` | `APPROVED` | **Human Credit Officer** | Credit appraisal complete; officer ID and notes logged. |
| `UNDER_REVIEW` | `REJECTED` | **Human Credit Officer** | Documented rejection reason and notes logged. |
| `UNDER_REVIEW` | `ADDITIONAL_INFO_REQUIRED` | **Human Credit Officer** | Specific queries returned to field branch. |
| `APPROVED` | `DISBURSED` | Operations / Cashier | Loan agreement executed; disbursement ref generated. |
| `DISBURSED` | `INSTALLED` | Field Vendor / Branch Officer | Delivery confirmation; physical serial number recorded. |
| `INSTALLED` | `VERIFICATION_PENDING`| Operations Officer | Tracked asset spawned; inspection checklist assigned. |
| `VERIFICATION_PENDING` | `VERIFIED` | **Human Field Auditor** | Evidence uploaded; automated checks reviewed; audit signed. |
| `VERIFICATION_PENDING` | `REJECTED` | **Human Field Auditor** | Physical failure or fraud recorded; mitigation initiated. |
| `VERIFIED` | `CLOSED` | Portfolio Manager | Loan tenure fulfilled or asset reached end of design life. |

---

## 3. Explicit Prohibited Transitions

Any attempted transition not explicitly enumerated in the transition matrix raises a deterministic `HTTP 400 Bad Request` or `InvalidStateTransitionError`:
- `DRAFT` $\rightarrow$ `APPROVED`: **PROHIBITED** (Cannot bypass underwriting and officer appraisal).
- `DRAFT` $\rightarrow$ `DISBURSED`: **PROHIBITED** (Cannot disburse unapproved loan).
- `RECOMMENDED` $\rightarrow$ `DISBURSED`: **PROHIBITED** (Recommendation is advisory only).
- `UNDER_REVIEW` $\rightarrow$ `INSTALLED`: **PROHIBITED** (Cannot install hardware before credit approval and disbursal).
- `DISBURSED` $\rightarrow$ `VERIFIED`: **PROHIBITED** (Cannot verify an asset before recorded installation).
- `REJECTED` $\rightarrow$ `APPROVED`: **PROHIBITED** (Rejected applications must be resubmitted as new draft dossiers).

---

## 4. Immutable Audit Trail

Every transition automatically emits an `AuditEvent` persisted to the append-only ledger:
- `event_id`: Unique identifier (`AUDIT-XXXX`).
- `timestamp`: UTC ISO8601 timestamp.
- `entity_type`: `APPLICATION` | `ASSET` | `VERIFICATION`.
- `entity_id`: Foreign key reference.
- `action`: State transition or evidence attachment action.
- `previous_state` & `new_state`: Before and after lifecycle values.
- `actor_id` & `actor_role`: Identity and authorized designation of the human actor.
- `notes`: Mandated human officer commentary.
