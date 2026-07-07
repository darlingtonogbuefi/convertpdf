# backend/api/files.py

# backend/api/files.py

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from io import BytesIO
from urllib.parse import unquote, quote
import re

from backend.utils.blob_storage import download_blob_bytes

router = APIRouter()

# ---------------------------------------------------
# FIX: UUID PREFIX REMOVER (DISPLAY ONLY)
# ---------------------------------------------------
UUID_PREFIX_PATTERN = re.compile(
    r"^[0-9a-fA-F]{8}-"
    r"[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{12}-"
)


@router.get("/download")
def download_file(
    container: str,
    blob: str = Query(...)
):
    try:
        # ---------------------------------------------------
        # FIX 1: decode URL-encoded blob path
        # (frontend uses encodeURIComponent)
        # ---------------------------------------------------
        blob = unquote(blob)

        data = download_blob_bytes(container, blob)

        stream = BytesIO(data)

        # ---------------------------------------------------
        # FIX 2: safer filename extraction
        # (handles nested paths correctly)
        # ---------------------------------------------------
        filename = blob.split("/")[-1] if "/" in blob else blob

        # ---------------------------------------------------
        # FIX 3: REMOVE UUID PREFIX (DISPLAY ONLY FIX)
        # ---------------------------------------------------
        filename = UUID_PREFIX_PATTERN.sub("", filename)

        # ---------------------------------------------------
        # FIX 4: RFC-compliant filename encoding
        # (supports spaces, special characters, unicode)
        # ---------------------------------------------------
        safe_filename = quote(filename)

        return StreamingResponse(
            stream,
            media_type="application/octet-stream",
            headers={
                # Standard filename support
                "Content-Disposition": (
                    f'attachment; filename="{filename}"; '
                    f"filename*=UTF-8''{safe_filename}"
                ),

                # Allow frontend JS to read Content-Disposition
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))