"""Save a confirmed vocabulary correction: remember.py HEARD CORRECT SOURCE_NOTE."""
import json
from pathlib import Path
import sys
from datetime import datetime, timezone

heard, correct, source = sys.argv[1:]
path = Path(__file__).parent / 'correction-memory.json'
memory = json.loads(path.read_text())
memory['corrections'].append({'heard': heard, 'correct': correct, 'source': source,
    'confirmed_at': datetime.now(timezone.utc).isoformat()})
if correct not in memory['vocabulary']:
    memory['vocabulary'].append(correct)
temp = path.with_suffix('.tmp')
temp.write_text(json.dumps(memory, ensure_ascii=False, indent=2))
temp.replace(path)
print('Saved for future transcription context.')
