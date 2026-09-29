// Umbrella TypeScript Domain Types matching backend schemas

export type ProvenanceMode =
  | 'LIVE'
  | 'REANALYSIS'
  | 'RETROSPECTIVE_REANALYSIS'
  | 'OBSERVATION'
  | 'DERIVED'
  | 'LOCAL_DATASET'
  | 'CACHED'
  | 'MOCK'
  | 'SYNTHETIC';

export type HazardLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActionStatus = 'NEW' | 'UNDER_REVIEW' | 'ACKNOWLEDGED' | 'ACTIONED' | 'DISMISSED';

export interface DataProvenanceItem {
  dataset: string;
  source: string;
  version?: string;
  spatial_resolution?: string;
  temporal_coverage?: string;
  license?: string;
  access_method?: string;
  citation?: string;
  data_type: ProvenanceMode;
  notes?: string;
  timestamp?: string;
}

export interface TerrainAttributes {
  elevation_meters: number;
  slope_percentage: number;
  drainage_capacity_rating: number; // 1-5 (1=poor, 5=excellent)
  soil_type: string;
  distance_to_major_river_km: number;
  primary_river_system: string;
  crop_flood_vulnerability_index: number; // 0.0 - 1.0
}

export interface PilotVillage {
  village_id: string;
  village_name: string;
  subdivision?: string;
  block_name?: string;
  nearest_river?: string;
  notes?: string;
  district: string;
  state: string;
  latitude: floatNumber;
  longitude: floatNumber;
  monitored_since?: string;
  primary_crops?: string[];
  terrain?: TerrainAttributes;
}

type floatNumber = number;

export interface DistrictPilotProfile {
  pilot_district?: string;
  pilot_state?: string;
  pilot_role?: string;
  district?: string;
  district_name?: string;
  district_id?: string;
  state?: string;
  metadata?: any;
  monitored_clusters_count?: number;
  total_monitored_clusters?: number;
  monitored_clusters?: any[];
  operational_clusters?: any[];
}

export interface HazardComponentBreakdown {
  name: string;
  raw_value: number;
  raw_unit: string;
  normalized_score: number;
  weight: number;
  contribution: number;
  description: string;
  source: string;
  timestamp?: string;
}

export interface FloodHazardEvaluation {
  hazard: 'FLOOD';
  label: string;
  village_id: string;
  village_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  hazard_score: number;
  hazard_level: HazardLevel;
  forecast_horizon_days: number;
  drivers: string[];
  components: HazardComponentBreakdown[];
  narrative: string;
  model_version: string;
  generated_at: string;
  data_source_mode: ProvenanceMode;
  data_provenance: DataProvenanceItem[];
  scientific_disclaimer: string;
}

export interface JointLiabilityGroup {
  group_id: string;
  group_name: string;
  village_id: string;
  village_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  member_count: number;
  total_outstanding_portfolio_inr: number;
  green_loans_count: number;
  portfolio_at_risk_30_inr: number;
  primary_crop: string;
}

export interface PortfolioExposure {
  village_id: string;
  village_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  borrowers_exposed: number;
  groups_exposed: number;
  active_loans_exposed: number;
  outstanding_amount: number;
  green_loans_exposed: number;
  currency: 'INR';
  data_type: 'SYNTHETIC';
  portfolio_source: string;
  groups: JointLiabilityGroup[];
  average_loan_size_inr: number;
  disclaimer: string;
}

export interface PortfolioClimateImpact {
  village_id: string;
  village_name: string;
  district: string;
  state: string;
  hazard_score: number;
  hazard_level: HazardLevel;
  forecast_horizon_days: number;
  portfolio_exposure: PortfolioExposure;
  priority_score: number;
  priority_level: PriorityLevel;
  formula_version: string;
  formula_description: string;
  calculation_details: Record<string, any>;
  evaluated_at: string;
  disclaimer: string;
}

export interface HumanDecisionRecord {
  status: 'PENDING_REVIEW' | 'APPROVED' | 'MODIFIED' | 'REJECTED';
  reviewed_by?: string;
  reviewed_at?: string;
  approved_grace_period_days?: number;
  approved_actions: string[];
  reviewer_notes?: string;
}

