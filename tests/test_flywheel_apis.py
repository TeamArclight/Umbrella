"""Comprehensive End-to-End Tests for Resilience, Finance, Verification, and Impact APIs."""

import io
from starlette.testclient import TestClient
from umbrella.api import app


client = TestClient(app)


def test_interventions_api():
    """Test /api/v1/interventions list and details."""
    res = client.get("/api/v1/interventions")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 6

    # Test single
    res_silo = client.get("/api/v1/interventions/raised-hermetic-silo")
    assert res_silo.status_code == 200
    assert res_silo.json()["category"] == "POST_HARVEST_STORAGE"


def test_adaptation_recommendations_api():
    """Test /api/v1/interventions/recommendations/{village_id}."""
    res = client.get("/api/v1/interventions/recommendations/VIL-DAR-HAY?horizon=5&month=7")
    assert res.status_code == 200
    data = res.json()
    assert data["village_id"] == "VIL-DAR-HAY"
    assert len(data["recommendations"]) >= 1


def test_green_finance_products_api():
    """Test /api/v1/green-finance/products list and details."""
    res = client.get("/api/v1/green-finance/products")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3

    res_single = client.get(f"/api/v1/green-finance/products/{data[0]['finance_product_id']}")
    assert res_single.status_code == 200


def test_financing_scenario_calculator_api():
    """Test POST /api/v1/green-finance/scenarios."""
    payload = {
        "intervention_cost_inr": 35000.0,
        "borrower_contribution_inr": 10000.0,
        "annual_interest_rate_pct": 13.5,
        "tenure_months": 18,
        "repayment_frequency": "MONTHLY",
    }
    res = client.post("/api/v1/green-finance/scenarios?intervention_id=portable-solar-dryer", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["financed_principal_inr"] == 25000.0
    assert data["estimated_installment_inr"] > 1400.0
    assert data["savings_payback"]["supported"] is True


def test_application_lifecycle_and_human_decision_api():
    """Test full application lifecycle via REST APIs."""
    # 1. Create DRAFT application
    create_payload = {
        "village_id": "VIL-DAR-KUS",
        "borrower_group_id": "JLG-KUS-99",
        "borrower_name": "Devi Sahani",
        "livelihood": "FISHERIES",
        "intervention_id": "drainage-culvert-improvement",
        "finance_product_id": "prod-farm-resilience",
        "requested_amount_inr": 28000.0,
        "borrower_contribution_inr": 5000.0,
        "notes": "Farm runoff sluice installation",
    }
    res_create = client.post("/api/v1/green-finance/applications", json=create_payload)
    assert res_create.status_code == 201
    app_data = res_create.json()
    app_id = app_data["application_id"]
    assert app_data["status"] == "DRAFT"

    # 2. Submit for review
    res_submit = client.post(f"/api/v1/green-finance/applications/{app_id}/submit")
    assert res_submit.status_code == 200
    assert res_submit.json()["status"] == "UNDER_REVIEW"

    # 3. Human officer approval
    decision_payload = {
        "decision": "APPROVED",
        "officer_id": "OFF-TEST-007",
        "officer_name": "Test Risk Officer",
        "approved_amount_inr": 23000.0,
        "reason": "Verified flood resilience need; borrower approved.",
        "notes": "Fast-tracked before monsoon peak.",
    }
    res_dec = client.post(f"/api/v1/green-finance/applications/{app_id}/decision", json=decision_payload)
    assert res_dec.status_code == 200
    assert res_dec.json()["status"] == "APPROVED"
    assert res_dec.json()["approved_amount_inr"] == 23000.0

    # 4. Disburse and register asset
    res_disb = client.post(f"/api/v1/green-finance/applications/{app_id}/disburse?serial_number=CULV-2026-99")
    assert res_disb.status_code == 200
    asset_data = res_disb.json()
    assert asset_data["application_id"] == app_id
    asset_id = asset_data["asset_id"]

    # 5. Field verification submission
    verif_payload = {
        "asset_id": asset_id,
        "officer_id": "FLD-009",
        "officer_name": "Field Inspector Roy",
        "submitted_latitude": 25.8245,
        "submitted_longitude": 86.1370,
        "checklist_responses": {
            "check_bund_dimensions": True,
            "check_sluice_gate": True,
        },
        "notes": "Drainage check gate inspected; masonry solid.",
    }
    res_verif = client.post("/api/v1/verifications", json=verif_payload)
    assert res_verif.status_code == 201
    verif_id = res_verif.json()["verification_id"]

    # 6. Upload evidence photo
    fake_jpeg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"evidence_jpeg_payload"
    files = {"file": ("drainage_photo.jpg", io.BytesIO(fake_jpeg_content), "image/jpeg")}
    res_upload = client.post(f"/api/v1/verifications/{verif_id}/evidence", files=files)
    assert res_upload.status_code == 200
    assert res_upload.json()["photo_sha256"] is not None

    # 7. Supervisory confirmation
    sup_decision_payload = {
        "decision": "CONFIRMED",
        "officer_id": "MGR-001",
        "officer_name": "Branch Manager",
        "reason": "All checks verified and GPS consistent.",
    }
    res_sup = client.post(f"/api/v1/verifications/{verif_id}/decision", json=sup_decision_payload)
    assert res_sup.status_code == 200
    assert res_sup.json()["human_review_status"] == "CONFIRMED"

    # Verify asset is now VERIFIED
    res_asset_final = client.get(f"/api/v1/assets/{asset_id}")
    assert res_asset_final.status_code == 200
    assert res_asset_final.json()["verification_status"] == "VERIFIED"


def test_impact_and_methodology_apis():
    """Test /api/v1/impact portfolio summary and methodology endpoints."""
    # Portfolio summary
    res_impact = client.get("/api/v1/impact")
    assert res_impact.status_code == 200
    summary = res_impact.json()
    assert summary["total_applications"] >= 4
    assert summary["total_assets_verified"] >= 1
    assert summary["total_capital_deployed_inr"] > 0

    # Methodologies
    res_meth = client.get("/api/v1/impact/methodologies")
    assert res_meth.status_code == 200
    assert len(res_meth.json()) >= 2

    # Illustrative scenario
    res_scen = client.get("/api/v1/impact/scenario?emissions_avoided_tco2e=5.0&price_usd=25.0")
    assert res_scen.status_code == 200
    scen_data = res_scen.json()
    assert scen_data["illustrative_annual_value_usd"] == 125.0
    assert scen_data["illustrative_annual_value_inr"] == 10500.0


def test_audit_trail_api():
    """Test /api/v1/audit endpoint."""
    res = client.get("/api/v1/audit?limit=20")
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 1
    assert "event_id" in events[0]
    assert "action" in events[0]


def test_demo_reset_api():
    """Test POST /api/v1/demo/reset."""
    res = client.post("/api/v1/demo/reset")
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    assert res.json()["applications_seeded"] >= 4
