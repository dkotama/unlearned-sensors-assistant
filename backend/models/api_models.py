from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class ChatRequest(BaseModel):
    message: str = ""  # Support 'message' field
    query: str = ""    # Support 'query' field as an alternative
    model: str = "meta-llama/llama-3.1-8b-instruct"
    auto_confirm: bool = False  # Flag to indicate if this is an auto-confirmed "yes" response

class ChatResponse(BaseModel):
    simplified_message: str  # Concise message for MultifunctionBox
    response: str  # Full raw text response from the model
    next_action: str
    chat_history: list  # Return the updated chat history
