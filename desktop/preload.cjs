const {contextBridge,ipcRenderer,webUtils}=require('electron');
contextBridge.exposeInMainWorld('fita',{
 state:()=>ipcRenderer.invoke('state'), import:()=>ipcRenderer.invoke('import'),
 drop:files=>ipcRenderer.invoke('import-paths',Array.from(files).map(f=>webUtils.getPathForFile(f))),
 action:(action,id)=>ipcRenderer.invoke('action',{action,id}),
 detail:id=>ipcRenderer.invoke('detail',id),
 correct:data=>ipcRenderer.invoke('correct',data),
 assign:data=>ipcRenderer.invoke('assign',data),
 recognize:()=>ipcRenderer.invoke('recognize'),
 enroll:data=>ipcRenderer.invoke('enroll',data),
 export:(id,format)=>ipcRenderer.invoke('export',{id,format}),
 remember:data=>ipcRenderer.invoke('remember',data),
 onChange:fn=>{const h=()=>fn();ipcRenderer.on('changed',h);return()=>ipcRenderer.removeListener('changed',h)},
 onNavigate:fn=>ipcRenderer.on('navigate',(_,view)=>fn(view))
});
