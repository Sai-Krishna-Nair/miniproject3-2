from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user, UserPayload
from app.dependencies import get_supabase


router = APIRouter(prefix="/api/v1/stats", tags=["Dashboard"])


@router.get("/dashboard")
def get_dashboard_metrics(user: UserPayload = Depends(get_current_user)):
    """
    Global high-level metrics for the dashboard.
    Accessible by both citizens and authorities.
    """
    try:
        sb = get_supabase()
        response = sb.table("reports").select("status").execute()
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
        raise HTTPException(status_code=500, detail=f"Failed to aggregate statistics: {str(e)}")
