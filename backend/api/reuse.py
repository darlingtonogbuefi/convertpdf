# backend/api/reuse.py

from fastapi import APIRouter
from backend.utils.blob_storage import download_blob_bytes
from backend.services.reuse_dispatcher import run_reuse

router = APIRouter()


@router.post("/")
def reuse_conversion(payload: dict):

    blob_path = payload.get("blob_path")
    conversion_type = payload.get("conversion_type")
    filename = payload.get("filename", "file")

    # =====================================================
    # VALIDATION (UNCHANGED LOGIC, JUST SAFER RETURN)
    # =====================================================
    if not blob_path or not conversion_type:
        return {
            "status": "error",
            "message": "Missing required fields"
        }

    try:
        # =====================================================
        # 1. Get original file from storage
        # =====================================================
        file_bytes = download_blob_bytes("uploads", blob_path)

        # =====================================================
        # 2. Run reuse dispatcher (ALL logic happens there)
        # =====================================================
        result = run_reuse(file_bytes, conversion_type, filename)

        # =====================================================
        # 3. Return result to frontend
        # =====================================================
        return {
            "status": "completed",
            "result": result
        }

    except Exception as e:
        # =====================================================
        # SAFE ERROR HANDLING (prevents frontend crash)
        # =====================================================
        return {
            "status": "error",
            "message": str(e),
            "conversion_type": conversion_type
        }