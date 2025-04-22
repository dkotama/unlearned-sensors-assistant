# Project Structure

This document outlines the structure of the Sensor Datasheet Processing project.

## Directory Structure

```
unlearned-sensors-assistant/
├── backend/                # Python backend code
│   ├── app.py              # Main FastAPI application
│   ├── config.py           # Configuration settings
│   ├── pdfs/               # Directory for PDF files to be processed
│   ├── models/             # Pydantic models
│   │   └── sensor.py       # Sensor data schema
│   └── services/           # Core services
│       ├── pdf_processor.py   # PDF loading and chunking
│       ├── data_extractor.py  # AI-based data extraction
│       └── db_service.py      # MongoDB integration
└── frontend/               # React frontend (to be implemented)
```

## Path Handling

This project uses relative paths to maintain portability across different environments:

1. PDF files should be placed in the `backend/pdfs/` directory
2. All imports use relative paths
3. The configuration uses `os.path.dirname(__file__)` to locate paths relative to the file location

## Running the Application

When running the application, make sure your current working directory is the `backend/` directory:

```bash
cd D:\projects\phd\unlearned-sensors-assistant\backend
python app.py
```

This ensures all relative paths work correctly.
