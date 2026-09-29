"""Umbrella Resilience, Green Finance, Verification, and Impact Schemas.

Defines the core data contracts for the second half of the climate-adaptive microfinance flywheel:
Climate Risk -> Portfolio Exposure -> Human-reviewed Recommendation -> Resilience Intervention
-> Green Financing -> Field Verification -> Impact Estimation -> Portfolio Learning.

NON-NEGOTIABLE PRINCIPLES:
1. Decision Support, NOT Automated Lending: Umbrella never autonomously approves loans, alters interest rates, or grants moratoria.
2. Separation of Physical Hazard, Physical Intervention, and Financial Product:
   An intervention (e.g. Solar Pump) is physically distinct from a financial structure (e.g. 24-month loan).
3. Uncertified Operational Estimates: Emissions avoided are strictly labelled ESTIMATED_EMISSIONS_AVOIDED,
   not certified carbon credits or guaranteed carbon offset revenues.
4. Auditable Human Decision-Making: Automated checks advise; humans decide.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# =============================================================================
# 1. RESILIENCE INTERVENTION CATALOG SCHEMAS
# =============================================================================

InterventionCategory = Literal[
    "POST_HARVEST_STORAGE",
    "CLEAN_ENERGY_IRRIGATION",
    "WATER_CONSERVATION",
    "LIVESTOCK_PROTECTION",
    "DRAINAGE_AND_LAND_IMPROVEMENT",
    "ELEVATED_ELECTRICAL",
]

SupportedHazard = Literal["FLOOD", "WATERLOGGING", "FLASH_FLOOD", "DROUGHT", "EXTREME_HEAT"]

LivelihoodType = Literal[
    "AGRICULTURE_PADDY",
    "AGRICULTURE_VEGETABLES",
    "AGRICULTURE_MAKHANA",
    "DAIRY_AND_LIVESTOCK",
    "FISHERIES",
    "SMALL_COMMERCE",
    "ARTISAN_AND_CRAFTS",
]


class VerificationChecklistItem(BaseModel):
    """Specification of an on-site physical check required during field verification."""
    item_id: str
    label: str
    description: str
    is_mandatory: bool = True
    evidence_type: Literal["PHOTO", "CHECKBOX", "NUMERIC", "TEXT"] = "CHECKBOX"


class ResilienceIntervention(BaseModel):
    """A physical technology, structure, or agronomic asset that mitigates climate hazard exposure."""
    intervention_id: str
    name: str
    category: InterventionCategory
    supported_hazards: List[SupportedHazard]
    suitable_livelihoods: List[LivelihoodType]
    description: str
    resilience_mechanism: str
    indicative_cost_inr: float = Field(..., gt=0.0, description="Gross equipment/construction cost in INR")
    expected_lifetime_years: int = Field(..., ge=1, le=25)
    verification_requirements: List[VerificationChecklistItem]
    environmental_impact_supported: bool = Field(
        False, description="True if a defensive, quantifiable greenhouse gas mitigation calculation is supported"
    )
    methodology_reference: Optional[str] = Field(
        None, description="Published reference or academic methodology (e.g., UNFCCC AMS-I.A aligned)"
    )
    source_provenance: str = "SOURCED"
    status: Literal["ACTIVE", "PILOT", "DEPRECATED"] = "ACTIVE"


# =============================================================================
# 2. ADAPTATION RECOMMENDATION SCHEMAS
# =============================================================================

class AdaptationRecommendation(BaseModel):
    """A transparent, rule-based recommendation suggesting a suitable resilience intervention."""
    intervention: ResilienceIntervention
    ranking_score: float = Field(..., ge=0.0, le=100.0, description="Relevance ranking score (0-100)")
    primary_reason: str
    triggering_hazard_factors: List[str]
    suitability_factors: List[str]
    exclusions_or_limitations: List[str] = Field(default_factory=list)
    recommendation_version: str = "AdaptationRec-v1.0"


class AdaptationRecommendationResponse(BaseModel):
    """Full recommendation container for a village node."""
    village_id: str
    village_name: str
    hazard_score: float
    hazard_level: str
    priority_level: str
    recommendations: List[AdaptationRecommendation]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    disclaimer: str = (
        "DECISION-SUPPORT NOTICE: Resilience recommendations are advisory suggestions derived from environmental "
        "and physical vulnerability factors. They do not guarantee loss prevention or loan repayment."
    )


# =============================================================================
# 3. GREEN FINANCE PRODUCTS & SCENARIO CALCULATOR SCHEMAS
# =============================================================================

class GreenFinanceProduct(BaseModel):
    """A microfinance debt or lease product designed to finance resilience interventions."""
    finance_product_id: str
    name: str
    eligible_interventions: List[str] = Field(description="List of intervention_ids eligible for this product")
    min_amount_inr: float = Field(..., gt=0.0)
    max_amount_inr: float = Field(..., gt=0.0)
    indicative_annual_interest_rate_pct: float = Field(
        ..., ge=0.0, le=36.0, description="Annual reducing interest rate in percent (e.g. 14.5 for 14.5%)"
    )
    tenure_months: int = Field(..., ge=3, le=60)
    repayment_frequency: Literal["MONTHLY", "BI_WEEKLY", "WEEKLY"] = "MONTHLY"
    grace_period_policy: str = "Standard 30-day installation grace period; optional monsoon flexibility upon review."
    eligibility_notes: str
    status: Literal["ACTIVE", "PILOT", "INACTIVE"] = "ACTIVE"
    synthetic_flag: bool = Field(True, description="Strictly DEMO / INDICATIVE terms; not actual lender contract terms")


class FinancingScenarioRequest(BaseModel):
    """Input parameters for deterministic loan installment calculation."""
    intervention_cost_inr: float = Field(..., gt=0.0, description="Total cost of the resilience intervention")
    borrower_contribution_inr: float = Field(
        0.0, ge=0.0, description="Upfront borrower equity/margin money (must be less than intervention cost)"
    )
    financed_amount_inr: Optional[float] = Field(
        None, gt=0.0, description="Optional override; defaults to cost minus borrower contribution"
    )
    annual_interest_rate_pct: float = Field(
        14.0, ge=0.0, le=40.0, description="Annual nominal interest rate in percent"
    )
    tenure_months: int = Field(18, ge=3, le=60, description="Repayment tenor in months")
    repayment_frequency: Literal["MONTHLY", "BI_WEEKLY", "WEEKLY"] = "MONTHLY"


class AssumptionRecord(BaseModel):
    """Transparent metadata tag for financial or physical calculation parameters."""
    parameter: str
    value: Any
    unit: str
    source: str
    assumption_type: Literal["SOURCED", "DERIVED", "DEMO_ASSUMPTION"]


class SavingsPaybackEstimate(BaseModel):
    """Operational cost savings and simple payback model for productive assets."""
    supported: bool = False
    baseline_annual_operating_cost_inr: float = 0.0
    project_annual_operating_cost_inr: float = 0.0
    estimated_annual_savings_inr: float = 0.0
    simple_payback_years: Optional[float] = None
    assumptions: List[AssumptionRecord] = Field(default_factory=list)


class FinancingScenarioResponse(BaseModel):
    """Deterministic output of loan schedule calculation."""
    intervention_cost_inr: float
    borrower_contribution_inr: float
    financed_principal_inr: float
    annual_interest_rate_pct: float
    tenure_months: int
    repayment_frequency: str
    number_of_installments: int
    estimated_installment_inr: float = Field(..., description="Estimated payment per installment (e.g. monthly EMI)")
    total_repayment_inr: float = Field(..., description="Total principal + interest repaid over tenor")
    total_financing_cost_inr: float = Field(..., description="Total interest paid")
    effective_rate_type: str = "REDUCING_BALANCE"
    savings_payback: SavingsPaybackEstimate = Field(default_factory=SavingsPaybackEstimate)
    calculation_assumptions: List[AssumptionRecord] = Field(default_factory=list)
    disclaimer: str = (
        "INDICATIVE DEMO CALCULATION: Installment values are generated using standard reducing balance financial formulas "
        "under demo assumptions. Final loan pricing, processing fees, and insurance are determined by the authorized lender."
    )


# =============================================================================
# 4. GREEN FINANCE APPLICATION & HUMAN DECISION SCHEMAS
# =============================================================================

ApplicationStatus = Literal[
    "DRAFT",
    "RECOMMENDED",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "DISBURSED",
    "INSTALLED",
    "VERIFICATION_PENDING",
    "VERIFIED",
    "CLOSED",
]


class HumanDecision(BaseModel):
    """Auditable record of a human officer review and authorization."""
    decision: Literal["APPROVED", "REJECTED", "MODIFIED", "CONFIRMED"]
    officer_id: str
    officer_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None
    reason: str


class GreenFinanceApplication(BaseModel):
    """An end-to-end financing application for a climate resilience asset."""
    application_id: str
    village_id: str
    village_name: str
    borrower_group_id: str = Field(description="Synthetic Joint Liability Group (JLG) or borrower ID")
    borrower_name: str
    livelihood: LivelihoodType
    intervention_id: str
    finance_product_id: str
    requested_amount_inr: float = Field(..., gt=0.0)
    borrower_contribution_inr: float = Field(0.0, ge=0.0)
    approved_amount_inr: Optional[float] = None
    status: ApplicationStatus = "DRAFT"
    human_decisions: List[HumanDecision] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    asset_id: Optional[str] = None
    notes: Optional[str] = None


class ApplicationCreateRequest(BaseModel):
    """Request payload to initiate a new resilience loan application."""
    village_id: str
    borrower_group_id: str
    borrower_name: str
    livelihood: LivelihoodType
    intervention_id: str
    finance_product_id: str
    requested_amount_inr: float = Field(..., gt=0.0)
    borrower_contribution_inr: float = Field(0.0, ge=0.0)
    notes: Optional[str] = None


class ApplicationDecisionRequest(BaseModel):
    """Request payload for a human officer to approve or reject an application."""
    decision: Literal["APPROVED", "REJECTED"]
    officer_id: str
    officer_name: str
    approved_amount_inr: Optional[float] = None
    reason: str
    notes: Optional[str] = None


# =============================================================================
# 5. RESILIENCE ASSET SCHEMAS
# =============================================================================

AssetStatus = Literal["PENDING_DISBURSEMENT", "ACTIVE_DEPLOYED", "DAMAGED", "DECOMMISSIONED"]


class ResilienceAsset(BaseModel):
    """The physical climate-resilience asset deployed on the ground."""
    asset_id: str
    application_id: str
    intervention_id: str
    intervention_name: str
    borrower_group_id: str
    borrower_name: str
    village_id: str
    village_name: str
    expected_latitude: float
    expected_longitude: float
    actual_latitude: Optional[float] = None
    actual_longitude: Optional[float] = None
    expected_installation_date: datetime
    actual_installation_date: Optional[datetime] = None
    status: AssetStatus = "PENDING_DISBURSEMENT"
    verification_status: Literal["NOT_SUBMITTED", "PENDING_REVIEW", "VERIFIED", "FLAGGED", "REJECTED"] = "NOT_SUBMITTED"
    impact_estimation_status: Literal["PENDING_VERIFICATION", "ESTIMATED", "NOT_APPLICABLE"] = "PENDING_VERIFICATION"
    serial_number_or_tag: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AssetCreateRequest(BaseModel):
    """Payload to register an asset upon loan disbursement."""
    application_id: str
    expected_installation_date: datetime
    serial_number_or_tag: Optional[str] = None


# =============================================================================
# 6. FIELD VERIFICATION & EVIDENCE SCHEMAS
# =============================================================================

VerificationResultStatus = Literal["PENDING", "PASSED", "FLAGGED", "REJECTED"]


class AutomatedCheckResult(BaseModel):
    """Outcome of an individual automated evidence integrity check."""
    check_name: str
    status: Literal["PASS", "REVIEW", "FLAG", "FAIL"]
    score: float = Field(1.0, ge=0.0, le=1.0)
    details: str
    metrics: Dict[str, Any] = Field(default_factory=dict)


class VerificationAutomatedSummary(BaseModel):
    """Combined automated evaluation of evidence integrity and field data."""
    evidence_integrity_check: AutomatedCheckResult
    gps_consistency_check: AutomatedCheckResult
    timestamp_check: AutomatedCheckResult
    checklist_completeness_check: AutomatedCheckResult
    overall_automated_status: Literal["PASS", "REVIEW_REQUIRED", "FLAGGED"]
    requires_human_override: bool = False


class AssetVerification(BaseModel):
    """Auditable field verification record for an installed resilience asset."""
    verification_id: str
    asset_id: str
    officer_id: str
    officer_name: str
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    submitted_latitude: float
    submitted_longitude: float
    photo_filename: Optional[str] = None
    photo_sha256: Optional[str] = None
    checklist_responses: Dict[str, bool] = Field(
        default_factory=dict, description="Mapping of checklist item_id to pass/fail boolean"
    )
    notes: Optional[str] = None
    automated_summary: VerificationAutomatedSummary
    verification_result: VerificationResultStatus = "PENDING"
    human_review_status: Literal["PENDING_REVIEW", "CONFIRMED", "OVERRIDDEN", "REJECTED"] = "PENDING_REVIEW"
    human_decision: Optional[HumanDecision] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VerificationCreateRequest(BaseModel):
    """Payload to initiate a field verification visit."""
    asset_id: str
    officer_id: str
    officer_name: str
    submitted_latitude: float
    submitted_longitude: float
    checklist_responses: Dict[str, bool]
    notes: Optional[str] = None


class VerificationDecisionRequest(BaseModel):
    """Payload for human risk officer to confirm or reject field verification."""
    decision: Literal["CONFIRMED", "OVERRIDDEN", "REJECTED"]
    officer_id: str
    officer_name: str
    reason: str
    notes: Optional[str] = None


# =============================================================================
# 7. IMPACT ESTIMATION & METHODOLOGY SCHEMAS
# =============================================================================

class ImpactMethodology(BaseModel):
    """Published, transparent carbon and resilience calculation methodology reference."""
    methodology_id: str
    name: str
    version: str
    scope: Literal["MITIGATION_ENERGY", "MITIGATION_AGRICULTURE", "ADAPTATION_RESILIENCE"]
    baseline_description: str
    project_description: str
    emission_factor_description: str
    formula_latex: str
    source_citation: str
    standards_alignment_note: str = (
        "METHODOLOGICAL ALIGNMENT NOTICE: This calculation is inspired by and aligned with published methodologies "
        "(e.g., UNFCCC CDM small-scale methodologies). It does NOT imply registration or certification by Verra, "
        "Gold Standard, or UNFCCC."
    )


class EmissionsAvoidedEstimate(BaseModel):
    """Activity-based proxy calculation of greenhouse gas emissions avoided."""
    methodology_id: str
    methodology_name: str
    baseline_emissions_tco2e_per_year: float
    project_emissions_tco2e_per_year: float
    estimated_emissions_avoided_tco2e_per_year: float
    unit: str = "tCO2e/year"
    activity_data: Dict[str, Any]
    emission_factors: Dict[str, Any]
    calculation_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    disclaimer: str = (
        "UNCERTIFIED OPERATIONAL ESTIMATE: Estimated emissions avoided represent activity-based proxy calculations. "
        "They strictly do NOT constitute certified carbon credits, tradable offsets, or guaranteed revenue."
    )


class AssetImpactRecord(BaseModel):
    """Combined adaptation and emissions impact report for an individual asset."""
    asset_id: str
    intervention_id: str
    village_id: str
    adaptation_resilience_benefits: List[str]
    mitigation_supported: bool
    emissions_avoided: Optional[EmissionsAvoidedEstimate] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CarbonScenarioCalculation(BaseModel):
    """Illustrative economic scenario valuing estimated avoided emissions."""
    assumed_carbon_price_usd_per_tonne: float
    estimated_emissions_avoided_tco2e: float
    illustrative_annual_value_usd: float
    illustrative_annual_value_inr: float
    fx_rate_usd_to_inr: float = 84.0
    disclaimer: str = (
        "ILLUSTRATIVE SCENARIO ONLY: Represents hypothetical value based on user-selected carbon price assumption. "
        "Not actual carbon revenue. Umbrella does not issue, trade, or certify carbon credits."
    )


class PortfolioImpactSummary(BaseModel):
    """Portfolio-level aggregation of climate resilience financing and impact."""
    total_applications: int
    approved_applications: int
    total_capital_deployed_inr: float
    total_assets_installed: int
    total_assets_verified: int
    verification_rate_pct: float
    borrowers_covered: int
    total_estimated_emissions_avoided_tco2e: float
    flagged_verifications_count: int
    breakdown_by_intervention: List[Dict[str, Any]]
    breakdown_by_village: List[Dict[str, Any]]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# =============================================================================
# 8. AUDIT TRAIL SCHEMAS
# =============================================================================

AuditActorType = Literal["SYSTEM", "HUMAN_RISK_OFFICER", "FIELD_OFFICER", "BORROWER"]


class AuditEvent(BaseModel):
    """Append-only auditable event record for institutional lifecycle traceability."""
    event_id: str
    entity_type: Literal["APPLICATION", "ASSET", "VERIFICATION", "RECOMMENDATION", "FINANCING"]
    entity_id: str
    action: str
    actor_type: AuditActorType
    actor_id: str
    actor_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = Field(default_factory=dict)
