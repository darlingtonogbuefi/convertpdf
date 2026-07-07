# backend/routers/image.py

import os
import logging
import tempfile
import base64

from pathlib import Path
from typing import List, Union

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException,
    Depends,
    Request,
)
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.utils.file_utils import encode_file_to_base64

from backend.services import image_to_word, image_to_excel
from backend.services.pdf_to_image import convert_pdf_to_image
from backend.services.image_to_pdf import convert_image_to_pdf

from backend.schemas.common import FileResponse

from backend.dependencies.upload_limits import upload_limit_check
from backend.dependencies.auth import get_current_user_optional

from backend.services.conversion_logger import log_conversion

from backend.services.storage_service import (
    save_upload_file,
    save_converted_file,
)

router = APIRouter(
    prefix="/api/convert",
    tags=["Image"],
    dependencies=[Depends(upload_limit_check)],
)

# ----------------------
# Image → Word
# ----------------------
@router.post("/image-to-word")
async def convert_image_to_word(
    file: Union[UploadFile, List[UploadFile]] = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    """
    Convert a single image to a Word document using OCR.
    Accepts .png, .jpg, .jpeg, .tiff files.
    """

    if isinstance(file, list):
        if not file:
            raise HTTPException(400, "No file uploaded")
        file = file[0]

    print("Received file:", file.filename, file.content_type)

    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".tiff")):
        raise HTTPException(400, "File must be an image")

    try:
        with tempfile.TemporaryDirectory() as tmp:
            img_path = Path(tmp) / file.filename
            word_path = Path(tmp) / "output.docx"

            file_bytes = await file.read()
            img_path.write_bytes(file_bytes)

            try:
                original_blob_path = save_upload_file(
                    file_bytes,
                    file.filename,
            )
            except Exception as e:
                logging.warning(f"Upload storage failed (ignored): {e}")
                original_blob_path = None

            image_to_word.image_to_word(
                str(img_path),
                str(word_path)
            )

            output_filename = img_path.stem + ".docx"

            try:
                with open(word_path, "rb") as f:
                    converted_blob_path = save_converted_file(
                        f.read(),
                        output_filename,
                        "image-to-word",
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
                    conversion_type="image_to_word",
                    filename=file.filename,
                    output_filename=output_filename,
                    original_blob_path=original_blob_path,
                    converted_blob_path=converted_blob_path,
                    source_format=img_path.suffix.replace(".", ""),
                    target_format="docx",
                    input_size_bytes=os.path.getsize(img_path),
                    output_size_bytes=os.path.getsize(word_path),
                    duration_ms=0,
                )
            except Exception as e:
                logging.error(f"Logging failed: {e}")

            return FileResponse(
                filename=output_filename,
                file=encode_file_to_base64(str(word_path)),
                blob_path=converted_blob_path,
                container="converted",
                success=True,
            )
    except Exception as e:
        raise HTTPException(500, str(e))


# ----------------------
# Image → Excel
# ----------------------
@router.post("/image-to-excel")
async def convert_image_to_excel(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".tiff")):
        raise HTTPException(400, "File must be an image")

    try:
        with tempfile.TemporaryDirectory() as tmp:
            img_path = Path(tmp) / file.filename
            xlsx_path = Path(tmp) / "output.xlsx"

            file_bytes = await file.read()
            img_path.write_bytes(file_bytes)

            try:
                original_blob_path = save_upload_file(
                    file_bytes,
                    file.filename,
                )
            except Exception as e:
                logging.warning(f"Upload storage failed (ignored): {e}")
                original_blob_path = None

            image_to_excel.image_to_excel(
                str(img_path),
                str(xlsx_path)
            )

            output_filename = img_path.stem + ".xlsx"

            try:
                with open(xlsx_path, "rb") as f:
                    converted_blob_path = save_converted_file(
                        f.read(),
                        output_filename,
                        "image-to-excel",
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
                    conversion_type="image_to_excel",
                    filename=file.filename,
                    output_filename=output_filename,
                    original_blob_path=original_blob_path,
                    converted_blob_path=converted_blob_path,
                    source_format=img_path.suffix.replace(".", ""),
                    target_format="xlsx",
                    input_size_bytes=os.path.getsize(img_path),
                    output_size_bytes=os.path.getsize(xlsx_path),
                    duration_ms=0,
                )
            except Exception as e:
                logging.error(f"Logging failed: {e}")

            return FileResponse(
                filename=output_filename,
                file=encode_file_to_base64(str(xlsx_path)),
                blob_path=converted_blob_path,
                container="converted",
                success=True,
            )

    except Exception as e:
        raise HTTPException(500, str(e))


