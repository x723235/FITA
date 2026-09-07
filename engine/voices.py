"""User-confirmed local voice examples and conservative candidate matching.

Usage: voices.py enroll AUDIO NAME START END
       voices.py match AUDIO SPEAKERS_JSON OUTPUT_JSON
Only enroll clean, single-speaker excerpts whose identity has been confirmed.
Scores are cosine similarity, not calibrated probabilities.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

import numpy as np
import soundfile as sf
import wespeakerruntime

LIBRARY = Path(__file__).parent / 'voice-library.json'
MODEL = 'wespeaker-resnet34-lm-en'

def normalize(v):
    v = np.asarray(v, dtype=float).reshape(-1)
    return v / max(np.linalg.norm(v), 1e-12)

def embedding(model, audio, start, end):
    if start < 0 or end - start < 3:
        raise ValueError('Use at least three seconds of clean, single-speaker audio.')
    with tempfile.TemporaryDirectory() as folder:
        clip = Path(folder) / 'clip.wav'
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-ss', str(start),
            '-i', str(audio), '-t', str(end-start), '-ar', '16000', '-ac', '1',
            str(clip)], check=True)
        samples, rate = sf.read(clip)
        if len(samples) / rate < 2.9:
            raise ValueError('Excerpt is outside the recording or too short.')
        return normalize(model.extract_embedding(str(clip)))

def main():
    mode, audio, *args = sys.argv[1:]
    library = json.loads(LIBRARY.read_text()) if LIBRARY.exists() else {
        'model': MODEL, 'profiles': {}, 'matching_policy': 'suggestions_only'}
    if library['model'] != MODEL:
        raise ValueError('Voice library embedding model mismatch')
    if mode == 'match' and not library['profiles']:
        Path(args[1]).write_text(json.dumps({'status': 'no_confirmed_voices', 'matches': {}}))
        return
    model = wespeakerruntime.Speaker(lang='en')
    if mode == 'enroll':
        name, start, end = args
        start, end = float(start), float(end)
        vector = embedding(model, audio, start, end)
        source_hash = hashlib.sha256(Path(audio).read_bytes()).hexdigest()
        key = f'{source_hash}:{start}:{end}'
        profile = library['profiles'].setdefault(name, {'examples': []})
        if any(e['key'] == key for e in profile['examples']):
            print('This confirmed example is already saved.')
            return
        profile['examples'].append({'key': key, 'source_sha256': source_hash,
            'start': start, 'end': end, 'embedding': vector.tolist(),
            'confirmed_at': datetime.now(timezone.utc).isoformat()})
        temp = LIBRARY.with_suffix('.tmp')
        temp.write_text(json.dumps(library, ensure_ascii=False, indent=2))
        temp.replace(LIBRARY)
        print(f'Saved confirmed voice example for {name}.')
    elif mode == 'match':
        segments = json.loads(Path(args[0]).read_text())['segments']
        matches = {}
        cache_path = Path(args[1]).with_suffix('.embeddings.json')
        audio_stat = Path(audio).stat()
        cache_key = f'{MODEL}:{Path(audio).resolve()}:{audio_stat.st_size}:{audio_stat.st_mtime_ns}'
        try:
            cache = json.loads(cache_path.read_text())
        except (OSError, ValueError):
            cache = {}
        if cache.get('key') != cache_key:
            cache = {'key': cache_key, 'vectors': {}}
        for speaker in sorted({s['speaker'] for s in segments}):
            clean = sorted((s for s in segments if s['speaker'] == speaker
                and s['end']-s['start'] >= 3.6), key=lambda s: s['end']-s['start'], reverse=True)[:5]
            vectors = []
            for s in clean:
                start, end = s['start']+.3, min(s['end']-.3, s['start']+12)
                key = f'{start}:{end}'
                if key not in cache['vectors']:
                    cache['vectors'][key] = embedding(model, audio, start, end).tolist()
                vectors.append(normalize(cache['vectors'][key]))
            if not vectors:
                matches[speaker] = {'status': 'insufficient_audio'}
                continue
            scores = sorted([(name, float(np.median([
                max(float(np.dot(v, normalize(e['embedding']))) for e in p['examples'])
                for v in vectors]))) for name, p in library['profiles'].items()],
                key=lambda x:x[1], reverse=True)
            best = scores[0]
            margin = best[1] - scores[1][1] if len(scores)>1 else None
            matches[speaker] = {'status': 'requires_confirmation',
                'candidate': best[0] if best[1] >= .65 and (margin is None or margin >= .15) else None,
                'similarities': dict(scores), 'margin': margin,
                'note': 'Uncalibrated similarity; never an automatic identity confirmation.'}
        cache_path.write_text(json.dumps(cache))
        Path(args[1]).write_text(json.dumps({'status': 'suggestions_only', 'matches': matches}, indent=2))
    else:
        raise ValueError('Expected enroll or match')

if __name__ == '__main__':
    main()
