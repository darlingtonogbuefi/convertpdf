#   backend\services\conversion_history.py

from backend.models.conversion import Conversion


def save_conversion(
    db,
    *,
    user_id: str | None = None,
    guest_id: str | None = None,   # ✅ NEW: anonymous tracking support
    conversion_type: str,
    filename: str,
    source_format: str,
    target_format: str,
    input_size_bytes: int,
    output_size_bytes: int,
    duration_ms: int,
):
    """
    Save a conversion record for both authenticated and anonymous users.
    """

    conversion = Conversion(
        user_id=user_id,
        guest_id=guest_id,  # ✅ NEW FIELD STORED IN DB

        conversion_type=conversion_type,
        original_filename=filename,
        source_format=source_format,
        target_format=target_format,

        input_size_bytes=input_size_bytes,
        output_size_bytes=output_size_bytes,
        duration_ms=duration_ms,

        status="completed"
    )

    db.add(conversion)
    db.commit()
    db.refresh(conversion)

    return conversion