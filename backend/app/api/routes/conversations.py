from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.services.conversation_service import conversation_service
from app.models.chat import Conversation, Message

router = APIRouter()

# Response models
class ConversationResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    created_at: str
    updated_at: str

class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]

class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    messages: List[Message]

# Request models
class ConversationCreateRequest(BaseModel):
    title: Optional[str] = Field(None, description="Optional title for the conversation")

class ConversationUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, description="New title for the conversation")
    summary: Optional[str] = Field(None, description="Summary of the conversation")

@router.get("/", response_model=ConversationListResponse)
async def list_conversations(
    limit: int = Query(10, description="Maximum number of conversations to return"),
    db: Session = Depends(get_db)
):
    """Get list of recent conversations."""
    try:
        conversations = conversation_service.get_recent_conversations(db, limit=limit)
        return ConversationListResponse(
            conversations=[
                ConversationResponse(
                    id=str(conv.id),
                    title=conv.title,
                    summary=conv.summary,
                    created_at=conv.created_at.isoformat(),
                    updated_at=conv.updated_at.isoformat()
                )
                for conv in conversations
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ConversationResponse)
async def create_conversation(
    request: ConversationCreateRequest = None,
    db: Session = Depends(get_db)
):
    """Create a new conversation."""
    try:
        title = None
        if request:
            title = request.title

        conversation = conversation_service.create_conversation(db, title=title)
        return ConversationResponse(
            id=str(conversation.id),
            title=conversation.title,
            summary=conversation.summary,
            created_at=conversation.created_at.isoformat(),
            updated_at=conversation.updated_at.isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Get a conversation with all its messages."""
    try:
        # Get the conversation
        conversation = conversation_service.get_conversation(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get messages
        messages = conversation_service.get_messages(db, conversation_id)

        return ConversationDetailResponse(
            id=str(conversation.id),
            title=conversation.title,
            summary=conversation.summary,
            messages=[
                Message(role=msg.role, content=msg.content)
                for msg in messages
            ]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    request: ConversationUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update a conversation's title or summary."""
    try:
        updated = conversation_service.update_conversation(
            db,
            conversation_id,
            title=request.title,
            summary=request.summary
        )

        return ConversationResponse(
            id=str(updated.id),
            title=updated.title,
            summary=updated.summary,
            created_at=updated.created_at.isoformat(),
            updated_at=updated.updated_at.isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))