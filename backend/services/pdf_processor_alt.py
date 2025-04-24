# Alternative PDF Processor
from langchain_community.document_loaders import PyPDFLoader
from io import BytesIO
import tempfile
import os
import json
import re
from config import logger
from llm.client import create_extraction_chain
from database.mongodb import get_database
from typing import List, Dict, Any
from datetime import datetime

class PDFProcessorAlt:
    def __init__(self, pdf_dir: str = None):
        # If pdf_dir is not provided, use a directory relative to the current file
        if pdf_dir is None:
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            pdf_dir = os.path.join(backend_dir, "pdfs")
        
        self.pdf_dir = pdf_dir
        os.makedirs(self.pdf_dir, exist_ok=True)
    
    def load_and_chunk_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Load a PDF and chunk it by page using an alternative method.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of dictionaries containing page text and metadata
        """
        try:
            loader = PyPDFLoader(pdf_path)
            pages = loader.load()
            
            filename = os.path.basename(pdf_path)
            
            chunked_pages = []
            for i, page in enumerate(pages):
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
        Process all PDFs in the specified directory using alternative method.
        
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

async def process_pdf_datasheet_alt(pdf_content: bytes, filename: str, model_name: str = None):
    """
    Process a PDF datasheet to extract structured data using an alternative approach.
    
    Args:
        pdf_content: The binary content of the PDF
        filename: The original filename
        model_name: Optional model name to use for extraction
        
    Returns:
        dict: Extracted structured data
    """
    extraction_model = model_name if model_name else "meta-llama/llama-3.1-8b-instruct"
    logger.info(f"Starting alternative PDF datasheet processing for: {filename} using model: {extraction_model}")
    logger.debug(f"Model parameter received for PDF processing: {model_name}")
    logger.info(f"Progress update for {filename}: [1/5] Saving temporary file.")
    
    # Save the PDF content to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        temp_file_path = temp_file.name
        temp_file.write(pdf_content)
    
    try:
        logger.info(f"Progress update for {filename}: [2/5] Loading PDF pages.")
        loader = PyPDFLoader(temp_file_path)
        pages = loader.load()
        
        total_pages_to_process = len(pages)
        logger.info(f"Loaded {total_pages_to_process} pages from PDF: {filename}")
        
        logger.info(f"Progress update for {filename}: [3/5] Extracting data using model: {extraction_model}")
        extraction_chain = create_extraction_chain(model_name=extraction_model, temperature=0.1)
        
        all_extracted_data = []
        pages_to_process_limit = min(5, total_pages_to_process)
        possible_sensor_type = guess_sensor_type_from_filename(filename)
        
        for i, page in enumerate(pages[:pages_to_process_limit]):
            current_page_num = i + 1
            logger.info(f"Processing page {current_page_num}/{pages_to_process_limit} for {filename}")
            
            page_text = page.page_content
            
            if len(page_text.strip()) < 50:
                logger.debug(f"Skipping page {current_page_num} - insufficient text content")
                continue
                
            # Enhanced prompt based on specification
            prompt_text = """You are a specialized AI for extracting structured data from sensor datasheets. Your task is to analyze the provided text from a sensor datasheet and extract key information into a well-structured JSON format with high accuracy and flexibility.

**Instructions**:
- Extract the following information if present in the text:
  - sensor_type: The type of sensor (e.g., "Temperature Sensor", "Pressure Sensor")
  - manufacturer: The company that makes the sensor
  - model: The specific model number or name of the sensor
  - specifications: An object containing these nested objects (include fields only if found):
    - performance: sensitivity, range, accuracy, resolution, response_time
    - electrical: power_supply, current_consumption, output_type, interface
    - mechanical: dimensions, weight, mounting_options, package_type
    - environmental: operating_temp, storage_temp, humidity_range, protection_rating
- For each field, include the exact value FROM THE TEXT, with units if specified.
- **Do not use "Unknown" or null as placeholders** unless explicitly stated in the text. If data is unclear or missing, omit the field or provide partial data with a confidence note in the field value (e.g., "Approx 5V - low confidence").
- Use `model_hint` and `sensor_type_hint` as supplementary information if direct text data is missing or ambiguous.
- If you find additional relevant information outside the schema, include it in an "extra_fields" object with detailed context if possible.

**Context**:
- Sensor model from filename appears to be: {model_hint}
- This may be a {sensor_type_hint} based on the filename.
- Accuracy and data integrity are critical for technical use cases.

**Constraints**:
- Respond ONLY with a valid JSON object containing the extracted information.
- Ensure strict JSON formatting (no trailing commas, no extra text outside the JSON).

