# backend\routers\pdf_workflow.py


import base64
import logging
import time
from pathlib import Path

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies.auth import get_current_user_optional
from backend.services.storage_service import (
    save_converted_file,
    save_upload_file
)
from backend.services.conversion_logger import log_conversion

from backend.models.conversion import Conversion

router = APIRouter(
    prefix="/api/pdf-workflow",
    tags=["PDF Workflow"],
)

# =========================================================
# REQUEST MODEL
# =========================================================
class PdfWorkflowSaveRequest(BaseModel):
    filename: str
    file_base64: str
    action: str  # upload | edit | sign | stamp
    document_id: str


# =========================================================
# TOOL MAP (STRICT + SAFE)
# =========================================================
TOOL_MAP = {
    "edit": "pdf-edit",
    "sign": "pdf-sign",
    "stamp": "pdf-stamp",
}


# =========================================================
# SAVE ENDPOINT
# =========================================================
@router.post("/save")
async def save_pdf_workflow(
    payload: PdfWorkflowSaveRequest,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):

    # -------------------------
    # START TIMER
    # -------------------------
    start_time = time.perf_counter()

    # -------------------------
    # Decode base64
    # -------------------------
    try:
        file_bytes = base64.b64decode(payload.file_base64.split(",")[-1])
    except Exception as e:
        logging.error(f"Base64 decode failed: {e}")
        return {"success": False, "error": "Invalid base64"}

    # =========================================================
    # ✅ FIX: use frontend filename exactly as provided
    # =========================================================
    filename = payload.filename or "document.pdf"

    # =========================================================
    # STRICT VALIDATION (prevents misrouting)
    # =========================================================
    VALID_ACTIONS = ["upload", "edit", "sign", "stamp"]

    if payload.action not in VALID_ACTIONS:
        logging.error(f"Unknown action received: {payload.action}")
        return {"success": False, "error": "Invalid action"}

    # =========================================================
    # STORAGE METADATA
    # =========================================================
    original_blob_path = None
    converted_blob_path = None

    # =========================================================
    # DUPLICATE PREVENTION (UPLOAD ONLY)
    # =========================================================
    if payload.action == "upload":
        existing_document = (
            db.query(Conversion)
            .filter(Conversion.document_id == payload.document_id)
            .first()
        )

        if existing_document:
            return {
                "success": True,
                "message": "Document already exists",
                "document_id": payload.document_id,
            }

    # =========================================================
    # 1. UPLOAD FLOW
    # =========================================================
    if payload.action == "upload":
        try:
            original_blob_path = save_upload_file(
                file_bytes,
                filename,
                "raw"
            )
        except Exception as e:
            logging.error(f"Upload storage failed: {e}")

    # =========================================================
    # 2. WORKFLOW FLOWS (EDIT / SIGN / STAMP)
    # =========================================================
    else:
        try:
            resolved_tool = TOOL_MAP[payload.action]
            tool_folder = resolved_tool

            # =====================================================
            # FIX: keep storage filename consistent with frontend
            # NO suffix injection anymore
            # =====================================================
            converted_blob_path = save_converted_file(
                file_bytes,
                filename,
                tool_folder
            )

        except Exception as e:
            logging.error(f"Converted storage failed: {e}")

    # =========================================================
    # FINAL FILE RESOLUTION
    # =========================================================
    final_blob_path = converted_blob_path or original_blob_path

    output_filename = filename

    # =========================================================
    # DURATION
    # =========================================================
    duration_ms = int((time.perf_counter() - start_time) * 1000)

    # =========================================================
    # LOGGING (UNCHANGED LOGIC)
    # =========================================================
    try:
        log_conversion(
            db=db,
            user_id=user["id"] if user else None,
            guest_id=request.headers.get("X-Guest-Id"),

            document_id=payload.document_id,

            conversion_type=f"pdf_{payload.action}",
            filename=filename,
            source_format="pdf",
            target_format="pdf",
            input_size_bytes=len(file_bytes),
            output_size_bytes=len(file_bytes),

            original_blob_path=original_blob_path,
            converted_blob_path=converted_blob_path,

            output_filename=output_filename,
            duration_ms=duration_ms,
        )
    except Exception as e:
        logging.error(f"Logging failed: {e}")

    return {
        "success": True,
        "filename": filename,  # ✅ FIX: return real frontend filename
        "action": payload.action,
        "document_id": payload.document_id,
        "original_blob_path": original_blob_path,
        "converted_blob_path": converted_blob_path,
    }