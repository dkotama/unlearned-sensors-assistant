# Use the new import path for PyPDFLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain.prompts import PromptTemplate
from io import BytesIO
import tempfile
import os
import json
from config import logger
# Use absolute imports instead of relative imports
from llm.client import create_extraction_chain  # Update import to use the extraction-specific chain
from database.mongodb import get_database
from typing import List, Dict, Any
from datetime import datetime
import re # Ensure re is imported at the top

class PDFProcessor:
    def __init__(self, pdf_dir: str = None):
        # If pdf_dir is not provided, use a directory relative to the current file
        if pdf_dir is None:
            # This makes the pdfs directory a sibling to the services directory
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            pdf_dir = os.path.join(backend_dir, "pdfs")
        
        self.pdf_dir = pdf_dir
        os.makedirs(self.pdf_dir, exist_ok=True)
    
    def load_and_chunk_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Load a PDF and chunk it by page.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of dictionaries containing page text and metadata
        """
        try:
            loader = PyPDFLoader(pdf_path)
            pages = loader.load()
            
            # Extract filename from path
            filename = os.path.basename(pdf_path)
            
            chunked_pages = []
            for i, page in enumerate(pages):
                # Create a structured document with metadata
                chunked_page = {
                    "text": page.page_content,
                    "metadata": {
                        "filename": filename,
                        "page_number": i + 1,
                        "total_pages": len(pages),
                        "processed_at": datetime.now().isoformat()
                    }
                }
                chunked_pages.append(chunked_page)
            
            return chunked_pages
        except Exception as e:
            logger.error(f"Error loading or chunking PDF '{pdf_path}': {str(e)}", exc_info=True)
            raise Exception(f"Error processing PDF: {str(e)}")
    
    def process_directory(self) -> List[Dict[str, Any]]:
        """
        Process all PDFs in the specified directory.
        
        Returns:
            List of all chunked pages from all PDFs
        """
        all_pages = []
        pdf_files = [f for f in os.listdir(self.pdf_dir) if f.lower().endswith('.pdf')]
        logger.info(f"Found {len(pdf_files)} PDF(s) in directory '{self.pdf_dir}'")
        
        for i, file in enumerate(pdf_files):
            pdf_path = os.path.join(self.pdf_dir, file)
            logger.info(f"Processing file {i+1}/{len(pdf_files)}: {file}")
            try:
                pages = self.load_and_chunk_pdf(pdf_path)
                all_pages.extend(pages)
                logger.info(f"Successfully loaded {len(pages)} pages from {file}")
            except Exception as e:
                logger.error(f"Failed to process {file}: {str(e)}")
        
        logger.info(f"Finished processing directory. Total pages loaded: {len(all_pages)}")
        return all_pages

async def process_pdf_datasheet(pdf_content: bytes, filename: str, model_name: str = None):
    """
    Process a PDF datasheet to extract structured data.
    
    Args:
        pdf_content: The binary content of the PDF
        filename: The original filename
        model_name: Optional model name to use for extraction (from frontend)
        
    Returns:
        dict: Extracted structured data
    """
    # Use the provided model if available, otherwise fallback to default
    extraction_model = model_name if model_name else "meta-llama/llama-3.1-8b-instruct"
    
    logger.info(f"Starting PDF datasheet processing for: {filename} using model: {extraction_model}")
    # Simulate progress: Step 1/5 - Saving temporary file
    logger.info(f"Progress update for {filename}: [1/5] Saving temporary file.")
    
    # Save the PDF content to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        temp_file_path = temp_file.name
        temp_file.write(pdf_content)
    
    try:
        # Simulate progress: Step 2/5 - Loading PDF
        logger.info(f"Progress update for {filename}: [2/5] Loading PDF pages.")
        # Load the PDF and chunk by page
        loader = PyPDFLoader(temp_file_path)
        pages = loader.load()
        
        total_pages_to_process = len(pages)
        logger.info(f"Loaded {total_pages_to_process} pages from PDF: {filename}")
        
        # Simulate progress: Step 3/5 - Extracting data using LLM
        logger.info(f"Progress update for {filename}: [3/5] Extracting data using model: {extraction_model}")
        # Create extraction-specific chain using the selected model
        extraction_chain = create_extraction_chain(model_name=extraction_model, temperature=0.1)
        
        # Process each page and extract structured data
        all_extracted_data = []
        # Limit processing for efficiency, adjust as needed
        pages_to_process_limit = min(5, total_pages_to_process) 
        
        # Guess the sensor type from filename to help the extraction
        possible_sensor_type = guess_sensor_type_from_filename(filename)
        
        for i, page in enumerate(pages[:pages_to_process_limit]):
            current_page_num = i + 1
            logger.info(f"Processing page {current_page_num}/{pages_to_process_limit} for {filename}")
            
            # Extract text from the page
            page_text = page.page_content
            
            # Skip pages with too little text
            if len(page_text.strip()) < 50:
                logger.debug(f"Skipping page {current_page_num} - insufficient text content")
                continue
                
            # Define the extraction prompt - using a more structured approach with additional context
            prompt_text = """You are a specialized AI for extracting structured data from sensor datasheets.
            
