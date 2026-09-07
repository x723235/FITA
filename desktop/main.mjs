import {speakerLibrary,assignmentTargets} from './people.mjs';
import {app,BrowserWindow,ipcMain,dialog,Menu,powerSaveBlocker} from 'electron';
import {readFile,writeFile,mkdir,copyFile,rename,stat} from 'node:fs/promises';
import {existsSync,createReadStream} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const config=JSON.parse(await readFile(path.join(HERE,'config.json'),'utf8'));
const ROOT=process.env.FITA_WORKSPACE||config.workspace;
const DATA=process.env.FITA_DATA||config.dataDir||path.join(ROOT,'outputs/fita/data');
const SCRIPTS=process.env.FITA_SCRIPTS||config.scriptsDir||path.join(ROOT,'outputs/local-transcriber');
if(config.modelCache&&!process.env.FITA_DATA)process.env.HF_HOME=config.modelCache;
process.env.PATH=['/opt/homebrew/bin','/usr/local/bin',process.env.PATH].filter(Boolean).join(':');
const PY=config.python||path.join(ROOT,'work/venv/bin/python');
const DPY=config.diarPython||path.join(ROOT,'work/diarize-venv/bin/python');
const FFMPEG='/opt/homebrew/bin/ffmpeg';
if(process.env.FITA_DATA)app.setPath('userData',path.join(DATA,'window'));
let state={paused:false,jobs:[]};
let win,child=null,active=null,locked=false,writeTail=Promise.resolve();
const externalAlive=pid=>{try{const cmd=execFileSync('/bin/ps',['-p',String(pid),'-o','command='],{encoding:'utf8'});return /outputs\/local-transcriber\/(transcribe|speakers)\.py/.test(cmd)}catch{return false}};
const pending=(j)=>['queued','running'].includes(j.status);
const jobDir=id=>path.join(DATA,id);
const find=id=>{const j=state.jobs.find(j=>j.id===id);if(!j)throw Error('Gravação não encontrada.');return j};
function save(){const snapshot=JSON.stringify(state,null,2);writeTail=writeTail.then(async()=>{const temp=path.join(DATA,'queue.tmp');await writeFile(temp,snapshot);await rename(temp,path.join(DATA,'queue.json'));win?.webContents.send('changed')});return writeTail}
async function json(file,fallback=null){try{return JSON.parse(await readFile(file,'utf8'))}catch{return fallback}}
function run(bin,args,job,phase){return new Promise((resolve,reject)=>{
 job.phase=phase;job.progress=null;save();
 child=spawn(bin,args,{env:{...process.env,PYTHONUNBUFFERED:'1',HF_HUB_DISABLE_TELEMETRY:'1',PYANNOTE_METRICS_ENABLED:'0'},stdio:['ignore','pipe','pipe']});
 let log='';const onData=data=>{log=(log+data.toString()).slice(-12000);job.log=log;
   for(const l of data.toString().split('\n')){try{const e=JSON.parse(l);if(e.progress!=null)job.progress=e.progress;if(e.chunk_index!=null)job.chunk=e.chunk_index+1}catch{}}
   win?.webContents.send('changed');};child.stdout.on('data',onData);child.stderr.on('data',onData);
 child.once('error',reject);child.once('close',code=>{child=null;code===0?resolve():reject(Error(log.slice(-1800)||`Processo terminou (${code})`))});
})}
async function finish(job,asr,diar){
 const dir=jobDir(job.id);await copyFile(asr,path.join(dir,'asr.json'));await copyFile(diar,path.join(dir,'speakers.json'));
 await run(PY,[path.join(SCRIPTS,'render.py'),path.join(dir,'asr.json'),path.join(dir,'speakers.json'),dir],job,'Organizando transcrição');
 await run(DPY,[path.join(SCRIPTS,'voices.py'),'match',job.audio,path.join(dir,'speakers.json'),path.join(dir,'matches.json')],job,'Comparando vozes conhecidas');
 const transcript=await json(path.join(dir,'transcript.json'));
 job.model=transcript.asr.model||'Qwen/Qwen3-ASR-1.7B';job.status='done';job.phase='Pronta para revisar';job.progress=1;job.speakers=transcript.diarization.num_speakers;
 job.languages=[...new Set((transcript.asr.chunks||[]).map(c=>c.language).filter(Boolean))];job.finishedAt=new Date().toISOString();await save();
}
async function tick(){if(locked||active||state.paused)return;locked=true;
 try{const job=state.jobs.find(j=>j.status==='queued'||(j.status==='running'&&j.external));if(!job)return;
 active=job.id;
 if(job.external){const a=path.join(ROOT,'work/qwen.json'),d=path.join(ROOT,'work/speakers.json');
   job.log=(await readFile(path.join(ROOT,'work/qwen.log'),'utf8').catch(()=>'' )).slice(-10000);
   job.speakerLog=(await readFile(path.join(ROOT,'work/speakers.log'),'utf8').catch(()=>'' )).slice(-1500);
   job.phase=existsSync(a)?'Separando as vozes':'Baixando modelo / transcrevendo';
   try{for(const line of job.log.split('\n')){try{const e=JSON.parse(line);if(e.progress!=null){job.progress=e.progress;job.phase='Transcrevendo'}}catch{}}}catch{}
   if(existsSync(a)&&existsSync(d)){await finish(job,a,d);delete job.external;await save()}
   else {const alive=job.pids.some(externalAlive);if(!alive){job.status='error';job.phase='Processamento interrompido';job.error=(job.log+'\n'+job.speakerLog).slice(-2500);await save()}else win?.webContents.send('changed')}
   return;
 }
 job.status='running';job.startedAt=new Date().toISOString();await save();const dir=jobDir(job.id);
 const blocker=powerSaveBlocker.start('prevent-app-suspension');
 try{
   await run(FFMPEG,['-nostdin','-v','error','-y','-i',job.audio,'-ar','16000','-ac','1',path.join(dir,'audio.wav')],job,'Preparando áudio');
   await run(PY,[path.join(SCRIPTS,'transcribe_whisper.py'),path.join(dir,'audio.wav'),path.join(dir,'asr-work.json')],job,'Transcrevendo');
   await run(DPY,[path.join(SCRIPTS,'speakers.py'),path.join(dir,'audio.wav'),path.join(dir,'speakers-work.json')],job,'Separando as vozes');
   await finish(job,path.join(dir,'asr-work.json'),path.join(dir,'speakers-work.json'));
 }catch(e){if(job.status!=='cancelled'){job.status='error';job.phase='Precisa de atenção';job.error=e.message}await save()}
 finally{powerSaveBlocker.stop(blocker)}
 }catch(error){const j=state.jobs.find(j=>j.id===active);if(j&&j.status!=='cancelled'){j.status='error';j.phase='Precisa de atenção';j.error=error.message;await save()}}finally{active=null;locked=false}
}
async function hash(file){const h=createHash('sha256');for await(const b of createReadStream(file))h.update(b);return h.digest('hex')}
let importTail=Promise.resolve();
function importPaths(files){const result=importTail.then(()=>performImport(files));importTail=result.catch(()=>{});return result}
async function performImport(files){if(!Array.isArray(files)||files.length>500)throw Error('Lista de arquivos inválida');let added=0,duplicates=0;
 for(const file of files){if(typeof file!=='string'||!['.m4a','.mp3','.wav','.flac','.ogg','.mp4','.aac'].includes(path.extname(file).toLowerCase()))throw Error('Escolha um arquivo de áudio suportado.');
 const meta=await stat(file);if(!meta.isFile())continue;const sha=await hash(file);if(state.jobs.some(j=>j.sha256===sha)){duplicates++;continue}
 const id=randomUUID();const dir=jobDir(id);await mkdir(dir);const audio=path.join(dir,'original'+path.extname(file));await copyFile(file,audio);
 state.jobs.push({id,title:path.basename(file),audio,sha256:sha,status:'queued',phase:'Aguardando sua vez',model:'mlx-community/whisper-large-v3-mlx',createdAt:new Date().toISOString(),bytes:meta.size,progress:0});added++;
 }await save();tick();return {added,duplicates}}
