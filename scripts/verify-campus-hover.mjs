import assert from 'node:assert/strict';
import * as T from 'three';
import {buildCampusExterior,CAMPUS_TREES,inBuilding} from '../src/datacenter/campus-exterior.js';
import {createPowerHover} from '../src/datacenter/power-hover.js';
const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})},{get:(t,k)=>t[k]||(()=>{})})})};
function verifySeating(root){
 const bounds=name=>{const mesh=root.getObjectByName('campus-'+name);assert(mesh,name+' exists');mesh.geometry.computeBoundingBox();const rows=[],matrix=new T.Matrix4();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);rows.push(mesh.geometry.boundingBox.clone().applyMatrix4(matrix));}return rows;};
 const deck=bounds('deck').reduce((area,b)=>area.union(b),new T.Box3()),floors=[...bounds('terrace'),deck];
 const furniture=['lounge-seat','furniture-frame','coffee-table','coffee-table-leg'].flatMap(bounds),bollards=bounds('bollard-lens');
 for(const b of furniture){
  const floor=floors.find(p=>b.min.x>=p.min.x-1e-6&&b.max.x<=p.max.x+1e-6&&b.min.z>=p.min.z-1e-6&&b.max.z<=p.max.z+1e-6);
  assert(floor,'every rendered furniture part stays completely on the paved terrace or timber deck');
  assert(b.min.y>=floor.max.y-1e-6,'furniture does not sink below its supporting floor');
  for(const light of bollards)assert(!b.clone().expandByScalar(.25).intersectsBox(light),'seating clears the garden lights');
 }
 for(const b of [...bounds('furniture-frame'),...bounds('coffee-table-leg')]){
  const floor=floors.find(p=>p.containsPoint(new T.Vector3(b.getCenter(new T.Vector3()).x,p.max.y,b.getCenter(new T.Vector3()).z)));
  assert(floor&&Math.abs(b.min.y-floor.max.y)<1e-6,'chair and table feet rest on the actual rendered floor');
 }
}
try{
 for(const t of CAMPUS_TREES)assert(!inBuilding(t.x,t.z),'every tree stays outdoors');const exterior=buildCampusExterior();assert.equal(exterior.stats().trees,CAMPUS_TREES.length+1);const snapshot=exterior.stats();assert(snapshot.objects<55,'bounded landscape draw groups');let pools=0,canopy,sky;exterior.root.updateMatrixWorld(true);verifySeating(exterior.root);exterior.root.traverse(o=>{if(o.name==='campus-reflecting-pool')pools++;if(o.name==='sakura-five-petal-blossoms')canopy=o;if(o.name==='campus-dusk-sky')sky=o;if(o.isInstancedMesh){const matrix=new T.Matrix4();for(let i=0;i<o.count;i+=Math.max(1,Math.floor(o.count/20))){o.getMatrixAt(i,matrix);assert(matrix.elements.every(Number.isFinite));}}});assert.equal(pools,1);assert(canopy);const base=canopy.count;exterior.quality('performance');assert(canopy.count<base);exterior.quality('ultra');assert(canopy.count>base);assert.equal(exterior.update(1000,false),false);assert.equal(exterior.update(1100,true),true);const camera=new T.PerspectiveCamera();camera.position.set(20,2,8);exterior.update(1200,true,camera);assert.deepEqual(sky.position.toArray(),camera.position.toArray(),'sky follows viewpoint rather than disappearing outside its sphere');exterior.dispose();exterior.dispose();assert.equal(exterior.update(1300,true),false);
 const element={hidden:true,style:{},offsetHeight:185,replaceChildren(){}},racks=[{name:'<Rack>',powerBasis:'auto',items:[{id:'a',model:'known',name:'<unsafe>',u:3,size:2,powerOverrideW:200}]}],devices=[{id:'known',power:{status:'verified',maxW:800}}],ui=createPowerHover(element,{racks,devices}),anchor={rack:0,itemId:'a',visible:true,x:800,y:600,width:850,height:650};ui.show(anchor);assert(!element.hidden);assert(element.innerHTML.includes('200 W'));assert(element.innerHTML.includes('Manual'));assert(element.innerHTML.includes('U3–4'));assert(!element.innerHTML.includes('<unsafe>'));assert(parseFloat(element.style.left)+280<=850);assert(parseFloat(element.style.top)+185<650);racks[0].items[0].powerOverrideW=null;ui.show(anchor);assert(element.innerHTML.includes('800 W'));racks[0].items[0].model='missing';ui.show(anchor);assert(element.innerHTML.includes('ยังไม่ทราบค่า'));ui.show({visible:false});assert(element.hidden);ui.dispose();
 console.log('PASS Campus: outdoor-only trees, instanced finite geometry, retained koi pond, seating floor support/light clearance, sky/quality/motion/disposal; hover shows actual per-item watts and basis, unknowns, escaping, clamping, refresh and clear.');
}finally{globalThis.document=old;}
