"""Umbrella Transparent Adaptation Recommendation Engine.

Maps environmental hazard conditions, terrain susceptibility, and borrower livelihoods
into ranked, explainable resilience interventions.

DESIGN RULES:
1. No Black-Box AI: Purely transparent, deterministic scoring rules.
2. Complete Explainability: Exposes triggering hazard factors, suitability factors, and exclusions.
3. Decision Support: Does not guarantee loss avoidance; provides advisory guidance for loan officers.
"""

from typing import List, Optional
from umbrella.engine.catalog import list_interventions
from umbrella.schemas.resilience import (
    ResilienceIntervention,
    AdaptationRecommendation,
    AdaptationRecommendationResponse,
    LivelihoodType,
)


class AdaptationRecommendationEngine:
    """Evaluates village climate conditions and recommends ranked resilience interventions."""

    def evaluate_village_interventions(
        self,
        village_id: str,
        village_name: str,
        hazard_score: float,
        hazard_level: str,
        priority_level: str,
        hazard_drivers: Optional[List[str]] = None,
        livelihoods: Optional[List[LivelihoodType]] = None,
    ) -> AdaptationRecommendationResponse:
        """Generate ranked, explainable adaptation recommendations for a village cluster."""
        drivers = hazard_drivers or [
            "Monsoon riverine flood basin proximity",
            "Elevated seasonal precipitation anomaly",
            "Slow natural soil drainage & low relief",
        ]
        active_livelihoods = livelihoods or [
            "AGRICULTURE_PADDY",
            "AGRICULTURE_VEGETABLES",
            "DAIRY_AND_LIVESTOCK",
            "AGRICULTURE_MAKHANA",
        ]

        catalog = list_interventions()
        recommendations: List[AdaptationRecommendation] = []

        for intervention in catalog:
            score, reason, triggers, suitability, exclusions = self._score_intervention(
                intervention=intervention,
                hazard_score=hazard_score,
                hazard_level=hazard_level,
                priority_level=priority_level,
                drivers=drivers,
                livelihoods=active_livelihoods,
            )

            # Filter out interventions with low or zero relevance
            if score >= 40.0:
                recommendations.append(
                    AdaptationRecommendation(
                        intervention=intervention,
                        ranking_score=round(score, 1),
                        primary_reason=reason,
                        triggering_hazard_factors=triggers,
                        suitability_factors=suitability,
                        exclusions_or_limitations=exclusions,
                        recommendation_version="AdaptationRec-v1.0",
                    )
                )

        # Sort recommendations by ranking_score descending
        recommendations.sort(key=lambda r: r.ranking_score, reverse=True)

        return AdaptationRecommendationResponse(
            village_id=village_id,
            village_name=village_name,
            hazard_score=round(hazard_score, 1),
            hazard_level=hazard_level,
            priority_level=priority_level,
            recommendations=recommendations,
        )

    def _score_intervention(
        self,
        intervention: ResilienceIntervention,
        hazard_score: float,
        hazard_level: str,
        priority_level: str,
        drivers: List[str],
        livelihoods: List[LivelihoodType],
    ):
        """Deterministic rule-based scoring of a single intervention against village context."""
        base_score = 50.0
        triggers: List[str] = []
        suitability: List[str] = []
        exclusions: List[str] = []

        # 1. Hazard Compatibility Matching
        is_flood_hazard = any(h in intervention.supported_hazards for h in ["FLOOD", "WATERLOGGING", "FLASH_FLOOD"])

        if is_flood_hazard and hazard_level in ["HIGH", "SEVERE"]:
            base_score += 30.0
            triggers.append(f"Elevated flood hazard ({hazard_level} - score {hazard_score:.1f}/100)")
            for d in drivers[:2]:
                triggers.append(f"Driver: {d}")
        elif is_flood_hazard and hazard_level == "MODERATE":
            base_score += 15.0
            triggers.append(f"Moderate flood hazard ({hazard_score:.1f}/100) creates seasonal vulnerability")
        elif not is_flood_hazard and hazard_level in ["HIGH", "SEVERE"]:
            base_score -= 20.0
            exclusions.append("Intervention primarily targets drought/heat rather than immediate flood risk")

        # 2. Livelihood Matching
        matching_livelihoods = [liv for liv in livelihoods if liv in intervention.suitable_livelihoods]
        if matching_livelihoods:
            base_score += 15.0
            suitability.append(
                f"Directly supports {len(matching_livelihoods)} cluster livelihood(s): "
                f"{', '.join(matching_livelihoods[:2])}"
            )
        else:
            base_score -= 30.0
            exclusions.append("Cluster livelihoods do not match primary equipment use case")

        # 3. Specific Intervention Custom Rules
        if intervention.intervention_id == "raised-hermetic-silo":
            if hazard_level in ["HIGH", "SEVERE"]:
                base_score += 5.0
                reason = "Preserves harvest grains and seeds above floodline; prevents catastrophic mold and aflatoxin losses during courtyard inundation."
            else:
                reason = "Ensures clean grain preservation and protection against rodents and ambient monsoon moisture."
            suitability.append("Compact footprint suitable for marginal farmer homestead courtyards")
            exclusions.append("Requires masonry or elevated earth plinth built prior to flood peak")

        elif intervention.intervention_id == "portable-solar-dryer":
            if "AGRICULTURE_MAKHANA" in livelihoods or "AGRICULTURE_PADDY" in livelihoods:
                base_score += 5.0
                reason = "Accelerates grain and makhana drying from 5 days to 36 hours, preventing fungal rot when open drying grounds are flooded."
            else:
                reason = "Enclosed drying prevents post-harvest spoilage during erratic monsoon cloudbursts."
            suitability.append("Portable design allows rapid relocation to higher elevation during flood alerts")
            exclusions.append("Requires clear unshaded space during daylight hours")

        elif intervention.intervention_id == "solar-irrigation-pump":
            if hazard_level in ["HIGH", "SEVERE"]:
                base_score -= 5.0  # Slightly lower priority during immediate flood compared to storage
                reason = "Decouples irrigation from damaged electric lines and scarce diesel; powers recovery cropping after floodwaters recede."
            else:
                base_score += 10.0
                reason = "Replaces expensive diesel pumping; provides zero-emission year-round water security."
            suitability.append("High return on investment; qualifies for PM-KUSUM capital subsidies")
            exclusions.append("Groundwater table and borehole required; pump must be secured from flood submersion")

        elif intervention.intervention_id == "flood-livestock-shelter":
            if "DAIRY_AND_LIVESTOCK" in livelihoods:
                base_score += 15.0
                reason = "Prevents livestock drowning, foot-rot infection, and water-borne pathogens on waterlogged pasture lands."
            else:
                base_score -= 40.0
                reason = "Community shelter for dairy cattle and small ruminants."
            suitability.append("High community priority for dairy smallholders with 2-4 milch animals")
            exclusions.append("Requires community land access or elevated hamlet commons")

        elif intervention.intervention_id == "drainage-culvert-improvement":
            reason = "Regulates floodwater runoff, preventing long-term water stagnation while retaining beneficial silt alluvium."
            suitability.append("Protects contiguous agricultural plots; improves paddy survival rate")
            exclusions.append("Requires coordination across neighboring plot holders")

        elif intervention.intervention_id == "micro-drip-irrigation":
            reason = "Enables efficient post-monsoon winter vegetable cultivation on residual flood silt."
            suitability.append("60% water conservation; boosts smallholder winter cash crop revenue")
            exclusions.append("Best suited for post-flood rabi season rather than peak flood inundation")

        else:
            reason = f"Promotes operational resilience for {intervention.name}."

        score = max(0.0, min(100.0, base_score))
        return score, reason, triggers, suitability, exclusions
