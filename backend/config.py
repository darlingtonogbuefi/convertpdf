# backend/config.py

import os


# =========================
# ENV CONFIG VALUES
# =========================

CIAM_TENANT_ID = os.getenv("CIAM_TENANT_ID")

AZURE_SPA_CLIENT_ID = os.getenv("AZURE_SPA_CLIENT_ID")

AZURE_API_CLIENT_ID = os.getenv("AZURE_API_CLIENT_ID")

AZURE_AUTHORITY = os.getenv("AZURE_AUTHORITY")


# =========================
# DERIVED VALUES
# =========================

AUTHORITY = AZURE_AUTHORITY or (
    f"https://cribrciam.ciamlogin.com/{CIAM_TENANT_ID}"
    if CIAM_TENANT_ID else None
)

OPENID_CONFIG_URL = (
    f"{AUTHORITY}/v2.0/.well-known/openid-configuration"
    if AUTHORITY else None
)

EXPECTED_AUDIENCE = AZURE_API_CLIENT_ID


# =========================
# VALIDATION (CALLED AT STARTUP)
# =========================

def validate_settings():
    missing = []

    if not CIAM_TENANT_ID:
        missing.append("CIAM_TENANT_ID")

    if not AZURE_API_CLIENT_ID:
        missing.append("AZURE_API_CLIENT_ID")

    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}"
        )