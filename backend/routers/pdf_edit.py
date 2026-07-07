# backend/routers/pdf_edit.py

from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from ..services.pdf_edit import get_pdf_text, update_pdf_text
from backend.dependencies.upload_limits import upload_limit_check

import tempfile
import json
import shutil
import os
import logging
import time

logger = logging.getLogger(__name__)

# ✅ NEW IMPORT (storage layer)
from backend.services.storage_service import (
    save_upload_file,
    save_converted_file,
)

router = APIRouter(
    prefix="/pdf-edit",
    tags=["PDF Edit"],
    dependencies=[Depends(upload_limit_check)],
)


@router.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from the uploaded PDF file.
    """
    start_time = time.time()

    logger.info(
        "[PDF_EDIT] Extract started | filename=%s content_type=%s",
        file.filename,
        file.content_type,
    )

    file_bytes = await file.read()

    # ---------------- NEW: store upload (non-blocking) ----------------
    try:
        save_upload_file(file_bytes, file.filename)
    except Exception as e:
        logger.warning(f"[Storage] Upload save failed (ignored): {e}")

    # Use a temporary file safely
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_path = tmp_file.name
        tmp_file.write(file_bytes)

    try:
        # Call service to extract text blocks
        pages = get_pdf_text(tmp_path)

        # ---------------- NEW: store extracted output ----------------
        try:
            json_bytes = json.dumps(pages).encode("utf-8")
            save_converted_file(
                json_bytes,
                file.filename.replace(".pdf", ".json"),
                "pdf-extract",
            )
        except Exception as e:
            logger.warning(f"[Storage] Extract save failed (ignored): {e}")

        logger.info(
            "[PDF_EDIT] Extract completed | filename=%s pages=%s size_bytes=%s duration=%.2fs",
            file.filename,
            len(pages),
            len(file_bytes),
            time.time() - start_time,
        )

        return {"pages": pages}

    except Exception:
        logger.exception(
            "[PDF_EDIT] Extract failed | filename=%s",
            file.filename,
        )
        raise

    finally:
        # Cleanup temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/update")
async def update_text(
    file: UploadFile = File(...),
    updates: str = Form(...),  # Receive JSON string from frontend form
):
    """
    Apply text updates to the uploaded PDF.

    updates: JSON string list of updates, each with text and bbox info.
    """
    start_time = time.time()

    logger.info(
        "[PDF_EDIT] Update started | filename=%s",
        file.filename,
    )

    file_bytes = await file.read()

    # ---------------- NEW: store upload (non-blocking) ----------------
    try:
        save_upload_file(file_bytes, file.filename)
    except Exception as e:
        logger.warning(f"[Storage] Upload save failed (ignored): {e}")

    # Temporary input and output files
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_input_file:
        tmp_input_path = tmp_input_file.name
        tmp_input_file.write(file_bytes)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_output_file:
        tmp_output_path = tmp_output_file.name

    try:
        # Parse updates JSON safely
        try:
            updates_list = json.loads(updates)
        except json.JSONDecodeError:
            logger.warning(
                "[PDF_EDIT] Invalid updates JSON | filename=%s",
                file.filename,
            )
            updates_list = []

        logger.info(
            "[PDF_EDIT] Applying updates | filename=%s update_count=%s",
            file.filename,
            len(updates_list),
        )

        # Apply updates via service
        update_pdf_text(
            tmp_input_path,
            updates_list,
            tmp_output_path,
        )

        # ---------------- NEW: store updated PDF output ----------------
        try:
            with open(tmp_output_path, "rb") as f:
                save_converted_file(
                    f.read(),
                    file.filename.replace(".pdf", "-updated.pdf"),
                    "pdf-edit",
                )
        except Exception as e:
            logger.warning(f"[Storage] Updated PDF save failed (ignored): {e}")

        logger.info(
            "[PDF_EDIT] Update completed | filename=%s update_count=%s duration=%.2fs output=%s",
            file.filename,
            len(updates_list),
            time.time() - start_time,
            tmp_output_path,
        )

        # Return path or URL for frontend
        return JSONResponse({"file_path": tmp_output_path})

    except Exception:
        logger.exception(
            "[PDF_EDIT] Update failed | filename=%s",
            file.filename,
        )
        raise

    finally:
        # Cleanup input file
        if os.path.exists(tmp_input_path):
            os.remove(tmp_input_path)