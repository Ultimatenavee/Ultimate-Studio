import * as T from 'three';
// Each visible leaf is a curved surface attached to a twig. There are no solid crown meshes.
export function curvedLeafGeometry(){
 const positions=[0,0,0,.25,-.34,-.025,.25,.34,-.025,.68,-.45,.005,.68,.45,.005,1,0,.07,.25,0,.055,.68,0,.095];
 const uv=[0,.5,.25,.12,.25,.88,.68,0,.68,1,1,.5,.25,.5,.68,.5],colors=[];
 for(let i=0;i<positions.length;i+=3){const shade=.73+.27*positions[i];colors.push(shade,shade,shade);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex([0,1,6,0,6,2,1,3,7,1,7,6,6,7,4,6,4,2,3,5,7,7,5,4]);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function shrubLocations(){const out=[];for(const z of [32.4,-30.4])for(let x=-46;x<=14;x+=1.15)out.push({x,z});for(const x of [-51,25.5])for(let z=-27;z<=30;z+=1.3)out.push({x,z});return out;}
export function createVegetation(treePositions,shrubPositions=shrubLocations()){
 const root=new T.Group();root.name='campus-botanical-vegetation';const geometries=new Set(),materials=new Set(),textures=new Set();let seed=8617,disposed=false,quality='balanced',lastTime=0;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},range=(a,b)=>a+(b-a)*rnd();
 const geo=g=>(geometries.add(g),g),mat=m=>(materials.add(m),m),up=new T.Vector3(0,1,0),temp=new T.Object3D(),matrix=new T.Matrix4(),color=new T.Color(),branches=[],sprigs=[];
 function texture(w,h,draw){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;textures.add(t);return t;}
 const bark=texture(128,512,c=>{c.fillStyle='#9d958a';c.fillRect(0,0,128,512);for(let i=0;i<300;i++){const x=rnd()*128;c.strokeStyle=i%3?'#46413735':'#d5c8ae44';c.lineWidth=range(.2,1.6);c.beginPath();c.moveTo(x,0);for(let y=0;y<=512;y+=32)c.lineTo(x+Math.sin(y*.025+i)*range(.2,2),y);c.stroke();}});bark.wrapS=bark.wrapT=T.RepeatWrapping;
 const leafMap=texture(256,128,c=>{const gradient=c.createLinearGradient(0,0,0,128);gradient.addColorStop(0,'#8f9a78');gradient.addColorStop(.43,'#f3f3df');gradient.addColorStop(.58,'#ffffff');gradient.addColorStop(1,'#adb595');c.fillStyle=gradient;c.fillRect(0,0,256,128);c.strokeStyle='#60765066';c.lineWidth=1.3;c.beginPath();c.moveTo(0,64);c.lineTo(256,64);c.stroke();c.strokeStyle='#9baf7859';c.lineWidth=.7;for(let i=1;i<10;i++){const x=i*24;for(const sign of [-1,1]){c.beginPath();c.moveTo(x-18,64);c.quadraticCurveTo(x+6,64+sign*15,x+17,64+sign*53);c.stroke();}}});
 const barkMat=mat(new T.MeshStandardMaterial({color:0x83735d,map:bark,bumpMap:bark,bumpScale:.0015,roughness:.94}));
 const foliageMat=mat(new T.MeshStandardMaterial({map:leafMap,bumpMap:leafMap,bumpScale:.00035,vertexColors:true,side:T.DoubleSide,roughness:.79,metalness:0,emissive:0x122009,emissiveIntensity:.07}));foliageMat.forceSinglePass=true;
 const wind={value:0};foliageMat.onBeforeCompile=shader=>{shader.uniforms.vegetationTime=wind;shader.vertexShader='uniform float vegetationTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
 float phase=instanceMatrix[3].x*.71+instanceMatrix[3].z*.53;
 transformed.y+=sin(vegetationTime*1.35+phase+position.x*2.1)*.035*position.x*position.x;
 transformed.z+=cos(vegetationTime*.9+phase)*.027*position.x*position.x;
#endif`);};foliageMat.customProgramCacheKey=()=> 'uts-curved-botanical-leaf-v1';
 function branch(a,b,radius,type='branch'){
  const direction=b.clone().sub(a);if(direction.lengthSq()<1e-8)return;temp.position.copy(a).add(b).multiplyScalar(.5);temp.quaternion.setFromUnitVectors(up,direction.clone().normalize());temp.scale.set(radius,direction.length(),radius);temp.updateMatrix();branches.push({matrix:temp.matrix.clone(),type});
 }
 function curvedBranch(a,b,radius,arch=.15,type='branch'){
  let previous=a;for(let i=1;i<=3;i++){const t=i/3,p=a.clone().lerp(b,t);p.y+=Math.sin(Math.PI*t)*arch;branch(previous,p,radius*(1-t*.57),type);previous=p;}
 }
 function spray(start,direction,length,spread,plant){
  const end=start.clone().addScaledVector(direction,length);branch(start,end,plant.kind==='tree'?.006:.0035,'twig');const s={start,direction:direction.clone(),length,spread,index:sprigs.length};sprigs.push(s);plant.sprays.push(s);
 }
 const trees=treePositions.map(({x,z},i)=>({kind:'tree',x,z,height:4.65+(i%5)*.29,radius:1.62+(i%4)*.14,phase:rnd()*Math.PI*2,sprays:[]}));
 for(const [index,t]of trees.entries()){
  // Curved, tapered trunk with asymmetric main limbs and smaller forks.
  const trunk=[];for(let i=0;i<=7;i++){const f=i/7;trunk.push(new T.Vector3(t.x+Math.sin(f*2.7+t.phase)*.18*f,.02+t.height*.84*f,t.z+Math.cos(f*3.1+t.phase)*.13*f));if(i)branch(trunk[i-1],trunk[i],.15*Math.pow(.78,i-1),'trunk');}
  for(let i=0;i<4;i++){const a=t.phase+i*Math.PI/2;branch(new T.Vector3(t.x+Math.cos(a)*.29,.025,t.z+Math.sin(a)*.29),trunk[1],.045,'root');}
  const count=5+index%3;
  for(let j=0;j<count;j++){
   const angle=t.phase+j*2.39996,level=3+(j%3),from=trunk[level].clone(),reach=t.radius*range(.65,.95),end=new T.Vector3(t.x+Math.cos(angle)*reach,t.height*range(.65,.83),t.z+Math.sin(angle)*reach);
   curvedBranch(from,end,.046,.19);
   for(let k=0;k<3;k++){
    const a=angle+(k-1)*.72+range(-.18,.18),from2=from.clone().lerp(end,.28+k*.22),tip=from2.clone().add(new T.Vector3(Math.cos(a)*range(.4,.8),range(.48,.95),Math.sin(a)*range(.4,.8)));
    curvedBranch(from2,tip,.016,.06);
    for(let q=0;q<2;q++){const dir=new T.Vector3(Math.cos(a+(q?1:-1)*.7)*.8,range(.25,.75),Math.sin(a+(q?1:-1)*.7)*.8).normalize();spray(tip.clone().lerp(from2,q?.26:0),dir,range(.5,.8),.28,t);}
   }
  }
  for(let i=0;i<5;i++){const a=t.phase+i*2.39996,dir=new T.Vector3(Math.cos(a)*.65,.7,Math.sin(a)*.65).normalize();spray(trunk[7],dir,range(.35,.65),.2,t);}
 }
 const shrubs=shrubPositions.map(({x,z},i)=>({kind:'shrub',x:x+range(-.08,.08),z:z+range(-.08,.08),height:range(.63,.89),radius:range(.48,.64),phase:rnd()*6.28,sprays:[]}));
 for(const s of shrubs){const base=new T.Vector3(s.x,-.295,s.z);
  // Woody stems are visible through small gaps. Multiple lobes grow into the neighbouring hedge.
  for(let j=0;j<9;j++){const a=s.phase+j*2.39996,spread=s.radius*range(.4,1),tip=new T.Vector3(s.x+Math.cos(a)*spread,-.295+s.height*range(.45,.78),s.z+Math.sin(a)*spread*.76);curvedBranch(base,tip,.009,.1);for(let k=0;k<2;k++){const dir=new T.Vector3(Math.cos(a+(k?-.65:.55)),range(.25,.8),Math.sin(a+(k?-.65:.55))).normalize();spray(base.clone().lerp(tip,.20+k*.48),dir,range(.25,.38),.17,s);}}
 }
 const branchGeometry=geo(new T.CylinderGeometry(.78,1,1,10)),wood=new T.InstancedMesh(branchGeometry,barkMat,branches.length);wood.name='campus-botanical-branches';branches.forEach((b,i)=>wood.setMatrixAt(i,b.matrix));wood.instanceMatrix.needsUpdate=true;wood.castShadow=wood.receiveShadow=true;wood.computeBoundingSphere();root.add(wood);
 const leafGeometry=geo(curvedLeafGeometry()),palettes={tree:[0x516f36,0x65833e,0x395a30,0x78914a,0x426938],shrub:[0x355e37,0x4e7944,0x688b43,0x3d7140,0x7c984f]};
 function foliage(plants,perPlant,name){const m=new T.InstancedMesh(leafGeometry,foliageMat,plants.length*perPlant);m.name=name;let index=0;const xAxis=new T.Vector3(),yAxis=new T.Vector3(),zAxis=new T.Vector3(),normal=new T.Vector3(),side=new T.Vector3(),cross=new T.Vector3(),radial=new T.Vector3();
  for(let n=0;n<perPlant;n++)for(const p of plants){const sprig=p.sprays[(n*17+Math.floor(n/p.sprays.length))%p.sprays.length],u=.1+.9*((n*.61803398875)%1),sign=n%2?1:-1;
   side.crossVectors(sprig.direction,up).normalize();if(side.lengthSq()<.01)side.set(1,0,0);
   cross.crossVectors(side,sprig.direction).normalize();const phase=n*2.39996+p.phase;radial.copy(side).multiplyScalar(Math.cos(phase)).addScaledVector(cross,Math.sin(phase));const position=sprig.start.clone().addScaledVector(sprig.direction,sprig.length*u).addScaledVector(radial,sprig.spread*Math.sqrt(u)*range(.3,1));
   xAxis.copy(sprig.direction).multiplyScalar(.25).addScaledVector(radial,range(.65,1));xAxis.y+=range(-.16,.3);xAxis.normalize();normal.set(range(-.35,.35),1,range(-.35,.35)).normalize();yAxis.crossVectors(normal,xAxis).normalize();zAxis.crossVectors(xAxis,yAxis).normalize();matrix.makeBasis(xAxis,yAxis,zAxis);temp.quaternion.setFromRotationMatrix(matrix);temp.position.copy(position);
   const length=p.kind==='tree'?range(.22,.34):range(.115,.18);temp.scale.set(length,length*range(.38,.54),length);temp.updateMatrix();m.setMatrixAt(index,temp.matrix);
   color.setHex(palettes[p.kind][(n+Math.floor(p.phase))%5]);if(u>.88)color.lerp(new T.Color(p.kind==='tree'?0xadb064:0xa1ad58),.25);m.setColorAt(index++,color);
  }m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();root.add(m);return m;
 }
 const treeLeaves=foliage(trees,1800,'campus-leaf-canopies'),shrubLeaves=foliage(shrubs,480,'campus-shrub-leaves');
 const shadowTexture=texture(64,64,c=>{const g=c.createRadialGradient(32,32,3,32,32,31);g.addColorStop(0,'#07120866');g.addColorStop(.5,'#07120833');g.addColorStop(1,'#07120800');c.fillStyle=g;c.fillRect(0,0,64,64);});
 const shadows=new T.InstancedMesh(geo(new T.PlaneGeometry(1,1)),mat(new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1})),trees.length+shrubs.length);shadows.name='campus-plant-contact-shadows';[...trees,...shrubs].forEach((p,i)=>{temp.position.set(p.x,p.kind==='tree'?.026:-.302,p.z);temp.rotation.set(-Math.PI/2,0,0);temp.scale.set(p.kind==='tree'?2.8:1.1,p.kind==='tree'?2.65:.95,1);temp.updateMatrix();shadows.setMatrixAt(i,temp.matrix);});shadows.instanceMatrix.needsUpdate=true;shadows.computeBoundingSphere();root.add(shadows);
 const limits={low:[250,80],performance:[450,140],balanced:[1100,280],high:[1500,400],ultra:[1800,480]};
 function setQuality(value){quality=limits[value]?value:'balanced';const [t,s]=limits[quality];treeLeaves.count=trees.length*t;shrubLeaves.count=shrubs.length*s;}
 setQuality('balanced');
 return {root,quality:setQuality,stats:()=>({trees:trees.length,shrubs:shrubs.length,leaves:treeLeaves.count+shrubLeaves.count,branchSegments:branches.length,sprigs:sprigs.length,drawGroups:root.children.length}),update(t,motion){if(disposed||!motion||quality==='low'||quality==='performance'||t-lastTime<66)return false;lastTime=t;wind.value=t/1000;return true;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