export interface SystemRecommendation {
  village_id: string;
  village_name: string;
  hazard_level: HazardLevel;
  priority_level: PriorityLevel;
  recommended_grace_period_days: number;
  operational_advisories: string[];
  sms_advisory_template?: string;
  priority_review_groups: string[];
  climate_adaptation_practices: string[];
  estimated_portfolio_at_risk_inr: number;
  estimated_emissions_avoided: number;
  carbon_accounting_category: string;
  carbon_disclaimer: string;
}

export interface MFIRecommendationResponse {
  village_id: string;
  system_recommendation: SystemRecommendation;
  human_decision: HumanDecisionRecord;
  human_review_required: boolean;
  generated_at: string;
  disclaimer: string;
}

export interface UmbrellaWeatherDaily {
  date: string;
  forecast_date?: string;
  precipitation_mm: number;
  rainfall_mm?: number;
  precipitation_probability_pct?: number;
  temperature_max_c?: number;
  temperature_min_c?: number;
  temperature_max_celsius?: number;
  temperature_min_celsius?: number;
  apparent_temperature_max_c?: number;
  wind_speed_max_kmh?: number;
  soil_moisture_m3m3?: number;
  soil_moisture_0_to_10cm_m3m3?: number;
}

export interface UmbrellaWeatherForecast {
  latitude: number;
  longitude: number;
  elevation_m?: number;
  timezone?: string;
  forecast_horizon_days: number;
  forecast_start_date?: string;
  forecast_end_date?: string;
  source_mode?: ProvenanceMode;
  data_source_mode: ProvenanceMode;
  provider?: string;
  provider_name?: string;
  attribution?: string;
  daily_forecasts: UmbrellaWeatherDaily[];
  total_accumulated_precipitation_mm: number;
  cumulative_rainfall_mm?: number;
  max_daily_burst_precipitation_mm: number;
  peak_single_day_rainfall_mm?: number;
  mean_soil_moisture_m3m3?: number;
  retrieved_at?: string;
  generated_at?: string;
  fallback_reason?: string | null;
}

export interface VillagePipelineResult {
  village_id: string;
  village_name: string;
  district: string;
  state: string;
  forecast_horizon_days: number;
  weather_forecast: UmbrellaWeatherForecast;
  flood_hazard: FloodHazardEvaluation;
  portfolio_exposure: PortfolioExposure;
  portfolio_impact: PortfolioClimateImpact;
  recommendations: MFIRecommendationResponse;
}

export interface HistoricalEvent {
  event_id: string;
  event_name: string;
  state: string;
  district: string;
  event_type: string;
  start_date: string;
  peak_date: string;
  end_date: string;
  monsoon_season_year: number;
  description: string;
  official_impact_summary?: {
    human_casualties?: number;
    displaced_persons?: number;
    subdivisions_affected?: number;
    panchayats_affected?: number;
    crop_area_inundated_hectares?: number;
    infrastructure_damage?: string[];
  };
  cwc_gauges?: Array<{
    station_name: string;
    river_name: string;
    warning_level_meters: number;
    danger_level_meters: number;
    observed_peak_level_meters: number;
    peak_date: string;
    difference_above_danger_meters: number;
  }>;
  remote_sensing_metadata?: {
    sentinel_1_orbits: number[];
    isro_flood_maps: string[];
    acquisition_dates: string[];
  };
}

export interface HistoricalSnapshotEvaluation {
  snapshot_date: string;
  offset_from_peak_days: number;
  village_id: string;
  village_name: string;
  district: string;
  state: string;
  weather: UmbrellaWeatherForecast;
  hazard: FloodHazardEvaluation;
  exposure: PortfolioExposure;
  impact: PortfolioClimateImpact;
  recommendations: MFIRecommendationResponse;
  data_leakage_prevented: boolean;
  anti_leakage_audit: string;
}

