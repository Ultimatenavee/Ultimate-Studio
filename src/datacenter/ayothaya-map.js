import {EAST_GATE,CAPITAL_GATE,CAPITAL_ROOMS} from './sirin-navigation.js';
import {TEMPLE_GATE,AREA_NAMES} from './ayothaya-navigation.js';
export function ayothayaMap(area='city'){
 const size=320;
 const point=(x,z)=>area==='city'?{x:(x+40)*4,y:(z+40)*4}:area==='capital'?{x:160+x*.8,y:160+z*.8}:area==='lobby'?{x:160+x*15,y:160+z*15}:area==='museum'?{x:160+(x+26)*8,y:160+z*10}:{x:160+x*14,y:160+z*12};
 const marker='<g id="campusMapPlayer" visibility="hidden"><circle r="5" fill="#ffb46b" stroke="#fff" stroke-width="2"/><path d="M0-14 5-6-5-6Z" fill="#ffb46b"/></g>';
 const title=`<text x="160" y="24" text-anchor="middle" fill="#fff" font-size="14">${AREA_NAMES[area]||area}</text>`;
 let content;
 if(area==='city'){
  const p=point(TEMPLE_GATE.x,TEMPLE_GATE.z);
  content=`<image href="assets/ayothaya/minimap.png" width="320" height="320"/><circle cx="${p.x}" cy="${p.y}" r="7" fill="#f7c866" stroke="#fff"/><text x="${p.x}" y="${p.y+24}" text-anchor="middle" fill="#fff" stroke="#172c32" paint-order="stroke" stroke-width="3" font-size="14">วัดใหญ่ / วาร์ป</text>`;
  const e=point(EAST_GATE.x,EAST_GATE.z);content+=`<circle cx="${e.x}" cy="${e.y}" r="7" fill="#81e6ed" stroke="#fff"/><text x="${e.x-8}" y="${e.y-12}" text-anchor="end" fill="#fff" stroke="#172c32" paint-order="stroke" stroke-width="3" font-size="12">SIRIN →</text>`;
 }else if(area==='capital'){
  content='<rect x="16" y="30" width="288" height="274" fill="#374e48" stroke="#b8b18d"/><path d="M16 160H304 M160 30V304 M74 30V304 M246 30V304 M16 74H304 M16 246H304 M16 132H304 M16 188H304" stroke="#b8b18d" stroke-width="6"/>';
  for(const [label,p]of [['← Ayothaya',CAPITAL_GATE],['Library',CAPITAL_ROOMS.museum],['Datacenter',CAPITAL_ROOMS.datacenter]]){const q=point(p.x,p.z);content+=`<circle cx="${q.x}" cy="${q.y}" r="6" fill="#81e6ed" stroke="#fff"/><text x="${q.x<50?q.x+5:q.x}" y="${q.y-13}" text-anchor="${q.x<50?'start':'middle'}" fill="#fff" stroke="#172c32" paint-order="stroke" stroke-width="3" font-size="12">${label}</text>`;}
 }else if(area==='lobby'){
  content='<rect x="28" y="32" width="264" height="264" rx="8" fill="#39454b" stroke="#bc9e62"/><path d="M50 160H270 M160 160V278" stroke="#cbb36f" stroke-width="4"/><text x="36" y="148" fill="#84d8e5" font-size="12">Library</text><text x="218" y="148" fill="#edc384" font-size="12">Datacenter</text><text x="160" y="285" text-anchor="middle" fill="#fff" font-size="12">ออกสู่เมือง</text>';
 }else content='<rect x="28" y="35" width="264" height="260" rx="8" fill="#344951" stroke="#91afb7"/><text x="160" y="282" text-anchor="middle" fill="#e8c582" font-size="13">ประตูออก → โถงกลาง</text>';
 return {point,zone:()=>area,svg:`<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="แผนที่ ${AREA_NAMES[area]}"><rect width="320" height="320" fill="#20333c"/>${content}${title}${marker}</svg>`};
}
