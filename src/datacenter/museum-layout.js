import {opticalExhibits,OPTIC_COUNTER} from './optics-layout.js';
export const MUSEUM={minX:-43,maxX:-9,minZ:-12,maxZ:12,height:5.5,portal:{x:-9,z:0,width:3.4},entrance:{x:-39,z:9.5},center:{x:-22,z:0},regions:[{minX:-43,maxX:-9,minZ:-12,maxZ:12},{minX:-9,maxX:9,minZ:-10,maxZ:10}]};
export const MUSEUM_FLOOR_PALETTE={base:'#536673',grout:'#354955',highlight:'#9eafb7',zones:{core:'#9bb1bf',switch:'#a6bbb0',access:'#b1aec1',fiber:'#8fb6b2',power:'#c3b497',tools:'#a0adbb',learning:'#91b2b8',lounge:'#718d8d'}};
export const MUSEUM_PLANTERS=[{x:-39,z:-10.5,width:5.2,depth:.65,count:5},{x:-41.8,z:10.5,width:1.6,depth:.65,count:2},{x:-36.2,z:10.5,width:1.6,depth:.65,count:2},{x:-35.3,z:-10.25,width:.8,depth:.8,count:1},{x:-35.3,z:10.25,width:.8,depth:.8,count:1}];
export const GALLERIES=[
 {id:'welcome',number:'01',name:'Entrance & Welcome',short:'WELCOME',x:-39,z:5,color:'#eeb77e',action:'welcome'},
 {id:'library',number:'02',name:'Device Library Hall',short:'DEVICE LIBRARY',x:-22,z:0,color:'#70c8ed',action:'directory'},
 {id:'core',number:'03',name:'Core / PE Routers',short:'CORE / PE ROUTERS',x:-31,z:-8,color:'#e8a16d'},
 {id:'switch',number:'04',name:'Enterprise & DC Switches',short:'SWITCHES',x:-22,z:-8,color:'#8fbeab'},
 {id:'access',number:'05',name:'Access / CPE / Security',short:'ACCESS / CPE',x:-13.5,z:-8,color:'#b9a5dc'},
 {id:'fiber',number:'06',name:'Fiber & Optical Technology',short:'FIBER & OPTICS',x:-31,z:0,color:'#73bde6'},
 {id:'power',number:'07',name:'Power & Cooling',short:'POWER & COOLING',x:-13.5,z:0,color:'#ebc675'},
 {id:'tools',number:'08',name:'Tools & Accessories',short:'TOOLS / ACCESSORIES',x:-31,z:8,color:'#cba6d7',action:'tools'},
 {id:'learning',number:'09',name:'Interactive Network Learning',short:'INTERACTIVE NETWORK',x:-22,z:8,color:'#77bfc0',action:'learning'},
 {id:'datacenter',number:'10',name:'Datacenter Simulator',short:'DATACENTER',x:0,z:0,color:'#80acc5',action:'datacenter'},
 {id:'lounge',number:'11',name:'Knowledge & Technical Lounge',short:'KNOWLEDGE LOUNGE',x:-13.5,z:8,color:'#cdae8a',action:'lounge'},
 {id:'exit',number:'12',name:'Exit / Topology Designer',short:'TOPOLOGY STUDIO',x:-10.3,z:10.6,color:'#d9d2b8',action:'topology'}
];
export function galleryFor(model){if(/^huawei-(ne8000|ne40e)/.test(model.id)||model.role==='pe'||model.category==='pe'||!!model.interfacePreset)return 'core';if(model.category==='switch')return 'switch';if(model.kind==='odf'||model.category==='odf')return 'fiber';if(model.kind==='power'||model.category==='power')return 'power';if(['tool','accessory','patch','blank'].includes(model.category))return 'tools';return 'access';}
export function exhibitionLayout(models,optics=[]){const displays=[];
 for(const zone of GALLERIES.filter(z=>!z.action||z.id==='tools')){let list=models.filter(m=>galleryFor(m)===zone.id).map(model=>({model,secondary:false}));const maxColumns=zone.id==='switch'?6:zone.id==='access'?5:3,rows=['fiber','power','tools'].includes(zone.id)?2:3,columns=zone.id==='power'?2:zone.id==='switch'?(list.length>15?6:5):zone.id==='access'?(list.length>12?5:4):3,capacity=columns*rows;
  list.forEach(({model,secondary},i)=>{const page=Math.floor(i/capacity),slot=i%capacity,row=Math.floor(slot/columns),col=slot%columns,total=Math.min(columns,list.length),x=zone.x+(col-(total-1)/2)*1.52,z=zone.z+(zone.id==='power'?(-1.1+row*2.2):zone.id==='fiber'?(row%2?2.6:-2.6):-1.8+row*2.15);displays.push({id:(secondary?'display-tools-':'')+model.id,zone:zone.id,page,x,z,rotation:zone.z>4?Math.PI:0,podiumY:model.u>10?.66:1.02,width:model.u>10?1.1:.95,depth:.92,model,secondary});});}
 displays.push(...opticalExhibits(optics));return displays;
}

