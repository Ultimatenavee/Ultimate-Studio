import * as T from 'three';
import {buildBuddhaHall} from './buddha-hall.js';

// Original scenery, inspired by timber Buddhist halls and the user's reference.
// This is a scaled garden landmark, not an architectural survey/replica of Tōdai-ji.
// Local +Z is the facade. Coordinates below are campus metres after root translation.
import {JAPANESE_TEMPLE} from './temple-layout.js';
export {JAPANESE_TEMPLE} from './temple-layout.js';

export function buildJapaneseTemple(){
  const root=new T.Group();root.name='japanese-timber-temple';root.position.set(JAPANESE_TEMPLE.x,0,JAPANESE_TEMPLE.z);
  root.userData.landmark='Japanese timber hall';root.userData.architecture='Original reference-inspired garden scenery';
  const geometries=new Set(),materials=new Set(),textures=new Set(),batches=new Map(),detailMeshes=[];
  const transform=new T.Object3D(),up=new T.Vector3(0,1,0);let disposed=false,interior=null,currentQuality='balanced';
  const geo=g=>(geometries.add(g),g),material=m=>(materials.add(m),m);
  function surfaceMap(kind){
    const w=kind==='wood'?96:128,h=kind==='wood'?256:128,data=new Uint8Array(w*h*4);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const hash=Math.sin(x*127.1+y*311.7)*43758.5453,noise=hash-Math.floor(hash);
      const streak=Math.sin(x*.41+Math.sin(y*.029+x*.13)*1.8)*.045+Math.sin(x*1.8+y*.008)*.025;
      const v=kind==='wood'?.86+streak+(noise-.5)*.08:.88+(noise-.5)*.2;
      const p=(y*w+x)*4;data[p]=data[p+1]=data[p+2]=Math.round(Math.min(1,v)*255);data[p+3]=255;
    }
    const map=new T.DataTexture(data,w,h);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.needsUpdate=true;textures.add(map);return map;
  }
  const woodMap=surfaceMap('wood'),stoneMap=surfaceMap('stone');
  const wood=material(new T.MeshStandardMaterial({color:0x79573b,map:woodMap,bumpMap:woodMap,bumpScale:.014,roughness:.78}));
  const beam=material(new T.MeshStandardMaterial({color:0x513b2b,map:woodMap,bumpMap:woodMap,bumpScale:.012,roughness:.83}));
  const door=material(new T.MeshStandardMaterial({color:0x342e29,map:woodMap,roughness:.86}));
  const plaster=material(new T.MeshStandardMaterial({color:0xd9d1bb,roughness:.98}));
  const stone=material(new T.MeshStandardMaterial({color:0x9b9b8e,map:stoneMap,bumpMap:stoneMap,bumpScale:.01,roughness:.96}));
  const tile=material(new T.MeshStandardMaterial({color:0x46505b,roughness:.73,metalness:.08,side:T.DoubleSide}));
  const tileRib=material(new T.MeshStandardMaterial({color:0x687078,roughness:.68,metalness:.07}));
  const underside=material(new T.MeshStandardMaterial({color:0x423329,map:woodMap,roughness:.9,side:T.DoubleSide}));
  const gold=material(new T.MeshStandardMaterial({color:0xb69b58,metalness:.7,roughness:.4}));
  const darkMetal=material(new T.MeshStandardMaterial({color:0x302f2a,metalness:.55,roughness:.6}));
  const cube=geo(new T.BoxGeometry(1,1,1)),round=geo(new T.CylinderGeometry(.91,1,1,16)),cylinder=geo(new T.CylinderGeometry(1,1,1,10));
  function batchFor(feature,g,m){
    const roofLayer=/roof|eaves|rafter|ridge|canopy|gable|^upper-/.test(feature),key=g.uuid+':'+m.uuid+':'+roofLayer,row=batches.get(key)||{g,m,matrices:[],features:new Set()};row.features.add(feature);batches.set(key,row);return row;
  }
  function instance(key,g,m,p,s,r=[0,0,0]){
    const row=batchFor(key,g,m);transform.position.set(...p);transform.rotation.set(...r);transform.scale.set(...s);transform.updateMatrix();row.matrices.push(transform.matrix.clone());
  }
  const box=(key,m,w,h,d,x,y,z)=>instance(key,cube,m,[x,y,z],[w,h,d]);
  function rod(key,m,a,b,r=.06){
    const dir=b.clone().sub(a);transform.position.copy(a).add(b).multiplyScalar(.5);transform.quaternion.setFromUnitVectors(up,dir.clone().normalize());transform.scale.set(r,dir.length(),r);transform.updateMatrix();
    batchFor(key,cylinder,m).matrices.push(transform.matrix.clone());
  }
  function addMesh(g,m,name,position=[0,0,0],detail=false){
    const obj=new T.Mesh(geo(g),m);obj.name=name;obj.userData.roofLayer=/roof|eaves|rafter|ridge|canopy|gable|^upper-/.test(name);obj.position.set(...position);obj.castShadow=true;obj.receiveShadow=true;root.add(obj);if(detail)detailMeshes.push(obj);return obj;
  }
  // Raised granite podium, dressed edges, and broad shallow ceremonial stair.
  box('stone-podium',stone,31.8,.68,13.7,0,.03,0);
  box('stone-podium-cap',stone,32.25,.12,14.1,0,.43,0);
  box('timber-veranda-floor',wood,30.9,.26,12.9,0,.62,0);
  for(let s=0;s<7;s++)box('stone-stairs',stone,10.4,.15*(s+1),3.1-s*.39,0,-.31+.075*(s+1),8.75-s*.195);
  for(const x of [-5.35,5.35]){
    box('stair-cheeks',stone,.42,.5,3.05,x,-.06,8.7);
    rod('stair-handrails',wood,new T.Vector3(x,.52,10.18),new T.Vector3(x,1.36,7.2),.065);
    for(const z of [7.25,8.7,10.1])rod('stair-balusters',wood,new T.Vector3(x,-.15+(10.18-z)*.28,z),new T.Vector3(x,.54+(10.18-z)*.28,z),.045);
  }
  for(let x=-15.4;x<=15.5;x+=1.1)box('podium-stone-joints',door,.014,.5,.008,x,.06,6.86);
  // Seven bays are an architectural rhythm rather than dimensional reproduction.
  const columns=Array.from({length:8},(_,i)=>-14.4+i*28.8/7);
  box('hall-back-wall',door,28.9,5.5,.18,0,3.53,-5.35);
  box('entry-top-landing',wood,10.4,.26,.9,0,.62,6.85);
  for(const side of [-1,1]){
    const z=side*5.6;
    for(const x of columns){
      instance('round-timber-columns',round,wood,[x,3.15,z],[.31,4.8,.31]);
      instance('column-stone-bases',cylinder,stone,[x,.8,z],[.43,.12,.43]);
      instance('column-metal-shoes',cylinder,darkMetal,[x,1.02,z],[.32,.18,.32]);
      // Layered projecting bracket arms carry the wide eaves and expose joinery.
      for(let level=0;level<5;level++){
        const y=5.15+level*.18,reach=.58+level*.17;
        box('bracket-arms',beam,.25,.14,reach*2,x,y,z+side*(.16+level*.14));
        box('bracket-crosspieces',wood,.7+level*.14,.135,.22,x,y+.09,z+side*(.28+level*.25));
        for(const dx of [-.31,.31])box('bracket-bearing-blocks',wood,.17,.18,.24,x+dx,y+.18,z+side*(.28+level*.25));
      }
    }
    for(const y of [1.58,4.36,5.45]){if(side===1&&y===1.58){for(const x of [-10.5,10.5])box('longitudinal-tie-beams',beam,8.2,.19,.3,x,y,z-.09*side);}else box('longitudinal-tie-beams',beam,29.6,.19,.3,0,y,z-.09*side);}
    for(let b=0;b<7;b++){
      const x=(columns[b]+columns[b+1])/2,w=columns[b+1]-columns[b]-.58;
      box('plaster-infill',plaster,w,1.14,.12,x,4.86,z-.11*side);
      if(side===1&&b>=2&&b<=4)continue;
      box('door-timber-frame',beam,w+.1,3.25,.21,x,2.55,z+.02*side);
      box('door-dark-recess',door,w-.18,2.95,.23,x,2.55,z+.09*side);
      for(let l=0;l<13;l++)box('door-lattice',wood,.044,2.83,.07,x-w/2+.2+l*(w-.4)/12,2.55,z+.245*side);
      for(let l=0;l<8;l++)box('door-lattice-horizontal',beam,w-.22,.04,.075,x,1.21+l*.38,z+.25*side);
      box('door-central-stile',wood,.11,3.1,.08,x,2.55,z+.29*side);
      for(const dx of [-.15,.15])instance('door-hardware',cylinder,darkMetal,[x+dx,2.5,z+.34*side],[.055,.035,.055],[Math.PI/2,0,0]);
    }
  }
  for(const x of [-14.7,14.7]){
    box('side-plaster',plaster,.13,3.6,10.5,x,3.7,0);
    for(const z of [-4,-1.33,1.33,4]){
      instance('side-columns',round,wood,[x,3.13,z],[.28,4.75,.28]);
      box('side-window-recess',door,.22,2.2,2.1,x,2.65,z);
      for(let j=0;j<8;j++)box('side-window-lattice',wood,.27,2.1,.045,x,2.65,z-.9+j*.26);
    }
    for(const y of [1.55,4.35,5.45])box('side-tie-beams',beam,.32,.2,11.7,x,y,0);
  }
  // Low veranda rail is kept clear at the ceremonial central stair.
  for(const x of columns)for(const z of [-6.2,6.2]){
    if(z>0&&Math.abs(x)<6)continue;
    box('veranda-rail-posts',wood,.14,1.12,.14,x,1.29,z);
    instance('veranda-post-caps',cylinder,darkMetal,[x,1.9,z],[.12,.1,.12]);
  }
  for(const z of [-6.2,6.2])for(const interval of z>0?[[-14.4,-6.1],[6.1,14.4]]:[[-14.4,14.4]])for(const y of [1.13,1.73])box('veranda-rails',wood,interval[1]-interval[0],.11,.11,(interval[1]+interval[0])/2,y,z);
  // Exposed upper clerestory: plaster planes alternated with timber, not glass.
  box('upper-core',plaster,27.5,3.4,8.4,0,8.75,0);
  for(const z of [-4.3,4.3]){
    for(let x=-13.2;x<=13.3;x+=2.64){
      instance('upper-columns',round,wood,[x,8.78,z],[.21,3.45,.21]);
      box('upper-window-recesses',door,1.5,1.05,.12,x,9.23,z+.1*Math.sign(z));
      for(let n=0;n<7;n++)box('upper-window-lattice',wood,.045,1.03,.05,x-.65+n*.217,9.23,z+.18*Math.sign(z));
      for(let l=0;l<4;l++){
        box('upper-brackets',beam,.26,.14,.75+l*.27,x,9.7+l*.17,z+.18*Math.sign(z)+l*.13*Math.sign(z));
        box('upper-bracket-blocks',wood,.66+l*.15,.14,.24,x,9.8+l*.17,z+.3*Math.sign(z)+l*.25*Math.sign(z));
      }
    }
    for(const y of [7.9,8.65,9.85])box('upper-tie-beams',beam,27.9,.17,.26,0,y,z+.02);
  }
  // Swept hip roofs. Each surface has real curvature and modeled round tile ribs.
  function roof(name,w,d,ridgeHalf,eave,rise){
    function point(side,u,t){
      const x=(w-(w-ridgeHalf)*t)*u,z=d*(1-t)*side;
      return new T.Vector3(x,eave+rise*Math.pow(t,1.48)+.28*Math.pow(1-t,8)+.33*Math.pow(Math.abs(u),8)*Math.pow(1-t,3),z);
    }
    function endPoint(side,u,t){const p=point(1,side,t);p.z=d*(1-t)*u;return p;}
    const vertices=[],indices=[];
    function sheet(fn,nx,ny){const start=vertices.length/3;for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const p=fn(-1+2*i/nx,j/ny);vertices.push(p.x,p.y,p.z);}for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=start+j*(nx+1)+i,b=a+1,c=a+nx+1,f=c+1;indices.push(a,c,b,b,c,f);}}
    sheet((u,t)=>point(1,u,t),80,22);sheet((u,t)=>point(-1,u,t),80,22);sheet((u,t)=>endPoint(1,u,t),30,22);sheet((u,t)=>endPoint(-1,u,t),30,22);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
    addMesh(g,tile,name+'-curved-tile-surface');
    const under=g.clone();under.translate(0,-.19,0);addMesh(under,underside,name+'-timber-soffit');
    const ribs=[],ribNormals=[],ribIndices=[],mediumIndices=[],coarseIndices=[];
    function tube(points,radius,sides=5,level=2){
      const offset=ribs.length/3;
      for(let i=0;i<points.length;i++){
        const tangent=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize(),right=new T.Vector3().crossVectors(tangent,up).normalize(),normal=new T.Vector3().crossVectors(right,tangent).normalize();
        for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI*2,n=right.clone().multiplyScalar(Math.cos(angle)).addScaledVector(normal,Math.sin(angle)),p=points[i].clone().addScaledVector(n,radius);ribs.push(p.x,p.y,p.z);ribNormals.push(n.x,n.y,n.z);}
      }
      for(let i=0;i<points.length-1;i++)for(let j=0;j<sides;j++){
        const a=offset+i*(sides+1)+j,b=a+sides+1,tri=[a,b,a+1,a+1,b,b+1];ribIndices.push(...tri);if(level>=1)mediumIndices.push(...tri);if(level>=2)coarseIndices.push(...tri);
      }
    }
    for(const side of [-1,1]){
      const count=Math.ceil(w*2/.26);
      for(let i=0;i<=count;i++){
        const u=-1+2*i/count,points=[];
        for(let j=0;j<=18;j++){const p=point(side,u,j/18);p.y+=.045;points.push(p);}tube(points,.035,5,i%4===0?2:i%2===0?1:0);
      }
      for(let i=0;i<=Math.ceil(d*2/.26);i++){
        const u=-1+2*i/Math.ceil(d*2/.26),points=[];
        for(let j=0;j<=18;j++){const p=endPoint(side,u,j/18);p.y+=.045;points.push(p);}tube(points,.035,5,i%4===0?2:i%2===0?1:0);
      }
      // Tiled edge bands and exposed narrow rafter tails follow the curved eave.
      const edge=[];for(let n=0;n<=70;n++){const p=point(side,-1+2*n/70,0);p.y+=.035;edge.push(p);}tube(edge,.115,7);
      for(let x=-w+.2;x<w;x+=.39){const u=x/w,a=point(side,u,0),b=point(side,u,.17);a.y-=.28;b.y-=.3;rod('exposed-roof-rafters',wood,a,b,.043);}
      const end=[];for(let n=0;n<=40;n++){const p=endPoint(side,-1+2*n/40,0);p.y+=.035;end.push(p);}tube(end,.115,7);
    }
    const ribGeo=new T.BufferGeometry();ribGeo.setAttribute('position',new T.Float32BufferAttribute(ribs,3));ribGeo.setAttribute('normal',new T.Float32BufferAttribute(ribNormals,3));ribGeo.setIndex(ribIndices);
    const medium=ribGeo.clone();medium.setIndex(mediumIndices);geo(medium);const coarse=ribGeo.clone();coarse.setIndex(coarseIndices);geo(coarse);
    const ribMesh=addMesh(ribGeo,tileRib,name+'-rounded-tile-ribs',undefined,true);ribMesh.userData.templeLod={full:ribGeo,medium,coarse};
    box('roof-ridge-course',tileRib,ridgeHalf*2+.5,.34,.42,0,eave+rise+.14,0);
    for(const side of [-1,1])for(let n=0;n<16;n++){
      const a=point(1,side,n/16),b=point(1,side,Math.min(1,(n+1)/16));a.y+=.11;b.y+=.11;rod('hip-ridge-tiles',tileRib,a,b,.105);
      const c=point(-1,side,n/16),f=point(-1,side,Math.min(1,(n+1)/16));c.y+=.11;f.y+=.11;if(c.distanceToSquared(f)>0)rod('hip-ridge-tiles',tileRib,c,f,.105);
    }
    return {point};
  }
  roof('lower-eaves',18.2,8.3,10.4,6.18,2.82);
  roof('upper-roof',16.2,6.65,9.9,10.42,4.48);
  // Curved central karahafu-inspired canopy, with recessed timber gable and layered fascia.
  const canopyVertices=[],canopyIndices=[],canopyY=x=>7.05+1.28*Math.exp(-Math.pow(x/1.65,2))+.22*Math.pow(Math.abs(x)/3.4,6);
  for(let j=0;j<=8;j++)for(let i=0;i<=64;i++){const x=-3.4+i*6.8/64,z=6.2+j*2.35/8;canopyVertices.push(x,canopyY(x)+(8.55-z)*.09,z);}
  for(let j=0;j<8;j++)for(let i=0;i<64;i++){const a=j*65+i;canopyIndices.push(a,a+65,a+1,a+1,a+65,a+66);}
  const canopyGeo=new T.BufferGeometry();canopyGeo.setAttribute('position',new T.Float32BufferAttribute(canopyVertices,3));canopyGeo.setIndex(canopyIndices);canopyGeo.computeVertexNormals();addMesh(canopyGeo,tile,'curved-central-entry-canopy');
  for(let i=0;i<64;i++){
    const x=-3.4+i*6.8/64,xx=x+6.8/64;
    for(const [y,r,m,key]of [[-.06,.105,beam,'carved-gable-fascia'],[.035,.025,gold,'canopy-edge-trim']])rod(key,m,new T.Vector3(x,canopyY(x)+y,8.58),new T.Vector3(xx,canopyY(xx)+y,8.58),r);
  }
  for(let i=0;i<=26;i++){const x=-3.3+i*6.6/26;rod('canopy-tile-ribs',tileRib,new T.Vector3(x,canopyY(x)+.05,8.55),new T.Vector3(x,canopyY(x)+.26,6.2),.035);}
  // Timber gable slats fit beneath the curve instead of a flat rectangular placard.
  for(let x=-2.95;x<=3;x+=.145){const h=canopyY(x)-6.65;box('entry-gable-slats',wood,.08,h,.13,x,6.65+h/2,8.42);}
  for(const x of [-3.02,3.02]){
    instance('entry-posts',round,wood,[x,3.68,7.78],[.22,5.84,.22]);
    for(let l=0;l<3;l++)box('entry-brackets',beam,.8+l*.23,.14,.35+l*.24,x,6.2+l*.18,7.86);
  }
  // Small original horn-shaped shibi-inspired silhouettes, with ribbed metal edges.
  const horn=new T.Shape();horn.moveTo(0,0);horn.lineTo(.68,0);horn.bezierCurveTo(.29,.43,.5,.98,.91,1.44);horn.bezierCurveTo(.69,1.5,.41,1.45,.21,1.32);horn.bezierCurveTo(-.1,1.03,-.31,.45,0,0);horn.closePath();
  const hornGeo=geo(new T.ExtrudeGeometry(horn,{depth:.19,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1,curveSegments:14}));
  for(const side of [-1,1]){const o=new T.Mesh(hornGeo,gold);o.name='ridge-horn-ornament';o.userData.roofLayer=true;o.position.set(side*9.65,15.08,-.095);o.scale.x=side;o.castShadow=true;root.add(o);}
  // Batched details keep the landmark to a few dozen draw calls.
  for(const row of batches.values()){
    const batch=new T.InstancedMesh(row.g,row.m,row.matrices.length);batch.name='temple-'+[...row.features][0];batch.userData.features=[...row.features];batch.userData.roofLayer=[...row.features].some(f=>/roof|eaves|rafter|ridge|canopy|gable|^upper-/.test(f));row.matrices.forEach((m,i)=>batch.setMatrixAt(i,m));batch.instanceMatrix.needsUpdate=true;batch.castShadow=batch.receiveShadow=true;batch.computeBoundingSphere();root.add(batch);
  }
  function quality(value){currentQuality=value;interior?.quality(value);for(const mesh of detailMeshes){mesh.visible=value!=='low';const lod=mesh.userData.templeLod;mesh.geometry=lod[value==='high'||value==='ultra'?'full':value==='performance'?'coarse':'medium'];}}
  quality('balanced');
  function interiorView(near,cutaway=false){if(near&&!interior){interior=buildBuddhaHall({loadSculpture:typeof window!=='undefined'});root.add(interior.root);interior.quality(currentQuality);}if(interior)interior.root.visible=!!near;for(const o of root.children)if(o.userData.roofLayer)o.visible=!cutaway&&!(currentQuality==='low'&&detailMeshes.includes(o));return near?interior?.assetStats():null;}
  return {root,quality,interiorView,update:camera=>interior?.root.visible?interior.update(camera):false,stats:()=>({templeDraws:root.children.length,templeBays:7,templeRoofTiers:2}),dispose(){
    if(disposed)return;disposed=true;interior?.dispose();root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  }};
}
