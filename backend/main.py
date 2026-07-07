# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from contextlib import asynccontextmanager

from backend.routers import conversions
#from backend.routers import storage_test
from backend.routers import pdf_workflow

from backend.core.limiter import limiter
from backend.routers import pdf, office, image, nutrient, pdf_edit, pdf_watermark

#from backend.middleware.request_size_limit import RequestSizeLimitMiddleware
from backend.middleware.request_timeout import TimeoutMiddleware

from backend.api import files, reuse

from backend.config import validate_settings

from backend.api import user


app = FastAPI(
    title="Universal File Converter API",
    description="Convert, edit, split, merge, watermark & sign files",
    version="2.2.0",
    docs_url=None,
    redoc_url=None,
    openapi_url="/openapi.json"
)


# =========================
# STARTUP VALIDATION (NEW)
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_settings()
    yield


app.router.lifespan_context = lifespan


# ----------------------
# Rate Limiting
# ----------------------
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# ----------------------
# Request Size Limit
# ----------------------
# app.add_middleware(RequestSizeLimitMiddleware)

app.add_middleware(TimeoutMiddleware)

# ----------------------
# CORS
# ----------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.pdfconverterpro.cribr.co.uk",
        "https://frontend.azurefd.net",
        "https://www.convertpdf.cribr.co.uk",
        "https://pdfconvertpro.cribr.co.uk",
        "https://login.cribr.co.uk"
       #"http://localhost:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------
# Routers
# ----------------------
app.include_router(pdf.router)
app.include_router(office.router)
app.include_router(image.router)
app.include_router(nutrient.router)
app.include_router(pdf_watermark.router)
app.include_router(pdf_edit.router)
app.include_router(conversions.router)
#app.include_router(storage_test.router)
app.include_router(pdf_workflow.router)
#app.include_router(sql_conversions.router, prefix="/api/sql-conversions")
app.include_router(files.router, prefix="/api/files")
app.include_router(reuse.router, prefix="/api/reuse")
app.include_router(user.router)


# ----------------------
# Root + Health Endpoints
# ----------------------
@app.get("/")
async def root():
    return {
        "service": "Universal File Converter API",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "ok"}