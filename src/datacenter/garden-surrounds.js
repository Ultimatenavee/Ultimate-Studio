import {TEMPLE_VISIT} from './temple-visit.js';
import * as T from 'three';
import {curvedLeafGeometry} from './vegetation.js';
import {CAMPUS_FENCE,CAMPUS_LAWNS,CAMPUS_TREES,CAMPUS_POOLS,CAMPUS_DECK} from './campus-layout.js';
import {CAMPUS_GROUND_Y} from './campus-terrain.js';
import {groundHeight} from './campus-navigation.js';
import {GARDEN_POCKETS,DRY_GARDEN} from './garden-layout.js';
// An original cedar-board / lattice enclosure and layered seasonal planting.
// Fencing vocabulary: North American Japanese Garden Association, research/garden-v91.json.
export function buildGardenSurrounds(){
 const root=new T.Group();root.name='garden-surrounds';const geos=new Set(),mats=new Set(),textures=new Set(),batches=new Map();let seed=91397,disposed=false;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},range=(a,b)=>a+(b-a)*rnd(),geo=g=>(geos.add(g),g),mat=m=>(mats.add(m),m),temp=new T.Object3D(),color=new T.Color();
 function texture(w,h,paint){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d'),w,h);const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;textures.add(t);return t;}
 const woodMap=texture(128,512,(c,w,h)=>{c.fillStyle='#bda382';c.fillRect(0,0,w,h);for(let i=0;i<210;i++){c.strokeStyle=i%3?'#49302148':'#f5d5aa45';c.lineWidth=range(.3,1.5);c.beginPath();const x=rnd()*w;c.moveTo(x,0);for(let y=0;y<=h;y+=16)c.lineTo(x+Math.sin(y*.04+i)*2,y);c.stroke();}});
 const grassMap=texture(256,256,(c,w,h)=>{c.fillStyle='#73905b';c.fillRect(0,0,w,h);for(let i=0;i<18000;i++){c.strokeStyle=['#a5b77a65','#344f394a','#d3bd8150','#638b4860'][i%4];c.lineWidth=.6;c.beginPath();const x=rnd()*w,y=rnd()*h;c.moveTo(x,y);c.lineTo(x+range(-2,2),y-range(1,5));c.stroke();}});grassMap.wrapS=grassMap.wrapT=T.RepeatWrapping;grassMap.repeat.set(12,5);grassMap.anisotropy=4;
 const wood=mat(new T.MeshStandardMaterial({map:woodMap,bumpMap:woodMap,bumpScale:.002,color:0x8e6950,roughness:.86})),cap=mat(new T.MeshStandardMaterial({map:woodMap,color:0x4b3d32,roughness:.84})),stone=mat(new T.MeshStandardMaterial({color:0x777f72,roughness:1})),moss=mat(new T.MeshStandardMaterial({map:grassMap,color:0x7d9854,roughness:1})),grass=mat(new T.MeshStandardMaterial({map:grassMap,color:0xb1c28a,roughness:1})),stem=mat(new T.MeshStandardMaterial({color:0x48613b,roughness:1})),leaf=mat(new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide,roughness:.91})),bloom=mat(new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide,roughness:.8}));leaf.forceSinglePass=bloom.forceSinglePass=true;
 const cube=geo(new T.BoxGeometry(1,1,1)),disk=geo(new T.CylinderGeometry(1,1,1,32)),stemGeo=geo(new T.CylinderGeometry(.65,1,1,5));
 function instance(name,g,m,pos,scale,rot=[0,0,0],tint){let b=batches.get(name);if(!b){b={g,m,rows:[]};batches.set(name,b);}temp.position.set(...pos);temp.rotation.set(...rot);temp.scale.set(...scale);temp.updateMatrix();b.rows.push({matrix:temp.matrix.clone(),tint});}
 const box=(name,m,w,h,d,x,y,z,rot=0,tint)=>instance(name,cube,m,[x,y,z],[w,h,d],[0,rot,0],tint);
 const f=CAMPUS_FENCE;
 function fence(ax,az,bx,bz){const length=Math.hypot(bx-ax,bz-az),count=Math.ceil(length/2.45),panel=length/count,angle=Math.atan2(bx-ax,bz-az),dir=new T.Vector3(bx-ax,0,bz-az).normalize(),point=d=>[ax+dir.x*d,az+dir.z*d];
  for(let i=0;i<=count;i++){const [x,z]=point(i*panel);box('cedar-posts',cap,.17,1.98,.17,x,.68,z);box('post-shoes',stone,.23,.2,.23,x,-.21,z);box('cedar-post-caps',cap,.24,.07,.24,x,1.69,z);}
  for(let i=0;i<count;i++){const [x,z]=point((i+.5)*panel);box('fence-foundation',stone,.19,.17,panel,x,-.245,z,angle);for(const y of [-.09,.98,1.58])box('cedar-rails',cap,.09,.085,panel,x,y,z,angle);
   const boards=Math.ceil(panel/.145);for(let j=0;j<boards;j++){const [xx,zz]=point(i*panel+(j+.5)*panel/boards);box('cedar-boards',wood,.047,1.02,panel/boards*.94,xx,.445,zz,angle,new T.Color('#ad8a67').multiplyScalar(range(.84,1.13)));}
   const lattice=Math.ceil(panel/.16);for(let j=0;j<lattice;j++){const [xx,zz]=point(i*panel+(j+.5)*panel/lattice);box('fence-lattice',wood,.043,.49,.025,xx,1.285,zz,angle);}box('fence-cap',cap,.24,.09,panel+.04,x,1.625,z,angle);
  }
 }
 fence(f.minX,f.minZ,TEMPLE_VISIT.gateX-TEMPLE_VISIT.gateWidth/2,f.minZ);fence(TEMPLE_VISIT.gateX+TEMPLE_VISIT.gateWidth/2,f.minZ,f.maxX,f.minZ);fence(f.maxX,f.minZ,f.maxX,f.maxZ);fence(f.maxX,f.maxZ,f.minX,f.maxZ);fence(f.minX,f.maxZ,f.minX,f.minZ);
 // These surfaces replace the two water meshes and are flush with the surrounding soil.
 const lawnPlane=geo(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2));
 for(const p of CAMPUS_LAWNS){instance('walkable-lawn',lawnPlane,grass,[p.x,CAMPUS_GROUND_Y,p.z],[p.width,1,p.depth]);}
 const blade=new T.BufferGeometry(),verts=[];for(let i=0;i<7;i++){const a=i*2.39996,x=Math.cos(a),z=Math.sin(a);verts.push(-z*.06,0,x*.06,z*.06,0,-x*.06,x*.25,.8+(i%3)*.12,z*.25);}blade.setAttribute('position',new T.Float32BufferAttribute(verts,3));blade.computeVertexNormals();geo(blade);
 const leafGeo=geo(curvedLeafGeometry()),flowers=new T.BufferGeometry(),petals=[],shades=[];for(let p=0;p<5;p++){const a=p*Math.PI*2/5,at=(r,offset=0)=>[Math.cos(a+offset)*r,Math.sin(a+offset)*r,Math.pow(r,2)*.1];const points=[[0,0,0],at(.62,-.38),at(1,-.18),at(.88,0),at(1,.18),at(.62,.38)];for(let i=1;i<5;i++){petals.push(...points[0],...points[i],...points[i+1]);for(const q of [points[0],points[i],points[i+1]])shades.push(1,.62+q[0]*.1,.76+q[1]*.1);}}flowers.setAttribute('position',new T.Float32BufferAttribute(petals,3));flowers.setAttribute('color',new T.Float32BufferAttribute(shades,3));flowers.computeVertexNormals();geo(flowers);
 for(const [index,p]of GARDEN_POCKETS.entries()){
  instance('groundcover-beds',disk,moss,[p.x,-.302,p.z],[p.width/2,.018,p.depth/2],[0,index*.14,0],new T.Color('#98ac70').multiplyScalar(range(.78,1.1)));
  for(let i=0;i<46;i++){const a=rnd()*6.283,r=Math.sqrt(rnd())*.9,x=p.x+Math.cos(a)*p.width/2*r,z=p.z+Math.sin(a)*p.depth/2*r,h=range(.16,.48),s=range(.12,.27);instance('sedge-clumps',blade,leaf,[x,-.29,z],[s,h,s],[0,rnd()*6.28,0],new T.Color([0x687e43,0x8a9f59,0x4f7048,0xa1aa64][i%4]));
   if(i%2===0){instance('flower-stems',stemGeo,stem,[x,-.29+h*.48,z],[.004,h,.004]);for(const sign of [-1,1])instance('flower-leaves',leafGeo,leaf,[x,-.29+h*.48,z],[.13,.055,.13],[-.6,sign*.9+index,.3],new T.Color('#557b49'));for(let k=0;k<4;k++){const b=k*2.39996;instance('azalea-blossoms',flowers,bloom,[x+Math.cos(b)*.065,-.29+h+Math.sin(b)*.04,z+Math.sin(b)*.065],[.045,.045,.045],[-Math.PI/2+range(-.6,.6),rnd()*6.28,range(-.5,.5)],new T.Color(index%3===0?'#fff1eb':index%3===1?'#eea4bd':'#d977a2'));}}
  }
 }
 // Fine turf and scattered fallen sakura petals enrich lawns without impeding walking.
 for(let i=0;i<9000;i++){const p=CAMPUS_LAWNS[i%2],x=p.x+range(-.5,.5)*p.width,z=p.z+range(-.5,.5)*p.depth;if(Math.abs(x-DRY_GARDEN.x)<DRY_GARDEN.width/2+.3&&Math.abs(z-DRY_GARDEN.z)<DRY_GARDEN.depth/2+.3)continue;instance('lawn-grass',blade,leaf,[x,-.309,z],[range(.035,.07),range(.035,.065),.05],[0,rnd()*6.28,0],new T.Color([0x7e9857,0x5d8149,0x9ba867,0x6e9057][i%4]));}
 const petalGeo=geo(new T.CircleGeometry(1,5));for(let i=0;i<2600;i++){const t=CAMPUS_TREES[i%CAMPUS_TREES.length],a=rnd()*6.28,r=Math.sqrt(rnd())*1.7;const x=t.x+Math.cos(a)*r,z=t.z+Math.sin(a)*r,deck=x>=CAMPUS_DECK.minX&&x<=CAMPUS_DECK.maxX&&z>=CAMPUS_DECK.minZ&&z<=CAMPUS_DECK.maxZ;if(CAMPUS_POOLS.some(p=>Math.abs(x-p.x)<p.width/2+.4&&Math.abs(z-p.z)<p.depth/2+.4)&&!deck)continue;const y=groundHeight(x,z)+.004;instance('fallen-petals',petalGeo,bloom,[x,y,z],[.025,.014,1],[-Math.PI/2,0,a],new T.Color('#f0cbd0'));}
 const lod=[];for(const [name,b]of batches){const m=new T.InstancedMesh(b.g,b.m,b.rows.length);m.name='garden-'+name;for(let i=0;i<b.rows.length;i++){m.setMatrixAt(i,b.rows[i].matrix);if(b.rows[i].tint)m.setColorAt(i,b.rows[i].tint);}m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.receiveShadow=true;m.castShadow=name.startsWith('cedar');m.computeBoundingSphere();root.add(m);if(['lawn-grass','fallen-petals'].includes(name)){m.userData.fullCount=m.count;lod.push(m);}}
 function quality(v){const d={low:.15,performance:.3,balanced:.7,high:.9,ultra:1}[v]??.7;for(const m of lod)m.count=Math.floor(m.userData.fullCount*d);}
 quality('balanced');return {root,quality,stats:()=>({pockets:GARDEN_POCKETS.length,fenceSides:4,lawnAreas:CAMPUS_LAWNS.length,draws:root.children.length}),dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
