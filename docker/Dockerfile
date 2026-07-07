#  docker\Dockerfile


# syntax=docker/dockerfile:1.4

# -----------------------------------
# Stage 1: System + Python build deps
# -----------------------------------
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system deps ONLY for building wheels / python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --upgrade pip

# Copy only requirements first (better caching like Node example)
COPY backend/requirements.txt /app/requirements.txt

# Build wheels (faster + reusable artifacts)
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# -----------------------------------
# Stage 2: Runtime image (minimal)
# -----------------------------------
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Install ONLY runtime system dependencies (no compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    ghostscript \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Copy prebuilt wheels from builder
COPY --from=builder /wheels /wheels

# Install Python dependencies from wheels (no compilation here)
RUN pip install /wheels/* \
    && rm -rf /wheels

# Copy backend code and Alembic files
COPY backend/ /app/backend/
COPY alembic.ini /app/alembic.ini
COPY backend/alembic /app/backend/alembic
COPY backend/run_migrations.py /app/backend/run_migrations.py

# Expose API port
EXPOSE 8000

# Start app with migrations applied automatically
#CMD ["sh", "-c", "python backend/run_migrations.py && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info"]
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info"]