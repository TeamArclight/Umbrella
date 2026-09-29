"""Tests for Field Verification, Evidence Upload, Duplicate Detection, GPS & Timestamp Checks."""

import hashlib
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pytest

from umbrella.engine.verification import VerificationEngine
from umbrella.schemas.resilience import VerificationChecklistItem


@pytest.fixture
def verification_engine(tmp_path):
    return VerificationEngine(upload_dir=tmp_path)


def test_valid_image_upload_and_hashing(verification_engine):
    """Verify JPEG magic bytes are recognized, saved, and hashed."""
    # Fake JPEG data starting with FF D8 FF
    fake_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"imagepayload12345"
    filename, sha256_hash = verification_engine.validate_and_save_photo(fake_jpeg, "test_pic.jpg")

    assert filename.endswith(".jpg")
    expected_hash = hashlib.sha256(fake_jpeg).hexdigest()
    assert sha256_hash == expected_hash

    # File exists in upload dir
    saved_path = verification_engine.upload_dir / filename
    assert saved_path.exists()
    assert saved_path.read_bytes() == fake_jpeg


def test_reject_corrupted_or_disguised_file(verification_engine):
    """Verify text files or malformed files disguised as images are rejected."""
    # Plain text file
    disguised_text = b"<html><script>alert(1)</script></html>"
    with pytest.raises(ValueError, match="Invalid or corrupted image format"):
        verification_engine.validate_and_save_photo(disguised_text, "exploit.jpg")

    # Empty file
    with pytest.raises(ValueError, match="empty"):
        verification_engine.validate_and_save_photo(b"", "empty.jpg")


def test_reject_oversized_file(verification_engine):
    """Verify uploads exceeding 5 MB are rejected."""
    # Oversized payload
    large_payload = b"\xff\xd8\xff" + b"0" * (6 * 1024 * 1024)
    with pytest.raises(ValueError, match="exceeds maximum allowed limit"):
        verification_engine.validate_and_save_photo(large_payload, "large.jpg")


def test_duplicate_evidence_detection():
    """Verify exact SHA-256 matches on different assets trigger a FLAG."""
    existing_hashes = {
        "hash_already_used_123": "AST-OTHER-999",
    }

    # Duplicate hash submitted
    dup_res = VerificationEngine.check_duplicate_evidence(
        new_sha256="hash_already_used_123",
        current_asset_id="AST-CURRENT-001",
        existing_hashes=existing_hashes,
    )
    assert dup_res.status == "FLAG"
    assert "DUPLICATE EVIDENCE DETECTED" in dup_res.details

    # Unique hash submitted
    unique_res = VerificationEngine.check_duplicate_evidence(
        new_sha256="unique_fresh_hash_456",
        current_asset_id="AST-CURRENT-001",
        existing_hashes=existing_hashes,
    )
    assert unique_res.status == "PASS"


def test_gps_consistency_thresholds():
    """Verify Haversine distance correctly triggers PASS, REVIEW, and FLAG."""
    # Exact location (0m offset) -> PASS
    pass_res = VerificationEngine.check_gps_consistency(
        submitted_lat=25.9865,
        submitted_lon=85.9082,
        expected_lat=25.9865,
        expected_lon=85.9082,
    )
    assert pass_res.status == "PASS"
    assert pass_res.metrics["distance_meters"] < 5.0

    # Near location (~250m offset) -> PASS
    near_res = VerificationEngine.check_gps_consistency(
        submitted_lat=25.9880,
        submitted_lon=85.9082,
        expected_lat=25.9865,
        expected_lon=85.9082,
    )
    assert near_res.status == "PASS"

    # Moderate location (~1200m offset) -> REVIEW
    mod_res = VerificationEngine.check_gps_consistency(
        submitted_lat=25.9970,
        submitted_lon=85.9082,
        expected_lat=25.9865,
        expected_lon=85.9082,
    )
    assert mod_res.status == "REVIEW"

    # Distant location (>5 km away) -> FLAG
    dist_res = VerificationEngine.check_gps_consistency(
        submitted_lat=26.0500,
        submitted_lon=85.9082,
        expected_lat=25.9865,
        expected_lon=85.9082,
    )
    assert dist_res.status == "FLAG"
    assert "SPATIAL DISCREPANCY FLAGGED" in dist_res.details


