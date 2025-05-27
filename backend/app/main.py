from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)

class MessageRequest(BaseModel):
    message: str

class MessageResponse(BaseModel):
    reply: str

@app.post("/", response_model=MessageResponse)
def chat_endpoint(req: MessageRequest):
    return {"reply": "hello"} 