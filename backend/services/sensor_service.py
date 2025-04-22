from database.mongodb import get_database
from config import logger

async def get_all_sensors():
    """
    Get all sensors from the database.
    
    Returns:
        list: List of sensors with basic information
    """
    db = await get_database()
    sensors = await db.sensor_specifications.find({}).to_list(length=100)  # Limit to 100 sensors
    
    # Convert MongoDB ObjectId to string
    for sensor in sensors:
        sensor["_id"] = str(sensor["_id"])
    
    logger.info(f"Retrieved {len(sensors)} sensors from database")
    return sensors

async def get_sensor_by_model(model: str):
    """
    Get sensor details by model.
    
    Args:
        model: The sensor model to retrieve
        
    Returns:
        dict: Sensor details or None if not found
    """
    db = await get_database()
    sensor = await db.sensor_specifications.find_one({"model": model})
    
    if sensor:
        # Convert MongoDB ObjectId to string
        sensor["_id"] = str(sensor["_id"])
        logger.info(f"Retrieved sensor details for model {model}")
    else:
        logger.warning(f"Sensor with model {model} not found")
    
    return sensor

async def debug_mongodb_connection():
    """
    Debug function to test direct MongoDB connection and query.
    
    Returns:
        dict: Connection status and sample document
    """
    try:
        db = await get_database()
        # Check if collection exists
        collections = await db.list_collection_names()
        
        # Get document count
        count = await db.sensor_specifications.count_documents({})
        
        # Get a sample document if any exist
        sample = None
        if count > 0:
            sample = await db.sensor_specifications.find_one({})
            if sample:
                sample["_id"] = str(sample["_id"])
        
        return {
            "status": "connected",
            "database": db.name,
            "collections": collections,
            "sensor_count": count,
            "sample_document": sample
        }
    except Exception as e:
        logger.error(f"MongoDB connection test failed: {str(e)}")
        return {"status": "error", "message": str(e)}
