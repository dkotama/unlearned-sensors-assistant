import time
from ..config import logger

# In-memory conversation state and chat history
conversation_state = {
    "step": "step_1",
    "last_user_input": None,
    "last_sensor": None,
    "chat_history": [],  # List to store chat history as {"role": "user" or "assistant", "content": "message"}
    "last_confirmation_time": 0  # Timestamp of the last confirmation response to prevent spamming
}

def get_conversation_state():
    """Get the current conversation state."""
    return conversation_state

def reset_conversation():
    """Reset the conversation state and history."""
    global conversation_state
    conversation_state = {
        "step": "step_1",
        "last_user_input": None, 
        "last_sensor": None,
        "chat_history": [],
        "last_confirmation_time": 0
    }
    logger.info("Conversation state reset")
    return conversation_state

def add_to_history(role, content):
    """Add a message to the chat history."""
    conversation_state["chat_history"].append({"role": role, "content": content})

def get_history_text():
    """Format the chat history as a text string."""
    return "\n".join([f"{entry['role']}: {entry['content']}" for entry in conversation_state["chat_history"]])

def update_step(new_step):
    """Update the conversation step."""
    previous_step = conversation_state["step"]
    conversation_state["step"] = new_step
    logger.info(f"Updated conversation step from {previous_step} to {new_step}")

def update_last_confirmation_time():
    """Update the last confirmation time to prevent spamming."""
    conversation_state["last_confirmation_time"] = time.time()

def should_throttle_confirmation():
    """Check if confirmation responses should be throttled."""
    return time.time() - conversation_state["last_confirmation_time"] < 2  # 2 seconds throttle

def extract_simplified_message(response_text):
    """Extract a simplified message based on the conversation state."""
    if conversation_state["step"] == "step_1":
        # Extract sensor name from response
        sensor_lines = [line for line in response_text.split('\n') if "Sensor Name:" in line]
        sensor_name = sensor_lines[0].split("Sensor Name:")[1].strip() if sensor_lines else "Unknown Sensor"
        conversation_state["last_sensor"] = sensor_name
        return f"Sensor suggested: {sensor_name}. Confirm if this matches your needs."
    elif conversation_state["step"] == "step_2":
        return f"Detailed setup for {conversation_state['last_sensor']}. Confirm if this is correct."
    elif conversation_state["step"] == "pdf_upload":
        return "Please upload a PDF to provide more details about the sensor."
    else:
        return response_text.split("\n")[0] if "\n" in response_text else response_text
