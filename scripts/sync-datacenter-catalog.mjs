import fs from 'node:fs/promises';
import vm from 'node:vm';
const context={window:{}};
for(const name of ['catalog','bayface-accessories','pe-interfaces'])vm.runInNewContext(await fs.readFile(`web/${name}.js`,'utf8'),context);
let audit={};try{audit=JSON.parse(await fs.readFile('research/datacenter-physical-audit.json','utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
const devices=context.window.NOAH_CATALOG.filter(d=>!d.generic).map(d=>({id:d.id,name:d.name,brand:d.brand,category:d.category,u:d.rackProfile?.occupiedU||1,images:d.physicalImages||{},rackProfile:d.rackProfile,source:d.rackProfile?.sourceUrl,sources:d.sources||[],ports:d.ports||[],interfacePreset:context.window.NOAH_PE_INTERFACES?.profiles[d.id]||null,powerModes:d.powerModes||[],powerSlots:d.powerSlots,summary:d.confirmedSummary||d.summary,specs:d.verifiedSpecs||{},originalSpecs:d.originalSpecs||{},physical:audit[d.id]||{status:'incomplete',note:'ยังไม่มีข้อมูลสามมิติครบทุกด้าน'},accessory:false}));
for(const d of context.window.NOAH_BAYFACE_ACCESSORIES)devices.push({id:d.id,name:d.name,brand:d.brand,category:d.kind,u:d.units,images:d.displayImage?{front:{src:d.displayImage,...d.displayDimensions,frame:d.displayFrame,status:'illustration'}}:{},source:d.sourceUrl,summary:d.useCase,specs:{Connector:d.connector,Input:d.input,Output:d.output},ports:[],physical:audit[d.id]||{status:'incomplete',note:'ภาพประกอบอุปกรณ์เสริม ยังไม่สอบเทียบสามมิติ'},accessory:true,kind:d.kind});
const faceAudits={};
for(const path of ['research/huawei-face-audit-v58.json','research/other-face-audit-v58.json']){try{const report=JSON.parse(await fs.readFile(path,'utf8'));Object.assign(faceAudits,report.models||report.items||{});}catch(e){if(e.code!=='ENOENT')throw e;}}
for(const d of devices){const a=faceAudits[d.id];if(!a)continue;const sources=[a.primarySource,...(a.evidence||[]).map(e=>e.url),...(a.existingPhysicalSources||[])].filter(u=>typeof u==='string'&&u.startsWith('https://'));d.faceAudit={checkedAt:'2026-10-15',missingFaces:a.missingFaces||[],status:a.status,sources:[...new Set(sources)]};}
// Source-backed face overlays affect 3D presentation only; interface/port catalogs stay untouched.
for(const path of ['research/cisco-face-assets-v59.json','research/huawei-face-assets-v59.json','research/accessory-face-assets-v59.json','research/face-overlays-v61.json']){
 try{const report=JSON.parse(await fs.readFile(path,'utf8')),overlays=report.items||report.models||report;for(const d of devices){const extra=overlays[d.id];if(!extra)continue;if(extra.images)d.images={...d.images,...extra.images};if(extra.interfaceSide)d.interfaceSide=extra.interfaceSide;if(extra.referenceConfiguration)d.referenceConfiguration=extra.referenceConfiguration;if(extra.interfaceImage)d.interfaceImage=extra.interfaceImage;d.faceAudit={...d.faceAudit,checkedAt:'2026-10-15',missingFaces:['front','rear'].filter(side=>!d.images[side]),sources:[...new Set([...(d.faceAudit?.sources||[]),...Object.values(extra.images||{}).map(i=>i.source),extra.interfaceImage?.source].filter(u=>typeof u==='string'&&u.startsWith('https://')))]};}}
 catch(e){if(e.code!=='ENOENT')throw e;}
}
const powerRecords={};
for(const path of ['research/power-cisco-v64.json','research/power-huawei-v64.json','research/power-other-v64.json','research/power-extra-v66.json']){try{const report=JSON.parse(await fs.readFile(path,'utf8'));Object.assign(powerRecords,report.items||report.models||report);}catch(e){if(e.code!=='ENOENT')throw e;}}
for(const d of devices)d.power=powerRecords[d.id]||{status:'unknown',note:'ยังไม่มีค่า Consumption ที่ยืนยันจาก Datasheet ของรุ่นนี้'};
const modular=JSON.parse(await fs.readFile('research/modular-power-v66.json','utf8'));
for(const d of devices){const m=modular.devices[d.id];if(!m||m.fixed)continue;
 const variants=m.slotVariants||[{supply:'chassis',serviceSlots:m.serviceSlots}];
 d.modularPower={slotProfiles:variants.map(v=>({id:v.supply.toLowerCase(),label:v.supply==='chassis'?'Chassis':v.supply+' chassis',slots:v.serviceSlots,sourceUrl:m.slotSourceUrl,note:'จำนวนสล็อตตามแหล่งอ้างอิง · ต้องเลือกการ์ดและ footprint ที่ตรงกับ chassis'})),cards:modular.componentEvidence.filter(c=>c.slotUnits&&c.compatibleModels?.includes(d.id)).map(c=>({id:c.model,label:c.model,typicalW:c.typicalW,...(c.maxW!==undefined?{maxW:c.maxW}:{}),slotUnits:c.slotUnits,sourceUrl:c.sourceUrl,note:(c.note||c.evidence)+' Compatible chassis: '+(c.compatibleChassis||[]).join(', ')})),references:(m.presets||[]).map(r=>({...r,note:(r.note||'')+' '+(m.note||'')+' BOM: '+(r.infrastructure||'')+' '+r.cards.map(c=>c.count+'×'+c.model).join(', ')})),note:'ยังไม่มี Base ของทุกชุดที่ยืนยันครบ · กรอก Base และค่าการ์ดที่ขาดเองเพื่อคำนวณแบบ Manual; ไม่หารค่า full chassis ตามจำนวนสล็อต'};
 if(m.airflow==='left-to-right')d.coolingDirection={direction:'left-to-right',sourceUrl:m.airflowSourceUrl,status:'vendor'};
}
const ciscoSlots=JSON.parse(await fs.readFile('research/cisco-slot-profiles-v66.json','utf8'));
for(const d of devices){const p=ciscoSlots.items[d.id];if(!p)continue;d.modularPower={slotProfiles:[{id:'chassis',label:'Chassis expansion',slots:p.slotProfiles.reduce((n,g)=>n+g.slots,0),groups:p.slotProfiles,sourceUrl:p.slotProfiles[0].sourceUrl,note:p.note}],cards:d.id==='huawei-s5720-36c-ei-28s-ac'?[{id:'ES5D21X02S01',label:'ES5D21X02S01',maxW:8,slotUnits:1,sourceUrl:p.slotProfiles[0].sourceUrl,note:p.note},{id:'ES5D21VST000',label:'ES5D21VST000',maxW:9,slotUnits:1,sourceUrl:p.slotProfiles[0].sourceUrl,note:p.note}]:[],references:[],note:'จำนวนสล็อตแบ่งตามกลุ่ม ไม่อนุมานการใช้ไฟจาก PSU · กรอก Base และค่าการ์ดเองตามรุ่นจริงเพื่อคำนวณแบบ Manual'};}
await fs.writeFile('web/power-profiles.js','globalThis.UTS_POWER_PROFILES='+JSON.stringify(Object.fromEntries(devices.map(d=>[d.id,{power:d.power,...(d.modularPower?{modularPower:d.modularPower}:{})}])) )+';\n');
await fs.writeFile('src/datacenter/devices.json',JSON.stringify(devices,null,2)+'\n');
console.log(`Synced ${devices.length} catalog devices/accessories without modifying interface or license data.`);

// Museum SKU research is independent from the connection editor's OPTICS compatibility table.
const optics=JSON.parse(await fs.readFile('src/datacenter/optics-catalog.json','utf8'));
if(new Set(optics.map(o=>o.id)).size!==optics.length)throw Error('Duplicate museum optic SKU');
for(const o of optics)if(!o.source||!o.geometry?.source||!o.physical?.dimensionsMm)throw Error('Missing optical evidence: '+o.id);
await fs.writeFile('src/datacenter/museum-optics.json',JSON.stringify(optics,null,2)+'\n');
