from sqlalchemy import Column, String, DateTime, JSON, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, index=True)
    mrn = Column(String, unique=True, index=True)
    name = Column(String)
    dob = Column(String)
    room = Column(String)
    allergies = Column(JSON)  # ["Penicillin", "Latex"]
    code_status = Column(String)
    admission_date = Column(DateTime, default=datetime.utcnow)
    
    shifts = relationship("Shift", back_populates="patient") #allows us to access patient.shifts to get all shifts for a patient

class Shift(Base):
    __tablename__ = "shifts"
    
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id")) #ensures shift is linked to a patient
    nurse_id = Column(String)
    nurse_name = Column(String)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # active, completed, published
    
    patient = relationship("Patient", back_populates="shifts")
    entries = relationship("Entry", back_populates="shift")
    handoff = relationship("Handoff", back_populates="shift", uselist=False)

class Entry(Base):
    __tablename__ = "entries"
    
    id = Column(String, primary_key=True, index=True)
    shift_id = Column(String, ForeignKey("shifts.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    entry_type = Column(String)  # 'vitals', 'med_change', 'note', 'flag', 'task'
    data = Column(JSON)
    is_critical = Column(Boolean, default=False)
    
    shift = relationship("Shift", back_populates="entries")

class Handoff(Base):
    __tablename__ = "handoffs"
    
    id = Column(String, primary_key=True, index=True)
    shift_id = Column(String, ForeignKey("shifts.id"))
    critical_items = Column(JSON)
    stable_items = Column(JSON)
    pending_tasks = Column(JSON)
    narrative = Column(Text)
    published_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    shift = relationship("Shift", back_populates="handoff")