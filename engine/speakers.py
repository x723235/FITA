"""Local anonymous speaker detection, constrained to one through six voices."""
import json
import logging
from pathlib import Path
import sys
from diarize import diarize

logging.basicConfig(level=logging.INFO)
result = diarize(sys.argv[1], min_speakers=1, max_speakers=6)
Path(sys.argv[2]).write_text(json.dumps({
    'segments': result.to_list(), 'num_speakers': result.num_speakers,
    'audio_duration': result.audio_duration,
    'backend': 'FoxNoseTech/diarize',
}, indent=2))
print('Saved speaker segments', flush=True)
