"""Pilot Geography Configuration.

Defines a structured, configurable hierarchy:
State -> District -> Village / Operational Cluster.
Maintains physical terrain and vulnerability attributes independent of portfolio size.
Integrates real district boundaries and operational village clusters from GeoJSON.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PhysicalTerrainAttributes(BaseModel):
    """Environmental and geographic flood susceptibility attributes for a village."""
    elevation_m: float = Field(..., ge=0.0, description="Mean elevation above sea level in meters")
    slope_gradient_pct: float = Field(..., ge=0.0, description="Topographic slope percentage")
    drainage_capacity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Drainage efficiency (1.0 = rapid runoff / well-drained, 0.0 = clogged low-lying depression)",
    )
    soil_texture: str = Field(..., description="Soil classification (e.g. Clay loam, Black cotton, Alluvial)")
    river_proximity_km: float = Field(..., ge=0.0, description="Distance to nearest major river or drainage channel in km")
    dominant_crop: str = Field(..., description="Primary agricultural crop in village command area")
    crop_flood_susceptibility: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Vulnerability factor for dominant crop stage (e.g. 0.8 for submerged seedling paddy)",
    )


class PilotVillageConfig(BaseModel):
    """Configuration record for a monitored pilot village."""
    village_id: str
    village_name: str
    district: str
    state: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    terrain: PhysicalTerrainAttributes
    data_type: str = "DEMO_PILOT"
    block_name: Optional[str] = None
    nearest_river: Optional[str] = None
    notes: Optional[str] = None


# Pre-configured baseline pilot locations in flood-vulnerable agrarian districts of India
PILOT_LOCATIONS: Dict[str, PilotVillageConfig] = {
    "VIL-TEL-001": PilotVillageConfig(
        village_id="VIL-TEL-001",
        village_name="Sirikonda",
        district="Nizamabad",
        state="Telangana",
        latitude=18.5520,
        longitude=78.2910,
        terrain=PhysicalTerrainAttributes(
            elevation_m=380.0,
            slope_gradient_pct=1.2,
            drainage_capacity_score=0.35,  # Low-lying catchment
            soil_texture="Black cotton soil (Vertisol)",
            river_proximity_km=3.5,
            dominant_crop="Paddy (Rice)",
            crop_flood_susceptibility=0.75,
        ),
        notes="Godavari basin tributary catchment prone to waterlogging during heavy monsoon spells.",
    ),
    "VIL-TEL-002": PilotVillageConfig(
        village_id="VIL-TEL-002",
        village_name="Dharmaram",
        district="Karimnagar",
        state="Telangana",
        latitude=18.6940,
        longitude=79.2810,
        terrain=PhysicalTerrainAttributes(
            elevation_m=260.0,
            slope_gradient_pct=2.1,
            drainage_capacity_score=0.55,
            soil_texture="Red sandy loam (Alfisol)",
            river_proximity_km=7.2,
            dominant_crop="Cotton & Maize",
            crop_flood_susceptibility=0.60,
        ),
        notes="Intermediate drainage; moderate flash waterlogging risk during localized bursts.",
    ),
    "VIL-TEL-003": PilotVillageConfig(
        village_id="VIL-TEL-003",
        village_name="Parkal",
        district="Warangal",
        state="Telangana",
        latitude=18.1960,
        longitude=79.7110,
        terrain=PhysicalTerrainAttributes(
            elevation_m=245.0,
            slope_gradient_pct=1.0,
            drainage_capacity_score=0.28,  # Tank cascade command area
            soil_texture="Clayey alluvial",
            river_proximity_km=2.1,
            dominant_crop="Paddy & Chilli",
            crop_flood_susceptibility=0.80,
        ),
        notes="Irrigation tank cascade overflow zone; high physical water retention susceptibility.",
    ),
    "VIL-BIH-001": PilotVillageConfig(
        village_id="VIL-BIH-001",
        village_name="Kalyanpur",
        district="Samastipur",
        state="Bihar",
        latitude=25.9600,
        longitude=85.8300,
        terrain=PhysicalTerrainAttributes(
            elevation_m=52.0,
            slope_gradient_pct=0.4,  # Extremely flat Gangetic plains
            drainage_capacity_score=0.20,  # Highly prone to backwater flooding
            soil_texture="Silt alluvial",
            river_proximity_km=1.8,
            dominant_crop="Paddy & Maize",
            crop_flood_susceptibility=0.85,
        ),
        notes="Burhi Gandak river floodway; high seasonal inundation and embankment seepage.",
    ),
}


def _get_data_dir() -> Path:
    """Resolve data directory relative to repository or package root."""
    # Try relative to this file: src/umbrella/config/geography.py -> root/data
    candidate = Path(__file__).resolve().parent.parent.parent.parent / "data"
    if candidate.exists():
        return candidate
    # Fallback to current working directory / data
    candidate_cwd = Path("data").resolve()
    if candidate_cwd.exists():
        return candidate_cwd
    return candidate


def _load_real_pilot_villages_from_geojson() -> None:
    """Load real pilot village clusters from GeoJSON files into PILOT_LOCATIONS."""
    data_dir = _get_data_dir()
    geography_dir = data_dir / "geography"
    if not geography_dir.exists():
        return

    # Look for villages.geojson in state/district directories
    for vfile in geography_dir.glob("*/*/villages.geojson"):
        try:
            content = json.loads(vfile.read_text(encoding="utf-8"))
            for feature in content.get("features", []):
                p = feature.get("properties", {})
                coords = feature.get("geometry", {}).get("coordinates", [0.0, 0.0])
                lon, lat = coords[0], coords[1]
                vid = p.get("village_id")
                if not vid:
                    continue

                terrain = PhysicalTerrainAttributes(
                    elevation_m=float(p.get("elevation_m", 45.0)),
                    slope_gradient_pct=float(p.get("slope_gradient_pct", 0.5)),
                    drainage_capacity_score=float(p.get("drainage_capacity_score", 0.3)),
                    soil_texture=p.get("soil_texture", "Alluvial"),
                    river_proximity_km=float(p.get("river_proximity_km", 2.0)),
                    dominant_crop=p.get("dominant_crop", "Paddy (Rice)"),
                    crop_flood_susceptibility=float(p.get("crop_flood_susceptibility", 0.8)),
                )

                config = PilotVillageConfig(
                    village_id=vid,
                    village_name=p.get("village_name", vid),
                    district=p.get("district", "Unknown"),
                    state=p.get("state", "Unknown"),
                    latitude=lat,
                    longitude=lon,
                    terrain=terrain,
                    data_type=p.get("data_type", "REAL_PILOT"),
                    block_name=p.get("block_name"),
                    nearest_river=p.get("nearest_river"),
                    notes=p.get("notes"),
                )
                PILOT_LOCATIONS[vid] = config
        except Exception:
            pass


# Automatically initialize real pilot villages on import
_load_real_pilot_villages_from_geojson()


def get_pilot_village(village_id: str) -> PilotVillageConfig:
    """Retrieve pilot village configuration by ID."""
    if village_id not in PILOT_LOCATIONS:
        raise KeyError(f"Pilot village '{village_id}' not found in registry.")
    return PILOT_LOCATIONS[village_id]


def list_pilot_villages(
    state: Optional[str] = None,
    district: Optional[str] = None,
) -> List[PilotVillageConfig]:
    """List pilot villages, optionally filtered by state or district."""
    villages = list(PILOT_LOCATIONS.values())
    if state:
        villages = [v for v in villages if v.state.lower() == state.lower()]
    if district:
        villages = [v for v in villages if v.district.lower() == district.lower()]
    return villages


def load_district_geojson(state: str = "bihar", district: str = "darbhanga") -> Dict[str, Any]:
    """Load official GeoJSON boundary for target district."""
    data_dir = _get_data_dir()
    filepath = data_dir / "geography" / state.lower() / district.lower() / "district.geojson"
    if not filepath.exists():
        raise FileNotFoundError(f"District GeoJSON not found at: {filepath}")
    return json.loads(filepath.read_text(encoding="utf-8"))


def load_district_villages_geojson(state: str = "bihar", district: str = "darbhanga") -> Dict[str, Any]:
    """Load GeoJSON FeatureCollection of operational village clusters in target district."""
    data_dir = _get_data_dir()
    filepath = data_dir / "geography" / state.lower() / district.lower() / "villages.geojson"
    if not filepath.exists():
        raise FileNotFoundError(f"Villages GeoJSON not found at: {filepath}")
    return json.loads(filepath.read_text(encoding="utf-8"))


def get_pilot_metadata(state: str = "bihar", district: str = "darbhanga") -> Dict[str, Any]:
    """Load metadata profile for pilot district."""
    data_dir = _get_data_dir()
    filepath = data_dir / "geography" / state.lower() / district.lower() / "metadata.json"
    if not filepath.exists():
        raise FileNotFoundError(f"District metadata not found at: {filepath}")
    return json.loads(filepath.read_text(encoding="utf-8"))


def get_primary_pilot_district() -> Dict[str, Any]:
    """Return primary pilot district summary and metadata."""
    meta = get_pilot_metadata(state="bihar", district="darbhanga")
    villages = list_pilot_villages(state="Bihar", district="Darbhanga")
    return {
        "pilot_district": "Darbhanga",
        "pilot_state": "Bihar",
        "pilot_role": "PRIMARY_CASE_STUDY",
        "metadata": meta,
        "monitored_clusters_count": len(villages),
        "monitored_clusters": [v.model_dump() if hasattr(v, "model_dump") else v.dict() for v in villages],
    }

