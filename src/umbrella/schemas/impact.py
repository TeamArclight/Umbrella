"""Umbrella Portfolio Climate Impact / Risk Priority Schemas.

Combines the independently calculated Flood Hazard Score and Portfolio Exposure
to determine operational lender intervention priority.

PRINCIPLE:
Preserves the raw physical hazard score and raw portfolio exposure figures.
Does NOT conflate portfolio size with physical flood probability.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Literal
from pydantic import BaseModel, Field

from umbrella.schemas.portfolio import PortfolioExposure


class PortfolioClimateImpact(BaseModel):
    """Portfolio-level operational climate priority assessment for a village node."""
    village_id: str
    village_name: str
    district: str
    state: str

    # Independent Raw Inputs (Preserved Intact)
    hazard_score: float = Field(..., ge=0.0, le=100.0, description="Raw physical flood hazard score (0 to 100)")
    hazard_level: Literal["LOW", "MODERATE", "HIGH", "SEVERE"]
    forecast_horizon_days: int = Field(..., description="Forecast horizon in days")
    portfolio_exposure: PortfolioExposure = Field(..., description="Raw microfinance portfolio exposure metrics")

    # Combined Operational Priority
    priority_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Operational attention priority score: where should the MFI focus intervention first? (0 to 100)",
    )
    priority_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    # Transparency & Reproducibility
    formula_version: str = "PortfolioPriority-v1.0"
    formula_description: str = (
        "Priority Score = 0.60 * Hazard Score + 0.40 * Normalized Portfolio Capital Exposure Score"
    )
    calculation_details: Dict[str, Any] = Field(
        default_factory=dict, description="Intermediate mathematical factors used to compute priority_score"
    )

    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    disclaimer: str = (
        "OPERATIONAL PRIORITY INDEX: Answers 'Where should the lender focus attention and field support first?' "
        "It does NOT represent physical flood probability, borrower creditworthiness, or default probability."
    )

    @property
    def climate_impact_level(self) -> str:
        """Alias for priority_level."""
        return self.priority_level

