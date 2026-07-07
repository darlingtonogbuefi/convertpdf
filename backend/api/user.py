import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
)
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies.auth import get_current_user
from backend.models.user_profile import UserProfile

from backend.utils.blob_storage import (
    upload_bytes,
    download_blob_bytes,
)

router = APIRouter(
    prefix="/api/user",
    tags=["user"],
)

PROFILE_CONTAINER = os.getenv(
    "PROFILE_PICTURE_CONTAINER",
    "profile-pictures",
)


# ==========================================================
# GET CURRENT USER PROFILE
# ==========================================================
@router.get("/me")
async def get_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user["id"])
        .first()
    )

    if not profile:
        return {
            "user_id": current_user["id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "profile_picture": None,
        }

    return {
        "user_id": profile.user_id,
        "name": profile.display_name,
        "email": profile.email,
        "profile_picture": (
            "/api/user/profile-picture"
            if profile.profile_picture_blob
            else None
        ),
    }


# ==========================================================
# UPLOAD PROFILE PICTURE
# ==========================================================
@router.post("/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_types = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are supported",
        )

    contents = await file.read()

    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Profile image must be under 5MB",
        )

    oid = current_user["id"]
    extension = allowed_types[file.content_type]

    blob_name = f"avatars/{oid}.{extension}"

    # =========================
    # 1. Upload to Blob Storage
    # =========================
    upload_bytes(
        container=PROFILE_CONTAINER,
        blob_name=blob_name,
        data=contents,
    )

    # =========================
    # 2. DB UPSERT (IMPORTANT FIX)
    # =========================
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == oid)
        .first()
    )

    if not profile:
        profile = UserProfile(
            user_id=oid,
            email=current_user["email"],
            display_name=current_user["name"],
        )
        db.add(profile)

    # update fields
    profile.profile_picture_blob = blob_name
    profile.email = current_user["email"]
    profile.display_name = current_user["name"]

    db.commit()
    db.refresh(profile)

    return {
        "success": True,
        "profile_picture": "/api/user/profile-picture",
    }


# ==========================================================
# GET PROFILE PICTURE
# ==========================================================
@router.get("/profile-picture")
async def get_profile_picture(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user["id"])
        .first()
    )

    if not profile or not profile.profile_picture_blob:
        raise HTTPException(
            status_code=404,
            detail="Profile picture not found",
        )

    image_bytes = download_blob_bytes(
        container=PROFILE_CONTAINER,
        blob_name=profile.profile_picture_blob,
    )

    blob_name = profile.profile_picture_blob.lower()

    if blob_name.endswith(".png"):
        media_type = "image/png"
    elif blob_name.endswith(".webp"):
        media_type = "image/webp"
    else:
        media_type = "image/jpeg"

    return Response(
        content=image_bytes,
        media_type=media_type,
    )