from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.database import Conversation
from app.repositories.base import BaseRepository

# Define schema classes for conversation
class ConversationCreate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None

class ConversationRepository(BaseRepository[Conversation, ConversationCreate, ConversationUpdate]):
    def get_recent(self, db: Session, limit: int = 10) -> List[Conversation]:
        """Get most recent conversations ordered by updated_at."""
        return db.query(Conversation).order_by(Conversation.updated_at.desc()).limit(limit).all()

# Create repository instance
conversation_repo = ConversationRepository(Conversation)