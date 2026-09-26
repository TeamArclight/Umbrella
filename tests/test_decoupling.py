"""Verification tests proving strict architectural decoupling:
Physical Climate Hazard != Microfinance Portfolio Exposure.
"""

import pytest
from datetime import date, timedelta
from umbrella.schemas.weather import DailyWeatherForecast, UmbrellaWeatherForecast
from umbrella.schemas.climate import HistoricalClimateRecord
from umbrella.config.geography import PhysicalTerrainAttributes
from umbrella.engine.hazard import FloodHazardEngine
from umbrella.adapters.portfolio import SyntheticPortfolioProvider
from umbrella.engine.exposure import PortfolioExposureEngine
from umbrella.engine.impact import PortfolioImpactEngine


def test_hazard_identical_across_different_portfolio_sizes():
    """Requirement 1: Identical environmental inputs produce the exact same flood hazard
    regardless of whether the MFI has ₹2 Lakh or ₹80 Lakh outstanding.
    """
    engine = FloodHazardEngine()

    today = date.today()
    forecast = UmbrellaWeatherForecast(
        latitude=18.5520,
        longitude=78.2910,
        forecast_horizon_days=5,
        forecast_start_date=today,
        forecast_end_date=today + timedelta(days=4),
        daily_forecasts=[
            DailyWeatherForecast(
                forecast_date=today + timedelta(days=i),
                rainfall_mm=35.0,
                temperature_max_c=30.0,
                temperature_min_c=23.0,
                soil_moisture_m3m3=0.38,
            )
            for i in range(5)
        ],
        cumulative_rainfall_mm=175.0,
        peak_single_day_rainfall_mm=35.0,
        mean_soil_moisture_m3m3=0.38,
        data_source_mode="MOCK",
    )

    climatology = HistoricalClimateRecord(
        latitude=18.5520,
        longitude=78.2910,
        month=7,
        historical_monthly_mean_rainfall_mm=280.0,
        p95_daily_rainfall_mm=65.0,
        p99_daily_rainfall_mm=110.0,
        data_source_mode="LOCAL_DATASET",
    )

    terrain = PhysicalTerrainAttributes(
        elevation_m=380.0,
        slope_gradient_pct=1.2,
        drainage_capacity_score=0.35,
        soil_texture="Black cotton soil",
        river_proximity_km=3.5,
        dominant_crop="Paddy (Rice)",
        crop_flood_susceptibility=0.75,
    )

    # Village A: Portfolio has ~₹1.4 Lakh (scale multiplier 0.15)
    # Village B: Portfolio has ~₹57 Lakh (scale multiplier 6.0)
    provider_a = SyntheticPortfolioProvider(portfolio_scale_overrides={"VIL-TEL-001": 0.15})
    provider_b = SyntheticPortfolioProvider(portfolio_scale_overrides={"VIL-TEL-001": 6.0})

    exposure_engine_a = PortfolioExposureEngine(provider_a)
    exposure_engine_b = PortfolioExposureEngine(provider_b)

    exposure_a = exposure_engine_a.get_exposure("VIL-TEL-001")
    exposure_b = exposure_engine_b.get_exposure("VIL-TEL-001")

    # Assert that portfolio sizes differ radically
    assert exposure_a.outstanding_amount < 400_000.0  # ~ ₹1.4 Lakh
    assert exposure_b.outstanding_amount > 5_000_000.0  # > ₹50 Lakh
    assert exposure_b.outstanding_amount > exposure_a.outstanding_amount * 10

    # Calculate physical hazard for Village A and Village B
    hazard_a = engine.evaluate(
        village_id="VIL-TEL-001",
        village_name="Sirikonda",
        district="Nizamabad",
        state="Telangana",
        latitude=18.5520,
        longitude=78.2910,
        forecast=forecast,
        climatology=climatology,
        terrain=terrain,
    )

    hazard_b = engine.evaluate(
        village_id="VIL-TEL-001",
        village_name="Sirikonda",
        district="Nizamabad",
        state="Telangana",
        latitude=18.5520,
        longitude=78.2910,
        forecast=forecast,
        climatology=climatology,
        terrain=terrain,
    )

    # Physical flood hazard must be 100% IDENTICAL
    assert hazard_a.hazard_score == hazard_b.hazard_score
    assert hazard_a.hazard_level == hazard_b.hazard_level
    assert len(hazard_a.components) == len(hazard_b.components)
    for c_a, c_b in zip(hazard_a.components, hazard_b.components):
        assert c_a.contribution == c_b.contribution