export interface HistoricalReplayReport {
  event_id: string;
  event_name: string;
  district: string;
  state: string;
  peak_date: string;
  village_id?: string;
  village_name?: string;
  timeline_dates: string[];
  snapshots: HistoricalSnapshotEvaluation[];
  peak_hazard_score: number;
  peak_hazard_date: string;
  hazard_progression_summary: string;
  leakage_prevention_audit: string;
  decoupling_audit: string;
  generated_at: string;
}

export interface ObservedFloodValidationResult {
  event_id: string;
  event_name: string;
  district: string;
  state: string;
  status: 'EVIDENCE_AVAILABLE_NOT_PROCESSED' | 'PROCESSED' | 'VALIDATED';
  satellite_mission: string;
  sensor_type: string;
  instrument_mode: string;
  polarization: string;
  relative_orbits: number[];
  sar_acquisitions: Array<{
    acquisition_id: string;
    date: string;
    orbit_direction: string;
    relative_orbit: number;
    resolution: string;
    coverage_percentage: number;
    status: string;
  }>;
  bhuvan_maps: Array<{
    map_id: string;
    published_date: string;
    organization: string;
    portal_url: string;
    inundation_layer_identified: boolean;
  }>;
  cwc_gauge_records: Array<{
    station: string;
    river: string;
    danger_level_m: number;
    crest_level_m: number;
    crest_date: string;
    status: string;
  }>;
  model_vs_observation_alignment: string;
  scientific_disclaimer: string;
}

export interface SystemAttributions {
  open_meteo: {
    provider: string;
    url: string;
    attribution: string;
    license: string;
    sources: string;
  };
  cgiar_climate: {
    provider: string;
    attribution: string;
    license: string;
    datasets: string;
    integration_mode: string;
  };
  risk_methodology: {
    framework: string;
    attribution: string;
    license: string;
  };
  portfolio_data: {
    source: string;
    data_type: string;
    disclaimer: string;
  };
  scientific_disclaimers: {
    credit_default: string;
    carbon_benefits: string;
    decision_support: string;
  };
}

// =============================================================================
// Resilience, Green Finance, Verification & Impact Types
// =============================================================================

export type InterventionCategory =
  | 'POST_HARVEST_STORAGE'
  | 'CLEAN_ENERGY_IRRIGATION'
  | 'WATER_CONSERVATION'
  | 'LIVESTOCK_PROTECTION'
  | 'DRAINAGE_AND_LAND_IMPROVEMENT'
  | 'ELEVATED_ELECTRICAL';

export type SupportedHazard = 'FLOOD' | 'WATERLOGGING' | 'FLASH_FLOOD' | 'DROUGHT' | 'EXTREME_HEAT';

export type LivelihoodType =
  | 'AGRICULTURE_PADDY'
  | 'AGRICULTURE_VEGETABLES'
  | 'AGRICULTURE_MAKHANA'
  | 'DAIRY_AND_LIVESTOCK'
  | 'FISHERIES'
  | 'SMALL_COMMERCE'
  | 'ARTISAN_AND_CRAFTS';

export interface VerificationChecklistItem {
  item_id: string;
  label: string;
  description: string;
  is_mandatory: boolean;
  evidence_type: 'PHOTO' | 'CHECKBOX' | 'NUMERIC' | 'TEXT';
}

export interface ResilienceIntervention {
  intervention_id: string;
  name: string;
  category: InterventionCategory;
  supported_hazards: SupportedHazard[];
  suitable_livelihoods: LivelihoodType[];
  description: string;
  resilience_mechanism: string;
  indicative_cost_inr: number;
  expected_lifetime_years: number;
  verification_requirements: VerificationChecklistItem[];
  environmental_impact_supported: boolean;
  methodology_reference?: string;
  source_provenance: string;
  status: 'ACTIVE' | 'PILOT' | 'DEPRECATED';
}

export interface AdaptationRecommendation {
  intervention: ResilienceIntervention;
  ranking_score: number;
  primary_reason: string;
  triggering_hazard_factors: string[];
  suitability_factors: string[];
  exclusions_or_limitations: string[];
  recommendation_version: string;
}

