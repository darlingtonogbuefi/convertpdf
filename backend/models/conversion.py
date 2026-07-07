# backend/models/conversion.py

import uuid
from sqlalchemy import Column, String, BigInteger, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from backend.database import Base


class Conversion(Base):
    __tablename__ = "conversions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(String, nullable=True)

    # ✅ NEW: anonymous tracking ID
    guest_id = Column(String, nullable=True, index=True)
    
    document_id = Column(String, nullable=True, index=True)

    conversion_type = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    output_filename = Column(String, nullable=True)  
    
    # Blob storage paths
    original_blob_path = Column(String, nullable=True)
    converted_blob_path = Column(String, nullable=True)
    
    source_format = Column(String, nullable=False)
    target_format = Column(String, nullable=False)

    input_size_bytes = Column(BigInteger, nullable=False)
    output_size_bytes = Column(BigInteger, nullable=False)
    duration_ms = Column(BigInteger, nullable=True)

    status = Column(String, default="completed")

    success = Column(Boolean, default=True)

    error_message = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    created_date = Column(DateTime(timezone=True), server_default=func.now())