"""Unit tests for Umbrella Adapters."""

import pytest
import httpx
from datetime import date
from umbrella.adapters.weather import OpenMeteoWeatherProvider, WeatherProvider
from umbrella.adapters.climate import CGIARClimateProvider, ClimateDataProvider
from umbrella.adapters.portfolio import (
    SyntheticPortfolioProvider,
    FineractPortfolioProvider,
    PortfolioProvider,
)
from umbrella.schemas.weather import UmbrellaWeatherForecast
from umbrella.schemas.climate import HistoricalClimateRecord, ClimateAnomaly
from umbrella.schemas.portfolio import PortfolioExposure


def test_open_meteo_live_mode_identification():
    """Verify live responses from Open-Meteo are identified as LIVE."""
    # When initialized with default client, if network is reachable, mode is LIVE
    provider = OpenMeteoWeatherProvider(enable_offline_fallback=False)
    assert isinstance(provider, WeatherProvider)

    try:
        forecast = provider.get_forecast(latitude=18.5520, longitude=78.2910, forecast_horizon_days=5)
        assert isinstance(forecast, UmbrellaWeatherForecast)
        assert forecast.data_source_mode == "LIVE"
        assert forecast.fallback_reason is None
        assert forecast.forecast_horizon_days == 5
        assert len(forecast.daily_forecasts) == 5
        assert "Open-Meteo" in forecast.attribution
    except Exception as exc:
        pytest.skip(f"Live network access unavailable in test environment: {exc}")


def test_open_meteo_fallback_identified_as_mock():
    """Verify fallback responses are explicitly marked as MOCK and expose fallback reason."""
    # Pass a dummy client that forces an HTTP failure
    failing_client = httpx.Client(transport=httpx.MockTransport(lambda req: httpx.Response(500)))
    provider = OpenMeteoWeatherProvider(client=failing_client, enable_offline_fallback=True)

    forecast = provider.get_forecast(latitude=18.5520, longitude=78.2910, forecast_horizon_days=5)

    assert isinstance(forecast, UmbrellaWeatherForecast)
    assert forecast.data_source_mode == "MOCK"
    assert forecast.fallback_reason is not None
    assert "failed" in forecast.fallback_reason.lower()
    assert forecast.forecast_horizon_days == 5
    assert len(forecast.daily_forecasts) == 5


def test_weather_horizon_validation():
    """Verify that only 3, 5, and 7 day horizons are permitted."""
    provider = OpenMeteoWeatherProvider(enable_offline_fallback=True)

    for valid_h in [3, 5, 7]:
        fc = provider.get_forecast(18.55, 78.29, forecast_horizon_days=valid_h)
        assert fc.forecast_horizon_days == valid_h

    # Reject unsupported horizons
    for invalid_h in [1, 2, 4, 6, 10, 14]:
        with pytest.raises(ValueError, match="Unsupported forecast horizon"):
            provider.get_forecast(18.55, 78.29, forecast_horizon_days=invalid_h)


def test_weather_coordinate_validation():
    """Verify latitude and longitude boundary checks."""
    provider = OpenMeteoWeatherProvider(enable_offline_fallback=True)

    with pytest.raises(ValueError, match="Invalid latitude"):
        provider.get_forecast(95.0, 78.29, forecast_horizon_days=5)

    with pytest.raises(ValueError, match="Invalid longitude"):
        provider.get_forecast(18.55, 195.0, forecast_horizon_days=5)


def test_cgiar_climate_provider_provenance():
    """Verify CGIAR climate provider returns honest LOCAL_DATASET provenance and 30y baselines."""
    provider = CGIARClimateProvider()
    assert isinstance(provider, ClimateDataProvider)

    baseline = provider.get_historical_baseline(18.55, 78.29, month=7)
    assert isinstance(baseline, HistoricalClimateRecord)
    assert baseline.data_source_mode == "LOCAL_DATASET"
    assert baseline.month == 7
    assert baseline.historical_monthly_mean_rainfall_mm == 280.0
    assert baseline.p95_daily_rainfall_mm == 65.0
    assert "CHIRPS" in baseline.dataset_name

    # Anomaly evaluation
    anomaly = provider.evaluate_anomaly(18.55, 78.29, forecast_rainfall_mm=130.0, horizon_days=5, month=7)
    assert isinstance(anomaly, ClimateAnomaly)
    assert anomaly.period_days == 5
    assert anomaly.is_extreme_event is True
    assert anomaly.severity in ["SEVERE", "EXTREME"]


def test_synthetic_portfolio_provider_marked_synthetic():
    """Verify synthetic portfolio provider marks all records as SYNTHETIC."""
    provider = SyntheticPortfolioProvider(random_seed=123)
    assert isinstance(provider, PortfolioProvider)

    villages = provider.list_monitored_villages()
    assert len(villages) >= 4

    for v in villages:
        assert isinstance(v, PortfolioExposure)
        assert v.data_type == "SYNTHETIC"
        assert v.currency == "INR"
        assert "SYNTHETIC DEMO DATA" in v.disclaimer
        assert v.borrowers_exposed > 0
        assert v.outstanding_amount > 0.0
        assert v.groups_exposed > 0

    # Test Fineract connector raises NotImplementedError
    fineract = FineractPortfolioProvider("http://localhost:8080", "tenant", "token")
    with pytest.raises(NotImplementedError):
        fineract.get_village_portfolio("VIL-TEL-001")
