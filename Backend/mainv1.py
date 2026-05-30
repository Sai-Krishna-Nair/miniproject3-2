import os
import io
import uuid
import json
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Path, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from ultralytics import YOLO
from PIL import Image, ImageDraw
import math

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()
model = YOLO("best_pothole1.pt")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEOFENCE_RADIUS_METERS = 10


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns distance in meters between two lat/lon points."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def check_geofence(latitude: float, longitude: float) -> bool:
    """
    Returns True if a pending/active report already exists within GEOFENCE_RADIUS_METERS.
    Pulls nearby rows using a bounding-box pre-filter, then does exact Haversine in Python.
    Adjust the degree delta (~0.0001° ≈ 11m) to keep the DB scan tight.
    """
    delta = 0.0002  # ~22m bounding box — generous enough to catch 10m radius
    response = (
        supabase.table("reports")
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
        if dist <= GEOFENCE_RADIUS_METERS:
            return True
    return False


def draw_annotations(results) -> bytes:
    """Use YOLO's built-in renderer — same as result.save()"""
    annotated_array = results[0].plot()  # returns numpy array (BGR)
    # convert BGR numpy → RGB PIL → JPEG bytes
    img = Image.fromarray(annotated_array[..., ::-1])  # BGR to RGB
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def upload_image(bucket: str, file_name: str, data: bytes, content_type: str) -> str:
    supabase.storage.from_(bucket).upload(
        path=file_name,
        file=data,
        file_options={"content-type": content_type},
    )
    return supabase.storage.from_(bucket).get_public_url(file_name)


# ==========================================
# POST /api/v1/reports  — Citizen submit
# ==========================================
@app.post("/api/v1/reports")
async def submit_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    user_id: str = Form(...),
    image: UploadFile = File(...),
):
    contents = await image.read()

    # 1. AI inference
    img = Image.open(io.BytesIO(contents))
    results = model(img)
    detections = json.loads(results[0].to_json())

    if not detections:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "No pothole detected. Please retake the photo."},
        )

    # 2. Geofence check
    if check_geofence(latitude, longitude):
        return JSONResponse(
            status_code=409,
            content={"success": False, "error": "A report already exists within 10 metres of this location."},
        )

    # 3. Annotate image and upload
    annotated_bytes = draw_annotations(results)
    file_ext = os.path.splitext(image.filename)[1] or ".jpg"
    file_name = f"{uuid.uuid4()}{file_ext}"
    public_url = upload_image("pothole-images", file_name, annotated_bytes, "image/jpeg")

    # 4. Insert DB row
    report_id = str(uuid.uuid4())
    supabase.table("reports").insert({
        "id": report_id,
        "reported_by": user_id,
        "latitude": latitude,
        "longitude": longitude,
        "status": "pending",
        "before_image_url": public_url,
    }).execute()

    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Pothole verified and logged.",
            "report_id": report_id,
            "detections": detections,
            "annotated_image_url": public_url,
        },
    )


# ==========================================
# POST /api/v1/reports/{report_id}/resolve  — Authority resolve
# ==========================================
@app.post("/api/v1/reports/{report_id}/resolve")
async def resolve_report(
    report_id: str = Path(...),
    image: UploadFile = File(...),
):
    # 1. Check the report exists
    existing = supabase.table("reports").select("id, status").eq("id", report_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Report not found.")
    if existing.data[0]["status"] == "fixed":
        return JSONResponse(
            status_code=409,
            content={"success": False, "error": "Report already marked as fixed."},
        )

    contents = await image.read()

    # 2. AI inference — must detect ZERO potholes to pass
    img = Image.open(io.BytesIO(contents))
    results = model(img)
    detections = json.loads(results[0].to_json())

    if detections:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Pothole still detected. Repair not verified.",
                "detections": detections,
            },
        )

    # 3. Upload after image (plain, no annotations)
    file_ext = os.path.splitext(image.filename)[1] or ".jpg"
    file_name = f"after_{uuid.uuid4()}{file_ext}"
    public_url = upload_image("pothole-images", file_name, contents, image.content_type or "image/jpeg")

    # 4. Update DB
    supabase.table("reports").update({
        "status": "fixed",
        "after_image_url": public_url,
    }).eq("id", report_id).execute()

    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Repair verified. Status updated to fixed."},
    )
    
    
    
    
    
    
    
    
    
    
    
    # =========================================================================
