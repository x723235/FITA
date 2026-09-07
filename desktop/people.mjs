export function assignedName(labels,segment,index){return [...labels].reverse().find(l=>l.index!=null?l.index===index:l.start<=segment.start+.11&&l.end>=segment.end-.11)?.name}
function duration(intervals){let end=-Infinity,total=0;for(const [a,b] of intervals.sort((x,y)=>x[0]-y[0])){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b)}return total}
export function speakerLibrary(records,voices){
 const people=new Map();const person=name=>{if(!people.has(name))people.set(name,{name,segments:[],audio:new Map(),languages:new Set(),examples:voices.profiles?.[name]?.examples||[]});return people.get(name)};
 for(const name of Object.keys(voices.profiles||{}))person(name);
 for(const {job,transcript,labels} of records){if(!transcript)continue;transcript.segments.forEach((s,index)=>{const name=assignedName(labels,s,index);if(!name)return;const p=person(name),audioKey=job.sha256||job.id;p.segments.push({jobId:job.id,title:job.title,index,start:s.start,end:s.end,text:s.text});if(!p.audio.has(audioKey))p.audio.set(audioKey,[]);p.audio.get(audioKey).push([s.start,s.end]);for(const lang of job.languages||[])p.languages.add(lang)})}
 return [...people.values()].map(p=>({name:p.name,segments:p.segments,segmentCount:p.segments.length,recordingCount:p.audio.size,seconds:[...p.audio.values()].reduce((n,x)=>n+duration(x),0),languages:[...p.languages],exampleCount:p.examples.length,exampleSeconds:p.examples.reduce((n,e)=>n+Math.max(0,e.end-e.start),0)})).sort((a,b)=>a.name.localeCompare(b.name));
}

// Unknown segments are not a voice cluster. Preserve explicit corrections elsewhere.
export function assignmentTargets(segments,labels,index,group){
 const seed=segments[index];if(!seed)throw Error('Trecho inválido');
 return segments.flatMap((s,i)=>i===index||(group&&/^SPEAKER_\d+$/.test(seed.speaker)&&s.speaker===seed.speaker&&!assignedName(labels,s,i))?[i]:[]);
}
