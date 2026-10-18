import {sprintMultiplier} from './navigation.js';

export function createWalkTools({host,getScene}){
 const abort=new AbortController(),signal=abort.signal;
 const panel=document.createElement('section');panel.className='walk-minimap';panel.hidden=true;
 panel.setAttribute('aria-label','แผนที่ย่อและตำแหน่งตัวละคร');
 panel.innerHTML='<div class="walk-minimap-heading"><b>แผนที่ย่อ</b><button type="button" aria-label="ย่อแผนที่" aria-expanded="true">−</button></div><div class="walk-minimap-map" tabindex="0" role="group" aria-label="คลิกหรือแตะเพื่อวาร์ป ใช้ปุ่มลูกศรเลือกจุดแล้วกด Enter"></div><small role="status">แตะแผนที่เพื่อวาร์ป</small>';
 host.append(panel);
 const map=panel.querySelector('.walk-minimap-map'),status=panel.querySelector('small'),toggle=panel.querySelector('button');
 const speed=document.createElement('label');speed.className='walk-speed-control';speed.htmlFor='walkRunSpeed';
 speed.innerHTML='<span>ความเร็ววิ่ง</span><select id="walkRunSpeed" aria-label="ความเร็ววิ่ง">'+Array.from({length:20},(_,i)=>`<option value="${i+1}">${i+1}×</option>`).join('')+'</select><small>กด Shift ค้าง หรือแตะปุ่มวิ่ง</small>';
 document.getElementById('walkMenu').prepend(speed);
 const select=speed.querySelector('select');let saved=3;try{saved=sprintMultiplier(localStorage.getItem('uts-run-multiplier'));}catch{}
 function applySpeed(value){const n=sprintMultiplier(value);select.value=String(n);getScene().sprintSpeed(n);const button=document.getElementById('walkSprint');button.lastElementChild.textContent='วิ่ง ×'+n;button.setAttribute('aria-label',`วิ่ง เปิดหรือปิดความเร็ว ${n} เท่า`);document.getElementById('joystickHint').textContent=`ลากเพื่อเดิน · วิ่ง ×${n}`;try{localStorage.setItem('uts-run-multiplier',String(n));}catch{}}
 select.addEventListener('change',()=>applySpeed(select.value),{signal});applySpeed(saved);
 let area=null,view=null,marker=null,target=null,down=null;
 function position(x,z,yaw){if(!marker||!view)return;const p=view.point(x,z);marker.setAttribute('visibility','visible');marker.setAttribute('transform',`translate(${p.x},${p.y}) rotate(${-yaw*180/Math.PI})`);}
 function refresh(){const w=getScene();panel.hidden=!w.isWalking();if(panel.hidden)return;const next=w.currentArea();if(next!==area){area=next;view=w.mapView();map.innerHTML=view.svg.replace('campusMapPlayer','walkMiniPlayer');marker=map.querySelector('#walkMiniPlayer');target=null;status.textContent='แตะแผนที่เพื่อวาร์ป';}const s=w.snapshot(),p=['museum','datacenter'].includes(next)?s.interior:s.world;position(p.position[0],p.position[2],p.rotation[1]);}
 function teleport(p){const w=getScene();if(!view||!w.isWalking())return;const q=view.unpoint(p.x,p.y),result=w.teleport(q.x,q.z);status.textContent=result?(Math.hypot(result.x-q.x,result.z-q.z)>.1?'วาร์ปไปจุดยืนใกล้เคียงแล้ว':'วาร์ปแล้ว'):'จุดนี้ยังวาร์ปไม่ได้';}
 function point(e){const svg=map.querySelector('svg'),matrix=svg?.getScreenCTM();if(!matrix)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());return p.x>=0&&p.x<=320&&p.y>=0&&p.y<=320?{x:p.x,y:p.y}:null;}
 map.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.stopPropagation();down={x:e.clientX,y:e.clientY,id:e.pointerId};},{signal});
 map.addEventListener('pointerup',e=>{e.stopPropagation();if(down?.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<10){const p=point(e);if(p)teleport(p);}down=null;},{signal});
 map.addEventListener('pointercancel',()=>{down=null;},{signal});
 map.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' '].includes(e.key))return;e.preventDefault();e.stopPropagation();if(!target)target={x:160,y:160};if(e.key==='Enter'||e.key===' '){teleport(target);return;}target.x=Math.min(320,Math.max(0,target.x+(e.key==='ArrowLeft'?-8:e.key==='ArrowRight'?8:0)));target.y=Math.min(320,Math.max(0,target.y+(e.key==='ArrowUp'?-8:e.key==='ArrowDown'?8:0)));let cross=map.querySelector('[data-map-target]');if(!cross){cross=document.createElementNS('http://www.w3.org/2000/svg','circle');cross.setAttribute('data-map-target','');cross.setAttribute('r','8');cross.setAttribute('fill','none');cross.setAttribute('stroke','#ffeb7c');cross.setAttribute('stroke-width','3');map.querySelector('svg').append(cross);}cross.setAttribute('cx',target.x);cross.setAttribute('cy',target.y);},{signal});
 toggle.addEventListener('click',()=>{map.hidden=!map.hidden;status.hidden=map.hidden;toggle.textContent=map.hidden?'+':'−';toggle.setAttribute('aria-expanded',String(!map.hidden));toggle.setAttribute('aria-label',map.hidden?'ขยายแผนที่':'ย่อแผนที่');},{signal});
 refresh();return {refresh,position,dispose(){abort.abort();panel.remove();speed.remove();}};
}
