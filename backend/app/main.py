from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from . import models, schemas
from .database import engine, get_db
from .summarizer import generate_handoff_summary

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nursing Handoff API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Nursing Handoff API", "status": "running"}

# Patient endpoints, create patient
@app.post("/patients", response_model=schemas.PatientResponse)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    db_patient = models.Patient(
        id=str(uuid.uuid4()),
        **patient.dict()
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

#get single patient
@app.get("/patients/{patient_id}", response_model=schemas.PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

#list all patients
@app.get("/patients", response_model=List[schemas.PatientResponse])
def list_patients(db: Session = Depends(get_db)):
    patients = db.query(models.Patient).all()
    return patients

# Shift endpoints, create shift
@app.post("/shifts")
def create_shift(patient_id: str, nurse_name: str, db: Session = Depends(get_db)):
    shift = models.Shift(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        nurse_id=str(uuid.uuid4()),
        nurse_name=nurse_name
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift

@app.get("/shifts/{shift_id}")
def get_shift(shift_id: str, db: Session = Depends(get_db)):
    shift = db.query(models.Shift).filter(models.Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift

# Entry endpoints, create entry(vitals/meds/notes)
@app.post("/shifts/{shift_id}/entries", response_model=schemas.EntryResponse)
def create_entry(
    shift_id: str,
    entry: schemas.EntryCreate,
    db: Session = Depends(get_db)
):
    db_entry = models.Entry(
        id=str(uuid.uuid4()),
        shift_id=shift_id,
        **entry.dict()
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

#get all entries for a shift
@app.get("/shifts/{shift_id}/entries", response_model=List[schemas.EntryResponse])
def get_entries(shift_id: str, db: Session = Depends(get_db)):
    entries = db.query(models.Entry).filter(models.Entry.shift_id == shift_id).all()
    return entries

# Handoff generation
@app.post("/handoff/generate", response_model=schemas.HandoffResponse)
def generate_handoff(
    request: schemas.HandoffGenerate,
    db: Session = Depends(get_db)
):
    # Get all entries for this shift
    entries = db.query(models.Entry).filter(
        models.Entry.shift_id == request.shift_id
    ).all()
    
    # Convert to dict format for summarizer
    entries_data = [
        {
            "entry_type": entry.entry_type,
            "data": entry.data,
            "is_critical": entry.is_critical,
            "timestamp": entry.timestamp
        }
        for entry in entries
    ]
    
    # Generate summary
    summary = generate_handoff_summary(entries_data)
    
    # Create handoff record
    handoff = models.Handoff(
        id=str(uuid.uuid4()),
        shift_id=request.shift_id,
        critical_items=summary["critical_items"],
        stable_items=summary["stable_items"],
        pending_tasks=summary["pending_tasks"],
        narrative=summary["narrative"]
    )
    
    db.add(handoff)
    db.commit()
    db.refresh(handoff)
    
    return handoff

#retrieves specifc summary
@app.get("/handoff/{handoff_id}", response_model=schemas.HandoffResponse)
def get_handoff(handoff_id: str, db: Session = Depends(get_db)):
    handoff = db.query(models.Handoff).filter(models.Handoff.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")
    return handoff

#publish handoff
@app.post("/handoff/{handoff_id}/publish")
def publish_handoff(handoff_id: str, db: Session = Depends(get_db)):
    """Publish a handoff and mark shift as completed"""
    
    # Get the handoff
    handoff = db.query(models.Handoff).filter(models.Handoff.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")
    
    # Get the shift
    shift = db.query(models.Shift).filter(models.Shift.id == handoff.shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Update shift status
    shift.status = "published"
    shift.end_time = datetime.utcnow()
    
    # Update handoff with publish time
    handoff.published_at = datetime.utcnow()
    
    db.commit()
    db.refresh(handoff)
    
    return {
        "message": "Handoff published successfully",
        "handoff_id": handoff_id,
        "shift_id": shift.id,
        "published_at": handoff.published_at
    }

#future feature
@app.post("/handoff/{handoff_id}/acknowledge")
def acknowledge_handoff(
    handoff_id: str, 
    nurse_name: str,
    db: Session = Depends(get_db)
):
    """Acknowledge receipt of handoff by incoming nurse"""
    
    handoff = db.query(models.Handoff).filter(models.Handoff.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")
    
    handoff.acknowledged_by = nurse_name
    handoff.acknowledged_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Handoff acknowledged",
        "acknowledged_by": nurse_name,
        "acknowledged_at": handoff.acknowledged_at
    }

#get shift's handoff
@app.get("/shifts/{shift_id}/handoff")
def get_shift_handoff(shift_id: str, db: Session = Depends(get_db)):
    """Get handoff for a specific shift"""
    
    handoff = db.query(models.Handoff).filter(
        models.Handoff.shift_id == shift_id
    ).first()
    
    if not handoff:
        raise HTTPException(status_code=404, detail="No handoff found for this shift")
    
    return handoff

#get patient's shift history
@app.get("/patients/{patient_id}/shifts")
def get_patient_shifts(patient_id: str, db: Session = Depends(get_db)):
    """Get all shifts for a patient"""
    
    shifts = db.query(models.Shift).filter(
        models.Shift.patient_id == patient_id
    ).order_by(models.Shift.start_time.desc()).all()
    
    # Include handoff data for each shift
    result = []
    for shift in shifts:
        handoff = db.query(models.Handoff).filter(
            models.Handoff.shift_id == shift.id
        ).first()
        
        result.append({
            "shift": {
                "id": shift.id,
                "nurse_name": shift.nurse_name,
                "start_time": shift.start_time,
                "end_time": shift.end_time,
                "status": shift.status
            },
            "handoff": {
                "id": handoff.id,
                "critical_items": handoff.critical_items,
                "stable_items": handoff.stable_items,
                "pending_tasks": handoff.pending_tasks,
                "narrative": handoff.narrative,
                "published_at": handoff.published_at
            } if handoff else None
        })
    
    return result

@app.get("/patients/{patient_id}/latest-handoff")
def get_latest_handoff(patient_id: str, db: Session = Depends(get_db)):
    """Get the most recent published handoff for a patient"""
    
    latest_shift = db.query(models.Shift).filter(
        models.Shift.patient_id == patient_id,
        models.Shift.status == "published"
    ).order_by(models.Shift.end_time.desc()).first()
    
    if not latest_shift:
        return None
    
    handoff = db.query(models.Handoff).filter(
        models.Handoff.shift_id == latest_shift.id
    ).first()
    
    if not handoff:
        return None
    
    return {
        "shift": {
            "id": latest_shift.id,
            "nurse_name": latest_shift.nurse_name,
            "start_time": latest_shift.start_time,
            "end_time": latest_shift.end_time
        },
        "handoff": {
            "id": handoff.id,
            "critical_items": handoff.critical_items,
            "stable_items": handoff.stable_items,
            "pending_tasks": handoff.pending_tasks,
            "narrative": handoff.narrative,
            "published_at": handoff.published_at
        }
    }

@app.delete("/handoff/{handoff_id}")
def delete_handoff(handoff_id: str, db: Session = Depends(get_db)):
    """Delete a specific handoff and its shift"""
    
    handoff = db.query(models.Handoff).filter(models.Handoff.id == handoff_id).first()
    if not handoff:
        raise HTTPException(status_code=404, detail="Handoff not found")
    
    shift_id = handoff.shift_id
    
    # Delete the handoff
    db.delete(handoff)
    
    # Delete all entries for this shift
    db.query(models.Entry).filter(models.Entry.shift_id == shift_id).delete()
    
    # Delete the shift
    shift = db.query(models.Shift).filter(models.Shift.id == shift_id).first()
    if shift:
        db.delete(shift)
    
    db.commit()
    
    return {"message": "Handoff and shift deleted successfully"}

@app.delete("/patients/{patient_id}/shifts")
def delete_patient_shifts(patient_id: str, db: Session = Depends(get_db)):
    """Delete all shifts and handoffs for a patient"""
    
    # Get all shifts for this patient
    shifts = db.query(models.Shift).filter(models.Shift.patient_id == patient_id).all()
    
    for shift in shifts:
        # Delete handoffs
        db.query(models.Handoff).filter(models.Handoff.shift_id == shift.id).delete()
        # Delete entries
        db.query(models.Entry).filter(models.Entry.shift_id == shift.id).delete()
        # Delete shift
        db.delete(shift)
    
    db.commit()
    
    return {"message": f"All shifts deleted for patient {patient_id}"}

@app.delete("/admin/clear-all")
def clear_all_data(db: Session = Depends(get_db)):
    """DANGEROUS: Clear all data from database (for development only)"""
    
    try:
        # Delete in correct order (foreign key constraints)
        db.query(models.Handoff).delete()
        db.query(models.Entry).delete()
        db.query(models.Shift).delete()
        db.query(models.Patient).delete()
        
        db.commit()
        
        return {"message": "All data cleared successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing data: {str(e)}")

@app.get("/admin/database-stats")
def get_database_stats(db: Session = Depends(get_db)):
    """Get database statistics"""
    
    stats = {
        "patients": db.query(models.Patient).count(),
        "shifts": db.query(models.Shift).count(),
        "entries": db.query(models.Entry).count(),
        "handoffs": db.query(models.Handoff).count()
    }
    
    return stats