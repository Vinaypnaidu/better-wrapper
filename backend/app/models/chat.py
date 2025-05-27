from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class Message(BaseModel):
    role: Literal["system", "user", "assistant"] = Field(..., description="Role of the message sender")
    content: str = Field(..., description="Message content")

class MessageRequest(BaseModel):
    message: str = Field(..., description="User message")
    conversation_id: Optional[str] = Field(None, description="Unique identifier for the conversation")

class MessageResponse(BaseModel):
    reply: str = Field(..., description="Assistant reply")
    conversation_id: str = Field(..., description="Unique identifier for the conversation")

class Conversation(BaseModel):
    id: str = Field(..., description="Unique identifier for the conversation")
    messages: List[Message] = Field(default_factory=list, description="List of messages in the conversation")