import os
import io
import uuid
import json
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from ultralytics import YOLO
from PIL import Image

# 1. Load Environment Variables & Initialize Supabase
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. Initialize FastAPI and AI Model
app = FastAPI()
model = YOLO("best_pothole1.pt")

# Enable CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# API 1: SUBMIT NEW POTHOLE REPORT
# ==========================================
@app.post("/api/reports/submit")
async def submit_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    user_id: str = Form(...),
    image: UploadFile = File(...),
):
    try:
        # 1. Read image into memory (No saving to disk!)
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))

        # 2. AI Inference
        results = model(img)
        detections = json.loads(results[0].to_json())

        # 3. Gatekeeper Check
        if len(detections) == 0:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "No pothole detected in image. Please try again.",
                },
            )

        # 4. Upload to Supabase Storage
        file_ext = os.path.splitext(image.filename)[1] or ".jpg"
        file_name = f"{uuid.uuid4()}{file_ext}"

        supabase.storage.from_("pothole-images").upload(
            path=file_name,
            file=contents,
            file_options={"content-type": image.content_type},
        )

        public_url = supabase.storage.from_("pothole-images").get_public_url(file_name)

        # 5. Save to Database
        report_data = {
            "id": str(uuid.uuid4()),
            "reported_by": user_id,
            "latitude": latitude,
            "longitude": longitude,
            "status": "pending",
            "before_image_url": public_url,
        }
        supabase.table("reports").insert(report_data).execute()

        return {
            "success": True,
            "message": "Pothole verified and logged.",
            "detections": detections,
        }

    except Exception as e:
        print(f"Submit error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


# ==========================================
# API 2: RESOLVE POTHOLE
# ==========================================
@app.post("/api/reports/resolve")
async def resolve_report(report_id: str = Form(...), image: UploadFile = File(...)):
    try:
        # 1. Read image into memory
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))

        # 2. AI Inference (Looking for ZERO potholes)
        results = model(img)
        detections = json.loads(results[0].to_json())

        # 3. Gatekeeper Check
        if len(detections) > 0:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Pothole still detected. Repair not verified.",
                    "detections": detections,
                },
            )

        # 4. Upload 'After' Image to Supabase
        file_ext = os.path.splitext(image.filename)[1] or ".jpg"
        file_name = f"after_{uuid.uuid4()}{file_ext}"

        supabase.storage.from_("pothole-images").upload(
            path=file_name,
            file=contents,
            file_options={"content-type": image.content_type},
        )

        public_url = supabase.storage.from_("pothole-images").get_public_url(file_name)

        # 5. Update Database
        supabase.table("reports").update(
            {"status": "fixed", "after_image_url": public_url}
        ).eq("id", report_id).execute()

        return {"success": True, "message": "Repair verified. Status updated."}

    except Exception as e:
        print(f"Resolve error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
