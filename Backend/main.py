import os
import uvicorn

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Disable reload in production (default to reload=True for dev)
    reload = os.getenv("ENVIRONMENT") != "production"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload)