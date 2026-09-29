"""Tests for Green Finance Application and Asset State Machine."""

from datetime import datetime, timezone
import pytest
from umbrella.engine.state_machine import ApplicationStateMachine, InvalidStateTransitionError
from umbrella.schemas.resilience import GreenFinanceApplication, HumanDecision


def make_dummy_app(status="DRAFT") -> GreenFinanceApplication:
    return GreenFinanceApplication(
        application_id="APP-TEST-001",
        village_id="VIL-DAR-HAY",
        village_name="Hayaghat",
        borrower_group_id="JLG-01",
        borrower_name="Test Borrower",
        livelihood="AGRICULTURE_PADDY",
        intervention_id="raised-hermetic-silo",
        finance_product_id="prod-micro-adaptation",
        requested_amount_inr=15000.0,
        borrower_contribution_inr=3000.0,
        status=status,
    )


def test_valid_forward_lifecycle():
    """Verify standard linear lifecycle transitions."""
    app = make_dummy_app("DRAFT")

    # DRAFT -> UNDER_REVIEW
    ApplicationStateMachine.validate_transition(app, "UNDER_REVIEW")
    app.status = "UNDER_REVIEW"

    # UNDER_REVIEW -> APPROVED (with human decision)
    decision = HumanDecision(
        decision="APPROVED",
        officer_id="OFF-001",
        officer_name="Officer One",
        reason="Good track record and high flood risk",
    )
    ApplicationStateMachine.validate_transition(app, "APPROVED", human_decision=decision)
    app.status = "APPROVED"

    # APPROVED -> DISBURSED
    ApplicationStateMachine.validate_transition(app, "DISBURSED")
    app.status = "DISBURSED"

    # DISBURSED -> INSTALLED
    ApplicationStateMachine.validate_transition(app, "INSTALLED")
    app.status = "INSTALLED"

    # INSTALLED -> VERIFICATION_PENDING
    ApplicationStateMachine.validate_transition(app, "VERIFICATION_PENDING")
    app.status = "VERIFICATION_PENDING"

    # VERIFICATION_PENDING -> VERIFIED
    ApplicationStateMachine.validate_transition(app, "VERIFIED")
    app.status = "VERIFIED"

    # VERIFIED -> CLOSED
    ApplicationStateMachine.validate_transition(app, "CLOSED")
    app.status = "CLOSED"


def test_reject_unauthorized_autonomous_approval():
    """Verify Umbrella strictly rejects autonomous approval without human officer record."""
    app = make_dummy_app("UNDER_REVIEW")

    # Missing human decision
    with pytest.raises(InvalidStateTransitionError, match="cannot autonomously approve"):
        ApplicationStateMachine.validate_transition(app, "APPROVED", human_decision=None)

    # Human decision has wrong decision value
    wrong_decision = HumanDecision(
        decision="REJECTED",
        officer_id="OFF-001",
        officer_name="Officer One",
        reason="Does not qualify",
    )
    with pytest.raises(InvalidStateTransitionError, match="cannot autonomously approve"):
        ApplicationStateMachine.validate_transition(app, "APPROVED", human_decision=wrong_decision)


def test_reject_impossible_lifecycle_jumps():
    """Verify illegal jumps across intermediate states are blocked."""
    # DRAFT directly to VERIFIED
    app_draft = make_dummy_app("DRAFT")
    with pytest.raises(InvalidStateTransitionError, match="Illegal application lifecycle transition"):
        ApplicationStateMachine.validate_transition(app_draft, "VERIFIED")

    # DRAFT directly to DISBURSED
    with pytest.raises(InvalidStateTransitionError):
        ApplicationStateMachine.validate_transition(app_draft, "DISBURSED")

    # UNDER_REVIEW directly to INSTALLED
    app_review = make_dummy_app("UNDER_REVIEW")
    with pytest.raises(InvalidStateTransitionError):
        ApplicationStateMachine.validate_transition(app_review, "INSTALLED")


def test_rejection_and_redrafting():
    """Verify application can be rejected by human reviewer and returned to draft."""
    app = make_dummy_app("UNDER_REVIEW")
    rejection = HumanDecision(
        decision="REJECTED",
        officer_id="OFF-002",
        officer_name="Officer Two",
        reason="Ineligible livelihood category",
    )
    ApplicationStateMachine.validate_transition(app, "REJECTED", human_decision=rejection)
    app.status = "REJECTED"

    # Allow returning to DRAFT for amendment
    ApplicationStateMachine.validate_transition(app, "DRAFT")
    app.status = "DRAFT"
