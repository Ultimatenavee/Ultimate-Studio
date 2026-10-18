import resources from './port-resources.mjs';
import '../web/bayface-accessories.js';
import '../web/bayface-model.js';
const identifier=v=>typeof v==='string'&&/^[\w-]{1,64}$/.test(v);
const string=(v,max,optional=false)=>optional&&v===undefined||typeof v==='string'&&v.length<=max;
const coordinate=v=>Number.isFinite(v)&&Math.abs(v)<=100000;
const color=v=>typeof v==='string'&&/^#[\da-f]{6}$/i.test(v);
export function validateProject(input,models){
  const fail=()=>{throw new Error('ข้อมูล Topology ไม่ถูกต้อง');};
  if(input?.format!=='noah-topology'||![1,2,3].includes(input.version)||!identifier(input.id)||typeof input.name!=='string'||!Array.isArray(input.devices)||input.devices.length>200||!Array.isArray(input.links)||input.links.length>400||!Array.isArray(input.labels)||input.labels.length>200||!Array.isArray(input.groups)||input.groups.length>200)fail();
  if(!input.devices.length&&!input.labels.length&&!input.bayface?.racks?.length)throw new Error('Template ต้องมีอุปกรณ์หรือ Label');
  for(const list of ['devices','labels','links','groups'])for(const o of input[list]){if(o.externalIconStyle!==undefined&&!['classic','glass'].includes(o.externalIconStyle))fail();if(o.iconStyle!==undefined&&!['real','threeD','outline','flat'].includes(o.iconStyle))fail();if(o.zIndex!==undefined&&(!Number.isFinite(o.zIndex)||Math.abs(o.zIndex)>100000))fail();if(list==='devices')for(const k of ['width','height'])if(o[k]!==undefined&&(!Number.isFinite(o[k])||o[k]<32||o[k]>10000))fail();}
  const ids=new Set(),devices=new Map(),usedPorts=new Set(),opticDefs={ct:{speed:1000,cable:'copper'},lx:{speed:1000,cable:'sm'},sx:{speed:1000,cable:'mm'},lr:{speed:10000,cable:'sm'},sr:{speed:10000,cable:'mm'},lr4:{speed:40000,cable:'sm'},sr4:{speed:40000,cable:'mm'},lr100:{speed:100000,cable:'sm'},sr100:{speed:100000,cable:'mm'}};
  const opticAllowed=(p,id)=>{const o=opticDefs[id];return !!o&&(id!=='ct'||p.copperSfp)&&p.speeds.includes(o.speed)&&({'SFP':[1000],'SFP+':[1000,10000],'QSFP+':[40000],'QSFP28':[40000,100000]}[p.connector]||[]).includes(o.speed)&&(!p.allowedOptics||p.allowedOptics.includes(id));};
  const unique=id=>{if(!identifier(id)||ids.has(id))fail();ids.add(id);};
  const port=ep=>{const d=devices.get(ep?.device),m=models[d?.modelId];if(!d||!string(ep?.port,64)||!ep.port.trim())fail();if(d.diagramOnly||m.topologyOnly||d.importedPorts?.includes(ep.port))return {id:ep.port,group:m.topologyOnly&&/^huawei-(?:ne8000|ne40e)/.test(d.modelId)?(ep.port.match(/^(?:GigabitEthernet|GE|25GE|40GE|50GE|100GE|50\|100GE)\s*(\d+\/\d+\/\d+)$/i)?.[1]||ep.port):ep.port,unverified:true};const p=m.ports.find(p=>p.id===ep.port&&p.kind==='network');if(!p)fail();return p;};
  for(const d of input.devices){
    if(!string(d.externalName,80,true))fail();unique(d.id);const m=models[d.modelId];if(!m||!coordinate(d.x)||!coordinate(d.y)||!string(d.hostname,80)||!['serial','asset','managementIP'].every(k=>string(d[k],100,true))||!string(d.site,100,true)||!string(d.role,80,true)||!string(d.notes,5000,true)||!string(d.sourceModel,100,true)||!string(d.sourceBrand,80,true)||d.diagramOnly!==undefined&&typeof d.diagramOnly!=='boolean'||!Array.isArray(d.supplies)||d.supplies.length!==m.powerSlots)fail();
    if(d.supplies.some(s=>typeof s.present!=='boolean'||typeof s.connected!=='boolean'||!(m.powerModes||['AC']).includes(s.mode)||!string(s.source,100)))fail();
    if(!m.allowsMixedPower&&new Set(d.supplies.filter(s=>s.present).map(s=>s.mode)).size>1)fail();
    for(const [key,value]of Object.entries(d.transceivers||{})){const p=m.ports.find(p=>p.id===key),o=opticDefs[value];if(!p||!o||!opticAllowed(p,value))fail();}
    if(d.importedPorts!==undefined&&(!Array.isArray(d.importedPorts)||d.importedPorts.length>400||d.importedPorts.some(v=>!string(v,64)||!v.trim())))fail();
    devices.set(d.id,d);
  }
  for(const l of input.links){
    unique(l.id);if(l.displayText!==undefined&&!string(l.displayText,1000))fail();if(l.designOnly!==undefined&&typeof l.designOnly!=='boolean')fail();const ap=port(l.a),bp=port(l.b);
    if(l.a.device===l.b.device||!['copper','sm','mm'].includes(l.cable)||!Number.isInteger(l.speed)||l.speed<10||l.speed>400000||!string(l.fiberRoute,100,true)||!string(l.cid,100,true)||!string(l.vlans,200,true)||!string(l.label,150,true)||!['main','backup','standard'].includes(l.role)||!['curved','straight','orthogonal'].includes(l.shape)||!Number.isInteger(l.mtu)||l.mtu<576||l.mtu>65535||!['trunk','access'].includes(l.vlanMode)||l.color&&!color(l.color))fail();
    for(const [p,ep]of [[ap,l.a],[bp,l.b]]){
      const m=models[devices.get(ep.device).modelId],keys=resources.keys(m,ep.port,l.cable).map(k=>ep.device+':'+k);if(keys.some(k=>usedPorts.has(k))||(p.conflictPorts||[]).some(id=>usedPorts.has(ep.device+':'+id)))fail();keys.forEach(k=>usedPorts.add(k));
      if(p.unverified||l.designOnly===true)continue;
      if(!p.speeds.includes(l.speed)||l.cable==='copper'&&p.connector!=='RJ45'&&!p.copperSfp||l.cable!=='copper'&&p.connector==='RJ45')fail();
      if(l.cable==='copper'&&p.connector!=='RJ45'&&(!p.copperSfp||devices.get(ep.device).transceivers?.[ep.port]!=='ct'||l.speed!==1000))fail();
      if(l.cable!=='copper'){const o=opticDefs[devices.get(ep.device).transceivers?.[ep.port]];if(!o||o.speed!==l.speed||o.cable!==l.cable)fail();}
    }
    for(const part of (l.vlans||'').split(',').filter(t=>t.trim())){const m=part.trim().match(/^(\d{1,4})(?:\s*-\s*(\d{1,4}))?$/);if(!m||+m[1]<1||+m[1]>4094||m[2]&&(+m[2]<+m[1]||+m[2]>4094))fail();}
    for(const key of ['routeOffset','labelOffset'])if(l[key]&&(!coordinate(l[key].x)||!coordinate(l[key].y)))fail();
    if(l.waypoints&&(!Array.isArray(l.waypoints)||l.waypoints.length>32||l.waypoints.some(p=>!Array.isArray(p)||p.length!==2||!p.every(coordinate))))fail();
  }
  const labels=new Set();
  for(const l of input.labels){unique(l.id);labels.add(l.id);if(!coordinate(l.x)||!coordinate(l.y)||!string(l.text,1000)||l.kind!=='shape'&&!l.text.trim()||!Number.isInteger(l.fontSize)||l.fontSize<12||l.fontSize>48||!color(l.color)||!['text','region','shape'].includes(l.kind)||!['left','center','right'].includes(l.align)||l.background!=='transparent'&&!color(l.background)||!Number.isFinite(l.backgroundOpacity)||l.backgroundOpacity<0||l.backgroundOpacity>1)fail();if(['region','shape'].includes(l.kind)&&(!Number.isFinite(l.width)||l.width<(l.kind==='shape'?32:80)||l.width>10000||!Number.isFinite(l.height)||l.height<(l.kind==='shape'?32:60)||l.height>10000))fail();if(l.opacity!==undefined&&(!Number.isFinite(l.opacity)||l.opacity<0||l.opacity>1))fail();if(l.kind==='shape'&&(!['cloud','rect','roundRect','ellipse','diamond','hexagon','rightArrow','can','symphonyLogo','symphonyCloud','customerBuilding'].includes(l.shape)||!color(l.stroke)||!Number.isFinite(l.strokeWidth)||l.strokeWidth<0||l.strokeWidth>12))fail();}
  const members=new Set();for(const g of input.groups){unique(g.id);if(g.collapsed!==undefined&&typeof g.collapsed!=='boolean'||!string(g.name,80)||!color(g.color)||!Array.isArray(g.deviceIds)||!Array.isArray(g.labelIds)||g.deviceIds.some(id=>!devices.has(id))||g.labelIds.some(id=>!labels.has(id)))fail();for(const id of [...g.deviceIds,...g.labelIds]){if(members.has(id))fail();members.add(id);}}
  // Persist only Topology fields; never preserve an uploaded source URL or tokens.
  const project={format:'noah-topology',version:3,id:input.id,name:input.name,metadata:{createdAt:String(input.metadata?.createdAt||''),updatedAt:String(input.metadata?.updatedAt||'')},linkGridSize:input.linkGridSize===40?40:20,devices:input.devices.map(d=>pick(d,['id','modelId','hostname','x','y','serial','asset','notes','managementIP','role','powerOn','alarm','transceivers','supplies','diagramOnly','importedPorts','sourceModel','sourceBrand','site','externalName','width','height','zIndex','iconStyle','externalIconStyle'])),links:input.links.map(l=>pick(l,['id','a','b','designOnly','cable','speed','cid','vlans','label','displayText','role','shape','color','enabled','showLabel','vlanMode','mtu','routeOffset','labelOffset','waypoints','fiberRoute','zIndex'])),labels:input.labels.map(l=>pick(l,['id','x','y','text','fontSize','color','bold','kind','background','align','backgroundOpacity','width','height','shape','stroke','strokeWidth','opacity','zIndex'])),groups:input.groups.map(g=>pick(g,['id','name','deviceIds','labelIds','color','collapsed','zIndex']))};
  if(input.designOrigin!==undefined||input.presentation!==undefined){project.designOrigin=input.designOrigin==='external'?'external':'internal';project.presentation=project.designOrigin==='external'||input.presentation==='external'?'external':'internal';}
  if(input.bayface!==undefined)project.bayface=globalThis.NOAH_BAYFACE_MODEL.validate(input.bayface,new Set(Object.keys(models)));
  return project;
}
function pick(value,keys){return Object.fromEntries(keys.filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));}
