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
from fastapi import FastAPI, HTTPException, Query
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

