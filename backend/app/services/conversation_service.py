from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID

from app.repositories.conversation import conversation_repo, ConversationCreate, ConversationUpdate
from app.repositories.message import message_repo, MessageCreate
from app.models.database import Conversation, Message
from app.models.chat import Message as ChatMessage, Conversation as ChatConversation

class ConversationService:
    def create_conversation(self, db: Session, title: Optional[str] = None) -> Conversation:
        """Create a new conversation and return it."""
        conversation_in = ConversationCreate(title=title or "New Conversation")
        conversation = conversation_repo.create(db, obj_in=conversation_in)

        # Add initial system message
        self.add_message(
            db=db,
            conversation_id=str(conversation.id),
            role="system",
            content="You are a helpful assistant."
        )

        return conversation

    def get_conversation(self, db: Session, conversation_id: str) -> Optional[Conversation]:
        """Get a conversation by ID."""
        return conversation_repo.get(db, id=conversation_id)

    def get_recent_conversations(self, db: Session, limit: int = 10) -> List[Conversation]:
        """Get recent conversations."""
        return conversation_repo.get_recent(db, limit=limit)

    def update_conversation(
        self, db: Session, conversation_id: str, title: Optional[str] = None, summary: Optional[str] = None
    ) -> Conversation:
        """Update conversation title or summary."""
        conversation = self.get_conversation(db, conversation_id)
        if not conversation:
            raise ValueError(f"Conversation with ID {conversation_id} not found")

        conversation_update = ConversationUpdate(
            title=title,
            summary=summary
        )
        return conversation_repo.update(db, db_obj=conversation, obj_in=conversation_update)

    def add_message(
        self, db: Session, conversation_id: str, role: str, content: str,
        tokens_used: Optional[int] = None, model: Optional[str] = None
    ) -> Message:
        """Add a message to a conversation."""
        # Ensure conversation exists
        conversation = self.get_conversation(db, conversation_id)
        if not conversation:
            raise ValueError(f"Conversation with ID {conversation_id} not found")

        message_in = MessageCreate(
            conversation_id=conversation_id,
            role=role,
            content=content,
            tokens_used=tokens_used,
            model=model
        )

        return message_repo.create(db, obj_in=message_in)

    def get_messages(self, db: Session, conversation_id: str) -> List[Message]:
        """Get all messages in a conversation."""
        conversation = self.get_conversation(db, conversation_id)
        if not conversation:
            raise ValueError(f"Conversation with ID {conversation_id} not found")

        return message_repo.get_by_conversation(db, conversation_id=conversation_id)

    def get_conversation_with_messages(self, db: Session, conversation_id: str) -> ChatConversation:
        """Get a conversation with all its messages in a format suitable for the chat UI."""
        conversation = self.get_conversation(db, conversation_id)
        if not conversation:
            raise ValueError(f"Conversation with ID {conversation_id} not found")

        messages = self.get_messages(db, conversation_id=str(conversation.id))

        # Convert DB models to Pydantic models
        chat_messages = [
            ChatMessage(role=msg.role, content=msg.content)
            for msg in messages
        ]

        return ChatConversation(
            id=str(conversation.id),
            messages=chat_messages
        )

# Create a singleton instance
conversation_service = ConversationService()