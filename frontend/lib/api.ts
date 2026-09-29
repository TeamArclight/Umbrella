import {
  DistrictPilotProfile,
  FloodHazardEvaluation,
  HistoricalEvent,
  HistoricalReplayReport,
  MFIRecommendationResponse,
  ObservedFloodValidationResult,
  PilotVillage,
  PortfolioClimateImpact,
  PortfolioExposure,
  SystemAttributions,
  UmbrellaWeatherForecast,
  VillagePipelineResult,
  ResilienceIntervention,
  AdaptationRecommendationResponse,
  GreenFinanceProduct,
  FinancingScenarioRequest,
  FinancingScenarioResponse,
  GreenFinanceApplication,
  ApplicationCreateRequest,
  ApplicationDecisionRequest,
  ResilienceAsset,
  AssetVerification,
  VerificationCreateRequest,
  VerificationDecisionRequest,
  ImpactMethodology,
  AssetImpactRecord,
  CarbonScenarioCalculation,
  PortfolioImpactSummary,
  AuditEvent,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_UMBRELLA_API_URL || 'http://localhost:8000';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`API Error [${res.status}] ${res.statusText}: ${errText}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error(`Failed to fetch from ${url}:`, error);
    throw error;
  }
}

export const api = {
  // System Health & Attributions
  getHealth: () => fetchJSON<{ status: string; service: string; version: string; model_version: string }>('/api/v1/health'),
  getAttributions: () => fetchJSON<SystemAttributions>('/api/v1/attribution'),

  // Geography & Pilot
  getPilotGeography: () => fetchJSON<DistrictPilotProfile>('/api/v1/geography/pilot'),
  getDistrictBoundary: (districtId: string = 'darbhanga') =>
    fetchJSON<any>(`/api/v1/geography/district/${districtId}`),
  getDistrictClustersGeoJSON: (districtId: string = 'darbhanga') =>
    fetchJSON<any>(`/api/v1/geography/district/${districtId}/villages`),
  getVillages: (state?: string, district?: string) => {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (district) params.set('district', district);
    return fetchJSON<PilotVillage[]>(`/api/v1/villages?${params.toString()}`);
  },
  getVillageDetails: (villageId: string) =>
    fetchJSON<PilotVillage>(`/api/v1/villages/${villageId}`),

  // Weather
  getVillageWeather: (villageId: string, horizon: number = 5) =>
    fetchJSON<UmbrellaWeatherForecast>(`/api/v1/weather/${villageId}?horizon=${horizon}`),

  // Pure Physical Hazard
  getFloodHazard: (villageId: string, horizon: number = 5, month: number = 7) =>
    fetchJSON<FloodHazardEvaluation>(`/api/v1/hazards/flood/${villageId}?horizon=${horizon}&month=${month}`),

  // Independent Portfolio Exposure
  getPortfolioExposure: (villageId: string) =>
    fetchJSON<PortfolioExposure>(`/api/v1/portfolio/exposure/${villageId}`),

  // Combined Operational Priority
  getVillagePortfolioImpact: (villageId: string, horizon: number = 5, month: number = 7) =>
    fetchJSON<PortfolioClimateImpact>(`/api/v1/portfolio/impact/${villageId}?horizon=${horizon}&month=${month}`),

  // Decision Support Recommendations
  getRecommendations: (villageId: string, horizon: number = 5, month: number = 7) =>
    fetchJSON<MFIRecommendationResponse>(`/api/v1/recommendations/${villageId}?horizon=${horizon}&month=${month}`),

  // Batch Pipeline Execution
  runAllVillages: (horizon: number = 5, month: number = 7) =>
    fetchJSON<VillagePipelineResult[]>(`/api/v1/pipeline/run-all?horizon=${horizon}&month=${month}`),

  // Historical Events & Replay
  getHistoricalEvents: () => fetchJSON<HistoricalEvent[]>('/api/v1/events'),
  getHistoricalEvent: (eventId: string) =>
    fetchJSON<HistoricalEvent>(`/api/v1/events/${eventId}`),
  replayDistrictEvent: (eventId: string, lookbackDays: number = 5, snapshotDate?: string) => {
    let url = `/api/v1/events/${eventId}/replay?lookback_days=${lookbackDays}`;
    if (snapshotDate) url += `&snapshot_date=${snapshotDate}`;
    return fetchJSON<{
      event_id: string;
      event_name: string;
      district: string;
      snapshot_date: string;
      lookback_days: number;
      cluster_evaluations: any[];
      summary: any;
    }>(url);
  },
  replayVillageEvent: (eventId: string, villageId: string, lookbackDays: number = 5) =>
    fetchJSON<HistoricalReplayReport>(`/api/v1/events/${eventId}/replay/${villageId}?lookback_days=${lookbackDays}`),
  getEventEvidence: (eventId: string) =>
    fetchJSON<ObservedFloodValidationResult>(`/api/v1/events/${eventId}/evidence`),

  // Resilience Interventions & Recommendations
  getInterventions: () => fetchJSON<ResilienceIntervention[]>('/api/v1/interventions'),
  getIntervention: (id: string) => fetchJSON<ResilienceIntervention>(`/api/v1/interventions/${id}`),
  getVillageAdaptationRecommendations: (villageId: string, horizon: number = 5, month: number = 7) =>
    fetchJSON<AdaptationRecommendationResponse>(
      `/api/v1/interventions/recommendations/${villageId}?horizon=${horizon}&month=${month}`
    ),

  // Green Finance Products & Calculator
  getGreenFinanceProducts: () => fetchJSON<GreenFinanceProduct[]>('/api/v1/green-finance/products'),
  getGreenFinanceProduct: (id: string) => fetchJSON<GreenFinanceProduct>(`/api/v1/green-finance/products/${id}`),
  calculateFinancingScenario: (req: FinancingScenarioRequest, interventionId?: string) => {
    let url = '/api/v1/green-finance/scenarios';
    if (interventionId) url += `?intervention_id=${encodeURIComponent(interventionId)}`;
    return fetchJSON<FinancingScenarioResponse>(url, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  // Applications
  getApplications: (villageId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (villageId) params.set('village_id', villageId);
    if (status) params.set('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJSON<GreenFinanceApplication[]>(`/api/v1/green-finance/applications${qs}`);
  },
  getApplication: (id: string) => fetchJSON<GreenFinanceApplication>(`/api/v1/green-finance/applications/${id}`),
  createApplication: (req: ApplicationCreateRequest) =>
    fetchJSON<GreenFinanceApplication>('/api/v1/green-finance/applications', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  submitApplicationForReview: (id: string) =>
    fetchJSON<GreenFinanceApplication>(`/api/v1/green-finance/applications/${id}/submit`, { method: 'POST' }),
  recordApplicationDecision: (id: string, req: ApplicationDecisionRequest) =>
    fetchJSON<GreenFinanceApplication>(`/api/v1/green-finance/applications/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  disburseApplication: (id: string, serialNumber?: string) => {
    const qs = serialNumber ? `?serial_number=${encodeURIComponent(serialNumber)}` : '';
    return fetchJSON<ResilienceAsset>(`/api/v1/green-finance/applications/${id}/disburse${qs}`, { method: 'POST' });
  },

  // Resilience Assets
  getAssets: (villageId?: string, verificationStatus?: string) => {
    const params = new URLSearchParams();
    if (villageId) params.set('village_id', villageId);
    if (verificationStatus) params.set('verification_status', verificationStatus);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJSON<ResilienceAsset[]>(`/api/v1/assets${qs}`);
  },
  getAsset: (id: string) => fetchJSON<ResilienceAsset>(`/api/v1/assets/${id}`),

  // Field Verifications & Evidence
  getVerifications: (assetId?: string, result?: string) => {
    const params = new URLSearchParams();
    if (assetId) params.set('asset_id', assetId);
    if (result) params.set('result', result);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJSON<AssetVerification[]>(`/api/v1/verifications${qs}`);
  },
  getVerification: (id: string) => fetchJSON<AssetVerification>(`/api/v1/verifications/${id}`),
  submitVerification: (req: VerificationCreateRequest) =>
    fetchJSON<AssetVerification>('/api/v1/verifications', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  uploadVerificationEvidence: async (id: string, file: File): Promise<AssetVerification> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/v1/verifications/${id}/evidence`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upload error [${res.status}]: ${err}`);
    }
    return res.json();
  },
  recordVerificationDecision: (id: string, req: VerificationDecisionRequest) =>
    fetchJSON<AssetVerification>(`/api/v1/verifications/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // Impact & Methodologies
  getPortfolioImpact: () => fetchJSON<PortfolioImpactSummary>('/api/v1/impact'),
  getAssetImpact: (id: string) => fetchJSON<AssetImpactRecord>(`/api/v1/impact/assets/${id}`),
  getMethodologies: () => fetchJSON<ImpactMethodology[]>('/api/v1/impact/methodologies'),
  getMethodology: (id: string) => fetchJSON<ImpactMethodology>(`/api/v1/impact/methodologies/${id}`),
  calculateCarbonScenario: (emissionsTco2e: number, priceUsd: number = 15.0) =>
    fetchJSON<CarbonScenarioCalculation>(
      `/api/v1/impact/scenario?emissions_avoided_tco2e=${emissionsTco2e}&price_usd=${priceUsd}`
    ),

  // Audit Trail
  getAuditTrail: (entityId?: string, entityType?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (entityId) params.set('entity_id', entityId);
    if (entityType) params.set('entity_type', entityType);
    params.set('limit', limit.toString());
    return fetchJSON<AuditEvent[]>(`/api/v1/audit?${params.toString()}`);
  },

  // Reset Demo Store
  resetDemo: () => fetchJSON<{ status: string; message: string }>('/api/v1/demo/reset', { method: 'POST' }),
};
