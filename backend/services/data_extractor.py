from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.llms import OpenAI
from typing import Dict, Any, List
import os

from models.sensor import SensorSpecification

class DataExtractor:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.llm = OpenAI(openai_api_key=self.api_key, temperature=0)
        self.parser = PydanticOutputParser(pydantic_object=SensorSpecification)
        
        # Create a prompt template for extracting sensor data
        template = """
        You are an expert in analyzing sensor datasheets. Extract the following information from the given text.
        If a piece of information is not available, use null.
        
        Text: {text}
        
        Extract the sensor information in the following JSON format:
        {format_instructions}
        
        Extracted JSON:
        """
        
        self.prompt = PromptTemplate(
            template=template,
            input_variables=["text"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )
        
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)
    
    def extract_data(self, page: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract structured data from a single page.
        
        Args:
            page: Dictionary containing page text and metadata
            
        Returns:
            Extracted structured data
        """
        try:
            result = self.chain.run(text=page["text"])
            parsed_data = self.parser.parse(result)
            
            # Add source metadata
            parsed_dict = parsed_data.dict()
            parsed_dict["source"] = {
                "filename": page["metadata"]["filename"],
                "upload_date": page["metadata"]["processed_at"],
                "page_count": page["metadata"]["total_pages"]
            }
            
            return parsed_dict
        except Exception as e:
            raise Exception(f"Error extracting data: {str(e)}")
    
    def extract_from_pages(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract and merge data from multiple pages of the same PDF.
        
        Args:
            pages: List of dictionaries containing page text and metadata
            
        Returns:
            Merged structured data for each PDF
        """
        if not pages:
            return []
        
        # Group pages by filename
        pages_by_file = {}
        for page in pages:
            filename = page["metadata"]["filename"]
            if filename not in pages_by_file:
                pages_by_file[filename] = []
            pages_by_file[filename].append(page)
        
        # Process each file's pages and merge the results
        all_results = []
        for filename, file_pages in pages_by_file.items():
            file_data = None
            
            for page in file_pages:
                page_data = self.extract_data(page)
                
                if file_data is None:
                    file_data = page_data
                else:
                    # Merge data, prioritizing non-null values from the current page
                    self._merge_data(file_data, page_data)
            
            if file_data:
                all_results.append(file_data)
        
        return all_results
    
    def _merge_data(self, target: Dict[str, Any], source: Dict[str, Any]) -> None:
        """
        Merge source data into target, prioritizing non-null values.
        
        Args:
            target: Target dictionary to merge into
            source: Source dictionary with new data
        """
        for key, value in source.items():
            if key == "source":
                continue  # Skip source metadata, already handled
                
            if key not in target or target[key] is None:
                # If key doesn't exist in target or is None, use source value
                target[key] = value
            elif isinstance(value, dict) and isinstance(target[key], dict):
                # Recursively merge nested dictionaries
                self._merge_data(target[key], value)
