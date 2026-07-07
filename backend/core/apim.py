#  backend\core\apim.py

import os
import secrets
import logging

from fastapi import Header, HTTPException


logger = logging.getLogger(__name__)


APIM_SECRET = os.environ.get("APIM_SECRET")


async def verify_apim_secret(
    x_apim_secret: str | None = Header(default=None)
):
    """
    Validates that requests come through Azure API Management.

    APIM injects:
        X-APIM-Secret: <shared secret>
    """

    if not APIM_SECRET:
        logger.error(
            "APIM_SECRET environment variable is missing"
        )

        raise HTTPException(
            status_code=500,
            detail="APIM authentication not configured"
        )

    if not x_apim_secret:
        logger.warning(
            "Missing X-APIM-Secret header"
        )

        raise HTTPException(
            status_code=401,
            detail="Missing APIM authentication"
        )

    if not secrets.compare_digest(
        x_apim_secret,
        APIM_SECRET
    ):
        logger.warning(
            "Invalid APIM secret"
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid APIM authentication"
        )

    return True