import io
import uuid

from PIL import Image
from fastapi import UploadFile, HTTPException
from supabase import create_client, Client
from ultralytics import YOLO

from app.config import settings


# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------

_supabase_client: Client | None = None
_yolo_model: YOLO | None = None


def get_supabase() -> Client:
    """Return a module-level Supabase client (created once)."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    return _supabase_client


def get_model() -> YOLO:
    """Return a module-level YOLO model (loaded once)."""
    global _yolo_model
    if _yolo_model is None:
        _yolo_model = YOLO(settings.YOLO_MODEL_PATH)
    return _yolo_model


# ---------------------------------------------------------------------------
# Image helpers
# ---------------------------------------------------------------------------

def draw_annotations(results) -> bytes:
    """Render YOLO annotations onto the image and return JPEG bytes."""
    annotated_array = results[0].plot()  # numpy array (BGR)
    img = Image.fromarray(annotated_array[..., ::-1])  # BGR → RGB
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def upload_image(bucket: str, file_name: str, data: bytes, content_type: str) -> str:
    """Upload bytes to a Supabase Storage bucket and return the public URL."""
    sb = get_supabase()
    sb.storage.from_(bucket).upload(
        path=file_name,
        file=data,
        file_options={"content-type": content_type},
    )
    return sb.storage.from_(bucket).get_public_url(file_name)


def generate_filename(prefix: str = "", extension: str = ".jpg") -> str:
    """Generate a unique filename with an optional prefix."""
    name = f"{uuid.uuid4()}{extension}"
    return f"{prefix}{name}" if prefix else name


# ---------------------------------------------------------------------------
# Upload validation
# ---------------------------------------------------------------------------

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
}

# Magic byte signatures for common image formats
_MAGIC_BYTES = [
    (b"\xff\xd8\xff",          "JPEG"),
    (b"\x89PNG\r\n\x1a\n",    "PNG"),
    (b"RIFF",                  "WebP"),   # WebP starts with RIFF....WEBP
    (b"GIF87a",                "GIF"),
    (b"GIF89a",                "GIF"),
    (b"BM",                    "BMP"),
]


async def validate_image_upload(
    image: UploadFile,
    *,
    max_size: int = MAX_IMAGE_SIZE_BYTES,
    label: str = "Image",
) -> bytes:
    """
    Validate and read an uploaded image file. Returns the raw file bytes.

    Checks performed:
    1. File extension is in ALLOWED_EXTENSIONS
    2. MIME / content-type is in ALLOWED_MIME_TYPES
    3. File size ≤ max_size
    4. Magic bytes match a known image format

    Raises HTTPException(400) on any failure.
    """
    import os

    # 1. Extension check
    filename = image.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"{label} file type '{ext}' is not allowed. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # 2. MIME type check
    content_type = (image.content_type or "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"{label} MIME type '{content_type}' is not allowed. Accepted: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    # 3. Read + size check
    contents = await image.read()
    if len(contents) > max_size:
        size_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"{label} is too large ({len(contents) / (1024*1024):.1f} MB). Maximum allowed: {size_mb:.0f} MB.",
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail=f"{label} file is empty.",
        )

    # 4. Magic bytes check
    if not any(contents.startswith(sig) for sig, _ in _MAGIC_BYTES):
        raise HTTPException(
            status_code=400,
            detail=f"{label} does not appear to be a valid image file. The file header is unrecognized.",
        )

    return contents

