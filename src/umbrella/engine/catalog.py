"""Umbrella Resilience Intervention & Green Finance Product Catalog.

Maintains the authoritative registry of:
1. Physical Climate-Resilience Interventions (with verification checklists and methodologies)
2. Indicative Green Finance Products (loan structures with transparent DEMO terms)
3. Published Impact Methodologies (for defensible emissions avoided calculations)
"""

from typing import Dict, List, Optional
from umbrella.schemas.resilience import (
    ResilienceIntervention,
    VerificationChecklistItem,
    GreenFinanceProduct,
    ImpactMethodology,
)


# =============================================================================
# 1. PHYSICAL RESILIENCE INTERVENTIONS CATALOG
# =============================================================================

INTERVENTIONS_CATALOG: Dict[str, ResilienceIntervention] = {
    "raised-hermetic-silo": ResilienceIntervention(
        intervention_id="raised-hermetic-silo",
        name="Elevated Flood-Resilient Hermetic Grain Silo",
        category="POST_HARVEST_STORAGE",
        supported_hazards=["FLOOD", "WATERLOGGING", "FLASH_FLOOD"],
        suitable_livelihoods=["AGRICULTURE_PADDY", "AGRICULTURE_VEGETABLES", "AGRICULTURE_MAKHANA"],
        description="Watertight, elevated hermetic bin (1.2m elevation) preserving seed grains and food security during flood inundation.",
        resilience_mechanism="Elevated plinth prevents floodwater contact; hermetic gas-tight seal prevents moisture ingress and fungal aflatoxin rot.",
        indicative_cost_inr=18000.0,
        expected_lifetime_years=10,
        verification_requirements=[
            VerificationChecklistItem(
                item_id="check_plinth_height",
                label="Plinth Elevation Verified",
                description="Structure base is securely elevated at least 1.0m above natural ground level.",
                is_mandatory=True,
                evidence_type="PHOTO",
            ),
            VerificationChecklistItem(
                item_id="check_seal_integrity",
                label="Hermetic Seal & Lid Latches Intact",
                description="Rubber gasket silicone seal and locking latches form airtight closure.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
            VerificationChecklistItem(
                item_id="check_location_match",
                label="Installed on Borrower Premises",
                description="Silo is situated on the geo-tagged homestead/courtyard specified in application.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
            VerificationChecklistItem(
                item_id="check_usable_condition",
                label="Clean & Usable Condition",
                description="Internal storage chamber is clean, dry, and ready for grain loading.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
        ],
        environmental_impact_supported=True,
        methodology_reference="FAO/ICRISAT Post-Harvest Loss GHG Abatement Proxy (2021)",
        source_provenance="SOURCED",
        status="ACTIVE",
    ),
    "portable-solar-dryer": ResilienceIntervention(
        intervention_id="portable-solar-dryer",
        name="Portable Solar Tunnel Agro-Dryer",
        category="POST_HARVEST_STORAGE",
        supported_hazards=["FLOOD", "WATERLOGGING"],
        suitable_livelihoods=["AGRICULTURE_MAKHANA", "AGRICULTURE_PADDY", "AGRICULTURE_VEGETABLES"],
        description="UV-stabilized polytunnel drying system with solar exhaust fan, elevating harvested grains/makhana above wet ground during erratic monsoon showers.",
        resilience_mechanism="Rapid solar dehydration inside an enclosed frame; prevents fungal mould and aflatoxin development during wet monsoon spells.",
        indicative_cost_inr=35000.0,
        expected_lifetime_years=8,
        verification_requirements=[
            VerificationChecklistItem(
                item_id="check_tunnel_anchored",
                label="Tunnel Frame Firmly Anchored",
                description="Galvanized frame anchored to resist monsoon gusts.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
            VerificationChecklistItem(
                item_id="check_exhaust_fan",
                label="Solar Exhaust Fan Operational",
                description="DC fan spins continuously under direct sunlight.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
            VerificationChecklistItem(
                item_id="check_elevated_trays",
                label="Elevated Mesh Trays Installed",
                description="Grain trays are elevated at least 0.5m off the ground inside tunnel.",
                is_mandatory=True,
                evidence_type="PHOTO",
            ),
        ],
        environmental_impact_supported=True,
        methodology_reference="UNFCCC AMS-I.E / ICAR Post-Harvest Agricultural Spoilage Baseline",
        source_provenance="SOURCED",
        status="ACTIVE",
    ),
    "solar-irrigation-pump": ResilienceIntervention(
        intervention_id="solar-irrigation-pump",
        name="Solar Micro-Irrigation Pump Set (1-2 HP)",
        category="CLEAN_ENERGY_IRRIGATION",
        supported_hazards=["DROUGHT", "WATERLOGGING", "EXTREME_HEAT"],
        suitable_livelihoods=["AGRICULTURE_PADDY", "AGRICULTURE_VEGETABLES"],
        description="Photovoltaic-powered surface/submersible pump replacing fossil fuel diesel pump sets. Operational during grid power blackouts.",
        resilience_mechanism="Zero-fuel operational independence; immune to diesel fuel shortages and damaged rural power transmission lines during flooding.",
        indicative_cost_inr=125000.0,
        expected_lifetime_years=15,
        verification_requirements=[
            VerificationChecklistItem(
                item_id="check_pv_panels",
                label="PV Solar Panel Array Installed",
                description="Photovoltaic panels installed on elevated anti-theft galvanized structure facing south.",
                is_mandatory=True,
                evidence_type="PHOTO",
            ),
            VerificationChecklistItem(
                item_id="check_inverter_controller",
                label="Weatherproof Controller Operational",
                description="Motor controller mounted in IP65 enclosure with grounding/lightning arrestor.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
            VerificationChecklistItem(
                item_id="check_pump_discharge",
                label="Water Discharge Verified",
                description="Pump discharges continuous water flow from borehole or canal.",
                is_mandatory=True,
                evidence_type="PHOTO",
            ),
            VerificationChecklistItem(
                item_id="check_serial_number",
                label="Serial Number & QR Tag Recorded",
                description="Equipment serial plate matches manufacturer invoice and delivery challan.",
                is_mandatory=True,
                evidence_type="TEXT",
            ),
        ],
        environmental_impact_supported=True,
        methodology_reference="UNFCCC AMS-I.A (Small-scale electricity generation for irrigation)",
        source_provenance="SOURCED",
        status="ACTIVE",
    ),
    "flood-livestock-shelter": ResilienceIntervention(
        intervention_id="flood-livestock-shelter",
        name="Elevated Community Livestock Flood Shelter",
        category="LIVESTOCK_PROTECTION",
        supported_hazards=["FLOOD", "FLASH_FLOOD", "WATERLOGGING"],
        suitable_livelihoods=["DAIRY_AND_LIVESTOCK"],
        description="Reinforced raised bamboo and concrete plinth platform (1.5m above ground) with CGI tin roofing for cattle and goats.",
        resilience_mechanism="Protects milch animals from drowning, foot-rot infection, and water-borne pathogens during extended monsoon inundation.",
        indicative_cost_inr=65000.0,
        expected_lifetime_years=12,
        verification_requirements=[
            VerificationChecklistItem(
                item_id="check_plinth_height",
                label="Platform Elevation >= 1.5m",
                description="Measuring tape confirms platform surface is at least 1.5m above surrounding terrain.",
                is_mandatory=True,
                evidence_type="PHOTO",
            ),
            VerificationChecklistItem(
                item_id="check_access_ramp",
                label="Non-Slip Livestock Ramp",
                description="Gradual incline ramp with transverse cleats for safe animal ascent.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
            VerificationChecklistItem(
                item_id="check_roof_anchorage",
                label="CGI Roof Bolted Securely",
                description="Tin roofing bolted to withstand 80 km/h squall winds.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
        ],
        environmental_impact_supported=False,
        methodology_reference=None,
        source_provenance="SOURCED",
        status="ACTIVE",
    ),
    "micro-drip-irrigation": ResilienceIntervention(
        intervention_id="micro-drip-irrigation",
        name="Gravity-Fed Micro Drip Irrigation Kit",
        category="WATER_CONSERVATION",
        supported_hazards=["DROUGHT", "EXTREME_HEAT"],
        suitable_livelihoods=["AGRICULTURE_VEGETABLES", "AGRICULTURE_PADDY"],
        description="Low-pressure gravity drip line network delivering precise water and nutrients directly to crop root zones.",
        resilience_mechanism="Cuts irrigation water demand by 60%; enables smallholders to cultivate high-value vegetables on residual moisture.",
        indicative_cost_inr=22000.0,
        expected_lifetime_years=6,
        verification_requirements=[
            VerificationChecklistItem(
                item_id="check_tank_elevation",
                label="Header Tank Elevated (2m)",
                description="Water storage tank mounted on sturdy steel/masonry stand at least 2m high.",
                is_mandatory=True,
                evidence_type="PHOTO",
            ),
            VerificationChecklistItem(
                item_id="check_filter_screen",
                label="Disc/Screen Filter Installed",
                description="Filtration unit installed on main line to prevent emitter clogging.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
            VerificationChecklistItem(
                item_id="check_emitter_flow",
                label="Uniform Emitter Dripping",
                description="Drip laterals emit uniform water beads along crop rows with no blowouts.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
        ],
        environmental_impact_supported=True,
        methodology_reference="ICAR/NABARD Micro-Irrigation Energy Efficiency Baseline (2020)",
        source_provenance="SOURCED",
        status="ACTIVE",
    ),
    "drainage-culvert-improvement": ResilienceIntervention(
        intervention_id="drainage-culvert-improvement",
        name="Farm-Level Drainage Culvert & Raised Bunding",
        category="DRAINAGE_AND_LAND_IMPROVEMENT",
        supported_hazards=["FLOOD", "WATERLOGGING"],
        suitable_livelihoods=["AGRICULTURE_PADDY", "AGRICULTURE_VEGETABLES", "FISHERIES"],
        description="Earthen embankment reinforcement with stone-pitched check gates and hume pipes to regulate floodwater runoff.",
        resilience_mechanism="Prevents prolonged standing water asphyxiation of paddy while capturing nutrient-rich river silt.",
        indicative_cost_inr=28000.0,
        expected_lifetime_years=7,
        verification_requirements=[
            VerificationChecklistItem(
                item_id="check_bund_dimensions",
                label="Bund Height & Crest Width",
                description="Bund crest elevated at least 0.8m with 1:1.5 side slopes.",
                is_mandatory=True,
                evidence_type="PHOTO",
            ),
            VerificationChecklistItem(
                item_id="check_sluice_gate",
                label="Hume Pipe / Check Gate Operable",
                description="Flap valve or wooden sluice board opens and seals properly.",
                is_mandatory=True,
                evidence_type="CHECKBOX",
            ),
        ],
        environmental_impact_supported=False,
        methodology_reference=None,
        source_provenance="SOURCED",
        status="ACTIVE",
    ),
}


# =============================================================================
# 2. GREEN FINANCE PRODUCTS (DEMO / INDICATIVE ONLY)
# =============================================================================

GREEN_FINANCE_PRODUCTS: Dict[str, GreenFinanceProduct] = {
    "prod-micro-adaptation": GreenFinanceProduct(
        finance_product_id="prod-micro-adaptation",
        name="Micro Resilience Loan (Post-Harvest & Storage)",
        eligible_interventions=["raised-hermetic-silo", "portable-solar-dryer", "drainage-culvert-improvement"],
        min_amount_inr=10000.0,
        max_amount_inr=40000.0,
        indicative_annual_interest_rate_pct=13.5,
        tenure_months=12,
        repayment_frequency="MONTHLY",
        grace_period_policy="30-day initial installation grace; automatic repayment review during peak flood alerts.",
        eligibility_notes="Open to active JLG members with minimum 1 completed loan cycle in verified flood-prone clusters.",
        status="ACTIVE",
        synthetic_flag=True,
    ),
    "prod-solar-equipment": GreenFinanceProduct(
        finance_product_id="prod-solar-equipment",
        name="Productive Solar Asset Term Loan",
        eligible_interventions=["solar-irrigation-pump", "portable-solar-dryer"],
        min_amount_inr=30000.0,
        max_amount_inr=80000.0,
        indicative_annual_interest_rate_pct=12.0,
        tenure_months=24,
        repayment_frequency="MONTHLY",
        grace_period_policy="60-day installation & commissioning grace period prior to first installment.",
        eligibility_notes="Co-financing with state solar subsidies (e.g. PM-KUSUM Component B). Borrower margin >= 15%.",
        status="ACTIVE",
        synthetic_flag=True,
    ),
    "prod-farm-resilience": GreenFinanceProduct(
        finance_product_id="prod-farm-resilience",
        name="Community Farm & Livestock Resilience Credit",
        eligible_interventions=["flood-livestock-shelter", "micro-drip-irrigation", "drainage-culvert-improvement"],
        min_amount_inr=15000.0,
        max_amount_inr=65000.0,
        indicative_annual_interest_rate_pct=14.0,
        tenure_months=18,
        repayment_frequency="MONTHLY",
        grace_period_policy="45-day pre-monsoon construction grace window.",
        eligibility_notes="Joint borrowing by minimum 3 JLG members or individual borrower with livestock collateral.",
        status="ACTIVE",
        synthetic_flag=True,
    ),
}


# =============================================================================
# 3. PUBLISHED IMPACT METHODOLOGIES REGISTRY
# =============================================================================

IMPACT_METHODOLOGIES: Dict[str, ImpactMethodology] = {
    "UNFCCC-AMS-I.A": ImpactMethodology(
        methodology_id="UNFCCC-AMS-I.A",
        name="UNFCCC CDM AMS-I.A: Electricity generation by the user (Solar Water Pumping)",
        version="v17.0",
        scope="MITIGATION_ENERGY",
        baseline_description="Operation of small diesel pump set (5 HP, 0.28 L diesel/kWh hydraulic equivalent, 650 L diesel consumed/year).",
        project_description="Zero-emission solar PV water pumping array replacing diesel consumption.",
        emission_factor_description="Diesel emission factor: 2.68 kg CO2e per liter of diesel (IPCC 2006 Guidelines, Volume 2: Energy).",
        formula_latex=r"ER_y = Fuel_y \times EF_{CO2,diesel} - PE_y",
        source_citation="UNFCCC CDM Executive Board, AMS-I.A ver 17.0; IPCC 2006 Guidelines for National Greenhouse Gas Inventories.",
    ),
    "FAO-POST-HARVEST-2021": ImpactMethodology(
        methodology_id="FAO-POST-HARVEST-2021",
        name="FAO/ICRISAT Post-Harvest Waste GHG Abatement Proxy",
        version="v2.1",
        scope="MITIGATION_AGRICULTURE",
        baseline_description="Conventional open burlap storage suffering 18% grain spoilage from moisture inundation and rot.",
        project_description="Hermetic elevated storage reducing spoilage loss to < 2%, avoiding anaerobic rotting emissions.",
        emission_factor_description="Biomass decay emission factor: 1.15 kg CO2e per kg spoiled cereal grain (FAO Food Wastage Footprint).",
        formula_latex=r"ER_y = \Delta Spoilage\_kg \times EF_{decay}",
        source_citation="FAO Food Wastage Footprint: Impacts on Natural Resources (2013); ICRISAT Hermetic Storage Field Assessment (2021).",
    ),
}


# =============================================================================
# ACCESS HELPER FUNCTIONS
# =============================================================================

def get_intervention(intervention_id: str) -> ResilienceIntervention:
    """Retrieve an intervention by ID or raise KeyError."""
    if intervention_id not in INTERVENTIONS_CATALOG:
        raise KeyError(f"Resilience intervention '{intervention_id}' not found in catalog.")
    return INTERVENTIONS_CATALOG[intervention_id]


def list_interventions() -> List[ResilienceIntervention]:
    """Return all active interventions in the catalog."""
    return list(INTERVENTIONS_CATALOG.values())


def get_finance_product(product_id: str) -> GreenFinanceProduct:
    """Retrieve a green finance product by ID or raise KeyError."""
    if product_id not in GREEN_FINANCE_PRODUCTS:
        raise KeyError(f"Green finance product '{product_id}' not found in catalog.")
    return GREEN_FINANCE_PRODUCTS[product_id]


def list_finance_products() -> List[GreenFinanceProduct]:
    """Return all active green finance products."""
    return list(GREEN_FINANCE_PRODUCTS.values())


def get_methodology(methodology_id: str) -> ImpactMethodology:
    """Retrieve an impact methodology by ID or raise KeyError."""
    if methodology_id not in IMPACT_METHODOLOGIES:
        raise KeyError(f"Impact methodology '{methodology_id}' not found.")
    return IMPACT_METHODOLOGIES[methodology_id]
