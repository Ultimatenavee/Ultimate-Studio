import {OVERVIEW_BOUNDS} from './overview-camera.js';
import {CAMPUS_POOLS,CAMPUS_DECK,CAMPUS_EXITS,CAMPUS_FENCE,buildingAt} from './campus-layout.js';
import {JAPANESE_TEMPLE} from './temple-layout.js';
import {inTemple} from './temple-visit.js';
import {MUSEUM} from './museum-layout.js';

export const CAMPUS_DESTINATIONS=Object.freeze([
 {id:'datacenter',number:'01',name:'Datacenter',note:'จัดวางอุปกรณ์และออกแบบ Rack',shot:'datacenter',color:'#49718c',marker:[0,0]},
 {id:'museum',number:'02',name:'Device Library',note:'สำรวจอุปกรณ์และโมเดล 360°',shot:'library',color:'#6d8792',marker:[-26,0]},
 {id:'garden',number:'03',name:'Japanese Garden',note:'สวนซากุระและบ่อปลา',shot:'garden',color:'#75936b',marker:[18,23]},
 {id:'temple',number:'04',name:'Temple Hall',note:'อาคารไม้ญี่ปุ่นและโถงพระ',shot:'temple',color:'#a17c57',marker:[-18,-43.5]}
]);
export const CAMPUS_MAP_BOUNDS=Object.freeze({minX:OVERVIEW_BOUNDS.minX-2,maxX:OVERVIEW_BOUNDS.maxX+2,minZ:OVERVIEW_BOUNDS.minZ-2,maxZ:OVERVIEW_BOUNDS.maxZ+2});
const B=CAMPUS_MAP_BOUNDS,S=4;
export const CAMPUS_MAP_SIZE={width:(B.maxX-B.minX)*S,height:(B.maxZ-B.minZ)*S};
export const campusMapPoint=(x,z)=>({x:(x-B.minX)*S,y:(z-B.minZ)*S});
export function campusZoneAt(x,z){if(inTemple(x,z))return 'temple';const area=buildingAt(x,z);return area==='outdoor'?'garden':area;}
export function campusMapSVG(racks=[]){
 const rect=(b,fill,extra='')=>{const p=campusMapPoint(b.minX,b.minZ);return `<rect x="${p.x}" y="${p.y}" width="${(b.maxX-b.minX)*S}" height="${(b.maxZ-b.minZ)*S}" fill="${fill}" ${extra}/>`;};
 const block=(x,z,w,d,fill,extra='')=>rect({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2},fill,extra);
 const badge=d=>{const p=campusMapPoint(...d.marker);return `<g aria-label="${d.name}"><circle cx="${p.x}" cy="${p.y}" r="13" fill="#183748" stroke="#fff" stroke-width="1.5"/><text x="${p.x}" y="${p.y+4}" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">${d.number}</text></g>`;};
 return `<svg viewBox="0 0 ${CAMPUS_MAP_SIZE.width} ${CAMPUS_MAP_SIZE.height}" role="img" aria-label="แผนที่ทั้งพื้นที่: Datacenter, Device Library, สวนญี่ปุ่น และโถงพระ"><rect width="100%" height="100%" rx="10" fill="#edf2ed"/>${rect(CAMPUS_FENCE,'#d4e0ce','rx="3" stroke="#9aaa91" stroke-width="1"')}${block(-17,14,60,4,'#c7c8b7')}${block(-18,-34,6,9,'#c7c8b7')}${CAMPUS_POOLS.map(p=>block(p.x,p.z,p.width,p.depth,'#9bbdc2','rx="7"')).join('')}${rect(CAMPUS_DECK,'#ac9b7d','stroke="#7b7059" stroke-width=".8"')}${rect(MUSEUM,'#8297a3','stroke="#436172" stroke-width="1.5"')}${rect(MUSEUM.regions[1],'#bfd0db','stroke="#436172" stroke-width="1.5"')}${rect(JAPANESE_TEMPLE.roofBounds,'#bfac96','stroke="#725c47" stroke-width="1.5"')}${racks.map(r=>{const p=campusMapPoint(r.x,r.z);return `<rect x="${p.x-1.6}" y="${p.y-2.3}" width="3.2" height="4.6" fill="#28495d" transform="rotate(${-(r.rotation||0)*180/Math.PI} ${p.x} ${p.y})"/>`;}).join('')}${Object.values(CAMPUS_EXITS).map(p=>{const q=campusMapPoint(p.x,p.z);return `<path d="M${q.x-5} ${q.y}h10" stroke="#faf6e5" stroke-width="5"/>`;}).join('')}${CAMPUS_DESTINATIONS.map(badge).join('')}<text x="${CAMPUS_MAP_SIZE.width-15}" y="18" text-anchor="middle" fill="#36515d" font-size="11">N ↑</text><g id="campusMapPlayer" visibility="hidden"><circle r="5.5" fill="#ed804f" stroke="#fff" stroke-width="2"/><path d="M0-14 5-6-5-6Z" fill="#ed804f" stroke="#fff" stroke-width="1"/></g></svg>`;
}
