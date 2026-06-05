import io
import uuid

from PIL import Image
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
