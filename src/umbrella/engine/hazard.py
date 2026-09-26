"""Flood Hazard Model v1.0 Engine.

Computes a pure physical and environmental flood hazard score (0–100).

SCIENTIFIC / METHODOLOGICAL CONSTRAINTS:
1. Physical flood hazard is strictly independent of microfinance portfolio metrics.
   A village's hazard score does NOT increase because more loans exist there.
2. Every constituent component exposes raw value, normalized score, weight, and contribution.
3. The final hazard score is 100% reproducible by summing component contributions.
"""

from datetime import datetime, timezone
from typing import List, Literal, Optional

from umbrella.schemas.weather import UmbrellaWeatherForecast
from umbrella.schemas.climate import HistoricalClimateRecord
from umbrella.config.geography import PhysicalTerrainAttributes
from umbrella.schemas.hazard import HazardComponentBreakdown, FloodHazardEvaluation


class FloodHazardEngine:
    """Engine implementing Flood Hazard Model v1.0.

    Evaluates meteorology, hydrology, and terrain susceptibility.
    """

    MODEL_VERSION = "Flood Hazard Model v1.0"

    # Defensible weights summing to 1.00
    WEIGHT_ACCUMULATION = 0.35
    WEIGHT_INTENSITY = 0.25
    WEIGHT_SOIL_SATURATION = 0.15
    WEIGHT_CLIMATE_ANOMALY = 0.10
    WEIGHT_TERRAIN = 0.15

    def evaluate(
        self,
        village_id: str,
        village_name: str,
        district: str,
        state: str,
        latitude: float,
        longitude: float,
        forecast: UmbrellaWeatherForecast,
        climatology: HistoricalClimateRecord,
        terrain: PhysicalTerrainAttributes,
    ) -> FloodHazardEvaluation:
        """Execute Flood Hazard Model v1.0 across the 5 physical components."""
        # 1. Forecast Rainfall Accumulation Component (Weight = 0.35)
        cum_rain = forecast.cumulative_rainfall_mm
        raw_norm_accum = min(100.0, max(0.0, (cum_rain / max(climatology.p95_daily_rainfall_mm * 1.5, 10.0)) * 100.0))
        norm_accum = round(raw_norm_accum, 2)
        contrib_accum = round(norm_accum * self.WEIGHT_ACCUMULATION, 2)
        comp_accum = HazardComponentBreakdown(
            name="forecast_accumulation",
            raw_value=round(cum_rain, 2),
            raw_unit="mm",
            normalized_score=norm_accum,
            weight=self.WEIGHT_ACCUMULATION,
            contribution=contrib_accum,
            description=f"Cumulative rainfall forecast of {cum_rain:.1f} mm over {forecast.forecast_horizon_days}-day horizon",
            source=f"{forecast.provider_name} ({forecast.data_source_mode})",
            timestamp=forecast.retrieved_at,
        )

        # 2. Peak Rainfall Intensity Burst Component (Weight = 0.25)
        peak_rain = forecast.peak_single_day_rainfall_mm
        p95 = climatology.p95_daily_rainfall_mm
        p99 = climatology.p99_daily_rainfall_mm
        if peak_rain >= p99:
            raw_norm_intensity = 100.0
        elif peak_rain >= p95:
            raw_norm_intensity = 70.0 + ((peak_rain - p95) / max(p99 - p95, 1.0)) * 30.0
        else:
            raw_norm_intensity = (peak_rain / max(p95, 1.0)) * 70.0
        norm_intensity = round(min(100.0, max(0.0, raw_norm_intensity)), 2)
        contrib_intensity = round(norm_intensity * self.WEIGHT_INTENSITY, 2)
        comp_intensity = HazardComponentBreakdown(
            name="peak_rainfall_intensity",
            raw_value=round(peak_rain, 2),
            raw_unit="mm/day",
            normalized_score=norm_intensity,
            weight=self.WEIGHT_INTENSITY,
            contribution=contrib_intensity,
            description=f"Peak single-day downpour intensity of {peak_rain:.1f} mm/day against P95 threshold ({p95:.1f} mm)",
            source=f"{forecast.provider_name} ({forecast.data_source_mode})",
            timestamp=forecast.retrieved_at,
        )

        # 3. Antecedent Soil Saturation Component (Weight = 0.15)
        soil_moisture = forecast.mean_soil_moisture_m3m3 if forecast.mean_soil_moisture_m3m3 is not None else 0.30
        raw_norm_soil = min(100.0, max(0.0, ((soil_moisture - 0.15) / (0.45 - 0.15)) * 100.0))
        norm_soil = round(raw_norm_soil, 2)
        contrib_soil = round(norm_soil * self.WEIGHT_SOIL_SATURATION, 2)
        comp_soil = HazardComponentBreakdown(
            name="soil_saturation",
            raw_value=round(soil_moisture, 3),
            raw_unit="m3/m3",
            normalized_score=norm_soil,
            weight=self.WEIGHT_SOIL_SATURATION,
            contribution=contrib_soil,
            description=f"Volumetric topsoil moisture of {soil_moisture:.3f} m3/m3 indicating pre-storm saturation",
            source="Open-Meteo Soil Profile (0-10cm)",
            timestamp=forecast.retrieved_at,
        )

        # 4. Historical Climate Anomaly Component (Weight = 0.10)
        expected_baseline = max((forecast.forecast_horizon_days / 30.0) * climatology.historical_monthly_mean_rainfall_mm, 5.0)
        anomaly_ratio = cum_rain / expected_baseline
        raw_norm_anomaly = min(100.0, max(0.0, (anomaly_ratio / 3.0) * 100.0))
        norm_anomaly = round(raw_norm_anomaly, 2)
        contrib_anomaly = round(norm_anomaly * self.WEIGHT_CLIMATE_ANOMALY, 2)
        comp_anomaly = HazardComponentBreakdown(
            name="historical_climate_anomaly",
            raw_value=round(anomaly_ratio, 2),
            raw_unit="ratio",
            normalized_score=norm_anomaly,
            weight=self.WEIGHT_CLIMATE_ANOMALY,
            contribution=contrib_anomaly,
            description=f"Rainfall anomaly ratio of {anomaly_ratio:.2f}x relative to 30-year climatological normal ({expected_baseline:.1f} mm)",
            source=f"{climatology.dataset_name} ({climatology.data_source_mode})",
            timestamp=datetime.now(timezone.utc),
        )

        # 5. Terrain Drainage & Physical Susceptibility (Weight = 0.15)
        drainage_risk = (1.0 - terrain.drainage_capacity_score) * 60.0
        slope_risk = max(0.0, (3.0 - terrain.slope_gradient_pct) / 3.0) * 30.0
        river_risk = max(0.0, (5.0 - terrain.river_proximity_km) / 5.0) * 10.0
        raw_norm_terrain = min(100.0, max(0.0, drainage_risk + slope_risk + river_risk))
        norm_terrain = round(raw_norm_terrain, 2)
        contrib_terrain = round(norm_terrain * self.WEIGHT_TERRAIN, 2)
        comp_terrain = HazardComponentBreakdown(
            name="terrain_susceptibility",
            raw_value=round(terrain.drainage_capacity_score, 2),
            raw_unit="score_0_to_1",
            normalized_score=norm_terrain,
            weight=self.WEIGHT_TERRAIN,
            contribution=contrib_terrain,
            description=(
                f"Terrain drainage index {terrain.drainage_capacity_score:.2f}, "
                f"slope {terrain.slope_gradient_pct:.1f}%, river proximity {terrain.river_proximity_km:.1f} km"
            ),
            source="Pilot Village Terrain Profile (Local Geography Registry)",
            timestamp=datetime.now(timezone.utc),
        )

        components = [comp_accum, comp_intensity, comp_soil, comp_anomaly, comp_terrain]

        # Final Hazard Score is the exact sum of contributions
        total_score = round(sum(c.contribution for c in components), 1)
        final_hazard_score = min(100.0, max(0.0, total_score))

        # Severity classification
        if final_hazard_score >= 75.0 or peak_rain >= p99:
            hazard_level: Literal["LOW", "MODERATE", "HIGH", "SEVERE"] = "SEVERE"
        elif final_hazard_score >= 50.0:
            hazard_level = "HIGH"
        elif final_hazard_score >= 25.0:
            hazard_level = "MODERATE"
        else:
            hazard_level = "LOW"

        # Drivers synthesis
        drivers: List[str] = []
        if norm_accum >= 60.0:
            drivers.append(f"Significant cumulative rainfall: {cum_rain:.1f} mm forecast")
        if norm_intensity >= 65.0:
            drivers.append(f"Intense single-day burst: {peak_rain:.1f} mm/day")
        if norm_soil >= 65.0:
            drivers.append(f"High pre-existing soil saturation: {soil_moisture:.3f} m3/m3")
        if norm_anomaly >= 60.0:
            drivers.append(f"Severe climatological anomaly: {anomaly_ratio:.1f}x seasonal average")
        if norm_terrain >= 60.0:
            drivers.append(f"Poor natural drainage and low slope in {terrain.soil_texture}")

        narrative = (
            f"Physical flood hazard for {village_name} is evaluated at {final_hazard_score}/100 ({hazard_level}) "
            f"over a {forecast.forecast_horizon_days}-day horizon. "
            + ("; ".join(drivers) if drivers else "Environmental conditions within normal historical tolerances.")
        )

        # Provenance records
        provenance = [
            {
                "type": "WEATHER_FORECAST",
                "provider": forecast.provider_name,
                "data_source_mode": forecast.data_source_mode,
                "horizon_days": forecast.forecast_horizon_days,
                "variables": ["precipitation_sum", "rain_sum", "precipitation_probability_max", "soil_moisture_0_to_10cm_mean"],
                "coordinates": {"latitude": latitude, "longitude": longitude},
                "attribution": forecast.attribution,
                "retrieved_at": forecast.retrieved_at.isoformat(),
                "fallback_reason": forecast.fallback_reason,
            },
            {
                "type": "HISTORICAL_CLIMATOLOGY",
                "dataset": climatology.dataset_name,
                "data_source_mode": climatology.data_source_mode,
                "baseline_period": climatology.baseline_period,
                "spatial_resolution": climatology.spatial_resolution,
                "month": climatology.month,
                "monthly_mean_mm": climatology.historical_monthly_mean_rainfall_mm,
                "p95_daily_mm": climatology.p95_daily_rainfall_mm,
                "attribution": climatology.source_attribution,
            },
            {
                "type": "PHYSICAL_TERRAIN",
                "source": "Pilot Geography Registry",
                "elevation_m": terrain.elevation_m,
                "slope_pct": terrain.slope_gradient_pct,
                "drainage_score": terrain.drainage_capacity_score,
                "soil_texture": terrain.soil_texture,
            },
        ]

        return FloodHazardEvaluation(
            hazard="FLOOD",
            label="Flood Risk Early Warning",
            village_id=village_id,
            village_name=village_name,
            district=district,
            state=state,
            latitude=latitude,
            longitude=longitude,
            hazard_score=final_hazard_score,
            hazard_level=hazard_level,
            forecast_horizon_days=forecast.forecast_horizon_days,
            drivers=drivers,
            components=components,
            narrative=narrative,
            model_version=self.MODEL_VERSION,
            data_source_mode=forecast.data_source_mode,
            data_provenance=provenance,
        )
