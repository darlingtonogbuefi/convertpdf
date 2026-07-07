# backend\dependencies\upload_limits.py


from fastapi import Depends, Request, HTTPException
from backend.dependencies.user import get_optional_user

ANON_LIMIT = 1 * 1024 * 1024
AUTH_LIMIT = 50 * 1024 * 1024


async def upload_limit_check(
    request: Request,
    current_user=Depends(get_optional_user),
):
    limit = AUTH_LIMIT if current_user else ANON_LIMIT

    # 🔥 SAFE ASGI content length access
    content_length = request.scope.get("content_length")

    if content_length is None:
        return  # allow streaming uploads

    try:
        size = int(content_length)
    except (TypeError, ValueError):
        return

    if size > limit:
        raise HTTPException(
            status_code=413,
            detail=f"Max upload size is {limit // (1024 * 1024)}MB",
        )