def test_different_portfolio_produces_different_priority_impact():
    """Requirement 2: Different portfolio balances produce different portfolio exposure and
    operational priority impact, while underlying physical hazard remains unchanged.
    """
    engine = FloodHazardEngine()
    impact_engine = PortfolioImpactEngine()

    today = date.today()
    forecast = UmbrellaWeatherForecast(
        latitude=18.5520,
        longitude=78.2910,
        forecast_horizon_days=5,
        forecast_start_date=today,
        forecast_end_date=today + timedelta(days=4),
        daily_forecasts=[
            DailyWeatherForecast(
                forecast_date=today + timedelta(days=i),
                rainfall_mm=50.0,
                temperature_max_c=29.0,
                temperature_min_c=22.0,
                soil_moisture_m3m3=0.40,
            )
            for i in range(5)
        ],
        cumulative_rainfall_mm=250.0,
        peak_single_day_rainfall_mm=50.0,
        mean_soil_moisture_m3m3=0.40,
        data_source_mode="MOCK",
    )

    climatology = HistoricalClimateRecord(
        latitude=18.5520,
        longitude=78.2910,
        month=7,
        historical_monthly_mean_rainfall_mm=280.0,
        p95_daily_rainfall_mm=65.0,
        p99_daily_rainfall_mm=110.0,
        data_source_mode="LOCAL_DATASET",
    )

    terrain = PhysicalTerrainAttributes(
        elevation_m=380.0,
        slope_gradient_pct=1.2,
        drainage_capacity_score=0.35,
        soil_texture="Black cotton soil",
        river_proximity_km=3.5,
        dominant_crop="Paddy (Rice)",
        crop_flood_susceptibility=0.75,
    )

    hazard = engine.evaluate(
        village_id="VIL-TEL-001",
        village_name="Sirikonda",
        district="Nizamabad",
        state="Telangana",
        latitude=18.5520,
        longitude=78.2910,
        forecast=forecast,
        climatology=climatology,
        terrain=terrain,
    )

    provider_small = SyntheticPortfolioProvider(portfolio_scale_overrides={"VIL-TEL-001": 0.10})
    provider_large = SyntheticPortfolioProvider(portfolio_scale_overrides={"VIL-TEL-001": 4.50})

    exposure_small = provider_small.get_village_portfolio("VIL-TEL-001")
    exposure_large = provider_large.get_village_portfolio("VIL-TEL-001")

    impact_small = impact_engine.evaluate_priority(hazard, exposure_small)
    impact_large = impact_engine.evaluate_priority(hazard, exposure_large)

    # 1. Physical hazard score is identical and preserved in both impact objects
    assert impact_small.hazard_score == impact_large.hazard_score
    assert impact_small.hazard_score == hazard.hazard_score

    # 2. Raw exposure values are preserved
    assert impact_small.portfolio_exposure.outstanding_amount == exposure_small.outstanding_amount
    assert impact_large.portfolio_exposure.outstanding_amount == exposure_large.outstanding_amount

    # 3. Operational priority differs based on exposed capital
    assert impact_large.priority_score > impact_small.priority_score
    assert impact_large.calculation_details["raw_outstanding_inr"] > impact_small.calculation_details["raw_outstanding_inr"]
