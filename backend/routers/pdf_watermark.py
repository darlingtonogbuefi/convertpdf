# backend/routers/pdf_watermark.py

import os
import json
import logging
import uuid
import time
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, UploadFile, File, Form, Depends, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies.upload_limits import upload_limit_check
from backend.dependencies.auth import get_current_user_optional
from backend.services.conversion_logger import log_conversion

from backend.services.pdf_watermark import add_watermark_to_pdf
from backend.schemas.pdf_watermark import (
    TextWatermark,
    ImageWatermark,
    GridOptions,
    InsertOptions
)

from backend.services.storage_service import (
    save_upload_file,
    save_converted_file,
)

from backend.models.conversion import Conversion

router = APIRouter(
    prefix="/api/convert/pdf-watermark",
    tags=["PDF Watermark"]
)


@router.post("")
async def watermark_pdf(
    file: UploadFile = File(...),
    payload: str = Form(...),
    document_id: str | None = Form(None),
    image: UploadFile | None = File(None),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
    _: None = Depends(upload_limit_check),
):
    """
    Apply a text or image watermark to an uploaded PDF.
    """

    # =====================================================
    # START TIMER (FIX ADDED)
    # =====================================================
    start_time = time.perf_counter()

    # Save uploaded PDF
    with NamedTemporaryFile(delete=False, suffix=".pdf") as input_pdf:
        input_pdf.write(await file.read())
        input_pdf_path = input_pdf.name

    # Save optional watermark image
    image_path = None
    if image:
        ext = os.path.splitext(image.filename)[1]

        with NamedTemporaryFile(delete=False, suffix=ext) as img:
            img.write(await image.read())
            image_path = img.name

    # Parse JSON payload
    try:
        payload_data = json.loads(payload)
        watermark_data = payload_data["watermark"]
        placement_data = payload_data["placement"]

    except (json.JSONDecodeError, KeyError):
        return {"error": "Invalid payload structure"}

    # -----------------------------
    # VALIDATE + GENERATE document_id
    # -----------------------------
    if not document_id or document_id == "undefined":
        document_id = str(uuid.uuid4())

    # Build watermark object
    if watermark_data["type"] == "text":
        watermark = TextWatermark(**watermark_data)

    elif watermark_data["type"] == "image":
        watermark = ImageWatermark(**watermark_data)

    else:
        return {"error": "Invalid watermark type"}

    # Build placement object
    if placement_data.get("mode") == "grid":
        placement = GridOptions(**placement_data)
    else:
        placement = InsertOptions(**placement_data)

    # Output file
    output_pdf_path = NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    ).name

    # Run conversion
    add_watermark_to_pdf(
        input_pdf=input_pdf_path,
        output_pdf=output_pdf_path,
        watermark=watermark,
        placement=placement,
        image_path=image_path,
    )

    # =====================================================
    # STORAGE (MATCHES pdf_workflow.py)
    # =====================================================

    tool = "pdf-watermark"

    original_blob_path = None
    converted_blob_path = None

    existing_document = (
        db.query(Conversion)
        .filter(Conversion.document_id == document_id)
        .first()
    )

    # Save original only once per document
    if not existing_document:
        try:
            with open(input_pdf_path, "rb") as f:
                original_blob_path = save_upload_file(
                    f.read(),
                    file.filename,
                    tool,
                )
        except Exception as e:
            logging.warning(f"Upload storage failed: {e}")

    # Save converted file
    try:
        output_name = f"watermarked_{Path(file.filename).stem}.pdf"

        with open(output_pdf_path, "rb") as f:
            converted_blob_path = save_converted_file(
                f.read(),
                output_name,
                tool,
            )

    except Exception as e:
        logging.warning(f"Converted storage failed: {e}")

    # =====================================================
    # LOGGING (FIXED)
    # =====================================================

    try:
        guest_id = request.headers.get("X-Guest-Id")
        user_id = user["id"] if user else None

        output_name = f"watermarked_{Path(file.filename).stem}.pdf"

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        log_conversion(
            db=db,
            user_id=user_id,
            guest_id=guest_id,
            conversion_type="pdf_watermark",
            filename=file.filename,
            output_filename=output_name,
            source_format="pdf",
            target_format="pdf",
            input_size_bytes=os.path.getsize(input_pdf_path),
            output_size_bytes=os.path.getsize(output_pdf_path),
            original_blob_path=original_blob_path,
            converted_blob_path=converted_blob_path,
            duration_ms=duration_ms,
        )

    except Exception as e:
        logging.error(f"Watermark logging failed: {e}")

    # Cleanup
    try:
        os.remove(input_pdf_path)
    except Exception:
        pass

    if image_path:
        try:
            os.remove(image_path)
        except Exception:
            pass

    return FileResponse(
        output_pdf_path,
        filename=f"watermarked_{file.filename}",
        media_type="application/pdf",
    )