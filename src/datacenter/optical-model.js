import {batchStaticMeshes} from './static-mesh-batches.js';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// Geometry is driven by cited manufacturer envelopes, connector types and mechanical drawings.
// Dimensions describe the module, not an assertion of a calibrated manufacturer CAD model.
export function opticalDimensions(model){
 const d=model.physical?.dimensionsMm;
 if(!d||!model.geometry?.source)throw Error('Optical model requires manufacturer dimensions and physical evidence: '+model.id);
 return {width:d.width/1000,height:d.height/1000,depth:d.depth/1000,verified:model.physical.dimensionStatus==='vendor-verified'};
}
export function createOpticalModel(model,{detail=true}={}){
 const group=new T.Group(),moduleDim=opticalDimensions(model),geos=[],mats=[],textures=[],instances=[],g=model.geometry;
 const material=(color,metalness=0,roughness=.45)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});mats.push(m);return m};
 const metal=material('#bfc6ca',.9,.29),edge=material('#879198',.87,.35),dark=material('#111b20',.05,.7),pcb=material('#244e42',.1,.7),gold=material('#c6a455',.83,.3),latch=material(g.latchColor||'#8f969b',.35,.36),label=material('#f2f0e9',.05,.75);
 function mesh(geo,mat,parent=group){geos.push(geo);const m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,x,y,z,mat=metal,parent=group,bevel=.00018){const geo=detail?new RoundedBoxGeometry(w,h,d,2,Math.min(bevel,h/5,w/5,d/5)):new T.BoxGeometry(w,h,d);geo.userData.shapeKey='box:'+JSON.stringify([w,h,d,bevel]);const m=mesh(geo,mat,parent);m.position.set(x,y,z);return m;}
 function hole(radius,x,y,z,parent){const ring=mesh(new T.RingGeometry(radius*.65,radius,20),edge,parent);ring.position.set(x,y,z);const inside=mesh(new T.CircleGeometry(radius*.65,16),dark,parent);inside.position.set(x,y,z-.0001);}
 function buildModule(parent,{cable=false}={}){
  const {width:w,height:h}=moduleDim,d=(g.shellDepthMm||model.physical.dimensionsMm.depth-5)/1000,q=w>.016,dd=model.form==='QSFP-DD';
  // Open cable assemblies have captive leads; no invented LC/MPO socket on a cable end.
  const shell=box(w,h,d,0,0,0,metal,parent);shell.name='optic-metal-shell';
  box(w*.94,.00035,d*.78,0,h/2+.0001,-d*.02,edge,parent);box(w*.88,.00025,d*.58,0,h/2+.0004,-d*.04,label,parent);
  for(const x of [-w*.49,w*.49])box(.0004,h*.55,d*.72,x,-h*.12,0,edge,parent);
  // Actual SFP/QSFP electrical contact edge:20/38/76 contacts, not arbitrary optical ports.
  const contacts=q?19:10,rows=dd?2:1;
  box(w*.8,.0008,.006,0,-h*.28,-d/2-.001,pcb,parent);
  for(let row=0;row<rows;row++)for(let side=0;side<2;side++)for(let i=0;i<contacts;i++)box(w*.65/contacts,.00012,.003,(i-(contacts-1)/2)*w*.76/contacts,-h*.28+(side?1:-1)*.00047,-d/2-.0015+row*.0032,gold,parent,0);
  const face=d/2+.0007;
  if(cable){box(w*.65,h*.75,.008,0,0,face+.002,dark,parent);}
  // Metal rim and separate recessed receptacles leave visible depth around each connector.
  if(!cable)box(w,h,.002,0,0,face,edge,parent);
  if(cable){/* Captive cable, not an optical receptacle. */}
  else if(g.kind==='rj45'){
   box(w*.78,h*.72,.0005,0,0,face+.0012,dark,parent);box(w*.3,h*.18,.0006,0,-h*.36,face+.0013,dark,parent);
   for(let i=0;i<8;i++)box(.00045,.0012,.0004,(i-3.5)*.0011,h*.16,face+.0016,gold,parent,0);
  }else if(g.kind==='mpo'){
   box(w*.75,h*.52,.001,0,0,face+.001,dark,parent);box(w*.62,h*.23,.0008,0,0,face+.0016,edge,parent);
   for(let i=0;i<12;i++)hole(.00018,(i-5.5)*.00065,0,face+.0021,parent);
   for(const x of [-w*.34,w*.34])hole(.00043,x,0,face+.0018,parent);
  }else{
   const count=g.kind==='simplex-lc'?1:2,spacing=count===1?0:w*.245;
   for(let i=0;i<count;i++){const x=count===1?0:i===0?-spacing:spacing;
    box(w*(count===1?.5:.43),h*.72,.001,x,0,face+.001,dark,parent);
    hole(Math.min(.00185,w*.15),x,0,face+.0017,parent);
    box(.002,.00065,.001,x,h*.33,face+.0015,edge,parent);
   }
  }
  // SFP wire bail versus QSFP pull tab. Profiles retain the manufacturer's latch color.
  if(!q){for(const x of [-w*.49,w*.49])box(.0007,.0007,.009,x,-h*.34,face+.004,latch,parent);box(w,.0007,.0008,0,-h*.34,face+.0084,latch,parent);}
  else{
   const length=dd?.033:.019;
   for(const x of [-w*.42,w*.42])box(.002,.0009,length,x,-h*.3,face+length/2,latch,parent);
   box(w*.88,.0015,.003,0,-h*.3,face+length,latch,parent);
   if(dd)for(let i=0;i<7;i++)for(let j=0;j<5;j++)box(.0011,.002,.0011,(i-3)*.0021,h/2+.001,face-.005-j*.0022,metal,parent);
  }
  return {w,h,d,face};
 }
 if(g.kind==='cable'){
  // Gravity-settled display: two heads rest on the tray, the loose coil lies on
  // the same support plane, and unsupported boot-to-coil leads sag down to it.
  // This is an equilibrium presentation, not a full-length cable/physics solver.
  const cableMat=material(g.jacketColor||'#242a30',.02,.72),wireRadius=(g.cableDiameterMm||3.5)/2000;
  const bendRadius=Math.max((g.bendRadiusMm||50)/1000,.035),rx=bendRadius*1.08;
  const turns=1.5,headZ=.065,headY=moduleDim.height/2;
  const boots=[];
  for(const x of [-rx,rx+wireRadius*2.5*turns]){
   const end=new T.Group();end.name='optic-cable-head';end.position.set(x,headY,headZ);end.rotation.y=Math.PI;group.add(end);
   const {face}=buildModule(end,{cable:true}),bootLength=.014,bootEnd=face+.006+bootLength;
   const boot=mesh(new T.CylinderGeometry(wireRadius*1.2,wireRadius*1.8,bootLength,12),dark,end);
   boot.rotation.x=Math.PI/2;boot.position.z=face+.006+bootLength/2;boot.name='optic-strain-relief';
   boots.push(new T.Vector3(x,headY,headZ-bootEnd));
  }
  // One continuous cable: no straight V-shaped spokes or disconnected ring.
  const coil=new T.CurvePath(),loopPoints=[];
  for(let i=0;i<=144;i++){
   const t=i/144,a=Math.PI+t*Math.PI*2*turns,r=rx+wireRadius*2.5*t*turns;
   // Spiral spacing separates turns on the support plane instead of z-fighting.
   loopPoints.push(new T.Vector3(Math.cos(a)*r,wireRadius,-.025+Math.sin(a)*r));
  }
  const first=loopPoints[0],last=loopPoints.at(-1);
  coil.add(new T.CubicBezierCurve3(boots[0],boots[0].clone().add(new T.Vector3(0,0,-.014)),new T.Vector3(first.x,wireRadius,first.z+.014),first));
  coil.add(new T.CatmullRomCurve3(loopPoints,false,'centripetal'));
  coil.add(new T.CubicBezierCurve3(last,new T.Vector3(last.x,wireRadius,last.z+.014),boots[1].clone().add(new T.Vector3(0,0,-.014)),boots[1]));
  const tube=mesh(new T.TubeGeometry(coil,detail?256:96,wireRadius,detail?12:6,false),cableMat);tube.name='optic-captive-'+model.form;
  group.userData.cableSupport={mode:'gravity-settled-on-tray',planeY:0,radius:wireRadius,boots:boots.map(v=>v.toArray()),coilPoints:loopPoints.map(v=>v.toArray())};
 }else buildModule(group);
 // Real SKU label. No invented brand artwork, serial number or certification marks.
 if(typeof document!=='undefined'&&g.kind!=='cable'){
  const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#eeeae2';ctx.fillRect(0,0,512,192);ctx.fillStyle='#263b48';ctx.font='700 35px Noto Sans Thai, Arial';ctx.fillText(model.sku,18,64,476);ctx.font='27px Noto Sans Thai, Arial';ctx.fillText(model.speedGbps+'G  '+model.connector,18,111,476);ctx.fillText(model.reachLabel+' / '+model.media,18,153,476);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;textures.push(tex);const m=new T.MeshBasicMaterial({map:tex,toneMapped:false});mats.push(m);const face=mesh(new T.PlaneGeometry(moduleDim.width*.85,(g.shellDepthMm||moduleDim.depth*1000-5)/1000*.54),m);face.rotation.x=-Math.PI/2;face.position.set(0,moduleDim.height/2+.0006,-.002);face.name='optic-sku-label';
 }
 // Repeated electrical contacts and ferrules share draw calls without reducing visual detail.
 if(!detail)batchStaticMeshes(group,{isStatic:()=>true,ownGeometry:g=>geos.push(g),cellSize:100});
 if(detail){group.updateMatrixWorld(true);const repeated=new Map();group.traverse(o=>{if(!o.isMesh)return;const key=(o.geometry.userData.shapeKey||o.geometry.type+JSON.stringify(o.geometry.parameters))+o.material.uuid;const rows=repeated.get(key)||[];rows.push(o);repeated.set(key,rows);});for(const rows of repeated.values()){if(rows.length<3)continue;const batch=new T.InstancedMesh(rows[0].geometry,rows[0].material,rows.length);for(let i=0;i<rows.length;i++){batch.setMatrixAt(i,rows[i].matrixWorld);rows[i].removeFromParent();}batch.castShadow=batch.receiveShadow=true;batch.computeBoundingSphere();group.add(batch);instances.push(batch);}}
 group.userData.opticalEvidence=g.source;group.userData.connectorKind=g.kind;
 let bounds=new T.Box3().setFromObject(group),size=bounds.getSize(new T.Vector3());if(g.kind==='cable'){const shape=new T.Group(),center=bounds.getCenter(new T.Vector3());for(const child of [...group.children])shape.add(child);shape.position.copy(center).multiplyScalar(-1);group.add(shape);group.userData.cableSupport.centerOffset=center.toArray();}if(g.kind!=='cable'){const shape=new T.Group(),center=bounds.getCenter(new T.Vector3());for(const child of [...group.children])shape.add(child);shape.position.copy(center).multiplyScalar(-1);const envelope=new T.Group();envelope.add(shape);envelope.scale.set(moduleDim.width/size.x,moduleDim.height/size.y,moduleDim.depth/size.z);group.add(envelope);bounds=new T.Box3().setFromObject(group);size=bounds.getSize(new T.Vector3());}
 const dim=g.kind==='cable'?{width:size.x,height:size.y,depth:size.z,verified:false}:moduleDim;
 let disposed=false;return {group,dimensions:dim,ready:Promise.resolve(true),dispose(){if(disposed)return;disposed=true;instances.forEach(m=>m.dispose());geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
