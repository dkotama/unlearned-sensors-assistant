import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings

# Load environment variables
load_dotenv()

# --- Environment specific settings ---
# Detect Cloud Workstations environment
IS_CLOUD_WORKSTATION = os.environ.get("CLOUD_WORKSTATIONS_CLUSTER_ID") is not None
DEFAULT_FRONTEND_URL = "http://localhost:3000"
if IS_CLOUD_WORKSTATION:
    # Construct the Cloud Workstations frontend URL
    # Example: https://3000-my-workstation-id.cluster-id.cloudworkstations.dev
    port = 3000
    host = os.environ.get("CLOUD_WORKSTATIONS_HOST", "")
    if host:
        host = host.replace("*.", f"{port}-")
        DEFAULT_FRONTEND_URL = f"https://{host}"
    else:
        # Fallback or log warning if host cannot be determined
        pass

FRONTEND_URL = os.environ.get("FRONTEND_URL", DEFAULT_FRONTEND_URL)
ALLOWED_ORIGINS = [FRONTEND_URL]
# Allow localhost explicitly for local dev even if FRONTEND_URL is set differently
if "localhost" not in FRONTEND_URL:
    ALLOWED_ORIGINS.append("http://localhost:3000")
# Add the specific Cloud Workstation URL from the logs if different from constructed one
CLOUD_WORKSTATION_LOG_URL = "https://3000-idx-unlearned-sensors-assistant-1745308035611.cluster-nzwlpk54dvagsxetkvxzbvslyi.cloudworkstations.dev"
if CLOUD_WORKSTATION_LOG_URL not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(CLOUD_WORKSTATION_LOG_URL)
# --- End Environment specific settings ---

# Set up logging
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)

logger = setup_logging()

# Log the determined frontend URL and allowed origins
logger.info(f"Default Frontend URL: {DEFAULT_FRONTEND_URL}")
logger.info(f"Configured Frontend URL (from env or default): {FRONTEND_URL}")
logger.info(f"Final Allowed CORS Origins: {ALLOWED_ORIGINS}")

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
    app = FastAPI(
        title="Unlearned Sensors Assistant API",
        description="API for the Unlearned Sensors Assistant project",
        version="1.0.0"
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS, # Use the determined list of origins
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

    # Frontend URL (kept for reference, but logic moved above)
    FRONTEND_URL: str = FRONTEND_URL

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
