# backend\middleware\request_timeout.py

import asyncio
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await asyncio.wait_for(
                call_next(request),
                timeout=360
            )
            return response

        except asyncio.TimeoutError:
            return JSONResponse(
                status_code=408,
                content={"detail": "Request timeout (max 3 minutes)"},
            )