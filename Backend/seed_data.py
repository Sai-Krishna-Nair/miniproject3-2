import os
import io
import uuid
import sys
from PIL import Image
from dotenv import load_dotenv

# Ensure we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.dependencies import get_supabase

def create_dummy_jpeg():
    # Creates a simple solid gray square image
    img = Image.new('RGB', (100, 100), color='gray')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()

def seed():
    load_dotenv()
    sb = get_supabase()
    print("🚀 Initializing database seeding...")

    # Define dummy accounts to create
    dummy_users = [
        {"email": "citizen1@example.com", "password": "password123", "name": "Amit Kumar", "role": "citizen"},
        {"email": "citizen2@example.com", "password": "password123", "name": "Sunita Rao", "role": "citizen"},
        {"email": "auth1@example.com", "password": "password123", "name": "Officer Ramesh", "role": "authority"},
        {"email": "auth2@example.com", "password": "password123", "name": "Inspector Priya", "role": "authority"}
    ]

    user_ids = {}

    for du in dummy_users:
        print(f"👤 Creating user: {du['email']} ({du['role']})...")
        try:
            # 1. Attempt to sign up the user
            res = sb.auth.sign_up({
                "email": du["email"],
                "password": du["password"],
                "options": {
                    "data": {
                        "full_name": du["name"],
                        "role": du["role"]
                    }
                }
            })
            if res.user:
                user_ids[du["email"]] = res.user.id
                print(f"   ✅ Created user ID: {res.user.id}")
            else:
                raise Exception("Sign up returned empty response.")
        except Exception:
            # 2. If user already exists, sign in to retrieve their ID
            try:
                res = sb.auth.sign_in_with_password({
                    "email": du["email"],
                    "password": du["password"]
                })
                if res.user:
                    user_ids[du["email"]] = res.user.id
                    print(f"   ℹ️ User already exists. Retrieved ID: {res.user.id}")
                else:
                    print(f"   ❌ Failed to log in as {du['email']}")
            except Exception as login_err:
                print(f"   ❌ Error signing in/registering {du['email']}: {login_err}")

    # Verify we successfully retrieved basic user IDs
    c1 = user_ids.get("citizen1@example.com")
    c2 = user_ids.get("citizen2@example.com")
    a1 = user_ids.get("auth1@example.com")
    a2 = user_ids.get("auth2@example.com")

    if not (c1 and c2 and a1 and a2):
        print("❌ Error: Could not resolve IDs for all dummy users. Seeding aborted.")
        return

    # Upload dummy images to storage bucket
    print("📤 Uploading placeholder images to Supabase storage...")
    dummy_img = create_dummy_jpeg()
    before_url = ""
    after_url = ""
    
    try:
        sb.storage.from_(settings.POTHOLE_IMAGES_BUCKET).upload(
            path="seed_before.jpg",
            file=dummy_img,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        before_url = sb.storage.from_(settings.POTHOLE_IMAGES_BUCKET).get_public_url("seed_before.jpg")
        
        sb.storage.from_(settings.POTHOLE_IMAGES_BUCKET).upload(
            path="seed_after.jpg",
            file=dummy_img,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        after_url = sb.storage.from_(settings.POTHOLE_IMAGES_BUCKET).get_public_url("seed_after.jpg")
        print("   ✅ Storage uploads completed.")
    except Exception as e:
        print(f"   ⚠️ Storage upload failed ({e}). Using placeholder fallback URLs.")
        before_url = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600"
        after_url = "https://images.unsplash.com/photo-1584467541268-b029fb3482a4?q=80&w=600"

    # Define Pothole Records to seed
    reports_to_seed = [
        # Amit Kumar - Pending Pothole #1
        {
            "id": str(uuid.uuid4()),
            "reported_by": c1,
            "latitude": 17.422700,
            "longitude": 78.535100,
            "status": "pending",
            "before_image_url": before_url,
            "priority": 1
        },
        # Sunita Rao - Pending Pothole #2
        {
            "id": str(uuid.uuid4()),
            "reported_by": c2,
            "latitude": 17.430000,
            "longitude": 78.542400,
            "status": "pending",
            "before_image_url": before_url,
            "priority": 3
        },
        # Amit Kumar - Fixed Pothole resolved by Officer Ramesh
        {
            "id": str(uuid.uuid4()),
            "reported_by": c1,
            "latitude": 17.419500,
            "longitude": 78.538300,
            "status": "fixed",
            "before_image_url": before_url,
            "after_image_url": after_url,
            "resolved_by": a1,
            "resolved_at": "2026-06-26T12:00:00Z",
            "priority": 1
        },
        # Sunita Rao - Fixed Pothole resolved by Inspector Priya
        {
            "id": str(uuid.uuid4()),
            "reported_by": c2,
            "latitude": 17.429000,
            "longitude": 78.541000,
            "status": "fixed",
            "before_image_url": before_url,
            "after_image_url": after_url,
            "resolved_by": a2,
            "resolved_at": "2026-07-12T10:00:00Z",
            "priority": 2
        },
        # Amit Kumar - Another Pending Pothole #3
        {
            "id": str(uuid.uuid4()),
            "reported_by": c1,
            "latitude": 17.435900,
            "longitude": 78.577700,
            "status": "pending",
            "before_image_url": before_url,
            "priority": 2
        }
    ]

    print("📝 Writing reports to PostgreSQL database...")
    for rep in reports_to_seed:
        try:
            # We log in as the reporter to ensure RLS compliance during insertion
            if rep["reported_by"] == c1:
                sb.auth.sign_in_with_password({"email": "citizen1@example.com", "password": "password123"})
            else:
                sb.auth.sign_in_with_password({"email": "citizen2@example.com", "password": "password123"})
                
            sb.table("reports").insert(rep).execute()
            print(f"   ✅ Logged report at: Lat {rep['latitude']}, Lon {rep['longitude']} [Status: {rep['status']}]")
        except Exception as e:
            print(f"   ❌ Error inserting report: {e}")

    # Sign out of the last session
    try:
        sb.auth.sign_out()
    except Exception:
        pass

    print("🎉 Seeding completed successfully!")

if __name__ == "__main__":
    seed()
