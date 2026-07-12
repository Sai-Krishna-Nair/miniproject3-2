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
from app.dependencies import get_supabase, get_model, draw_annotations, upload_image, generate_filename, validate_image_upload


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

def find_duplicate_report(latitude: float, longitude: float) -> Optional[dict]:
    """
    Finds a pending report within GEOFENCE_RADIUS_METERS.
    Returns the report row dict (including id and priority) or None.
    """
    delta = 0.0002  # ~22m bounding box
    sb = get_supabase()

    response = (
        sb.table("reports")
        .select("id, latitude, longitude, priority, before_image_url")
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
            return row
    return None


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
    contents = await validate_image_upload(image, label="Pothole image")

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

    # 2. Geofence check / priority increment
    sb = get_supabase()
    duplicate = find_duplicate_report(latitude, longitude)
    if duplicate:
        # Pothole already reported! Increment priority by 1 safely
        duplicate_id = duplicate.get("id")
        if duplicate_id:
            current_priority = duplicate.get("priority", 1) or 1
            new_priority = current_priority + 1
            try:
                sb.table("reports").update({
                    "priority": new_priority
                }).eq("id", duplicate_id).execute()
            except Exception as e:
                print(f"Error escalating duplicate report priority: {e}")
        
        return {
            "success": False,
            "error": "Pothole already exists nearby. Pothole priority escalated.",
            "status_code": 409,
        }

    # 3. Annotate + upload
    annotated_bytes = draw_annotations(results)
    file_ext = os.path.splitext(image.filename or "img.jpg")[1] or ".jpg"
    file_name = generate_filename(extension=file_ext)
    public_url = upload_image(settings.POTHOLE_IMAGES_BUCKET, file_name, annotated_bytes, "image/jpeg")

    # 4. Insert DB row
    report_id = str(uuid.uuid4())
    sb.table("reports").insert({
        "id": report_id,
        "reported_by": user_id,
        "latitude": latitude,
        "longitude": longitude,
        "status": "pending",
        "before_image_url": public_url,
        "priority": 1,
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

    contents = await validate_image_upload(image, label="Resolution image")

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

    # Map user IDs to full names to display names instead of UUIDs
    try:
        profiles_resp = sb.table("profiles").select("id, full_name").execute()
        profile_map = {row["id"]: row["full_name"] for row in profiles_resp.data}
        for row in all_records:
            row["reporter_name"] = profile_map.get(row.get("reported_by"), "Unknown Citizen")
            if row.get("resolved_by"):
                row["resolver_name"] = profile_map.get(row.get("resolved_by"), "Unknown Authority")
    except Exception as e:
        print(f"Error fetching profiles map: {e}")
        for row in all_records:
            row["reporter_name"] = "Unknown Citizen"
            row["resolver_name"] = "Unknown Authority"

    return {"success": True, "count": len(all_records), "data": all_records}


def get_single_report(report_id: str) -> dict:
    """Fetch a single report by ID, attaching reporter and resolver names."""
    sb = get_supabase()
    response = sb.table("reports").select("*").eq("id", report_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Report not found.")
    
    report = response.data[0]
    
    # Attach reporter name
    reporter_id = report.get("reported_by")
    if reporter_id:
        try:
            prof_resp = sb.table("profiles").select("full_name").eq("id", reporter_id).execute()
            report["reporter_name"] = prof_resp.data[0].get("full_name", "Unknown Citizen") if prof_resp.data else "Unknown Citizen"
        except Exception:
            report["reporter_name"] = "Unknown Citizen"
    else:
        report["reporter_name"] = "System"

    # Attach resolver name
    resolver_id = report.get("resolved_by")
    if resolver_id:
        try:
            prof_resp = sb.table("profiles").select("full_name").eq("id", resolver_id).execute()
            report["resolver_name"] = prof_resp.data[0].get("full_name", "Unknown Authority") if prof_resp.data else "Unknown Authority"
        except Exception:
            report["resolver_name"] = "Unknown Authority"
    else:
        report["resolver_name"] = None

    return {"success": True, "data": report}


def get_user_reports(user_id: str) -> dict:
    """Fetch all reports submitted by a specific citizen, attaching names."""
    sb = get_supabase()
    response = (
        sb.table("reports")
        .select("*")
        .eq("reported_by", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    all_records = response.data
    
    try:
        profiles_resp = sb.table("profiles").select("id, full_name").execute()
        profile_map = {row["id"]: row["full_name"] for row in profiles_resp.data}
        for row in all_records:
            row["reporter_name"] = profile_map.get(row.get("reported_by"), "Unknown Citizen")
            if row.get("resolved_by"):
                row["resolver_name"] = profile_map.get(row.get("resolved_by"), "Unknown Authority")
    except Exception:
        for row in all_records:
            row["reporter_name"] = "Unknown Citizen"
            row["resolver_name"] = "Unknown Authority"
            
    return {"success": True, "count": len(all_records), "data": all_records}
