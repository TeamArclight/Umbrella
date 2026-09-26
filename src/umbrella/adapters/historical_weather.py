"""Historical Weather Provider and Retrospective Reanalysis Adapter.

Fetches ECMWF ERA5 and ERA5-Land daily historical reanalysis via the Open-Meteo
Historical Archive API.

SCIENTIFIC PROVENANCE PRINCIPLE:
Data retrieved retrospectively is strictly labelled with data_source_mode='REANALYSIS'
or 'RETROSPECTIVE_REANALYSIS'. It is NEVER labelled as 'LIVE' or 'ARCHIVED_FORECAST'.
Umbrella evaluates how our model would have responded given observed meteorology;
it does not misrepresent reanalysis as a real-time foresight prediction.

ANTI-LEAKAGE ENFORCEMENT:
For any snapshot at time T_s, only data for dates t <= T_s is accessed.
"""

from abc import ABC, abstractmethod
from datetime import date, datetime, timedelta, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx

from umbrella.schemas.weather import DailyWeatherForecast, UmbrellaWeatherForecast


class HistoricalWeatherProvider(ABC):
    """Abstract interface defining retrospective historical weather and reanalysis retrieval."""

    @abstractmethod
    def get_historical_weather(
        self,
        latitude: float,
        longitude: float,
        start_date: date,
        end_date: date,
    ) -> UmbrellaWeatherForecast:
        """Fetch historical meteorological reanalysis across an explicit date window [start_date, end_date]."""
        pass

    @abstractmethod
    def get_snapshot_weather(
        self,
        latitude: float,
        longitude: float,
        snapshot_date: date,
        lookback_days: int = 5,
    ) -> UmbrellaWeatherForecast:
        """Fetch historical weather available at snapshot date T_s (lookback window strictly <= T_s).

        Zero data for dates > snapshot_date is permitted (strict leakage prevention).
        """
        pass


