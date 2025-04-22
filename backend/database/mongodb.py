import motor.motor_asyncio
from config import settings, logger

_client = None
_db = None

async def get_database():
    """
    Get the MongoDB database instance.
    """
    global _client, _db
    
    if _db is None:
        # Create a new client and connect to the server
        try:
            logger.info(f"Connecting to MongoDB at {settings.mongodb_uri.split('@')[-1]}")
            _client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_uri)
            _db = _client[settings.mongodb_database]
            
            # Create indexes
            await _db.sensor_specifications.create_index("model")
            await _db.sensor_specifications.create_index("sensor_type")
            
            # Verify connection
            await _client.admin.command('ping')
            logger.info("Connected to MongoDB successfully")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    return _db
