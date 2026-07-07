import base64
import os
import tempfile
import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, Request, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.core.limiter import limiter
from backend.schemas.common import FileResponse as ApiFileResponse, SplitPDFResponse
from backend.utils.file_utils import encode_file_to_base64
from backend.services.pdf_split import split_pdf_base64
from backend.services.pdf_merge import merge_pdfs
from backend.services.pdf_compress import compress_pdf
from backend.services.pdf_overlay import overlay_pdf
from backend.services.pdf_rotate import rotate_pdf
from backend.services.pdf_sign import sign_pdf
from backend.services.pdf_watermark import add_watermark_to_pdf

from backend.dependencies.upload_limits import upload_limit_check
from backend.database import get_db
from backend.dependencies.auth import get_current_user_optional
from backend.services.conversion_logger import log_conversion
from backend.services.storage_service import (
    save_upload_file,
    save_converted_file,
)

router = APIRouter(
    prefix="/api/convert",
    tags=["PDF"],
    dependencies=[Depends(upload_limit_check)],
)


# =========================================================
# PDF SPLIT
# =========================================================
@router.post("/pdf-split", response_model=SplitPDFResponse)
@limiter.limit("10/minute")
async def pdf_split(
    request: Request,
    file: UploadFile = File(...),
    start: int = 1,
    end: int | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = Path(tmp) / file.filename
        file_bytes = await file.read()
        pdf_path.write_bytes(file_bytes)

        # ✅ SAVE ORIGINAL
        try:
            save_upload_file(file_bytes, file.filename, "pdf-split")
        except Exception as e:
            logging.warning(f"Upload save failed: {e}")

        result = split_pdf_base64(str(pdf_path), tmp, start, end)

        # ❌ no single output file (base64 chunks)

        try:
            log_conversion(
                db=db,
                user_id=user["id"] if user else None,
                guest_id=request.headers.get("X-Guest-Id"),
                conversion_type="pdf_split",
                filename=file.filename,
                source_format="pdf",
                target_format="pdf",
                input_size_bytes=len(file_bytes),
                output_size_bytes=0,
                duration_ms=0,
            )
        except Exception as e:
            logging.error(f"Logging failed: {e}")

        return result


# =========================================================
# PDF MERGE
# =========================================================
@router.post("/pdf-merge")
@limiter.limit("10/minute")
async def pdf_merge(
    request: Request,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    with tempfile.TemporaryDirectory() as tmp:
        paths = []
        total_input_size = 0

        original_blob_paths = []

        for f in files:
            p = Path(tmp) / f.filename
            file_bytes = await f.read()
            p.write_bytes(file_bytes)

            paths.append(str(p))
            total_input_size += len(file_bytes)

            # ✅ SAVE ORIGINAL (CAPTURE PATH)
            try:
                blob_path = save_upload_file(file_bytes, f.filename, "pdf-merge")
                original_blob_paths.append(blob_path)
            except Exception as e:
                logging.warning(f"Upload save failed: {e}")

        merged = Path(tmp) / "merged.pdf"
        merge_pdfs(paths, str(merged))

        merged_bytes = merged.read_bytes()

        # ✅ SAVE OUTPUT (CAPTURE PATH)
        try:
            converted_blob_path = save_converted_file(
                merged_bytes,
                "merged.pdf",
                "pdf-merge"
            )
        except Exception as e:
            logging.warning(f"Converted save failed: {e}")
            converted_blob_path = None

        try:
            log_conversion(
                db=db,
                user_id=user["id"] if user else None,
                guest_id=request.headers.get("X-Guest-Id"),
                conversion_type="pdf_merge",
                filename=",".join(f.filename for f in files),
                source_format="pdf",
                target_format="pdf",
                input_size_bytes=total_input_size,
                output_size_bytes=len(merged_bytes),
                output_filename="merged.pdf",
                original_blob_path=",".join(original_blob_paths),
                converted_blob_path=converted_blob_path,
                duration_ms=0,
            )
        except Exception as e:
            logging.error(f"Logging failed: {e}")

        return {
            "success": True,
            "filename": "merged.pdf",
            "file": encode_file_to_base64(str(merged)),
        }


# =========================================================
# PDF ROTATE
# =========================================================
@router.post("/pdf-rotate")
@limiter.limit("10/minute")
async def pdf_rotate_endpoint(
    request: Request,
    file: UploadFile = File(...),
    angle: int = 90,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = Path(tmp) / "in.pdf"
        out_path = Path(tmp) / "rotated.pdf"

        file_bytes = await file.read()
        pdf_path.write_bytes(file_bytes)

        # ✅ SAVE ORIGINAL
        try:
            original_blob_path = save_upload_file(
                file_bytes,
                file.filename,
                "pdf-rotate"
            )
        except Exception as e:
            logging.warning(f"Upload save failed: {e}")
            original_blob_path = None

        rotate_pdf(str(pdf_path), str(out_path), int(angle))

        rotated_bytes = out_path.read_bytes()

        # ✅ SAVE OUTPUT
        try:
            converted_blob_path = save_converted_file(
                rotated_bytes,
                "rotated.pdf",
                "pdf-rotate"
            )
        except Exception as e:
            logging.warning(f"Converted save failed: {e}")
            converted_blob_path = None

        try:
            log_conversion(
                db=db,
                user_id=user["id"] if user else None,
                guest_id=request.headers.get("X-Guest-Id"),
                conversion_type="pdf_rotate",
                filename=file.filename,
                source_format="pdf",
                target_format="pdf",
                input_size_bytes=len(file_bytes),
                output_size_bytes=len(rotated_bytes),
                output_filename="rotated.pdf",
                original_blob_path=original_blob_path,
                converted_blob_path=converted_blob_path,
                duration_ms=0,
            )
        except Exception as e:
            logging.error(f"Logging failed: {e}")

        return {
            "success": True,
            "filename": "rotated.pdf",
            "file": encode_file_to_base64(str(out_path)),
        }


# =========================================================
# PDF COMPRESS
# =========================================================
@router.post("/pdf-compress", response_model=ApiFileResponse)
@limiter.limit("10/minute")
async def pdf_compress(
    request: Request,
    file: UploadFile = File(...),
    select_pages: str = "",
    compression_level: str = "max",
    recompress_images: bool = True,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = Path(tmp) / file.filename
        out_path = Path(tmp) / f"compressed_{file.filename}"

        file_bytes = await file.read()
        pdf_path.write_bytes(file_bytes)

        # ✅ SAVE ORIGINAL
        try:
            original_blob_path = save_upload_file(
                file_bytes,
                file.filename,
                "pdf-compress"
            )
        except Exception as e:
            logging.warning(f"Upload save failed: {e}")
            original_blob_path = None

        compressed_file, _ = compress_pdf(
            str(pdf_path),
            str(out_path),
            select_pages=select_pages,
            compression_level=compression_level,
            recompress_images=recompress_images,
        )

        compressed_bytes = Path(compressed_file).read_bytes()

        # ✅ SAVE OUTPUT
        try:
            converted_blob_path = save_converted_file(
                compressed_bytes,
                Path(compressed_file).name,
                "pdf-compress"
            )
        except Exception as e:
            logging.warning(f"Converted save failed: {e}")
            converted_blob_path = None

        try:
            log_conversion(
                db=db,
                user_id=user["id"] if user else None,
                guest_id=request.headers.get("X-Guest-Id"),
                conversion_type="pdf_compress",
                filename=file.filename,
                source_format="pdf",
                target_format="pdf",
                input_size_bytes=len(file_bytes),
                output_size_bytes=len(compressed_bytes),
                output_filename=Path(compressed_file).name,
                original_blob_path=original_blob_path,
                converted_blob_path=converted_blob_path,
                duration_ms=0,
            )
        except Exception as e:
            logging.error(f"Logging failed: {e}")

        return {
            "success": True,
            "filename": Path(compressed_file).name,
            "file": encode_file_to_base64(str(compressed_file)),
        }