def test_timestamp_validation():
    """Verify future timestamps and inverted chronology are flagged."""
    now = datetime.now(timezone.utc)
    app_date = now - timedelta(days=5)

    # Valid recent timestamp -> PASS
    valid_res = VerificationEngine.check_timestamp(
        submitted_at=now,
        application_created_at=app_date,
    )
    assert valid_res.status == "PASS"

    # Future timestamp (1 hour ahead) -> FLAG
    future_time = now + timedelta(hours=1)
    future_res = VerificationEngine.check_timestamp(
        submitted_at=future_time,
        application_created_at=app_date,
    )
    assert future_res.status == "FLAG"
    assert "TIMESTAMP FLAGGED" in future_res.details

    # Precedes application date -> FLAG
    ancient_time = app_date - timedelta(days=2)
    retro_res = VerificationEngine.check_timestamp(
        submitted_at=ancient_time,
        application_created_at=app_date,
    )
    assert retro_res.status == "FLAG"


def test_checklist_completeness():
    """Verify incomplete mandatory inspection criteria return REVIEW status."""
    items = [
        VerificationChecklistItem(item_id="chk1", label="Item 1", description="desc", is_mandatory=True),
        VerificationChecklistItem(item_id="chk2", label="Item 2", description="desc", is_mandatory=True),
        VerificationChecklistItem(item_id="chk3", label="Item 3", description="desc", is_mandatory=False),
    ]

    # All mandatory True
    pass_res = VerificationEngine.check_checklist_completeness(items, {"chk1": True, "chk2": True})
    assert pass_res.status == "PASS"

    # One mandatory missing
    rev_res = VerificationEngine.check_checklist_completeness(items, {"chk1": True, "chk2": False})
    assert rev_res.status == "REVIEW"
    assert "Item 2" in rev_res.details


def test_png_and_webp_valid_uploads(verification_engine):
    """Verify PNG and WebP magic bytes are correctly detected and saved with safe extensions."""
    # PNG
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00\x00\x00\rIHDR" + b"pngdata123"
    png_fn, png_hash = verification_engine.validate_and_save_photo(fake_png, "photo.png")
    assert png_fn.endswith(".png")
    assert png_hash == hashlib.sha256(fake_png).hexdigest()

    # WebP
    fake_webp = b"RIFF\x14\x00\x00\x00WEBPVP8 " + b"webpdata123"
    webp_fn, webp_hash = verification_engine.validate_and_save_photo(fake_webp, "photo.webp")
    assert webp_fn.endswith(".webp")
    assert webp_hash == hashlib.sha256(fake_webp).hexdigest()


def test_disguised_non_supported_formats(verification_engine):
    """Verify GIF, PDF, and executable headers disguised as .jpg or .png are blocked."""
    # Disguised GIF
    gif_data = b"GIF89a\x01\x00\x01\x00\x80\x00\x00"
    with pytest.raises(ValueError, match="Invalid or corrupted image format"):
        verification_engine.validate_and_save_photo(gif_data, "animation.jpg")

    # Disguised Windows Executable (MZ header)
    exe_data = b"MZ\x90\x00\x03\x00\x00\x00"
    with pytest.raises(ValueError, match="Invalid or corrupted image format"):
        verification_engine.validate_and_save_photo(exe_data, "installer.png")


def test_extreme_geofence_out_of_bounds():
    """Verify extreme geographic distance (e.g. other hemisphere) results in massive offset and FLAG."""
    # Darbhanga vs South Pole / Southern Ocean (-75.0, 0.0)
    flag_res = VerificationEngine.check_gps_consistency(
        submitted_lat=-75.0,
        submitted_lon=0.0,
        expected_lat=25.9865,
        expected_lon=85.9082,
    )
    assert flag_res.status == "FLAG"
    assert flag_res.metrics["distance_meters"] > 10_000_000  # > 10,000 km
    assert "SPATIAL DISCREPANCY FLAGGED" in flag_res.details

