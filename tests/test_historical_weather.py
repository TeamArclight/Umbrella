"""Tests for Historical Weather Provider and ERA5 Retrospective Reanalysis."""

from datetime import date, timedelta
import pytest

from umbrella.adapters.historical_weather import (
    HistoricalWeatherProvider,
    OpenMeteoHistoricalWeatherProvider,
)


def test_historical_weather_interface():
    """Verify OpenMeteoHistoricalWeatherProvider implements HistoricalWeatherProvider."""
    provider = OpenMeteoHistoricalWeatherProvider()
    assert isinstance(provider, HistoricalWeatherProvider)


def test_get_historical_weather_date_validation():
    """Verify ValueError is raised when start_date > end_date."""
    provider = OpenMeteoHistoricalWeatherProvider()
    with pytest.raises(ValueError, match="cannot be after"):
        provider.get_historical_weather(
            latitude=26.037,
            longitude=85.912,
            start_date=date(2020, 7, 25),
            end_date=date(2020, 7, 20),
        )


def test_get_snapshot_weather_lookback_validation():
    """Verify lookback_days < 1 raises ValueError."""
    provider = OpenMeteoHistoricalWeatherProvider()
    with pytest.raises(ValueError, match="lookback_days must be >= 1"):
        provider.get_snapshot_weather(
            latitude=26.037,
            longitude=85.912,
            snapshot_date=date(2020, 7, 24),
            lookback_days=0,
        )


def test_get_snapshot_weather_anti_leakage_window():
    """Verify that snapshot weather strictly terminates at snapshot_date without future leakage."""
    provider = OpenMeteoHistoricalWeatherProvider()
    snap_date = date(2020, 7, 24)
    lookback = 5

    res = provider.get_snapshot_weather(
        latitude=26.037,
        longitude=85.912,
        snapshot_date=snap_date,
        lookback_days=lookback,
    )

    assert res.forecast_end_date == snap_date
    assert res.forecast_start_date == snap_date - timedelta(days=lookback - 1)
    assert len(res.daily_forecasts) == lookback

    for d in res.daily_forecasts:
        assert d.forecast_date <= snap_date, f"LEAKAGE: Record date {d.forecast_date} is after snapshot {snap_date}"
        assert d.forecast_date >= res.forecast_start_date


def test_reanalysis_data_source_mode_provenance():
    """Verify data_source_mode is explicitly marked as REANALYSIS (or MOCK in offline fallback).

    MUST NEVER be LIVE or ARCHIVED_FORECAST.
    """
    provider = OpenMeteoHistoricalWeatherProvider()
    res = provider.get_snapshot_weather(
        latitude=26.037,
        longitude=85.912,
        snapshot_date=date(2020, 7, 24),
        lookback_days=5,
    )

    assert res.data_source_mode in ["REANALYSIS", "RETROSPECTIVE_REANALYSIS", "MOCK"]
    assert res.data_source_mode != "LIVE"
    assert res.data_source_mode != "ARCHIVED_FORECAST"


def test_offline_forced_fallback_mock():
    """Verify deterministic mock behavior when offline mode is explicitly forced."""
    provider = OpenMeteoHistoricalWeatherProvider(force_offline_mock=True)
    res = provider.get_snapshot_weather(
        latitude=26.037,
        longitude=85.912,
        snapshot_date=date(2020, 7, 24),
        lookback_days=5,
    )

    assert res.data_source_mode == "MOCK"
    assert res.fallback_reason is not None
    assert "mock" in res.fallback_reason.lower() or "offline" in res.fallback_reason.lower()
    assert res.cumulative_rainfall_mm > 0.0
    assert res.peak_single_day_rainfall_mm > 0.0


def test_cached_era5_reanalysis_extraction():
    """Verify that cached ERA5-Land reanalysis correctly populates physical metrics."""
    provider = OpenMeteoHistoricalWeatherProvider()
    # Snapshot around July 20 peak downpour in Darbhanga
    res = provider.get_snapshot_weather(
        latitude=26.037,
        longitude=85.912,
        snapshot_date=date(2020, 7, 21),
        lookback_days=5,
    )

    assert res.cumulative_rainfall_mm > 100.0  # Heavy monsoon burst July 17-21
    assert res.peak_single_day_rainfall_mm >= 40.0
    assert res.mean_soil_moisture_m3m3 is not None
    assert res.mean_soil_moisture_m3m3 > 0.35  # Highly saturated topsoil
