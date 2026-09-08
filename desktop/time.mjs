const pad=value=>String(value).padStart(2,'0');

export function elapsedTime(seconds){
 const value=Math.max(0,Number(seconds)||0);
 return `${pad(Math.floor(value/60))}:${pad(Math.floor(value%60))}`;
}

export function recordingInstant(recordedAt,seconds=0){
 if(!recordedAt)return null;
 const base=new Date(recordedAt);
 if(Number.isNaN(base.getTime()))return null;
 return new Date(base.getTime()+Math.max(0,Number(seconds)||0)*1000);
}

export function wallClock(recordedAt,seconds){
 const value=recordingInstant(recordedAt,seconds);
 return value?`${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`:elapsedTime(seconds);
}

export function wallTimestamp(recordedAt,seconds){
 const value=recordingInstant(recordedAt,seconds);
 return value?`${value.getFullYear()}-${pad(value.getMonth()+1)}-${pad(value.getDate())} ${wallClock(recordedAt,seconds)}`:elapsedTime(seconds);
}
