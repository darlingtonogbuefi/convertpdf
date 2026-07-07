# backend/dependencies/auth.py

from fastapi import Request, HTTPException

from backend.core.jwt import verify_azure_token, TokenError


# ===================================================
# STRICT AUTH (EXISTING - KEEP FOR SECURE ROUTES)
# ===================================================
async def get_current_user(request: Request):
    auth = request.headers.get("Authorization")

    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing token",
        )

    token = auth.split(" ", 1)[1]

    try:
        payload = await verify_azure_token(token)

        # ✅ Normalized user object (safe for your app)
        return {
            "id": payload.get("oid"),  # Azure AD user ID (PRIMARY KEY)
            "email": payload.get("preferred_username") or payload.get("upn"),
            "name": payload.get("name"),
            "raw": payload,  # optional debugging / future use
        }

    except TokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )


# ===================================================
# OPTIONAL AUTH (NEW - SUPPORTS ANONYMOUS USERS)
# ===================================================
async def get_current_user_optional(request: Request):
    auth = request.headers.get("Authorization")

    # ✅ allow anonymous access
    if not auth or not auth.startswith("Bearer "):
        return None

    token = auth.split(" ", 1)[1]

    try:
        payload = await verify_azure_token(token)

        return {
            "id": payload.get("oid"),
            "email": payload.get("preferred_username") or payload.get("upn"),
            "name": payload.get("name"),
            "raw": payload,
        }

    except TokenError:
        # treat invalid token as anonymous (safe fallback for hybrid mode)
        return None