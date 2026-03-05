# backend/auth.py

import os
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import JWTError, jwt

load_dotenv()

# ---------------------------------------------------------------------------
# Config — fail fast at startup if required env vars are missing
# ---------------------------------------------------------------------------

_JWT_SECRET = os.getenv("JWT_SECRET")
_GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

if not _JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not set. Add it to your .env file.\n"
        "Example: JWT_SECRET=your_long_random_secret_here"
    )

if not _GOOGLE_CLIENT_ID:
    raise RuntimeError(
        "GOOGLE_CLIENT_ID is not set. Add it to your .env file.\n"
        "Example: GOOGLE_CLIENT_ID=your_google_client_id_here"
    )

_ALGORITHM = "HS256"
_TOKEN_EXPIRY_HOURS = 24

# ---------------------------------------------------------------------------
# Demo credentials — hardcoded for testing only
# ---------------------------------------------------------------------------

_DEMO_EMAIL = "demo@notesmind.app"
_DEMO_NAME = "Demo User"

# Store as a hash — never compare plain passwords directly
_DEMO_PASSWORD_HASH = hashlib.sha256("notesmind2024".encode()).hexdigest()

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_jwt(email: str, name: str) -> str:
    """
    Issue a signed JWT valid for 24 hours.
    Payload contains email, name, issued-at, and expiry.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "name": name,
        "iat": now,
        "exp": now + timedelta(hours=_TOKEN_EXPIRY_HOURS),
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_ALGORITHM)


def verify_jwt(token: str) -> dict:
    """
    Decode and validate a JWT.
    Raises HTTP 401 if the token is invalid, expired, or tampered.
    Returns the decoded payload dict on success.
    """
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ---------------------------------------------------------------------------
# Google OAuth verification
# ---------------------------------------------------------------------------

def verify_google_token(id_token: str) -> dict:
    """
    Validate a Google id_token by calling Google's servers.
    Returns {"email": str, "name": str} on success.
    Raises HTTP 401 if the token is invalid or from the wrong client.
    """
    try:
        info = google_id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            _GOOGLE_CLIENT_ID,
        )
        return {
            "email": info["email"],
            "name": info.get("name", info["email"].split("@")[0]),
        }
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google token verification failed: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ---------------------------------------------------------------------------
# Demo credential verification
# ---------------------------------------------------------------------------

def verify_demo_credentials(email: str, password: str) -> dict:
    """
    Validate demo email and password.
    Uses constant-time comparison to prevent timing attacks.
    Returns {"email": str, "name": str} on success.
    Raises HTTP 401 on mismatch.
    """
    incoming_hash = hashlib.sha256(password.encode()).hexdigest()

    email_match = hmac.compare_digest(email.strip().lower(), _DEMO_EMAIL)
    password_match = hmac.compare_digest(incoming_hash, _DEMO_PASSWORD_HASH)

    if not (email_match and password_match):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid demo credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {"email": _DEMO_EMAIL, "name": _DEMO_NAME}

# ---------------------------------------------------------------------------
# FastAPI dependency — protects every route that declares it
# ---------------------------------------------------------------------------

_bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer_scheme)],
) -> dict:
    """
    FastAPI dependency. Extracts the Bearer token from the Authorization header,
    validates it, and returns the decoded user payload.

    Usage in any route:
        @app.post("/upload")
        def upload(user: Annotated[dict, Depends(get_current_user)], ...):
            print(user["sub"])   # user's email
            print(user["name"])  # user's display name
    """
    return verify_jwt(credentials.credentials)