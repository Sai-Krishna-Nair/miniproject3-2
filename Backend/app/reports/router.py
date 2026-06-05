from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, Path, Query, HTTPException
from fastapi.responses import JSONResponse

from app.auth.dependencies import get_current_user, require_citizen, require_authority, UserPayload
from app.reports import service


router = APIRouter(prefix="/api/v1", tags=["Reports"])


# ==========================================
# POST /api/v1/reports  — Citizen submit
# ==========================================
@router.post("/reports")
async def submit_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(...),
    user: UserPayload = Depends(require_citizen),
):
    """
    Submit a new pothole report.

    - Only citizens can submit reports.
    - user_id is extracted from the JWT (no form field needed).
    - Image is AI-verified before the report is accepted.
    - Geofence deduplication prevents duplicate reports within 10m.
    """
    try:
        result = await service.submit_report(
            user_id=user.user_id,
            latitude=latitude,
            longitude=longitude,
            image=image,
        )

        if not result["success"]:
            return JSONResponse(
                status_code=result.get("status_code", 400),
                content={"success": False, "error": result["error"]},
            )

        return JSONResponse(status_code=200, content=result)

    except Exception as e:
        print(f"Submit error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


# ==========================================
# POST /api/v1/reports/{report_id}/resolve  — Authority resolve
# ==========================================
@router.post("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: str = Path(...),
    image: UploadFile = File(...),
    user: UserPayload = Depends(require_authority),
):
    """
    Resolve a pending pothole report.

    - Only authorities can resolve reports.
    - The after-image must pass AI verification (zero potholes detected).
    - Records which authority resolved it and when.
    """
    try:
        result = await service.resolve_report(
            report_id=report_id,
            authority_user_id=user.user_id,
            image=image,
        )

        if not result["success"]:
            return JSONResponse(
                status_code=result.get("status_code", 400),
                content={k: v for k, v in result.items() if k != "status_code"},
            )

        return JSONResponse(status_code=200, content=result)

    except Exception as e:
        print(f"Resolve error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


# ==========================================
# GET /api/v1/reports  — List all reports
# ==========================================
@router.get("/reports")
def get_reports(
    status: Optional[str] = Query(None, description="Filter by status: 'pending' or 'fixed'"),
    lat: Optional[float] = Query(None, description="Latitude for center of radius filter"),
    lng: Optional[float] = Query(None, description="Longitude for center of radius filter"),
    radius: Optional[float] = Query(None, description="Radius in meters"),
    user: UserPayload = Depends(get_current_user),
):
    """Fetch reports with optional status and geospatial filters. Requires authentication."""
    try:
        return service.get_reports(status=status, lat=lat, lng=lng, radius=radius)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database fetch failed: {str(e)}")


# ==========================================
# GET /api/v1/reports/{report_id}  — Single report
# ==========================================
@router.get("/reports/{report_id}")
def get_single_report(
    report_id: str = Path(...),
    user: UserPayload = Depends(get_current_user),
):
    """Fetch a single report by ID. Requires authentication."""
    return service.get_single_report(report_id)


# ==========================================
# GET /api/v1/users/me/reports  — Citizen's own reports
# ==========================================
@router.get("/users/me/reports")
def get_my_reports(user: UserPayload = Depends(require_citizen)):
    """Fetch all reports submitted by the authenticated citizen."""
    try:
        return service.get_user_reports(user.user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user reports: {str(e)}")
