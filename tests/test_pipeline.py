"""Integration tests for the refactored Umbrella pipeline and FastAPI REST endpoints."""

import pytest
from starlette.testclient import TestClient
from umbrella.pipeline import UmbrellaPipeline
from umbrella.api import app

client = TestClient(app)


def test_pipeline_single_village_evaluation():
    """Verify end-to-end pipeline execution for a single village."""
    pipeline = UmbrellaPipeline()
    result = pipeline.evaluate_village("VIL-TEL-001", forecast_horizon_days=5, evaluation_month=7)

    assert result.village_id == "VIL-TEL-001"
    assert result.village_name == "Sirikonda"
    assert result.district == "Nizamabad"
    assert result.forecast_horizon_days == 5

    # Hazard is purely physical
    assert 0.0 <= result.flood_hazard.hazard_score <= 100.0
    assert result.flood_hazard.hazard == "FLOOD"
    assert len(result.flood_hazard.components) == 5

    # Exposure is strictly synthetic
    assert result.portfolio_exposure.data_type == "SYNTHETIC"
    assert result.portfolio_exposure.outstanding_amount > 0.0

    # Impact combines both
    assert 0.0 <= result.portfolio_impact.priority_score <= 100.0
    assert result.portfolio_impact.hazard_score == result.flood_hazard.hazard_score

    # Recommendations are advisory
    assert result.recommendations.human_decision.status == "PENDING_REVIEW"


def test_pipeline_all_villages():
    """Verify pipeline execution across all pilot locations."""
    pipeline = UmbrellaPipeline()
    results = pipeline.evaluate_all_monitored_villages(forecast_horizon_days=5, evaluation_month=7)

    assert len(results) >= 4
    for r in results:
        assert r.flood_hazard.hazard_score >= 0.0
        assert r.portfolio_exposure.data_type == "SYNTHETIC"


# --- REST API Endpoints Verification ---

def test_api_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["model_version"] == "Flood Hazard Model v1.0"


def test_api_attribution():
    res = client.get("/api/v1/attribution")
    assert res.status_code == 200
    data = res.json()
    assert "Open-Meteo" in data["open_meteo"]["provider"]
    assert "CGIAR" in data["cgiar_climate"]["provider"]
    assert "LOCAL_DATASET" in data["cgiar_climate"]["integration_mode"]
    assert "SYNTHETIC" in data["portfolio_data"]["data_type"]
    assert "credit_default" in data["scientific_disclaimers"]


def test_api_villages_list_and_details():
    res_list = client.get("/api/v1/villages")
    assert res_list.status_code == 200
    villages = res_list.json()
    assert len(villages) >= 4

    target_id = villages[0]["village_id"]
    res_detail = client.get(f"/api/v1/villages/{target_id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["village_id"] == target_id
    assert "terrain" in res_detail.json()

    # 404 for unknown village
    res_404 = client.get("/api/v1/villages/UNKNOWN-999")
    assert res_404.status_code == 404


def test_api_weather_endpoint():
    res = client.get("/api/v1/weather/VIL-TEL-001?horizon=5")
    assert res.status_code == 200
    data = res.json()
    assert data["forecast_horizon_days"] == 5
    assert data["data_source_mode"] in ["LIVE", "MOCK"]
    assert len(data["daily_forecasts"]) == 5

    # 400 for invalid horizon
    res_bad = client.get("/api/v1/weather/VIL-TEL-001?horizon=12")
    assert res_bad.status_code == 400


def test_api_flood_hazard_endpoint():
    res = client.get("/api/v1/hazards/flood/VIL-TEL-001?horizon=5&month=7")
    assert res.status_code == 200
    data = res.json()
    assert data["hazard"] == "FLOOD"
    assert "hazard_score" in data
    assert len(data["components"]) == 5
    assert data["data_source_mode"] in ["LIVE", "MOCK"]


def test_api_portfolio_exposure_endpoint():
    res = client.get("/api/v1/portfolio/exposure/VIL-TEL-001")
    assert res.status_code == 200
    data = res.json()
    assert data["data_type"] == "SYNTHETIC"
    assert data["currency"] == "INR"
    assert data["outstanding_amount"] > 0.0


def test_api_portfolio_impact_endpoint():
    res = client.get("/api/v1/portfolio/impact/VIL-TEL-001?horizon=5&month=7")
    assert res.status_code == 200
    data = res.json()
    assert "priority_score" in data
    assert "hazard_score" in data
    assert "portfolio_exposure" in data
    assert data["formula_version"] == "PortfolioPriority-v1.0"


def test_api_recommendations_endpoint():
    res = client.get("/api/v1/recommendations/VIL-TEL-001?horizon=5&month=7")
    assert res.status_code == 200
    data = res.json()
    assert "system_recommendation" in data
    assert "human_decision" in data
    assert data["human_decision"]["status"] == "PENDING_REVIEW"


def test_api_run_all_endpoint():
    res = client.get("/api/v1/pipeline/run-all?horizon=5&month=7")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 4
    for it in items:
        assert it["flood_hazard"]["hazard"] == "FLOOD"
        assert it["portfolio_exposure"]["data_type"] == "SYNTHETIC"
