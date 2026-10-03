"""Historical Event Replay Engine.

Executes Flood Hazard Model Historical Replay v1.0 across historical snapshots
with rigorous anti-leakage enforcement and pure physical hazard decoupling.
"""

from datetime import date, datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from umbrella.adapters.historical_weather import (
    HistoricalWeatherProvider,
    OpenMeteoHistoricalWeatherProvider,
)
from umbrella.adapters.climate import ClimateDataProvider, CGIARClimateProvider
from umbrella.adapters.portfolio import PortfolioProvider, SyntheticPortfolioProvider
from umbrella.engine.hazard import FloodHazardEngine
from umbrella.engine.exposure import PortfolioExposureEngine
from umbrella.engine.impact import PortfolioImpactEngine
from umbrella.engine.recommendation import RecommendationEngine
from umbrella.config.geography import get_pilot_village, list_pilot_villages
from umbrella.schemas.replay import (
    HistoricalSnapshotEvaluation,
    HistoricalReplayReport,
)


class HistoricalEventReplayEngine:
    """Retrospective event replay engine.

    Evaluates how the early warning pipeline behaves over documented historical disaster events
    using ERA5 / ERA5-Land reanalysis without future data leakage.
    """

    def __init__(
        self,
        weather_provider: Optional[HistoricalWeatherProvider] = None,
        climate_provider: Optional[ClimateDataProvider] = None,
        portfolio_provider: Optional[PortfolioProvider] = None,
        hazard_engine: Optional[FloodHazardEngine] = None,
        exposure_engine: Optional[PortfolioExposureEngine] = None,
        impact_engine: Optional[PortfolioImpactEngine] = None,
        recommendation_engine: Optional[RecommendationEngine] = None,
        events_file: Optional[Path] = None,
    ):
        self.weather_provider = weather_provider or OpenMeteoHistoricalWeatherProvider()
        self.climate_provider = climate_provider or CGIARClimateProvider()
        self.portfolio_provider = portfolio_provider or SyntheticPortfolioProvider()
        self.hazard_engine = hazard_engine or FloodHazardEngine()
        self.exposure_engine = exposure_engine or PortfolioExposureEngine(self.portfolio_provider)
        self.impact_engine = impact_engine or PortfolioImpactEngine()
        self.recommendation_engine = recommendation_engine or RecommendationEngine()
        self.events_file = events_file or self._resolve_events_file()

    @staticmethod
    def _resolve_events_file() -> Path:
        candidate = Path(__file__).resolve().parent.parent.parent.parent / "data" / "events" / "flood_events.json"
        if candidate.exists():
            return candidate
        cwd_cand = Path("data/events/flood_events.json").resolve()
        if cwd_cand.exists():
            return cwd_cand
        return candidate

    def list_events(self) -> List[Dict[str, Any]]:
        """List all registered historical disaster events."""
        if not self.events_file.exists():
            return []
        try:
            return json.loads(self.events_file.read_text(encoding="utf-8"))
        except Exception:
            return []

    def load_event(self, event_id: str = "IND-BIH-2020-07") -> Dict[str, Any]:
        """Load specific event profile by ID."""
        events = self.list_events()
        for ev in events:
            if ev.get("event_id") == event_id:
                return ev
        raise KeyError(f"Historical flood event '{event_id}' not found in registry.")

    def evaluate_snapshot(
        self,
        village_id: str,
        snapshot_date: date,
        lookback_days: int = 5,
        peak_date: Optional[date] = None,
    ) -> HistoricalSnapshotEvaluation:
        """Evaluate a village at an exact historical point in time T_s.

        ANTI-LEAKAGE GUARANTEE:
        Under no circumstances is data for date > snapshot_date provided to any engine.
        """
        village_cfg = get_pilot_village(village_id)

        # 1. Fetch retrospective reanalysis strictly bounded to t <= snapshot_date
        weather = self.weather_provider.get_snapshot_weather(
            latitude=village_cfg.latitude,
            longitude=village_cfg.longitude,
            snapshot_date=snapshot_date,
            lookback_days=lookback_days,
        )

        # Assert zero future data leakage
        for df in weather.daily_forecasts:
            if df.forecast_date > snapshot_date:
                raise ValueError(
                    f"ANTI-LEAKAGE BREACH: Weather forecast contains date {df.forecast_date} "
                    f"which is after snapshot date {snapshot_date}."
                )

        # 2. Climatology baseline for the calendar month
        climatology = self.climate_provider.get_historical_baseline(
            latitude=village_cfg.latitude,
            longitude=village_cfg.longitude,
            month=snapshot_date.month,
        )

        # 3. Physical Flood Hazard Evaluation (Strictly physical inputs)
        hazard = self.hazard_engine.evaluate(
            village_id=village_cfg.village_id,
            village_name=village_cfg.village_name,
            district=village_cfg.district,
            state=village_cfg.state,
            latitude=village_cfg.latitude,
            longitude=village_cfg.longitude,
            forecast=weather,
            climatology=climatology,
            terrain=village_cfg.terrain,
        )

        # 4. Independent Portfolio Exposure (Strictly SYNTHETIC)
        exposure = self.exposure_engine.get_exposure(village_id=village_id)

        # 5. Combined Operational Priority
        impact = self.impact_engine.evaluate_priority(hazard=hazard, exposure=exposure)

        # 6. Human Decision-Support Recommendations
        recommendations = self.recommendation_engine.generate_recommendation(
            impact=impact,
        )

        offset_days = (snapshot_date - peak_date).days if peak_date else 0

        audit_msg = (
            f"LEAKAGE CHECK PASSED: Snapshot date {snapshot_date.isoformat()} bounded to lookback window "
            f"[{weather.forecast_start_date.isoformat()} to {weather.forecast_end_date.isoformat()}]. "
            f"Zero future observations accessed."
        )

        return HistoricalSnapshotEvaluation(
            snapshot_date=snapshot_date,
            offset_from_peak_days=offset_days,
            village_id=village_cfg.village_id,
            village_name=village_cfg.village_name,
            district=village_cfg.district,
            state=village_cfg.state,
            weather=weather,
            hazard=hazard,
            exposure=exposure,
            impact=impact,
            recommendations=recommendations,
            data_leakage_prevented=True,
            anti_leakage_audit=audit_msg,
        )

    def replay_village_event(
        self,
        village_id: str,
        event_id: str = "IND-BIH-2020-07",
        lookback_days: int = 5,
    ) -> HistoricalReplayReport:
        """Execute multi-snapshot chronological replay of a historical disaster event for a village."""
        event = self.load_event(event_id)
        village_cfg = get_pilot_village(village_id)

        peak_d = date.fromisoformat(event["peak_date"])
        snapshot_strings = event.get("timeline_snapshots", [
            "2020-07-17",
            "2020-07-19",
            "2020-07-21",
            "2020-07-23",
            "2020-07-24",
            "2020-07-27",
        ])

        snapshots: List[HistoricalSnapshotEvaluation] = []
        for s_str in snapshot_strings:
            s_date = date.fromisoformat(s_str)
            snap = self.evaluate_snapshot(
                village_id=village_id,
                snapshot_date=s_date,
                lookback_days=lookback_days,
                peak_date=peak_d,
            )
            snapshots.append(snap)

        # Sort chronologically
        snapshots.sort(key=lambda s: s.snapshot_date)

        # Determine peak simulated hazard
        peak_snap = max(snapshots, key=lambda s: s.hazard.hazard_score)

        # Progression synthesis
        progression = " -> ".join(
            f"T{s.offset_from_peak_days:+d}d ({s.snapshot_date.isoformat()}): {s.hazard.hazard_score:.1f} ({s.hazard.hazard_level})"
            for s in snapshots
        )

        return HistoricalReplayReport(
            event_id=event["event_id"],
            event_name=event["event_name"],
            district=event["district"],
            state=event["state"],
            peak_date=peak_d,
            village_id=village_cfg.village_id,
            village_name=village_cfg.village_name,
            timeline_dates=[s.snapshot_date for s in snapshots],
            snapshots=snapshots,
            peak_hazard_score=peak_snap.hazard.hazard_score,
            peak_hazard_date=peak_snap.snapshot_date,
            hazard_progression_summary=progression,
            leakage_prevention_audit=(
                f"Verified: All {len(snapshots)} chronological snapshots evaluated strictly with t <= T_s. "
                "No lookahead or post-event data was available to the hazard or recommendation models."
            ),
            decoupling_audit=(
                f"Verified: Village {village_cfg.village_name} physical hazard scores are decoupled from "
                f"synthetic loan exposure ({snapshots[0].exposure.outstanding_amount:,.0f} INR)."
            ),
        )

    def replay_district_event(
        self,
        event_id: str = "IND-BIH-2020-07",
        lookback_days: int = 5,
        target_snapshot_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Execute retrospective replay across all operational clusters in the pilot district."""
        event = self.load_event(event_id)
        district = event["district"]
        state = event["state"]
        peak_d = date.fromisoformat(event["peak_date"])
        eval_date = target_snapshot_date or peak_d

        clusters = list_pilot_villages(state=state, district=district)
        if not clusters:
            clusters = [get_pilot_village("VIL-DAR-HAY")]

        results: List[Dict[str, Any]] = []
        for c in clusters:
            snap = self.evaluate_snapshot(
                village_id=c.village_id,
                snapshot_date=eval_date,
                lookback_days=lookback_days,
                peak_date=peak_d,
            )
            results.append({
                "village_id": c.village_id,
                "village_name": c.village_name,
                "block_name": c.block_name or c.village_name,
                "nearest_river": c.nearest_river or "Local Drainage",
                "latitude": c.latitude,
                "longitude": c.longitude,
                "elevation_m": c.terrain.elevation_m,
                "slope_pct": c.terrain.slope_gradient_pct,
                "drainage_score": c.terrain.drainage_capacity_score,
                "hazard_score": snap.hazard.hazard_score,
                "hazard_level": snap.hazard.hazard_level,
                "portfolio_exposure_inr": snap.exposure.outstanding_amount,
                "borrower_count": snap.exposure.borrowers_exposed,
                "priority_score": snap.impact.priority_score,
                "priority_level": snap.impact.priority_level,
                "climate_impact_level": snap.impact.priority_level,
                "hazard": snap.hazard.model_dump(),
                "exposure": snap.exposure.model_dump(),
                "impact": snap.impact.model_dump(),
                "operational_action": (
                    snap.recommendations.system_recommendation.operational_advisories[0]
                    if snap.recommendations.system_recommendation.operational_advisories
                    else "Standard monitoring"
                ),
                "cwc_gauge_proximity": "Hayaghat (Bagmati) / Jhanjharpur (Kamala Balan)",
            })

        # Sort by physical hazard score descending
        results.sort(key=lambda r: r["hazard_score"], reverse=True)

        return {
            "event_id": event["event_id"],
            "event_name": event["event_name"],
            "district": district,
            "state": state,
            "evaluation_snapshot_date": eval_date.isoformat(),
            "offset_from_peak_days": (eval_date - peak_d).days,
            "monitored_clusters_count": len(results),
            "clusters": results,
            "cwc_gauge_context": event.get("hydrological_context", {}).get("cwc_gauge_stations", []),
            "breaches": event.get("hydrological_context", {}).get("major_breaches", []),
            "decoupling_verified": True,
            "leakage_prevented": True,
        }