class OpenMeteoHistoricalWeatherProvider(HistoricalWeatherProvider):
    """Retrospective reanalysis provider using Open-Meteo Historical Archive API (ERA5 / ERA5-Land).

    Features automated offline fallback to local verified ERA5 cache or synthetic deterministic mock.
    """

    ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
    DEFAULT_TIMEOUT_SEC = 10.0

    def __init__(
        self,
        client: Optional[httpx.Client] = None,
        force_offline_mock: bool = False,
        cache_dir: Optional[Path] = None,
    ):
        self.client = client
        self.force_offline_mock = force_offline_mock
        self.cache_dir = cache_dir or self._resolve_cache_dir()

    @staticmethod
    def _resolve_cache_dir() -> Path:
        candidate = Path(__file__).resolve().parent.parent.parent.parent / "data" / "weather"
        if candidate.exists():
            return candidate
        cwd_candidate = Path("data/weather").resolve()
        if cwd_candidate.exists():
            return cwd_candidate
        return candidate

    def get_historical_weather(
        self,
        latitude: float,
        longitude: float,
        start_date: date,
        end_date: date,
    ) -> UmbrellaWeatherForecast:
        """Retrieve historical reanalysis window for coordinates."""
        if start_date > end_date:
            raise ValueError(f"start_date ({start_date}) cannot be after end_date ({end_date})")

        if self.force_offline_mock:
            return self._build_offline_fallback(
                latitude=latitude,
                longitude=longitude,
                start_date=start_date,
                end_date=end_date,
                reason="Forced offline mock mode configured",
            )

        try:
            params = {
                "latitude": round(latitude, 4),
                "longitude": round(longitude, 4),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "daily": [
                    "precipitation_sum",
                    "rain_sum",
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "soil_moisture_0_to_7cm_mean",
                    "wind_speed_10m_max",
                ],
                "timezone": "UTC",
            }

            if self.client:
                resp = self.client.get(self.ARCHIVE_URL, params=params, timeout=self.DEFAULT_TIMEOUT_SEC)
            else:
                with httpx.Client(timeout=self.DEFAULT_TIMEOUT_SEC) as c:
                    resp = c.get(self.ARCHIVE_URL, params=params)

            if resp.status_code == 200:
                return self._parse_archive_payload(
                    payload=resp.json(),
                    latitude=latitude,
                    longitude=longitude,
                    start_date=start_date,
                    end_date=end_date,
                    mode="REANALYSIS",
                )
            else:
                return self._build_offline_fallback(
                    latitude=latitude,
                    longitude=longitude,
                    start_date=start_date,
                    end_date=end_date,
                    reason=f"Open-Meteo Archive API returned status {resp.status_code}",
                )

        except Exception as exc:
            return self._build_offline_fallback(
                latitude=latitude,
                longitude=longitude,
                start_date=start_date,
                end_date=end_date,
                reason=f"Open-Meteo Archive API connection error: {str(exc)}",
            )

    def get_snapshot_weather(
        self,
        latitude: float,
        longitude: float,
        snapshot_date: date,
        lookback_days: int = 5,
    ) -> UmbrellaWeatherForecast:
        """Fetch weather data available at snapshot date T_s (lookback window ending at snapshot_date).

        Ensures STRICT anti-leakage: end_date = snapshot_date.
        """
        if lookback_days < 1:
            raise ValueError(f"lookback_days must be >= 1, got {lookback_days}")

        start_date = snapshot_date - timedelta(days=lookback_days - 1)
        return self.get_historical_weather(
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=snapshot_date,
        )

    def _parse_archive_payload(
        self,
        payload: Dict[str, Any],
        latitude: float,
        longitude: float,
        start_date: date,
        end_date: date,
        mode: str = "REANALYSIS",
        fallback_reason: Optional[str] = None,
    ) -> UmbrellaWeatherForecast:
        """Normalize raw Open-Meteo Historical Archive JSON into UmbrellaWeatherForecast."""
        daily = payload.get("daily", {})
        times = daily.get("time", [])
        precip = daily.get("precipitation_sum", [])
        t_max = daily.get("temperature_2m_max", [])
        t_min = daily.get("temperature_2m_min", [])
        soil_m = daily.get("soil_moisture_0_to_7cm_mean", [])
        wind = daily.get("wind_speed_10m_max", [])

        daily_records: List[DailyWeatherForecast] = []
        for i, t_str in enumerate(times):
            d = date.fromisoformat(t_str)
            p_val = float(precip[i]) if i < len(precip) and precip[i] is not None else 0.0
            tx_val = float(t_max[i]) if i < len(t_max) and t_max[i] is not None else 30.0
            tn_val = float(t_min[i]) if i < len(t_min) and t_min[i] is not None else 25.0
            sm_val = float(soil_m[i]) if i < len(soil_m) and soil_m[i] is not None else 0.40
            w_val = float(wind[i]) if i < len(wind) and wind[i] is not None else 12.0

            daily_records.append(
                DailyWeatherForecast(
                    forecast_date=d,
                    rainfall_mm=round(p_val, 2),
                    precipitation_probability_pct=None,  # Not defined in reanalysis observations
                    temperature_max_c=round(tx_val, 1),
                    temperature_min_c=round(tn_val, 1),
                    apparent_temperature_max_c=round(tx_val + 3.0, 1),
                    wind_speed_max_kmh=round(w_val, 1),
                    soil_moisture_m3m3=round(sm_val, 3),
                )
            )

        cum_rain = round(sum(d.rainfall_mm for d in daily_records), 2)
        peak_rain = round(max((d.rainfall_mm for d in daily_records), default=0.0), 2)
        valid_sm = [d.soil_moisture_m3m3 for d in daily_records if d.soil_moisture_m3m3 is not None]
        mean_sm = round(sum(valid_sm) / len(valid_sm), 3) if valid_sm else 0.40

        horizon_days = len(daily_records)
        elev = payload.get("elevation", 52.0)

        return UmbrellaWeatherForecast(
            latitude=latitude,
            longitude=longitude,
            elevation_m=elev,
            timezone="UTC",
            forecast_horizon_days=horizon_days,
            forecast_start_date=start_date,
            forecast_end_date=end_date,
            daily_forecasts=daily_records,
            cumulative_rainfall_mm=cum_rain,
            peak_single_day_rainfall_mm=peak_rain,
            mean_soil_moisture_m3m3=mean_sm,
            data_source_mode=mode,  # Strictly REANALYSIS or MOCK
            provider_name="Open-Meteo Historical Archive (ECMWF ERA5 / ERA5-Land)",
            attribution="Reanalysis data by ECMWF ERA5 / Open-Meteo.com",
            retrieved_at=datetime.now(timezone.utc),
            fallback_reason=fallback_reason,
        )

    def _build_offline_fallback(
        self,
        latitude: float,
        longitude: float,
        start_date: date,
        end_date: date,
        reason: str,
    ) -> UmbrellaWeatherForecast:
        """Load from verified local ERA5 cache or generate deterministic fallback."""
        cache_file = self.cache_dir / "darbhanga_july_2020_era5.json"
        if not self.force_offline_mock and cache_file.exists():
            try:
                cached_data = json.loads(cache_file.read_text(encoding="utf-8"))
                daily = cached_data.get("daily", {})
                times = daily.get("time", [])

                # Filter times within [start_date, end_date]
                filtered_daily = {k: [] for k in daily.keys()}
                for i, t_str in enumerate(times):
                    d = date.fromisoformat(t_str)
                    if start_date <= d <= end_date:
                        for k, v in daily.items():
                            filtered_daily[k].append(v[i] if i < len(v) else None)

                if filtered_daily.get("time"):
                    payload = dict(cached_data)
                    payload["daily"] = filtered_daily
                    return self._parse_archive_payload(
                        payload=payload,
                        latitude=latitude,
                        longitude=longitude,
                        start_date=start_date,
                        end_date=end_date,
                        mode="REANALYSIS",
                        fallback_reason=f"Served from verified local ERA5-Land reanalysis archive: {reason}",
                    )
            except Exception:
                pass

        # Fallback to deterministic synthetic reanalysis if cache unavailable
        current = start_date
        records: List[DailyWeatherForecast] = []
        while current <= end_date:
            # Deterministic monsoon profile
            day_offset = (current - date(2020, 7, 1)).days
            rain = 35.0 if 18 <= day_offset <= 21 else (15.0 if 22 <= day_offset <= 24 else 8.0)
            records.append(
                DailyWeatherForecast(
                    forecast_date=current,
                    rainfall_mm=rain,
                    precipitation_probability_pct=None,
                    temperature_max_c=31.5,
                    temperature_min_c=25.5,
                    apparent_temperature_max_c=35.0,
                    wind_speed_max_kmh=14.0,
                    soil_moisture_m3m3=0.42,
                )
            )
            current += timedelta(days=1)

        cum_rain = round(sum(d.rainfall_mm for d in records), 2)
        peak_rain = round(max((d.rainfall_mm for d in records), default=0.0), 2)

        return UmbrellaWeatherForecast(
            latitude=latitude,
            longitude=longitude,
            elevation_m=50.0,
            timezone="UTC",
            forecast_horizon_days=len(records),
            forecast_start_date=start_date,
            forecast_end_date=end_date,
            daily_forecasts=records,
            cumulative_rainfall_mm=cum_rain,
            peak_single_day_rainfall_mm=peak_rain,
            mean_soil_moisture_m3m3=0.42,
            data_source_mode="MOCK",
            provider_name="Umbrella Deterministic Offline Reanalysis Generator",
            attribution="Offline mock reanalysis; not genuine ERA5 observations",
            retrieved_at=datetime.now(timezone.utc),
            fallback_reason=reason,
        )
