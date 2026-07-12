from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.dependencies import get_supabase

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    invite_code: str = ""           # optional — only needed for authority signup


class RegisterResponse(BaseModel):
    message: str
    role: str
    user_id: str | None = None


@router.post("/register", response_model=RegisterResponse)
async def register(body: RegisterRequest):
    """
    Server-side registration endpoint.

    How the invite-code validation works:
    ──────────────────────────────────────
    1.  The frontend sends {email, password, full_name, invite_code?} to this endpoint.
    2.  This endpoint compares `invite_code` against the AUTHORITY_INVITE_CODE secret
        stored in the backend's .env file (never exposed to the browser).
    3.  If they match  →  role = "authority"
        If blank / wrong →  role = "citizen"
    4.  The validated role is passed into Supabase's sign_up() as user_metadata.
    5.  Two DB triggers fire automatically:
        a) handle_new_user()        — creates a `profiles` row with the role
        b) set_app_metadata_role()  — embeds the role in the JWT's app_metadata
    6.  The response is returned to the frontend, which sets the Supabase session.

    The invite code NEVER appears in the JWT, in user_metadata, or in the database.
    It is only compared in-memory on the server and then discarded.
    """

    # ── 1. Determine role based on invite code ──────────────────────────
    role = "citizen"
    if body.invite_code:
        if not settings.AUTHORITY_INVITE_CODE:
            raise HTTPException(
                status_code=503,
                detail="Authority registration is not configured on this server.",
            )
        if body.invite_code.strip() == settings.AUTHORITY_INVITE_CODE:
            role = "authority"
        else:
            raise HTTPException(
                status_code=403,
                detail="Invalid authority invite code.",
            )

    # ── 2. Create user in Supabase with the validated role ──────────────
    try:
        sb = get_supabase()
        response = sb.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {
                    "role": role,
                    "full_name": body.full_name,
                }
            },
        })
    except Exception as e:
        error_msg = str(e)
        # Surface Supabase-specific messages cleanly
        if "already registered" in error_msg.lower():
            raise HTTPException(status_code=409, detail="A user with this email already exists.")
        raise HTTPException(status_code=400, detail=f"Registration failed: {error_msg}")

    user = response.user
    if not user:
        raise HTTPException(status_code=500, detail="Registration failed — no user returned.")

    return RegisterResponse(
        message=f"Account created as {role}.",
        role=role,
        user_id=user.id,
    )
