"""Umbrella Flywheel Repository & Demo Store.

Coordinates in-memory state for:
- GreenFinanceApplications
- ResilienceAssets
- AssetVerifications
- AuditTrailLogger

Pre-seeds deterministic, rich demo records for the Darbhanga pilot district across
every lifecycle stage:
- DRAFT (Ghanshyampur)
- UNDER_REVIEW (Biraul - ready for Human Officer approval)
- VERIFICATION_PENDING (Kusheshwar Asthan - ready for Field Officer visit)
- VERIFIED (Hayaghat - completed lifecycle with emissions avoided)
"""

import threading
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional

from umbrella.config.geography import get_pilot_village
from umbrella.engine.audit import AuditTrailLogger
from umbrella.engine.catalog import get_intervention, get_finance_product
from umbrella.engine.financing import FinancingCalculator
from umbrella.engine.state_machine import ApplicationStateMachine
from umbrella.engine.verification import VerificationEngine
from umbrella.schemas.resilience import (
    GreenFinanceApplication,
    ApplicationCreateRequest,
    ApplicationDecisionRequest,
    HumanDecision,
    ResilienceAsset,
    AssetCreateRequest,
    AssetVerification,
    VerificationCreateRequest,
    VerificationDecisionRequest,
    FinancingScenarioRequest,
)


