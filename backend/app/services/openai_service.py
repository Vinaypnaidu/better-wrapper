from openai import OpenAI
from app.core.config import settings
from app.services.conversation_service import conversation_service
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    async def generate_response(
        self, db: Session, user_message: str, conversation_id: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Generate a response from OpenAI based on the user message and conversation history.

        Args:
            db: Database session
            user_message: The user's message
            conversation_id: Optional ID of the existing conversation

        Returns:
            Tuple of (assistant_response, conversation_id)
        """
        # If no conversation ID is provided or the conversation doesn't exist, create a new one
        conversation = None
        if conversation_id:
            conversation = conversation_service.get_conversation(db, conversation_id)

        if not conversation:
            conversation = conversation_service.create_conversation(db)
            conversation_id = str(conversation.id)

        # Add the user message to the conversation
        conversation_service.add_message(db, conversation_id, "user", user_message)

        # Get all messages for the conversation
        messages = conversation_service.get_messages(db, conversation_id)

        # Convert to the format expected by OpenAI API
        openai_messages = [{"role": msg.role, "content": msg.content} for msg in messages]

        # Call OpenAI API with the conversation history
        response = self.client.chat.completions.create(
            model=self.model,
            messages=openai_messages,
            max_tokens=settings.MAX_TOKENS
        )

        # Extract response content and token usage
        assistant_message = response.choices[0].message.content
        tokens_used = response.usage.total_tokens

        # Add the assistant's response to the conversation
        conversation_service.add_message(
            db,
            conversation_id,
            "assistant",
            assistant_message,
            tokens_used=tokens_used,
            model=self.model
        )

        return assistant_message, conversation_id

# Create a singleton instance
openai_service = OpenAIService()