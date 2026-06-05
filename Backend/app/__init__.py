from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings


def create_app() -> FastAPI:
    """Application factory — assembles routers and middleware."""

    app = FastAPI(
        title="Pothole Reporter API",
        description="AI-verified pothole reporting and resolution platform",
        version="1.0.0",
    )

    # CORS — wide open for development, tighten via CORS_ORIGINS in .env
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Register routers ---
    from app.reports.router import router as reports_router
    from app.users.router import router as users_router
    from app.dashboard.router import router as dashboard_router

    app.include_router(reports_router)
    app.include_router(users_router)
    app.include_router(dashboard_router)

    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    return app
