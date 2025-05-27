from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.chat import MessageRequest, MessageResponse
from app.services.openai_service import openai_service
from app.db.session import get_db

router = APIRouter()

@router.post("/", response_model=MessageResponse)
async def chat_endpoint(req: MessageRequest, db: Session = Depends(get_db)):
    try:
        # Generate response using the OpenAI service
        reply, conversation_id = await openai_service.generate_response(
            db,
            req.message,
            req.conversation_id
        )

        # Return the response with the conversation ID
        return MessageResponse(
            reply=reply,
            conversation_id=conversation_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))