"""Umbrella Recommendation Engine.

Generates non-prescriptive decision-support advisories for human credit and risk officers.

DECISION-SUPPORT POLICY:
1. Umbrella provides recommendations, not automated credit actions.
2. System recommendations are strictly separated from auditable human decisions.
3. Prohibited language: 'Grant moratorium', 'Approve restructuring'.
4. Approved language: 'Consider repayment flexibility', 'Prioritize field assessment'.
5. Carbon logic: strictly labelled ESTIMATED_EMISSIONS_AVOIDED with disclaimers.
"""

from typing import List

from umbrella.schemas.impact import PortfolioClimateImpact
from umbrella.schemas.recommendation import (
    HumanDecisionRecord,
    SystemRecommendation,
    MFIRecommendationResponse,
)


class RecommendationEngine:
    """Generates decision-support advisories for microfinance management review."""

    def generate_recommendation(
        self,
        impact: PortfolioClimateImpact,
    ) -> MFIRecommendationResponse:
        """Derive actionable operational advisories for human officer review."""
        hazard_level = impact.hazard_level
        priority_level = impact.priority_level
        exposure = impact.portfolio_exposure
        exposed_inr = exposure.outstanding_amount

        advisories: List[str] = []
        priority_groups: List[str] = []
        sms_template = None
        suggested_grace_days = 0

        if priority_level == "CRITICAL":
            suggested_grace_days = 14
            advisories = [
                f"Consider repayment flexibility (up to 14 days) for affected groups in {exposure.village_name}.",
                "Prioritize rapid field assessment by branch credit officers before scheduled collections.",
                "Review high-exposure clusters and verify crop drainage conditions with center leaders.",
                "Verify eligibility for parametric or emergency relief payouts where applicable.",
            ]
            sms_template = (
                f"ADVISORY: Severe weather expected near {exposure.village_name}. "
                f"Field officers are coordinating with center leaders. Repayment flexibility is under review."
            )
            priority_groups = [g.group_id for g in exposure.groups[:4]]
            # Estimated portfolio capital subject to heightened risk (~18% of exposed amount)
            est_par_impact = round(exposed_inr * 0.18, 2)
            # Agricultural activity proxy for sustainable practice adoption: ~0.45 tCO2e per farming client
            est_emissions_avoided = round(exposure.borrowers_exposed * 0.45, 1)

        elif priority_level == "HIGH":
            suggested_grace_days = 7
            advisories = [
                f"Consider repayment flexibility (up to 7 days) for vulnerable agricultural borrowers in {exposure.village_name}.",
                "Prioritize field assessment and open communication with Joint Liability Group leaders.",
                "Send early-warning weather advisory communication to field staff.",
            ]
            sms_template = (
                f"NOTICE: Elevated rainfall alert for {exposure.village_name}. "
                f"Please inspect bunds and crop drainage. Contact your branch officer for assistance."
            )
            priority_groups = [g.group_id for g in exposure.groups[:2]]
            est_par_impact = round(exposed_inr * 0.10, 2)
            est_emissions_avoided = round(exposure.borrowers_exposed * 0.25, 1)

        elif priority_level == "MEDIUM":
            suggested_grace_days = 0
            advisories = [
                "Maintain standard monitoring of local meteorological updates.",
                "Review high-exposure clusters during routine weekly center meetings.",
            ]
            priority_groups = []
            est_par_impact = round(exposed_inr * 0.03, 2)
            est_emissions_avoided = round(exposure.borrowers_exposed * 0.10, 1)

        else:  # LOW
            suggested_grace_days = 0
            advisories = [
                "Routine operational monitoring; no emergency interventions indicated.",
            ]
            priority_groups = []
            est_par_impact = 0.0
            est_emissions_avoided = 0.0

        adaptation_practices = [
            "Promote sub-surface drainage techniques and field bund reinforcement",
            "Encourage flood-tolerant paddy varieties (e.g. Swarna-Sub1)",
            "Adopt solar-powered micro-irrigation sets to replace diesel pumping units",
        ]

        system_rec = SystemRecommendation(
            village_id=impact.village_id,
            village_name=impact.village_name,
            hazard_level=hazard_level,
            priority_level=priority_level,
            recommended_grace_period_days=suggested_grace_days,
            operational_advisories=advisories,
            sms_advisory_template=sms_template,
            priority_review_groups=priority_groups,
            climate_adaptation_practices=adaptation_practices,
            estimated_portfolio_at_risk_inr=est_par_impact,
            estimated_emissions_avoided=est_emissions_avoided,
            carbon_accounting_category="ESTIMATED_EMISSIONS_AVOIDED",
        )

        # Human decision record starts as PENDING_REVIEW
        human_decision = HumanDecisionRecord(
            status="PENDING_REVIEW",
            reviewed_by=None,
            reviewed_at=None,
            approved_grace_period_days=None,
            approved_actions=[],
            reviewer_notes=None,
        )

        return MFIRecommendationResponse(
            village_id=impact.village_id,
            village_name=impact.village_name,
            system_recommendation=system_rec,
            human_decision=human_decision,
        )
