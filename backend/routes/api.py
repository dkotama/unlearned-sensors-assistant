import time
from fastapi import HTTPException, UploadFile, File, APIRouter
from ..config import logger
from ..models.api_models import ChatRequest, ChatResponse
from ..llm.client import create_chain
from ..services.conversation import (
    get_conversation_state, reset_conversation, add_to_history, 
    get_history_text, update_step, update_last_confirmation_time,
    should_throttle_confirmation, extract_simplified_message
)
from ..services.intent_detection import detect_intent

# Create router - make sure this is at the module level and not inside a function or class
router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Use 'message' if provided, otherwise fall back to 'query'
        user_input = request.message if request.message else request.query
        if not user_input:
            logger.warning("No message or query provided in request")
            raise HTTPException(status_code=400, detail="Message or query field is required")

        # Get current conversation state
        conversation_state = get_conversation_state()
        
        # Log the incoming request
        logger.debug(f"Incoming request: message='{request.message}', query='{request.query}', model='{request.model}', state={conversation_state}, auto_confirm={request.auto_confirm}")

        # Add user input to chat history (unless it's an auto-confirmed "yes")
        if not request.auto_confirm:
            add_to_history("user", user_input)
        else:
            # For auto-confirm, add "yes" to chat history to reflect user action
            add_to_history("user", "yes")

        # Check if user is responding to a previous confirmation
        if user_input.lower() in ["yes", "no"]:
            # Throttle confirmation responses to prevent spamming
            if should_throttle_confirmation():
                logger.warning("Confirmation response throttled to prevent spamming")
                raise HTTPException(status_code=429, detail="Too many requests. Please wait before confirming again.")
            update_last_confirmation_time()

            # Handle user response to previous confirmation
            if user_input.lower() == "no":
                update_step("pdf_upload")
                response_text = "Please upload a PDF with the sensor datasheet for further assistance."
                simplified_message = "Please upload a PDF to provide more details about the sensor."
                add_to_history("assistant", response_text)
                logger.info(f"User responded 'no', transitioning to pdf_upload")
                return ChatResponse(
                    simplified_message=simplified_message,
                    response=response_text,
                    next_action="pdf_upload",
                    chat_history=conversation_state["chat_history"]
                )
            elif user_input.lower() == "yes":
                if conversation_state["step"] == "step_1":
                    # User confirmed the sensor, move to step 2
                    update_step("step_2")
                    logger.info(f"User confirmed sensor, transitioning from step_1 to step_2")
                    user_input = f"Confirmed sensor for {conversation_state['last_user_input']}. Provide detailed specifications and setup."
                elif conversation_state["step"] == "step_2":
                    # User confirmed the setup, move to completion
                    update_step("completed")
                    response_text = "Sensor setup confirmed. You can now proceed with implementation."
                    simplified_message = "Sensor setup confirmed. Proceed with implementation."
                    add_to_history("assistant", response_text)
                    logger.info(f"User confirmed setup, transitioning to completed state")
                    return ChatResponse(
                        simplified_message=simplified_message,
                        response=response_text,
                        next_action="continue",
                        chat_history=conversation_state["chat_history"]
                    )

        # Create LLM chain with appropriate model
        current_chain = create_chain(model_name=request.model, temperature=0.1)

        # Format chat history for the prompt
        history_text = get_history_text()

        # Run LangChain chain with chat history
        ai_response = await current_chain.ainvoke({"history": history_text, "user_input": user_input})
        response_text = ai_response["text"]
        logger.debug(f"Raw AI response: {response_text}")

        # Add AI response to chat history
        add_to_history("assistant", response_text)

        # Process the response with spaCy to detect intent
        next_action, detected_step = detect_intent(response_text, conversation_state["step"])
        
        # Update step if intent detection suggests a different step
        if detected_step != conversation_state["step"]:
            update_step(detected_step)

        # Extract simplified message based on conversation state
        simplified_message = extract_simplified_message(response_text)

        # Reset state if starting a new conversation
        if conversation_state["step"] == "step_1" and user_input != conversation_state["last_user_input"]:
            conversation_state["last_user_input"] = user_input

        # Log the determined next_action
        logger.info(f"Determined next_action: {next_action}")

        # Send the simplified message, full response, next_action, and chat history
        return ChatResponse(
            simplified_message=simplified_message,
            response=response_text,
            next_action=next_action,
            chat_history=conversation_state["chat_history"]
        )

    except Exception as e:
        logger.error(f"Error during AI interaction: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/sensor/confirm")
async def confirm_sensor(request: ChatRequest):
    """
    Handle sensor confirmation (yes/no).
    """
    user_input = request.message if request.message else request.query
    logger.debug(f"Received sensor confirmation: message='{user_input}'")
    if user_input.lower() == "yes":
        response = {"message": "Sensor setup confirmed. Proceeding with setup.", "next_action": "continue"}
        logger.info(f"Sending confirmation response: {response}")
        return response
    elif user_input.lower() == "no":
        response = {"message": "Please upload a PDF to review the correct sensor configuration.", "next_action": "pdf_upload"}
        logger.info(f"Sending confirmation response: {response}")
        return response
    else:
        logger.warning(f"Invalid confirmation response: {user_input}")
        raise HTTPException(status_code=400, detail="Invalid response. Please respond with 'yes' or 'no'.")

@router.post("/pdf/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Handle PDF file upload and chunking.
    """
    try:
        content = await file.read()
        logger.debug(f"Uploaded PDF: filename='{file.filename}', size={len(content)} bytes")
        response = {"message": "PDF processed. Returning to default state.", "next_action": "none"}
        logger.info(f"Sending upload response: {response}")
        return response
    except Exception as e:
        logger.error(f"Error while processing PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing PDF.")

@router.post("/reset")
async def reset_api():
    """
    Reset the conversation state and history.
    """
    reset_conversation()
    return {"message": "Conversation reset successfully", "status": "success"}

@router.get("/debug/state")
async def debug_state():
    """
    Return the current conversation state for debugging.
    """
    conversation_state = get_conversation_state()
    logger.info(f"Debug endpoint accessed. Current state: {conversation_state}")
    return {
        "state": conversation_state,
        "timestamp": time.time()
    }
