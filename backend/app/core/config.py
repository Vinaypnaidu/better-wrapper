import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/chat_app")

    # API settings
    API_PREFIX: str = "/api"
    MAX_TOKENS: int = 500

    # CORS settings
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

# Create settings instance
settings = Settings()

# Validate required settings
if not settings.OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")