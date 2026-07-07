# backend/routers/conversions.py

import logging
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, Path, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from backend.database import get_db
from backend.models.conversion import Conversion
from backend.dependencies.auth import get_current_user_optional

EXCLUDED_CONVERSION_TYPES = ["pdf_upload"]

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversions", tags=["Conversions"])


# ---------------------------------------------------
# GET ALL CONVERSIONS (USER FIRST DEFAULT)
# ---------------------------------------------------
@router.get("")
def get_conversion_history(
    request: Request,
    user=Depends(get_current_user_optional),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):

    guest_id = request.headers.get("X-Guest-Id")

    if user:
        filter_cond = Conversion.user_id == user["id"]

    elif guest_id:
        filter_cond = Conversion.guest_id == guest_id

    else:
        filter_cond = False

    # Only return completed conversions that have an output file
    base_query = (
        db.query(Conversion)
        .filter(filter_cond)
        .filter(Conversion.converted_blob_path.isnot(None))
        .filter(Conversion.conversion_type.notin_(EXCLUDED_CONVERSION_TYPES))
    )

    total = base_query.count()

    results = (
        base_query.order_by(Conversion.created_date.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return {
        "total": total,
        "items": [
            {
                "id": str(r.id),
                "user_id": r.user_id,
                "conversion_type": r.conversion_type,
                "original_filename": r.original_filename,
                "output_filename": r.output_filename or "",
                "source_format": r.source_format,
                "target_format": r.target_format,
                "original_blob_path": r.original_blob_path,
                "converted_blob_path": r.converted_blob_path,
                "input_size_bytes": r.input_size_bytes,
                "output_size_bytes": r.output_size_bytes,
                "duration_ms": r.duration_ms or 0,
                "status": r.status,
                "success": r.success,
                "error_message": r.error_message or "",
                "created_date": r.created_date.isoformat() if r.created_date else None,
            }
            for r in results
        ],
    }


# ---------------------------------------------------
# GET CONVERSION ACTIVITY (USER FIRST DEFAULT)
# ---------------------------------------------------
@router.get("/activity")
def get_conversion_activity(
    request: Request,
    user=Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):

    guest_id = request.headers.get("X-Guest-Id")

    if user:
        filter_cond = Conversion.user_id == user["id"]
    elif guest_id:
        filter_cond = Conversion.guest_id == guest_id
    else:
        filter_cond = False

    total = (
        db.query(Conversion)
        .filter(filter_cond)
        .filter(Conversion.conversion_type.notin_(EXCLUDED_CONVERSION_TYPES))
        .count()
    )

    recent = (
        db.query(Conversion)
        .filter(filter_cond)
        .filter(Conversion.conversion_type.notin_(EXCLUDED_CONVERSION_TYPES))
        .order_by(Conversion.created_date.desc())
        .limit(5)
        .all()
    )

    return {
        "total_conversions": total,
        "recent": [
            {
                "id": str(r.id),
                "conversion_type": r.conversion_type,
                "filename": r.original_filename,
                "status": r.status,
                "created_date": r.created_date.isoformat() if r.created_date else None,
            }
            for r in recent
        ],
    }


# ---------------------------------------------------
# GET MONTHLY ACTIVITY (USER FIRST DEFAULT)
# ---------------------------------------------------
@router.get("/activity/monthly")
def get_monthly_activity(
    request: Request,
    user=Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):

    guest_id = request.headers.get("X-Guest-Id")
    now = datetime.utcnow()

    if user:
        base_filter = Conversion.user_id == user["id"]
    elif guest_id:
        base_filter = Conversion.guest_id == guest_id
    else:
        base_filter = False

    filter_cond = base_filter & (
        (extract("month", Conversion.created_date) == now.month)
        & (extract("year", Conversion.created_date) == now.year)
    )

    total_this_month = (
        db.query(Conversion)
        .filter(filter_cond)
        .filter(Conversion.conversion_type.notin_(EXCLUDED_CONVERSION_TYPES))
        .count()
    )

    recent_this_month = (
        db.query(Conversion)
        .filter(filter_cond)
        .filter(Conversion.conversion_type.notin_(EXCLUDED_CONVERSION_TYPES))
        .order_by(Conversion.created_date.desc())
        .limit(5)
        .all()
    )

    return {
        "total_conversions": total_this_month,
        "recent": [
            {
                "id": str(r.id),
                "conversion_type": r.conversion_type,
                "filename": r.original_filename,
                "status": r.status,
                "created_date": r.created_date.isoformat() if r.created_date else None,
            }
            for r in recent_this_month
        ],
    }


# ---------------------------------------------------
# GET MOST USED CONVERSION TYPE (USER FIRST DEFAULT)
# ---------------------------------------------------
@router.get("/activity/most-used")
def get_most_used_conversion(
    request: Request,
    user=Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):

    guest_id = request.headers.get("X-Guest-Id")

    if user:
        filter_cond = Conversion.user_id == user["id"]
    elif guest_id:
        filter_cond = Conversion.guest_id == guest_id
    else:
        filter_cond = False

    result = (
        db.query(Conversion.conversion_type, func.count(Conversion.id).label("count"))
        .filter(filter_cond)
        # ✅ IMPORTANT: remove system upload event from analytics
        .filter(Conversion.conversion_type.notin_(EXCLUDED_CONVERSION_TYPES))
        .group_by(Conversion.conversion_type)
        .order_by(func.count(Conversion.id).desc())
        .first()
    )

    return {"most_used": result[0] if result else None}


# ---------------------------------------------------
# MB USED AND FILES CONVERTED (USER FIRST DEFAULT)
# ---------------------------------------------------
@router.get("/activity/summary")
def get_activity_summary(
    request: Request,
    user=Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):

    guest_id = request.headers.get("X-Guest-Id")

    # USER FIRST (consistent with your updated system)
    if user:
        filter_cond = Conversion.user_id == user["id"]
    elif guest_id:
        filter_cond = Conversion.guest_id == guest_id
    else:
        return {"files_converted": 0, "data_processed_mb": 0.0}

    total_files = (
        db.query(Conversion)
        .filter(filter_cond)
        .filter(Conversion.conversion_type.notin_(EXCLUDED_CONVERSION_TYPES))
        .count()
    )

    total_bytes = (
        db.query(func.sum(Conversion.input_size_bytes))
        .filter(filter_cond)
        .filter(Conversion.conversion_type.notin_(EXCLUDED_CONVERSION_TYPES))
        .scalar()
        or 0
    )

    return {
        "files_converted": total_files,
        "data_processed_mb": round(total_bytes / (1024 * 1024), 2),
    }


# ---------------------------------------------------
# GET SINGLE CONVERSION (UNCHANGED)
# ---------------------------------------------------
@router.get("/{conversion_id}")
def get_conversion_by_id(
    conversion_id: UUID = Path(...),
    user=Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):

    logger.debug("Fetching conversion id=%s", conversion_id)

    conversion = db.query(Conversion).filter(Conversion.id == conversion_id).first()

    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")

    if user and conversion.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    if not user and conversion.user_id is not None:
        raise HTTPException(status_code=403, detail="Forbidden")

    return {
        "id": str(conversion.id),
        "user_id": conversion.user_id,
        "conversion_type": conversion.conversion_type,
        "original_filename": conversion.original_filename,
        "output_filename": conversion.output_filename,
        "source_format": conversion.source_format,
        "target_format": conversion.target_format,
        "original_blob_path": conversion.original_blob_path,
        "converted_blob_path": conversion.converted_blob_path,
        "input_size_bytes": conversion.input_size_bytes,
        "output_size_bytes": conversion.output_size_bytes,
        "duration_ms": conversion.duration_ms,
        "status": conversion.status,
        "success": conversion.success,
        "error_message": conversion.error_message,
        "ip_address": conversion.ip_address,
        "user_agent": conversion.user_agent,
        "created_date": (
            conversion.created_date.isoformat() if conversion.created_date else None
        ),
    }


# ---------------------------------------------------
# MIGRATE GUEST → USER (UNCHANGED)
# ---------------------------------------------------
@router.post("/migrate")
def migrate_conversions(
    request: Request,
    user=Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):

    guest_id = request.headers.get("X-Guest-Id")

    if not user or not guest_id:
        return {"migrated": 0}

    from backend.services.conversion_migration import migrate_guest_to_user

    count = migrate_guest_to_user(db, guest_id=guest_id, user_id=user["id"])

    return {"migrated": count}


# ---------------------------------------------------
# DELETE ALL CONVERSIONS (USER OR GUEST)
# ---------------------------------------------------
@router.delete("")
def delete_all_conversions(
    request: Request,
    user=Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):

    guest_id = request.headers.get("X-Guest-Id")

    if user:
        filter_cond = Conversion.user_id == user["id"]
    elif guest_id:
        filter_cond = Conversion.guest_id == guest_id
    else:
        raise HTTPException(status_code=401, detail="No identity provided")

    deleted = db.query(Conversion).filter(filter_cond).delete(synchronize_session=False)

    db.commit()

    logger.info("Deleted %s conversions", deleted)

    return {"deleted": deleted}