export interface AdaptationRecommendationResponse {
  village_id: string;
  village_name: string;
  hazard_score: number;
  hazard_level: string;
  priority_level: string;
  recommendations: AdaptationRecommendation[];
  generated_at: string;
  disclaimer: string;
}

export interface GreenFinanceProduct {
  finance_product_id: string;
  name: string;
  eligible_interventions: string[];
  min_amount_inr: number;
  max_amount_inr: number;
  indicative_annual_interest_rate_pct: number;
  tenure_months: number;
  repayment_frequency: 'MONTHLY' | 'BI_WEEKLY' | 'WEEKLY';
  grace_period_policy: string;
  eligibility_notes: string;
  status: 'ACTIVE' | 'PILOT' | 'INACTIVE';
  synthetic_flag: boolean;
}

export interface AssumptionRecord {
  parameter: string;
  value: any;
  unit: string;
  source: string;
  assumption_type: 'SOURCED' | 'DERIVED' | 'DEMO_ASSUMPTION';
}

export interface SavingsPaybackEstimate {
  supported: boolean;
  baseline_annual_operating_cost_inr: number;
  project_annual_operating_cost_inr: number;
  estimated_annual_savings_inr: number;
  simple_payback_years?: number | null;
  assumptions: AssumptionRecord[];
}

export interface FinancingScenarioRequest {
  intervention_cost_inr: number;
  borrower_contribution_inr: number;
  financed_amount_inr?: number;
  annual_interest_rate_pct: number;
  tenure_months: number;
  repayment_frequency: 'MONTHLY' | 'BI_WEEKLY' | 'WEEKLY';
}

