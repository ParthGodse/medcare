# backend/cleanup_duplicates.py
from app.database import SessionLocal, engine
from app.models import Shift, Entry, Handoff
from sqlalchemy import func

db = SessionLocal()

try:
    # Find active shifts without handoffs
    active_shifts = db.query(Shift).filter(Shift.status == 'active').all()
    
    for shift in active_shifts:
        # Check if this shift has any entries
        entry_count = db.query(Entry).filter(Entry.shift_id == shift.id).count()
        
        # Check if there's a handoff
        handoff = db.query(Handoff).filter(Handoff.shift_id == shift.id).first()
        
        if entry_count == 0 and not handoff:
            # This is an empty active shift, delete it
            print(f"Deleting empty shift: {shift.id} from {shift.start_time}")
            db.delete(shift)
    
    db.commit()
    print("✅ Cleanup complete!")
    
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()