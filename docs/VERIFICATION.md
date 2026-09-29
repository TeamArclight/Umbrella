# Physical Asset Verification & Field Auditing Protocol

## 1. Objectives & Overview

Green microfinance lending carries a documented operational risk: financing disbursed for climate-adaptation hardware (e.g., hermetic silos, solar irrigation pumps, elevated livestock sheds) may be diverted to general household consumption, or fictitious installations may be recorded without physical delivery.

Umbrella's **Field Verification Subsystem** provides a tamper-resistant, offline-capable, and auditable verification protocol for field loan officers and audit teams to validate physical asset existence, operational condition, and geospatial authenticity.

---

## 2. Multi-Layer Integrity & Anti-Tampering Safeguards

Automated checks execute instantly upon upload to advise the verification officer. Automated checks **do not** approve or reject; they produce an auditable `VerificationAutomatedSummary` with transparent flags.

```
                              [ Uploaded Photo Evidence ]
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
      [ Magic Byte Validation ]   [ SHA-256 Hash Check ]     [ Geofence Distance ]
      - JPEG (FF D8 FF)           - Cryptographic hash       - Haversine distance
      - PNG (89 50 4E 47)         - Duplicate detection        to village coords
      - WebP (RIFF/WEBP)            across all assets        - ≤500m: PASS
      - Max 5MB size limit        - Prevents re-used photos  - 500-2000m: REVIEW
      - UUID filename storage                                - >2000m: FLAG
                │                          │                          │
                └──────────────────────────┼──────────────────────────┘
                                           │
                                           ▼
                           [ Timestamp Chronology Check ]
                           - Verification Date ≥ Install Date
                                           │
                                           ▼
                           [ Verification Automated Summary ]
                           - Summary Status: PASS | REVIEW | FLAG
                                           │
                                           ▼
                              [ Human Officer Decision ]
                              - VERIFIED | REJECTED | ESCALATED
```

### 2.1 File Inspection & Path Traversal Prevention
- **Magic Bytes Validation**: File extensions are ignored. The engine reads the raw header bytes:
  - JPEG: `0xFF, 0xD8, 0xFF`
  - PNG: `0x89, 0x50, 0x4E, 0x47`
  - WebP: `0x52, 0x49, 0x46, 0x46` (RIFF) + `0x57, 0x45, 0x42, 0x50` (WEBP)
- **Size Cap**: Uploads exceeding 5,242,880 bytes (5MB) are strictly rejected with HTTP 413.
- **Path Traversal Shielding**: Filenames provided by client devices are discarded. Files are stored in a dedicated `uploads/` directory using cryptographically secure UUIDv4 filenames (`<uuid>.<ext>`), preventing directory traversal or script execution.

### 2.2 SHA-256 Duplicate Image Detection
- A major fraud vector in microfinance asset financing is the re-use of promotional images or photographs of a single demonstration asset across multiple loan files.
- The engine calculates the SHA-256 checksum of every uploaded photo.
- The hash is cross-referenced across the entire historical asset and verification database. If a duplicate is detected on a different asset, the engine immediately sets `duplicate_detected = True` and flags the upload with `DUPLICATE_IMAGE_DETECTED`.

### 2.3 Haversine Geofence Verification
- Field officers record GPS coordinates at the time of asset inspection.
- The engine computes the great-circle distance $d$ between the recorded GPS coordinates and the official registered coordinates of the borrower's village:

$$d = 2 R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$

Where $R = 6,371,000 \text{ m}$.
- **Geofence Tiers**:
  - $d \le 500 \text{ m}$: `PASS` (Consistent with target village boundaries).
  - $500 \text{ m} < d \le 2,000 \text{ m}$: `REVIEW` (Officer is in the perimeter or adjacent hamlet).
  - $d > 2,000 \text{ m}$: `FLAG` (Discrepancy flagged; inspection location does not match village).

### 2.4 Chronological Timestamp Consistency
- The verification timestamp is checked against the physical installation date recorded during loan servicing.
- Inspections timestamped *prior* to physical installation are flagged as `TEMPORAL_ANOMALY`.

---

## 3. Dynamic Physical Inspection Checklist

Checklist templates adapt based on the physical intervention category:

| Intervention | Verification Checklist Criteria |
| :--- | :--- |
| **Raised Hermetic Silo** | 1. Plinth height $\ge 60\text{ cm}$ above baseline ground.<br>2. Airtight hermetic seal gasket inspected and intact.<br>3. Fastened to stable flood-resistant concrete or masonry base.<br>4. Grain capacity matches specifications ($1.0\text{ ton}$). |
| **Solar Irrigation Pump** | 1. Photovoltaic panel array anchored with flood-resistant tilt mounting.<br>2. Controller unit sealed in IP65 weatherproof enclosure above flood line.<br>3. Borehole discharge flow rate tested and operating.<br>4. Anti-theft locking hardware and cable conduits installed. |
| **Portable Solar Dryer** | 1. UV-stabilized polycarbonate/polyethylene sheeting intact without tears.<br>2. DC circulation fan operating on direct solar power.<br>3. Internal drying trays clean and elevated.<br>4. Rapid-disassembly anchor system demonstrated by farmer. |
| **Elevated Livestock Shelter** | 1. Elevated floor platform $\ge 1.0\text{ m}$ above historical 2020 high-water mark.<br>2. Reinforced ramp with non-slip cleats for livestock movement.<br>3. Corrugated GI roof anchored against monsoon wind gusts.<br>4. Dedicated fodder storage rack elevated above flood line. |

---

## 4. Human Decision Protocol & Audit Trail

1. **Automated Synthesis**: When evidence is uploaded, the automated engine computes the overall automated status:
   - `PASS`: Geofence passed, zero duplicates, chronology valid, checklist 100% complete.
   - `REVIEW`: Minor geofence perimeter (500–2000m) or partial checklist items.
   - `FLAG`: Duplicate image detected, geofence $>2000$m, or temporal anomaly.
2. **Reviewing Officer Audit**: A supervising operations officer or senior field auditor inspects the evidence, photos, and automated findings.
3. **Formal Verification Sign-Off**: The officer submits a formal decision (`VERIFIED`, `REJECTED`, or `ESCALATED`) with an explanatory notes statement.
4. **Append-Only Logging**: Every status change, photo upload, and officer signature is committed to an immutable append-only audit trail (`AuditEvent`).
