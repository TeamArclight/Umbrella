"""Umbrella Weather Schemas (Normalized Domain Model).

Isolates Umbrella from external weather API structures (such as Open-Meteo).
Includes explicit data source mode and provenance tracking.
"""

from datetime import date, datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class DailyWeatherForecast(BaseModel):
    """Normalized daily weather forecast for a single date."""
    forecast_date: date
    rainfall_mm: float = Field(..., ge=0.0, description="Precipitation sum in millimeters")
    precipitation_probability_pct: Optional[float] = Field(
        None, ge=0.0, le=100.0, description="Maximum precipitation probability in percent"
    )
    temperature_max_c: float = Field(..., description="Maximum 2m air temperature in Celsius")
    temperature_min_c: float = Field(..., description="Minimum 2m air temperature in Celsius")
    apparent_temperature_max_c: Optional[float] = Field(None, description="Apparent maximum temperature in Celsius")
    wind_speed_max_kmh: Optional[float] = Field(None, ge=0.0, description="Maximum wind speed in km/h")
    soil_moisture_m3m3: Optional[float] = Field(
        None, ge=0.0, description="Volumetric soil water content (0-10cm) in m3/m3"
    )


class UmbrellaWeatherForecast(BaseModel):
    """Normalized multi-day weather forecast response for target village coordinates."""
    latitude: float
    longitude: float
    elevation_m: Optional[float] = None
    timezone: str = "UTC"
    forecast_horizon_days: int = Field(..., description="Horizon duration in days (3, 5, or 7)")
    forecast_start_date: date
    forecast_end_date: date
    daily_forecasts: List[DailyWeatherForecast]
    cumulative_rainfall_mm: float = Field(..., ge=0.0, description="Sum of forecast precipitation over the horizon window")
    peak_single_day_rainfall_mm: float = Field(..., ge=0.0, description="Maximum single-day rainfall intensity in mm")
    mean_soil_moisture_m3m3: Optional[float] = Field(None, description="Mean soil moisture across forecast horizon")

    # Data Source & Provenance Tracking
    data_source_mode: Literal["LIVE", "CACHED", "MOCK", "SYNTHETIC", "REANALYSIS", "RETROSPECTIVE_REANALYSIS"] = Field(
        ..., description="LIVE for genuine API responses, REANALYSIS for retrospective ERA5 data, MOCK for fallback"
    )
    provider_name: str = "Open-Meteo"
    attribution: str = "Weather data by Open-Meteo.com"
    retrieved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fallback_reason: Optional[str] = Field(
        None, description="Detailed explanation if fallback/mock mode was triggered"
    )
