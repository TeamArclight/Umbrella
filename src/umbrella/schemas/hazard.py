"""Umbrella Flood Hazard Schemas.

Represents physical and environmental flood hazard strictly.
MUST NOT contain portfolio metrics, loan balances, or borrower counts.

SCIENTIFIC PRINCIPLE:
A village's physical flood hazard is entirely governed by meteorology, hydrology,
and terrain vulnerability. It does NOT increase simply because a lender has more loans there.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class HazardComponentBreakdown(BaseModel):
    """Granular component of the Flood Hazard Model v1.

    Enables complete reproducibility: final hazard_score = sum(components.contribution).
    """
    name: str = Field(..., description="Component identifier (e.g. forecast_accumulation, peak_intensity)")
    raw_value: float = Field(..., description="Raw observed or forecast metric value")
    raw_unit: str = Field(..., description="Unit of measurement (e.g. mm, %, m3/m3)")
    normalized_score: float = Field(..., ge=0.0, le=100.0, description="Normalized severity score from 0 to 100")
    weight: float = Field(..., ge=0.0, le=1.0, description="Weight assigned to this component in Model v1")
    contribution: float = Field(..., ge=0.0, le=100.0, description="Score contribution = normalized_score * weight")
    description: str = Field(..., description="Human-readable explanation of the physical rationale")
    source: str = Field(..., description="Data provider or calculation source")
    timestamp: Optional[datetime] = None


class FloodHazardEvaluation(BaseModel):
    """Pure physical environmental flood hazard evaluation for a village geography."""
    hazard: Literal["FLOOD"] = "FLOOD"
    label: str = Field("Flood Risk Early Warning", description="Scientific product descriptor")
    village_id: str
    village_name: str
    district: str
    state: str
    latitude: float
    longitude: float

    # Core Hazard Metrics
    hazard_score: float = Field(..., ge=0.0, le=100.0, description="Composite physical flood hazard score (0 to 100)")
    hazard_level: Literal["LOW", "MODERATE", "HIGH", "SEVERE"]
    forecast_horizon_days: int = Field(..., description="Explicit forecast horizon window (3, 5, or 7 days)")

    # Explainability & Reproducibility
    drivers: List[str] = Field(default_factory=list, description="Primary physical drivers of the hazard score")
    components: List[HazardComponentBreakdown] = Field(
        default_factory=list, description="Constituent components whose contributions sum to hazard_score"
    )
    narrative: str = Field(..., description="Scientific synthesis of the flood threat")

    # Metadata & Data Provenance
    model_version: str = Field("Flood Hazard Model v1.0", description="Transparent model version")
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data_source_mode: Literal["LIVE", "CACHED", "MOCK", "SYNTHETIC", "REANALYSIS", "RETROSPECTIVE_REANALYSIS"] = Field(
        ..., description="LIVE for genuine API data, REANALYSIS for retrospective ERA5 data, MOCK if fallback was triggered"
    )
    data_provenance: List[Dict[str, Any]] = Field(
        default_factory=list, description="Provenance tracking for all upstream datasets"
    )
    scientific_disclaimer: str = (
        "Short-Range Flood Exposure Risk: Evaluates meteorological accumulation, rainfall burst intensity, "
        "soil saturation, and terrain drainage. This is not a 2D hydrodynamic simulation or borrower default prediction."
    )
