from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.database import Message
from app.repositories.base import BaseRepository

# Define schema classes for message
class MessageCreate(BaseModel):
    conversation_id: str
    role: str
    content: str
    tokens_used: Optional[int] = None
    model: Optional[str] = None

class MessageUpdate(BaseModel):
    tokens_used: Optional[int] = None
    model: Optional[str] = None

class MessageRepository(BaseRepository[Message, MessageCreate, MessageUpdate]):
    def get_by_conversation(self, db: Session, conversation_id: str) -> List[Message]:
        """Get all messages for a conversation ordered by created_at."""
        return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()

# Create repository instance
message_repo = MessageRepository(Message)