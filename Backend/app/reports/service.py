import io
import json
import math
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from PIL import Image
from fastapi import UploadFile, HTTPException

from app.config import settings
from app.dependencies import get_supabase, get_model, draw_annotations, upload_image, generate_filename


# ---------------------------------------------------------------------------
# Haversine
# ---------------------------------------------------------------------------

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns distance in meters between two lat/lon points."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Geofence
# ---------------------------------------------------------------------------

def check_geofence(latitude: float, longitude: float) -> bool:
    """
    Returns True if a pending report already exists within GEOFENCE_RADIUS_METERS.
    Uses a bounding-box pre-filter then exact Haversine.
    """
    delta = 0.0002  # ~22m bounding box
    sb = get_supabase()

    response = (
        sb.table("reports")
        .select("latitude, longitude")
        .neq("status", "fixed")
        .gte("latitude", latitude - delta)
        .lte("latitude", latitude + delta)
        .gte("longitude", longitude - delta)
        .lte("longitude", longitude + delta)
        .execute()
    )

    for row in response.data:
        dist = haversine_distance(latitude, longitude, row["latitude"], row["longitude"])
        if dist <= settings.GEOFENCE_RADIUS_METERS:
            return True
    return False


# ---------------------------------------------------------------------------
# Submit report (citizen)
# ---------------------------------------------------------------------------

async def submit_report(
    user_id: str,
    latitude: float,
    longitude: float,
    image: UploadFile,
) -> dict:
    """
    Full submit pipeline:
    1. AI inference — must detect ≥ 1 pothole
    2. Geofence dedup
    3. Annotate + upload image
    4. Insert DB row
    """
    contents = await image.read()

    # 1. AI inference
    img = Image.open(io.BytesIO(contents))
    model = get_model()
    results = model(img)
    detections = json.loads(results[0].to_json())

    if not detections:
        return {
            "success": False,
            "error": "No pothole detected. Please retake the photo.",
            "status_code": 400,
        }

    # 2. Geofence check
    if check_geofence(latitude, longitude):
        return {
            "success": False,
            "error": "A report already exists within 10 metres of this location.",
            "status_code": 409,
        }

    # 3. Annotate + upload
    annotated_bytes = draw_annotations(results)
    file_ext = os.path.splitext(image.filename or "img.jpg")[1] or ".jpg"
    file_name = generate_filename(extension=file_ext)
    public_url = upload_image(settings.POTHOLE_IMAGES_BUCKET, file_name, annotated_bytes, "image/jpeg")

    # 4. Insert DB row
    report_id = str(uuid.uuid4())
    sb = get_supabase()
    sb.table("reports").insert({
        "id": report_id,
        "reported_by": user_id,
        "latitude": latitude,
        "longitude": longitude,
        "status": "pending",
        "before_image_url": public_url,
    }).execute()

    return {
        "success": True,
        "message": "Pothole verified and logged.",
        "report_id": report_id,
        "detections": detections,
        "annotated_image_url": public_url,
    }


# ---------------------------------------------------------------------------
# Resolve report (authority)
# ---------------------------------------------------------------------------

async def resolve_report(
    report_id: str,
    authority_user_id: str,
    image: UploadFile,
) -> dict:
    """
    Full resolve pipeline:
    1. Check report exists and is pending
    2. AI inference — must detect 0 potholes
    3. Upload after image
    4. Update DB with fixed status + resolved_by
    """
    sb = get_supabase()

    # 1. Validate report
    existing = sb.table("reports").select("id, status").eq("id", report_id).execute()
    if not existing.data:
        return {"success": False, "error": "Report not found.", "status_code": 404}
    if existing.data[0]["status"] == "fixed":
        return {"success": False, "error": "Report already marked as fixed.", "status_code": 409}

    contents = await image.read()

    # 2. AI inference — must detect ZERO potholes
    img = Image.open(io.BytesIO(contents))
    model = get_model()
    results = model(img)
    detections = json.loads(results[0].to_json())

    if detections:
        return {
            "success": False,
            "error": "Pothole still detected. Repair not verified.",
            "detections": detections,
            "status_code": 400,
        }

    # 3. Upload after image
    file_ext = os.path.splitext(image.filename or "img.jpg")[1] or ".jpg"
    file_name = generate_filename(prefix="after_", extension=file_ext)
    public_url = upload_image(
        settings.POTHOLE_IMAGES_BUCKET,
        file_name,
        contents,
        image.content_type or "image/jpeg",
    )

    # 4. Update DB
    sb.table("reports").update({
        "status": "fixed",
        "after_image_url": public_url,
        "resolved_by": authority_user_id,
        "resolved_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", report_id).execute()

    return {"success": True, "message": "Repair verified. Status updated to fixed."}


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

def get_reports(
    status: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = None,
) -> dict:
    """Fetch reports with optional status and geospatial filters."""
    sb = get_supabase()
    query = sb.table("reports").select("*")

    if status:
        query = query.eq("status", status)

    if lat is not None and lng is not None and radius is not None:
        lat_delta = radius / 111000.0
        lng_delta = radius / (111000.0 * math.cos(math.radians(lat)))
        query = (
            query
            .gte("latitude", lat - lat_delta)
            .lte("latitude", lat + lat_delta)
            .gte("longitude", lng - lng_delta)
            .lte("longitude", lng + lng_delta)
        )

    response = query.order("created_at", desc=True).execute()
    all_records = response.data

    # Refine to strict circle with Haversine
    if lat is not None and lng is not None and radius is not None:
        all_records = [
            row for row in all_records
            if haversine_distance(lat, lng, row["latitude"], row["longitude"]) <= radius
        ]

    return {"success": True, "count": len(all_records), "data": all_records}


def get_single_report(report_id: str) -> dict:
    """Fetch a single report by ID."""
    sb = get_supabase()
    response = sb.table("reports").select("*").eq("id", report_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {"success": True, "data": response.data[0]}


def get_user_reports(user_id: str) -> dict:
    """Fetch all reports submitted by a specific citizen."""
    sb = get_supabase()
    response = (
        sb.table("reports")
        .select("*")
        .eq("reported_by", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "count": len(response.data), "data": response.data}
