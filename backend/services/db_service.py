from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from typing import Dict, Any, List, Optional
import os

class MongoDBService:
    def __init__(self, connection_string: str = None, db_name: str = "sensors_db"):
        self.connection_string = connection_string or os.getenv("MONGODB_URI")
        self.db_name = db_name
        self.client = MongoClient(self.connection_string)
        self.db = self.client[self.db_name]
        self.collection = self.db["sensor_specifications"]
        
        # Create indexes for faster queries
        self.collection.create_index("model", unique=True)
        self.collection.create_index("sensor_type")
    
    def save_sensor(self, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save a sensor document to MongoDB.
        
        Args:
            sensor_data: Sensor data to save
            
        Returns:
            Saved sensor document
        """
        try:
            # Check if required fields are present
            required_fields = ["sensor_type", "manufacturer", "model"]
            for field in required_fields:
                if field not in sensor_data or not sensor_data[field]:
                    raise ValueError(f"Required field '{field}' is missing or empty")
            
            # Use upsert to update if exists or insert if new
            result = self.collection.update_one(
                {"model": sensor_data["model"]},
                {"$set": sensor_data},
                upsert=True
            )
            
            # Return the saved document
            return self.get_sensor_by_model(sensor_data["model"])
        except DuplicateKeyError:
            raise ValueError(f"Sensor with model '{sensor_data['model']}' already exists")
        except Exception as e:
            raise Exception(f"Error saving sensor data: {str(e)}")
    
    def get_all_sensors(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """
        Get all sensors with pagination.
        
        Args:
            limit: Maximum number of sensors to return
            skip: Number of sensors to skip
            
        Returns:
            List of sensor documents
        """
        try:
            cursor = self.collection.find({}).skip(skip).limit(limit)
            return list(cursor)
        except Exception as e:
            raise Exception(f"Error retrieving sensors: {str(e)}")
    
    def get_sensor_by_model(self, model: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific sensor by model.
        
        Args:
            model: Sensor model to retrieve
            
        Returns:
            Sensor document or None if not found
        """
        try:
            return self.collection.find_one({"model": model})
        except Exception as e:
            raise Exception(f"Error retrieving sensor: {str(e)}")
    
    def filter_sensors(self, filter_dict: Dict[str, Any], limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """
        Filter sensors by specified criteria.
        
        Args:
            filter_dict: Dictionary of filter criteria
            limit: Maximum number of sensors to return
            skip: Number of sensors to skip
            
        Returns:
            List of filtered sensor documents
        """
        try:
            cursor = self.collection.find(filter_dict).skip(skip).limit(limit)
            return list(cursor)
        except Exception as e:
            raise Exception(f"Error filtering sensors: {str(e)}")
