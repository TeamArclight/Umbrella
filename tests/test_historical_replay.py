"""Tests for Historical Event Replay Engine, Anti-Leakage Enforcement, and Decoupling."""

from datetime import date
import pytest

from umbrella.engine.replay import HistoricalEventReplayEngine
from umbrella.adapters.portfolio import SyntheticPortfolioProvider
from umbrella.engine.exposure import PortfolioExposureEngine
from umbrella.schemas.replay import HistoricalReplayReport, HistoricalSnapshotEvaluation


def test_load_event_registry():
    """Verify loading of IND-BIH-2020-07 historical flood benchmark."""
    engine = HistoricalEventReplayEngine()
    event = engine.load_event("IND-BIH-2020-07")

    assert event["event_id"] == "IND-BIH-2020-07"
    assert event["district"] == "Darbhanga"
    assert event["state"] == "Bihar"
    assert event["peak_date"] == "2020-07-24"
    assert len(event["timeline_snapshots"]) >= 5

    cwc_gauges = event["hydrological_context"]["cwc_gauge_stations"]
    assert any(g["station_name"] == "Hayaghat" for g in cwc_gauges)
    hayaghat = next(g for g in cwc_gauges if g["station_name"] == "Hayaghat")
    assert hayaghat["peak_water_level_recorded_m"] == 50.82
    assert hayaghat["danger_level_m"] == 48.68
    assert hayaghat["water_level_above_danger_level_m"] == 2.14


def test_evaluate_snapshot_sum_of_components():
    """Verify that snapshot physical hazard score exactly matches the sum of constituent components."""
    engine = HistoricalEventReplayEngine()
    snap = engine.evaluate_snapshot(
        village_id="VIL-DAR-HAY",
        snapshot_date=date(2020, 7, 24),
        lookback_days=5,
        peak_date=date(2020, 7, 24),
    )

    assert isinstance(snap, HistoricalSnapshotEvaluation)
    assert snap.village_name == "Hayaghat"
    assert snap.offset_from_peak_days == 0
    assert snap.data_leakage_prevented is True

    hazard = snap.hazard
    components_sum = round(sum(c.contribution for c in hazard.components), 1)
    assert hazard.hazard_score == components_sum, (
        f"Hazard score {hazard.hazard_score} does not match component contribution sum {components_sum}"
    )


def test_strict_anti_leakage_enforcement():
    """Verify that earlier snapshots (e.g. T-5) strictly contain zero observations from later dates."""
    engine = HistoricalEventReplayEngine()
    t_minus_5 = date(2020, 7, 19)

    snap = engine.evaluate_snapshot(
        village_id="VIL-DAR-HAY",
        snapshot_date=t_minus_5,
        lookback_days=5,
        peak_date=date(2020, 7, 24),
    )

    assert snap.offset_from_peak_days == -5
    assert snap.weather.forecast_end_date == t_minus_5

    for d in snap.weather.daily_forecasts:
        assert d.forecast_date <= t_minus_5, (
            f"LEAKAGE DETECTED: Snapshot date {t_minus_5} contains weather record for {d.forecast_date}"
        )


def test_hazard_decoupling_with_portfolio_scaling():
    """CRITICAL TEST: Physical flood hazard MUST be identical whether portfolio is small or massive.

    Village A: small portfolio scale (0.1x)
    Village B: large portfolio scale (25.0x)
    Physical flood hazard score must remain exactly the same.
    """
    snap_date = date(2020, 7, 24)

    # 1. Engine with low synthetic portfolio
    small_portfolio_provider = SyntheticPortfolioProvider(
        portfolio_scale_overrides={"VIL-DAR-HAY": 0.05}  # Approx ₹1 Lakh
    )
    engine_small = HistoricalEventReplayEngine(
        portfolio_provider=small_portfolio_provider,
        exposure_engine=PortfolioExposureEngine(small_portfolio_provider),
    )
    snap_small = engine_small.evaluate_snapshot(
        village_id="VIL-DAR-HAY",
        snapshot_date=snap_date,
        lookback_days=5,
    )

    # 2. Engine with large synthetic portfolio
    large_portfolio_provider = SyntheticPortfolioProvider(
        portfolio_scale_overrides={"VIL-DAR-HAY": 40.0}  # Approx ₹80 Lakh
    )
    engine_large = HistoricalEventReplayEngine(
        portfolio_provider=large_portfolio_provider,
        exposure_engine=PortfolioExposureEngine(large_portfolio_provider),
    )
    snap_large = engine_large.evaluate_snapshot(
        village_id="VIL-DAR-HAY",
        snapshot_date=snap_date,
        lookback_days=5,
    )

    # Verify portfolio balances differ massively
    port_small = snap_small.exposure.outstanding_amount
    port_large = snap_large.exposure.outstanding_amount
    assert port_large > port_small * 100, f"Expected massive portfolio difference, got {port_small} vs {port_large}"

    # Verify physical flood hazard is 100% decoupled and IDENTICAL
    assert snap_small.hazard.hazard_score == snap_large.hazard.hazard_score, (
        f"Decoupling violation! Small portfolio hazard={snap_small.hazard.hazard_score} "
        f"vs large portfolio hazard={snap_large.hazard.hazard_score}"
    )
    assert snap_small.hazard.hazard_level == snap_large.hazard.hazard_level


def test_replay_village_event_multi_snapshot():
    """Verify complete multi-snapshot replay report for a village."""
    engine = HistoricalEventReplayEngine()
    report = engine.replay_village_event(
        village_id="VIL-DAR-HAY",
        event_id="IND-BIH-2020-07",
        lookback_days=5,
    )

    assert isinstance(report, HistoricalReplayReport)
    assert report.event_id == "IND-BIH-2020-07"
    assert report.village_name == "Hayaghat"
    assert len(report.snapshots) == 6
    assert report.peak_hazard_score > 0.0
    assert report.leakage_prevention_audit != ""
    assert report.decoupling_audit != ""


def test_replay_district_event_all_clusters():
    """Verify district replay across all 10 Darbhanga clusters."""
    engine = HistoricalEventReplayEngine()
    result = engine.replay_district_event(
        event_id="IND-BIH-2020-07",
        lookback_days=5,
    )

    assert result["district"] == "Darbhanga"
    assert result["state"] == "Bihar"
    assert result["monitored_clusters_count"] == 10
    assert len(result["clusters"]) == 10

    # Both Hayaghat (breach site on Bagmati) and Keoti (NH-527C submersion) reach SEVERE hazard
    hayaghat = next(c for c in result["clusters"] if c["village_id"] == "VIL-DAR-HAY")
    keoti = next(c for c in result["clusters"] if c["village_id"] == "VIL-DAR-KEO")
    assert hayaghat["hazard_score"] >= 75.0
    assert hayaghat["hazard_level"] == "SEVERE"
    assert keoti["hazard_score"] >= 75.0
    assert keoti["hazard_level"] == "SEVERE"

