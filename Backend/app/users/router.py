from fastapi import APIRouter, Depends, UploadFile, File

from app.auth.dependencies import get_current_user, UserPayload
from app.users import service
from app.users.schemas import ProfileResponse, ProfileUpdate


router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(user: UserPayload = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return service.get_profile(user.user_id)


@router.patch("/me", response_model=ProfileResponse)
def update_my_profile(
    data: ProfileUpdate,
    user: UserPayload = Depends(get_current_user),
):
    """Update name / phone on the authenticated user's profile."""
    return service.update_profile(user.user_id, data)


@router.post("/me/avatar")
async def upload_my_avatar(
    image: UploadFile = File(...),
    user: UserPayload = Depends(get_current_user),
):
    """Upload or replace the authenticated user's profile picture."""
    url = await service.upload_avatar(user.user_id, image)
    return {"success": True, "avatar_url": url}
