"""Umbrella Field Verification & Evidence Integrity Engine.

Provides automated, explainable evidence validation:
1. Photo Upload Security & Hashing: Content-based MIME inspection, size restriction, SHA-256 hashing.
2. Duplicate Evidence Check: Identifies reused photos across assets using cryptographic hashes.
3. GPS Consistency Check: Haversine distance comparison between field coordinates and expected cluster.
4. Timestamp Verification: Validates temporal chronology and rejects future-dated submissions.
5. Checklist Validation: Verifies completion of intervention-specific inspection requirements.

SEPARATION OF CONCERNS:
Automated checks produce an explainable recommendation (PASS / REVIEW_REQUIRED / FLAGGED).
Final verification status requires human supervisory confirmation or auditable override.
"""

import hashlib
import math
import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from umbrella.schemas.resilience import (
    AutomatedCheckResult,
    VerificationAutomatedSummary,
    VerificationChecklistItem,
)


UPLOAD_DIR = Path("data/uploads/verifications")
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 Megabytes


# GPS Distance Thresholds (Configurable)
GPS_PASS_DISTANCE_METERS = 500.0       # < 500m: Within expected homestead/village cluster
GPS_REVIEW_DISTANCE_METERS = 2000.0    # 500m - 2000m: Adjacent agricultural boundary; review needed
# > 2000m: Flagged as inconsistent location


