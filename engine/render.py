"""Join locally generated word timing and speaker turns; preserve raw results."""
import json
from pathlib import Path
import sys
import re
from difflib import SequenceMatcher

asr_path, diar_path, out_path = map(Path, sys.argv[1:])
asr, diar = json.loads(asr_path.read_text()), json.loads(diar_path.read_text())
turns = diar['segments']
words = [dict(w) for w in (asr.get('segments') or asr.get('chunks') or [])]
# Restore punctuation only where the original ASR tokens match aligned words.
raw_tokens=asr.get('text','').split()
normalize=lambda text: re.sub(r'[^\w]', '', text).casefold()
matcher=SequenceMatcher(None,[normalize(w['text']) for w in words],[normalize(t) for t in raw_tokens],autojunk=False)
for a,b,size in matcher.get_matching_blocks():
    for offset in range(size):
        words[a+offset]['text']=raw_tokens[b+offset]
groups = []
for word in words:
    start, end = float(word['start']), float(word['end'])
    overlaps = sorted([(max(0, min(end,t['end'])-max(start,t['start'])), t['speaker'])
        for t in turns], reverse=True)
    speaker = overlaps[0][1] if overlaps and overlaps[0][0] > 0 else 'UNASSIGNED'
    if groups and groups[-1]['speaker']==speaker and start-groups[-1]['end']<2 and end-groups[-1]['start']<25:
        groups[-1]['text'] += ' ' + word['text'].strip()
        groups[-1]['end'] = end
    else:
        groups.append({'start':start, 'end':end, 'speaker':speaker, 'text':word['text'].strip()})

def timestamp(s):
    m,s=divmod(int(s),60)
    return f'{m:02d}:{s:02d}'

out_path.mkdir(parents=True, exist_ok=True)
notes_path=out_path/'review-notes.json'
notes=json.loads(notes_path.read_text()) if notes_path.exists() else []
(out_path/'transcript.json').write_text(json.dumps({'segments':groups,'asr':asr,'diarization':diar,'review_notes':notes},ensure_ascii=False,indent=2))
lines=['# FITA — transcrição', '',
    f"Transcrição local com {asr.get('model','Qwen/Qwen3-ASR-1.7B')}. Idiomas originais preservados.", '',
    '**Revisão:** texto gerado por modelo, ainda não verificado palavra por palavra. Grupos de voz são provisórios; sobreposição, música e sotaques podem causar erros.', '',
    'O áudio e a saída original do modelo continuam guardados separadamente.', '']
if notes:
    lines += ['## Trechos que precisam de conferência', '']
    for note in notes:
        lines += [f"- {timestamp(note['start'])}–{timestamp(note['end'])}: {note['message']}"]
    lines += ['', '## Transcrição automática', '']
for g in groups:
    lines += [f"**[{timestamp(g['start'])}–{timestamp(g['end'])}] {g['speaker']}**", '', g['text'], '']
(out_path/'transcript.md').write_text('\n'.join(lines))
(out_path/'transcript.txt').write_text('\n\n'.join(f"[{timestamp(g['start'])}] {g['speaker']}: {g['text']}" for g in groups))
print('Saved readable transcript:', out_path)
