from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func

from backend.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    # Azure OID from MSAL token (PRIMARY KEY)
    user_id = Column(String, primary_key=True)

    email = Column(String, nullable=True)
    display_name = Column(String, nullable=True)

    # Blob path:
    # avatars/{oid}.jpg
    profile_picture_blob = Column(String, nullable=True)

    created_date = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_date = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )