import spacy
import networkx as nx
from typing import List, Dict
import numpy as np

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    print("Warning: spaCy model not loaded. Install with: python -m spacy download en_core_web_sm")
    nlp = None

def extract_critical_items(entries: List[Dict]) -> List[str]:
    """Extract critical items from structured entries"""
    critical = []
    
    for entry in entries:
        if entry.get('is_critical'):
            entry_type = entry.get('entry_type')
            data = entry.get('data', {})
            
            if entry_type == 'vitals':
                # Convert to float, handle empty strings
                try:
                    bp_systolic = float(data.get('bp_systolic', 0)) if data.get('bp_systolic') else 0
                    bp_diastolic = float(data.get('bp_diastolic', 0)) if data.get('bp_diastolic') else 0
                    hr = float(data.get('heart_rate', 0)) if data.get('heart_rate') else 0
                    temp = float(data.get('temperature', 0)) if data.get('temperature') else 0
                    o2_sat = float(data.get('o2_saturation', 0)) if data.get('o2_saturation') else 0
                except (ValueError, TypeError):
                    continue
                
                # Check for abnormal vitals - BUILD ONCE
                vitals_summary = []
                if bp_systolic > 0 and bp_diastolic > 0:
                    if bp_systolic < 90 or bp_systolic > 140:
                        vitals_summary.append(f"BP {int(bp_systolic)}/{int(bp_diastolic)}")
                if temp > 38.0:
                    vitals_summary.append(f"Temp {temp}°C")
                if hr > 0 and (hr > 100 or hr < 60):
                    vitals_summary.append(f"HR {int(hr)}")
                if o2_sat > 0 and o2_sat < 95:
                    vitals_summary.append(f"O2 {int(o2_sat)}%")
                
                # Add as ONE item, not multiple
                if vitals_summary:
                    critical.append("Abnormal vitals: " + ", ".join(vitals_summary))
                    
            elif entry_type == 'med_change':
                action = data.get('action', '')
                med_name = data.get('medication', '')
                dose = data.get('dose', '')
                time = data.get('time', '')
                reason = data.get('reason', '')
                previous_dose = data.get('previousDose', '')
                
                if action == 'started':
                    time_str = f" @ {time}" if time else ""
                    dose_str = f" {dose}" if dose else ""
                    critical.append(f"Started {med_name}{dose_str}{time_str}")
                elif action == 'held':
                    reason_str = f" - {reason}" if reason else ""
                    critical.append(f"Held {med_name}{reason_str}")
                elif action == 'increased':
                    prev_str = f" from {previous_dose}" if previous_dose else ""
                    critical.append(f"Increased {med_name} to {dose}{prev_str}")
                elif action == 'decreased':
                    prev_str = f" from {previous_dose}" if previous_dose else ""
                    critical.append(f"Decreased {med_name} to {dose}{prev_str}")
                elif action == 'discontinued':
                    reason_str = f" - {reason}" if reason else ""
                    critical.append(f"Discontinued {med_name}{reason_str}")
                    
            elif entry_type == 'flag':
                flag_type = data.get('flag_type', '')
                if flag_type == 'escalation':
                    critical.append("MD consultation required")
                    
    return critical

def extract_pending_tasks(entries: List[Dict]) -> List[str]:
    """Extract pending tasks"""
    tasks = []
    
    for entry in entries:
        if entry.get('entry_type') == 'task':
            data = entry.get('data', {})
            task_text = data.get('task', '')
            if task_text:
                tasks.append(task_text)
                
    return tasks

