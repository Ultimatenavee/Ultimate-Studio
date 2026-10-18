// Illustrative airflow paths, not CFD or measured temperature. Known device direction wins.
export function rackAirflowPaths(rack,models){
 const active=rack.items.filter(i=>{const m=models.find(m=>m.id===i.model);return m?!m.accessory:['gpu','server','storage','fabric'].includes(i.kind)});if(!active.length)return [];
 const samples=[...new Set([active[0],active[Math.floor(active.length/2)],active.at(-1)])];
 return samples.flatMap(item=>{const m=models.find(m=>m.id===item.model),y=.19+(item.u-1+item.size/2)*.04445,side=m?.coolingDirection?.direction==='left-to-right';return [-.16,.16].map(raw=>{const offset=side?Math.sign(raw)*Math.min(.16,item.size*.04445*.3):raw;return ({rackId:rack.id,itemId:item.id,direction:side?'left-to-right':'rack-front-to-rear-illustration',verified:side&&m.coolingDirection.status==='vendor',points:side?[[-.72,y+offset,.24],[-.42,y+offset,.24],[0,y+offset,.24],[.42,y+offset,.24],[.72,y+offset+.12,.24]]:[[offset,y,1.12],[offset,y,.65],[offset,y,0],[offset,y,-.65],[offset,y+.18,-1.05]]});});});
}
