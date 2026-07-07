#   backend\services\conversion_migration.py


from sqlalchemy.orm import Session
from backend.models.conversion import Conversion


def migrate_guest_to_user(
    db: Session,
    *,
    guest_id: str,
    user_id: str
):
    """
    Merge anonymous conversions into authenticated user account.
    """

    if not guest_id or not user_id:
        return 0

    updated = (
        db.query(Conversion)
        .filter(Conversion.guest_id == guest_id)
        .update(
            {
                Conversion.user_id: user_id,
                Conversion.guest_id: None
            },
            synchronize_session=False
        )
    )

    db.commit()
    return updated