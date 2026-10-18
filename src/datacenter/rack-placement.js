import '../../web/power-planning.js';
// Shared deterministic placement math. No rendering or network side effects.
export const clone=v=>JSON.parse(JSON.stringify(v));
export function freeSlot(rack,height,preferred=1,exclude=''){
 if(!Number.isInteger(height)||height<1||height>(rack.units||42))return null;
 const slots=[];
 for(let u=1;u<= (rack.units||42)-height+1;u++)if(!rack.items.some(i=>i.id!==exclude&&u<i.u+i.size&&u+height>i.u))slots.push(u);
 return slots.sort((a,b)=>Math.abs(a-preferred)-Math.abs(b-preferred)||a-b)[0]??null;
}
export function validateRacks(racks,known){
 if(!Array.isArray(racks)||racks.length>24)throw Error('รองรับสูงสุด 24 Rack ในห้องนี้');
 const ids=new Set();
 const text=(v,max)=>v===undefined||(typeof v==='string'&&v.length<=max);
 for(const r of racks){if(r.powerBudgetW!==undefined&&r.powerBudgetW!==null&&(!Number.isFinite(r.powerBudgetW)||r.powerBudgetW<=0||r.powerBudgetW>1e7))throw Error('งบไฟ Rack ต้องมากกว่า 0 และไม่เกิน 10000 kW');if(r.powerBasis!==undefined&&!['auto','max','typical'].includes(r.powerBasis))throw Error('Power basis ไม่ถูกต้อง');if(!text(r.room,150))throw Error('ชื่อห้องต้องไม่เกิน 150 ตัวอักษร');for(const i of r.items||[]){globalThis.UTS_POWER_PLANNING.validate(i.powerConfiguration);if(i.powerOverrideW!==undefined&&i.powerOverrideW!==null&&(!Number.isFinite(i.powerOverrideW)||i.powerOverrideW<0||i.powerOverrideW>1e7))throw Error('Manual Power ต้องเป็น 0–10000000 W');if(!text(i.powerOverrideNote,300))throw Error('หมายเหตุ Power ต้องไม่เกิน 300 ตัวอักษร');}for(const i of r.items||[])if(!text(i.serialNumber,150))throw Error('Serial number ต้องไม่เกิน 150 ตัวอักษร');}
 for(const r of racks){if(!r.id||typeof r.name!=='string'||r.name.length>80||!Number.isFinite(r.x)||!Number.isFinite(r.z)||!Number.isFinite(r.rotation)||ids.has(r.id)||!Number.isInteger(r.units||42)||(r.units||42)<1||(r.units||42)>60||!Array.isArray(r.items))throw Error('ข้อมูล Rack ไม่ถูกต้อง');ids.add(r.id);const slots=new Set();
 for(const i of r.items){if(!i.id||ids.has(i.id)||!Number.isInteger(i.u)||!Number.isInteger(i.size)||i.size<1||i.u<1||i.u+i.size-1>(r.units||42)||typeof i.name!=='string'||i.name.length>150)throw Error('ตำแหน่งหรือชื่ออุปกรณ์ไม่ถูกต้อง');ids.add(i.id);if(i.model&&known&&!known.has(i.model))throw Error('ไม่พบรุ่นใน Library');for(let u=i.u;u<i.u+i.size;u++){if(slots.has(u))throw Error('ตำแหน่ง U ซ้อนกัน');slots.add(u)}}}
 return clone(racks);
}
export function fromBayface(data,models){
 const xs=[-4,-2.4,-.8,.8,2.4,4],zs=[-6,-2.4,2.4,6];
 return data.racks.map((r,index)=>({...r,x:xs[index%6],z:zs[Math.floor(index/6)],rotation:Math.floor(index/6)%2?Math.PI:0,zone:'project',note:'ข้อมูล Rack จาก Bayface ของ Project นี้',items:data.items.filter(i=>i.rackId===r.id).map(i=>({id:i.id,name:i.label,...(i.powerConfiguration!==undefined?{powerConfiguration:globalThis.UTS_POWER_PLANNING.validate(i.powerConfiguration)}:{}),...(i.powerOverrideW!==undefined?{powerOverrideW:i.powerOverrideW,powerOverrideNote:i.powerOverrideNote||''}:{}),...(i.serialNumber!==undefined?{serialNumber:i.serialNumber}:{}),u:i.u,size:i.height,model:i.modelId||i.accessoryId||undefined,kind:i.kind,original:clone(i)}))}));
}
export function toBayface(racks,title,models){return {title,racks:racks.map(r=>({id:r.id,name:r.name,...(r.room!==undefined?{room:r.room}:{}),...(r.powerBudgetW!==undefined?{powerBudgetW:r.powerBudgetW}:{}),...(r.powerBasis!==undefined?{powerBasis:r.powerBasis}:{}),phase:r.phase||'',units:r.units||42,...(r.originalX!==undefined?{x:r.originalX}:{})})),items:racks.flatMap(r=>r.items.map(i=>{const m=models.find(m=>m.id===i.model);return {...(i.original||{}),id:i.id,rackId:r.id,u:i.u,height:i.size,kind:m?(m.accessory?m.kind:'device'):(i.original?.kind||'reserved'),modelId:m&&!m.accessory?m.id:!m&&i.original?.kind==='device'?i.original.modelId:'',...(m?.accessory?{accessoryId:m.id}:{}),label:i.name,...(i.powerConfiguration!==undefined?{powerConfiguration:globalThis.UTS_POWER_PLANNING.validate(i.powerConfiguration)}:{}),...(i.powerOverrideW!==undefined?{powerOverrideW:i.powerOverrideW,powerOverrideNote:i.powerOverrideNote||''}:{}),...(i.serialNumber!==undefined?{serialNumber:i.serialNumber}:{}),notes:i.original?.notes||'',color:i.original?.color||'#202831'};}))};}

// Direct manipulation stays in its original rack and never silently jumps to another slot.
export function moveTarget(racks,origin,hit){const rack=racks[origin?.rack],item=rack?.items.find(i=>i.id===origin.itemId);if(!item||!hit||hit.rack!==origin.rack)return {valid:false,item};const u=hit.u;return {valid:Number.isInteger(u)&&freeSlot(rack,item.size,u,item.id)===u,item,rack:origin.rack,u};}
