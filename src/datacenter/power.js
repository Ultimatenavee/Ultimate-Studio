import '../../web/power-planning.js';
// Planning loads are distinct from PSU ratings, live telemetry and certified maxima.
export const powerBasisLabel=basis=>basis==='auto'?'Auto · ค่าที่มี':basis==='typical'?'Typical':'Maximum';
export const loadBasisLabel=row=>row.manual?'Manual'+(row.configured?' · '+powerBasisLabel(row.basisUsed):''):row.basisUsed==='load-test'?'Load test · 100% traffic':row.basisUsed==='passive'?'Passive':powerBasisLabel(row.basisUsed);
export function isPassivePower(item,model){return model?.power?.status==='passive'||['odf','patch','copper','manager','blank','reserved'].includes(item?.kind);}
export function deviceLoad(item,models,basis='max'){
 const model=models.find(m=>m.id===(item.model||item.modelId||item.accessoryId)),p=model?.power;
 if(isPassivePower(item,model))return {watts:0,known:true,basisUsed:'passive',model,p:p||{status:'passive',note:'Passive patch / จัดสาย ไม่ใช่โหลดไฟฟ้า'}};
 if(Number.isFinite(item.powerOverrideW)&&item.powerOverrideW>=0)return {watts:item.powerOverrideW,known:true,manual:true,basisUsed:'manual',model,p:{status:'manual',sourceTitle:'Manual · ผู้ใช้กรอก',configuration:'ค่าเฉพาะอุปกรณ์เครื่องนี้',note:item.powerOverrideNote||'ผู้ใช้กำหนดค่าเอง ไม่ใช่ค่าจาก Datasheet'}};
 if(basis==='auto'){
  if(item.powerConfiguration?.mode==='custom')return {...deviceLoad(item,models,item.powerConfiguration.basis),basisUsed:item.powerConfiguration.basis};
  for(const candidate of ['max','typical']){const result=deviceLoad(item,models,candidate);if(result.known)return result;}
  // Explicitly published whole-system traffic test; never present it as Typical/Maximum.
  const tested=p?.status==='verified'?p.loadTestsW?.traffic100Percent:undefined;
  if(!item.powerConfiguration&&Number.isFinite(tested)&&tested>=0)return {watts:tested,known:true,model,p,basisUsed:'load-test'};
  return deviceLoad(item,models,'max');
 }
 const configuration=globalThis.UTS_POWER_PLANNING.calculate(model,item.powerConfiguration,basis);if(configuration)return {model,...configuration,basisUsed:basis};
 if(['blank','reserved'].includes(item.kind))return {watts:0,known:true,basisUsed:'passive',model:null,p:{status:'passive',note:'พื้นที่จอง / แผงปิด ไม่ใช่โหลดไฟฟ้า'}};
 if(p?.status==='passive')return {watts:0,known:true,basisUsed:'passive',model,p};
 const watts=p?.status==='verified'?p[basis==='typical'?'typicalW':'maxW']:undefined;
 return {watts:Number.isFinite(watts)&&watts>=0?watts:0,known:Number.isFinite(watts)&&watts>=0,basisUsed:basis,model,p};
}
export function powerIssue(row,basis,models){
 if(row.known){if(row.manual&&row.watts===0&&row.model?.power?.status!=='passive')return {kind:'manual-zero',reason:'Manual 0 W กำลังแทนค่าจาก Datasheet',action:'ตรวจสอบค่า / ใช้ Datasheet'};return null;}
 const alternative=basis!=='auto'?deviceLoad(row.item,models,'auto'):null;
 if(alternative?.known)return {kind:'basis',reason:'มี '+loadBasisLabel(alternative)+' '+watts(alternative.watts)+' แต่ Rack เลือก '+powerBasisLabel(basis),action:'ตรวจสอบฐานคำนวณ'};
 if(row.item.powerConfiguration)return {kind:'configuration',reason:row.p?.note||'ชุดการ์ดยังมีข้อมูลไม่ครบ',action:'ตรวจชุดการ์ด / Base'};
 if(globalThis.UTS_POWER_PLANNING.references(row.model).length)return {kind:'reference',reason:'มีข้อมูลตามชุดอ้างอิง · ยังไม่ได้เลือกชุดที่ตรงกับเครื่อง',action:'เลือกชุดอ้างอิง'};
 return {kind:'missing',reason:'ยังไม่มีค่าการใช้ไฟของเครื่องนี้ที่นำมาคำนวณได้',action:'ระบุ Manual Power (W)'};
}
export function rackLoad(rack,models,preview=null){
 const basis=rack.powerBasis||'auto',current=rack.items.map(item=>({item,...deviceLoad(item,models,basis)}));
 const after=preview?[...current.filter(row=>row.item.id!==preview.id),{item:preview,...deviceLoad(preview,models,basis)}]:current;
 for(const row of after)row.issue=powerIssue(row,basis,models);
 const sum=rows=>rows.reduce((s,r)=>s+r.watts,0),unknown=after.filter(r=>!r.known).length,budget=Number.isFinite(rack.powerBudgetW)&&rack.powerBudgetW>0?rack.powerBudgetW:null,total=sum(after),complete=unknown===0;
 const typicalCount=after.filter(r=>r.known&&r.basisUsed==='typical').length,testCount=after.filter(r=>r.known&&r.basisUsed==='load-test').length;
 return {basis,typicalCount,testCount,manualCount:after.filter(r=>r.manual).length,currentW:sum(current),totalW:total,deltaW:total-sum(current),unknown,complete,budgetW:budget,ratio:budget?total/budget:null,headroomW:budget&&complete?budget-total:null,status:budget&&total>budget?'over':!complete?'incomplete':budget?'within':'unbudgeted',rows:after};
}
export const watts=v=>Math.abs(v)>=1000?(v/1000).toLocaleString('en-US',{maximumFractionDigits:2})+' kW':v.toLocaleString('en-US',{maximumFractionDigits:1})+' W';
