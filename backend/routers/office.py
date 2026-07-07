import os
import tempfile
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from sqlalchemy.orm import Session

from backend.database import get_db

from backend.services.word_to_pdf import convert_word_to_pdf
from backend.services.pdf_to_word import convert_pdf_to_word
from backend.services.word_to_excel import convert_word_to_excel
from backend.services.pdf_to_excel import convert_pdf_to_excel

from backend.utils.file_utils import encode_file_to_base64
from backend.utils.sqs_client import send_job
from backend.utils.s3_utils import upload_file_to_s3

from backend.dependencies.upload_limits import upload_limit_check

from backend.services.conversion_logger import log_conversion
from backend.dependencies.auth import get_current_user_optional

from backend.services.storage_service import (
    save_upload_file,
    save_converted_file,
)

from backend.core.apim import verify_apim_secret


router = APIRouter(
    prefix="/api/convert",
    tags=["Office"],
    dependencies=[
        Depends(upload_limit_check),
        Depends(verify_apim_secret),
    ],
)

# ----------------------
# Word → PDF (SYNC)
# ----------------------
@router.post("/word-to-pdf")
async def word_to_pdf(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    if not file.filename.endswith((".doc", ".docx")):
        raise HTTPException(status_code=400, detail="Word file required")

    file_bytes = await file.read()

    with tempfile.TemporaryDirectory() as tmp:
        docx_path = os.path.join(tmp, "in.docx")
        pdf_path = os.path.join(tmp, "out.pdf")
        output_filename = Path(file.filename).stem + ".pdf"

        with open(docx_path, "wb") as f:
            f.write(file_bytes)

        try:
            original_blob_path = save_upload_file(file_bytes, file.filename)
        except Exception as e:
            logging.warning(f"Upload storage failed (ignored): {e}")
            original_blob_path = None

        convert_word_to_pdf(docx_path, pdf_path, file.filename)

        try:
            with open(pdf_path, "rb") as f:
                converted_blob_path = save_converted_file(
                    f.read(),
                    output_filename,
                    "word-to-pdf"
                )
        except Exception as e:
            logging.warning(f"Converted storage failed (ignored): {e}")
            converted_blob_path = None

        try:
            guest_id = request.headers.get("X-Guest-Id")
            user_id = user["id"] if user else None

            log_conversion(
                db=db,
                user_id=user_id,
                guest_id=guest_id,
                conversion_type="word_to_pdf",
                filename=file.filename,
                output_filename=output_filename,
                original_blob_path=original_blob_path,
                converted_blob_path=converted_blob_path,
                source_format="docx",
                target_format="pdf",
                input_size_bytes=os.path.getsize(docx_path),
                output_size_bytes=os.path.getsize(pdf_path),
                duration_ms=0,
            )
        except Exception as e:
            logging.error(f"Logging failed: {e}")

        return {
            "filename": output_filename,
            "file": encode_file_to_base64(pdf_path),
            "blob_path": converted_blob_path,
            "container": "converted",
            "success": True
        }


# ----------------------
# PDF → Word (SYNC)
# ----------------------
@router.post("/pdf-to-word")
async def pdf_to_word(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF file required")

    file_bytes = await file.read()

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = os.path.join(tmp, "in.pdf")
        docx_path = os.path.join(tmp, "out.docx")
        output_filename = Path(file.filename).stem + ".docx"

        with open(pdf_path, "wb") as f:
            f.write(file_bytes)

        try:
            original_blob_path = save_upload_file(file_bytes, file.filename)
        except Exception as e:
            logging.warning(f"Upload storage failed (ignored): {e}")
            original_blob_path = None

        convert_pdf_to_word(pdf_path, docx_path, file.filename)

        try:
            with open(docx_path, "rb") as f:
                converted_blob_path = save_converted_file(
                    f.read(),
                    output_filename,
                    "pdf-to-word"
                )
        except Exception as e:
            logging.warning(f"Converted storage failed (ignored): {e}")
            converted_blob_path = None

        try:
            guest_id = request.headers.get("X-Guest-Id")
            user_id = user["id"] if user else None

            log_conversion(
                db=db,
                user_id=user_id,
                guest_id=guest_id,
                conversion_type="pdf_to_word",
                filename=file.filename,
                output_filename=output_filename,
                original_blob_path=original_blob_path,
                converted_blob_path=converted_blob_path,
                source_format="pdf",
                target_format="docx",
                input_size_bytes=os.path.getsize(pdf_path),
                output_size_bytes=os.path.getsize(docx_path),
                duration_ms=0,
            )
        except Exception as e:
            logging.error(f"Logging failed: {e}")

        return {
            "filename": output_filename,
            "file": encode_file_to_base64(docx_path),
            "blob_path": converted_blob_path,
            "container": "converted",
            "success": True
        }


# ----------------------
# Word → Excel (SYNC)
# ----------------------
@router.post("/word-to-excel")
async def word_to_excel(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    if not file.filename.endswith((".doc", ".docx")):
        raise HTTPException(status_code=400, detail="Word file required")

    file_bytes = await file.read()

    with tempfile.TemporaryDirectory() as tmp:
        docx_path = os.path.join(tmp, "in.docx")
        output_filename = Path(file.filename).stem + ".xlsx"
        excel_path = os.path.join(tmp, output_filename)

        with open(docx_path, "wb") as f:
            f.write(file_bytes)

        try:
            original_blob_path = save_upload_file(file_bytes, file.filename)
        except Exception as e:
            logging.warning(f"Upload storage failed (ignored): {e}")
            original_blob_path = None

        convert_word_to_excel(docx_path, excel_path, file.filename)

        try:
            with open(excel_path, "rb") as f:
                converted_blob_path = save_converted_file(
                    f.read(),
                    output_filename,
                    "word-to-excel"
                )
        except Exception as e:
            logging.warning(f"Converted storage failed (ignored): {e}")
            converted_blob_path = None

        try:
            guest_id = request.headers.get("X-Guest-Id")
            user_id = user["id"] if user else None

            log_conversion(
                db=db,
                user_id=user_id,
                guest_id=guest_id,
                conversion_type="word_to_excel",
                filename=file.filename,
                output_filename=output_filename,
                original_blob_path=original_blob_path,
                converted_blob_path=converted_blob_path,
                source_format="docx",
                target_format="xlsx",
                input_size_bytes=os.path.getsize(docx_path),
                output_size_bytes=os.path.getsize(excel_path),
                duration_ms=0,
            )
        except Exception as e:
            logging.error(f"Logging failed: {e}")

        return {
            "filename": output_filename,
            "file": encode_file_to_base64(excel_path),
            "blob_path": converted_blob_path,
            "container": "converted",
            "success": True
        }


# ----------------------
# PDF → PowerPoint (SYNC)
# ----------------------
@router.post("/pdf-to-powerpoint")
def pdf_to_powerpoint(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF file required")

    file_bytes = file.file.read()

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = os.path.join(tmp, "in.pdf")
        pptx_path = os.path.join(tmp, "out.pptx")
        output_filename = Path(file.filename).stem + ".pptx"

        with open(pdf_path, "wb") as f:
            f.write(file_bytes)

        try:
            original_blob_path = save_upload_file(file_bytes, file.filename)
        except Exception as e:
            logging.warning(f"Upload storage failed (ignored): {e}")
            original_blob_path = None

        from backend.services.pdf_to_powerpoint import convert_pdf_to_powerpoint
        convert_pdf_to_powerpoint(pdf_path, pptx_path, file.filename)

        try:
            with open(pptx_path, "rb") as f:
                converted_blob_path = save_converted_file(
                    f.read(),
                    output_filename,
                    "pdf-to-powerpoint"
                )
        except Exception as e:
            logging.warning(f"Converted storage failed (ignored): {e}")
            converted_blob_path = None

        try:
            guest_id = request.headers.get("X-Guest-Id")
            user_id = user["id"] if user else None

            log_conversion(
                db=db,
                user_id=user_id,
                guest_id=guest_id,
                conversion_type="pdf_to_powerpoint",
                filename=file.filename,
                output_filename=output_filename,
                original_blob_path=original_blob_path,
                converted_blob_path=converted_blob_path,
                source_format="pdf",
                target_format="pptx",
                input_size_bytes=os.path.getsize(pdf_path),
                output_size_bytes=os.path.getsize(pptx_path),
                duration_ms=0,
            )
        except Exception as e:
            logging.error(f"Logging failed: {e}")

        return {
            "filename": output_filename,
            "file": encode_file_to_base64(pptx_path),
            "blob_path": converted_blob_path,
            "container": "converted",
            "success": True
        }


# ----------------------
# PDF → Excel (SYNC)
# ----------------------
@router.post("/pdf-to-excel")
async def pdf_to_excel(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF file required")

    file_bytes = await file.read()

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = os.path.join(tmp, "in.pdf")
        excel_path = os.path.join(tmp, "out.xlsx")
        output_filename = Path(file.filename).stem + ".xlsx"

        with open(pdf_path, "wb") as f:
            f.write(file_bytes)

        try:
            original_blob_path = save_upload_file(file_bytes, file.filename)
        except Exception as e:
            logging.warning(f"Upload storage failed (ignored): {e}")
            original_blob_path = None

        try:
            result = convert_pdf_to_excel(pdf_path, excel_path, file.filename)
        except Exception as e:
            logging.exception("PDF → Excel conversion failed")
            return {"success": False, "error": str(e)}

        try:
            with open(excel_path, "rb") as f:
                converted_blob_path = save_converted_file(
                    f.read(),
                    output_filename,
                    "pdf-to-excel"
                )
        except Exception as e:
            logging.warning(f"Converted storage failed (ignored): {e}")
            converted_blob_path = None

        try:
            guest_id = request.headers.get("X-Guest-Id")
            user_id = user["id"] if user else None

            log_conversion(
                db=db,
                user_id=user_id,
                guest_id=guest_id,
                conversion_type="pdf_to_excel",
                filename=file.filename,
                output_filename=output_filename,
                original_blob_path=original_blob_path,
                converted_blob_path=converted_blob_path,
                source_format="pdf",
                target_format="xlsx",
                input_size_bytes=os.path.getsize(pdf_path),
                output_size_bytes=os.path.getsize(excel_path),
                duration_ms=0,
            )
        except Exception as e:
            logging.error(f"Logging failed: {e}")

        result["blob_path"] = converted_blob_path
        result["container"] = "converted"

        return result