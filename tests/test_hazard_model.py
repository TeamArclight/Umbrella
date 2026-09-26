"""Unit tests for Flood Hazard Model v1.0."""

import pytest
from datetime import date, timedelta
from umbrella.schemas.weather import DailyWeatherForecast, UmbrellaWeatherForecast
from umbrella.schemas.climate import HistoricalClimateRecord
from umbrella.config.geography import PhysicalTerrainAttributes
from umbrella.engine.hazard import FloodHazardEngine


@pytest.fixture
def sample_climatology():
    return HistoricalClimateRecord(
        latitude=18.55,
        longitude=78.29,
        month=7,
        historical_monthly_mean_rainfall_mm=280.0,
        p95_daily_rainfall_mm=65.0,
        p99_daily_rainfall_mm=110.0,
        data_source_mode="LOCAL_DATASET",
        dataset_name="CHIRPS v2.0",
    )


@pytest.fixture
def sample_terrain():
    return PhysicalTerrainAttributes(
        elevation_m=260.0,
        slope_gradient_pct=1.5,
        drainage_capacity_score=0.35,
        soil_texture="Clay loam",
        river_proximity_km=3.0,
        dominant_crop="Paddy (Rice)",
        crop_flood_susceptibility=0.75,
    )


def test_hazard_score_reproducibility(sample_climatology, sample_terrain):
    """Verify that hazard_score strictly equals the sum of component contributions."""
    engine = FloodHazardEngine()

    today = date.today()
    forecast = UmbrellaWeatherForecast(
        latitude=18.55,
        longitude=78.29,
        forecast_horizon_days=5,
        forecast_start_date=today,
        forecast_end_date=today + timedelta(days=4),
        daily_forecasts=[
            DailyWeatherForecast(
                forecast_date=today + timedelta(days=i),
                rainfall_mm=float(15 * i),
                temperature_max_c=30.0,
                temperature_min_c=23.0,
                soil_moisture_m3m3=0.35,
            )
            for i in range(5)
        ],
        cumulative_rainfall_mm=150.0,
        peak_single_day_rainfall_mm=60.0,
        mean_soil_moisture_m3m3=0.35,
        data_source_mode="MOCK",
    )

    eval_result = engine.evaluate(
        village_id="VIL-TEL-001",
        village_name="Sirikonda",
        district="Nizamabad",
        state="Telangana",
        latitude=18.55,
        longitude=78.29,
        forecast=forecast,
        climatology=sample_climatology,
        terrain=sample_terrain,
    )

    # 1. Total score must equal sum of component contributions within rounding
    sum_contributions = round(sum(c.contribution for c in eval_result.components), 1)
    assert eval_result.hazard_score == sum_contributions

    # 2. Check all 5 components are present with valid weights summing to 1.00
    assert len(eval_result.components) == 5
    total_weights = round(sum(c.weight for c in eval_result.components), 2)
    assert total_weights == 1.00

    for c in eval_result.components:
        assert c.name in [
            "forecast_accumulation",
            "peak_rainfall_intensity",
            "soil_saturation",
            "historical_climate_anomaly",
            "terrain_susceptibility",
        ]
        assert 0.0 <= c.normalized_score <= 100.0
        assert round(c.normalized_score * c.weight, 2) == c.contribution
        assert c.source is not None


def test_hazard_severity_thresholds(sample_climatology, sample_terrain):
    """Verify that hazard severity thresholds behave correctly across dry and deluge conditions."""
    engine = FloodHazardEngine()
    today = date.today()

    # Dry scenario
    dry_forecast = UmbrellaWeatherForecast(
        latitude=18.55,
        longitude=78.29,
        forecast_horizon_days=5,
        forecast_start_date=today,
        forecast_end_date=today + timedelta(days=4),
        daily_forecasts=[
            DailyWeatherForecast(
                forecast_date=today + timedelta(days=i),
                rainfall_mm=0.5,
                temperature_max_c=34.0,
                temperature_min_c=25.0,
                soil_moisture_m3m3=0.18,
            )
            for i in range(5)
        ],
        cumulative_rainfall_mm=2.5,
        peak_single_day_rainfall_mm=0.5,
        mean_soil_moisture_m3m3=0.18,
        data_source_mode="MOCK",
    )
    dry_eval = engine.evaluate("VIL-01", "DryVillage", "Dist", "State", 18.55, 78.29, dry_forecast, sample_climatology, sample_terrain)
    assert dry_eval.hazard_level == "LOW"
    assert dry_eval.hazard_score < 25.0

    # Severe deluge scenario (P99 single day burst of 120 mm)
    deluge_forecast = UmbrellaWeatherForecast(
        latitude=18.55,
        longitude=78.29,
        forecast_horizon_days=5,
        forecast_start_date=today,
        forecast_end_date=today + timedelta(days=4),
        daily_forecasts=[
            DailyWeatherForecast(
                forecast_date=today + timedelta(days=i),
                rainfall_mm=120.0 if i == 1 else 30.0,
                temperature_max_c=26.0,
                temperature_min_c=22.0,
                soil_moisture_m3m3=0.44,
            )
            for i in range(5)
        ],
        cumulative_rainfall_mm=240.0,
        peak_single_day_rainfall_mm=120.0,  # Exceeds P99 (110 mm)
        mean_soil_moisture_m3m3=0.44,
        data_source_mode="MOCK",
    )
    deluge_eval = engine.evaluate("VIL-01", "DelugeVillage", "Dist", "State", 18.55, 78.29, deluge_forecast, sample_climatology, sample_terrain)
    assert deluge_eval.hazard_level == "SEVERE"
    assert deluge_eval.hazard_score >= 75.0
    assert any("burst" in d.lower() or "intensity" in d.lower() for d in deluge_eval.drivers)
