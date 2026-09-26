"""Tests for Pilot Geography, GeoJSON validation, and administrative hierarchy."""

import json
from pathlib import Path
import pytest

from umbrella.config.geography import (
    get_pilot_village,
    list_pilot_villages,
    load_district_geojson,
    load_district_villages_geojson,
    get_pilot_metadata,
    get_primary_pilot_district,
)


def point_in_polygon(x: float, y: float, poly: list) -> bool:
    """Ray casting algorithm for 2D point-in-polygon check."""
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xints:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def test_district_geojson_structure():
    """Verify official Darbhanga district GeoJSON boundary."""
    data = load_district_geojson("bihar", "darbhanga")
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 1

    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] in ["Polygon", "MultiPolygon"]
    assert feature["properties"]["name"] == "Darbhanga"


def test_pilot_metadata():
    """Verify pilot metadata documentation."""
    meta = get_pilot_metadata("bihar", "darbhanga")
    assert meta["district_name"] == "Darbhanga"
    assert meta["state_name"] == "Bihar"
    assert meta["country_code"] == "IND"
    assert meta["census_2011_code"] == "215"
    assert meta["pilot_monitored_clusters_count"] == 10
    assert "Bagmati River" in meta["major_rivers"]
    assert "Kamala Balan River" in meta["major_rivers"]


def test_primary_pilot_district_summary():
    """Verify primary case study summary."""
    pilot = get_primary_pilot_district()
    assert pilot["pilot_district"] == "Darbhanga"
    assert pilot["pilot_state"] == "Bihar"
    assert pilot["pilot_role"] == "PRIMARY_CASE_STUDY"
    assert pilot["monitored_clusters_count"] == 10
    assert len(pilot["monitored_clusters"]) == 10


def test_villages_geojson_and_polygon_containment():
    """Verify that all 10 operational clusters are inside the official district polygon."""
    dist_data = load_district_geojson("bihar", "darbhanga")
    polygon = dist_data["features"][0]["geometry"]["coordinates"][0]

    villages_data = load_district_villages_geojson("bihar", "darbhanga")
    features = villages_data["features"]
    assert len(features) == 10

    bbox = get_pilot_metadata("bihar", "darbhanga")["bounding_box"]

    for f in features:
        props = f["properties"]
        lon, lat = f["geometry"]["coordinates"]

        # Check inside bounding box
        assert bbox["min_longitude"] <= lon <= bbox["max_longitude"], f"{props['village_name']} lon outside bbox"
        assert bbox["min_latitude"] <= lat <= bbox["max_latitude"], f"{props['village_name']} lat outside bbox"

        # Check inside polygon boundary
        assert point_in_polygon(lon, lat, polygon), f"{props['village_name']} is outside district polygon"

        # Check essential terrain attributes
        assert props["elevation_m"] > 0
        assert props["drainage_capacity_score"] >= 0.0 and props["drainage_capacity_score"] <= 1.0
        assert props["slope_gradient_pct"] >= 0.0
        assert props["river_proximity_km"] >= 0.0
        assert props["dominant_crop"] != ""
        assert props["crop_flood_susceptibility"] > 0


def test_pilot_village_registry_lookup():
    """Verify registry retrieval of Hayaghat, Kusheshwar Asthan, and Biraul."""
    hay = get_pilot_village("VIL-DAR-HAY")
    assert hay.village_name == "Hayaghat"
    assert hay.district == "Darbhanga"
    assert hay.state == "Bihar"
    assert hay.terrain.elevation_m == 46.0
    assert hay.terrain.river_proximity_km == 0.4
    assert hay.nearest_river == "Bagmati River"

    kus = get_pilot_village("VIL-DAR-KUS")
    assert kus.village_name == "Kusheshwar Asthan"
    assert kus.terrain.elevation_m == 42.0

    bir = get_pilot_village("VIL-DAR-BIR")
    assert bir.village_name == "Biraul"
    assert bir.terrain.elevation_m == 42.0


def test_list_pilot_villages_filter():
    """Verify filtering by state and district returns accurate subsets."""
    dar_villages = list_pilot_villages(state="Bihar", district="Darbhanga")
    assert len(dar_villages) == 10

    tel_villages = list_pilot_villages(state="Telangana")
    assert len(tel_villages) == 3

    unknown = list_pilot_villages(district="NonExistent")
    assert len(unknown) == 0
