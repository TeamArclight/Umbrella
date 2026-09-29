"""Tests for Dual-Track Impact Estimation Engine."""

from datetime import datetime, timezone
import pytest
from umbrella.engine.impact_engine import ImpactEstimationEngine
from umbrella.schemas.resilience import ResilienceAsset, GreenFinanceApplication


def make_dummy_asset(intervention_id: str, village_id: str = "VIL-DAR-HAY", verif_status: str = "VERIFIED") -> ResilienceAsset:
    return ResilienceAsset(
        asset_id=f"AST-TEST-{intervention_id[:4]}",
        application_id="APP-TEST-001",
        intervention_id=intervention_id,
        intervention_name=f"Test {intervention_id}",
        borrower_group_id="JLG-01",
        borrower_name="Test Borrower",
        village_id=village_id,
        village_name="Test Village",
        expected_latitude=25.9865,
        expected_longitude=85.9082,
        expected_installation_date=datetime.now(timezone.utc),
        status="ACTIVE_DEPLOYED",
        verification_status=verif_status,
        impact_estimation_status="ESTIMATED",
    )


def test_solar_pump_mitigation_impact():
    """Verify emissions avoided calculation for solar irrigation pump replacing diesel."""
    asset = make_dummy_asset("solar-irrigation-pump")
    impact_rec = ImpactEstimationEngine.calculate_asset_impact(asset)

    assert impact_rec.mitigation_supported is True
    assert impact_rec.emissions_avoided is not None
    assert impact_rec.emissions_avoided.unit == "tCO2e/year"
    assert impact_rec.emissions_avoided.baseline_emissions_tco2e_per_year == 1.74
    assert impact_rec.emissions_avoided.project_emissions_tco2e_per_year == 0.0
    assert impact_rec.emissions_avoided.estimated_emissions_avoided_tco2e_per_year == 1.74
    assert "UNCERTIFIED OPERATIONAL ESTIMATE" in impact_rec.emissions_avoided.disclaimer
    assert "AMS-I.A" in impact_rec.emissions_avoided.methodology_id


def test_hermetic_silo_mitigation_impact():
    """Verify emissions avoided calculation for hermetic grain storage preventing decay."""
    asset = make_dummy_asset("raised-hermetic-silo")
    impact_rec = ImpactEstimationEngine.calculate_asset_impact(asset)

    assert impact_rec.mitigation_supported is True
    assert impact_rec.emissions_avoided is not None
    # 0.276 tCO2e avoided per year
    assert 0.25 <= impact_rec.emissions_avoided.estimated_emissions_avoided_tco2e_per_year <= 0.35


def test_pure_adaptation_asset_has_no_emissions():
    """Verify non-mitigation assets (e.g. livestock shelter) do not fabricate emissions reductions."""
    asset = make_dummy_asset("flood-livestock-shelter")
    impact_rec = ImpactEstimationEngine.calculate_asset_impact(asset)

    assert impact_rec.mitigation_supported is False
    assert impact_rec.emissions_avoided is None
    assert len(impact_rec.adaptation_resilience_benefits) >= 3


def test_carbon_scenario_calculation():
    """Verify illustrative economic scenario calculation."""
    res = ImpactEstimationEngine.calculate_carbon_scenario(
        estimated_emissions_avoided_tco2e=10.0,
        carbon_price_usd_per_tonne=20.0,
        fx_rate_usd_to_inr=84.0,
    )

    assert res.assumed_carbon_price_usd_per_tonne == 20.0
    assert res.estimated_emissions_avoided_tco2e == 10.0
    assert res.illustrative_annual_value_usd == 200.0
    assert res.illustrative_annual_value_inr == 16800.0
    assert "ILLUSTRATIVE SCENARIO ONLY" in res.disclaimer


def test_portfolio_impact_aggregation():
    """Verify portfolio aggregation of deployed capital, verified assets, and emissions."""
    apps = [
        GreenFinanceApplication(
            application_id="APP-1",
            village_id="VIL-1",
            village_name="Village 1",
            borrower_group_id="JLG-1",
            borrower_name="Borrower A",
            livelihood="AGRICULTURE_PADDY",
            intervention_id="solar-irrigation-pump",
            finance_product_id="prod-solar-equipment",
            requested_amount_inr=50000.0,
            approved_amount_inr=50000.0,
            status="VERIFIED",
        ),
        GreenFinanceApplication(
            application_id="APP-2",
            village_id="VIL-2",
            village_name="Village 2",
            borrower_group_id="JLG-2",
            borrower_name="Borrower B",
            livelihood="AGRICULTURE_PADDY",
            intervention_id="raised-hermetic-silo",
            finance_product_id="prod-micro-adaptation",
            requested_amount_inr=15000.0,
            approved_amount_inr=15000.0,
            status="VERIFIED",
        ),
    ]

    assets = [
        make_dummy_asset("solar-irrigation-pump", village_id="VIL-1", verif_status="VERIFIED"),
        make_dummy_asset("raised-hermetic-silo", village_id="VIL-2", verif_status="VERIFIED"),
    ]

    summary = ImpactEstimationEngine.aggregate_portfolio_impact(applications=apps, assets=assets)

    assert summary.total_applications == 2
    assert summary.approved_applications == 2
    assert summary.total_capital_deployed_inr == 65000.0
    assert summary.total_assets_verified == 2
    assert summary.verification_rate_pct == 100.0
    assert summary.borrowers_covered == 2
    assert summary.total_estimated_emissions_avoided_tco2e > 1.5