class FlywheelStore:
    """Thread-safe state store for the resilience finance and verification flywheel."""

    def __init__(self):
        self.applications: Dict[str, GreenFinanceApplication] = {}
        self.assets: Dict[str, ResilienceAsset] = {}
        self.verifications: Dict[str, AssetVerification] = {}
        self.verification_hashes: Dict[str, str] = {}  # sha256 -> asset_id
        self.audit = AuditTrailLogger()
        self.verification_engine = VerificationEngine()
        self._lock = threading.Lock()

        # Seed initial deterministic demo records
        self.seed_demo_data()

    def seed_demo_data(self):
        """Seed rich, realistic demo lifecycle records for Darbhanga District clusters."""
        with self._lock:
            self.applications.clear()
            self.assets.clear()
            self.verifications.clear()
            self.verification_hashes.clear()
            self.audit.clear()

            now = datetime.now(timezone.utc)
            t_minus_14d = now - timedelta(days=14)
            t_minus_10d = now - timedelta(days=10)
            t_minus_7d = now - timedelta(days=7)
            t_minus_3d = now - timedelta(days=3)
            t_minus_1d = now - timedelta(days=1)

            # -----------------------------------------------------------------
            # DEMO 1: Hayaghat (VIL-DAR-HAY) - Fully VERIFIED Lifecycle
            # -----------------------------------------------------------------
            app_1 = GreenFinanceApplication(
                application_id="APP-DAR-HAY-001",
                village_id="VIL-DAR-HAY",
                village_name="Hayaghat",
                borrower_group_id="JLG-HAY-01",
                borrower_name="Sunita Devi",
                livelihood="AGRICULTURE_PADDY",
                intervention_id="raised-hermetic-silo",
                finance_product_id="prod-micro-adaptation",
                requested_amount_inr=15000.0,
                borrower_contribution_inr=3000.0,
                approved_amount_inr=15000.0,
                status="VERIFIED",
                human_decisions=[
                    HumanDecision(
                        decision="APPROVED",
                        officer_id="OFF-RISK-042",
                        officer_name="Rajesh Verma (Senior Risk Officer)",
                        timestamp=t_minus_10d,
                        reason="Pre-monsoon flood risk HIGH (Bagmati basin); borrower has 2 successful loan cycles.",
                        notes="Approved with standard 30-day installation grace window.",
                    )
                ],
                created_at=t_minus_14d,
                updated_at=t_minus_1d,
                asset_id="AST-DAR-HAY-001",
                notes="Elevated hermetic storage for protecting paddy harvest against riverine flooding.",
            )
            self.applications[app_1.application_id] = app_1

            ast_1 = ResilienceAsset(
                asset_id="AST-DAR-HAY-001",
                application_id=app_1.application_id,
                intervention_id="raised-hermetic-silo",
                intervention_name="Elevated Flood-Resilient Hermetic Grain Silo",
                borrower_group_id="JLG-HAY-01",
                borrower_name="Sunita Devi",
                village_id="VIL-DAR-HAY",
                village_name="Hayaghat",
                expected_latitude=25.9865,
                expected_longitude=85.9082,
                actual_latitude=25.9868,
                actual_longitude=85.9085,
                expected_installation_date=t_minus_7d,
                actual_installation_date=t_minus_7d,
                status="ACTIVE_DEPLOYED",
                verification_status="VERIFIED",
                impact_estimation_status="ESTIMATED",
                serial_number_or_tag="SILO-HAY-2026-089",
                created_at=t_minus_10d,
            )
            self.assets[ast_1.asset_id] = ast_1

            # Simulated verified photo hash
            demo_hash_1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            self.verification_hashes[demo_hash_1] = ast_1.asset_id

            summary_1 = self.verification_engine.evaluate_verification(
                new_sha256=demo_hash_1,
                current_asset_id=ast_1.asset_id,
                existing_hashes={},
                submitted_lat=25.9868,
                submitted_lon=85.9085,
                expected_lat=25.9865,
                expected_lon=85.9082,
                submitted_at=t_minus_3d,
                application_created_at=t_minus_14d,
                checklist_items=get_intervention("raised-hermetic-silo").verification_requirements,
                checklist_responses={
                    "check_plinth_height": True,
                    "check_seal_integrity": True,
                    "check_location_match": True,
                    "check_usable_condition": True,
                },
            )

            vrf_1 = AssetVerification(
                verification_id="VRF-DAR-HAY-001",
                asset_id=ast_1.asset_id,
                officer_id="FLD-OFF-108",
                officer_name="Amit Kumar (Field Officer)",
                submitted_at=t_minus_3d,
                submitted_latitude=25.9868,
                submitted_longitude=85.9085,
                photo_filename="demo_silo_hayaghat.jpg",
                photo_sha256=demo_hash_1,
                checklist_responses={
                    "check_plinth_height": True,
                    "check_seal_integrity": True,
                    "check_location_match": True,
                    "check_usable_condition": True,
                },
                notes="Physical silo inspected. Elevated 1.25m on brick plinth in Sunita Devi's courtyard. Latches locked.",
                automated_summary=summary_1,
                verification_result="PASSED",
                human_review_status="CONFIRMED",
                human_decision=HumanDecision(
                    decision="CONFIRMED",
                    officer_id="MGR-OPS-012",
                    officer_name="Sanjay Mishra (Branch Manager)",
                    timestamp=t_minus_1d,
                    reason="Evidence verified; GPS offset 42m matches homestead cadastral map.",
                    notes="Installation verified and marked active in portfolio.",
                ),
                created_at=t_minus_3d,
            )
            self.verifications[vrf_1.verification_id] = vrf_1

            # -----------------------------------------------------------------
            # DEMO 2: Kusheshwar Asthan (VIL-DAR-KUS) - VERIFICATION_PENDING
            # -----------------------------------------------------------------
            app_2 = GreenFinanceApplication(
                application_id="APP-DAR-KUS-002",
                village_id="VIL-DAR-KUS",
                village_name="Kusheshwar Asthan",
                borrower_group_id="JLG-KUS-02",
                borrower_name="Poonam Kumari",
                livelihood="DAIRY_AND_LIVESTOCK",
                intervention_id="flood-livestock-shelter",
                finance_product_id="prod-farm-resilience",
                requested_amount_inr=50000.0,
                borrower_contribution_inr=15000.0,
                approved_amount_inr=50000.0,
                status="VERIFICATION_PENDING",
                human_decisions=[
                    HumanDecision(
                        decision="APPROVED",
                        officer_id="OFF-RISK-042",
                        officer_name="Rajesh Verma (Senior Risk Officer)",
                        timestamp=t_minus_7d,
                        reason="Kusheshwar Asthan has SEVERE historical waterlogging; livestock protection is essential.",
                        notes="Disbursement completed on 2026-09-22.",
                    )
                ],
                created_at=t_minus_10d,
                updated_at=t_minus_1d,
                asset_id="AST-DAR-KUS-002",
                notes="Raised community bamboo/concrete shelter for 6 milch cattle.",
            )
            self.applications[app_2.application_id] = app_2

            ast_2 = ResilienceAsset(
                asset_id="AST-DAR-KUS-002",
                application_id=app_2.application_id,
                intervention_id="flood-livestock-shelter",
                intervention_name="Elevated Community Livestock Flood Shelter",
                borrower_group_id="JLG-KUS-02",
                borrower_name="Poonam Kumari",
                village_id="VIL-DAR-KUS",
                village_name="Kusheshwar Asthan",
                expected_latitude=25.8242,
                expected_longitude=86.1367,
                expected_installation_date=t_minus_1d,
                status="ACTIVE_DEPLOYED",
                verification_status="PENDING_REVIEW",
                impact_estimation_status="PENDING_VERIFICATION",
                serial_number_or_tag="LIV-KUS-2026-014",
                created_at=t_minus_7d,
            )
            self.assets[ast_2.asset_id] = ast_2

            # -----------------------------------------------------------------
            # DEMO 3: Biraul (VIL-DAR-BIR) - UNDER_REVIEW (Ready for Human Approval)
            # -----------------------------------------------------------------
            app_3 = GreenFinanceApplication(
                application_id="APP-DAR-BIR-003",
                village_id="VIL-DAR-BIR",
                village_name="Biraul",
                borrower_group_id="JLG-BIR-01",
                borrower_name="Rekha Devi",
                livelihood="AGRICULTURE_PADDY",
                intervention_id="solar-irrigation-pump",
                finance_product_id="prod-solar-equipment",
                requested_amount_inr=50000.0,
                borrower_contribution_inr=25000.0,
                status="UNDER_REVIEW",
                human_decisions=[],
                created_at=t_minus_3d,
                updated_at=t_minus_1d,
                notes="Solar pump to replace diesel engine; co-funded with state subsidy.",
            )
            self.applications[app_3.application_id] = app_3

            # -----------------------------------------------------------------
            # DEMO 4: Ghanshyampur (VIL-DAR-GHA) - DRAFT (Initial Stage)
            # -----------------------------------------------------------------
            app_4 = GreenFinanceApplication(
                application_id="APP-DAR-GHA-004",
                village_id="VIL-DAR-GHA",
                village_name="Ghanshyampur",
                borrower_group_id="JLG-GHA-03",
                borrower_name="Meena Devi",
                livelihood="AGRICULTURE_MAKHANA",
                intervention_id="portable-solar-dryer",
                finance_product_id="prod-micro-adaptation",
                requested_amount_inr=25000.0,
                borrower_contribution_inr=10000.0,
                status="DRAFT",
                human_decisions=[],
                created_at=t_minus_1d,
                updated_at=t_minus_1d,
                notes="Drafted from high flood risk early warning recommendation.",
            )
            self.applications[app_4.application_id] = app_4

            # Record audit trail events for pre-seeded records
            self.audit.record_event(
                entity_type="APPLICATION",
                entity_id=app_1.application_id,
                action="APPLICATION_CREATED",
                actor_type="FIELD_OFFICER",
                actor_id="FLD-OFF-108",
                actor_name="Amit Kumar",
                metadata={"village": "Hayaghat", "amount": 15000.0},
            )
            self.audit.record_event(
                entity_type="APPLICATION",
                entity_id=app_1.application_id,
                action="HUMAN_APPROVAL_RECORDED",
                actor_type="HUMAN_RISK_OFFICER",
                actor_id="OFF-RISK-042",
                actor_name="Rajesh Verma",
                metadata={"approved_amount": 15000.0},
            )
            self.audit.record_event(
                entity_type="ASSET",
                entity_id=ast_1.asset_id,
                action="ASSET_DEPLOYED",
                actor_type="SYSTEM",
                actor_id="UMBRELLA-CORE",
                actor_name="Umbrella Platform",
                metadata={"serial": "SILO-HAY-2026-089"},
            )
            self.audit.record_event(
                entity_type="VERIFICATION",
                entity_id=vrf_1.verification_id,
                action="FIELD_VERIFICATION_SUBMITTED",
                actor_type="FIELD_OFFICER",
                actor_id="FLD-OFF-108",
                actor_name="Amit Kumar",
                metadata={"status": "PASSED", "sha256": demo_hash_1},
            )
            self.audit.record_event(
                entity_type="VERIFICATION",
                entity_id=vrf_1.verification_id,
                action="SUPERVISOR_VERIFICATION_CONFIRMED",
                actor_type="HUMAN_RISK_OFFICER",
                actor_id="MGR-OPS-012",
                actor_name="Sanjay Mishra",
                metadata={"decision": "CONFIRMED"},
            )

    # -------------------------------------------------------------------------
    # APPLICATION OPERATIONS
    # -------------------------------------------------------------------------

    def create_application(self, req: ApplicationCreateRequest) -> GreenFinanceApplication:
        """Initiate a new resilience loan application in DRAFT state."""
        village = get_pilot_village(req.village_id)
        # Validate intervention and finance product exist
        get_intervention(req.intervention_id)
        get_finance_product(req.finance_product_id)

        app_id = f"APP-DAR-{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now(timezone.utc)

        app = GreenFinanceApplication(
            application_id=app_id,
            village_id=req.village_id,
            village_name=village.village_name,
            borrower_group_id=req.borrower_group_id,
            borrower_name=req.borrower_name,
            livelihood=req.livelihood,
            intervention_id=req.intervention_id,
            finance_product_id=req.finance_product_id,
            requested_amount_inr=round(req.requested_amount_inr, 2),
            borrower_contribution_inr=round(req.borrower_contribution_inr, 2),
            status="DRAFT",
            created_at=now,
            updated_at=now,
            notes=req.notes,
        )

        with self._lock:
            self.applications[app_id] = app

        self.audit.record_event(
            entity_type="APPLICATION",
            entity_id=app_id,
            action="APPLICATION_CREATED",
            actor_type="FIELD_OFFICER",
            actor_id="FLD-WEB-USER",
            actor_name="MFI Loan Officer",
            metadata={"village": village.village_name, "requested_amount": req.requested_amount_inr},
        )
        return app

    def submit_for_review(self, application_id: str) -> GreenFinanceApplication:
        """Move application from DRAFT to UNDER_REVIEW."""
        with self._lock:
            if application_id not in self.applications:
                raise KeyError(f"Application '{application_id}' not found.")
            app = self.applications[application_id]

            ApplicationStateMachine.validate_transition(app, "UNDER_REVIEW")
            app.status = "UNDER_REVIEW"
            app.updated_at = datetime.now(timezone.utc)

        self.audit.record_event(
            entity_type="APPLICATION",
            entity_id=application_id,
            action="APPLICATION_SUBMITTED_FOR_REVIEW",
            actor_type="FIELD_OFFICER",
            actor_id="FLD-WEB-USER",
            actor_name="MFI Loan Officer",
        )
        return app

    def record_application_decision(
        self, application_id: str, req: ApplicationDecisionRequest
    ) -> GreenFinanceApplication:
        """Record an explicit human credit officer authorization or rejection."""
        decision = HumanDecision(
            decision=req.decision,
            officer_id=req.officer_id,
            officer_name=req.officer_name,
            timestamp=datetime.now(timezone.utc),
            reason=req.reason,
            notes=req.notes,
        )

        with self._lock:
            if application_id not in self.applications:
                raise KeyError(f"Application '{application_id}' not found.")
            app = self.applications[application_id]

            target_status = "APPROVED" if req.decision == "APPROVED" else "REJECTED"
            ApplicationStateMachine.validate_transition(app, target_status, human_decision=decision)

            app.status = target_status
            app.human_decisions.append(decision)
            if req.decision == "APPROVED":
                app.approved_amount_inr = req.approved_amount_inr or app.requested_amount_inr
            app.updated_at = datetime.now(timezone.utc)

        self.audit.record_event(
            entity_type="APPLICATION",
            entity_id=application_id,
            action=f"HUMAN_DECISION_{req.decision}",
            actor_type="HUMAN_RISK_OFFICER",
            actor_id=req.officer_id,
            actor_name=req.officer_name,
            metadata={"decision": req.decision, "reason": req.reason, "approved_amount": app.approved_amount_inr},
        )
        return app

    def disburse_and_register_asset(
        self, application_id: str, serial_number: Optional[str] = None
    ) -> ResilienceAsset:
        """Disburse an approved loan and create the physical ResilienceAsset."""
        with self._lock:
            if application_id not in self.applications:
                raise KeyError(f"Application '{application_id}' not found.")
            app = self.applications[application_id]

            ApplicationStateMachine.validate_transition(app, "DISBURSED")
            app.status = "DISBURSED"
            app.updated_at = datetime.now(timezone.utc)

            # Retrieve village coordinates
            village = get_pilot_village(app.village_id)
            intervention = get_intervention(app.intervention_id)

            asset_id = f"AST-DAR-{uuid.uuid4().hex[:6].upper()}"
            now = datetime.now(timezone.utc)

            asset = ResilienceAsset(
                asset_id=asset_id,
                application_id=app.application_id,
                intervention_id=intervention.intervention_id,
                intervention_name=intervention.name,
                borrower_group_id=app.borrower_group_id,
                borrower_name=app.borrower_name,
                village_id=app.village_id,
                village_name=app.village_name,
                expected_latitude=village.latitude,
                expected_longitude=village.longitude,
                expected_installation_date=now + timedelta(days=14),
                status="PENDING_DISBURSEMENT",
                verification_status="NOT_SUBMITTED",
                impact_estimation_status="PENDING_VERIFICATION",
                serial_number_or_tag=serial_number or f"{intervention.intervention_id.upper()[:4]}-{now.year}-{uuid.uuid4().hex[:4].upper()}",
                created_at=now,
            )
            self.assets[asset_id] = asset
            app.asset_id = asset_id

            # Transition application to INSTALLED -> VERIFICATION_PENDING for workflow readiness
            ApplicationStateMachine.validate_transition(app, "INSTALLED")
            app.status = "INSTALLED"
            ApplicationStateMachine.validate_transition(app, "VERIFICATION_PENDING")
            app.status = "VERIFICATION_PENDING"
            asset.status = "ACTIVE_DEPLOYED"
            asset.verification_status = "PENDING_REVIEW"

        self.audit.record_event(
            entity_type="ASSET",
            entity_id=asset_id,
            action="ASSET_REGISTERED_AND_DISBURSED",
            actor_type="SYSTEM",
            actor_id="UMBRELLA-CORE",
            actor_name="Umbrella Platform",
            metadata={"application_id": application_id, "intervention": intervention.name},
        )
        return asset

    # -------------------------------------------------------------------------
    # VERIFICATION OPERATIONS
    # -------------------------------------------------------------------------

    def submit_verification(
        self,
        req: VerificationCreateRequest,
        photo_filename: Optional[str] = None,
        photo_sha256: Optional[str] = None,
    ) -> AssetVerification:
        """Submit field inspection checklist, GPS coordinates, and photo hash."""
        with self._lock:
            if req.asset_id not in self.assets:
                raise KeyError(f"Resilience asset '{req.asset_id}' not found.")
            asset = self.assets[req.asset_id]
            app = self.applications.get(asset.application_id)

            intervention = get_intervention(asset.intervention_id)
            now = datetime.now(timezone.utc)

            # Automated Checks Evaluation
            summary = self.verification_engine.evaluate_verification(
                new_sha256=photo_sha256,
                current_asset_id=asset.asset_id,
                existing_hashes=self.verification_hashes,
                submitted_lat=req.submitted_latitude,
                submitted_lon=req.submitted_longitude,
                expected_lat=asset.expected_latitude,
                expected_lon=asset.expected_longitude,
                submitted_at=now,
                application_created_at=app.created_at if app else None,
                checklist_items=intervention.verification_requirements,
                checklist_responses=req.checklist_responses,
            )

            # Update hash registry if photo provided
            if photo_sha256:
                self.verification_hashes[photo_sha256] = asset.asset_id

            # Determine preliminary verification result
            if summary.overall_automated_status == "FLAGGED":
                result = "FLAGGED"
                asset.verification_status = "FLAGGED"
            elif summary.overall_automated_status == "REVIEW_REQUIRED":
                result = "PENDING"
                asset.verification_status = "PENDING_REVIEW"
            else:
                result = "PASSED"
                asset.verification_status = "PENDING_REVIEW"

            verif_id = f"VRF-DAR-{uuid.uuid4().hex[:6].upper()}"
            verification = AssetVerification(
                verification_id=verif_id,
                asset_id=asset.asset_id,
                officer_id=req.officer_id,
                officer_name=req.officer_name,
                submitted_at=now,
                submitted_latitude=req.submitted_latitude,
                submitted_longitude=req.submitted_longitude,
                photo_filename=photo_filename,
                photo_sha256=photo_sha256,
                checklist_responses=req.checklist_responses,
                notes=req.notes,
                automated_summary=summary,
                verification_result=result,
                human_review_status="PENDING_REVIEW",
                created_at=now,
            )
            self.verifications[verif_id] = verification

            asset.actual_latitude = req.submitted_latitude
            asset.actual_longitude = req.submitted_longitude

        self.audit.record_event(
            entity_type="VERIFICATION",
            entity_id=verif_id,
            action="FIELD_VERIFICATION_SUBMITTED",
            actor_type="FIELD_OFFICER",
            actor_id=req.officer_id,
            actor_name=req.officer_name,
            metadata={"status": result, "automated_summary": summary.overall_automated_status},
        )
        return verification

    def record_verification_decision(
        self, verification_id: str, req: VerificationDecisionRequest
    ) -> AssetVerification:
        """Record supervisory review of a field verification."""
        decision = HumanDecision(
            decision="CONFIRMED" if req.decision in ["CONFIRMED", "OVERRIDDEN"] else "REJECTED",
            officer_id=req.officer_id,
            officer_name=req.officer_name,
            timestamp=datetime.now(timezone.utc),
            reason=req.reason,
            notes=req.notes,
        )

        with self._lock:
            if verification_id not in self.verifications:
                raise KeyError(f"Verification '{verification_id}' not found.")
            verif = self.verifications[verification_id]
            asset = self.assets.get(verif.asset_id)
            app = self.applications.get(asset.application_id) if asset else None

            verif.human_review_status = req.decision
            verif.human_decision = decision

            if req.decision in ["CONFIRMED", "OVERRIDDEN"]:
                verif.verification_result = "PASSED"
                if asset:
                    asset.verification_status = "VERIFIED"
                    asset.impact_estimation_status = "ESTIMATED"
                if app:
                    ApplicationStateMachine.validate_transition(app, "VERIFIED")
                    app.status = "VERIFIED"
                    app.updated_at = datetime.now(timezone.utc)
            else:
                verif.verification_result = "REJECTED"
                if asset:
                    asset.verification_status = "REJECTED"

        self.audit.record_event(
            entity_type="VERIFICATION",
            entity_id=verification_id,
            action=f"SUPERVISOR_VERIFICATION_{req.decision}",
            actor_type="HUMAN_RISK_OFFICER",
            actor_id=req.officer_id,
            actor_name=req.officer_name,
            metadata={"decision": req.decision, "reason": req.reason},
        )
        return verif
