'use strict';
(() => {
 const kinds=['device','reserved','blank','patch','power','odf','dwdm'];
 function slotMap(profile,item={}) {
  const result=[];
  if(profile.slotLayout==='M12'){
   for(let col=0;col<12;col++)result.push({slot:col+1,col,row:0,rows:2});
   if(item.slotMode==='control')result.push({slot:72,col:12,row:0,rows:1},{slot:71,col:12,row:1,rows:1});
   else result.push({slot:13,col:12,row:0,rows:2});
  }else{
   for(let n=1;n<=12;n++){
    const col=n<=6?n-1:n+1;
    const full=item.cards?.some(c=>c.slot===n&&c.full===true);
    if(!full)result.push({slot:n+12,col,row:0,rows:1});
    result.push({slot:n,col,row:full?0:1,rows:full?2:1});
   }
   result.push({slot:71,col:6,row:0,rows:2},{slot:72,col:7,row:0,rows:2});
  }
  return result;
 }
 function boardRule(name){
  const code=name.trim().toUpperCase().replace(/^TN/,'');
  if(code==='S2N504')return {full:true,slots:[1,2,3,4,5,8,9,10,11,12]};
  if(code==='G3CXCS')return {full:true,slots:[6,7]};
  if(code==='G4CXP')return {full:false,slots:[71,72]};
 }
 function chassisFields(item,profile) {
  if(item.kind!=='dwdm')return {};
  if(!profile?.slotLayout||item.height!==profile.units)throw Error('ตรวจรุ่น Chassis และจำนวน U');
  const slotMode=item.slotMode??'service',cards=item.cards??[],subrackId=item.subrackId??'';
  if(!['service','control'].includes(slotMode)||(profile.slotLayout==='M24'&&slotMode!=='service')||typeof subrackId!=='string'||subrackId.length>32||!Array.isArray(cards)||cards.length>26)throw Error('ข้อมูล Subrack ไม่ถูกต้อง');
  const occupied=new Set(),clean=[];
  for(const c of cards){
   if(!c||!Number.isInteger(c.slot)||typeof c.board!=='string'||!c.board.trim()||c.board.length>64||occupied.has(c.slot)||(c.full!==undefined&&typeof c.full!=='boolean'))throw Error('ตรวจ Slot และชื่อการ์ด');
   if(c.full&&(profile.slotLayout!=='M24'||c.slot<1||c.slot>12))throw Error('การ์ดเต็มความสูงต้องเริ่มที่ IU1–IU12 ของ M24');
   const rule=boardRule(c.board);
   if(rule&&(profile.slotLayout!=='M24'||!rule.slots.includes(c.slot)))throw Error(c.board+' ใช้กับ M24 ในช่อง IU '+rule.slots.join(', '));
   occupied.add(c.slot);
   clean.push({slot:c.slot,board:c.board.trim(),...((rule?.full??c.full)?{full:true}:{})});
  }
  const valid=new Set(slotMap(profile,{slotMode,cards:clean}).map(s=>s.slot));
  if(clean.some(c=>!valid.has(c.slot)))throw Error('การ์ดใช้ช่องซ้อนกัน หรือช่องนี้ใช้ไม่ได้ในผังที่เลือก');
  return {slotMode,subrackId,cards:clean.sort((a,b)=>a.slot-b.slot)};
 }
 function validate(data,known){
  const fail=message=>{throw new Error(message||'ข้อมูล Bayface ไม่ถูกต้อง');},id=v=>typeof v==='string'&&/^[\w-]{1,64}$/.test(v),str=(v,max)=>typeof v==='string'&&v.length<=max;
  if(!data||!str(data.title,150)||!Array.isArray(data.racks)||data.racks.length>20||!Array.isArray(data.items)||data.items.length>400)fail();const ids=new Set(),racks=new Map();
  const unique=v=>{if(!id(v)||ids.has(v))fail();ids.add(v);};
  const out={title:data.title,racks:[],items:[]};
  for(const r of data.racks){unique(r.id);if(r.powerBudgetW!==undefined&&r.powerBudgetW!==null&&(!Number.isFinite(r.powerBudgetW)||r.powerBudgetW<=0||r.powerBudgetW>1e7))fail('งบไฟ Rack ไม่ถูกต้อง');if(r.powerBasis!==undefined&&!['auto','max','typical'].includes(r.powerBasis))fail('Power basis ไม่ถูกต้อง');if(!str(r.name,80)||!r.name.trim()||!str(r.phase||'',80)||!str(r.room||'',150)||!Number.isInteger(r.units)||r.units<1||r.units>60)fail('ตู้ Rack ต้องมี 1–60 U และชื่อไม่เกิน 80 ตัวอักษร');if(r.x!==undefined&&(!Number.isFinite(r.x)||r.x<0||r.x>100000))fail('ตำแหน่ง Rack ไม่ถูกต้อง');racks.set(r.id,r);out.racks.push({id:r.id,name:r.name,room:r.room||'',...(r.powerBudgetW!==undefined?{powerBudgetW:r.powerBudgetW}:{}),...(r.powerBasis!==undefined?{powerBasis:r.powerBasis}:{}),phase:r.phase||'',units:r.units,...(r.x!==undefined?{x:r.x}:{})});}
  const app=typeof window==='undefined'?globalThis:window;
  const accessories=new Map([...(app.NOAH_BAYFACE_ACCESSORIES||[]),...(app.NOAH_DWDM_CHASSIS||[])].map(a=>[a.id,a]));
  const occupied=new Set();for(const item of data.items){unique(item.id);if(item.powerConfiguration!=null){if(!globalThis.UTS_POWER_PLANNING)fail('โหลด Power configuration validator ไม่สำเร็จ');globalThis.UTS_POWER_PLANNING.validate(item.powerConfiguration);}if(item.powerOverrideW!==undefined&&item.powerOverrideW!==null&&(!Number.isFinite(item.powerOverrideW)||item.powerOverrideW<0||item.powerOverrideW>1e7))fail('Manual Power ต้องเป็น 0–10000000 W');if(!str(item.powerOverrideNote||'',300))fail('หมายเหตุ Power ยาวเกินไป');const r=racks.get(item.rackId);if(!r||!kinds.includes(item.kind)||!Number.isInteger(item.u)||!Number.isInteger(item.height)||item.u<1||item.height<1||item.u+item.height-1>r.units||!str(item.label,150)||!str(item.notes||'',1000)||!str(item.serialNumber||'',150)||!/^#[\da-f]{6}$/i.test(item.color))fail('อุปกรณ์ต้องอยู่ในช่วง U ของตู้และมีขนาดถูกต้อง');if(item.kind==='device'&&(!str(item.modelId,100)||!known.has(item.modelId)))fail('รุ่นอุปกรณ์ Bayface ไม่อยู่ใน Library');if(item.accessoryId!==undefined&&(!str(item.accessoryId,100)||!accessories.has(item.accessoryId)||accessories.get(item.accessoryId).kind!==item.kind))fail('รุ่น ODF / Power ไม่อยู่ใน Library หรือประเภทไม่ตรงกัน');if(item.kind==='odf'&&!item.accessoryId)fail('เลือก ODF จาก Library ก่อน');for(let u=item.u;u<item.u+item.height;u++){const key=r.id+':'+u;if(occupied.has(key))fail('ตำแหน่ง U ซ้อนกับอุปกรณ์หรือพื้นที่จองเดิม');occupied.add(key);}out.items.push({...chassisFields(item,accessories.get(item.accessoryId)),id:item.id,rackId:item.rackId,u:item.u,height:item.height,kind:item.kind,modelId:item.kind==='device'?item.modelId:'',label:item.label,...(item.powerConfiguration!==undefined?{powerConfiguration:globalThis.UTS_POWER_PLANNING?.validate(item.powerConfiguration)??null}:{}),...(item.powerOverrideW!==undefined?{powerOverrideW:item.powerOverrideW,powerOverrideNote:item.powerOverrideNote||''}:{}),serialNumber:item.serialNumber||'',notes:item.notes||'',color:item.color,...(item.accessoryId?{accessoryId:item.accessoryId}:{})});}
  return out;
 }
 function findSlot(data,rackId,height,preferred=1,excludeId=''){
  const r=data.racks.find(r=>r.id===rackId);if(!r||!Number.isInteger(height)||height<1||height>r.units)return null;
  const blocked=data.items.filter(i=>i.rackId===rackId&&i.id!==excludeId),slots=[];
  for(let u=1;u<=r.units-height+1;u++)if(!blocked.some(i=>u<i.u+i.height&&u+height>i.u))slots.push(u);
  return slots.sort((a,b)=>Math.abs(a-preferred)-Math.abs(b-preferred)||a-b)[0]??null;
 }
 const fits=(data,item)=>{try{validate({...data,items:[...data.items.filter(x=>x.id!==item.id),item]},new Set([...data.items.map(x=>x.modelId),item.modelId]));return true;}catch{return false;}};
 (typeof window==='undefined'?globalThis:window).NOAH_BAYFACE_MODEL={validate,fits,findSlot,kinds,slotMap,boardRule};
})();
