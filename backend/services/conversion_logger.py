#   backend\services\conversion_logger.py

import time
from sqlalchemy.orm import Session
from backend.models.conversion import Conversion


def log_conversion(
    db: Session,
    *,
    user_id: str | None = None,
    guest_id: str | None = None,

    # 🆕 ADDED: document grouping key
    document_id: str | None = None,

    conversion_type: str,
    filename: str,

    source_format: str,
    target_format: str,

    input_size_bytes: int,
    output_size_bytes: int = 0,

    status: str = "completed",
    success: bool = True,
    error_message: str | None = None,

    output_filename: str | None = None,

    # blob storage metadata fields
    original_blob_path: str | None = None,
    converted_blob_path: str | None = None,

    ip_address: str | None = None,
    user_agent: str | None = None,

    duration_ms: int | None = None,
):
    """
    Unified conversion logging for ALL endpoints.
    """

    # Auto-calc duration fallback if not provided
    if duration_ms is None:
        duration_ms = 0

    record = Conversion(
        user_id=user_id,
        guest_id=guest_id,

        # 🆕 ADDED
        document_id=document_id,

        conversion_type=conversion_type,
        original_filename=filename,
        output_filename=output_filename,

        source_format=source_format,
        target_format=target_format,

        input_size_bytes=input_size_bytes,
        output_size_bytes=output_size_bytes,

        duration_ms=duration_ms,

        status=status,
        success=success,
        error_message=error_message,

        original_blob_path=original_blob_path,
        converted_blob_path=converted_blob_path,

        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record