export function museumBounds(){return {width:104,depth:30,regions:MUSEUM.regions};}
export function museumObstacles(displays){const boxes=displays.map(d=>({minX:d.x-d.width/2,maxX:d.x+d.width/2,minZ:d.z-d.depth/2,maxZ:d.z+d.depth/2}));
 const walls=GALLERIES.filter(g=>['core','switch','access','tools','lounge'].includes(g.id)).flatMap(g=>{const z=g.z<0?-11.1:11.1;return [{minX:g.x-3.85,maxX:g.x+3.85,minZ:z-.1,maxZ:z+.1},...[-3.8,3.8].map(x=>({minX:g.x+x-.6,maxX:g.x+x+.6,minZ:z-.6,maxZ:z+.6}))]});const columns=[[-36,-10.5],[-36,-3],[-36,3],[-36,10.5],[-27.4,-10.7],[-18.3,-10.7],[-27.4,10.7],[-18.3,10.7]].map(([x,z])=>({minX:x-.2,maxX:x+.2,minZ:z-.2,maxZ:z+.2}));const plants=MUSEUM_PLANTERS.map(p=>({minX:p.x-p.width/2,maxX:p.x+p.width/2,minZ:p.z-p.depth/2,maxZ:p.z+p.depth/2}));return boxes.concat(walls,columns,plants,[{minX:OPTIC_COUNTER.x-OPTIC_COUNTER.width/2,maxX:OPTIC_COUNTER.x+OPTIC_COUNTER.width/2,minZ:OPTIC_COUNTER.z-OPTIC_COUNTER.depth/2,maxZ:OPTIC_COUNTER.z+OPTIC_COUNTER.depth/2},{minX:-27.55,maxX:-27.05,minZ:.1,maxZ:.85},{minX:-24.05,maxX:-19.95,minZ:-2.05,maxZ:2.05},{minX:-41.2,maxX:-37,minZ:-7.8,maxZ:-6.1},{minX:-31.6,maxX:-30.4,minZ:7.55,maxZ:8.45},{minX:-23.58,maxX:-20.42,minZ:6.42,maxZ:9.58},{minX:-16.8,maxX:-10.6,minZ:7.2,maxZ:8.5},{minX:-14.32,maxX:-13.08,minZ:5.33,maxZ:6.57},{minX:-16.5,maxX:-11.1,minZ:10.4,maxZ:11.1},{minX:-36.25,maxX:-35.95,minZ:-12,maxZ:-5},{minX:-36.25,maxX:-35.95,minZ:-3,maxZ:3},{minX:-36.25,maxX:-35.95,minZ:5,maxZ:12},{minX:-9.12,maxX:-8.87,minZ:-10,maxZ:-1.7},{minX:-9.12,maxX:-8.87,minZ:1.7,maxZ:10}]);
}
export function safeExhibitPose(display){return {x:display.x+Math.sin(display.rotation||0)*1.25,z:display.optical?1.8:display.z+Math.cos(display.rotation||0)*1.25,y:1.65,yaw:display.rotation||0};}

// One shared floor plan drives inlays, borders and map overlays; equipment stays inside its zone.
export function exhibitionAreas(displays){const colors=MUSEUM_FLOOR_PALETTE.zones;const areas=[];
 for(const id of ['core','switch','access','fiber','power']){const rows=displays.filter(d=>d.zone===id);if(!rows.length)continue;const footprints=rows.map(d=>({minX:d.x-d.width/2,maxX:d.x+d.width/2,minZ:d.z-d.depth/2,maxZ:d.z+d.depth/2}));if(id==='fiber')footprints.push({minX:OPTIC_COUNTER.x-OPTIC_COUNTER.width/2,maxX:-27.05,minZ:-.73,maxZ:1});const margin=.36;areas.push({id,minX:Math.min(...footprints.map(b=>b.minX))-margin,maxX:Math.max(...footprints.map(b=>b.maxX))+margin,minZ:Math.min(...footprints.map(b=>b.minZ))-margin,maxZ:Math.max(...footprints.map(b=>b.maxZ))+margin,color:colors[id]});}
 for(const [id,minX,maxX,minZ,maxZ]of [['tools',-34.5,-27.6,6,10.7],['learning',-24,-20,6,10.2],['lounge',-17.2,-10.2,5.1,10.8]])areas.push({id,minX,maxX,minZ,maxZ,color:colors[id]});return areas;}
