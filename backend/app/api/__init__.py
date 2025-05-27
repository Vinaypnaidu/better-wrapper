from fastapi import APIRouter
from app.api.routes.chat import router as chat_router
from app.api.routes.conversations import router as conversations_router

router = APIRouter()
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(conversations_router, prefix="/conversations", tags=["conversations"])