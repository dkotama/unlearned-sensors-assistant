from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
import os
from config import logger, get_api_key, DEFAULT_MODEL

def load_prompt_template():
    """Load the prompt template from file."""
    try:
        with open('iot_prompt.txt', 'r', encoding='utf-8') as file:
            iot_prompt = file.read()
        logger.info("Successfully loaded prompt from iot_prompt.txt")
        logger.debug(f"Prompt content: {iot_prompt}")
        
        # Define LangChain PromptTemplate with explicit input variables
        # Include chat history in the prompt
        template = "Chat History:\n{history}\n\n" + iot_prompt + "\n\nUser input: {user_input}\n\nAssistant Response:\n"
        return PromptTemplate(
            template=template,
            input_variables=["history", "user_input"]
        )
    except FileNotFoundError as e:
        logger.error("iot_prompt.txt not found. Please ensure the file exists.")
        raise FileNotFoundError("iot_prompt.txt not found. Please ensure the file exists.") from e
    except Exception as e:
        logger.error(f"Error loading iot_prompt.txt: {str(e)}")
        raise

def create_llm(model_name=DEFAULT_MODEL, temperature=0.7):
    """Create a new LLM instance with the specified model."""
    api_key = get_api_key()
    llm = ChatOpenAI(
        openai_api_key=api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        model=model_name,
        temperature=temperature,
        default_headers={
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "OpenRouter Chatbot"
        }
    )
    logger.debug(f"Initialized ChatOpenAI with model: {model_name}, temperature: {temperature}")
    return llm

def create_chain(model_name=DEFAULT_MODEL, temperature=0.7):
    """Create a new LLMChain with the specified model."""
    prompt = load_prompt_template()
    llm = create_llm(model_name, temperature)
    chain = LLMChain(prompt=prompt, llm=llm)
    logger.debug(f"Created LLMChain with model: {model_name}")
    return chain

def create_extraction_chain(model_name: str = None, temperature: float = 0.1):
    """
    Create a specialized LLM chain for datasheet extraction that doesn't require chat history.
    
    Args:
        model_name: Name of the model to use (defaults to config)
        temperature: Sampling temperature (0.0-1.0)
        
    Returns:
        LLMChain: A configured chain for extraction tasks
    """
    from langchain.prompts import PromptTemplate
    from langchain.chains import LLMChain
    
    # Use default model from config if not specified
    if not model_name:
        model_name = os.getenv("LLM_MODEL", "meta-llama/llama-3.1-8b-instruct")
    
    logger.debug(f"Created extraction LLMChain with model: {model_name}")
    
    # Create LLM instance - use create_llm instead of get_llm
    llm = create_llm(model_name, temperature)
    
    # Create a prompt template specifically for extraction (only requires user_input)
    extraction_prompt = PromptTemplate(
        input_variables=["user_input"],
        template="{user_input}"
    )
    
    # Return a chain with the extraction prompt
    return LLMChain(llm=llm, prompt=extraction_prompt)
