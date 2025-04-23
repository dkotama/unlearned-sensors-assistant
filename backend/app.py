from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List, Dict, Any

from services.pdf_processor import PDFProcessor
from services.data_extractor import DataExtractor
from services.db_service import MongoDBService
from config import Config

from fastapi import Request
from fastapi.exceptions import HTTPException
import logging

app = FastAPI(title=Config.APP_NAME)

@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: HTTPException):
    logging.error(f"404 Error: {request.url} not found")
    return {"detail": "Not found"}, 404

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[Config.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB service
def get_db_service():
    return MongoDBService(
        connection_string=Config.MONGODB_URI,
        db_name=Config.DB_NAME
    )

@app.get("/")
async def root():
    return {"message": "Sensor Datasheet Processing API"}

@app.get(f"{Config.API_PREFIX}/sensors")
async def get_sensors(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db_service: MongoDBService = Depends(get_db_service)
):
    """Get all sensors with pagination."""
    try:
        sensors = db_service.get_all_sensors(limit=limit, skip=skip)
        return {
            "total": len(sensors),
            "sensors": sensors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{Config.API_PREFIX}/sensor/{{model}}")
async def get_sensor(
    model: str,
    db_service: MongoDBService = Depends(get_db_service)
):
    """Get a specific sensor by model."""
    try:
        sensor = db_service.get_sensor_by_model(model)
        if sensor is None:
            raise HTTPException(status_code=404, detail=f"Sensor with model {model} not found")
        return sensor
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post(f"{Config.API_PREFIX}/process-pdf")
async def process_pdf(
    background_tasks: BackgroundTasks,
    db_service: MongoDBService = Depends(get_db_service)
):
    """Process all PDFs in the configured directory."""
    try:
        # This will be executed in the background
        background_tasks.add_task(process_pdfs_task, db_service)
        
        return {"message": "PDF processing started in the background"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_pdfs_task(db_service: MongoDBService):
    """
    Background task to process PDFs.
    """
    try:
        pdf_processor = PDFProcessor(Config.PDF_DIRECTORY)
        data_extractor = DataExtractor(Config.OPENAI_API_KEY)
        
        # Load and chunk PDFs
        pages = pdf_processor.process_directory()
        
        # Extract data from pages
        sensors_data = data_extractor.extract_from_pages(pages)
        
        # Save to MongoDB
        for sensor_data in sensors_data:
            db_service.save_sensor(sensor_data)
            
    except Exception as e:
        print(f"Error in background task: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