# GET /api/v1/reports  — Fetch reports with optional geospatial/status filters
# =========================================================================
@app.get("/api/v1/reports")
def get_reports(
    status: str = Query(None, description="Filter by status: 'pending' or 'fixed'"),
    lat: float = Query(None, description="Latitude for center of map radius filter"),
    lng: float = Query(None, description="Longitude for center of map radius filter"),
    radius: float = Query(None, description="Radius distance in meters to sweep around lat/lng"),
):
    try:
        query = supabase.table("reports").select("*")
        
        if status:
            query = query.eq("status", status)

        # Apply spatial bounding-box optimization filter if geographical parameters are present
        if lat is not None and lng is not None and radius is not None:
            # Approximate conversions: 1° latitude ≈ 111,000 meters
            lat_delta = radius / 111000.0
            # 1° longitude ≈ 111,000 meters * cos(latitude)
            lng_delta = radius / (111000.0 * math.cos(math.radians(lat)))

            query = (
                query.gte("latitude", lat - lat_delta)
                .lte("latitude", lat + lat_delta)
                .gte("longitude", lng - lng_delta)
                .lte("longitude", lng + lng_delta)
            )

        response = query.order("created_at", desc=True).execute()
        all_records = response.data

        # Refine down to a strict circle using exact Haversine formulas
        if lat is not None and lng is not None and radius is not None:
            filtered_records = []
            for row in all_records:
                distance = haversine_distance(lat, lng, row["latitude"], row["longitude"])
                if distance <= radius:
                    filtered_records.append(row)
            return {"success": True, "count": len(filtered_records), "data": filtered_records}

        return {"success": True, "count": len(all_records), "data": all_records}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database fetch failed: {str(e)}")


# =========================================================================
# GET /api/v1/reports/{report_id}  — Single report detailed profile
# =========================================================================
@app.get("/api/v1/reports/{report_id}")
def get_single_report(report_id: str = Path(...)):
    try:
        response = supabase.table("reports").select("*").eq("id", report_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Requested pothole report record not found.")
        return {"success": True, "data": response.data[0]}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================================
# GET /api/v1/users/{user_id}/reports  — Personal Citizen Dashboard View
# =========================================================================
@app.get("/api/v1/users/{user_id}/reports")
def get_user_contributions(user_id: str = Path(...)):
    try:
        response = (
            supabase.table("reports")
            .select("*")
            .eq("reported_by", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"success": True, "count": len(response.data), "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user specific data: {str(e)}")


# =========================================================================
# GET /api/v1/stats/dashboard  — Global Admin High-level Metrics
# =========================================================================
@app.get("/api/v1/stats/dashboard")
def get_dashboard_metrics():
    try:
        # Requesting only the status column to optimize operational bandwidth overhead
        response = supabase.table("reports").select("status").execute()
        records = response.data

        total_reports = len(records)
        pending_repairs = sum(1 for item in records if item["status"] == "pending")
        fixed_repairs = sum(1 for item in records if item["status"] == "fixed")

        repair_rate_percentage = 0.0
        if total_reports > 0:
            repair_rate_percentage = round((fixed_repairs / total_reports) * 100, 2)

        return {
            "success": True,
            "data": {
                "total_reports": total_reports,
                "pending_repairs": pending_repairs,
                "fixed_repairs": fixed_repairs,
                "repair_rate_percentage": repair_rate_percentage,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to aggregate system statistics: {str(e)}")