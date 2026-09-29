"""Umbrella FastAPI REST Service.

Exposes RESTful endpoints under /api/v1/ for:
- Health and open-source attribution
- Pilot geography exploration
- Short-range weather forecasts with explicit provenance
- Pure physical flood hazard early warning
- Independent microfinance portfolio exposure (SYNTHETIC)
- Combined portfolio climate impact / priority
- Decision-support recommendations for human credit/risk officers.
"""

from datetime import date
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from umbrella.pipeline import UmbrellaPipeline, VillagePipelineResult
from umbrella.schemas.weather import UmbrellaWeatherForecast
from umbrella.schemas.hazard import FloodHazardEvaluation
from umbrella.schemas.portfolio import PortfolioExposure
from umbrella.schemas.impact import PortfolioClimateImpact
from umbrella.schemas.recommendation import MFIRecommendationResponse
from umbrella.schemas.replay import (
    HistoricalSnapshotEvaluation,
    HistoricalReplayReport,
    ObservedFloodValidationResult,
)
from umbrella.schemas.resilience import (
    ResilienceIntervention,
    AdaptationRecommendationResponse,
    GreenFinanceProduct,
    FinancingScenarioRequest,
    FinancingScenarioResponse,
    GreenFinanceApplication,
    ApplicationCreateRequest,
    ApplicationDecisionRequest,
    ResilienceAsset,
    AssetCreateRequest,
    AssetVerification,
    VerificationCreateRequest,
    VerificationDecisionRequest,
    ImpactMethodology,
    AssetImpactRecord,
    PortfolioImpactSummary,
    CarbonScenarioCalculation,
    AuditEvent,
)
from umbrella.engine.catalog import (
    list_interventions,
    get_intervention,
    list_finance_products,
    get_finance_product,
    get_methodology,
    IMPACT_METHODOLOGIES,
)
from umbrella.engine.financing import FinancingCalculator
from umbrella.engine.adaptation_rec import AdaptationRecommendationEngine
from umbrella.engine.impact_engine import ImpactEstimationEngine
from umbrella.engine.flywheel_store import FlywheelStore
from umbrella.engine.state_machine import InvalidStateTransitionError
from umbrella.engine.replay import HistoricalEventReplayEngine
from umbrella.validators.sentinel import ObservedFloodValidator
from umbrella.config.geography import (
    PilotVillageConfig,
    get_pilot_village,
    list_pilot_villages,
    load_district_geojson,
    load_district_villages_geojson,
    get_pilot_metadata,
    get_primary_pilot_district,
)

