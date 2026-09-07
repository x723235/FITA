"""Local, full-precision Qwen3-ASR transcription with original output preserved."""
import dataclasses
import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
os.environ.setdefault('HF_HOME', str(ROOT / 'work/models'))
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['PYANNOTE_METRICS_ENABLED'] = '0'
from mlx_qwen3_asr import transcribe

source = Path(sys.argv[1])
destination = Path(sys.argv[2])
destination.parent.mkdir(parents=True, exist_ok=True)

def progress(event):
    print(json.dumps(event, ensure_ascii=False, default=str), flush=True)

memory_file = Path(__file__).parent / 'correction-memory.json'
memory = json.loads(memory_file.read_text()) if memory_file.exists() else {'vocabulary': []}
context = ', '.join(memory.get('vocabulary', [])[:100])
result = transcribe(str(source), model='Qwen/Qwen3-ASR-1.7B', context=context,
                    return_chunks=True, return_timestamps=True,
                    max_new_tokens=2048, on_progress=progress)
destination.write_text(json.dumps(dataclasses.asdict(result), ensure_ascii=False, indent=2))
print('Saved', destination, flush=True)
