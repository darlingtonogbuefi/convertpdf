# backend/services/reuse_dispatcher.py

from backend.services.word_to_pdf import convert_word_to_pdf
from backend.services.pdf_to_word import convert_pdf_to_word
from backend.services.word_to_excel import convert_word_to_excel
from backend.services.pdf_to_excel import convert_pdf_to_excel

from backend.services.image_to_word import image_to_word
from backend.services.image_to_excel import image_to_excel
from backend.services.image_to_pdf import convert_image_to_pdf
from backend.services.pdf_to_image import convert_pdf_to_image

from backend.services.pdf_merge import merge_pdfs
from backend.services.pdf_split import split_pdf_base64
from backend.services.pdf_compress import compress_pdf
from backend.services.pdf_rotate import rotate_pdf
from backend.services.pdf_watermark import add_watermark_to_pdf
from backend.services.pdf_to_powerpoint import convert_pdf_to_powerpoint


def run_reuse(file_bytes: bytes, conversion_type: str, filename: str):
    """
    Reuse dispatcher for ALL conversions
    (NO router changes needed anywhere else)
    """

    # =====================================================
    # OFFICE CONVERSIONS
    # =====================================================
    if conversion_type == "word-to-pdf":
        return convert_word_to_pdf(file_bytes, filename)

    if conversion_type == "pdf-to-word":
        return convert_pdf_to_word(file_bytes, filename)

    if conversion_type == "word-to-excel":
        return convert_word_to_excel(file_bytes, filename)

    if conversion_type == "pdf-to-excel":
        return convert_pdf_to_excel(file_bytes, filename)

    # =====================================================
    # IMAGE CONVERSIONS
    # =====================================================
    if conversion_type == "image-to-word":
        return image_to_word(file_bytes, filename)

    if conversion_type == "image-to-excel":
        return image_to_excel(file_bytes, filename)

    if conversion_type == "image-to-pdf":
        return convert_image_to_pdf(file_bytes, filename)

    if conversion_type == "pdf-to-image":
        return convert_pdf_to_image(file_bytes, filename)

    # =====================================================
    # PDF TOOLS
    # =====================================================
    if conversion_type == "pdf-merge":
        return merge_pdfs(file_bytes)

    if conversion_type == "pdf-split":
        return split_pdf_base64(file_bytes)

    if conversion_type == "pdf-compress":
        return compress_pdf(file_bytes)

    if conversion_type == "pdf-rotate":
        return rotate_pdf(file_bytes)

    if conversion_type == "pdf-watermark":
        return add_watermark_to_pdf(file_bytes)

    if conversion_type == "pdf-to-powerpoint":
        return convert_pdf_to_powerpoint(file_bytes)

    # =====================================================
    # NUTRIENT / FRONTEND TOOLS (EDIT/SIGN/STAMP)
    # =====================================================
    if conversion_type in ["pdf-edit", "pdf-sign", "pdf-stamp"]:
        return {
            "type": "pdf-workflow",
            "file_bytes": file_bytes,
            "conversion_type": conversion_type,
            "mode": conversion_type,
            "message": "Open in Nutrient frontend editor"
        }

    # =====================================================
    # SAFETY FALLBACK (PREVENT CRASHES)
    # =====================================================
    return {
        "type": "error",
        "error": f"Unsupported conversion type: {conversion_type}",
        "conversion_type": conversion_type
    }