import httpx
import jwt
import logging
from jwt import PyJWKClient

from backend.config import (
    OPENID_CONFIG_URL,
    EXPECTED_AUDIENCE,
    AUTHORITY,
)

# ---------------------------------------------------
# LOGGING SETUP
# ---------------------------------------------------
logger = logging.getLogger(__name__)

ALGORITHMS = ["RS256"]


# ---------------------------------------------------
# CUSTOM TOKEN ERROR
# ---------------------------------------------------
class TokenError(Exception):
    """
    Raised when JWT validation fails.
    Used to normalize auth errors across the application.
    """
    pass


# ---------------------------------------------------
# OPENID CONFIG (cached)
# ---------------------------------------------------
_openid_config_cache = None


async def get_openid_config():
    """
    Fetch Azure OpenID configuration (cached).
    """
    global _openid_config_cache

    if _openid_config_cache:
        return _openid_config_cache

    if not OPENID_CONFIG_URL:
        raise TokenError("OPENID_CONFIG_URL is not configured")

    logger.info("Fetching OpenID configuration from Azure")

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(OPENID_CONFIG_URL)
        r.raise_for_status()

        _openid_config_cache = r.json()
        return _openid_config_cache


# ---------------------------------------------------
# JWKS CLIENT (cached)
# ---------------------------------------------------
_jwks_client_cache = None


async def get_jwk_client():
    """
    Creates or returns cached JWKS client.
    """
    global _jwks_client_cache

    if _jwks_client_cache:
        return _jwks_client_cache

    logger.info("Initializing JWKS client")

    config = await get_openid_config()

    jwks_uri = config.get("jwks_uri")
    if not jwks_uri:
        raise TokenError("JWKS URI missing from OpenID configuration")

    _jwks_client_cache = PyJWKClient(jwks_uri)

    return _jwks_client_cache


# ---------------------------------------------------
# JWT VERIFICATION CORE
# ---------------------------------------------------
async def verify_azure_token(token: str):
    """
    Validates Azure AD JWT token.

    Steps:
    1. Fetch JWKS signing key
    2. Fetch OpenID issuer dynamically
    3. Verify token signature
    4. Validate audience + issuer
    5. Return decoded payload
    """
    try:
        jwk_client = await get_jwk_client()

        # STEP 1: signing key from kid
        signing_key = jwk_client.get_signing_key_from_jwt(token)

        logger.debug("JWT signing key resolved successfully")

        # STEP 2: OpenID config (cached, safe reuse)
        config = await get_openid_config()

        # STEP 3: issuer fallback strategy (more robust than OpenID-only)
        expected_issuer = config.get("issuer") or AUTHORITY

        if not expected_issuer:
            raise TokenError("Issuer not available for validation")

        # STEP 4: decode + validate
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=ALGORITHMS,
            audience=EXPECTED_AUDIENCE,
            issuer=expected_issuer,
            options={
                "verify_exp": True,
                "leeway": 30,
            },
        )

        logger.info(
            "JWT verified successfully for oid=%s, aud=%s",
            payload.get("oid"),
            payload.get("aud"),
        )

        return payload

    # ---------------------------------------------------
    # TOKEN EXPIRATION ERROR
    # ---------------------------------------------------
    except jwt.ExpiredSignatureError as e:
        logger.warning("JWT expired: %s", str(e))
        raise TokenError(f"Token expired: {str(e)}")

    # ---------------------------------------------------
    # INVALID AUDIENCE
    # ---------------------------------------------------
    except jwt.InvalidAudienceError as e:
        logger.warning("JWT invalid audience: %s", str(e))
        raise TokenError(f"Invalid audience: {str(e)}")

    # ---------------------------------------------------
    # INVALID ISSUER
    # ---------------------------------------------------
    except jwt.InvalidIssuerError as e:
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            token_issuer = unverified.get("iss")
        except Exception:
            token_issuer = "unknown"

        logger.warning(
            "JWT invalid issuer. expected=%s got=%s",
            expected_issuer,
            token_issuer,
        )

        raise TokenError(
            f"Invalid issuer: expected={expected_issuer}, got={token_issuer}"
        )

    # ---------------------------------------------------
    # GENERAL JWT FAILURE
    # ---------------------------------------------------
    except jwt.InvalidTokenError as e:
        logger.warning("JWT invalid token: %s", str(e))
        raise TokenError(f"Invalid token: {str(e)}")

    # ---------------------------------------------------
    # UNEXPECTED ERROR
    # ---------------------------------------------------
    except Exception as e:
        logger.error("Unexpected JWT verification error: %s", str(e))
        raise TokenError(str(e))