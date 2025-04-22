from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class PerformanceSpecs(BaseModel):
    torque_range: Optional[str] = None
    speed: Optional[str] = None
    accuracy: Optional[str] = None
    precision: Optional[str] = None
    resolution: Optional[str] = None

class ElectricalSpecs(BaseModel):
    power_supply: Optional[str] = None
    control_voltage: Optional[str] = None
    output_type: Optional[str] = None

class MechanicalSpecs(BaseModel):
    dimensions: Optional[str] = None
    weight: Optional[str] = None
    mounting_options: Optional[List[str]] = None

class EnvironmentalSpecs(BaseModel):
    operating_temp: Optional[str] = None
    storage_temp: Optional[str] = None
    environmental_ratings: Optional[str] = None

class Specifications(BaseModel):
    performance: Optional[PerformanceSpecs] = Field(default_factory=PerformanceSpecs)
    electrical: Optional[ElectricalSpecs] = Field(default_factory=ElectricalSpecs)
    mechanical: Optional[MechanicalSpecs] = Field(default_factory=MechanicalSpecs)
    environmental: Optional[EnvironmentalSpecs] = Field(default_factory=EnvironmentalSpecs)

class SourceInfo(BaseModel):
    filename: Optional[str] = None
    upload_date: Optional[str] = None
    page_count: Optional[int] = None

class SensorSpecification(BaseModel):
    sensor_type: str
    manufacturer: str
    model: str
    specifications: Specifications = Field(default_factory=Specifications)
    extra_fields: Dict[str, Any] = Field(default_factory=dict)
    source: Optional[SourceInfo] = None