Your task is to analyze the following text from a sensor datasheet and extract key information into a well-structured JSON format.

Extract ONLY the following information, setting fields to null if not found:
- sensor_type: The type of sensor (e.g., "Temperature Sensor", "Light Sensor", "Pressure Sensor", "Torque Sensor")
- manufacturer: The company that makes the sensor
- model: The specific model number or name of the sensor
- specifications: An object containing these nested objects:
  - performance: Include fields like sensitivity, range, accuracy, resolution, response_time
  - electrical: Include fields like power_supply, current_consumption, output_type, interface
  - mechanical: Include fields like dimensions, weight, mounting_options, package_type
  - environmental: Include fields like operating_temp, storage_temp, humidity_range, protection_rating

For each field, include the exact value FROM THE TEXT, with units if specified.
If you're not 100% sure about a value, set it to null.
If you find additional important information that doesn't fit the schema, include it in an "extra_fields" object.

Sensor model from filename appears to be: {model_hint}
This may be a {sensor_type_hint} based on the filename.

Text from page {page_num} of {total_pages}:
{page_text}

Respond ONLY with a valid JSON object containing the extracted information. Do not include any explanations or notes outside the JSON structure.
"""
            
            try:
                # Get model name from filename for hint
                model_hint = os.path.splitext(os.path.basename(filename))[0]
                
                # Invoke the LLM chain with the prompt - no history parameter needed now
                extraction_result = await extraction_chain.ainvoke({
                    "user_input": prompt_text.format(
                        page_num=current_page_num,
                        total_pages=total_pages_to_process,
                        page_text=page_text[:8000],  # Limit text length to avoid token limits
                        model_hint=model_hint,
                        sensor_type_hint=possible_sensor_type or "sensor"
                    )
                })
                
                # Extract the text response from the LLM
                response_text = extraction_result.get("text", "")
                logger.debug(f"Raw extraction response: {response_text[:200]}...")
                
                # Try to parse the JSON response
                json_content = extract_json_from_text(response_text)
                
                if json_content:
                    try:
                        extracted_data = json.loads(json_content)
                        logger.debug(f"Successfully parsed JSON from page {current_page_num}")
                        all_extracted_data.append(extracted_data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Error parsing JSON from page {current_page_num}: {str(e)}")
                        logger.debug(f"Problematic JSON content: {json_content}") # Log the content that failed
                        
                        # Try to fix common JSON issues and retry
                        fixed_json = attempt_json_repair(json_content)
                        if fixed_json:
                            try:
                                extracted_data = json.loads(fixed_json)
                                logger.info(f"Successfully parsed JSON after repair for page {current_page_num}")
                                all_extracted_data.append(extracted_data)
                            except json.JSONDecodeError:
                                logger.warning("JSON repair attempt failed")
                else:
                    logger.warning(f"No valid JSON found in response from page {current_page_num}")
            except Exception as e:
                logger.error(f"Error processing page {current_page_num}: {str(e)}", exc_info=True)
        
        # Fallback to direct extraction if no valid data
        if not all_extracted_data:
            logger.warning(f"No valid data extracted from any processed page for {filename}, attempting direct extraction")
            # Try one more extraction with combined text from first 2 pages
            combined_text = ""
            for i, page in enumerate(pages[:min(2, total_pages_to_process)]):
                combined_text += page.page_content + "\n\n"
            
            if combined_text:
                try:
                    # More direct prompt focusing on basics
                    direct_prompt = """Extract ONLY these fields from the sensor datasheet text:
- model: The model number or name
- manufacturer: The company name
- sensor_type: What kind of sensor this is (light, temperature, etc.)

Text:
{text}

