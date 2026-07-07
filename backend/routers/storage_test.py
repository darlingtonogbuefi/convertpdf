#   backend\routers\storage_test.py

from fastapi import APIRouter

from backend.utils.blob_storage import upload_bytes

router = APIRouter(
    prefix="/storage",
    tags=["Storage Test"],
)


@router.get("/ping")
async def ping_storage():
    upload_bytes(
        container="uploads",
        blob_name="test.txt",
        data=b"hello world",
    )

    return {
        "success": True,
        "message": "File uploaded"
    }