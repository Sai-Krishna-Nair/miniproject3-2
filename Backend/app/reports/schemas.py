from datetime import datetime
from typing import Optional, List, Any

from pydantic import BaseModel


class ReportResponse(BaseModel):
    """Full pothole report as stored in the database."""
    id: str
    reported_by: str
    latitude: float
    longitude: float
    status: str  # "pending" or "fixed"
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class ReportListResponse(BaseModel):
    """Wrapper for paginated/filtered report lists."""
    success: bool = True
    count: int
    data: List[ReportResponse]


class SubmitReportResponse(BaseModel):
    """Response after successfully submitting a pothole report."""
    success: bool = True
    message: str
    report_id: str
    detections: List[Any]
    annotated_image_url: str


class ResolveReportResponse(BaseModel):
    """Response after successfully resolving a pothole."""
    success: bool = True
    message: str
