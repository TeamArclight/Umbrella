"""Portfolio Exposure Engine.

Extracts and aggregates microfinance portfolio capital, Joint Liability Groups,
and borrower metrics exposed to a geographic village area.

CRITICAL SEPARATION OF CONCERNS:
This engine quantifies financial business exposure.
It does NOT compute physical hazard or borrower credit default probability.
"""

from umbrella.adapters.portfolio import PortfolioProvider
from umbrella.schemas.portfolio import PortfolioExposure


class PortfolioExposureEngine:
    """Calculates institutional exposure metrics for a target village geography."""

    def __init__(self, portfolio_provider: PortfolioProvider):
        self.portfolio_provider = portfolio_provider

    def get_exposure(self, village_id: str) -> PortfolioExposure:
        """Fetch normalized portfolio exposure strictly marked as SYNTHETIC."""
        return self.portfolio_provider.get_village_portfolio(village_id)
