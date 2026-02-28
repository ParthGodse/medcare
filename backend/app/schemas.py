from pydantic import BaseModel #pydantic schema for automatic validation of data
from typing import List, Optional, Dict, Any
from datetime import datetime

class PatientCreate(BaseModel):
    mrn: str
    name: str
    dob: str
    room: str
    allergies: List[str]
    code_status: str

class PatientResponse(BaseModel):
    id: str
    mrn: str
    name: str
    dob: str
    room: str
    allergies: List[str]
    code_status: str
    admission_date: datetime
    
    class Config:
        from_attributes = True #Pydantic can read SQLAlchemy models directly, wihtout this will ge terror when tryint to return db obj

class EntryCreate(BaseModel): #creating shift entries
    entry_type: str
    data: Dict[str, Any]
    is_critical: Optional[bool] = False

class EntryResponse(BaseModel): #returning shift entries
    id: str
    shift_id: str
    timestamp: datetime
    entry_type: str
    data: Dict[str, Any]
    is_critical: bool
    
    class Config:
        from_attributes = True

class HandoffResponse(BaseModel): #returning handoff summary
    id: str
    shift_id: str
    critical_items: List[str]
    stable_items: List[str]
    pending_tasks: List[str]
    narrative: str
    published_at: datetime
    
    class Config:
        from_attributes = True

class HandoffGenerate(BaseModel):
    shift_id: str