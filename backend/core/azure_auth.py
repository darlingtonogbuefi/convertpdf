# backend/core/azure_auth.py

from backend import config


# Use everything via config.*
AUTHORITY = config.AUTHORITY
OPENID_CONFIG_URL = config.OPENID_CONFIG_URL
EXPECTED_AUDIENCE = config.EXPECTED_AUDIENCE


# Optional reference if needed elsewhere
CIAM_TENANT_ID = config.CIAM_TENANT_ID
AZURE_API_CLIENT_ID = config.AZURE_API_CLIENT_ID
AZURE_SPA_CLIENT_ID = config.AZURE_SPA_CLIENT_ID