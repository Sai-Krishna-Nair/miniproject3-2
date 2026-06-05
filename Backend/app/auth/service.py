import jwt
from fastapi import HTTPException

from app.config import settings

# Cache the PyJWKClient instance to avoid recreating it on every request
_jwks_client = None


def get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        # Construct the standard Supabase JWKS endpoint
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = jwt.PyJWKClient(jwks_url)
    return _jwks_client


def verify_supabase_jwt(token: str) -> dict:
    """
    Decode and validate a Supabase-issued JWT.

    Returns the full payload on success.
    Raises HTTPException(401) on any failure.

    Supports both symmetric (HS256) and asymmetric (ES256, RS256) algorithms.
    Asymmetric keys are retrieved dynamically from the Supabase JWKS endpoint.
    """
    try:
        # Inspect the JWT header to determine the signing algorithm
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "HS256":
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # Asymmetric key verification using JWKS
            jwks_client = get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience.")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

