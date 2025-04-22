import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings

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

class Config:
    # Application settings
    APP_NAME = "Sensor Datasheet Processor"
    DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # MongoDB settings
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "sensors_db")
    
    # PDF settings
    # Use relative path - pdfs directory will be inside the backend folder
    PDF_DIRECTORY = os.getenv("PDF_DIRECTORY", os.path.join(os.path.dirname(__file__), "pdfs"))
     
    # API settings
    API_PREFIX = "/api/v1"

# Settings class using Pydantic
class Settings(BaseSettings):
    # API settings
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    debug: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # Database settings
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name: str = os.getenv("DB_NAME", "sensors_db")
    mongodb_username: str = os.getenv("MONGODB_USERNAME", "")
    mongodb_password: str = os.getenv("MONGODB_PASSWORD", "")
    mongodb_database: str = os.getenv("MONGODB_DATABASE", "sensors_db")
    
    # API keys
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    
    # PDF settings
    pdf_directory: str = os.getenv("PDF_DIRECTORY", os.path.join(os.path.dirname(__file__), "pdfs"))
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # This allows extra fields without validation errors

# Create settings instance
settings = Settings()
