import spacy
from spacy.matcher import Matcher
from ..config import logger

# Load spaCy model
nlp = spacy.load("en_core_web_sm")
matcher = Matcher(nlp.vocab)

# Define intent patterns for spaCy Matcher
def setup_intent_patterns():
    """Set up intent patterns for spaCy Matcher."""
    # Pattern for Step 1 confirmation ("Does this sensor match your needs?")
    confirm_sensor_step1_patterns = [
        [{"LOWER": "does"}, {"LOWER": "this"}, {"LOWER": "sensor"}, {"LOWER": "match"}, {"LOWER": "your"}, {"LOWER": "needs"}],
        [{"LOWER": "sensor"}, {"LOWER": "name"}, {"OP": "*"}, {"LOWER": "does"}, {"LOWER": "this"}, {"LOWER": "sensor"}, {"LOWER": "match"}],
        [{"LOWER": "please"}, {"LOWER": "respond"}, {"LOWER": "with"}, {"TEXT": "'"}, {"LOWER": "yes"}, {"TEXT": "'"}, {"LOWER": "or"}, {"TEXT": "'"}, {"LOWER": "no"}, {"TEXT": "'"}],
        # More specific patterns for step 1
        [{"LOWER": "match"}, {"LOWER": "your"}, {"LOWER": "needs"}],
        [{"LOWER": "suitable"}, {"LOWER": "for"}, {"LOWER": "your"}, {"LOWER": "application"}],
        # Additional patterns to improve detection
        [{"LOWER": "does"}, {"OP": "*"}, {"LOWER": "match"}, {"OP": "*"}, {"LOWER": "needs"}],
        [{"TEXT": "?"}, {"OP": "+"}, {"LOWER": "please"}, {"LOWER": "respond"}],
        [{"LOWER": "please"}, {"LOWER": "respond"}, {"LOWER": "with"}, {"OP": "*"}, {"LOWER": "yes"}, {"OP": "*"}, {"LOWER": "no"}],
        [{"LOWER": "please"}, {"OP": "*"}, {"LOWER": "yes"}, {"OP": "*"}, {"LOWER": "no"}]
    ]
    matcher.add("CONFIRM_SENSOR_STEP1", confirm_sensor_step1_patterns)

    # Pattern for Step 2 confirmation ("Does this sensor setup and information look correct?")
    confirm_sensor_step2_patterns = [
        [{"LOWER": "does"}, {"LOWER": "this"}, {"LOWER": "setup"}, {"LOWER": "look"}, {"LOWER": "correct"}],
        [{"LOWER": "please"}, {"LOWER": "confirm"}, {"LOWER": "this"}, {"LOWER": "sensor"}],
        [{"LOWER": "is"}, {"LOWER": "this"}, {"LOWER": "setup"}, {"LOWER": "correct"}],
        # More specific patterns for step 2
        [{"LOWER": "specifications"}, {"LOWER": "and"}, {"LOWER": "setup"}],
        [{"LOWER": "detailed"}, {"LOWER": "setup"}],
        [{"LOWER": "confirm"}, {"LOWER": "if"}, {"LOWER": "this"}, {"LOWER": "is"}, {"LOWER": "correct"}]
    ]
    matcher.add("CONFIRM_SENSOR_STEP2", confirm_sensor_step2_patterns)

    # Pattern for "pdf_upload"
    pdf_upload_patterns = [
        [{"LOWER": "please"}, {"LOWER": "upload"}, {"LOWER": "a"}, {"LOWER": "pdf"}],
        [{"LOWER": "provide"}, {"LOWER": "a"}, {"LOWER": "document"}],
        [{"LOWER": "upload"}, {"LOWER": "pdf"}],
        [{"LOWER": "datasheet"}, {"LOWER": "or"}, {"LOWER": "documentation"}],
        [{"LOWER": "share"}, {"LOWER": "it"}, {"LOWER": "with"}, {"LOWER": "me"}],
        [{"LOWER": "feel"}, {"LOWER": "free"}, {"LOWER": "to"}, {"LOWER": "share"}],
        [{"LOWER": "if"}, {"LOWER": "you"}, {"LOWER": "have"}, {"LOWER": "a"}, {"LOWER": "datasheet"}]
    ]
    matcher.add("PDF_UPLOAD", pdf_upload_patterns)
    logger.debug("Initialized spaCy Matcher with intent patterns")

# Initialize patterns
setup_intent_patterns()

def detect_intent(response_text, current_step):
    """Detect intent in AI response text."""
    doc = nlp(response_text)
    matches = matcher(doc)
    next_action = "none"
    
    # Log the full response for debugging
    logger.debug(f"Analyzing for intents: {response_text[:100]}...")

    # Check for matched intents based on conversation state
    for match_id, start, end in matches:
        intent = nlp.vocab.strings[match_id]
        matched_text = doc[start:end].text
        logger.debug(f"Matched intent: {intent} at span {start}:{end} with text: '{matched_text}'")
        
        if intent == "CONFIRM_SENSOR_STEP1":
            # If we're in step_1, this is a direct match
            # If not, we might need to reset the conversation state
            if current_step == "step_1":
                next_action = "confirm_sensor"
                logger.info(f"Setting next_action to 'confirm_sensor' based on CONFIRM_SENSOR_STEP1 match")
            else:
                # We found sensor confirmation text but we're not in step_1
                # This likely means we need to reset to step_1 for a new sensor
                next_action = "confirm_sensor"
                logger.info(f"Resetting to step_1 and setting next_action to 'confirm_sensor'")
            return next_action, "step_1"
        
        elif intent == "CONFIRM_SENSOR_STEP2" and current_step == "step_2":
            next_action = "confirm_sensor"
            logger.info(f"Setting next_action to 'confirm_sensor' based on CONFIRM_SENSOR_STEP2 match")
            return next_action, current_step
        
        elif intent == "PDF_UPLOAD":
            next_action = "pdf_upload"
            logger.info(f"Setting next_action to 'pdf_upload' based on PDF_UPLOAD match")
            return next_action, "pdf_upload"

    # If no match was found but text contains likely confirmation phrases, set action anyway
    confirmation_phrases = [
        "match your needs", 
        "please respond with 'yes' or 'no'",
        "does this sensor match",
        "respond with yes or no"
    ]
    
    # Check if any confirmation phrase is in the response
    if any(phrase in response_text.lower() for phrase in confirmation_phrases):
        # Set the appropriate next_action based on which step we're in or assume step_1
        if "specifications" in response_text.lower() or "setup" in response_text.lower():
            next_action = "confirm_sensor"
            logger.info(f"Setting next_action to 'confirm_sensor' (step 2) based on keyword detection")
            return next_action, "step_2"
        else:
            next_action = "confirm_sensor"
            logger.info(f"Setting next_action to 'confirm_sensor' (step 1) based on keyword detection")
            return next_action, "step_1"
    
    # No intent detected
    return next_action, current_step
