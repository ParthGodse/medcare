import requests
from typing import List, Dict

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"

def extract_critical_items(entries: List[Dict]) -> List[str]:
    """Extract critical items from structured entries"""
    critical = []
    
    for entry in entries:
        if entry.get('is_critical'):
            entry_type = entry.get('entry_type')
            data = entry.get('data', {})
            
            if entry_type == 'vitals':
                try:
                    bp_systolic  = float(data.get('bp_systolic',  0)) if data.get('bp_systolic')  else 0
                    bp_diastolic = float(data.get('bp_diastolic', 0)) if data.get('bp_diastolic') else 0
                    hr           = float(data.get('heart_rate',   0)) if data.get('heart_rate')   else 0
                    temp         = float(data.get('temperature',  0)) if data.get('temperature')  else 0
                    o2_sat       = float(data.get('o2_saturation',0)) if data.get('o2_saturation')else 0
                except (ValueError, TypeError):
                    continue

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

                if vitals_summary:
                    critical.append("Abnormal vitals: " + ", ".join(vitals_summary))

            elif entry_type == 'med_change':
                action        = data.get('action', '')
                med_name      = data.get('medication', '')
                dose          = data.get('dose', '')
                time          = data.get('time', '')
                reason        = data.get('reason', '')
                previous_dose = data.get('previousDose', '')

                if action == 'started':
                    critical.append(f"Started {med_name} {dose}{' @ ' + time if time else ''}")
                elif action == 'held':
                    critical.append(f"Held {med_name}{' - ' + reason if reason else ''}")
                elif action == 'increased':
                    critical.append(f"Increased {med_name} to {dose}{' from ' + previous_dose if previous_dose else ''}")
                elif action == 'decreased':
                    critical.append(f"Decreased {med_name} to {dose}{' from ' + previous_dose if previous_dose else ''}")
                elif action == 'discontinued':
                    critical.append(f"Discontinued {med_name}{' - ' + reason if reason else ''}")

            elif entry_type == 'flag':
                if data.get('flag_type') == 'escalation':
                    critical.append("MD consultation required")

    return critical


def extract_pending_tasks(entries: List[Dict]) -> List[str]:
    """Extract explicitly added tasks"""
    tasks = []
    for entry in entries:
        if entry.get('entry_type') == 'task':
            task_text = entry.get('data', {}).get('task', '')
            if task_text:
                tasks.append(task_text)
    return tasks


def extract_notes_text(entries: List[Dict]) -> str:
    """Extract all notes joined as text"""
    notes = []
    for entry in entries:
        if entry.get('entry_type') == 'note':
            text = entry.get('data', {}).get('text', '')
            if text:
                notes.append(text)
    return " ".join(notes)


def call_ollama(prompt: str) -> str | None:
    """Call local Ollama and return plain text response"""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "top_p": 0.9,
                    "num_predict": 300
                }
            },
            timeout=60
        )
        if response.status_code == 200:
            text = response.json().get("response", "").strip()
            print(f"[Ollama Response]: {text[:200]}")  # DEBUG
            return text
        else:
            print(f"[Ollama Error] Status: {response.status_code}")
            return None
    except requests.exceptions.ConnectionError:
        print("[Ollama Error] Cannot connect - is 'ollama serve' running?")
        return None
    except requests.exceptions.Timeout:
        print("[Ollama Error] Request timed out")
        return None
    except Exception as e:
        print(f"[Ollama Error] {e}")
        return None


def parse_numbered_list(text: str) -> List[str]:
    """
    Parse LLM output into clean list items.
    Handles formats like:
      1. Item one
      2. Item two
      - Item three
      Item four
    """
    if not text or text.strip().lower() in ("none", "n/a", ""):
        return []

    items = []
    for line in text.strip().split("\n"):
        line = line.strip()
        if not line:
            continue

        # Remove leading numbers/bullets: "1.", "1)", "-", "*", "•"
        for prefix in ["1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.", "0.",
                        "1)", "2)", "3)", "-", "*", "•"]:
            if line.startswith(prefix):
                line = line[len(prefix):].strip()
                break

        if line and len(line) > 3:
            items.append(line)

    return items


