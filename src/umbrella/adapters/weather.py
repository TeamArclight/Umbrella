"""Weather Adapter Interface and Open-Meteo Implementation.

Encapsulates external weather APIs behind Umbrella's WeatherProvider interface.
Normalizes raw payloads into UmbrellaWeatherForecast domain objects.

CRITICAL MOCK/FALLBACK RULE:
Mock or fallback data is explicitly marked as 'MOCK' and never masquerades as 'LIVE'.
"""

from abc import ABC, abstractmethod
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
import httpx

from umbrella.schemas.weather import DailyWeatherForecast, UmbrellaWeatherForecast

SUPPORTED_HORIZONS = {3, 5, 7}


class WeatherProvider(ABC):
    """Abstract interface isolating Umbrella's risk engine from external weather APIs."""

    @abstractmethod
    def get_forecast(
        self,
        latitude: float,
        longitude: float,
        forecast_horizon_days: int = 5,
    ) -> UmbrellaWeatherForecast:
        """Retrieve and normalize a short-range weather forecast for specified coordinates."""
        pass


class OpenMeteoWeatherProvider(WeatherProvider):
    """Production adapter for the hosted Open-Meteo Weather API.

    Adheres to Open-Meteo CC-BY 4.0 attribution terms.
    Explicitly tracks data source mode (LIVE vs MOCK).
    """

    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    ATTRIBUTION_TEXT = "Weather data by Open-Meteo.com"

    def __init__(
        self,
        client: Optional[httpx.Client] = None,
        timeout_seconds: float = 10.0,
        enable_offline_fallback: bool = True,
    ):
        self.client = client or httpx.Client(timeout=timeout_seconds)
        self.enable_offline_fallback = enable_offline_fallback

    def get_forecast(
        self,
        latitude: float,
        longitude: float,
        forecast_horizon_days: int = 5,
    ) -> UmbrellaWeatherForecast:
        """Fetch forecast from Open-Meteo with explicit horizon validation and provenance tracking."""
        # 1. Validation
        if not (-90.0 <= latitude <= 90.0):
            raise ValueError(f"Invalid latitude {latitude}. Must be between -90.0 and 90.0.")
        if not (-180.0 <= longitude <= 180.0):
            raise ValueError(f"Invalid longitude {longitude}. Must be between -180.0 and 180.0.")
        if forecast_horizon_days not in SUPPORTED_HORIZONS:
            raise ValueError(
                f"Unsupported forecast horizon {forecast_horizon_days} days. "
                f"Supported horizons are {sorted(list(SUPPORTED_HORIZONS))}."
            )

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "daily": [
                "precipitation_sum",
                "rain_sum",
                "precipitation_probability_max",
                "temperature_2m_max",
                "temperature_2m_min",
                "apparent_temperature_max",
                "wind_speed_10m_max",
                "soil_moisture_0_to_10cm_mean",
            ],
            "forecast_days": forecast_horizon_days,
            "timezone": "UTC",
        }

        try:
            response = self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            return self._normalize_response(data, latitude, longitude, forecast_horizon_days, mode="LIVE")
        except Exception as exc:
            if self.enable_offline_fallback:
                return self._generate_fallback_forecast(
                    latitude, longitude, forecast_horizon_days, reason=str(exc)
                )
            raise RuntimeError(f"Open-Meteo request failed and fallback is disabled: {exc}") from exc

    def _normalize_response(
        self,
        raw: dict,
        latitude: float,
        longitude: float,
        horizon_days: int,
        mode: str = "LIVE",
        fallback_reason: Optional[str] = None,
    ) -> UmbrellaWeatherForecast:
        """Transform raw Open-Meteo dictionary into UmbrellaWeatherForecast."""
        daily = raw.get("daily", {})
        dates_raw = daily.get("time", [])
        precip_raw = daily.get("precipitation_sum", [])
        prob_raw = daily.get("precipitation_probability_max", [])
        t_max_raw = daily.get("temperature_2m_max", [])
        t_min_raw = daily.get("temperature_2m_min", [])
        app_max_raw = daily.get("apparent_temperature_max", [])
        wind_raw = daily.get("wind_speed_10m_max", [])
        soil_raw = daily.get("soil_moisture_0_to_10cm_mean", [])

        records: List[DailyWeatherForecast] = []
        for i, dt_str in enumerate(dates_raw):
            f_date = datetime.strptime(dt_str, "%Y-%m-%d").date()
            rain = float(precip_raw[i]) if i < len(precip_raw) and precip_raw[i] is not None else 0.0
            prob = float(prob_raw[i]) if i < len(prob_raw) and prob_raw[i] is not None else None
            t_max = float(t_max_raw[i]) if i < len(t_max_raw) and t_max_raw[i] is not None else 30.0
            t_min = float(t_min_raw[i]) if i < len(t_min_raw) and t_min_raw[i] is not None else 22.0
            app_max = float(app_max_raw[i]) if i < len(app_max_raw) and app_max_raw[i] is not None else None
            wind = float(wind_raw[i]) if i < len(wind_raw) and wind_raw[i] is not None else None
            soil = float(soil_raw[i]) if i < len(soil_raw) and soil_raw[i] is not None else None

            records.append(
                DailyWeatherForecast(
                    forecast_date=f_date,
                    rainfall_mm=max(0.0, round(rain, 2)),
                    precipitation_probability_pct=prob,
                    temperature_max_c=t_max,
                    temperature_min_c=t_min,
                    apparent_temperature_max_c=app_max,
                    wind_speed_max_kmh=wind,
                    soil_moisture_m3m3=soil,
                )
            )

        cum_rain = sum(r.rainfall_mm for r in records)
        peak_rain = max((r.rainfall_mm for r in records), default=0.0)
        valid_soils = [r.soil_moisture_m3m3 for r in records if r.soil_moisture_m3m3 is not None]
        mean_soil = round(sum(valid_soils) / len(valid_soils), 3) if valid_soils else None

        start_date = records[0].forecast_date if records else date.today()
        end_date = records[-1].forecast_date if records else start_date

        return UmbrellaWeatherForecast(
            latitude=latitude,
            longitude=longitude,
            elevation_m=raw.get("elevation"),
            timezone=raw.get("timezone", "UTC"),
            forecast_horizon_days=horizon_days,
            forecast_start_date=start_date,
            forecast_end_date=end_date,
            daily_forecasts=records,
            cumulative_rainfall_mm=round(cum_rain, 2),
            peak_single_day_rainfall_mm=round(peak_rain, 2),
            mean_soil_moisture_m3m3=mean_soil,
            data_source_mode=mode,  # Explicit LIVE vs MOCK
            provider_name="Open-Meteo",
            attribution=self.ATTRIBUTION_TEXT,
            retrieved_at=datetime.now(timezone.utc),
            fallback_reason=fallback_reason,
        )

    def _generate_fallback_forecast(
        self,
        latitude: float,
        longitude: float,
        horizon_days: int,
        reason: str,
    ) -> UmbrellaWeatherForecast:
        """Deterministic offline fallback explicitly marked as MOCK data."""
        today = date.today()
        records: List[DailyWeatherForecast] = []
        for i in range(horizon_days):
            d = today + timedelta(days=i)
            # Benchmark test pattern: moderate monsoon rain on day 2 and day 3
            simulated_rain = 45.0 if i in [1, 2] else (5.0 if i == 0 else 0.0)
            records.append(
                DailyWeatherForecast(
                    forecast_date=d,
                    rainfall_mm=simulated_rain,
                    precipitation_probability_pct=85.0 if simulated_rain > 10 else 20.0,
                    temperature_max_c=31.0,
                    temperature_min_c=23.5,
                    apparent_temperature_max_c=35.0,
                    wind_speed_max_kmh=16.0,
                    soil_moisture_m3m3=0.38,
                )
            )

        cum_rain = sum(r.rainfall_mm for r in records)
        peak_rain = max((r.rainfall_mm for r in records), default=0.0)

        return UmbrellaWeatherForecast(
            latitude=latitude,
            longitude=longitude,
            elevation_m=120.0,
            timezone="UTC",
            forecast_horizon_days=horizon_days,
            forecast_start_date=today,
            forecast_end_date=today + timedelta(days=horizon_days - 1),
            daily_forecasts=records,
            cumulative_rainfall_mm=round(cum_rain, 2),
            peak_single_day_rainfall_mm=round(peak_rain, 2),
            mean_soil_moisture_m3m3=0.38,
            data_source_mode="MOCK",  # Explicitly MOCK
            provider_name="Open-Meteo (Offline Mock Fallback)",
            attribution=self.ATTRIBUTION_TEXT,
            retrieved_at=datetime.now(timezone.utc),
            fallback_reason=f"Open-Meteo network query failed: {reason}",
        )