# ----------------------
# Images → PDF
# ----------------------
@router.post("/image-to-pdf", response_model=FileResponse)
async def image_to_pdf(
    files: List[UploadFile] = File(...),
    pdf_name: str = Form("images.pdf"),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    """
    Convert uploaded images into a PDF.
    Each image is scaled to fit the page while maintaining aspect ratio and centered.
    """

    try:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)

            original_blob_path = None 

            image_paths = []

            for file in files:
                if not file.filename.lower().endswith(
                    (".png", ".jpg", ".jpeg", ".tiff")
                ):
                    raise HTTPException(
                        400,
                        f"{file.filename} is not a valid image"
                    )

                file_bytes = await file.read()

                try:
                    blob = save_upload_file(
                        file_bytes,
                        file.filename,
                    )

                    if original_blob_path is None:
                        original_blob_path = blob

                except Exception as e:
                    logging.warning(f"Upload storage failed (ignored): {e}")

                img_path = tmp_dir / file.filename
                img_path.write_bytes(file_bytes)
                image_paths.append(str(img_path))

            output_pdf = tmp_dir / "output.pdf"

            base64_pdf = convert_image_to_pdf(
                image_paths,
                str(output_pdf)
            )

            output_filename = pdf_name

            try:
                with open(output_pdf, "rb") as f:
                    converted_blob_path = save_converted_file(
                        f.read(),
                        output_filename,
                        "image-to-pdf",
                    )
            except Exception as e:
                logging.warning(f"Converted storage failed (ignored): {e}")
                converted_blob_path = None

            try:
                guest_id = request.headers.get("X-Guest-Id")
                user_id = user["id"] if user else None

                total_input_size = sum(
                    os.path.getsize(path)
                    for path in image_paths
                )

                log_conversion(
                    db=db,
                    user_id=user_id,
                    guest_id=guest_id,
                    conversion_type="image_to_pdf",
                    filename=pdf_name,
                    output_filename=output_filename,
                    original_blob_path=original_blob_path,
                    converted_blob_path=converted_blob_path,
                    source_format="images",
                    target_format="pdf",
                    input_size_bytes=total_input_size,
                    output_size_bytes=os.path.getsize(output_pdf),
                    duration_ms=0,
                )
            except Exception as e:
                logging.error(f"Logging failed: {e}")

            return FileResponse(
                filename=output_filename,
                file=base64_pdf,
                blob_path=converted_blob_path,
                container="converted",
                success=True,
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ----------------------
# PDF → Images
# ----------------------
@router.post("/pdf-to-image")
async def pdf_to_image(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "File must be a PDF")

    try:
        with tempfile.TemporaryDirectory() as tmp:
            pdf_path = Path(tmp) / file.filename

            file_bytes = await file.read()
            pdf_path.write_bytes(file_bytes)

            try:
                original_blob_path = save_upload_file(
                    file_bytes,
                    file.filename,
                )
            except Exception as e:
                logging.warning(f"Upload storage failed (ignored): {e}")
                original_blob_path = None

            images = convert_pdf_to_image(
                str(pdf_path),
                tmp
            )
            
            converted_blob_paths = []  


            try:
                for index, image_data in enumerate(images):
                    try:
                        if isinstance(image_data, dict):
                            filename = image_data.get(
                                "filename",
                                f"page_{index + 1}.png"
                            )
                            image_b64 = image_data.get("file")

                            if image_b64:
                                blob = save_converted_file(
                                    base64.b64decode(image_b64),
                                    filename,
                                    "pdf-to-image",
                                )

                                converted_blob_paths.append(blob)
                    except Exception as inner_e:
                        logging.warning(
                            f"Converted image storage failed (ignored): {inner_e}"
                        )
            except Exception as e:
                logging.warning(f"Converted storage failed (ignored): {e}")

            try:
                guest_id = request.headers.get("X-Guest-Id")
                user_id = user["id"] if user else None

                output_size = 0

                for generated_file in Path(tmp).glob("*"):
                    if generated_file.suffix.lower() in (
                        ".png",
                        ".jpg",
                        ".jpeg",
                    ):
                        output_size += generated_file.stat().st_size

                log_conversion(
                    db=db,
                    user_id=user_id,
                    guest_id=guest_id,
                    conversion_type="pdf_to_image",
                    filename=file.filename,
                    output_filename=f"{pdf_path.stem}.zip",
                    original_blob_path=original_blob_path,
                    converted_blob_path=",".join(converted_blob_paths),
                    source_format="pdf",
                    target_format="images",
                    input_size_bytes=os.path.getsize(pdf_path),
                    output_size_bytes=output_size,
                    duration_ms=0,
                )
            except Exception as e:
                logging.error(f"Logging failed: {e}")

            return {
                "success": True,
                "images": images,
            }

    except Exception as e:
        raise HTTPException(500, str(e))