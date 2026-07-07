# backend\services\storage_service.py

import os
import uuid
import logging
from datetime import datetime
import re

from backend.utils.blob_storage import upload_bytes

logger = logging.getLogger(__name__)

UPLOADS_CONTAINER = "uploads"
CONVERTED_CONTAINER = "converted"

# =========================================================
# VALID STORAGE FOLDERS (USED ONLY FOR UPLOAD SAFETY)
# =========================================================
VALID_FOLDERS = ["raw", "pdf-edit", "pdf-sign", "pdf-stamp"]


# =========================================================
# SAFE FILENAME SANITIZER (FIX ADDED)
# =========================================================
def sanitize_filename(filename: str) -> str:
    """
    Prevents path traversal and invalid blob names.
    Keeps behavior compatible with existing system.
    """
    filename = filename.replace(" ", "_")
    filename = filename.replace("\\", "_")
    filename = filename.replace("/", "_")
    filename = re.sub(r"\.\.+", ".", filename)
    return filename


# =========================================================
# GENERATE PATH (FOLDER-BASED STRUCTURE)
# =========================================================
def generate_blob_name(filename: str, folder: str) -> str:
    """
    Creates structured blob path:
    raw/pdf-edit/pdf-sign/pdf-stamp/2026/06/19/<uuid>-file.pdf
    """

    if not folder:
        raise ValueError("Folder is required for blob routing")

    if folder not in VALID_FOLDERS:
        raise ValueError(f"Invalid storage folder: {folder}")

    date_path = datetime.utcnow().strftime("%Y/%m/%d")
    unique_id = str(uuid.uuid4())

    # FIX: safer filename handling
    safe_name = sanitize_filename(filename)

    return f"{folder}/{date_path}/{unique_id}-{safe_name}"


# =========================================================
# ORIGINAL UPLOAD STORAGE (FORCED RAW UPLOADS)
# =========================================================
def save_upload_file(file_bytes: bytes, filename: str, folder: str = "raw") -> str:
    """
    Stores original uploaded file into uploads/raw ONLY.

    NOTE:
    - Folder is now enforced as "raw"
    - Existing callers can still pass folder, but it will be ignored
    """

    # Force all uploads into raw
    folder = "raw"

    blob_name = generate_blob_name(filename, folder)

    try:
        upload_bytes(
            container=UPLOADS_CONTAINER,
            blob_name=blob_name,
            data=file_bytes,
        )

        logger.info(f"[Storage] Upload saved: {blob_name}")
        return blob_name

    except Exception as e:
        logger.error(f"[Storage] Upload failed: {e}")
        raise


# =========================================================
# CONVERTED OUTPUT STORAGE (TOOL-BASED VIRTUAL FOLDERS)
# =========================================================
def save_converted_file(file_bytes: bytes, filename: str, folder: str) -> str:
    """
    Stores converted output in tool-specific virtual folder.

    Example:
    converted/pdf-watermark/...
    converted/pdf-sign/...
    """

    if not folder:
        raise ValueError("Converted file must specify folder")

    # NOTE: intentionally not restricting folder
    # allows tool-based routing (pdf-sign, pdf-edit, etc.)

    date_path = datetime.utcnow().strftime("%Y/%m/%d")
    unique_id = str(uuid.uuid4())

    # FIX: consistent sanitization (was previously weak)
    safe_name = sanitize_filename(filename)

    blob_name = f"{folder}/{date_path}/{unique_id}-{safe_name}"

    try:
        upload_bytes(
            container=CONVERTED_CONTAINER,
            blob_name=blob_name,
            data=file_bytes,
        )

        logger.info(f"[Storage] Converted saved: {blob_name}")
        return blob_name

    except Exception as e:
        logger.error(f"[Storage] Converted save failed: {e}")
        raise


# =========================================================
# OPTIONAL HELPER (UNCHANGED)
# =========================================================
def build_blob_url(container: str, blob_name: str) -> str:
    account = os.environ["STORAGE_ACCOUNT_NAME"]
    return f"https://{account}.blob.core.windows.net/{container}/{blob_name}"