class VerificationEngine:
    """Evaluates field evidence integrity, coordinates, and checklists."""

    def __init__(self, upload_dir: Optional[Path] = None):
        self.upload_dir = upload_dir or UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    # -------------------------------------------------------------------------
    # 1. FILE UPLOAD & INTEGRITY
    # -------------------------------------------------------------------------

    def validate_and_save_photo(
        self,
        file_bytes: bytes,
        original_filename: str,
        content_type: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Validate magic bytes, enforce size limit, compute SHA-256, and save file safely.

        Returns: (saved_filename, sha256_hash)
        """
        # Size limit enforcement
        if len(file_bytes) == 0:
            raise ValueError("Uploaded file is empty (0 bytes).")
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise ValueError(
                f"File size ({len(file_bytes) / 1024 / 1024:.2f} MB) exceeds maximum allowed limit (5.0 MB)."
            )

        # Magic bytes inspection (prevent disguised scripts/text)
        detected_ext = self._detect_image_extension(file_bytes)
        if not detected_ext:
            raise ValueError(
                "Invalid or corrupted image format. Only valid JPEG, PNG, and WebP images are permitted."
            )

        # Compute SHA-256 hash
        hasher = hashlib.sha256()
        hasher.update(file_bytes)
        sha256_hash = hasher.hexdigest()

        # Generate non-guessable, safe server-side filename (prevents directory traversal)
        safe_filename = f"{uuid.uuid4().hex}{detected_ext}"
        target_path = self.upload_dir / safe_filename

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        return safe_filename, sha256_hash

    @staticmethod
    def _detect_image_extension(data: bytes) -> Optional[str]:
        """Inspect header magic bytes of file buffer."""
        # JPEG: FF D8 FF
        if len(data) >= 3 and data[0:3] == b"\xff\xd8\xff":
            return ".jpg"
        # PNG: 89 50 4E 47 0D 0A 1A 0A
        if len(data) >= 8 and data[0:8] == b"\x89PNG\r\n\x1a\n":
            return ".png"
        # WebP: RIFF .... WEBP
        if len(data) >= 12 and data[0:4] == b"RIFF" and data[8:12] == b"WEBP":
            return ".webp"
        return None

    # -------------------------------------------------------------------------
    # 2. DUPLICATE EVIDENCE DETECTION
    # -------------------------------------------------------------------------

    @staticmethod
    def check_duplicate_evidence(
        new_sha256: Optional[str],
        current_asset_id: str,
        existing_hashes: Dict[str, str],  # sha256 -> other_asset_id
    ) -> AutomatedCheckResult:
        """Compare SHA-256 against existing verification records."""
        if not new_sha256:
            return AutomatedCheckResult(
                check_name="Duplicate Evidence Check",
                status="REVIEW",
                score=0.5,
                details="No photo evidence hash provided for verification.",
                metrics={"sha256_present": False},
            )

        if new_sha256 in existing_hashes:
            other_asset = existing_hashes[new_sha256]
            if other_asset != current_asset_id:
                return AutomatedCheckResult(
                    check_name="Duplicate Evidence Check",
                    status="FLAG",
                    score=0.0,
                    details=f"DUPLICATE EVIDENCE DETECTED: Exact image SHA-256 hash previously submitted for asset '{other_asset}'.",
                    metrics={
                        "sha256": new_sha256,
                        "duplicate_of_asset_id": other_asset,
                    },
                )

        return AutomatedCheckResult(
            check_name="Duplicate Evidence Check",
            status="PASS",
            score=1.0,
            details="Cryptographic hash unique; no duplicate image detected across portfolio records.",
            metrics={"sha256": new_sha256, "is_unique": True},
        )

    # -------------------------------------------------------------------------
    # 3. GPS CONSISTENCY CHECK (HAVERSINE DISTANCE)
    # -------------------------------------------------------------------------

    @staticmethod
    def check_gps_consistency(
        submitted_lat: float,
        submitted_lon: float,
        expected_lat: float,
        expected_lon: float,
    ) -> AutomatedCheckResult:
        """Calculate Haversine distance and evaluate spatial consistency."""
        distance_meters = VerificationEngine.calculate_haversine_distance(
            lat1=submitted_lat,
            lon1=submitted_lon,
            lat2=expected_lat,
            lon2=expected_lon,
        )

        metrics = {
            "submitted_coordinates": [round(submitted_lat, 6), round(submitted_lon, 6)],
            "expected_coordinates": [round(expected_lat, 6), round(expected_lon, 6)],
            "distance_meters": round(distance_meters, 1),
            "threshold_pass_meters": GPS_PASS_DISTANCE_METERS,
            "threshold_review_meters": GPS_REVIEW_DISTANCE_METERS,
        }

        if distance_meters <= GPS_PASS_DISTANCE_METERS:
            return AutomatedCheckResult(
                check_name="GPS Spatial Consistency",
                status="PASS",
                score=1.0,
                details=f"Coordinates consistent with village node (offset: {distance_meters:.0f} m < {GPS_PASS_DISTANCE_METERS} m).",
                metrics=metrics,
            )
        elif distance_meters <= GPS_REVIEW_DISTANCE_METERS:
            return AutomatedCheckResult(
                check_name="GPS Spatial Consistency",
                status="REVIEW",
                score=0.7,
                details=(
                    f"Moderate spatial discrepancy ({distance_meters:.0f} m offset). "
                    f"Likely on peripheral agricultural land; supervisor review recommended."
                ),
                metrics=metrics,
            )
        else:
            return AutomatedCheckResult(
                check_name="GPS Spatial Consistency",
                status="FLAG",
                score=0.0,
                details=(
                    f"SPATIAL DISCREPANCY FLAGGED: Verification coordinates are {distance_meters / 1000.0:.2f} km "
                    f"away from expected village location (exceeds {GPS_REVIEW_DISTANCE_METERS} m threshold)."
                ),
                metrics=metrics,
            )

    @staticmethod
    def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Return great-circle distance between two GPS points in meters."""
        r = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    # -------------------------------------------------------------------------
    # 4. TIMESTAMP VALIDATION
    # -------------------------------------------------------------------------

    @staticmethod
    def check_timestamp(
        submitted_at: datetime,
        application_created_at: Optional[datetime] = None,
    ) -> AutomatedCheckResult:
        """Verify submission timing against current time and application chronology."""
        now = datetime.now(timezone.utc)
        # Ensure submitted_at has timezone
        if submitted_at.tzinfo is None:
            submitted_at = submitted_at.replace(tzinfo=timezone.utc)
        if application_created_at and application_created_at.tzinfo is None:
            application_created_at = application_created_at.replace(tzinfo=timezone.utc)

        # Allow 5-minute clock drift into the future
        if submitted_at > now + timedelta(minutes=5):
            return AutomatedCheckResult(
                check_name="Timestamp Validity",
                status="FLAG",
                score=0.0,
                details=f"TIMESTAMP FLAGGED: Verification submission timestamp is in the future ({submitted_at.isoformat()}).",
                metrics={"submitted_at": submitted_at.isoformat(), "server_time": now.isoformat()},
            )

        # Check chronology against application creation
        if application_created_at and submitted_at < application_created_at - timedelta(hours=1):
            return AutomatedCheckResult(
                check_name="Timestamp Validity",
                status="FLAG",
                score=0.0,
                details="CHRONOLOGY FLAGGED: Verification timestamp precedes financing application date.",
                metrics={
                    "submitted_at": submitted_at.isoformat(),
                    "application_created_at": application_created_at.isoformat(),
                },
            )

        return AutomatedCheckResult(
            check_name="Timestamp Validity",
            status="PASS",
            score=1.0,
            details="Timestamp matches valid chronological lifecycle window.",
            metrics={"submitted_at": submitted_at.isoformat()},
        )

    # -------------------------------------------------------------------------
    # 5. CHECKLIST COMPLETENESS
    # -------------------------------------------------------------------------

    @staticmethod
    def check_checklist_completeness(
        checklist_items: List[VerificationChecklistItem],
        responses: Dict[str, bool],
    ) -> AutomatedCheckResult:
        """Validate that all mandatory physical inspection items are completed and true."""
        total_mandatory = [item for item in checklist_items if item.is_mandatory]
        missing_or_failed = []

        for item in total_mandatory:
            val = responses.get(item.item_id, False)
            if not val:
                missing_or_failed.append(f"{item.label} ({item.item_id})")

        completed_count = len(total_mandatory) - len(missing_or_failed)
        completeness_ratio = completed_count / len(total_mandatory) if total_mandatory else 1.0

        if not missing_or_failed:
            return AutomatedCheckResult(
                check_name="Checklist Completeness",
                status="PASS",
                score=1.0,
                details=f"All {len(total_mandatory)} mandatory physical verification criteria confirmed.",
                metrics={"mandatory_total": len(total_mandatory), "completed": completed_count},
            )
        else:
            return AutomatedCheckResult(
                check_name="Checklist Completeness",
                status="REVIEW",
                score=round(completeness_ratio, 2),
                details=f"Incomplete mandatory criteria: {', '.join(missing_or_failed[:3])}.",
                metrics={
                    "mandatory_total": len(total_mandatory),
                    "completed": completed_count,
                    "missing": missing_or_failed,
                },
            )

    # -------------------------------------------------------------------------
    # 6. COMBINED AUTOMATED SUMMARY
    # -------------------------------------------------------------------------

    def evaluate_verification(
        self,
        new_sha256: Optional[str],
        current_asset_id: str,
        existing_hashes: Dict[str, str],
        submitted_lat: float,
        submitted_lon: float,
        expected_lat: float,
        expected_lon: float,
        submitted_at: datetime,
        application_created_at: Optional[datetime],
        checklist_items: List[VerificationChecklistItem],
        checklist_responses: Dict[str, bool],
    ) -> VerificationAutomatedSummary:
        """Produce an explainable composite evaluation of all automated checks."""
        evidence_check = self.check_duplicate_evidence(
            new_sha256=new_sha256,
            current_asset_id=current_asset_id,
            existing_hashes=existing_hashes,
        )
        gps_check = self.check_gps_consistency(
            submitted_lat=submitted_lat,
            submitted_lon=submitted_lon,
            expected_lat=expected_lat,
            expected_lon=expected_lon,
        )
        time_check = self.check_timestamp(
            submitted_at=submitted_at,
            application_created_at=application_created_at,
        )
        checklist_check = self.check_checklist_completeness(
            checklist_items=checklist_items,
            responses=checklist_responses,
        )

        all_checks = [evidence_check, gps_check, time_check, checklist_check]

        # Determine overall automated status
        if any(c.status == "FLAG" for c in all_checks):
            overall = "FLAGGED"
            requires_override = True
        elif any(c.status in ["REVIEW", "FAIL"] for c in all_checks):
            overall = "REVIEW_REQUIRED"
            requires_override = False
        else:
            overall = "PASS"
            requires_override = False

        return VerificationAutomatedSummary(
            evidence_integrity_check=evidence_check,
            gps_consistency_check=gps_check,
            timestamp_check=time_check,
            checklist_completeness_check=checklist_check,
            overall_automated_status=overall,
            requires_human_override=requires_override,
        )
