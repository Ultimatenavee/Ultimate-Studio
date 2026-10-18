import {rackLoad,watts,powerBasisLabel,loadBasisLabel} from './power.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const wrap=(value,size=34)=>{
 const input=String(value||'—'),words=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('th',{granularity:'word'}).segment(input)].map(x=>x.segment):Array.from(input),out=[];let line='';
 for(const word of words){const parts=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('th',{granularity:'grapheme'}).segment(word)].map(x=>x.segment):Array.from(word);if(line&&Array.from(line).length+parts.length>size){out.push(line.trim());line='';}while(parts.length>size){out.push(parts.splice(0,size).join(''));}line+=parts.join('');}if(line.trim())out.push(line.trim());return out.length?out:['—'];
};
const text=(value,x,y,size=16,color='#25384b')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${esc(value)}</text>`;
const lines=(values,x,y,size=15)=>values.map((v,i)=>text(v,x,y+i*21,size)).join('');
export function composeReportPages(project,models,artworks=[],date=new Date().toISOString()){
 const pages=[];const add=(body,w=842,h=1190)=>pages.push({width:w,height:h,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fff"/><g font-family="Noto Sans Thai,Tahoma,Arial,sans-serif"><rect width="100%" height="10" fill="#16a9b9"/>${body}${text('Ultimate Topology studio · Planning report · '+date.slice(0,10),32,h-22,12)}${text(String(pages.length+1),w-45,h-22,12)}</g></svg>`});
 for(const rack of project.racks){
  const items=project.items.filter(i=>i.rackId===rack.id),report=rackLoad({...rack,items:items.map(i=>({...i,model:i.modelId||i.accessoryId}))},models),art=artworks.find(a=>a.rackId===rack.id),heading=wrap(project.title||'Bayface',65);
  const power=`${report.complete?'รวม':'รวมเฉพาะที่มีข้อมูล'} ${watts(report.totalW)} · ${powerBasisLabel(report.basis)}${report.basis==='auto'?' (Typical '+report.typicalCount+' / Load test '+report.testCount+')':''} · Manual ${report.manualCount} เครื่อง · ไม่ทราบค่า ${report.unknown} เครื่อง`;
  let meta=lines(wrap(project.title||'Bayface',45),32,60,24);let my=150;
  for(const [label,value]of [['Rack',rack.name],['ห้อง',rack.room||'—'],['Site / Phase',rack.phase||'—'],['จำนวน U',rack.units],['Power',power],['IT Power budget',report.budgetW?watts(report.budgetW):'ยังไม่กำหนด']]){meta+=text(label,32,my,16,'#537183');my+=27;const v=wrap(value,65);meta+=lines(v,32,my,18);my+=v.length*21+27;}
  meta+=lines(wrap((report.basis==='auto'?'Auto ใช้ค่าต่างฐานตามที่มี ไม่ใช่ Maximum ที่ยืนยันครบ · ':'')+'โหลดเพื่อวางแผน ไม่ใช่ค่าที่วัดสด · Manual แทน Datasheet เฉพาะเครื่องนั้น · Power ที่ไม่ทราบค่าไม่ถูกนับเป็น 0 W ในยอดรวมที่ยืนยันได้ · ไม่รวมการใช้ไฟระบบ Cooling และ Facility',65),32,my+10,15);add(meta);
  let body=lines(heading,32,45,22)+lines(wrap(rack.name+' · '+rack.units+'U',75),32,110,22)+lines(wrap(power,110),32,184,15)+text('รายละเอียดห้อง / Site / งบไฟ อยู่ในหน้าข้อมูล Rack',32,212,14);
  body+=text('STUDIO · Bayface 2D',60,238,17)+text('3D · Rack perspective',625,238,17);
  if(art)body+=`<image href="${esc(art.studio)}" x="32" y="252" width="550" height="510" preserveAspectRatio="xMidYMid meet"/><image href="${esc(art.three)}" x="608" y="252" width="550" height="510" preserveAspectRatio="xMidYMid meet"/>`;
  body+=text('ค่าไฟเป็นข้อมูลเพื่อวางแผน ไม่ใช่ค่าที่วัดสด · Manual คือค่าที่ผู้ใช้ระบุเฉพาะเครื่อง',32,793,14);add(body,1190,842);
  let table='',y=218;const header=()=>lines(wrap(rack.name,48),32,44,20)+text('รายการอุปกรณ์ราย U · '+rack.units+'U',32,92,16)+text(power,32,120,14)+text('ค่าไฟของอุปกรณ์หลาย U แสดงครั้งเดียวที่ U เริ่มต้นล่างสุด',32,148,14)+`<rect x="28" y="166" width="786" height="34" fill="#e8f2f5"/>`+text('U',36,189)+text('อุปกรณ์ / รุ่น',102,189)+text('Serial number',454,189)+text('Power / ที่มา',636,189);
  const flush=()=>{add(header()+table);table='';y=218;};
  for(let u=rack.units;u>=1;u--){const item=items.find(i=>i.u<=u&&i.u+i.height>u),row=report.rows.find(r=>r.item.id===item?.id),continued=item&&u!==item.u,model=row?.model;
   const names=item?[...wrap(item.label||model?.name||item.kind,27),...wrap(model?.name||item.modelId||item.accessoryId||item.kind,27),...(row?.configured&&row.description?wrap('Config: '+row.description,27):[]),...(continued?['ส่วนเดียวกับ U'+item.u]:[])]:['ว่าง'];
   const serial=item?wrap(item.serialNumber||'—',16):['—'];
   const pw=!item?['—']:continued?['รวมที่ U'+item.u]:!row.known?['ยังไม่มีข้อมูล']: [watts(row.watts),loadBasisLabel(row),...(row.manual&&item.powerOverrideNote?wrap(item.powerOverrideNote,16):[])];
   const h=Math.max(names.length,serial.length,pw.length)*21+16;if(y+h>1130)flush();
   table+=`<rect x="28" y="${y-18}" width="786" height="${h}" fill="${u%2?'#f3f6f8':'#fff'}"/>`+text(u,36,y)+lines(names,102,y)+lines(serial,454,y)+lines(pw,636,y);y+=h;
  }
  flush();
 }
 return pages;
}
let fontPromise,pdfPromise;
const dataURL=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
async function fileData(url){const response=await fetch(url);if(!response.ok)throw Error('โหลดไฟล์รายงานไม่สำเร็จ: '+url);return dataURL(await response.blob());}
function pdfLibrary(){return pdfPromise||(pdfPromise=new Promise((resolve,reject)=>{if(window.PDFLib)return resolve(window.PDFLib);const s=document.createElement('script');s.src='vendor/pdf-lib.min.js';s.onload=()=>resolve(window.PDFLib);s.onerror=()=>{pdfPromise=null;reject(Error('โหลด PDF library ไม่สำเร็จ'))};document.head.append(s)}));}
async function raster(svg,width,height,font,scale=2){
 const source=svg.replace(/(<svg\b[^>]*>)/,`$1<defs><style>@font-face{font-family:'Noto Sans Thai';src:url('${font}') format('truetype');}</style></defs>`),url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml;charset=utf-8'}));
 try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('สร้างภาพรายงานไม่สำเร็จ'));img.src=url});const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png');}finally{URL.revokeObjectURL(url)}
}
export async function exportBayfaceReport(input){
 const project=structuredClone(input);if(!project.racks.length)throw Error('เพิ่ม Rack ก่อน Export PDF');
 const [{default:models},{createViewerScene},PDFLib,font]=await Promise.all([import('./devices.json',{with:{type:'json'}}),import('./viewer-scene.js'),pdfLibrary(),fontPromise||(fontPromise=fileData('fonts/NotoSansThai.ttf').catch(e=>{fontPromise=null;throw e}))]);
 const artworks=[];window.NOAH_APP?.toast('กำลังสร้าง PDF: ภาพ Studio / 3D และรายการราย U');
 for(const rack of project.racks){
  const studio=await window.NOAH_BAYFACE.svg(fileData,{rackId:rack.id,details:false,project}),studioImage=await raster(studio.svg,studio.width,studio.height,font,Math.min(2,4000/Math.max(studio.width,studio.height)));
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:700px;height:950px;pointer-events:none';document.body.append(host);let viewer;
  try{viewer=createViewerScene(host,{rack:true,units:rack.units,items:project.items.filter(i=>i.rackId===rack.id),models});const three=await viewer.capture();artworks.push({rackId:rack.id,studio:studioImage,three});}catch(e){throw Error('สร้างภาพ Rack 3D ไม่สำเร็จ: '+e.message)}finally{viewer?.dispose();host.remove()}
 }
 const pages=composeReportPages(project,models,artworks),pdf=await PDFLib.PDFDocument.create();pdf.setTitle(project.title||'Bayface report');pdf.setCreator('Ultimate Topology studio');
 for(const page of pages){const png=await raster(page.svg,page.width,page.height,font),image=await pdf.embedPng(png),size=page.width>page.height?[841.89,595.28]:[595.28,841.89],p=pdf.addPage(size);p.drawImage(image,{x:0,y:0,width:size[0],height:size[1]});}
 const url=URL.createObjectURL(new Blob([await pdf.save()],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download=(project.title||'Bayface').replace(/[^\p{L}\p{N}_-]+/gu,'-')+'-report.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);window.NOAH_APP?.toast('Export PDF สำเร็จ · '+pages.length+' หน้า');
}