export interface FinancingScenarioResponse {
  intervention_cost_inr: number;
  borrower_contribution_inr: number;
  financed_principal_inr: number;
  annual_interest_rate_pct: number;
  tenure_months: number;
  repayment_frequency: string;
  number_of_installments: number;
  estimated_installment_inr: number;
  total_repayment_inr: number;
  total_financing_cost_inr: number;
  effective_rate_type: string;
  savings_payback: SavingsPaybackEstimate;
  calculation_assumptions: AssumptionRecord[];
  disclaimer: string;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'RECOMMENDED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'INSTALLED'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'CLOSED';

export interface HumanDecision {
  decision: 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'CONFIRMED';
  officer_id: string;
  officer_name: string;
  timestamp: string;
  notes?: string;
  reason: string;
}

export interface GreenFinanceApplication {
  application_id: string;
  village_id: string;
  village_name: string;
  borrower_group_id: string;
  borrower_name: string;
  livelihood: LivelihoodType;
  intervention_id: string;
  finance_product_id: string;
  requested_amount_inr: number;
  borrower_contribution_inr: number;
  approved_amount_inr?: number;
  status: ApplicationStatus;
  human_decisions: HumanDecision[];
  created_at: string;
  updated_at: string;
  asset_id?: string;
  notes?: string;
}

export interface ApplicationCreateRequest {
  village_id: string;
  borrower_group_id: string;
  borrower_name: string;
  livelihood: LivelihoodType;
  intervention_id: string;
  finance_product_id: string;
  requested_amount_inr: number;
  borrower_contribution_inr: number;
  notes?: string;
}

export interface ApplicationDecisionRequest {
  decision: 'APPROVED' | 'REJECTED';
  officer_id: string;
  officer_name: string;
  approved_amount_inr?: number;
  reason: string;
  notes?: string;
}

export interface ResilienceAsset {
  asset_id: string;
  application_id: string;
  intervention_id: string;
  intervention_name: string;
  borrower_group_id: string;
  borrower_name: string;
  village_id: string;
  village_name: string;
  expected_latitude: number;
  expected_longitude: number;
  actual_latitude?: number;
  actual_longitude?: number;
  expected_installation_date: string;
  actual_installation_date?: string;
  status: 'PENDING_DISBURSEMENT' | 'ACTIVE_DEPLOYED' | 'DAMAGED' | 'DECOMMISSIONED';
  verification_status: 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';
  impact_estimation_status: 'PENDING_VERIFICATION' | 'ESTIMATED' | 'NOT_APPLICABLE';
  serial_number_or_tag?: string;
  created_at: string;
}

export interface AutomatedCheckResult {
  check_name: string;
  status: 'PASS' | 'REVIEW' | 'FLAG' | 'FAIL';
  score: number;
  details: string;
  metrics: Record<string, any>;
}

export interface VerificationAutomatedSummary {
  evidence_integrity_check: AutomatedCheckResult;
  gps_consistency_check: AutomatedCheckResult;
  timestamp_check: AutomatedCheckResult;
  checklist_completeness_check: AutomatedCheckResult;
  overall_automated_status: 'PASS' | 'REVIEW_REQUIRED' | 'FLAGGED';
  requires_human_override: boolean;
}

export interface AssetVerification {
  verification_id: string;
  asset_id: string;
  officer_id: string;
  officer_name: string;
  submitted_at: string;
  submitted_latitude: number;
  submitted_longitude: number;
  photo_filename?: string;
  photo_sha256?: string;
  checklist_responses: Record<string, boolean>;
  notes?: string;
  automated_summary: VerificationAutomatedSummary;
  verification_result: 'PENDING' | 'PASSED' | 'FLAGGED' | 'REJECTED';
  human_review_status: 'PENDING_REVIEW' | 'CONFIRMED' | 'OVERRIDDEN' | 'REJECTED';
  human_decision?: HumanDecision;
  created_at: string;
}

export interface VerificationCreateRequest {
  asset_id: string;
  officer_id: string;
  officer_name: string;
  submitted_latitude: number;
  submitted_longitude: number;
  checklist_responses: Record<string, boolean>;
  notes?: string;
}

export interface VerificationDecisionRequest {
  decision: 'CONFIRMED' | 'OVERRIDDEN' | 'REJECTED';
  officer_id: string;
  officer_name: string;
  reason: string;
  notes?: string;
}

export interface ImpactMethodology {
  methodology_id: string;
  name: string;
  version: string;
  scope: string;
  baseline_description: string;
  project_description: string;
  emission_factor_description: string;
  formula_latex: string;
  source_citation: string;
  standards_alignment_note: string;
}

export interface EmissionsAvoidedEstimate {
  methodology_id: string;
  methodology_name: string;
  baseline_emissions_tco2e_per_year: number;
  project_emissions_tco2e_per_year: number;
  estimated_emissions_avoided_tco2e_per_year: number;
  unit: string;
  activity_data: Record<string, any>;
  emission_factors: Record<string, any>;
  calculation_date: string;
  disclaimer: string;
}

export interface AssetImpactRecord {
  asset_id: string;
  intervention_id: string;
  village_id: string;
  adaptation_resilience_benefits: string[];
  mitigation_supported: boolean;
  emissions_avoided?: EmissionsAvoidedEstimate;
  created_at: string;
}

export interface CarbonScenarioCalculation {
  assumed_carbon_price_usd_per_tonne: number;
  estimated_emissions_avoided_tco2e: number;
  illustrative_annual_value_usd: number;
  illustrative_annual_value_inr: number;
  fx_rate_usd_to_inr: number;
  disclaimer: string;
}

export interface PortfolioImpactSummary {
  total_applications: number;
  approved_applications: number;
  total_capital_deployed_inr: number;
  total_assets_installed: number;
  total_assets_verified: number;
  verification_rate_pct: number;
  borrowers_covered: number;
  total_estimated_emissions_avoided_tco2e: number;
  flagged_verifications_count: number;
  breakdown_by_intervention: Array<{
    intervention_id: string;
    intervention_name: string;
    count: number;
    verified_count: number;
    mitigation_status?: 'APPLICABLE' | 'NOT_APPLICABLE' | string;
    emissions_avoided_tco2e?: number | null;
  }>;
  breakdown_by_village: Array<{
    village_id: string;
    village_name: string;
    assets_count: number;
    verified_count: number;
  }>;
  generated_at: string;
}

export interface AuditEvent {
  event_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_type: string;
  actor_id: string;
  actor_name: string;
  timestamp: string;
  metadata: Record<string, any>;
}

