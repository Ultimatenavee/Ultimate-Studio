import * as T from 'three';
import {DRY_GARDEN,GARDEN_PAVILION,GARDEN_BASIN,GARDEN_LANTERNS,GARDEN_ROCKS,gardenPath} from './garden-layout.js';
import {CAMPUS_POOLS} from './campus-layout.js';
// Native geometry inspired by the researched garden vocabulary, not a replica of a named garden.
export function buildJapaneseGarden(){
 const root=new T.Group();root.name='japanese-stroll-garden';const geos=new Set(),mats=new Set(),textures=new Set(),rows=new Map();let seed=89021,disposed=false,quality='balanced',last=-Infinity,previous=null,clock=0;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},range=(a,b)=>a+(b-a)*rnd(),geo=g=>(geos.add(g),g),mat=m=>(mats.add(m),m),temp=new T.Object3D(),up=new T.Vector3(0,1,0),color=new T.Color();
 function texture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.add(t);return t;}
 const graniteMap=texture(256,256,(c,w,h)=>{c.fillStyle='#a1a29b';c.fillRect(0,0,w,h);for(let i=0;i<17000;i++){c.fillStyle=i%4?'#22302c30':'#f7efd76a';c.fillRect(rnd()*w,rnd()*h,range(.5,2),range(.5,2));}});
 const gravelMap=texture(512,512,(c,w,h)=>{c.fillStyle='#c6c3b4';c.fillRect(0,0,w,h);for(let i=0;i<26000;i++){c.fillStyle=['#ebe4d6','#7b8177','#aaa99a','#d7d1bf'][i%4];c.fillRect(rnd()*w,rnd()*h,range(1,3),range(1,3));}});gravelMap.wrapS=gravelMap.wrapT=T.RepeatWrapping;gravelMap.repeat.set(5,3);
 const mossMap=texture(256,256,(c,w,h)=>{c.fillStyle='#4c5a37';c.fillRect(0,0,w,h);for(let i=0;i<18000;i++){c.fillStyle=['#78834a50','#1e342545','#a1a46030'][i%3];c.fillRect(rnd()*w,rnd()*h,range(1,4),range(1,4));}});
 const woodMap=texture(128,512,(c,w,h)=>{c.fillStyle='#8d7250';c.fillRect(0,0,w,h);for(let i=0;i<180;i++){c.strokeStyle=i%2?'#372d233d':'#d3ad7938';c.lineWidth=range(.3,1.2);c.beginPath();const x=rnd()*w;c.moveTo(x,0);for(let y=0;y<=h;y+=24)c.lineTo(x+Math.sin(i+y*.05)*1.6,y);c.stroke();}});woodMap.wrapS=woodMap.wrapT=T.RepeatWrapping;
 const granite=mat(new T.MeshStandardMaterial({map:graniteMap,bumpMap:graniteMap,bumpScale:.008,color:0x92988e,roughness:.96})),rockMat=mat(new T.MeshStandardMaterial({map:graniteMap,vertexColors:true,roughness:.98,bumpMap:graniteMap,bumpScale:.012})),moss=mat(new T.MeshStandardMaterial({map:mossMap,bumpMap:mossMap,bumpScale:.012,roughness:1,color:0x7b8e55})),gravel=mat(new T.MeshStandardMaterial({map:gravelMap,bumpMap:gravelMap,bumpScale:.008,roughness:.97})),wood=mat(new T.MeshStandardMaterial({map:woodMap,bumpMap:woodMap,bumpScale:.002,color:0x8a6745,roughness:.78})),roofMat=mat(new T.MeshStandardMaterial({color:0x343c3b,roughness:.85,metalness:.12})),bamboo=mat(new T.MeshStandardMaterial({color:0x7c8154,map:woodMap,roughness:.86})),dark=mat(new T.MeshStandardMaterial({color:0x39453a,roughness:.96})),glow=mat(new T.MeshBasicMaterial({color:0xffc987,toneMapped:false}));
 const cube=geo(new T.BoxGeometry(1,1,1)),cylinder=geo(new T.CylinderGeometry(1,1,1,12));
 function instance(key,g,m,pos,scale,rotation=[0,0,0],tint){const r=rows.get(key)||{g,m,data:[]};rows.set(key,r);temp.position.set(...pos);temp.rotation.set(...rotation);temp.scale.set(...scale);temp.updateMatrix();r.data.push({matrix:temp.matrix.clone(),tint});}
 const box=(key,m,w,h,d,x,y,z,rotation=0)=>instance(key,cube,m,[x,y,z],[w,h,d],[0,rotation,0]);
 function limb(a,b,r,m=wood,key='woody-branches'){const d=b.clone().sub(a);temp.position.copy(a).add(b).multiplyScalar(.5);temp.quaternion.setFromUnitVectors(up,d.clone().normalize());temp.scale.set(r,d.length(),r*.83);temp.updateMatrix();const row=rows.get(key)||{g:cylinder,m,data:[]};rows.set(key,row);row.data.push({matrix:temp.matrix.clone()});}
 function mesh(g,m,name,pos=[0,0,0]){const o=new T.Mesh(geo(g),m);o.name=name;o.position.set(...pos);o.receiveShadow=true;o.castShadow=true;root.add(o);return o;}
 const rock=geo(new T.SphereGeometry(1,18,12)),positions=rock.attributes.position,rockColors=[];
 for(let i=0;i<positions.count;i++){let x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);const n=1+.075*Math.sin(x*8+z*5)*Math.cos(y*7-z*4)+.025*Math.sin(z*17+x*9);positions.setXYZ(i,x*n,Math.max(-.45,y*.78*n),z*n);color.set(y>.1&&Math.sin(x*7+z*9)>0?'#677454':'#6c726c').multiplyScalar(.8+range(0,.25));rockColors.push(color.r,color.g,color.b);}rock.setAttribute('color',new T.Float32BufferAttribute(rockColors,3));rock.computeVertexNormals();rock.computeBoundingSphere();
 const patch=geo(new T.SphereGeometry(1,32,10));
 const mossPatch=(x,z,w,d,h=.12,y=-.1)=>instance('moss-islands',patch,moss,[x,y,z],[w/2,h,d/2],[0,range(-.2,.2),0]);
 // Grouped stones are partly buried in moss rather than floating on the water.
 mossPatch(-8.3,23.3,7.4,4.8,.35,-.01);mossPatch(-18,-21,5.3,3.6,.16,.02);
 for(const [x,z,w,h,d]of GARDEN_ROCKS)instance('boulders',rock,rockMat,[x,h*.3,z],[w,h,d],[.05,range(0,6.28),.12]);
 // Small, irregular shore stones soften the modern water edge; the deck opening stays clear.
 rock.computeBoundingBox();const pond=CAMPUS_POOLS[0],shoreClearance=.16;
 for(let i=0;i<60;i++){
  if(i%7===3||i%11===4)continue;
  let x=-24+i*.55+range(-.17,.17),z=pond.z+(i%2?-1:1)*(pond.depth/2-.9)+Math.sin(i*.7)*.14;
  const size=[range(.25,.52),range(.17,.38),range(.23,.4)],rotation=[range(-.2,.2),rnd()*6.28,0];
  temp.position.set(0,0,0);temp.rotation.set(...rotation);temp.scale.set(...size);temp.updateMatrix();const footprint=rock.boundingBox.clone().applyMatrix4(temp.matrix);
  x=T.MathUtils.clamp(x,pond.x-pond.width/2+shoreClearance-footprint.min.x,pond.x+pond.width/2-shoreClearance-footprint.max.x);
  z=T.MathUtils.clamp(z,pond.z-pond.depth/2+shoreClearance-footprint.min.z,pond.z+pond.depth/2-shoreClearance-footprint.max.z);
  let bottom=Infinity;const vertex=new T.Vector3();for(let n=0;n<positions.count;n++){vertex.fromBufferAttribute(positions,n).applyMatrix4(temp.matrix);bottom=Math.min(bottom,vertex.y);}
  instance('shore-stones',rock,rockMat,[x,-.345-bottom,z],size,rotation);
 }
 // Land-side accents are buried in the soil; loose moss disks no longer float in the pond.
 for(const [x,z]of [[18,-9],[20,-3],[18,6],[20,10],[-38,-19],[-31,-23]]){mossPatch(x,z,2.2,1.5,.16,-.31);instance('boulders',rock,rockMat,[x,-.11,z],[.65,.5,.6],[0,rnd()*6.28,0]);}
 // Raked gravel is a viewing garden; it is deliberately separate from the walking path.
 const dg=DRY_GARDEN;box('dry-garden-base',granite,dg.width+.18,.2,dg.depth+.18,dg.x,-.1,dg.z);box('raked-gravel-bed',gravel,dg.width,.025,dg.depth,dg.x,.015,dg.z);
 const grooves=[];for(let row=0;row<41;row++){const z=dg.z-dg.depth/2+.13+row*.132;for(let n=0;n<110;n++){const x=dg.x-dg.width/2+.08+n*.117,xx=x+.115,warp=q=>Math.sin((q-dg.x)*.68)*.13+Math.sin(q*.22+row*.07)*.08;const a=new T.Vector3(x,.035,z+warp(x)),b=new T.Vector3(xx,.035,z+warp(xx));if(Math.hypot(x+18.1,(z+21)*1.4)>2.7&&Math.abs(a.z-dg.z)<dg.depth/2-.05&&Math.abs(b.z-dg.z)<dg.depth/2-.05)grooves.push(a,b);}}
 const lines=geo(new T.BufferGeometry().setFromPoints(grooves)),grooveMaterial=mat(new T.LineBasicMaterial({color:0x8f9382})),rakes=new T.LineSegments(lines,grooveMaterial);rakes.name='raked-gravel-ripples';root.add(rakes);
 const step=geo(new T.CylinderGeometry(1,1,1,7));for(const p of gardenPath())instance('tobi-ishi-walk',step,granite,[p.x,-.044,p.z],[range(.39,.48),.045,range(.28,.35)],[0,p.angle,0]);
 // Yukimi-inspired lanterns: separate feet, open fire box, broad curved roof and finial.
 const roofProfile=[new T.Vector2(0,.18),new T.Vector2(.11,.15),new T.Vector2(.23,.02),new T.Vector2(.43,-.07),new T.Vector2(.68,-.105),new T.Vector2(.69,-.145),new T.Vector2(.4,-.12),new T.Vector2(0,-.08)];
 const lanternRoof=geo(new T.LatheGeometry(roofProfile,32));
 for(const l of GARDEN_LANTERNS){const {x,z,scale:s}=l,base=-.025;
  instance('lantern-foundations',cylinder,granite,[x,-.185,z],[.49*s,.32,.49*s]);
  for(const [dx,dz]of [[-.28,-.23],[.28,-.23],[0,.29]])instance('lantern-feet',cylinder,granite,[x+dx*s,base+.26*s,z+dz*s],[.075*s,.52*s,.075*s]);
  instance('lantern-platform',cylinder,granite,[x,base+.54*s,z],[.43*s,.1*s,.43*s]);box('lantern-glow',glow,.23*s,.24*s,.23*s,x,base+.76*s,z);
  for(const dx of [-.22,.22])for(const dz of [-.22,.22])box('lantern-frame',granite,.055*s,.38*s,.055*s,x+dx*s,base+.77*s,z+dz*s);
  instance('lantern-roofs',lanternRoof,granite,[x,base+1.08*s,z],[s,s,s]);instance('lantern-finials',patch,granite,[x,base+1.32*s,z],[.1*s,.12*s,.1*s]);
 }
 // Open timber pavilion on the existing deck; no wall closes its walk-in entrance.
 const pv=GARDEN_PAVILION;
 for(const dx of [-2.35,2.35])for(const dz of [-1.95,1.95]){box('pavilion-columns',wood,.16,2.85,.16,pv.x+dx,1.405,pv.z+dz);box('pavilion-shoes',dark,.23,.14,.23,pv.x+dx,.04,pv.z+dz);}
 for(const dz of [-1.95,1.95])box('pavilion-beams',wood,5.4,.18,.18,pv.x,2.75,pv.z+dz);for(const dx of [-2.35,2.35])box('pavilion-beams',wood,.18,.18,4.4,pv.x+dx,2.75,pv.z);
 const roofVertices=[-3.2,2.87,-2.8,3.2,2.87,-2.8,0,3.65,0,3.2,2.87,-2.8,3.2,2.87,2.8,0,3.65,0,3.2,2.87,2.8,-3.2,2.87,2.8,0,3.65,0,-3.2,2.87,2.8,-3.2,2.87,-2.8,0,3.65,0];const roofGeometry=new T.BufferGeometry();roofGeometry.setAttribute('position',new T.Float32BufferAttribute(roofVertices,3));roofGeometry.computeVertexNormals();roofMat.side=T.DoubleSide;mesh(roofGeometry,roofMat,'azumaya-pavilion-roof',[pv.x,0,pv.z]);
 for(let i=0;i<12;i++){const z=pv.z-1.98+i*.36;box('pavilion-rafters',wood,5.7,.07,.07,pv.x,2.82,z);}
 for(let i=1;i<16;i++){const t=i/16,x=3.2*(1-t),z=2.8*(1-t),y=2.87+.78*t+.012;for(const side of [-1,1]){limb(new T.Vector3(pv.x-x,y,pv.z+side*z),new T.Vector3(pv.x+x,y,pv.z+side*z),.013,roofMat,'roof-tile-seams');limb(new T.Vector3(pv.x+side*x,y,pv.z-z),new T.Vector3(pv.x+side*x,y,pv.z+z),.013,roofMat,'roof-tile-seams');}}
 box('pavilion-bench',wood,4.1,.1,.6,pv.x,.43,pv.z+1.5);for(const dx of [-1.6,1.6])box('pavilion-bench-legs',dark,.13,.4,.45,pv.x+dx,.18,pv.z+1.5);
 // Carved tsukubai-inspired basin with a bamboo spout and a recessed water surface.
 const basin=GARDEN_BASIN,profile=[[0,0],[.37,0],[.5,.14],[.51,.39],[.43,.52],[.32,.49],[.29,.25],[0,.25]].map(([x,y])=>new T.Vector2(x,y));mesh(new T.LatheGeometry(profile,40),granite,'tsukubai-water-basin',[basin.x,-.02,basin.z]);
 const waterMat=mat(new T.MeshPhysicalMaterial({color:0x709c96,roughness:.12,metalness:.2,transparent:true,opacity:.8})),basinWater=mesh(new T.CircleGeometry(.305,40),waterMat,'basin-water',[basin.x,.37,basin.z]);basinWater.rotation.x=-Math.PI/2;
 limb(new T.Vector3(basin.x-.85,-.02,basin.z),new T.Vector3(basin.x-.85,1.04,basin.z),.055,bamboo,'bamboo-spout');limb(new T.Vector3(basin.x-.86,.97,basin.z),new T.Vector3(basin.x-.1,.8,basin.z),.045,bamboo,'bamboo-spout');
 const stream=mesh(new T.CylinderGeometry(.008,.013,.43,6),waterMat,'basin-water-trickle',[basin.x-.1,.585,basin.z]);
 // Bamboo screen and grove sit beyond the deck edge, never across an exit path.
 for(let i=0;i<28;i++){const z=22.5+i*.19;instance('bamboo-screen',cylinder,bamboo,[-25.35,.6,z],[.045,1.85,.045]);for(const y of [.3,.8,1.3])instance('bamboo-nodes',cylinder,dark,[-25.35,y,z],[.049,.018,.049]);}
 for(const y of [.32,1.25])limb(new T.Vector3(-25.4,y,22.4),new T.Vector3(-25.4,y,27.8),.035,wood,'bamboo-rails');
 // A few koi below the surface: a decorative animation, frozen by Animation off.
 const fishGeo=geo(new T.SphereGeometry(1,16,10)),fc=[];for(let i=0;i<fishGeo.attributes.position.count;i++){const p=fishGeo.attributes.position,x=p.getX(i),z=p.getZ(i);color.set(Math.sin(x*8+z*5)>.2?'#d07639':Math.cos(z*9-x*4)>.7?'#39453a':'#e2dcc7');fc.push(color.r,color.g,color.b);}fishGeo.setAttribute('color',new T.Float32BufferAttribute(fc,3));const fishMat=mat(new T.MeshStandardMaterial({vertexColors:true,roughness:.52})),fish=new T.InstancedMesh(fishGeo,fishMat,8);fish.name='decorative-pond-koi';root.add(fish);
 const tails=new T.BufferGeometry();tails.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.14,.01,.1,-.14,.01,-.1],3));tails.computeVertexNormals();geo(tails);fishMat.side=T.DoubleSide;const tailMesh=new T.InstancedMesh(tails,fishMat,8);tailMesh.name='koi-tail-fins';root.add(tailMesh);
 function swim(t){for(let i=0;i<8;i++){const a=t*.00008+i*.83,x=-18+Math.cos(a)*(3+i*.17),z=23.2+Math.sin(a)*(1.1+i*.07),yaw=-Math.atan2(Math.cos(a)*1.5,-Math.sin(a)*3.7);temp.position.set(x,-.215,z);temp.rotation.set(0,yaw,0);temp.scale.set(.28,.045,.075);temp.updateMatrix();fish.setMatrixAt(i,temp.matrix);temp.position.add(new T.Vector3(-.25,0,0).applyAxisAngle(up,yaw));temp.rotation.y+=Math.sin(t*.004+i)*.25;temp.scale.set(1,1,1);temp.updateMatrix();tailMesh.setMatrixAt(i,temp.matrix);}fish.instanceMatrix.needsUpdate=tailMesh.instanceMatrix.needsUpdate=true;fish.computeBoundingSphere();tailMesh.computeBoundingSphere();}
 swim(0);
 for(const [key,row]of rows){const batch=new T.InstancedMesh(row.g,row.m,row.data.length);batch.name='garden-'+key;row.data.forEach((r,i)=>{batch.setMatrixAt(i,r.matrix);if(r.tint)batch.setColorAt(i,color.set(r.tint));});batch.instanceMatrix.needsUpdate=true;batch.castShadow=batch.receiveShadow=true;batch.computeBoundingSphere();root.add(batch);}
 function preset(v){quality=v;rakes.visible=v!=='low';}
 preset('balanced');
 return {root,quality:preset,stats:()=>({gardenDraws:root.children.length,koi:fish.count}),update(t,motion,camera){const dt=previous===null?0:Math.min(100,Math.max(0,t-previous));previous=t;if(disposed||!motion||quality==='low'||quality==='performance')return false;if(camera&&Math.hypot(camera.position.x+17,camera.position.z)>70)return false;clock+=dt;if(t-last<66)return false;last=t;swim(clock);stream.material.opacity=.65+Math.sin(clock*.002)*.1;return true;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
