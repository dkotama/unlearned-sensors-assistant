import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Set up logging
def setup_logging():
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)

logger = setup_logging()

# Get API key or raise error
def get_api_key():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("OPENROUTER_API_KEY is not set in environment variables.")
        raise RuntimeError("OPENROUTER_API_KEY is not set in environment variables.")
    logger.debug(f"Loaded API key: {api_key[:5]}... (redacted for security)")
    return api_key

# Create and configure FastAPI app
def create_app():
    app = FastAPI()
    
    # Enable CORS for frontend communication
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app

# Default model
DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct"
