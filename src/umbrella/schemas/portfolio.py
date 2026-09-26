"""Umbrella Microfinance Portfolio Schemas.

Represents institutional lending exposure at the village node.

CRITICAL ARCHITECTURAL DISTINCTIONS:
1. Portfolio Exposure represents business capital and borrower presence in a geography.
   It is completely independent of physical climate hazard.
2. Umbrella tracks capital exposed to geographic hazards.
   It does NOT predict individual borrower credit default.
3. All demo data is strictly marked as SYNTHETIC.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class BorrowerProfile(BaseModel):
    """Synthetic borrower profile representing a microfinance client."""
    borrower_id: str
    group_id: str
    primary_livelihood: str = Field("Agriculture", description="Primary income activity, e.g. Paddy, Cotton, Dairy")
    farm_size_hectares: float = Field(1.0, ge=0.0)
    loan_amount_inr: float = Field(..., ge=0.0, description="Principal disbursed in INR")
    outstanding_balance_inr: float = Field(..., ge=0.0, description="Current outstanding balance in INR")
    is_green_loan: bool = Field(False, description="True if loan funded climate-resilient practices, solar pumps, or drip sets")
    repayment_frequency: str = "MONTHLY"
    days_past_due: int = Field(0, ge=0)


class JointLiabilityGroup(BaseModel):
    """Joint Liability Group (JLG) borrowing unit at the village level."""
    group_id: str
    group_name: str
    village_id: str
    village_name: str
    district: str
    state: str
    latitude: float
    longitude: float
    member_count: int = Field(..., ge=1)
    total_outstanding_portfolio_inr: float = Field(..., ge=0.0)
    green_loans_count: int = Field(0, ge=0)
    portfolio_at_risk_30_inr: float = Field(0.0, ge=0.0, description="Portfolio at Risk > 30 days past due")
    primary_crop: str = "Paddy (Rice)"


class PortfolioExposure(BaseModel):
    """Represents how much MFI business is geographically exposed to a hazard zone.

    NOTE: This is NOT a physical climate risk measure.
    """
    village_id: str
    village_name: str
    district: str
    state: str
    latitude: float
    longitude: float
    borrowers_exposed: int = Field(..., ge=0, description="Total active microfinance borrowers in the village")
    groups_exposed: int = Field(..., ge=0, description="Total active Joint Liability Groups (JLGs)")
    active_loans_exposed: int = Field(..., ge=0, description="Total active loan accounts")
    outstanding_amount: float = Field(..., ge=0.0, description="Total outstanding loan capital in INR exposed in village")
    green_loans_exposed: int = Field(0, ge=0, description="Count of green/sustainable agricultural loan products")
    currency: Literal["INR"] = "INR"
    data_type: Literal["SYNTHETIC"] = "SYNTHETIC"
    portfolio_source: str = "SyntheticPortfolioProvider (Deterministic Demo Generator)"
    groups: List[JointLiabilityGroup] = Field(default_factory=list)
    average_loan_size_inr: float = Field(..., ge=0.0)
    disclaimer: str = (
        "SYNTHETIC DEMO DATA: Generated for demonstration and structural testing. "
        "Does not represent actual borrower records, proprietary MFI portfolios, or Satin Creditcare data."
    )

    @property
    def total_outstanding_portfolio_inr(self) -> float:
        """Alias for outstanding_amount."""
        return self.outstanding_amount

    @property
    def total_borrowers(self) -> int:
        """Alias for borrowers_exposed."""
        return self.borrowers_exposed

