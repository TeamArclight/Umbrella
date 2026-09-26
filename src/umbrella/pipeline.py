"""Umbrella Core Pipeline.

Orchestrates the strictly separated flow:
WeatherProvider + ClimateDataProvider + Physical Terrain
        ↓
FloodHazardEngine (Pure Physical Hazard Evaluation)
        ↓
        ├──────────────→ Early Warning Hazard Signal
        │
        ▼
PortfolioProvider & ExposureEngine (Pure Business Exposure)
        ↓
PortfolioImpactEngine (Operational Priority Combining Separate Signals)
        ↓
RecommendationEngine (Decision Support Advisories for Human Officers)
"""

from typing import List, Optional
from pydantic import BaseModel

from umbrella.adapters.weather import WeatherProvider, OpenMeteoWeatherProvider
from umbrella.adapters.climate import ClimateDataProvider, CGIARClimateProvider
from umbrella.adapters.portfolio import PortfolioProvider, SyntheticPortfolioProvider
from umbrella.engine.hazard import FloodHazardEngine
from umbrella.engine.exposure import PortfolioExposureEngine
from umbrella.engine.impact import PortfolioImpactEngine
from umbrella.engine.recommendation import RecommendationEngine
from umbrella.schemas.weather import UmbrellaWeatherForecast
from umbrella.schemas.hazard import FloodHazardEvaluation
from umbrella.schemas.portfolio import PortfolioExposure
from umbrella.schemas.impact import PortfolioClimateImpact
from umbrella.schemas.recommendation import MFIRecommendationResponse
from umbrella.config.geography import get_pilot_village, list_pilot_villages


class VillagePipelineResult(BaseModel):
    """Unified container for an end-to-end evaluated village node."""
    village_id: str
    village_name: str
    district: str
    state: str
    forecast_horizon_days: int
    weather_forecast: UmbrellaWeatherForecast
    flood_hazard: FloodHazardEvaluation
    portfolio_exposure: PortfolioExposure
    portfolio_impact: PortfolioClimateImpact
    recommendations: MFIRecommendationResponse


class UmbrellaPipeline:
    """Umbrella central orchestration pipeline ensuring strict separation of concerns."""

    def __init__(
        self,
        weather_provider: Optional[WeatherProvider] = None,
        climate_provider: Optional[ClimateDataProvider] = None,
        portfolio_provider: Optional[PortfolioProvider] = None,
        hazard_engine: Optional[FloodHazardEngine] = None,
        exposure_engine: Optional[PortfolioExposureEngine] = None,
        impact_engine: Optional[PortfolioImpactEngine] = None,
        recommendation_engine: Optional[RecommendationEngine] = None,
    ):
        self.weather_provider = weather_provider or OpenMeteoWeatherProvider()
        self.climate_provider = climate_provider or CGIARClimateProvider()
        self.portfolio_provider = portfolio_provider or SyntheticPortfolioProvider()
        self.hazard_engine = hazard_engine or FloodHazardEngine()
        self.exposure_engine = exposure_engine or PortfolioExposureEngine(self.portfolio_provider)
        self.impact_engine = impact_engine or PortfolioImpactEngine()
        self.recommendation_engine = recommendation_engine or RecommendationEngine()

    def evaluate_village(
        self,
        village_id: str,
        forecast_horizon_days: int = 5,
        evaluation_month: int = 7,  # Default: peak monsoon (July)
    ) -> VillagePipelineResult:
        """Execute the end-to-end pipeline for a single village."""
        # 1. Resolve pilot village geographic and physical terrain configuration
        village_cfg = get_pilot_village(village_id)

        # 2. Retrieve short-range meteorological forecast
        forecast = self.weather_provider.get_forecast(
            latitude=village_cfg.latitude,
            longitude=village_cfg.longitude,
            forecast_horizon_days=forecast_horizon_days,
        )

        # 3. Retrieve historical climatological baseline
        climatology = self.climate_provider.get_historical_baseline(
            latitude=village_cfg.latitude,
            longitude=village_cfg.longitude,
            month=evaluation_month,
        )

        # 4. Evaluate physical flood hazard (strictly zero portfolio inputs)
        hazard = self.hazard_engine.evaluate(
            village_id=village_cfg.village_id,
            village_name=village_cfg.village_name,
            district=village_cfg.district,
            state=village_cfg.state,
            latitude=village_cfg.latitude,
            longitude=village_cfg.longitude,
            forecast=forecast,
            climatology=climatology,
            terrain=village_cfg.terrain,
        )

        # 5. Calculate portfolio exposure (strictly business metrics marked SYNTHETIC)
        exposure = self.exposure_engine.get_exposure(village_id=village_cfg.village_id)

        # 6. Evaluate operational priority by combining separate hazard and exposure
        impact = self.impact_engine.evaluate_priority(hazard=hazard, exposure=exposure)

        # 7. Generate non-prescriptive decision support recommendations for human review
        recommendations = self.recommendation_engine.generate_recommendation(impact=impact)

        return VillagePipelineResult(
            village_id=village_cfg.village_id,
            village_name=village_cfg.village_name,
            district=village_cfg.district,
            state=village_cfg.state,
            forecast_horizon_days=forecast_horizon_days,
            weather_forecast=forecast,
            flood_hazard=hazard,
            portfolio_exposure=exposure,
            portfolio_impact=impact,
            recommendations=recommendations,
        )

    def evaluate_all_monitored_villages(
        self,
        forecast_horizon_days: int = 5,
        evaluation_month: int = 7,
    ) -> List[VillagePipelineResult]:
        """Execute pipeline across all registered pilot villages."""
        villages = list_pilot_villages()
        results: List[VillagePipelineResult] = []
        for v in villages:
            res = self.evaluate_village(
                village_id=v.village_id,
                forecast_horizon_days=forecast_horizon_days,
                evaluation_month=evaluation_month,
            )
            results.append(res)
        return results
