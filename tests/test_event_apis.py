"""Integration tests for Geography, Historical Events, and Replay REST endpoints."""

import pytest
from starlette.testclient import TestClient
from umbrella.api import app

client = TestClient(app)


def test_get_pilot_geography_endpoint():
    """Verify GET /api/v1/geography/pilot returns primary case study metadata and clusters."""
    resp = client.get("/api/v1/geography/pilot")
    assert resp.status_code == 200
    data = resp.json()
    assert data["pilot_district"] == "Darbhanga"
    assert data["pilot_state"] == "Bihar"
    assert data["monitored_clusters_count"] == 10
    assert len(data["monitored_clusters"]) == 10


def test_get_district_boundary_endpoint():
    """Verify GET /api/v1/geography/district/darbhanga returns official GeoJSON."""
    resp = client.get("/api/v1/geography/district/darbhanga")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 1


def test_get_district_clusters_geojson_endpoint():
    """Verify GET /api/v1/geography/district/darbhanga/villages returns operational cluster GeoJSON."""
    resp = client.get("/api/v1/geography/district/darbhanga/villages")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 10


def test_get_district_boundary_not_found():
    """Verify 404 for non-existent district boundary."""
    resp = client.get("/api/v1/geography/district/non_existent_district")
    assert resp.status_code == 404


def test_list_historical_events_endpoint():
    """Verify GET /api/v1/events lists registered events."""
    resp = client.get("/api/v1/events")
    assert resp.status_code == 200
    events = resp.json()
    assert len(events) >= 1
    assert any(e["event_id"] == "IND-BIH-2020-07" for e in events)


def test_get_historical_event_endpoint():
    """Verify GET /api/v1/events/IND-BIH-2020-07 returns detailed hydrological and remote sensing context."""
    resp = client.get("/api/v1/events/IND-BIH-2020-07")
    assert resp.status_code == 200
    data = resp.json()
    assert data["event_id"] == "IND-BIH-2020-07"
    assert data["district"] == "Darbhanga"
    assert "hydrological_context" in data
    assert "remote_sensing_evidence" in data


def test_get_historical_event_not_found():
    """Verify 404 for non-existent disaster event ID."""
    resp = client.get("/api/v1/events/UNKNOWN-EVENT-999")
    assert resp.status_code == 404


def test_replay_district_flood_event_endpoint():
    """Verify GET /api/v1/events/IND-BIH-2020-07/replay returns district-wide cluster evaluations."""
    resp = client.get("/api/v1/events/IND-BIH-2020-07/replay?lookback_days=5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["district"] == "Darbhanga"
    assert data["monitored_clusters_count"] == 10
    assert len(data["clusters"]) == 10
    assert data["decoupling_verified"] is True
    assert data["leakage_prevented"] is True


def test_replay_village_flood_event_endpoint():
    """Verify GET /api/v1/events/IND-BIH-2020-07/replay/VIL-DAR-HAY returns chronological report."""
    resp = client.get("/api/v1/events/IND-BIH-2020-07/replay/VIL-DAR-HAY?lookback_days=5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["event_id"] == "IND-BIH-2020-07"
    assert data["village_name"] == "Hayaghat"
    assert len(data["snapshots"]) >= 5
    assert data["peak_hazard_score"] > 0.0


def test_get_event_observational_evidence_endpoint():
    """Verify GET /api/v1/events/IND-BIH-2020-07/evidence returns Sentinel-1 and CWC validation report."""
    resp = client.get("/api/v1/events/IND-BIH-2020-07/evidence")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "EVIDENCE_AVAILABLE_NOT_PROCESSED"
    assert data["sensor_type"] == "C-band Synthetic Aperture Radar (SAR)"
    assert len(data["sar_acquisitions"]) == 4
    assert len(data["cwc_gauge_records"]) >= 2


def test_replay_district_unknown_event_404():
    """Verify 404 for district replay on non-existent event."""
    resp = client.get("/api/v1/events/UNKNOWN-EVENT/replay")
    assert resp.status_code == 404


def test_replay_village_unknown_village_404():
    """Verify 404 for village replay on non-existent village."""
    resp = client.get("/api/v1/events/IND-BIH-2020-07/replay/NON-EXISTENT-VILLAGE")
    assert resp.status_code == 404


def test_get_evidence_unknown_event_404():
    """Verify 404 for observational evidence on non-existent event."""
    resp = client.get("/api/v1/events/UNKNOWN-EVENT/evidence")
    assert resp.status_code == 404


def test_get_district_clusters_unknown_district_404():
    """Verify 404 for clusters on non-existent district."""
    resp = client.get("/api/v1/geography/district/non_existent_dist/villages")
    assert resp.status_code == 404