Text from page {page_num} of {total_pages}:
{page_text}
"""
            try:
                # Get model name from filename for hint
                model_hint = os.path.splitext(os.path.basename(filename))[0]
                
                # Invoke the LLM chain with the prompt
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
                        logger.debug(f"Problematic JSON content: {json_content}")
                        
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
        
        # Prepare data for storage
        logger.info(f"Progress update for {filename}: [4/5] Preparing data for storage.")
        
        # Generate a unique upload ID based on timestamp
        upload_timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
        upload_id = f"upload_{upload_timestamp}"
        logger.info(f"Assigning upload ID {upload_id} for {filename}")
        
        # Merge extracted data from all pages
        merged_data = merge_extracted_data(all_extracted_data)
        
        # Add classification model information
        merged_data["classification_model"] = extraction_model
        
        # Add source information
        merged_data["source"] = {
            "filename": filename,
            "upload_date": datetime.now().isoformat(),
            "page_count": total_pages_to_process
        }
        
        # Structure data at root level as per user preference
        structured_data = merged_data
        
        # Log summary of filled vs missing fields for debugging
        specs = merged_data.get("specifications", {})
        for category in ["performance", "electrical", "mechanical", "environmental"]:
            cat_data = specs.get(category, {})
            filled = sum(1 for v in cat_data.values() if v and v != "Unknown")
            total = len(cat_data)
            logger.info(f"Category {category}: {filled}/{total} fields filled")
        
        # Validation: Check for critical missing fields
        critical_fields = ["model", "sensor_type"]
        missing_critical = [f for f in critical_fields if not merged_data.get(f) or merged_data.get(f) == "Unknown"]
        if missing_critical:
            logger.warning(f"Critical fields missing or unknown: {missing_critical}")
            # Potential secondary extraction could be triggered here if needed
        
        # Save to database
        logger.info(f"Progress update for {filename}: [5/5] Saving data to MongoDB.")
        db = await get_database()
        collection = db["uploads"]
        
        # Store each page's raw data as a separate document
        for i, page in enumerate(pages):
            page_document = {
                "upload_id": upload_id,
                "page_number": i + 1,
                "filename": filename,
                "upload_date": datetime.now().isoformat(),
                "processed_at": datetime.now().isoformat(),
                "raw_text": page.page_content,
                "extraction_model": extraction_model,
                "text_snippet": page.page_content[:200] if page.page_content else ""  # Short excerpt for reference
            }
            if i < len(all_extracted_data):
                extracted_data_with_meta = all_extracted_data[i].copy()
                extracted_data_with_meta["metadata"] = {
                    "page_number": i + 1,
                    "extraction_confidence": "high" if "model" in extracted_data_with_meta and extracted_data_with_meta["model"] else "medium"
                }
                page_document["extracted_data"] = extracted_data_with_meta
            insert_result = await collection.insert_one(page_document)
            logger.info(f"Inserted data for page {i+1} of {filename} with ID {insert_result.inserted_id}")
        
        # Store the structured data in sensor_specifications collection
        specs_collection = db["sensor_specifications"]
        spec_result = await specs_collection.insert_one(structured_data)
        logger.info(f"Inserted structured specifications with ID {spec_result.inserted_id}")
        
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
    Prioritizes detailed and complete data based on a scoring system. Aggregates extra_fields comprehensively.
    """
    # Build structure dynamically based on extracted data
    merged_data = {
        "sensor_type": "",
        "manufacturer": "",
        "model": "",
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

    def score_value(value):
        """ Score a value based on detail level (length, presence of units, numerical data). """
        if not value or value in ["null", "Unknown", ""]:
            return 0
        score = len(str(value))
        if any(unit in str(value).lower() for unit in ['v', 'a', 'w', 'hz', '°c', 'mm', 'g', '%']):
            score += 10  # Bonus for units
        if any(char.isdigit() for char in str(value)):
            score += 5   # Bonus for numerical data
        return score

    def deep_merge_dicts(target, source, path=""):
        """ Recursively merge dictionary 'source' into 'target', prioritizing detailed data. """
        if not isinstance(target, dict):
            logger.error(f"Target is not a dictionary at path {path}. Target type: {type(target)}")
            return source if isinstance(source, dict) else {}
            
        if not isinstance(source, dict):
            logger.error(f"Source is not a dictionary at path {path}. Source type: {type(source)}")
            return target
            
        for key, value in source.items():
            full_path = f"{path}.{key}" if path else key
            if isinstance(value, dict):
                if key in target and not isinstance(target[key], dict):
                    logger.warning(f"Overwriting non-dict value with dict at key '{full_path}'. Old type: {type(target[key])}")
                    target[key] = {}
                node = target.setdefault(key, {})
                deep_merge_dicts(node, value, full_path)
            else:
                if key not in target or score_value(value) > score_value(target.get(key, "")):
                    logger.debug(f"Updating key '{full_path}' with higher scored value. New value: {value}")
                    target[key] = value
        return target

    def merge_extra_fields(target, source):
        """ Merge extra_fields comprehensively, using lists for conflicting keys. """
        for key, value in source.items():
            if key in target:
                if isinstance(target[key], list):
                    if value not in target[key]:
                        target[key].append(value)
                elif target[key] != value:
                    target[key] = [target[key], value]
            else:
                target[key] = value
        return target

    for data in extracted_data_list:
        if not isinstance(data, dict):
            logger.warning(f"Skipping non-dict item during merge: {type(data)}")
            continue
            
        for field in ["sensor_type", "manufacturer", "model"]:
            if field in data:
                current_score = score_value(merged_data[field])
                new_score = score_value(data[field])
                if new_score > current_score:
                    merged_data[field] = data[field]
                    logger.debug(f"Updated {field} to {data[field]} with score {new_score}")
        
        if "specifications" in data and isinstance(data["specifications"], dict):
            merged_data["specifications"] = deep_merge_dicts(
                merged_data["specifications"],
                data["specifications"]
            )
        elif "specifications" in data:
            logger.warning(f"Skipping non-dict specifications: {type(data['specifications'])}")
        
        if "extra_fields" in data and isinstance(data["extra_fields"], dict):
            merged_data["extra_fields"] = merge_extra_fields(
                merged_data["extra_fields"],
                data["extra_fields"]
            )
        elif "extra_fields" in data:
            logger.warning(f"Skipping non-dict extra_fields: {type(data['extra_fields'])}")
            
        if "extra_fields" in data:
            # Validate extra_fields is a dict before merging
            if isinstance(data["extra_fields"], dict):
                merged_data["extra_fields"] = deep_merge_dicts(
                    merged_data.get("extra_fields", {}),
                    data["extra_fields"]
                )
            else:
                logger.warning(f"Skipping non-dict extra_fields: {type(data['extra_fields'])}")
    
    return merged_data