app = FastAPI(
    title="Umbrella Climate-Adaptive Microfinance API",
    description=(
        "Early warning climate exposure and proactive portfolio risk management for rural microfinance. "
        "Strictly separates physical environmental hazard from financial portfolio exposure."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = UmbrellaPipeline()
replay_engine = HistoricalEventReplayEngine()
flood_validator = ObservedFloodValidator(replay_engine)
adaptation_rec_engine = AdaptationRecommendationEngine()
flywheel_store = FlywheelStore()




# --- Health & Attribution ---

@app.get("/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
def health_check():
    """Service health and operational status."""
    return {
        "status": "healthy",
        "service": "umbrella-api",
        "version": "1.0.0",
        "model_version": "Flood Hazard Model v1.0",
        "architecture": "Separated Hazard, Exposure, and Operational Priority",
    }


@app.get("/attribution", tags=["System"])
@app.get("/api/v1/attribution", tags=["System"])
def get_attributions():
    """Mandatory third-party licenses, terms of use, and scientific disclaimers."""
    return {
        "open_meteo": {
            "provider": "Open-Meteo",
            "url": "https://open-meteo.com",
            "attribution": "Weather data by Open-Meteo.com",
            "license": "CC-BY 4.0 (API data) / AGPL-3.0 (Server Code)",
            "sources": "ECMWF, DWD ICON, NOAA GFS",
        },
        "cgiar_climate": {
            "provider": "CGIAR Climate Data Hub / CHIRPS",
            "attribution": "Methodology adapted from CGIAR Climate Data Hub Toolkit (MIT License)",
            "license": "MIT",
            "datasets": "CHIRPS v2.0 (Funk et al., 2015), AgERA5 Climatology",
            "integration_mode": "LOCAL_DATASET (Pre-calibrated 30-year climatological normal tables)",
        },
        "risk_methodology": {
            "framework": "Economics of Climate Adaptation (ECA) / CLIMADA",
            "attribution": "Conceptual separation of Hazard, Exposure, and Impact inspired by CLIMADA",
            "license": "GPL-3.0 (Methodology inspiration only; clean room Python implementation)",
        },
        "portfolio_data": {
            "source": "SyntheticPortfolioProvider",
            "data_type": "SYNTHETIC",
            "disclaimer": "All microfinance borrower, loan balance, and group figures are synthetic demo values. Not actual client data.",
        },
        "scientific_disclaimers": {
            "credit_default": "Umbrella evaluates climate-exposed portfolio capital; it does NOT predict individual borrower credit defaults.",
            "carbon_benefits": "Emissions avoided are uncertified operational proxies (ESTIMATED_EMISSIONS_AVOIDED); they do not constitute certified carbon credits or guaranteed revenue.",
            "decision_support": "System recommendations are decision-support advisories; Umbrella does not automatically alter financial contracts without human authorization.",
        },
    }


# --- Pilot Geographies ---

@app.get("/api/v1/villages", response_model=List[PilotVillageConfig], tags=["Geography"])
def list_villages(
    state: Optional[str] = Query(None, description="Filter by state (e.g. Telangana, Bihar)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Nizamabad, Samastipur)"),
):
    """List monitored pilot villages and their environmental terrain attributes."""
    return list_pilot_villages(state=state, district=district)


@app.get("/api/v1/villages/{village_id}", response_model=PilotVillageConfig, tags=["Geography"])
def get_village_details(village_id: str):
    """Retrieve details and physical terrain attributes for a specific village."""
    try:
        return get_pilot_village(village_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Pilot village '{village_id}' not found.")


@app.get("/api/v1/geography/pilot", tags=["Geography"])
def get_pilot_geography():
    """Retrieve primary pilot district profile, metadata, and operational clusters."""
    try:
        return get_primary_pilot_district()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/v1/geography/district/{district_id}", tags=["Geography"])
def get_district_boundary(district_id: str):
    """Retrieve official GeoJSON boundary for a district (e.g. darbhanga)."""
    try:
        return load_district_geojson(district=district_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Boundary GeoJSON for district '{district_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/v1/geography/district/{district_id}/villages", tags=["Geography"])
def get_district_clusters_geojson(district_id: str):
    """Retrieve GeoJSON FeatureCollection of operational village clusters in a district."""
    try:
        return load_district_villages_geojson(district=district_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Clusters GeoJSON for district '{district_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))



# --- Weather Forecast ---

@app.get("/api/v1/weather/{village_id}", response_model=UmbrellaWeatherForecast, tags=["Weather"])
def get_village_weather(
    village_id: str,
    horizon: int = Query(5, description="Forecast horizon in days (3, 5, or 7)"),
):
    """Fetch normalized weather forecast for a village with explicit data source mode (LIVE vs MOCK)."""
    try:
        cfg = get_pilot_village(village_id)
        return pipeline.weather_provider.get_forecast(
            latitude=cfg.latitude,
            longitude=cfg.longitude,
            forecast_horizon_days=horizon,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Pilot village '{village_id}' not found.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --- Pure Physical Flood Hazard ---

@app.get("/api/v1/hazards/flood/{village_id}", response_model=FloodHazardEvaluation, tags=["Hazard"])
def get_flood_hazard(
    village_id: str,
    horizon: int = Query(5, description="Forecast horizon in days (3, 5, or 7)"),
    month: int = Query(7, ge=1, le=12, description="Calendar month for climatology baseline comparison"),
):
    """Calculate purely physical flood hazard (0-100) using Flood Hazard Model v1.0.

    Contains ZERO portfolio exposure metrics.
    """
    try:
        cfg = get_pilot_village(village_id)
        forecast = pipeline.weather_provider.get_forecast(
            latitude=cfg.latitude,
            longitude=cfg.longitude,
            forecast_horizon_days=horizon,
        )
        climatology = pipeline.climate_provider.get_historical_baseline(
            latitude=cfg.latitude,
            longitude=cfg.longitude,
            month=month,
        )
        return pipeline.hazard_engine.evaluate(
            village_id=cfg.village_id,
            village_name=cfg.village_name,
            district=cfg.district,
            state=cfg.state,
            latitude=cfg.latitude,
            longitude=cfg.longitude,
            forecast=forecast,
            climatology=climatology,
            terrain=cfg.terrain,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Pilot village '{village_id}' not found.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --- Independent Portfolio Exposure ---

@app.get("/api/v1/portfolio/exposure/{village_id}", response_model=PortfolioExposure, tags=["Portfolio"])
def get_portfolio_exposure(village_id: str):
    """Retrieve microfinance portfolio capital, borrower count, and groups exposed in this village.

    Explicitly marked as SYNTHETIC demo data. Does not indicate physical climate hazard.
    """
    try:
        # Verify village exists
        get_pilot_village(village_id)
        return pipeline.exposure_engine.get_exposure(village_id=village_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Pilot village '{village_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --- Combined Operational Priority ---

@app.get("/api/v1/portfolio/impact/{village_id}", response_model=PortfolioClimateImpact, tags=["Portfolio"])
def get_portfolio_impact(
    village_id: str,
    horizon: int = Query(5, description="Forecast horizon in days (3, 5, or 7)"),
    month: int = Query(7, ge=1, le=12, description="Calendar month for climatology baseline comparison"),
):
    """Combine independently evaluated flood hazard and portfolio exposure into operational priority."""
    try:
        cfg = get_pilot_village(village_id)
        forecast = pipeline.weather_provider.get_forecast(
            latitude=cfg.latitude,
            longitude=cfg.longitude,
            forecast_horizon_days=horizon,
        )
        climatology = pipeline.climate_provider.get_historical_baseline(
            latitude=cfg.latitude,
            longitude=cfg.longitude,
            month=month,
        )
        hazard = pipeline.hazard_engine.evaluate(
            village_id=cfg.village_id,
            village_name=cfg.village_name,
            district=cfg.district,
            state=cfg.state,
            latitude=cfg.latitude,
            longitude=cfg.longitude,
            forecast=forecast,
            climatology=climatology,
            terrain=cfg.terrain,
        )
        exposure = pipeline.exposure_engine.get_exposure(village_id=village_id)
        return pipeline.impact_engine.evaluate_priority(hazard=hazard, exposure=exposure)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Pilot village '{village_id}' not found.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --- Decision Support Recommendations ---

@app.get("/api/v1/recommendations/{village_id}", response_model=MFIRecommendationResponse, tags=["Recommendations"])
def get_recommendations(
    village_id: str,
    horizon: int = Query(5, description="Forecast horizon in days (3, 5, or 7)"),
    month: int = Query(7, ge=1, le=12, description="Calendar month for climatology baseline comparison"),
):
    """Generate non-prescriptive decision-support advisories for human credit officer review."""
    try:
        cfg = get_pilot_village(village_id)
        res = pipeline.evaluate_village(
            village_id=village_id,
            forecast_horizon_days=horizon,
            evaluation_month=month,
        )
        return res.recommendations
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Pilot village '{village_id}' not found.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --- Batch Pipeline Run ---

@app.get("/api/v1/pipeline/run-all", response_model=List[VillagePipelineResult], tags=["Pipeline"])
def run_all_villages(
    horizon: int = Query(5, description="Forecast horizon in days (3, 5, or 7)"),
    month: int = Query(7, ge=1, le=12, description="Calendar month for climatology baseline comparison"),
):
    """Execute complete decoupled pipeline across all monitored pilot villages."""
    try:
        return pipeline.evaluate_all_monitored_villages(
            forecast_horizon_days=horizon,
            evaluation_month=month,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --- Historical Disaster Events & Retrospective Replay ---

@app.get("/api/v1/events", tags=["Events"])
def list_historical_events():
    """List registered historical benchmark flood events."""
    try:
        return replay_engine.list_events()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/v1/events/{event_id}", tags=["Events"])
def get_historical_event(event_id: str):
    """Retrieve details of a historical disaster event including hydrological and remote sensing context."""
    try:
        return replay_engine.load_event(event_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Historical flood event '{event_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/v1/events/{event_id}/replay", tags=["Events"])
def replay_district_flood_event(
    event_id: str,
    lookback_days: int = Query(5, description="Lookback window for retrospective weather reanalysis"),
    snapshot_date: Optional[str] = Query(None, description="Specific snapshot date (YYYY-MM-DD); defaults to peak flood date"),
):
    """Run retrospective replay of Flood Hazard Model v1.0 across all operational clusters in the pilot district."""
    try:
        target_d = date.fromisoformat(snapshot_date) if snapshot_date else None
        return replay_engine.replay_district_event(
            event_id=event_id,
            lookback_days=lookback_days,
            target_snapshot_date=target_d,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Historical flood event '{event_id}' not found.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/v1/events/{event_id}/replay/{village_id}", response_model=HistoricalReplayReport, tags=["Events"])
def replay_village_flood_event(
    event_id: str,
    village_id: str,
    lookback_days: int = Query(5, description="Lookback window for retrospective weather reanalysis"),
):
    """Run multi-snapshot chronological replay (T-7, T-5, T-3, T-1, T0, T+3) for a village.

    Guarantees strict anti-leakage: for each snapshot, only data up to that snapshot date is accessible.
    """
    try:
        return replay_engine.replay_village_event(
            village_id=village_id,
            event_id=event_id,
            lookback_days=lookback_days,
        )
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/v1/events/{event_id}/evidence", response_model=ObservedFloodValidationResult, tags=["Events"])
def get_event_observational_evidence(event_id: str):
    """Retrieve remote sensing (Sentinel-1 SAR, ISRO Bhuvan) and CWC hydrological ground truth validation."""
    try:
        return flood_validator.validate_event(event_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Historical flood event '{event_id}' not found.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# =============================================================================
# --- Resilience Intervention Catalog ---
# =============================================================================

@app.get("/api/v1/interventions", response_model=List[ResilienceIntervention], tags=["Resilience"])
def get_interventions_catalog():
    """Retrieve all structured climate-resilience physical interventions."""
    return list_interventions()


@app.get("/api/v1/interventions/{intervention_id}", response_model=ResilienceIntervention, tags=["Resilience"])
def get_single_intervention(intervention_id: str):
    """Retrieve details, specifications, and verification checklist for a specific intervention."""
    try:
        return get_intervention(intervention_id)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))


@app.get(
    "/api/v1/interventions/recommendations/{village_id}",
    response_model=AdaptationRecommendationResponse,
    tags=["Resilience"],
)
def get_village_adaptation_recommendations(
    village_id: str,
    horizon: int = Query(5, description="Forecast horizon in days (3, 5, or 7)"),
    month: int = Query(7, ge=1, le=12, description="Evaluation calendar month"),
):
    """Generate ranked, explainable resilience interventions tailored to village hazard drivers and livelihoods."""
    try:
        eval_res = pipeline.evaluate_village(
            village_id=village_id,
            forecast_horizon_days=horizon,
            evaluation_month=month,
        )
        hazard = eval_res.flood_hazard
        impact = eval_res.portfolio_impact

        drivers = (
            hazard.drivers
            if hazard.drivers
            else [
                "Monsoon riverine flood basin proximity",
                "Elevated seasonal precipitation anomaly",
            ]
        )

        return adaptation_rec_engine.evaluate_village_interventions(
            village_id=village_id,
            village_name=hazard.village_name,
            hazard_score=hazard.hazard_score,
            hazard_level=hazard.hazard_level,
            priority_level=impact.priority_level,
            hazard_drivers=drivers,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Pilot village '{village_id}' not found.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# =============================================================================
# --- Green Finance Products & Financing Calculator ---
# =============================================================================

@app.get("/api/v1/green-finance/products", response_model=List[GreenFinanceProduct], tags=["Green Finance"])
def get_green_finance_products():
    """Retrieve available green microfinance loan products (indicative demo terms)."""
    return list_finance_products()


@app.get("/api/v1/green-finance/products/{product_id}", response_model=GreenFinanceProduct, tags=["Green Finance"])
def get_single_finance_product(product_id: str):
    """Retrieve parameters and terms for a specific green finance product."""
    try:
        return get_finance_product(product_id)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))


@app.post("/api/v1/green-finance/scenarios", response_model=FinancingScenarioResponse, tags=["Green Finance"])
def calculate_financing_scenario(
    request: FinancingScenarioRequest,
    intervention_id: Optional[str] = Query(None, description="Optional intervention ID to estimate savings & payback"),
):
    """Deterministically calculate loan installment (EMI), total repayment, and operational savings payback."""
    try:
        return FinancingCalculator.calculate_scenario(request=request, intervention_id=intervention_id)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# =============================================================================
# --- Green Finance Applications Lifecycle ---
# =============================================================================

@app.get("/api/v1/green-finance/applications", response_model=List[GreenFinanceApplication], tags=["Green Finance"])
def list_applications(
    village_id: Optional[str] = Query(None, description="Filter by village ID"),
    status: Optional[str] = Query(None, description="Filter by application lifecycle status"),
):
    """List green finance applications with optional filtering."""
    with flywheel_store._lock:
        apps = list(flywheel_store.applications.values())

    if village_id:
        apps = [a for a in apps if a.village_id == village_id]
    if status:
        apps = [a for a in apps if a.status == status]

    apps.sort(key=lambda a: a.created_at, reverse=True)
    return apps


@app.get(
    "/api/v1/green-finance/applications/{application_id}",
    response_model=GreenFinanceApplication,
    tags=["Green Finance"],
)
def get_application(application_id: str):
    """Retrieve full application record and decision history."""
    with flywheel_store._lock:
        if application_id not in flywheel_store.applications:
            raise HTTPException(status_code=404, detail=f"Application '{application_id}' not found.")
        return flywheel_store.applications[application_id]


@app.post(
    "/api/v1/green-finance/applications",
    response_model=GreenFinanceApplication,
    status_code=201,
    tags=["Green Finance"],
)
def create_application(request: ApplicationCreateRequest):
    """Initiate a new resilience financing application in DRAFT state."""
    try:
        return flywheel_store.create_application(request)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post(
    "/api/v1/green-finance/applications/{application_id}/submit",
    response_model=GreenFinanceApplication,
    tags=["Green Finance"],
)
def submit_application_for_review(application_id: str):
    """Submit a DRAFT application for human credit officer review."""
    try:
        return flywheel_store.submit_for_review(application_id)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except InvalidStateTransitionError as ste:
        raise HTTPException(status_code=400, detail=str(ste))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post(
    "/api/v1/green-finance/applications/{application_id}/decision",
    response_model=GreenFinanceApplication,
    tags=["Green Finance"],
)
def record_application_decision(application_id: str, request: ApplicationDecisionRequest):
    """Record an explicit human credit officer authorization or rejection.
    
    Umbrella does NOT autonomously approve loans.
    """
    try:
        return flywheel_store.record_application_decision(application_id, request)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except InvalidStateTransitionError as ste:
        raise HTTPException(status_code=400, detail=str(ste))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post(
    "/api/v1/green-finance/applications/{application_id}/disburse",
    response_model=ResilienceAsset,
    tags=["Green Finance"],
)
def disburse_loan_and_register_asset(
    application_id: str,
    serial_number: Optional[str] = Query(None, description="Optional equipment serial number / asset tag"),
):
    """Mark approved loan as disbursed and register the physical ResilienceAsset."""
    try:
        return flywheel_store.disburse_and_register_asset(application_id, serial_number=serial_number)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except InvalidStateTransitionError as ste:
        raise HTTPException(status_code=400, detail=str(ste))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# =============================================================================
# --- Physical Resilience Assets ---
# =============================================================================

@app.get("/api/v1/assets", response_model=List[ResilienceAsset], tags=["Assets"])
def list_assets(
    village_id: Optional[str] = Query(None, description="Filter by village ID"),
    verification_status: Optional[str] = Query(None, description="Filter by verification status"),
):
    """List registered resilience assets."""
    with flywheel_store._lock:
        assets = list(flywheel_store.assets.values())

    if village_id:
        assets = [a for a in assets if a.village_id == village_id]
    if verification_status:
        assets = [a for a in assets if a.verification_status == verification_status]

    assets.sort(key=lambda a: a.created_at, reverse=True)
    return assets


@app.get("/api/v1/assets/{asset_id}", response_model=ResilienceAsset, tags=["Assets"])
def get_asset_details(asset_id: str):
    """Retrieve full profile and verification status of a resilience asset."""
    with flywheel_store._lock:
        if asset_id not in flywheel_store.assets:
            raise HTTPException(status_code=404, detail=f"Resilience asset '{asset_id}' not found.")
        return flywheel_store.assets[asset_id]


# =============================================================================
# --- Field Verifications & Evidence Submission ---
# =============================================================================

@app.get("/api/v1/verifications", response_model=List[AssetVerification], tags=["Verification"])
def list_verifications(
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    result: Optional[str] = Query(None, description="Filter by verification result"),
):
    """List field verification records."""
    with flywheel_store._lock:
        records = list(flywheel_store.verifications.values())

    if asset_id:
        records = [r for r in records if r.asset_id == asset_id]
    if result:
        records = [r for r in records if r.verification_result == result]

    records.sort(key=lambda r: r.created_at, reverse=True)
    return records


@app.get("/api/v1/verifications/{verification_id}", response_model=AssetVerification, tags=["Verification"])
def get_verification_record(verification_id: str):
    """Retrieve details and automated integrity breakdown for a verification record."""
    with flywheel_store._lock:
        if verification_id not in flywheel_store.verifications:
            raise HTTPException(status_code=404, detail=f"Verification record '{verification_id}' not found.")
        return flywheel_store.verifications[verification_id]


@app.post("/api/v1/verifications", response_model=AssetVerification, status_code=201, tags=["Verification"])
def submit_field_verification(request: VerificationCreateRequest):
    """Submit field inspection checklist and coordinates. Photo can be uploaded concurrently or separately."""
    try:
        return flywheel_store.submit_verification(request)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/v1/verifications/{verification_id}/evidence", response_model=AssetVerification, tags=["Verification"])
async def upload_verification_evidence(verification_id: str, file: UploadFile = File(...)):
    """Upload photographic field evidence for a verification record.
    
    Performs content-based MIME inspection, computes SHA-256 hash, and runs duplicate evidence detection.
    """
    with flywheel_store._lock:
        if verification_id not in flywheel_store.verifications:
            raise HTTPException(status_code=404, detail=f"Verification record '{verification_id}' not found.")
        verif = flywheel_store.verifications[verification_id]
        asset = flywheel_store.assets.get(verif.asset_id)

    try:
        content = await file.read()
        saved_filename, sha256_hash = flywheel_store.verification_engine.validate_and_save_photo(
            file_bytes=content,
            original_filename=file.filename or "evidence.jpg",
            content_type=file.content_type,
        )

        with flywheel_store._lock:
            # Re-evaluate automated integrity checks with the new image hash
            intervention = get_intervention(asset.intervention_id) if asset else None
            app = flywheel_store.applications.get(asset.application_id) if asset else None

            summary = flywheel_store.verification_engine.evaluate_verification(
                new_sha256=sha256_hash,
                current_asset_id=verif.asset_id,
                existing_hashes=flywheel_store.verification_hashes,
                submitted_lat=verif.submitted_latitude,
                submitted_lon=verif.submitted_longitude,
                expected_lat=asset.expected_latitude if asset else verif.submitted_latitude,
                expected_lon=asset.expected_longitude if asset else verif.submitted_longitude,
                submitted_at=verif.submitted_at,
                application_created_at=app.created_at if app else None,
                checklist_items=intervention.verification_requirements if intervention else [],
                checklist_responses=verif.checklist_responses,
            )

            # Update verification record
            verif.photo_filename = saved_filename
            verif.photo_sha256 = sha256_hash
            verif.automated_summary = summary
            flywheel_store.verification_hashes[sha256_hash] = verif.asset_id

            if summary.overall_automated_status == "FLAGGED":
                verif.verification_result = "FLAGGED"
                if asset:
                    asset.verification_status = "FLAGGED"

        flywheel_store.audit.record_event(
            entity_type="VERIFICATION",
            entity_id=verification_id,
            action="EVIDENCE_PHOTO_UPLOADED",
            actor_type="FIELD_OFFICER",
            actor_id=verif.officer_id,
            actor_name=verif.officer_name,
            metadata={"filename": saved_filename, "sha256": sha256_hash, "status": verif.verification_result},
        )
        return verif
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post(
    "/api/v1/verifications/{verification_id}/decision",
    response_model=AssetVerification,
    tags=["Verification"],
)
def record_verification_decision(verification_id: str, request: VerificationDecisionRequest):
    """Record supervisory human review (confirmation or override) of field verification."""
    try:
        return flywheel_store.record_verification_decision(verification_id, request)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# =============================================================================
# --- Impact Estimation & Methodologies ---
# =============================================================================

@app.get("/api/v1/impact", response_model=PortfolioImpactSummary, tags=["Impact"])
def get_portfolio_impact_summary():
    """Retrieve portfolio-level aggregated adaptation resilience and avoided emissions metrics."""
    with flywheel_store._lock:
        apps = list(flywheel_store.applications.values())
        assets = list(flywheel_store.assets.values())
    return ImpactEstimationEngine.aggregate_portfolio_impact(applications=apps, assets=assets)


@app.get("/api/v1/impact/assets/{asset_id}", response_model=AssetImpactRecord, tags=["Impact"])
def get_asset_impact_record(asset_id: str):
    """Retrieve individual asset adaptation benefits and, if supported, emissions avoided calculations."""
    with flywheel_store._lock:
        if asset_id not in flywheel_store.assets:
            raise HTTPException(status_code=404, detail=f"Resilience asset '{asset_id}' not found.")
        asset = flywheel_store.assets[asset_id]
    return ImpactEstimationEngine.calculate_asset_impact(asset)


@app.get("/api/v1/impact/methodologies", response_model=List[ImpactMethodology], tags=["Impact"])
def list_impact_methodologies():
    """Retrieve registered published carbon and resilience methodologies."""
    return list(IMPACT_METHODOLOGIES.values())


@app.get("/api/v1/impact/methodologies/{methodology_id}", response_model=ImpactMethodology, tags=["Impact"])
def get_methodology_details(methodology_id: str):
    """Retrieve details and scientific citations for a specific impact methodology."""
    try:
        return get_methodology(methodology_id)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))


@app.get("/api/v1/impact/scenario", response_model=CarbonScenarioCalculation, tags=["Impact"])
def calculate_carbon_scenario(
    emissions_avoided_tco2e: float = Query(..., ge=0.0, description="Estimated tCO2e emissions avoided"),
    price_usd: float = Query(15.0, ge=0.0, le=200.0, description="User-selected illustrative carbon price in USD/tCO2e"),
):
    """Calculate an illustrative economic scenario value for avoided emissions.
    
    Prominently labeled as an illustrative scenario; not certified credit revenue.
    """
    return ImpactEstimationEngine.calculate_carbon_scenario(
        estimated_emissions_avoided_tco2e=emissions_avoided_tco2e,
        carbon_price_usd_per_tonne=price_usd,
    )


# =============================================================================
# --- Institutional Audit Trail ---
# =============================================================================

@app.get("/api/v1/audit", response_model=List[AuditEvent], tags=["Audit"])
def get_audit_trail(
    entity_id: Optional[str] = Query(None, description="Filter by entity ID (e.g. APP-DAR-001)"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (APPLICATION, ASSET, VERIFICATION)"),
    limit: int = Query(50, ge=1, le=200, description="Max events to return"),
):
    """Retrieve immutable chronological audit trail events."""
    return flywheel_store.audit.list_events(entity_id=entity_id, entity_type=entity_type, limit=limit)


# =============================================================================
# --- Demo Scenario Management ---
# =============================================================================

@app.post("/api/v1/demo/reset", tags=["System"])
def reset_demo_flywheel():
    """Reset the interactive resilience finance flywheel database back to pristine demo state."""
    flywheel_store.seed_demo_data()
    return {
        "status": "success",
        "message": "Demo resilience finance and verification database reset to default state.",
        "applications_seeded": len(flywheel_store.applications),
        "assets_seeded": len(flywheel_store.assets),
        "verifications_seeded": len(flywheel_store.verifications),
    }


