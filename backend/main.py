from config import create_app, logger

# Option 1: If using relative imports
from .routes.api import router

# Option 2: If main.py is at the package root
# from backend.routes.api import router 

# Option 3: If backend is in the Python path
# from routes.api import router

# Create FastAPI app
app = create_app()

# Add API router
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)