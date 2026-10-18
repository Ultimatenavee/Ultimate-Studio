import {TEMPLE_VISIT} from './temple-visit.js';
import {campusGroundGeometry} from './campus-terrain.js';
import {createSakuraTrees} from './sakura.js';
import {buildGardenSurrounds} from './garden-surrounds.js';
import {buildJapaneseTemple} from './japanese-temple.js';
import {buildJapaneseGarden} from './japanese-garden.js';
import {GARDEN_TREES} from './garden-layout.js';
import * as T from 'three';
import {CAMPUS_TREES,CAMPUS_TREE_BEDS,CAMPUS_POOLS,CAMPUS_DECK,CAMPUS_SEATING} from './campus-layout.js';
export {CAMPUS_TREES,inBuilding} from './campus-layout.js';
export function buildCampusExterior(){
 const root=new T.Group();root.name='campus-exterior';const geometries=new Set(),materials=new Set(),textures=new Set(),batches=new Map();let seed=8521,last=-Infinity,quality='balanced',disposed=false;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const geometry=g=>(geometries.add(g),g),material=m=>(materials.add(m),m),unitBox=geometry(new T.BoxGeometry(1,1,1));
 const paint=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.add(t);return t;};
 const stoneTex=paint(256,256,c=>{c.fillStyle='#bbbcb4';c.fillRect(0,0,256,256);for(let i=0;i<12000;i++){c.fillStyle=i%2?'#6d7b7726':'#f4eee029';c.fillRect(random()*256,random()*256,1,1);}c.strokeStyle='#5b69634d';c.lineWidth=1;c.strokeRect(1,1,254,254);});stoneTex.wrapS=stoneTex.wrapT=T.RepeatWrapping;stoneTex.repeat.set(2,2);
 const turfTex=paint(256,256,c=>{c.fillStyle='#6c8551';c.fillRect(0,0,256,256);for(let i=0;i<19000;i++){c.fillStyle=['#b2bf7d5f','#234f3552','#a6976140'][i%3];c.fillRect(random()*256,random()*256,1,2+random()*3);}});turfTex.wrapS=turfTex.wrapT=T.RepeatWrapping;turfTex.repeat.set(80,64);turfTex.anisotropy=4;const turf=material(new T.MeshStandardMaterial({color:0x9baa79,map:turfTex,roughness:1}));
 const stone=material(new T.MeshStandardMaterial({color:0xb4bbb4,map:stoneTex,bumpMap:stoneTex,bumpScale:.006,roughness:.8})),soil=material(new T.MeshStandardMaterial({color:0x27352b,roughness:1})),wood=material(new T.MeshStandardMaterial({color:0x78604b,roughness:.72})),metal=material(new T.MeshStandardMaterial({color:0x32464b,metalness:.7,roughness:.32})),warm=material(new T.MeshBasicMaterial({color:0xffd59a,toneMapped:false})),fabric=material(new T.MeshStandardMaterial({color:0xb7b6aa,roughness:.98}));
 const temp=new T.Object3D(),color=new T.Color();
 function addInstance(key,g,m,position,scale,rotation=[0,0,0]){const group=batches.get(key)||{g,m,rows:[]};batches.set(key,group);temp.position.set(...position);temp.rotation.set(...rotation);temp.scale.set(...scale);temp.updateMatrix();group.rows.push(temp.matrix.clone());}
 const box=(key,m,w,h,d,x,y,z,rot=0)=>addInstance(key,unitBox,m,[x,y,z],[w,h,d],[0,rot,0]);
 const mesh=(g,m,name)=>{const o=new T.Mesh(geometry(g),m);o.name=name;root.add(o);return o;};
 // Ground is recessed beneath existing floors; a continuous stone promenade frames the campus.
 const ground=mesh(campusGroundGeometry(),turf,'campus-ground');ground.receiveShadow=false;box('terrace',stone,60,.14,4,-17,-.14,14);box('terrace',stone,60,.14,4,-17,-.14,-14);box('terrace',stone,4,.14,32,-45,-.14,0);box('terrace',stone,4,.14,32,11,-.14,0);
 const pondNormal=paint(128,128,c=>{const image=c.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const at=(y*128+x)*4;image.data[at]=128+Math.sin(x*.21+y*.38)*14;image.data[at+1]=128+Math.cos(x*.12-y*.25)*16;image.data[at+2]=250;image.data[at+3]=255;}c.putImageData(image,0,0);});pondNormal.colorSpace=T.NoColorSpace;pondNormal.wrapS=pondNormal.wrapT=T.RepeatWrapping;pondNormal.repeat.set(12,3);
 const water=material(new T.MeshPhysicalMaterial({color:0x527776,metalness:.08,roughness:.15,transparent:true,opacity:.62,depthWrite:false,normalMap:pondNormal,normalScale:new T.Vector2(.14,.14),clearcoat:1,clearcoatRoughness:.12}));
 function pond(x,z,w,d){box('pond-bed',metal,w+.65,.08,d+.65,x,-.37,z);const surface=mesh(new T.PlaneGeometry(w,d),water,'campus-reflecting-pool');surface.rotation.x=-Math.PI/2;surface.position.set(x,-.145,z);for(const zz of [-1,1]){box('pool-coping',stone,w+.85,.15,.3,x,-.11,z+zz*(d/2+.2));box('waterline',warm,w,.015,.018,x,-.025,z+zz*d/2);}for(const xx of [-1,1])box('pool-coping',stone,.3,.15,d+.35,x+xx*(w/2+.2),-.11,z);}
 for(const p of CAMPUS_POOLS)pond(p.x,p.z,p.width,p.depth);
 for(const z of [30.3,-27])box('outer-promenade',stone,62,.16,2.3,-17,-.16,z);
 // Terrace planks, seating pockets and a bridge lead toward the Museum's entrance.
 for(let i=0;i<74;i++)box('deck',wood,.19,.07,CAMPUS_DECK.maxZ-CAMPUS_DECK.minZ,-40.7+i*.205,-.055,(CAMPUS_DECK.maxZ+CAMPUS_DECK.minZ)/2);
 box('temple-approach',stone,5.4,.06,2.5,TEMPLE_VISIT.gateX,-.31,-32);box('entry-landing',stone,3.2,.12,2.6,0,-.08,11.2);box('entry-landing',stone,3.2,.12,1.1,-39,-.08,12.4);
 function seat(x,z,rot,floorY){const baseY=floorY-.02,pieces=[[1.6,.17,.72,0,.39,0],[1.6,.55,.13,0,.7,-.36],[.14,.37,.72,-.8,.6,0],[.14,.37,.72,.8,.6,0]];for(const [w,h,d,xx,y,zz]of pieces){const p=new T.Vector3(xx,y,zz).applyAxisAngle(new T.Vector3(0,1,0),rot);box('lounge-seat',fabric,w,h,d,x+p.x,baseY+y,z+p.z,rot);}for(const xx of [-.65,.65])for(const zz of [-.26,.26]){const p=new T.Vector3(xx,.17,zz).applyAxisAngle(new T.Vector3(0,1,0),rot);box('furniture-frame',metal,.035,.3,.035,x+p.x,baseY+.17,z+p.z,rot);}}
 for(const [x,z,floorY]of CAMPUS_SEATING){seat(x,z-.9,0,floorY);seat(x,z+1,Math.PI,floorY);box('coffee-table',wood,1.25,.09,.6,x,floorY+.395,z);box('coffee-table-leg',metal,.7,.35,.35,x,floorY+.175,z);}
 // Warm bollards and concealed edge light strips have no per-device spotlight.
 for(let x=-44;x<=12;x+=4)for(const z of [15.3,-15.3]){box('bollard',metal,.15,.65,.15,x,.26,z);box('bollard-lens',warm,.16,.16,.16,x,.53,z);}
 for(const x of [-46.7,12.7])for(let z=-13;z<=13;z+=5){box('bollard',metal,.15,.65,.15,x,.26,z);box('bollard-lens',warm,.16,.16,.16,x,.53,z);}
 // Natural, softly raised moss beds replace the old white rectangular slabs.
 const treeMound=geometry(new T.SphereGeometry(1,32,10,0,Math.PI*2,0,Math.PI/2));
 const planterWall=geometry(new T.CylinderGeometry(.52,.52,.14,32,1,true)),planterRim=geometry(new T.RingGeometry(.44,.52,32).rotateX(-Math.PI/2));
 for(const t of CAMPUS_TREE_BEDS){addInstance('tree-moss-beds',treeMound,turf,[t.x,t.base,t.z],[t.rx,t.height,t.rz]);if(t.planter){addInstance('deck-tree-planters',planterWall,metal,[t.x,t.base+.07,t.z],[1,1,1]);addInstance('deck-tree-planter-rims',planterRim,metal,[t.x,t.base+.14,t.z],[1,1,1]);}}
 const treePositions=CAMPUS_TREES.map(t=>({...t,...GARDEN_TREES.find(g=>g.existing&&g.x===t.x&&g.z===t.z)}));treePositions.push(...GARDEN_TREES.filter(t=>!t.existing));
 const sakura=createSakuraTrees(treePositions),garden=buildJapaneseGarden(),surrounds=buildGardenSurrounds(),temple=buildJapaneseTemple();root.add(sakura.root,garden.root,surrounds.root,temple.root);
 const signTexture=paint(512,1024,c=>{c.fillStyle='#263b45';c.fillRect(0,0,512,1024);c.textAlign='center';c.fillStyle='#e7ebdf';c.font='600 42px sans-serif';c.fillText('ULTIMATE',256,240);c.font='500 24px sans-serif';['CONNECT','POWER','SCALE','TOMORROW'].forEach((v,i)=>c.fillText(v,256,460+i*88));});const sign=mesh(new T.PlaneGeometry(2.1,4.2),material(new T.MeshBasicMaterial({map:signTexture,side:T.DoubleSide})),'campus-ultimate-monument');sign.position.set(-42,2.1,26.5);box('monument-body',metal,2.2,4.3,.2,-42,2.1,26.4);
 // Color-gradient sky is native 3D and remains visible through glazing while walking.
 const sky=mesh(new T.SphereGeometry(130,24,12),material(new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#233f58')},horizon:{value:new T.Color('#a7afa3')}},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;uniform vec3 top;uniform vec3 horizon;void main(){float a=smoothstep(-.08,.7,normalize(p).y);gl_FragColor=vec4(mix(horizon,top,a),1.);}',fog:false})),'campus-dusk-sky');sky.position.set(-17,0,0);sky.renderOrder=-100;
 for(const [name,batch]of batches){const instanced=new T.InstancedMesh(batch.g,batch.m,batch.rows.length);instanced.name='campus-'+name;batch.rows.forEach((m,i)=>instanced.setMatrixAt(i,m));instanced.instanceMatrix.needsUpdate=true;instanced.receiveShadow=!['ground','waterline','bollard-lens','tree-uplight'].includes(name);instanced.castShadow=name==='tree-trunks'||name==='tree-branches';instanced.computeBoundingSphere();root.add(instanced);}
 function preset(v){quality=v;sakura.quality(v);garden.quality(v);surrounds.quality(v);temple.quality?.(v);}
 preset('balanced');
 return {root,templeView:(near,cutaway)=>temple.interiorView(near,cutaway),quality:preset,stats:()=>({...sakura.stats(),...garden.stats(),...surrounds.stats(),trees:treePositions.length,objects:root.children.length}),update(t,motion,camera){if(camera)sky.position.copy(camera.position);const sculptureChanged=temple.update(camera);const foliageMoving=sakura.update(t,motion,camera),gardenMoving=garden.update(t,motion,camera);if(disposed||!motion||quality==='low'||quality==='performance'||t-last<66)return sculptureChanged||foliageMoving||gardenMoving;last=t;pondNormal.offset.set(t*.0000017,t*.0000008);return true;},dispose(){if(disposed)return;disposed=true;sakura.dispose();garden.dispose();surrounds.dispose();temple.dispose();root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
