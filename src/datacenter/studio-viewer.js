import {importRackIntoStudio} from './rack-import.js';
window.NOAH_BAYFACE_REPORT={powerSlides:async(pptx,project,options)=>{const [{appendPowerSlides},{default:models}]=await Promise.all([import('./ppt-power-report.js'),import('./devices.json',{with:{type:'json'}})]);return appendPowerSlides(pptx,project,models,options);},export:async project=>(await import('./bayface-report.js')).exportBayfaceReport(project)};
import {openDeviceViewer} from './viewer-ui.js';
const A=window.NOAH_APP;
function openSimulator(){
 if(!A)return;
 window.NOAH_EDITOR?.saveLocal();
 const dialog=document.createElement('dialog');dialog.className='dv-dialog dv-simulator';dialog.setAttribute('aria-label','Datacenter Simulator');
 const close=document.createElement('button');close.textContent='กลับเข้า Bayface ✕';close.className='dv-simulator-close';
 const frame=document.createElement('iframe');frame.src='./?workspace=bayface';frame.title='Datacenter Simulator';frame.allow='fullscreen';dialog.append(close,frame);document.body.append(dialog);
 let revision=0,closed=false;const projectId=A.getProject().id;
 const current=()=>A.getProject().bayface||{title:'Data Center Bayface',racks:[],items:[]};
 const send=()=>frame.contentWindow.postMessage({type:'uts-dc-project',revision,data:current()},location.origin);
 function receive(e){if(closed||e.origin!==location.origin||e.source!==frame.contentWindow)return;
  if(e.data?.type==='uts-dc-ready')send();
  if(e.data?.type==='uts-museum-add-topology'&&A.getProject().id===projectId){try{const id=e.data.modelId;if(id&&!A.getCatalog().some(m=>m.id===id))throw Error('รุ่นนี้ใช้ใน Topology ไม่ได้');window.NOAH_BAYFACE?.switchTab(false);document.getElementById('topologyTab')?.click();if(id)A.addDevice(id);window.NOAH_EDITOR?.saveLocal();dialog.close();}catch(err){frame.contentWindow.postMessage({type:'uts-dc-error',message:err.message},location.origin);}}
  if(e.data?.type==='uts-dc-export-rack')try{if(A.getProject().id!==projectId)throw Error('Project เปลี่ยนแล้ว กรุณาเปิด Simulator ใหม่');if(e.data.revision!==revision){send();throw Error('กำลังซิงก์ Rack กรุณากด Export อีกครั้ง');}const data=window.NOAH_BAYFACE_MODEL.validate(e.data.data,new Set(A.getCatalog().map(m=>m.id)));if(data.racks.length!==1)throw Error('ส่งออกครั้งละ 1 Rack');const id=data.racks[0].id;if(!current().racks.some(r=>r.id===id))throw Error('ไม่พบ Rack ใน Project ปัจจุบัน');window.NOAH_SPECS?.show('bayface');window.NOAH_BAYFACE?.switchTab(true);dialog.close();window.NOAH_BAYFACE?.focusRack(id);}catch(err){frame.contentWindow.postMessage({type:'uts-dc-error',message:err.message},location.origin);}
  if(e.data?.type==='uts-dc-export-pdf'&&A.getProject().id===projectId)window.NOAH_BAYFACE?.exportFile('pdf');
  if(e.data?.type==='uts-dc-commit')try{if(A.getProject().id!==projectId)throw Error('Project เปลี่ยนแล้ว กรุณาเปิด Simulator ใหม่');if(e.data.revision!==revision){send();return;}const known=new Set(A.getCatalog().map(m=>m.id)),data=window.NOAH_BAYFACE_MODEL.validate(e.data.data,known);A.transaction(p=>{p.bayface=data});const saved=window.NOAH_EDITOR.saveLocal();revision++;frame.contentWindow.postMessage({type:'uts-dc-saved',revision},location.origin);if(saved===false)frame.contentWindow.postMessage({type:'uts-dc-error',message:'แก้ไขเข้า Project แล้ว แต่บันทึกในเครื่องไม่ได้ กรุณาดาวน์โหลด Project'},location.origin);}catch(err){frame.contentWindow.postMessage({type:'uts-dc-error',message:err.message},location.origin);send();}
 }
 window.addEventListener('message',receive);close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{closed=true;window.removeEventListener('message',receive);frame.src='about:blank';dialog.remove()},{once:true});dialog.showModal();
}
window.NOAH_DEVICE_VIEWER={open:openDeviceViewer,openSimulator};
if(A){
 const button=document.createElement('button');button.id='bayfaceSimulator';button.type='button';button.textContent='◈ เปิดใน Simulator';document.getElementById('addRackBtn')?.insertAdjacentElement('afterend',button);button.onclick=openSimulator;
 const bc=document.getElementById('bayfaceCanvas');let moved=false,origin=null;bc?.addEventListener('pointerdown',e=>{moved=false;origin={x:e.clientX,y:e.clientY}},true);bc?.addEventListener('pointermove',e=>{if(origin&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>4)moved=true},true);bc?.addEventListener('pointerup',()=>{origin=null},true);
 bc?.addEventListener('dblclick',e=>{if(moved||document.body.classList.contains('bayface-presentation'))return;const id=e.target.closest('[data-bayface-item]')?.dataset.bayfaceItem;const item=A.getProject().bayface?.items.find(i=>i.id===id);if(item)openDeviceViewer(item.modelId||item.accessoryId,{context:`${item.label} / U${item.u}–${item.u+item.height-1}`,item,powerBasis:A.getProject().bayface?.racks.find(r=>r.id===item.rackId)?.powerBasis||'auto'})});
}

try{const raw=sessionStorage.getItem('uts-museum-request');if(raw){sessionStorage.removeItem('uts-museum-request');const request=JSON.parse(raw);if(Date.now()-request.time<120000&&(!request.modelId||A?.getCatalog().some(m=>m.id===request.modelId))){window.NOAH_BAYFACE?.switchTab(false);document.getElementById('topologyTab')?.click();if(request.modelId)A.addDevice(request.modelId);window.NOAH_EDITOR?.saveLocal();}}}catch{}

try{const raw=sessionStorage.getItem('uts-rack-export');if(raw){sessionStorage.removeItem('uts-rack-export');const request=JSON.parse(raw),age=Date.now()-request.time;if(!Number.isFinite(age)||age<0||age>120000)throw Error('คำขอส่ง Rack หมดอายุ กรุณาส่งจาก Simulator อีกครั้ง');document.getElementById('onboardingDialog')?.close();importRackIntoStudio(request.data,{app:A,bayfaceModel:window.NOAH_BAYFACE_MODEL,bayface:window.NOAH_BAYFACE,specs:window.NOAH_SPECS,editor:window.NOAH_EDITOR});}}catch(e){A?.toast?.(e.message);}
