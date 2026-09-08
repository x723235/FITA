"""Local Whisper large-v3; overlapping windows and preserved recognition evidence."""
import hashlib,json,os,subprocess,sys,tempfile,wave
from pathlib import Path
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
import mlx_whisper
MODEL='mlx-community/whisper-large-v3-mlx'
REVISION='49e6aa286ad60c14352c404340ded53710378a11'
WINDOW=120
PADDING=5
FILTER='dynaudnorm=f=150:g=15:p=0.9:m=10'

def transcribe(source,destination):
 source,destination=Path(source),Path(destination)
 with wave.open(str(source)) as audio: duration=audio.getnframes()/audio.getframerate()
 words=[];chunks=[];notes=[]
 memory_file=Path(__file__).with_name('correction-memory.json')
 vocabulary=json.loads(memory_file.read_text()).get('vocabulary',[]) if memory_file.exists() else []
 model_path=Path(os.environ.get('HF_HOME',str(Path.home()/'.cache/huggingface')))/'hub/models--mlx-community--whisper-large-v3-mlx/snapshots'/REVISION
 if not (model_path/'weights.npz').exists() and not (model_path/'model.safetensors').exists():
  # The model may use another supported weight filename; load only a pinned snapshot.
  from huggingface_hub import snapshot_download
  model_path=Path(snapshot_download(MODEL,revision=REVISION))
 with tempfile.TemporaryDirectory(prefix='fita-whisper-') as temp:
  for index,start in enumerate(range(0,int(duration)+1,WINDOW)):
   if start>=duration:break
   end=min(start+WINDOW,duration);a=max(0,start-PADDING);b=min(duration,end+PADDING)
   clip=Path(temp)/'window.wav'
   ffmpeg=os.environ.get('FITA_FFMPEG','ffmpeg')
   subprocess.run([ffmpeg,'-nostdin','-v','error','-y','-ss',str(a),'-i',str(source),'-t',str(b-a),'-af',FILTER,str(clip)],check=True)
   result=mlx_whisper.transcribe(str(clip),path_or_hf_repo=str(model_path),temperature=0,condition_on_previous_text=False,word_timestamps=True,no_speech_threshold=None,initial_prompt=', '.join(vocabulary[:100]) or None)
   chunks.append({'start':start,'end':end,'audio_start':a,'audio_end':b,'language':result['language'],'result':result})
   for segment in result['segments']:
    for word in segment.get('words',[]):
     ws,we=word['start']+a,word['end']+a
     if start<=(ws+we)/2<end:
      words.append({'start':max(0,ws),'end':min(duration,we),'text':word['word'].strip(),'probability':word.get('probability')})
   print(json.dumps({'progress':end/duration,'chunk_index':index,'model':MODEL}),flush=True)
 words.sort(key=lambda w:(w['start'],w['end']))
 for w in words:
  if w['end']<=w['start']:
   notes.append({'start':w['start'],'end':w['end'],'kind':'alignment','message':'Tempo desta palavra não resolvido pelo reconhecedor.'})
 payload={'text':' '.join(w['text'] for w in words),'language':chunks[0]['language'] if chunks else None,'segments':words,'chunks':chunks,'model':MODEL,'model_revision':REVISION,'timing_unit':'word','processing':{'window_seconds':WINDOW,'padding_seconds':PADDING,'audio_filter':FILTER,'no_speech_threshold':None},'review_notes':notes,'finish_reason':'completed','truncated':False}
 destination.parent.mkdir(parents=True,exist_ok=True)
 destination.write_text(json.dumps(payload,ensure_ascii=False,indent=2))
 print('Saved',destination,flush=True)

if __name__=='__main__':transcribe(*sys.argv[1:])