Return as valid JSON with these three fields only. If information is not found, use null.
"""
                    direct_result = await extraction_chain.ainvoke({
                        "user_input": direct_prompt.format(text=combined_text[:5000])
                    })
                    
                    json_content = extract_json_from_text(direct_result.get("text", ""))
                    if json_content:
                        try:
                            direct_data = json.loads(json_content)
                            all_extracted_data.append(direct_data)
                            logger.info("Successfully extracted basic data through direct approach")
                        except json.JSONDecodeError:
                            logger.warning("Failed to parse JSON from direct extraction")
                except Exception as e:
                    logger.error(f"Error in direct extraction: {str(e)}")

        # Simulate progress: Step 4/5 - Merging data
        logger.info(f"Progress update for {filename}: [4/5] Merging extracted data.")
        # Merge data from all pages into a single document
        merged_data = merge_extracted_data(all_extracted_data)
        
        # Ensure required fields exist
        if not merged_data.get("model"):
            # Try to derive model from filename if not found in text
            possible_model = os.path.splitext(os.path.basename(filename))[0].replace('_', ' ').strip() # Clean up filename
            if possible_model:
                merged_data["model"] = possible_model
                logger.info(f"Using cleaned filename as model: {possible_model}")
            else:
                 merged_data["model"] = f"Unknown_{filename}" # Fallback model
                 logger.warning(f"Could not determine model, using fallback: {merged_data['model']}")
                 
        # If sensor_type is still null, use the guessed type
        if not merged_data.get("sensor_type") and possible_sensor_type:
            merged_data["sensor_type"] = possible_sensor_type
            logger.info(f"Using guessed sensor type: {possible_sensor_type}")

        # Add metadata
        merged_data["source"] = {
            "filename": filename,
            "upload_date": datetime.now().isoformat(), # Use ISO format string
            "page_count": total_pages_to_process # Use total pages here
        }
        
        # Simulate progress: Step 5/5 - Saving to database
        logger.info(f"Progress update for {filename}: [5/5] Saving data to MongoDB.")
        # Store in MongoDB
        db = await get_database()
        # Use model and filename to ensure uniqueness if model is generic
        filter_query = {"model": merged_data["model"], "source.filename": filename}
        
        update_result = await db.sensor_specifications.update_one(
            filter_query,
            {"$set": merged_data},
            upsert=True
        )
        
        if update_result.upserted_id:
            logger.info(f"Successfully inserted data for sensor {merged_data.get('model', 'Unknown')} from {filename}")
        elif update_result.modified_count > 0:
             logger.info(f"Successfully updated data for sensor {merged_data.get('model', 'Unknown')} from {filename}")
        else:
             logger.info(f"Data for sensor {merged_data.get('model', 'Unknown')} from {filename} already up-to-date.")

        logger.info(f"Finished processing PDF: {filename}")
        return merged_data
    
    except Exception as e:
        logger.error(f"Critical error during PDF processing for {filename}: {str(e)}", exc_info=True)
        raise
    
    finally:
        # Clean up the temporary file
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.debug(f"Successfully removed temporary file: {temp_file_path}")
            except Exception as e:
                logger.error(f"Error removing temporary file {temp_file_path}: {str(e)}")

def extract_json_from_text(text: str) -> str:
    """
    Extract JSON content from text that might contain additional explanations.
    Handles cases where model outputs JSON within ```json ... ``` blocks or just raw JSON.
    """
    # Check for markdown code block - more robust regex
    code_block_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text, re.DOTALL)
    if code_block_match:
        return code_block_match.group(1)

    # Look for content starting with '{' and ending with '}'
    start_idx = text.find('{')
    if start_idx == -1:
        return ""
    
    # Find the matching closing brace, handling nesting
    nesting = 0
    end_idx = -1
    in_string = False
    escape_next = False
    
    for i in range(start_idx, len(text)):
        char = text[i]
        
        if escape_next:
            escape_next = False
            continue
            
        if char == '\\':
            escape_next = True
            continue
            
        if char == '"' and not escape_next:
            in_string = not in_string
        
        if not in_string:
            if char == '{':
                nesting += 1
            elif char == '}':
                nesting -= 1
                if nesting == 0:
                    end_idx = i
                    break # Found the matching brace for the initial opening brace
                    
    if end_idx != -1:
        potential_json = text[start_idx:end_idx+1]
        # Basic validation: does it look like JSON?
        if potential_json.count('{') == potential_json.count('}'):
             return potential_json
        else:
             logger.warning("Mismatched braces found in potential JSON, extraction might be incomplete.")
             return potential_json

    logger.warning("Could not extract valid JSON structure from text.")
    return ""

def attempt_json_repair(json_text: str) -> str:
    """Attempts to fix common JSON errors in the extracted text"""
    # Replace single quotes with double quotes
    fixed = json_text.replace("'", '"')
    
    # Fix trailing commas before closing braces
    fixed = re.sub(r',\s*}', '}', fixed)
    fixed = re.sub(r',\s*]', ']', fixed)
    
    # Add missing quotes around keys
    fixed = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', fixed)
    
    # Fix cases where "null" is without quotes but should be null JSON value
    fixed = re.sub(r':\s*"null"', r': null', fixed)
    
    return fixed

def guess_sensor_type_from_filename(filename: str) -> str:
    """
    Attempt to guess the sensor type from the filename
    """
    filename_lower = filename.lower()
    
    # Dictionary mapping sensor type patterns to their types
    sensor_patterns = {
        "temp": "Temperature Sensor",
        "therm": "Temperature Sensor",
        "pressure": "Pressure Sensor",
        "force": "Force Sensor",
        "accel": "Accelerometer",
        "gyro": "Gyroscope",
        "light": "Light Sensor",
        "photo": "Light Sensor",
        "humidity": "Humidity Sensor",
        "motor": "Motor",
        "servo": "Servo Motor",
        "temt": "Light Sensor",       # TEMT6000 is a light sensor
        "hall": "Hall Effect Sensor",
        "current": "Current Sensor",
        "voltage": "Voltage Sensor",
        "torque": "Torque Sensor",
        "mag": "Magnetic Sensor",
        "flow": "Flow Sensor",
        "level": "Level Sensor",
        "gps": "GPS Sensor",
        "proximity": "Proximity Sensor",
        "ultrasonic": "Ultrasonic Sensor",
        "ir": "Infrared Sensor"
    }
    
    for pattern, sensor_type in sensor_patterns.items():
        if pattern in filename_lower:
            return sensor_type
            
    return None

def merge_extracted_data(extracted_data_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Merge data extracted from multiple pages into a single document.
    Prioritizes non-null values found later. Merges nested dictionaries deeply.
    """
    # Define the base structure
    merged_data = {
        "sensor_type": None,
        "manufacturer": None,
        "model": None,
        "specifications": {
            "performance": {},
            "electrical": {},
            "mechanical": {},
            "environmental": {}
        },
        "extra_fields": {}
    }

    if not extracted_data_list:
        return merged_data

    def is_valid(value):
        """ Check if a value is considered valid (not None or the string 'null') """
        return value is not None and value != "null"

    def deep_merge_dicts(target, source):
        """ Recursively merge dictionary 'source' into 'target'. """
        # Validate both target and source are dictionaries
        if not isinstance(target, dict):
            logger.error(f"Target is not a dictionary. Target type: {type(target)}")
            # Return source as fallback if target is not a dict
            return source if isinstance(source, dict) else {}
            
        if not isinstance(source, dict):
            logger.error(f"Source is not a dictionary. Source type: {type(source)}")
            return target
            
        for key, value in source.items():
            if isinstance(value, dict):
                # Ensure node is a dictionary
                if key in target and not isinstance(target[key], dict):
                    logger.warning(f"Overwriting non-dict value with dict at key '{key}'. Old type: {type(target[key])}")
                    target[key] = {}
                node = target.setdefault(key, {})
                deep_merge_dicts(node, value)
            elif is_valid(value):
                logger.debug(f"Setting key '{key}' in target. Target type: {type(target)}, Value type: {type(value)}")
                target[key] = value
        return target

    for data in extracted_data_list:
        if not isinstance(data, dict):
            logger.warning(f"Skipping non-dict item during merge: {type(data)}")
            continue
            
        for field in ["sensor_type", "manufacturer", "model"]:
            if field in data and is_valid(data[field]):
                merged_data[field] = data[field]
        
        if "specifications" in data:
            # Validate specifications is a dict before merging
            if isinstance(data["specifications"], dict):
                # Ensure merged_data["specifications"] is a dict
                if not isinstance(merged_data["specifications"], dict):
                    logger.warning(f"Converting merged_data['specifications'] from {type(merged_data['specifications'])} to dict")
                    merged_data["specifications"] = {
                        "performance": {},
                        "electrical": {},
                        "mechanical": {},
                        "environmental": {}
                    }
                
                merged_data["specifications"] = deep_merge_dicts(
                    merged_data["specifications"],
                    data["specifications"]
                )
            else:
                logger.warning(f"Skipping non-dict specifications: {type(data['specifications'])}")
            
        if "extra_fields" in data:
            # Validate extra_fields is a dict before merging
            if isinstance(data["extra_fields"], dict):
                # Ensure merged_data["extra_fields"] is a dict
                if not isinstance(merged_data["extra_fields"], dict):
                    logger.warning(f"Converting merged_data['extra_fields'] from {type(merged_data['extra_fields'])} to dict")
                    merged_data["extra_fields"] = {}
                
                merged_data["extra_fields"] = deep_merge_dicts(
                    merged_data["extra_fields"],
                    data["extra_fields"]
                )
            else:
                logger.warning(f"Skipping non-dict extra_fields: {type(data['extra_fields'])}")

    for spec_type in list(merged_data["specifications"].keys()):
        if not merged_data["specifications"][spec_type]:
            del merged_data["specifications"][spec_type]
            
    if not merged_data["extra_fields"]:
         del merged_data["extra_fields"]

    return merged_data
