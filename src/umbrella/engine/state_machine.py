"""Umbrella Green Finance Application & Asset Lifecycle State Machine.

Enforces strict institutional transition rules:
DRAFT -> RECOMMENDED -> UNDER_REVIEW -> APPROVED / REJECTED -> DISBURSED
-> INSTALLED -> VERIFICATION_PENDING -> VERIFIED -> CLOSED.

MANDATORY RULES:
1. Umbrella itself NEVER autonomously transitions an application to APPROVED.
2. Direct jumps across required intermediate states (e.g. DRAFT -> VERIFIED) are strictly rejected.
3. Every human decision (approval/rejection) is permanently preserved with officer ID and justification.
"""

from typing import Dict, List, Set
from umbrella.schemas.resilience import (
    ApplicationStatus,
    GreenFinanceApplication,
    HumanDecision,
)


class InvalidStateTransitionError(ValueError):
    """Raised when an application or asset attempts an unauthorized lifecycle transition."""
    pass


class ApplicationStateMachine:
    """Manages and validates state transitions for GreenFinanceApplication."""

    # Allowed forward and backward transitions
    VALID_TRANSITIONS: Dict[ApplicationStatus, Set[ApplicationStatus]] = {
        "DRAFT": {"RECOMMENDED", "UNDER_REVIEW"},
        "RECOMMENDED": {"UNDER_REVIEW", "DRAFT"},
        "UNDER_REVIEW": {"APPROVED", "REJECTED"},
        "APPROVED": {"DISBURSED"},
        "REJECTED": {"DRAFT"},  # Allow re-drafting after human review
        "DISBURSED": {"INSTALLED"},
        "INSTALLED": {"VERIFICATION_PENDING"},
        "VERIFICATION_PENDING": {"VERIFIED", "UNDER_REVIEW"},  # UNDER_REVIEW if flagged for remediation
        "VERIFIED": {"CLOSED"},
        "CLOSED": set(),
    }

    @classmethod
    def can_transition(cls, current_status: ApplicationStatus, target_status: ApplicationStatus) -> bool:
        """Check if transition from current_status to target_status is permitted."""
        allowed = cls.VALID_TRANSITIONS.get(current_status, set())
        return target_status in allowed

    @classmethod
    def validate_transition(
        cls,
        application: GreenFinanceApplication,
        target_status: ApplicationStatus,
        human_decision: HumanDecision = None,
    ) -> None:
        """Validate state transition rules; raises InvalidStateTransitionError on violation."""
        current = application.status

        # 1. State machine graph check
        if not cls.can_transition(current, target_status):
            allowed = list(cls.VALID_TRANSITIONS.get(current, set()))
            raise InvalidStateTransitionError(
                f"Illegal application lifecycle transition from '{current}' to '{target_status}'. "
                f"Permitted next states from '{current}' are: {allowed}."
            )

        # 2. Strict Human Approval Rule
        if target_status == "APPROVED":
            if not human_decision or human_decision.decision != "APPROVED":
                raise InvalidStateTransitionError(
                    "Umbrella cannot autonomously approve financing applications. "
                    "A valid HumanDecision record signed by an authorized risk officer is strictly required."
                )
            if not human_decision.officer_id:
                raise InvalidStateTransitionError(
                    "Human approval record is invalid: missing 'officer_id'."
                )

        if target_status == "REJECTED":
            if not human_decision or human_decision.decision != "REJECTED":
                raise InvalidStateTransitionError(
                    "A valid HumanDecision record signed by an officer is required to reject an application."
                )

        # 3. Disbursement check
        if target_status == "DISBURSED":
            if current != "APPROVED":
                raise InvalidStateTransitionError(
                    f"Cannot disburse an application that is not APPROVED (current status: '{current}')."
                )

        # 4. Installation & Verification checks
        if target_status == "INSTALLED":
            if current != "DISBURSED":
                raise InvalidStateTransitionError(
                    f"Cannot mark an asset as INSTALLED before loan is DISBURSED (current status: '{current}')."
                )

        if target_status == "VERIFIED":
            if current != "VERIFICATION_PENDING":
                raise InvalidStateTransitionError(
                    f"Cannot mark an application as VERIFIED directly from '{current}'. Must be in VERIFICATION_PENDING."
                )
