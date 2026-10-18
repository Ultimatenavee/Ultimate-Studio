import {rackLoad,watts,loadBasisLabel,powerBasisLabel} from './power.js';
// A read-only snapshot; exactly the same planning calculation as the rack power bar.
export function powerReportData(project,models){
 return (project?.racks||[]).map(rack=>({rack,report:rackLoad({...rack,items:(project.items||[]).filter(i=>i.rackId===rack.id).map(i=>({...i,model:i.modelId||i.accessoryId,name:i.label,size:i.height}))},models)}));
}
function wrap(value,limit){const out=[];for(const line of String(value??'—').split('\n')){const chars=Array.from(line);if(!chars.length)out.push('');while(chars.length)out.push(chars.splice(0,limit).join(''));}return out;}
export function appendPowerSlides(pptx,project,models,{template}={}){
 const racks=powerReportData(project,models);if(!racks.length)return 0;
 const before=pptx._slides?.length||0;
 const ink='173348',muted='4B6476';
 const text=(slide,value,x,y,w,h,extra={})=>slide.addText(String(value),{x,y,w,h,fontFace:'Tahoma',fontSize:12,color:ink,margin:0,breakLine:false,valign:'mid',fit:'shrink',...extra});
 const base=(title,note)=>{const slide=pptx.addSlide();slide.background={color:'FFFFFF'};template?.decorate(pptx,slide);text(slide,title,.45,.28,9.8,.5,{fontSize:23,bold:true});text(slide,note,.45,.9,9.9,.35,{fontSize:11,color:muted});text(slide,'Planning consumption · ไม่ใช่ Telemetry · ไม่รวม Cooling / Facility · ค่าไม่ทราบไม่ถือเป็น 0 W',.45,6.88,12.3,.26,{fontSize:10,color:muted});return slide;};
 function cards(slide,report){const values=[['Rack power limit',report.budgetW===null?'ยังไม่กำหนด':watts(report.budgetW)],['โหลด'+(report.complete?'รวม':'ที่ทราบค่า'),watts(report.totalW)+(report.unknown?' · ไม่ทราบ '+report.unknown+' เครื่อง':'')],['คงเหลือ / เกิน Limit',report.budgetW===null?'ยังไม่กำหนด Limit':report.headroomW===null?'ยังสรุปไม่ได้ · ข้อมูลไม่ครบ':report.headroomW<0?'เกิน '+watts(-report.headroomW):watts(report.headroomW)]];
  values.forEach(([label,value],i)=>{const x=.45+i*4.17;slide.addShape(pptx.ShapeType.rect,{x,y:1.43,w:4.02,h:.8,fill:{color:i===2&&report.status==='over'?'FFF0E9':'EEF5F8'},line:{transparency:100}});text(slide,label,x+.12,1.5,3.78,.2,{fontSize:10,color:muted});text(slide,value,x+.12,1.77,3.78,.32,{fontSize:16,bold:true});});
 }
 function tableHeader(slide,columns,y=2.5){slide.addShape(pptx.ShapeType.rect,{x:.45,y,w:12.4,h:.34,fill:{color:'DAE9F0'},line:{transparency:100}});for(const c of columns)text(slide,c.title,c.x+.07,y+.03,c.w-.14,.27,{fontSize:11,bold:true});return y+.39;}
 const columns=[{title:'ตำแหน่ง U',x:.45,w:1},{title:'อุปกรณ์ / รุ่น / ชุดการ์ด',x:1.45,w:4.7},{title:'Serial number',x:6.15,w:2.15},{title:'Power',x:8.3,w:1.4},{title:'ฐานคำนวณ',x:9.7,w:3.15}];
 for(const {rack,report}of racks){let slide,y,page=0;const next=()=>{slide=base('Power consumption · '+rack.name+(page?' · ต่อ '+(page+1):''),(project.title||'Bayface')+' · ห้อง '+(rack.room||'ยังไม่ระบุ')+' · '+(rack.units||42)+'U · '+powerBasisLabel(report.basis));page++;cards(slide,report);y=tableHeader(slide,columns);};next();
  const rows=[...report.rows].sort((a,b)=>b.item.u-a.item.u);
  if(!rows.length)text(slide,'Rack ว่าง · ยังไม่มีอุปกรณ์',.55,y,11.8,.5);
  for(const [index,row]of rows.entries()){const item=row.item,device=[item.name||row.model?.name||item.kind,row.model?.name||item.modelId||item.accessoryId||'',...(row.configured&&row.description?['Config: '+row.description]:[])].filter(Boolean).join('\n');
   const cells=[['U'+item.u+'–U'+(item.u+item.size-1)],wrap(device,42),wrap(item.serialNumber||'—',19),[row.known?watts(row.watts):'ไม่ทราบ'],wrap(row.known?loadBasisLabel(row):'ไม่รวมในยอด · '+(row.issue?.reason||'ไม่มีข้อมูล'),28)];const h=Math.max(.48,Math.max(...cells.map(c=>c.length))*.175+.13);if(y+h>6.65)next();
   slide.addShape(pptx.ShapeType.rect,{x:.45,y,w:12.4,h,fill:{color:index%2?'FFFFFF':'F3F7F9'},line:{transparency:100}});cells.forEach((c,i)=>text(slide,c.join('\n'),columns[i].x+.07,y+.045,columns[i].w-.14,h-.08,{fontSize:11,valign:'top',color:i===3&&!row.known?'A44825':ink}));y+=h+.025;
  }
 }
 // The report ends with the budget of every rack, after all per-device details.
 const summaryColumns=[{title:'Rack / ห้อง',x:.45,w:4.5},{title:'Power limit',x:4.95,w:2.1},{title:'ใช้แล้ว',x:7.05,w:2.35},{title:'เหลือ / เกิน / ข้อมูลไม่ครบ',x:9.4,w:3.45}];let summary,sy;
 const newSummary=()=>{summary=base('Rack power summary',project.title||'Bayface');sy=tableHeader(summary,summaryColumns,1.55);};newSummary();
 for(const [index,{rack,report}]of racks.entries()){const names=wrap(rack.name+'\nห้อง: '+(rack.room||'—'),40),h=Math.max(.65,names.length*.175+.15);if(sy+h>6.6)newSummary();summary.addShape(pptx.ShapeType.rect,{x:.45,y:sy,w:12.4,h,fill:{color:index%2?'FFFFFF':'F3F7F9'},line:{transparency:100}});const values=[names.join('\n'),report.budgetW===null?'ไม่ระบุ':watts(report.budgetW),watts(report.totalW)+(report.complete?'':'\nเฉพาะที่ทราบค่า'),report.budgetW===null?'ยังไม่กำหนด Limit':report.headroomW===null?'ยังสรุปไม่ได้\nไม่ทราบ '+report.unknown+' เครื่อง':report.headroomW<0?'เกิน '+watts(-report.headroomW):'เหลือ '+watts(report.headroomW)];values.forEach((value,i)=>text(summary,value,summaryColumns[i].x+.07,sy+.07,summaryColumns[i].w-.14,h-.12,{fontSize:12,bold:i===3,color:i===3&&report.status==='over'?'B6421B':ink}));sy+=h+.05;}
 return (pptx._slides?.length||before)-before;
}
