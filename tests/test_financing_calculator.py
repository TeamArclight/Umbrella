"""Tests for Deterministic Financing Scenario and Savings Payback Calculator."""

import pytest
from umbrella.engine.financing import FinancingCalculator
from umbrella.schemas.resilience import FinancingScenarioRequest


def test_standard_amortization_monthly():
    """Verify standard monthly EMI calculation against standard financial formula."""
    # Principal = 50,000, 12% annual, 24 months
    # Formula: P * r * (1+r)^n / ((1+r)^n - 1) where r = 0.01
    # 50,000 * 0.01 * (1.01)^24 / ((1.01)^24 - 1) = 500 * 1.2697346 / 0.2697346 = ~2,353.67
    req = FinancingScenarioRequest(
        intervention_cost_inr=60000.0,
        borrower_contribution_inr=10000.0,
        annual_interest_rate_pct=12.0,
        tenure_months=24,
        repayment_frequency="MONTHLY",
    )
    res = FinancingCalculator.calculate_scenario(req)

    assert res.financed_principal_inr == 50000.0
    assert res.number_of_installments == 24
    assert 2350.0 < res.estimated_installment_inr < 2360.0
    assert res.total_repayment_inr > res.financed_principal_inr
    assert round(res.total_financing_cost_inr, 2) == round(res.total_repayment_inr - res.financed_principal_inr, 2)
    assert len(res.calculation_assumptions) >= 3


def test_zero_interest_rate():
    """Verify clean zero-interest scenario."""
    req = FinancingScenarioRequest(
        intervention_cost_inr=18000.0,
        borrower_contribution_inr=3000.0,
        annual_interest_rate_pct=0.0,
        tenure_months=12,
        repayment_frequency="MONTHLY",
    )
    res = FinancingCalculator.calculate_scenario(req)

    assert res.financed_principal_inr == 15000.0
    assert res.estimated_installment_inr == 1250.0
    assert res.total_repayment_inr == 15000.0
    assert res.total_financing_cost_inr == 0.0


def test_repayment_frequencies():
    """Verify bi-weekly and weekly installment numbers."""
    req_bi = FinancingScenarioRequest(
        intervention_cost_inr=20000.0,
        borrower_contribution_inr=5000.0,
        annual_interest_rate_pct=14.0,
        tenure_months=12,
        repayment_frequency="BI_WEEKLY",
    )
    res_bi = FinancingCalculator.calculate_scenario(req_bi)
    assert res_bi.number_of_installments == 26

    req_wk = FinancingScenarioRequest(
        intervention_cost_inr=20000.0,
        borrower_contribution_inr=5000.0,
        annual_interest_rate_pct=14.0,
        tenure_months=12,
        repayment_frequency="WEEKLY",
    )
    res_wk = FinancingCalculator.calculate_scenario(req_wk)
    assert res_wk.number_of_installments == 52


def test_financing_validation_errors():
    """Verify rejection of invalid financial inputs."""
    # Negative cost
    with pytest.raises(ValueError, match="greater than 0"):
        FinancingCalculator.calculate_scenario(
            FinancingScenarioRequest(intervention_cost_inr=-500.0, borrower_contribution_inr=0.0)
        )

    # Contribution >= cost
    with pytest.raises(ValueError, match="strictly less than"):
        FinancingCalculator.calculate_scenario(
            FinancingScenarioRequest(intervention_cost_inr=10000.0, borrower_contribution_inr=10000.0)
        )

    # Negative contribution
    with pytest.raises(ValueError, match="greater than or equal to 0"):
        FinancingCalculator.calculate_scenario(
            FinancingScenarioRequest(intervention_cost_inr=10000.0, borrower_contribution_inr=-100.0)
        )

    # Interest out of range
    with pytest.raises(ValueError, match="less than or equal to 40"):
        FinancingCalculator.calculate_scenario(
            FinancingScenarioRequest(
                intervention_cost_inr=10000.0, borrower_contribution_inr=1000.0, annual_interest_rate_pct=45.0
            )
        )

    # Tenure too short
    with pytest.raises(ValueError, match="greater than or equal to 3"):
        FinancingCalculator.calculate_scenario(
            FinancingScenarioRequest(
                intervention_cost_inr=10000.0, borrower_contribution_inr=1000.0, tenure_months=2
            )
        )


def test_savings_and_payback_solar_pump():
    """Verify savings calculation for solar irrigation pump replacing diesel."""
    req = FinancingScenarioRequest(
        intervention_cost_inr=125000.0,
        borrower_contribution_inr=75000.0,  # e.g. subsidy + margin
        annual_interest_rate_pct=12.0,
        tenure_months=24,
    )
    res = FinancingCalculator.calculate_scenario(req, intervention_id="solar-irrigation-pump")

    assert res.savings_payback.supported is True
    assert res.savings_payback.baseline_annual_operating_cost_inr > 60000.0
    assert res.savings_payback.estimated_annual_savings_inr > 50000.0
    assert 0.5 <= res.savings_payback.simple_payback_years <= 2.5
    assert len(res.savings_payback.assumptions) >= 3


def test_savings_and_payback_hermetic_silo():
    """Verify savings calculation for elevated hermetic grain silo."""
    req = FinancingScenarioRequest(
        intervention_cost_inr=18000.0,
        borrower_contribution_inr=3000.0,
        annual_interest_rate_pct=13.5,
        tenure_months=12,
    )
    res = FinancingCalculator.calculate_scenario(req, intervention_id="raised-hermetic-silo")

    assert res.savings_payback.supported is True
    assert res.savings_payback.estimated_annual_savings_inr > 4000.0
    assert res.savings_payback.simple_payback_years is not None
    assert 2.0 <= res.savings_payback.simple_payback_years <= 5.0


def test_zero_contribution_full_financing():
    """Verify 100% financed principal when borrower contribution is 0."""
    req = FinancingScenarioRequest(
        intervention_cost_inr=25000.0,
        borrower_contribution_inr=0.0,
        annual_interest_rate_pct=10.0,
        tenure_months=12,
        repayment_frequency="MONTHLY",
    )
    res = FinancingCalculator.calculate_scenario(req)
    assert res.financed_principal_inr == 25000.0
    assert res.borrower_contribution_inr == 0.0
    assert res.number_of_installments == 12
    assert res.total_repayment_inr > 25000.0


def test_unsupported_intervention_payback():
    """Verify interventions without direct fuel/crop loss displacement return supported=False."""
    req = FinancingScenarioRequest(
        intervention_cost_inr=65000.0,
        borrower_contribution_inr=15000.0,
        annual_interest_rate_pct=12.0,
        tenure_months=24,
    )
    res = FinancingCalculator.calculate_scenario(req, intervention_id="flood-livestock-shelter")
    assert res.savings_payback.supported is False
    assert res.savings_payback.simple_payback_years is None
    assert res.savings_payback.estimated_annual_savings_inr == 0.0