def generate_handoff_summary(entries: List[Dict]) -> Dict[str, any]:
    """Generate full handoff summary using rule-based extraction + Ollama LLM"""

    # ── 1. Rule-based extraction ──────────────────────────────────────────────
    critical_items  = extract_critical_items(entries)
    explicit_tasks  = extract_pending_tasks(entries)
    notes_text      = extract_notes_text(entries)

    print(f"[Summary] Critical: {critical_items}")
    print(f"[Summary] Explicit tasks: {explicit_tasks}")
    print(f"[Summary] Notes: {notes_text}")

    has_critical = len(critical_items) > 0
    has_notes    = bool(notes_text.strip())

    # ── 2. NARRATIVE via LLM ─────────────────────────────────────────────────
    narrative_prompt = f"""You are a clinical documentation assistant. Write a 2-3 sentence professional shift handoff narrative for a nurse.

Use ONLY the information below. Do NOT invent details.

CRITICAL ITEMS:
{chr(10).join(f'- {i}' for i in critical_items) if critical_items else '- None'}

NURSE NOTES:
{notes_text if has_notes else 'None'}

Rules:
- Write exactly 2-3 sentences
- Be clinical and concise
- Do NOT repeat the critical items list word for word
- Do NOT add recommendations or questions
- Write ONLY the narrative paragraph, nothing else"""

    narrative = call_ollama(narrative_prompt)

    if not narrative:
        if has_notes:
            narrative = notes_text[:300]
        elif critical_items:
            narrative = f"Patient presented with {', '.join(critical_items[:2])} during this shift."
        else:
            narrative = "Shift completed without significant events."

    # ── 3. STABLE ITEMS via LLM ──────────────────────────────────────────────
    stable_items = []

    if not has_critical:
        # Only ask for stable items if no critical issues
        stable_prompt = f"""A patient had a routine shift. Nurse notes: "{notes_text if has_notes else 'No notes'}"

List 2-3 brief stable observations (e.g. "Alert and oriented x3", "Vital signs stable", "Tolerating diet").

Rules:
- Each item must be SHORT (5 words max)
- One item per line
- NO numbering, NO bullets, NO dashes
- If no notes, write: Condition stable this shift

Output example:
Alert and oriented x3
Vital signs stable
Pain well controlled"""

        stable_response = call_ollama(stable_prompt)

        if stable_response:
            stable_items = parse_numbered_list(stable_response)

        if not stable_items:
            stable_items = ["Condition stable this shift"]

    # No stable section when critical items exist - don't confuse incoming nurse
    # ── 4. PENDING TASKS via LLM ─────────────────────────────────────────────
    llm_pending = []

    if has_notes:
        pending_prompt = f"""A nurse wrote these shift notes: "{notes_text}"

Extract ONLY tasks, follow-ups, or monitoring items that the INCOMING nurse needs to action.

Rules:
- Only include things explicitly mentioned in the notes
- Each task must be SHORT and actionable
- One task per line
- NO numbering, NO bullets, NO dashes
- If no tasks found, write: None

Output example:
Await blood culture results
Monitor BP every 2 hours
Follow up with MD re: hypotension"""

        pending_response = call_ollama(pending_prompt)
        print(f"[Pending LLM Response]: {pending_response}")  # DEBUG

        if pending_response and pending_response.strip().lower() != "none":
            llm_pending = parse_numbered_list(pending_response)

    # Combine explicit tasks + LLM extracted tasks (deduplicate)
    seen = set()
    all_pending = []
    for task in explicit_tasks + llm_pending:
        task_lower = task.lower()
        if task_lower not in seen:
            seen.add(task_lower)
            all_pending.append(task)

    # ── 5. Build final response ───────────────────────────────────────────────
    return {
        "critical_items": critical_items if critical_items else ["No critical alerts this shift"],
        "stable_items":   stable_items   if stable_items   else (["Monitor closely for changes"] if has_critical else ["Condition stable"]),
        "pending_tasks":  all_pending    if all_pending    else ["No outstanding tasks identified"],
        "narrative":      narrative
    }
