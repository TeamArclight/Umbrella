"""Tests for Resilience Intervention Catalog and Adaptation Recommendation Engine."""

import pytest
from umbrella.engine.catalog import (
    list_interventions,
    get_intervention,
    list_finance_products,
    get_finance_product,
    get_methodology,
)
from umbrella.engine.adaptation_rec import AdaptationRecommendationEngine


def test_intervention_catalog_structure():
    """Verify that all interventions have complete metadata, lifetimes, and checklists."""
    interventions = list_interventions()
    assert len(interventions) >= 6

    ids = [i.intervention_id for i in interventions]
    assert "raised-hermetic-silo" in ids
    assert "solar-irrigation-pump" in ids
    assert "flood-livestock-shelter" in ids
    assert "portable-solar-dryer" in ids
    assert "micro-drip-irrigation" in ids
    assert "drainage-culvert-improvement" in ids

    for item in interventions:
        assert item.indicative_cost_inr > 0
        assert 1 <= item.expected_lifetime_years <= 25
        assert len(item.verification_requirements) >= 2
        assert len(item.supported_hazards) >= 1
        assert len(item.suitable_livelihoods) >= 1
        # Mandatory items exist
        mandatory = [c for c in item.verification_requirements if c.is_mandatory]
        assert len(mandatory) >= 1


def test_get_single_intervention():
    """Verify individual intervention lookup and KeyError handling."""
    silo = get_intervention("raised-hermetic-silo")
    assert silo.category == "POST_HARVEST_STORAGE"
    assert silo.environmental_impact_supported is True

    with pytest.raises(KeyError):
        get_intervention("non-existent-gadget")


def test_finance_product_catalog():
    """Verify green finance products have transparent demo flags and terms."""
    products = list_finance_products()
    assert len(products) >= 3

    for prod in products:
        assert prod.synthetic_flag is True
        assert prod.min_amount_inr > 0
        assert prod.max_amount_inr >= prod.min_amount_inr
        assert 0.0 <= prod.indicative_annual_interest_rate_pct <= 36.0
        assert len(prod.eligible_interventions) >= 1


def test_adaptation_recommendations_high_flood():
    """Test recommendation ranking in high flood risk cluster."""
    rec_engine = AdaptationRecommendationEngine()
    response = rec_engine.evaluate_village_interventions(
        village_id="VIL-DAR-HAY",
        village_name="Hayaghat",
        hazard_score=82.5,
        hazard_level="HIGH",
        priority_level="CRITICAL",
        hazard_drivers=["Precipitation anomaly: +45mm", "Active floodplain basin"],
        livelihoods=["AGRICULTURE_PADDY", "DAIRY_AND_LIVESTOCK"],
    )

    assert response.village_id == "VIL-DAR-HAY"
    assert response.hazard_score == 82.5
    assert len(response.recommendations) >= 3

    top_rec = response.recommendations[0]
    # In high flood, raised silo or livestock shelter should be near the top
    assert top_rec.ranking_score >= 80.0
    assert len(top_rec.triggering_hazard_factors) >= 1
    assert len(top_rec.suitability_factors) >= 1
    assert len(top_rec.exclusions_or_limitations) >= 1
    assert "DECISION-SUPPORT NOTICE" in response.disclaimer


def test_adaptation_recommendations_livelihood_filtering():
    """Ensure livestock shelter is scored appropriately based on livelihood presence."""
    rec_engine = AdaptationRecommendationEngine()

    # Dairy livelihood present
    res_dairy = rec_engine.evaluate_village_interventions(
        village_id="VIL-DAR-KUS",
        village_name="Kusheshwar Asthan",
        hazard_score=85.0,
        hazard_level="SEVERE",
        priority_level="CRITICAL",
        livelihoods=["DAIRY_AND_LIVESTOCK"],
    )
    shelter_dairy = next((r for r in res_dairy.recommendations if r.intervention.intervention_id == "flood-livestock-shelter"), None)
    assert shelter_dairy is not None
    assert shelter_dairy.ranking_score >= 80.0

    # Only fisheries & crafts present (no dairy)
    res_no_dairy = rec_engine.evaluate_village_interventions(
        village_id="VIL-DAR-TEST",
        village_name="Test Village",
        hazard_score=85.0,
        hazard_level="SEVERE",
        priority_level="CRITICAL",
        livelihoods=["ARTISAN_AND_CRAFTS"],
    )
    shelter_no_dairy = next((r for r in res_no_dairy.recommendations if r.intervention.intervention_id == "flood-livestock-shelter"), None)
    # Shelter should either be filtered out or have significantly lower score
    if shelter_no_dairy:
        assert shelter_no_dairy.ranking_score < shelter_dairy.ranking_score
