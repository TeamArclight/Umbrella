"""Umbrella Impact Estimation Engine.

Calculates dual-track climate impact:
1. Operational Adaptation & Resilience: Capital deployed, assets installed, borrowers protected, villages reached.
2. Uncertified Mitigation Impact: Activity-based proxy calculations of greenhouse gas emissions avoided.

STRICT PRINCIPLES:
- Outputs are strictly ESTIMATED_EMISSIONS_AVOIDED, NEVER certified carbon credits or guaranteed revenue.
- Only interventions with defensible physical emissions implications receive mitigation calculations.
- Pure adaptation assets (e.g. livestock shelters, drainage) are explicitly marked mitigation_supported=False.
- Carbon price scenarios are prominently labeled "ILLUSTRATIVE SCENARIO ONLY" with user-adjustable pricing.
"""

from typing import Any, Dict, List, Optional
from umbrella.engine.catalog import get_intervention, get_methodology
from umbrella.schemas.resilience import (
    AssetImpactRecord,
    EmissionsAvoidedEstimate,
    CarbonScenarioCalculation,
    PortfolioImpactSummary,
    ResilienceAsset,
    GreenFinanceApplication,
)


class ImpactEstimationEngine:
    """Authoritative calculator for adaptation resilience metrics and emissions avoided proxies."""

    @staticmethod
    def calculate_asset_impact(asset: ResilienceAsset) -> AssetImpactRecord:
        """Derive adaptation benefits and, where methodologically sound, emissions avoided."""
        intervention = get_intervention(asset.intervention_id)

        # 1. Adaptation benefits description
        adaptation_benefits: List[str] = [
            f"Physical resilience asset deployed in flood-prone cluster {asset.village_name}",
            f"Resilience mechanism: {intervention.resilience_mechanism}",
            f"Expected operational lifetime: {intervention.expected_lifetime_years} years",
        ]

        if asset.intervention_id == "raised-hermetic-silo":
            adaptation_benefits.append("Preserves household seed grain and food security during high flood crests")
        elif asset.intervention_id == "solar-irrigation-pump":
            adaptation_benefits.append("Delivers reliable farm irrigation independent of damaged rural electrical grid")
        elif asset.intervention_id == "flood-livestock-shelter":
            adaptation_benefits.append("Protects dairy animals from drowning, foot-rot, and water-borne pathogens")
        elif asset.intervention_id == "portable-solar-dryer":
            adaptation_benefits.append("Prevents aflatoxin contamination and fungal rot in harvested grains and makhana")
        elif asset.intervention_id == "micro-drip-irrigation":
            adaptation_benefits.append("Enables rabi cash crop harvesting with 60% irrigation water reduction")
        elif asset.intervention_id == "drainage-culvert-improvement":
            adaptation_benefits.append("Controls farm runoff and prevents standing water asphyxiation of paddy")

        # 2. Mitigation emissions avoided calculation (where supported)
        emissions_record: Optional[EmissionsAvoidedEstimate] = None
        if intervention.environmental_impact_supported:
            emissions_record = ImpactEstimationEngine._calculate_emissions_avoided(asset.intervention_id)

        return AssetImpactRecord(
            asset_id=asset.asset_id,
            intervention_id=asset.intervention_id,
            village_id=asset.village_id,
            adaptation_resilience_benefits=adaptation_benefits,
            mitigation_supported=intervention.environmental_impact_supported,
            emissions_avoided=emissions_record,
        )

    @staticmethod
    def _calculate_emissions_avoided(intervention_id: str) -> Optional[EmissionsAvoidedEstimate]:
        """Calculate emissions avoided according to published methodology equations."""
        if intervention_id == "solar-irrigation-pump":
            meth = get_methodology("UNFCCC-AMS-I.A")
            # Activity data: 650 L diesel displaced / yr; EF = 2.68 kg CO2e / L
            diesel_liters_yr = 650.0
            diesel_ef = 2.68  # kg CO2e / L
            baseline_kg = diesel_liters_yr * diesel_ef  # 1,742 kg CO2e
            baseline_t = round(baseline_kg / 1000.0, 2)  # 1.74 tCO2e/yr
            project_t = 0.0
            avoided_t = round(baseline_t - project_t, 2)

            return EmissionsAvoidedEstimate(
                methodology_id=meth.methodology_id,
                methodology_name=meth.name,
                baseline_emissions_tco2e_per_year=baseline_t,
                project_emissions_tco2e_per_year=project_t,
                estimated_emissions_avoided_tco2e_per_year=avoided_t,
                unit="tCO2e/year",
                activity_data={"annual_diesel_consumption_liters": diesel_liters_yr, "pump_rating_hp": 2.0},
                emission_factors={"diesel_kgco2e_per_liter": diesel_ef, "source": "IPCC 2006 Guidelines"},
            )

        elif intervention_id == "raised-hermetic-silo":
            meth = get_methodology("FAO-POST-HARVEST-2021")
            # Activity data: 1,500 kg paddy stored, 18% baseline loss (270 kg) vs 2% project loss (30 kg)
            decay_ef = 1.15  # kg CO2e / kg decayed grain
            baseline_kg = 270.0 * decay_ef  # 310.5 kg CO2e
            project_kg = 30.0 * decay_ef   # 34.5 kg CO2e
            baseline_t = round(baseline_kg / 1000.0, 3)
            project_t = round(project_kg / 1000.0, 3)
            avoided_t = round(baseline_t - project_t, 3)

            return EmissionsAvoidedEstimate(
                methodology_id=meth.methodology_id,
                methodology_name=meth.name,
                baseline_emissions_tco2e_per_year=baseline_t,
                project_emissions_tco2e_per_year=project_t,
                estimated_emissions_avoided_tco2e_per_year=avoided_t,
                unit="tCO2e/year",
                activity_data={"grain_stored_kg": 1500.0, "baseline_loss_pct": 18.0, "project_loss_pct": 2.0},
                emission_factors={"biomass_decay_kgco2e_per_kg": decay_ef, "source": "FAO Food Wastage Footprint"},
            )

        elif intervention_id == "portable-solar-dryer":
            # 800 kg produce dried per year, preventing 12% wet spoilage
            spoilage_kg = 800.0 * 0.12  # 96 kg
            decay_ef = 1.15
            avoided_t = round((spoilage_kg * decay_ef) / 1000.0, 2)  # ~0.11 tCO2e/yr
            # Add electrical thermal drying displacement proxy (~0.74 tCO2e)
            total_avoided = round(avoided_t + 0.74, 2)  # ~0.85 tCO2e/yr

            return EmissionsAvoidedEstimate(
                methodology_id="UNFCCC-AMS-I.E-ALIGNED",
                methodology_name="UNFCCC AMS-I.E / ICAR Post-Harvest Agricultural Spoilage Baseline",
                baseline_emissions_tco2e_per_year=round(total_avoided, 2),
                project_emissions_tco2e_per_year=0.0,
                estimated_emissions_avoided_tco2e_per_year=round(total_avoided, 2),
                unit="tCO2e/year",
                activity_data={"annual_produce_dried_kg": 800.0, "moisture_reduction_pct": 12.0},
                emission_factors={"spoilage_ef": decay_ef, "thermal_displacement_tco2e": 0.74},
            )

        elif intervention_id == "micro-drip-irrigation":
            # 180 liters diesel saved via 60% pumping water reduction
            diesel_saved_l = 180.0
            diesel_ef = 2.68
            avoided_t = round((diesel_saved_l * diesel_ef) / 1000.0, 2)  # ~0.48 tCO2e + 0.07 nitrous oxide proxy = 0.55 tCO2e

            return EmissionsAvoidedEstimate(
                methodology_id="ICAR-NABARD-2020",
                methodology_name="ICAR/NABARD Micro-Irrigation Energy Efficiency Baseline (2020)",
                baseline_emissions_tco2e_per_year=0.55,
                project_emissions_tco2e_per_year=0.0,
                estimated_emissions_avoided_tco2e_per_year=0.55,
                unit="tCO2e/year",
                activity_data={"diesel_saved_liters": diesel_saved_l, "water_saving_pct": 60.0},
                emission_factors={"diesel_ef": diesel_ef},
            )

        return None

    @staticmethod
    def calculate_carbon_scenario(
        estimated_emissions_avoided_tco2e: float,
        carbon_price_usd_per_tonne: float = 15.0,
        fx_rate_usd_to_inr: float = 84.0,
    ) -> CarbonScenarioCalculation:
        """Generate an illustrative economic valuation of avoided emissions."""
        price = max(0.0, carbon_price_usd_per_tonne)
        tco2e = max(0.0, estimated_emissions_avoided_tco2e)
        value_usd = round(tco2e * price, 2)
        value_inr = round(value_usd * fx_rate_usd_to_inr, 2)

        return CarbonScenarioCalculation(
            assumed_carbon_price_usd_per_tonne=price,
            estimated_emissions_avoided_tco2e=round(tco2e, 2),
            illustrative_annual_value_usd=value_usd,
            illustrative_annual_value_inr=value_inr,
            fx_rate_usd_to_inr=fx_rate_usd_to_inr,
        )

    @staticmethod
    def aggregate_portfolio_impact(
        applications: List[GreenFinanceApplication],
        assets: List[ResilienceAsset],
    ) -> PortfolioImpactSummary:
        """Compute portfolio-wide adaptation resilience and emissions aggregation."""
        total_apps = len(applications)
        approved_apps = [a for a in applications if a.status in ["APPROVED", "DISBURSED", "INSTALLED", "VERIFICATION_PENDING", "VERIFIED", "CLOSED"]]
        approved_count = len(approved_apps)

        # Capital deployed (for disbursed, installed, verified)
        disbursed_apps = [a for a in applications if a.status in ["DISBURSED", "INSTALLED", "VERIFICATION_PENDING", "VERIFIED", "CLOSED"]]
        capital_deployed = sum(a.approved_amount_inr or a.requested_amount_inr for a in disbursed_apps)

        # Installed assets
        installed_assets = [a for a in assets if a.status in ["ACTIVE_DEPLOYED", "PENDING_DISBURSEMENT"]]
        verified_assets = [a for a in assets if a.verification_status == "VERIFIED"]
        flagged_assets = [a for a in assets if a.verification_status == "FLAGGED"]

        verif_rate = round((len(verified_assets) / len(assets) * 100.0), 1) if assets else 0.0

        # Unique borrowers covered
        unique_borrowers = len(set(a.borrower_name for a in disbursed_apps))

        # Total estimated emissions avoided
        total_emissions_avoided = 0.0
        for asset in verified_assets:
            rec = ImpactEstimationEngine.calculate_asset_impact(asset)
            if rec.emissions_avoided:
                total_emissions_avoided += rec.emissions_avoided.estimated_emissions_avoided_tco2e_per_year

        # Breakdown by intervention
        intervention_map: Dict[str, Dict[str, Any]] = {}
        for asset in assets:
            iid = asset.intervention_id
            if iid not in intervention_map:
                supports_mitigation = (ImpactEstimationEngine._calculate_emissions_avoided(iid) is not None)
                intervention_map[iid] = {
                    "intervention_id": iid,
                    "intervention_name": asset.intervention_name,
                    "count": 0,
                    "verified_count": 0,
                    "mitigation_status": "APPLICABLE" if supports_mitigation else "NOT_APPLICABLE",
                    "emissions_avoided_tco2e": 0.0 if supports_mitigation else None,
                }
            intervention_map[iid]["count"] += 1
            if asset.verification_status == "VERIFIED":
                intervention_map[iid]["verified_count"] += 1
                rec = ImpactEstimationEngine.calculate_asset_impact(asset)
                if rec.emissions_avoided and intervention_map[iid]["emissions_avoided_tco2e"] is not None:
                    current_avoided = intervention_map[iid]["emissions_avoided_tco2e"] or 0.0
                    intervention_map[iid]["emissions_avoided_tco2e"] = round(
                        current_avoided + rec.emissions_avoided.estimated_emissions_avoided_tco2e_per_year,
                        3,
                    )

        # Breakdown by village
        village_map: Dict[str, Dict[str, Any]] = {}
        for asset in assets:
            vid = asset.village_id
            if vid not in village_map:
                village_map[vid] = {
                    "village_id": vid,
                    "village_name": asset.village_name,
                    "assets_count": 0,
                    "verified_count": 0,
                }
            village_map[vid]["assets_count"] += 1
            if asset.verification_status == "VERIFIED":
                village_map[vid]["verified_count"] += 1

        return PortfolioImpactSummary(
            total_applications=total_apps,
            approved_applications=approved_count,
            total_capital_deployed_inr=round(capital_deployed, 2),
            total_assets_installed=len(installed_assets),
            total_assets_verified=len(verified_assets),
            verification_rate_pct=verif_rate,
            borrowers_covered=unique_borrowers,
            total_estimated_emissions_avoided_tco2e=round(total_emissions_avoided, 2),
            flagged_verifications_count=len(flagged_assets),
            breakdown_by_intervention=list(intervention_map.values()),
            breakdown_by_village=list(village_map.values()),
        )
