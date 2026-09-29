# Umbrella Demonstration Resilience & Offline Playbook

**Target Repository:** `TeamArclight/Umbrella`  
**Purpose:** Ensure smooth, fail-safe, and professional live product presentations regardless of network conditions, API outages, or conference Wi-Fi failures.  

---

## 1. Resilience Philosophy

Umbrella is engineered with **Zero-Failure Live Demo Architecture**:

1. **Deterministic Local Fallbacks:** Every external API call (Open-Meteo weather forecasts, historical reanalysis, satellite evidence) includes pre-computed, scientifically accurate fallback datasets.
2. **Transparent Provenance Badging:** If the live Open-Meteo API is unreachable or rate-limited, Umbrella automatically switches to validated mock data and informs the user with an amber banner: `DEMO / MOCK DATA ACTIVE`.
3. **Embedded Geography & Vector Boundaries:** All district and village GeoJSON polygon boundaries are stored locally in `src/umbrella/data/`, eliminating runtime dependencies on external tile/map servers.
4. **Self-Contained In-Memory Flywheel:** Applications, asset registrations, field verifications, and audit trails run in-memory within FastAPI, with thread-safe locking and initial seed data for immediate demonstration.

---

## 2. Pre-Demo Verification Checklist (T-minus 5 Minutes)

Before presenting, run this quick 3-step check:

### Step 1: Start Backend (Terminal 1)
```powershell
# In project root
$env:PYTHONPATH="src"
uvicorn umbrella.api:app --host 127.0.0.1 --port 8000 --reload
```
*Verify:* Open `http://localhost:8000/api/v1/health` in browser. Expect:
```json
{
  "status": "healthy",
  "service": "umbrella-api",
  "version": "1.0.0",
  "model_version": "Flood Hazard Model v1.0"
}
```

### Step 2: Start Frontend (Terminal 2)
```powershell
cd frontend
npm run dev
```
*Verify:* Open `http://localhost:3000` in browser. Confirm that the global status bar shows:
* **Umbrella API:** Connected (8000) (Green dot)
* **Weather:** Open-Meteo (Live / Fallback)
* **Portfolio:** SYNTHETIC

### Step 3: Run the 8-Suite Frontend Test
```powershell
node frontend/scripts/test-frontend.mjs
```
*Expect:* `All 8 test suites passed! (47/47 assertions)`

---

## 3. Scenarios & Fallback Procedures

### Scenario A: Full Live Internet Available (Default)
* **What happens:** Backend queries live Open-Meteo API for real-time 3-day, 5-day, and 7-day weather forecasts across the 10 Darbhanga clusters.
* **UI Indicator:** Green `LIVE` provenance badges on weather and hazard cards.
* **Talking Point:** *"Notice the live green badge — Umbrella is ingesting real-time ensemble meteorological forecasts directly from Open-Meteo."*

### Scenario B: Conference Wi-Fi Fails or Drops (Offline Mode)
* **What happens:** Open-Meteo API times out (2.0s timeout). Backend immediately returns deterministic fallback weather data with `data_source_mode = "MOCK"`.
* **UI Indicator:** 
  * Amber badge `MOCK` appears on weather cards.
  * Prominent banner appears: `DEMO / MOCK DATA ACTIVE: Live meteorological feed fell back to validated deterministic mock data (Network offline or upstream API rate limit). Offline Demonstration Mode.`
* **Talking Point:** *"Notice our demo resilience architecture: even without active internet, the platform seamlessly continues operating using calibrated deterministic mock data, clearly displaying an amber provenance badge rather than crashing or pretending fake data is live."*

### Scenario C: Backend Crashes or Is Not Running
* **UI Indicator:** Global status bar turns red: `Umbrella API: Offline`.
* **Fix:** Open Terminal 1, restart `$env:PYTHONPATH="src"; uvicorn umbrella.api:app --host 127.0.0.1 --port 8000`.

---

## 4. Emergency Demo Data Reset

If applications or assets need to be reset to the clean starting seed state during rehearsal:
* Simply restart the backend process (CTRL+C then rerun `uvicorn`).
* `FlywheelStore` automatically re-seeds:
  * 10 pre-loaded resilience applications across Darbhanga clusters.
  * 6 physical deployed assets (silos, pumps, solar dryers, livestock shelters).
  * 4 field inspection records (including 1 pre-flagged GPS discrepancy and 1 hash check).

---

## 5. Keyboard & Navigation Quick Reference

| Page | URL Path | Key Presentation Feature |
| :--- | :--- | :--- |
| **Command Center (Overview)** | `/` | Executive summary, district map, operational priority triage |
| **Live Flood Risk** | `/live-risk` | Meteorological forecast, 3/5/7-day horizons, cluster hazard scores |
| **Historical Replay** | `/historical-replay` | July 2020 Darbhanga disaster replay, ERA5 reanalysis, Sentinel-1 SAR |
| **Green Finance & Workflow** | `/green-finance` | 7-step flywheel, human-authorized credit review, EMI calculator |
| **Field Verification** | `/field-officer` | Mobile field inspector UI, GPS geofencing, SHA-256 duplicate image check |
| **Impact & Carbon Registry** | `/impact` | Dual-track impact, borrowers protected, UNFCCC AMS-I.A emissions avoided |
