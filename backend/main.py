import sys
import os
import uvicorn
from routes.api import router
from dotenv import load_dotenv

# Add the parent directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings, logger, create_app # Import create_app

# Load environment variables (optional, as config might load it too)
load_dotenv()

# Create FastAPI app using the factory function from config
app = create_app()

# Include API router with the v1 prefix to match Config.API_PREFIX from config.py
app.include_router(router, prefix="/api/v1")

# Remove CORS middleware addition here, as it's handled in create_app
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

@app.get("/")
async def root():
    """
    Root endpoint to check if the API is running.
    """
    return {"message": "Unlearned Sensors Assistant API is running"}

if __name__ == "__main__":
    logger.info(f"Starting server on {settings.host}:{settings.port}")
    uvicorn.run(
        "main:app", # Reference the app created in this file
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
