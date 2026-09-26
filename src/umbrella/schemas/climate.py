"""Umbrella Climate & Historical Baseline Schemas.

Normalized schemas for climatological indicators, historical percentiles, and anomalies.
Explicitly records provenance and data source mode.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class HistoricalClimateRecord(BaseModel):
    """Historical baseline climate statistics for a specific coordinate and calendar month."""
    latitude: float
    longitude: float
    month: int = Field(..., ge=1, le=12, description="Calendar month 1-12")
    historical_monthly_mean_rainfall_mm: float = Field(..., ge=0.0, description="30-year average monthly precipitation in mm")
    p95_daily_rainfall_mm: float = Field(..., ge=0.0, description="95th percentile historical daily rainfall threshold in mm")
    p99_daily_rainfall_mm: float = Field(..., ge=0.0, description="99th percentile historical extreme daily rainfall threshold in mm")
    baseline_dry_spell_days: Optional[float] = Field(None, ge=0.0)

    # Provenance tracking
    data_source_mode: Literal["LOCAL_DATASET", "ADAPTED", "LIVE", "MOCK"] = Field(
        "LOCAL_DATASET",
        description="Data modality (LOCAL_DATASET for pre-extracted calibrated baselines, ADAPTED for formulas)",
    )
    dataset_name: str = "CHIRPS v2.0 / AgERA5 Climatology"
    spatial_resolution: str = "0.05 deg (~5.5 km)"
    baseline_period: str = "1991-2020 (30-year climatological normal)"
    source_attribution: str = "Funk et al., 2015 (CHIRPS) / CGIAR Climate Data Hub methodology"


class ClimateAnomaly(BaseModel):
    """Derived deviation between forecast/observed rainfall and historical climatology."""
    latitude: float
    longitude: float
    period_days: int = Field(..., description="Duration of anomaly evaluation (e.g. 3, 5, or 7 days)")
    forecast_rainfall_sum_mm: float = Field(..., ge=0.0)
    expected_baseline_rainfall_mm: float = Field(..., ge=0.0)
    anomaly_delta_mm: float = Field(..., description="Forecast rainfall minus expected baseline in mm")
    anomaly_ratio: float = Field(..., ge=0.0, description="Ratio of forecast rainfall to expected baseline")
    is_extreme_event: bool = Field(False, description="True if forecast exceeds 95th historical percentile threshold")
    severity: str = Field("NORMAL", description="NORMAL, ELEVATED, SEVERE, or EXTREME")