def textrank_summarize(sentences: List[str], top_n: int = 3) -> List[str]:
    """Use TextRank algorithm to extract important sentences"""
    
    if not sentences or len(sentences) <= top_n or nlp is None:
        return sentences[:top_n] if sentences else []
    
    try:
        # Create similarity matrix
        similarity_matrix = np.zeros((len(sentences), len(sentences)))
        
        for i, sent1 in enumerate(sentences):
            doc1 = nlp(sent1)
            for j, sent2 in enumerate(sentences):
                if i != j:
                    doc2 = nlp(sent2)
                    # Calculate similarity
                    similarity = doc1.similarity(doc2)
                    similarity_matrix[i][j] = similarity
        
        # Create graph
        nx_graph = nx.from_numpy_array(similarity_matrix)
        
        # Calculate PageRank scores
        scores = nx.pagerank(nx_graph)
        
        # Get top sentences
        ranked_sentences = sorted(
            ((scores[i], s) for i, s in enumerate(sentences)),
            reverse=True
        )
        
        # Return top N sentences in original order
        top_sentences = [s for _, s in ranked_sentences[:top_n]]
        
        # Sort by original order
        ordered_top = []
        for sent in sentences:
            if sent in top_sentences:
                ordered_top.append(sent)
                
        return ordered_top
    except Exception as e:
        print(f"Error in textrank_summarize: {e}")
        return sentences[:top_n]

def extract_sentences_from_notes(entries: List[Dict]) -> List[str]:
    """Extract sentences from note entries"""
    sentences = []
    
    for entry in entries:
        if entry.get('entry_type') == 'note':
            data = entry.get('data', {})
            note_text = data.get('text', '')
            
            if nlp:
                # Split into sentences using spaCy
                doc = nlp(note_text)
                for sent in doc.sents:
                    sent_text = sent.text.strip()
                    if len(sent_text) > 10:  # Filter very short sentences
                        sentences.append(sent_text)
            else:
                # Fallback: simple sentence splitting
                if note_text and len(note_text) > 10:
                    sentences.append(note_text)
                    
    return sentences

def generate_handoff_summary(entries: List[Dict]) -> Dict[str, any]:
    """Main function to generate handoff summary"""
    
    # Extract critical items (rule-based)
    critical_items = extract_critical_items(entries)
    
    # Extract pending tasks
    pending_tasks = extract_pending_tasks(entries)
    
    # Extract and summarize notes (NLP-based)
    note_sentences = extract_sentences_from_notes(entries)
    
    # Generate narrative from notes
    if len(note_sentences) > 0:
        top_sentences = textrank_summarize(note_sentences, top_n=3)
        narrative = " ".join(top_sentences)
    else:
        narrative = "No additional notes documented this shift."
    
    # Determine stable items - ONLY if no critical items
    stable_items = []
    
    if len(critical_items) == 0:
        # Only add stable items if truly stable
        vitals_entries = [e for e in entries if e.get('entry_type') == 'vitals']
        if len(vitals_entries) > 0:
            stable_items.append("All vitals within normal limits")
        
        # Look for positive notes
        routine_keywords = ['stable', 'comfortable', 'resting', 'no complaints', 'alert', 'oriented']
        for sent in note_sentences:
            if any(keyword in sent.lower() for keyword in routine_keywords):
                if len(stable_items) < 3:
                    stable_items.append(sent)
        
        # Default only if truly nothing to report
        if not stable_items:
            stable_items.append("Patient condition stable")
    else:
        # If there are critical items, don't add generic stable messages
        stable_items.append("Monitor closely for changes")
    
    # Better pending tasks messaging
    if not pending_tasks:
        # Look for pending items in notes
        pending_keywords = ['monitor', 'follow up', 'await', 'pending', 'recheck', 'continue']
        for sent in note_sentences:
            if any(keyword in sent.lower() for keyword in pending_keywords):
                if len(pending_tasks) < 5:
                    pending_tasks.append(sent)
        
        # If still nothing, say so
        if not pending_tasks:
            pending_tasks.append("No outstanding tasks identified")
    
    return {
        "critical_items": critical_items if critical_items else ["No critical alerts"],
        "stable_items": stable_items,
        "pending_tasks": pending_tasks,
        "narrative": narrative
    }