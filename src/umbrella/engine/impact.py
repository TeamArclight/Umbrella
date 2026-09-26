"""Portfolio Climate Impact / Risk Priority Engine.

Combines the independently calculated Flood Hazard Score and Portfolio Exposure
to determine operational lender intervention priority.

PRINCIPLE:
Preserves the raw physical hazard score and raw portfolio exposure figures.
Does NOT conflate portfolio size with physical flood probability.
"""

from typing import Literal

from umbrella.schemas.hazard import FloodHazardEvaluation
from umbrella.schemas.portfolio import PortfolioExposure
from umbrella.schemas.impact import PortfolioClimateImpact


class PortfolioImpactEngine:
    """Combines independent hazard and portfolio exposure into operational priority."""

    FORMULA_VERSION = "PortfolioPriority-v1.0"
    WEIGHT_HAZARD = 0.60
    WEIGHT_EXPOSURE = 0.40

    def evaluate_priority(
        self,
        hazard: FloodHazardEvaluation,
        exposure: PortfolioExposure,
    ) -> PortfolioClimateImpact:
        """Calculate operational attention priority (0–100) while keeping inputs uncorrupted."""
        # 1. Normalize portfolio financial exposure (0 to 100)
        # Scaled against typical branch clusters (₹25,00,000 capital + 50 borrowers = 100 pts)
        capital_score = min(80.0, (exposure.outstanding_amount / 2_500_000.0) * 80.0)
        borrower_score = min(20.0, (exposure.borrowers_exposed / 50.0) * 20.0)
        norm_exposure = round(min(100.0, capital_score + borrower_score), 2)

        # 2. Weighted priority calculation
        # Priority = 0.60 * Hazard + 0.40 * Exposure
        hazard_contrib = round(hazard.hazard_score * self.WEIGHT_HAZARD, 2)
        exposure_contrib = round(norm_exposure * self.WEIGHT_EXPOSURE, 2)
        priority_score = round(hazard_contrib + exposure_contrib, 1)
        priority_score = min(100.0, max(0.0, priority_score))

        # 3. Categorize operational priority
        if priority_score >= 70.0:
            priority_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "CRITICAL"
        elif priority_score >= 50.0:
            priority_level = "HIGH"
        elif priority_score >= 30.0:
            priority_level = "MEDIUM"
        else:
            priority_level = "LOW"

        calc_details = {
            "raw_hazard_score": hazard.hazard_score,
            "hazard_weight": self.WEIGHT_HAZARD,
            "hazard_contribution": hazard_contrib,
            "raw_outstanding_inr": exposure.outstanding_amount,
            "raw_borrower_count": exposure.borrowers_exposed,
            "normalized_exposure_score": norm_exposure,
            "exposure_weight": self.WEIGHT_EXPOSURE,
            "exposure_contribution": exposure_contrib,
            "combined_priority_score": priority_score,
        }

        return PortfolioClimateImpact(
            village_id=exposure.village_id,
            village_name=exposure.village_name,
            district=exposure.district,
            state=exposure.state,
            hazard_score=hazard.hazard_score,
            hazard_level=hazard.hazard_level,
            forecast_horizon_days=hazard.forecast_horizon_days,
            portfolio_exposure=exposure,
            priority_score=priority_score,
            priority_level=priority_level,
            formula_version=self.FORMULA_VERSION,
            formula_description=(
                "Priority Score = 0.60 * Hazard Score + 0.40 * Normalized Portfolio Exposure Score"
            ),
            calculation_details=calc_details,
        )
