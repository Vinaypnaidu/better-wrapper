from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import router as api_router
from app.db.init_db import init_db

app = FastAPI(title="Chat API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Include API routes
app.include_router(api_router, prefix=settings.API_PREFIX)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}