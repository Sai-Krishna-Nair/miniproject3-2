from dataclasses import dataclass
from typing import Union

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.service import verify_supabase_jwt

# Swagger UI interactive security scheme
security = HTTPBearer(auto_error=True)


@dataclass
class UserPayload:
    """Typed representation of the authenticated user extracted from the JWT."""
    user_id: str
    email: str
    role: str  # "citizen" or "authority"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserPayload:
    """
    FastAPI dependency that extracts and validates the JWT from the
    Authorization header. Supports native FastAPI HTTPBearer scheme
    and raw string inputs for backward-compatible unit tests.
    """
    if isinstance(credentials, str):
        # Backward compatibility for direct calls in unit tests
        if not credentials.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authorization header must start with 'Bearer '.")
        token = credentials[len("Bearer "):]
    else:
        # Production FastAPI dependency injection
        token = credentials.credentials

    payload = verify_supabase_jwt(token)

    # Supabase stores user_id in 'sub', email at top level,
    # and custom role in app_metadata (set by our DB trigger).
    user_id = payload.get("sub")
    email = payload.get("email", "")
    app_metadata = payload.get("app_metadata", {})
    role = app_metadata.get("role", "")

    # Fallback: if the trigger hasn't run yet, check user_metadata
    if not role:
        user_metadata = payload.get("user_metadata", {})
        role = user_metadata.get("role", "")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload: missing user ID.")
    if role not in ("citizen", "authority"):
        raise HTTPException(status_code=403, detail=f"Unknown role: '{role}'. Expected 'citizen' or 'authority'.")

    return UserPayload(user_id=user_id, email=email, role=role)


def require_citizen(user: UserPayload = Depends(get_current_user)) -> UserPayload:
    """Dependency guard — only citizens may call this endpoint."""
    if user.role != "citizen":
        raise HTTPException(
            status_code=403,
            detail="Only citizens can perform this action.",
        )
    return user


def require_authority(user: UserPayload = Depends(get_current_user)) -> UserPayload:
    """Dependency guard — only authorities may call this endpoint."""
    if user.role != "authority":
        raise HTTPException(
            status_code=403,
            detail="Only authorities can perform this action.",
        )
    return user
