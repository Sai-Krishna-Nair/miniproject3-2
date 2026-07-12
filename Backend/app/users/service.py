import os
import uuid
from datetime import datetime, timezone

from fastapi import UploadFile, HTTPException

from app.dependencies import get_supabase, upload_image, validate_image_upload
from app.config import settings
from app.users.schemas import ProfileUpdate


def get_profile(user_id: str) -> dict:
    """Fetch a user's profile row from the profiles table."""
    sb = get_supabase()
    response = sb.table("profiles").select("*").eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return response.data[0]


def update_profile(user_id: str, data: ProfileUpdate) -> dict:
    """
    Update allowed fields on the user's profile.
    Only sends non-None fields to the database.
    """
    sb = get_supabase()

    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        sb.table("profiles")
        .update(update_data)
        .eq("id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return response.data[0]


async def upload_avatar(user_id: str, image: UploadFile) -> str:
    """
    Upload a profile picture to the 'avatars' bucket.
    Updates the avatar_url in the profiles table and returns the public URL.
    """
    contents = await validate_image_upload(image, label="Avatar image")

    file_ext = os.path.splitext(image.filename or "avatar.jpg")[1] or ".jpg"
    file_name = f"{user_id}_{uuid.uuid4()}{file_ext}"

    public_url = upload_image(
        bucket=settings.AVATARS_BUCKET,
        file_name=file_name,
        data=contents,
        content_type=image.content_type or "image/jpeg",
    )

    # Update profile row
    sb = get_supabase()
    sb.table("profiles").update({
        "avatar_url": public_url,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", user_id).execute()

    return public_url
