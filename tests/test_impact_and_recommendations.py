"""Unit tests for Portfolio Impact and Recommendation Engines."""

import pytest
from datetime import datetime
from umbrella.schemas.hazard import FloodHazardEvaluation
from umbrella.schemas.portfolio import PortfolioExposure
from umbrella.engine.impact import PortfolioImpactEngine
from umbrella.engine.recommendation import RecommendationEngine


@pytest.fixture
def sample_hazard_severe():
    return FloodHazardEvaluation(
        hazard="FLOOD",
        label="Flood Risk Early Warning",
        village_id="VIL-TEL-001",
        village_name="Sirikonda",
        district="Nizamabad",
        state="Telangana",
        latitude=18.552,
        longitude=78.291,
        hazard_score=82.0,
        hazard_level="SEVERE",
        forecast_horizon_days=5,
        drivers=["Heavy rainfall accumulation", "Low-lying basin drainage"],
        narrative="Severe flood hazard indicated by heavy forecast rainfall.",
        data_source_mode="MOCK",
    )


@pytest.fixture
def sample_exposure():
    return PortfolioExposure(
        village_id="VIL-TEL-001",
        village_name="Sirikonda",
        district="Nizamabad",
        state="Telangana",
        latitude=18.552,
        longitude=78.291,
        borrowers_exposed=40,
        groups_exposed=8,
        active_loans_exposed=40,
        outstanding_amount=1_600_000.0,
        green_loans_exposed=8,
        currency="INR",
        data_type="SYNTHETIC",
        portfolio_source="SyntheticPortfolioProvider",
        average_loan_size_inr=40000.0,
    )


def test_portfolio_impact_preserves_raw_scores(sample_hazard_severe, sample_exposure):
    """Verify that PortfolioImpact preserves raw hazard and raw exposure values."""
    engine = PortfolioImpactEngine()
    impact = engine.evaluate_priority(sample_hazard_severe, sample_exposure)

    # Raw values preserved
    assert impact.hazard_score == 82.0
    assert impact.hazard_level == "SEVERE"
    assert impact.portfolio_exposure.outstanding_amount == 1_600_000.0
    assert impact.portfolio_exposure.borrowers_exposed == 40

    # Operational priority calculated
    assert 0.0 <= impact.priority_score <= 100.0
    assert impact.priority_level in ["HIGH", "CRITICAL"]
    assert "0.60 * Hazard Score + 0.40 * Normalized Portfolio Exposure Score" in impact.formula_description
    assert impact.calculation_details["raw_hazard_score"] == 82.0
    assert "OPERATIONAL PRIORITY INDEX" in impact.disclaimer


def test_recommendation_decision_support_policy(sample_hazard_severe, sample_exposure):
    """Verify recommendation engine enforces decision support rather than automatic execution."""
    impact_engine = PortfolioImpactEngine()
    rec_engine = RecommendationEngine()

    impact = impact_engine.evaluate_priority(sample_hazard_severe, sample_exposure)
    resp = rec_engine.generate_recommendation(impact)

    # 1. Human Decision Record starts in PENDING_REVIEW
    assert resp.human_decision.status == "PENDING_REVIEW"
    assert resp.human_decision.reviewed_by is None
    assert resp.human_decision.approved_grace_period_days is None
    assert len(resp.human_decision.approved_actions) == 0

    # 2. Non-prescriptive advisory language in system recommendations
    advisories = " ".join(resp.system_recommendation.operational_advisories)
    assert "Consider repayment flexibility" in advisories
    assert "Prioritize" in advisories
    # Must NOT contain prohibited automatic action phrases
    assert "Grant moratorium" not in advisories
    assert "Approve restructuring" not in advisories

    # 3. Carbon accounting verification
    assert resp.system_recommendation.carbon_accounting_category == "ESTIMATED_EMISSIONS_AVOIDED"
    assert resp.system_recommendation.estimated_emissions_avoided >= 0.0
    assert "not constitute certified carbon credits" in resp.system_recommendation.carbon_disclaimer
