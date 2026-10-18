'use strict';
// Pure planning calculations. No telemetry, protocol emulation, DOM or project writes.
globalThis.UTS_VISUAL_ENGINE=(()=>{
 const definitions=new WeakMap();
 const licenseFields={ipbase:'IPBase License Throughput (bps)',data:'Data License Throughput (bps)',security:'Security License Throughput (bps)'};
 const mbps=v=>{const m=String(v??'').trim().match(/^([\d.]+)\s*([GMK])(?:bps)?$/i);return m?+m[1]*({G:1000,M:1,K:.001}[m[2].toUpperCase()]):null;};
 function licenseCapacity(modelId,matrix,license='data'){const row=matrix.find(r=>r.id===modelId);return mbps(row?.fields?.[licenseFields[license]]);}
 function calculate(project,catalog,matrix,scenario={},resources=null,profiles={}){
  let definition=definitions.get(catalog);if(!definition||definition.profiles!==profiles||definition.resources!==resources){const models=new Map(catalog.map(m=>[m.id,m])),keys=new Map();for(const m of catalog){const preset=profiles[m.id]?.groups?.flatMap(g=>g.names)||[];keys.set(m.id,new Set(preset.length?preset.flatMap(n=>resources?.keys(m,n)||[n]):(m.ports||[]).filter(p=>p.kind==='network').map(p=>p.group||p.id)));}definition={models,keys,profiles,resources};definitions.set(catalog,definition);}
  const {models}=definition,devices=new Map(project.devices.map(d=>[d.id,d]));
  const off=new Set([...(scenario.downDevices||[]),...project.devices.filter(d=>d.powerOn===false||!models.get(d.modelId)?.topologyOnly&&Array.isArray(d.supplies)&&!d.supplies.some(s=>s.present&&s.connected)).map(d=>d.id)]),down=new Set(scenario.downLinks||[]);
  const load=Math.max(0,Math.min(150,Number(scenario.load)||0)),fixed=Math.max(0,Number(scenario.bandwidth)||0),used=new Map(),ports=new Map();
  let knownPorts=0,knownUsed=0,unknownDevices=0,unknownAssignments=0;
  for(const d of project.devices){const keys=definition.keys.get(d.modelId)||new Set();
   ports.set(d.id,keys);if(keys.size)knownPorts+=keys.size;else unknownDevices++;used.set(d.id,new Set());}
  const links=project.links.map(l=>{
   for(const ep of [l.a,l.b]){const m=models.get(devices.get(ep.device)?.modelId);if(m)for(const k of resources?.keys(m,ep.port,l.cable)||[ep.port])used.get(ep.device)?.add(k);}
   const capacity=Number(l.speed)>0?Number(l.speed):0,offered=scenario.mode==='fixed'?fixed:capacity*load/100;
   const failed=l.enabled===false||down.has(l.id)||off.has(l.a.device)||off.has(l.b.device)||!devices.has(l.a.device)||!devices.has(l.b.device);
   const carried=failed?0:Math.min(capacity,offered),utilization=capacity?carried/capacity*100:0;
   return {id:l.id,capacity,offered,carried,unserved:Math.max(0,offered-carried),utilization,status:failed?'down':offered>capacity||utilization>=80?'warning':'up'};
  });
  for(const [id,keys] of used){knownUsed+=[...keys].filter(k=>ports.get(id).has(k)).length;unknownAssignments+=[...keys].filter(k=>!ports.get(id).has(k)).length;}
  const routerCapacity=project.devices.filter(d=>{const m=models.get(d.modelId);return m?.category==='router'||m?.topologyOnly;}).map(d=>{
   const capacity=licenseCapacity(d.modelId,matrix,scenario.license||'data'),incident=links.filter((_,i)=>project.links[i].a.device===d.id||project.links[i].b.device===d.id);
   const peakDemand=Math.max(0,...incident.map(l=>l.offered));return {id:d.id,capacity,peakDemand,warning:capacity!==null&&peakDemand>capacity};
  });
  const counts={devices:project.devices.length,routers:project.devices.filter(d=>models.get(d.modelId)?.category==='router'&&!models.get(d.modelId)?.topologyOnly).length,
   pe:project.devices.filter(d=>models.get(d.modelId)?.topologyOnly||models.get(d.modelId)?.deviceRole==='PE').length,
   switches:project.devices.filter(d=>models.get(d.modelId)?.category==='switch').length,links:links.length,active:links.filter(l=>l.status!=='down').length,down:links.filter(l=>l.status==='down').length,
   warnings:links.filter(l=>l.status==='warning').length,knownPorts,knownUsed,unknownDevices,unknownAssignments,interfaceUtilization:knownPorts?knownUsed/knownPorts*100:null,
   bottlenecks:links.filter(l=>l.offered>l.capacity).length+routerCapacity.filter(r=>r.warning).length};
  return {kind:'visual-simulation',links,routerCapacity,counts,scope:'Independent offered load per link; no routing, failover, packet loss or latency prediction.'};
 }
 // Stable BFS columns with disconnected components below. Each column fits the largest icon.
 function layout(project,catalog,selection=null){
  const models=new Map(catalog.map(m=>[m.id,m])),chosen=selection?.length?new Set(selection):null,items=project.devices.filter(d=>!chosen||chosen.has(d.id));
  const allowed=new Set(items.map(d=>d.id)),adj=new Map(items.map(d=>[d.id,new Set()]));
  for(const l of project.links)if(allowed.has(l.a.device)&&allowed.has(l.b.device)){adj.get(l.a.device).add(l.b.device);adj.get(l.b.device).add(l.a.device);}
  const seen=new Set(),result=[];let baseY=100;
  const rootOrder=[...items].sort((a,b)=>Number(!!models.get(b.modelId)?.topologyOnly)-Number(!!models.get(a.modelId)?.topologyOnly));
  for(const root of rootOrder){if(seen.has(root.id))continue;const queue=[[root.id,0]],columns=new Map();seen.add(root.id);
   for(let i=0;i<queue.length;i++){const [id,level]=queue[i];if(!columns.has(level))columns.set(level,[]);columns.get(level).push(items.find(d=>d.id===id));for(const next of adj.get(id))if(!seen.has(next)){seen.add(next);queue.push([next,level+1]);}}
   let x=100,height=0;for(const [,column] of columns){let y=baseY,maxWidth=0;for(const d of column){const m=models.get(d.modelId),w=d.width||m?.nodeWidth||244,h=d.height||m?.nodeHeight||88;result.push({id:d.id,x,y});y+=h+80;maxWidth=Math.max(maxWidth,w);}height=Math.max(height,y-baseY);x+=maxWidth+180;}baseY+=height+100;
  }return result;
 }
 return {mbps,licenseFields,licenseCapacity,calculate,layout};
})();
