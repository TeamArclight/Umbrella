"""Microfinance Portfolio Provider Interface and Implementations.

Isolates Umbrella's risk and recommendation engines from core banking backends.
Provides active SyntheticPortfolioProvider and future FineractPortfolioProvider stub.
Every synthetic record is explicitly marked with data_type='SYNTHETIC'.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import random

from umbrella.schemas.portfolio import (
    BorrowerProfile,
    JointLiabilityGroup,
    PortfolioExposure,
)
from umbrella.config.geography import PILOT_LOCATIONS, get_pilot_village


class PortfolioProvider(ABC):
    """Abstract interface defining microfinance portfolio exposure access."""

    @abstractmethod
    def get_village_portfolio(self, village_id: str) -> PortfolioExposure:
        """Fetch total portfolio exposure and borrower groups for a village node."""
        pass

    @abstractmethod
    def list_monitored_villages(self) -> List[PortfolioExposure]:
        """List all pilot villages monitored by the microfinance institution."""
        pass


class SyntheticPortfolioProvider(PortfolioProvider):
    """Deterministic synthetic portfolio provider for MVP pilot demonstrations.

    Generates realistic, statistically consistent microfinance lending structures
    (Joint Liability Groups, agricultural loan amounts, and crop types).
    Strictly labelled as SYNTHETIC. Never presented as real client or Satin Creditcare data.
    """

    # Custom portfolio scale overrides for testing (e.g., small vs large portfolio comparison)
    def __init__(
        self,
        random_seed: int = 42,
        portfolio_scale_overrides: Optional[Dict[str, float]] = None,
    ):
        self.random_seed = random_seed
        self.portfolio_scale_overrides = portfolio_scale_overrides or {}

    def get_village_portfolio(self, village_id: str) -> PortfolioExposure:
        """Construct synthetic village portfolio matching target ID."""
        if village_id in PILOT_LOCATIONS:
            village_cfg = PILOT_LOCATIONS[village_id]
        else:
            village_cfg = get_pilot_village("VIL-TEL-001")  # Default fallback template

        return self._build_village_portfolio(village_cfg)

    def list_monitored_villages(self) -> List[PortfolioExposure]:
        """Return all calibrated pilot villages with synthetic portfolio exposure."""
        return [self._build_village_portfolio(v) for v in PILOT_LOCATIONS.values()]

    def _build_village_portfolio(self, cfg) -> PortfolioExposure:
        """Deterministically generate groups, loans, and green loans for a village."""
        rng = random.Random(f"{self.random_seed}_{cfg.village_id}")

        # Configurable group count (between 4 and 12 JLGs per village)
        group_count = 6 if cfg.village_id == "VIL-TEL-001" else (8 if cfg.village_id == "VIL-TEL-002" else 5)
        avg_members = 5

        # Check for scale override (e.g. for testing Village A ₹2 Lakh vs Village B ₹80 Lakh)
        scale_multiplier = self.portfolio_scale_overrides.get(cfg.village_id, 1.0)

        groups: List[JointLiabilityGroup] = []
        total_outstanding = 0.0
        total_borrowers = 0
        total_green_loans = 0

        for g_idx in range(1, group_count + 1):
            members = avg_members
            # Typical agricultural JLG loan: ₹35,000 to ₹50,000 per borrower
            group_loan_total = sum(rng.uniform(35000, 50000) * scale_multiplier for _ in range(members))
            group_outstanding = group_loan_total * rng.uniform(0.65, 0.85)

            # Approx 20% of loans are green agricultural loans (solar pumps, micro-irrigation)
            green_count = int(members * 0.2)
            total_green_loans += green_count

            jlg = JointLiabilityGroup(
                group_id=f"{cfg.village_id}-G{g_idx:02d}",
                group_name=f"Pragati Mahila Sangham {g_idx}",
                village_id=cfg.village_id,
                village_name=cfg.village_name,
                district=cfg.district,
                state=cfg.state,
                latitude=cfg.latitude,
                longitude=cfg.longitude,
                member_count=members,
                total_outstanding_portfolio_inr=round(group_outstanding, 2),
                green_loans_count=green_count,
                portfolio_at_risk_30_inr=round(group_outstanding * rng.uniform(0.0, 0.06), 2),
                primary_crop=cfg.terrain.dominant_crop,
            )
            groups.append(jlg)
            total_outstanding += group_outstanding
            total_borrowers += members

        avg_loan = total_outstanding / total_borrowers if total_borrowers > 0 else 0.0

        return PortfolioExposure(
            village_id=cfg.village_id,
            village_name=cfg.village_name,
            district=cfg.district,
            state=cfg.state,
            latitude=cfg.latitude,
            longitude=cfg.longitude,
            borrowers_exposed=total_borrowers,
            groups_exposed=len(groups),
            active_loans_exposed=total_borrowers,
            outstanding_amount=round(total_outstanding, 2),
            green_loans_exposed=total_green_loans,
            currency="INR",
            data_type="SYNTHETIC",
            portfolio_source="SyntheticPortfolioProvider (Deterministic Demo Generator)",
            groups=groups,
            average_loan_size_inr=round(avg_loan, 2),
        )


class FineractPortfolioProvider(PortfolioProvider):
    """Planned future enterprise connector for Apache Fineract core banking engine.

    Will connect to Fineract REST API (/fineract-provider/api/v1/groups and /loans)
    without requiring any modifications to Umbrella's physical hazard engines.
    """

    def __init__(self, fineract_base_url: str, tenant_id: str, auth_token: str):
        self.fineract_base_url = fineract_base_url
        self.tenant_id = tenant_id
        self.auth_token = auth_token

    def get_village_portfolio(self, village_id: str) -> PortfolioExposure:
        raise NotImplementedError(
            "FineractPortfolioProvider is planned for post-MVP enterprise integration. "
            "Use SyntheticPortfolioProvider for current execution."
        )

    def list_monitored_villages(self) -> List[PortfolioExposure]:
        raise NotImplementedError(
            "FineractPortfolioProvider is planned for post-MVP enterprise integration. "
            "Use SyntheticPortfolioProvider for current execution."
        )