async function pick(){const r=await dialog.showOpenDialog(win,{properties:['openFile','multiSelections'],filters:[{name:'Áudio',extensions:['m4a','mp3','wav','flac','ogg','mp4','aac']}]});return r.canceled?{added:0,duplicates:0}:importPaths(r.filePaths)}
function ipc(name,handler){ipcMain.handle(name,(event,...args)=>{if(event.sender!==win?.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Origem inválida');return handler(...args)})}
ipc('state',async()=>{const voices=await json(path.join(SCRIPTS,'voice-library.json'),{profiles:{}});const records=await Promise.all(state.jobs.filter(j=>j.status==='done').map(async job=>({job,transcript:await json(path.join(jobDir(job.id),'transcript.json')),labels:await json(path.join(jobDir(job.id),'labels.json'),[])})));return {...state,voices,people:speakerLibrary(records,voices),memory:await json(path.join(SCRIPTS,'correction-memory.json')),runtime:{available:existsSync(PY)&&existsSync(DPY),model:'Whisper large-v3 · completo · local',speakers:'WeSpeaker · 1–6 vozes',local:true}}});
ipc('import',pick);ipc('import-paths',importPaths);
ipc('detail',async id=>{const job=find(id);const dir=jobDir(id);return {job,transcript:await json(path.join(dir,'transcript.json')),edits:await json(path.join(dir,'edits.json'),{}),labels:await json(path.join(dir,'labels.json'),[]),matches:await json(path.join(dir,'matches.json')),audioURL:pathToFileURL(job.audio).href}});
ipc('action',async({action,id})=>{
 if(action==='pause'){state.paused=!state.paused;await save();tick();return}
 const j=find(id);
 if(action==='retranscribe'&&j.status==='done'){const nextId=randomUUID();const dir=jobDir(nextId);await mkdir(dir);const audio=path.join(dir,'original'+path.extname(j.audio));await copyFile(j.audio,audio);state.jobs.push({id:nextId,title:path.parse(j.title).name+' · nova versão'+path.extname(j.audio),audio,sha256:j.sha256,sourceJob:j.id,status:'queued',phase:'Aguardando sua vez',model:'mlx-community/whisper-large-v3-mlx',createdAt:new Date().toISOString(),bytes:j.bytes,progress:0});await save();tick();return {id:nextId}}
 if(action==='retry'&&['error','cancelled'].includes(j.status)){j.status='queued';delete j.external;delete j.error;j.progress=0}
 else if(action==='cancel'&&pending(j)){j.status='cancelled';j.phase='Cancelada';if(j.external){for(const pid of j.pids){if(externalAlive(pid)){try{process.kill(pid,'SIGTERM')}catch{}}}delete j.external}else if(active===id)child?.kill('SIGTERM')}
 else if(action==='first'&&j.status==='queued'){state.jobs=state.jobs.filter(x=>x.id!==id);state.jobs.unshift(j)}
 else if(action==='reviewed'&&j.status==='done')j.reviewed=!j.reviewed;
 await save();tick();
});
ipc('correct',async({id,index,text})=>{const j=find(id);if(j.status!=='done'||!Number.isInteger(index)||typeof text!=='string'||text.length>20000)throw Error('Correção inválida');const dir=jobDir(id),t=await json(path.join(dir,'transcript.json'));if(!t.segments[index])throw Error('Trecho inválido');const edits=await json(path.join(dir,'edits.json'),{});edits[index]={text,original:t.segments[index].text,at:new Date().toISOString()};await writeFile(path.join(dir,'edits.json'),JSON.stringify(edits,null,2));j.reviewed=false;await save();return edits});
ipc('assign',async({id,index,name,group=false})=>{
 const j=find(id);name=String(name||'').trim();const dir=jobDir(id),t=await json(path.join(dir,'transcript.json'));
 if(j.status!=='done'||!Number.isInteger(index)||!t?.segments[index]||!name||name.length>100)throw Error('Escolha um trecho e informe o nome da pessoa.');
 const segment=t.segments[index],file=path.join(dir,'labels.json'),labels=await json(file,[]);
 const targets=assignmentTargets(t.segments,labels,index,group);
 for(const i of targets){const s=t.segments[i];labels.push({index:i,name,start:s.start,end:s.end,confirmedAt:new Date().toISOString(),source:i===index?'manual_assignment':'confirmed_group',seedIndex:index})}
 await writeFile(file,JSON.stringify(labels,null,2));j.reviewed=false;await save();return {count:targets.length};
});
let voiceBusy=false;
async function voiceProcess(args){await new Promise((resolve,reject)=>{const p=spawn(DPY,[path.join(SCRIPTS,'voices.py'),...args],{stdio:['ignore','pipe','pipe']});let msg='';p.stderr.on('data',x=>msg=(msg+x).slice(-2000));p.once('error',reject);p.on('close',c=>c===0?resolve():reject(Error(msg||'Não foi possível comparar vozes.')))})}
async function rematch(){let count=0;for(const j of state.jobs.filter(j=>j.status==='done')){await voiceProcess(['match',j.audio,path.join(jobDir(j.id),'speakers.json'),path.join(jobDir(j.id),'matches.json')]);count++}await save();return {count}}
ipc('recognize',async()=>{if(voiceBusy)throw Error('A comparação de vozes já está em andamento.');const library=await json(path.join(SCRIPTS,'voice-library.json'),{profiles:{}});if(!Object.keys(library.profiles).length)throw Error('Guarde primeiro um exemplo limpo da pessoa para reconhecer sua voz.');voiceBusy=true;try{return await rematch()}finally{voiceBusy=false}});
ipc('enroll',async({id,name,start,end,confirmed})=>{
 const j=find(id);name=String(name||'').trim();if(j.status!=='done'||!confirmed||!name||name.length>100||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end-start<3||end-start>30)throw Error('Confirme a pessoa em um trecho limpo de 3–30 segundos.');
 if(voiceBusy)throw Error('A comparação de vozes já está em andamento.');
 voiceBusy=true;try{
 await voiceProcess(['enroll',j.audio,name,String(start),String(end)]);
 const labelFile=path.join(jobDir(id),'labels.json');const labels=await json(labelFile,[]);labels.push({name,start,end,confirmedAt:new Date().toISOString(),source:'confirmed_voice_example'});await writeFile(labelFile,JSON.stringify(labels,null,2));await save();
 try{await rematch();return {matched:true}}catch(error){return {matched:false,error:error.message}}
 }finally{voiceBusy=false}
});
ipc('remember',async({heard,correct,source})=>{if(!String(correct||'').trim()||correct.length>150)throw Error('Use um nome ou termo de até 150 caracteres.');await new Promise((resolve,reject)=>{const p=spawn(PY,[path.join(SCRIPTS,'remember.py'),String(heard||''),correct,String(source||'Confirmado no FITA')]);p.once('error',reject);p.on('close',c=>c===0?resolve():reject(Error('Não foi possível salvar.')))});await save()});
ipc('export',async({id,format})=>{const j=find(id);if(!['txt','json','md'].includes(format)||j.status!=='done')throw Error('Transcrição ainda indisponível');const dir=jobDir(id);const t=await json(path.join(dir,'transcript.json')),edits=await json(path.join(dir,'edits.json'),{});const labels=await json(path.join(dir,'labels.json'),[]);const segments=t.segments.map((s,i)=>({...s,speaker:[...labels].reverse().find(l=>l.index!=null?l.index===i:l.start<=s.start+.11&&l.end>=s.end-.11)?.name??s.speaker,text:edits[i]?.text??s.text}));const result=await dialog.showSaveDialog(win,{defaultPath:j.title.replace(/\.[^.]+$/,'')+'.'+format});if(result.canceled)return;
 const contents=format==='json'?JSON.stringify({...t,segments,corrections:edits},null,2):segments.map(s=>`[${Math.floor(s.start/60)}:${String(Math.floor(s.start%60)).padStart(2,'0')}] ${s.speaker}\n${s.text}`).join('\n\n');await writeFile(result.filePath,contents);return true});

if(!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',()=>{win?.show();win?.focus()});
app.whenReady().then(async()=>{
win=new BrowserWindow({width:1280,height:850,minWidth:850,minHeight:600,title:'FITA',backgroundColor:'#101619',titleBarStyle:'hiddenInset',webPreferences:{preload:path.join(HERE,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',event=>event.preventDefault());
Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'FITA',submenu:[{role:'about'},{type:'separator'},{role:'hide'},{role:'quit'}]},{label:'Arquivo',submenu:[{label:'Importar gravações…',accelerator:'CmdOrCtrl+O',click:pick}]},{label:'Editar',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},{label:'Ir',submenu:[['Gravações','recordings'],['Fila','queue'],['Revisar','review'],['Pessoas','people'],['Ajustes','settings']].map(([label,view],i)=>({label,accelerator:`CmdOrCtrl+${i+1}`,click:()=>win.webContents.send('navigate',view)}))},{label:'Janela',submenu:[{role:'minimize'},{role:'zoom'}]}]));
await win.loadFile(path.join(HERE,'index.html'));
await mkdir(DATA,{recursive:true});
try{state=JSON.parse(await readFile(path.join(DATA,'queue.json'),'utf8'))}catch(error){if(error.code==='ENOENT')state={paused:false,jobs:[]};else throw error}
for(const j of state.jobs)if(j.status==='running'&&!j.external){j.status='error';j.phase='Interrompida ao fechar — pode tentar novamente'}
await save();setInterval(tick,2000);tick();
app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>{child?.kill('SIGTERM')});
}).catch(error=>{console.error(error);dialog.showErrorBox('FITA — não consegui abrir o arquivo local',error.message+'\nOs dados existentes não foram substituídos.');app.quit()});
}
