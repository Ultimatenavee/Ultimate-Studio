import * as T from 'three';
import {createHandGeometry} from './anatomical-hand.js';
import {createBuddhaAssets} from './buddha-assets.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Original, photograph-referenced sculpture. Measurements are scaled uniformly
// from the Nara Tourism Association's 14.98 m seated image (see research JSON).
// This is a sculpted interpretation, not the temple's laser-scan or photography.
export const DAIBUTSU_PROPORTIONS=Object.freeze({seatedHeight:14.98,faceHeight:4.13,faceWidth:3.20,eyeLength:1.02,earLength:2.54,noseWidth:.98,noseProjection:.50,mouthWidth:1.33,palmLength:1.48,middleFinger:1.08,lotusHeight:3.04,scale:4.25/14.98});
export function buildBuddhaHall({authoring=false,loadSculpture=false,sculptureLoader}={}){
 const root=new T.Group();root.name='buddha-hall-interior';const geos=new Set(),mats=new Set(),textures=new Set();let disposed=false;
 const geo=g=>(geos.add(g),g),mat=m=>(mats.add(m),m),V=p=>new T.Vector3(...p);
 // Small original micro-surface maps: patinated metal, never a photo billboard.
 function metalMap(){const n=128,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const s=Math.sin(x*127.1+y*311.7)*43758.5453,f=s-Math.floor(s),v=194+Math.round((f-.5)*26+6*Math.sin(x*.11)*Math.sin(y*.15)),i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;textures.add(t);return t;}
 const grain=metalMap();
 const bronze=mat(new T.MeshStandardMaterial({color:0x56594e,metalness:.58,roughness:.56,bumpMap:grain,bumpScale:.003,vertexColors:true}));
 const hair=mat(new T.MeshStandardMaterial({color:0x363d34,metalness:.52,roughness:.66,bumpMap:grain,bumpScale:.002,vertexColors:true}));
 const crease=mat(new T.MeshStandardMaterial({color:0x292f27,metalness:.4,roughness:.7,vertexColors:true}));
 const gold=mat(new T.MeshStandardMaterial({color:0xb99a57,metalness:.73,roughness:.43,bumpMap:grain,bumpScale:.002,vertexColors:true}));
 const agedGold=mat(new T.MeshStandardMaterial({color:0x66512e,metalness:.6,roughness:.62,vertexColors:true}));
 const dark=mat(new T.MeshStandardMaterial({color:0x35382d,roughness:.85,vertexColors:true}));
 const wood=mat(new T.MeshStandardMaterial({color:0x68412c,roughness:.87,vertexColors:true})),vermillion=mat(new T.MeshStandardMaterial({color:0x692c20,roughness:.8,vertexColors:true}));
 const sphere=geo(new T.SphereGeometry(1,20,14)),lowSphere=geo(new T.SphereGeometry(1,10,8)),cylinder=geo(new T.CylinderGeometry(1,1,1,64));
 function mesh(p,g,m,x=0,y=0,z=0,s=[1,1,1]){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(...s);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
 const ell=(p,m,x,y,z,a,b,c)=>mesh(p,detail<1?lowSphere:sphere,m,x,y,z,[a,b,c]);
 let detail=1;
 function surface(fn,nu,nv){nu=Math.max(6,Math.round(nu*detail));nv=Math.max(4,Math.round(nv*detail));const pos=[],uv=[],idx=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){pos.push(...fn(i/nu,j/nv));uv.push(i/nu,j/nv);}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;idx.push(a,a+1,b,b,a+1,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return geo(g);}
 function cubic(t,p0,p1,p2,p3){const v0=(p2-p0)*.5,v1=(p3-p1)*.5;return (2*p1-2*p2+v0+v1)*t*t*t+(-3*p1+3*p2-2*v0-v1)*t*t+v0*t+p1;}
 function sample(rows,t){const f=t*(rows.length-1),i=Math.floor(f),u=f-i;return rows[0].map((_,k)=>cubic(u,rows[Math.max(0,i-1)][k],rows[i][k],rows[Math.min(rows.length-1,i+1)][k],rows[Math.min(rows.length-1,i+2)][k]));}
 function loft(p,m,rows,nu=64,nv=48,deform){return mesh(p,surface((u,v)=>{const [y,rx,rz,zc=0]=sample(rows,v),a=u*Math.PI*2,x=Math.sin(a)*rx,z=zc+Math.cos(a)*rz;return deform?deform(x,y,z,a):[x,y,z];},nu,nv),m);}
 function sweep(p,m,points,radii,segments=32,sides=12){const path=new T.CatmullRomCurve3(points.map(V)),frames=path.computeFrenetFrames(segments,false),g=surface((u,v)=>{const i=Math.min(segments,Math.round(v*segments)),a=u*Math.PI*2,[r,w=r]=sample(radii,v),q=path.getPointAt(v);const cap=Math.sin(Math.min(1,Math.min(v,1-v)/.035)*Math.PI/2);q.addScaledVector(frames.normals[i],Math.cos(a)*r*cap).addScaledVector(frames.binormals[i],Math.sin(a)*w*cap);return q.toArray();},sides,segments);return mesh(p,g,m);}
 const line=(p,points,m,r=.012,n=32)=>sweep(p,m,points,[[r],[r],[r]],n,6);
 const gauss=(x,c,w)=>Math.exp(-(((x-c)/w)**2));
 function head(p,m,crowned=false){
  const group=new T.Group();group.name='head-sculpt';p.add(group);p=group;
  const faceRows=[[3.65,.035,.08,.07],[3.70,.24,.23,.055],[3.80,.365,.30,.025],[3.96,.434,.343,0],[4.16,.454,.347,-.01],[4.38,.451,.333,-.015],[4.60,.432,.327,-.022],[4.77,.40,.30,-.03],[4.92,.285,.24,-.04],[5.035,.01,.01,-.04]];const shapeFace=(x,y,z,a)=>{if(Math.cos(a)>0){const w=Math.pow(Math.cos(a),5);let d=.024*gauss(Math.abs(x),.25,.14)*gauss(y,4.15,.20)+.025*gauss(x,0,.27)*gauss(y,3.76,.11);d+=.055*gauss(x,0,.095)*gauss(y,4.35,.24)+.139*gauss(x,0,.095)*gauss(y,4.20,.095)+.076*gauss(Math.abs(x),.092,.056)*gauss(y,4.16,.062);d-=.023*gauss(Math.abs(x),.22,.125)*gauss(y,4.47,.060);d+=.021*gauss(x,0,.18)*gauss(y,3.98,.09);
   if(authoring){
    // Eyelids, lips and brow masses belong to the face, rather than wire outlines.
    const ex=Math.abs(x),eyeT=(ex-.22)/.145,eyeY=4.455+.023*(1-eyeT*eyeT),mouthY=4.003-.018*(x/.19)**2;
    d-=.018*gauss(ex,.23,.145)*gauss(y,4.47,.065);
    d+=.019*gauss(ex,.23,.14)*gauss(y,eyeY+.013,.014)+.009*gauss(ex,.23,.14)*gauss(y,eyeY-.022,.02);
    d-=.012*gauss(ex,.23,.14)*gauss(y,eyeY,.005);
    const browY=4.555+.033*(1-((ex-.21)/.19)**2);
    d+=.016*gauss(ex,.23,.17)*gauss(y,browY,.030);
    d+=.025*gauss(x,0,.17)*gauss(y,4.020+.008*gauss(ex,.045,.035),.019)+.033*gauss(x,0,.16)*gauss(y,3.975,.023);
    d-=.016*gauss(x,0,.18)*gauss(y,mouthY,.0055)+.009*gauss(ex,.077,.027)*gauss(y,4.148,.012);
   }
   z+=w*d;}return[x,y,z];};
  const face=loft(p,m,faceRows,authoring?256:96,authoring?240:80,shapeFace);
  function facialZ(x,y){let lo=0,hi=1;for(let i=0;i<22;i++){const mid=(lo+hi)/2;if(sample(faceRows,mid)[0]<y)lo=mid;else hi=mid;}const [yy,rx,rz,zc]=sample(faceRows,(lo+hi)/2),a=Math.asin(T.MathUtils.clamp(x/rx,-1,1));return shapeFace(x,yy,zc+rz*Math.cos(a),a)[2];}
  const facialLine=(pts,material,r,depth=.003)=>line(p,pts.map(([x,y])=>[x,y,facialZ(x,y)+depth]),material,r,30);
  face.name='sculpted-face';
  // Half-lidded eyes follow the cheek surface, with a soft brow and recessed slit.
  for(const s of [-1,1]){
   if(!authoring){facialLine([[s*.086,4.458],[s*.17,4.488],[s*.27,4.484],[s*.375,4.452]],m,.010,.002);
   facialLine([[s*.086,4.453],[s*.18,4.444],[s*.275,4.443],[s*.375,4.452]],crease,.0045,.004);
   facialLine([[s*.09,4.443],[s*.19,4.427],[s*.29,4.432],[s*.373,4.451]],m,.008,.002);
   facialLine([[s*.075,4.55],[s*.18,4.583],[s*.30,4.570],[s*.39,4.529]],m,.017,.001);}else{facialLine([[s*.095,4.462],[s*.18,4.477],[s*.27,4.476],[s*.366,4.455]],crease,.0025,.001);}
   // Long pendulous ears, modeled with an inset concha and curled lower lobe.
   ell(p,m,s*.473,4.17,-.008,.116,.365,.106);
   ell(p,m,s*.505,4.21,.087,.058,.221,.018);
   line(p,[[s*.48,4.49,.071],[s*.555,4.44,.08],[s*.567,4.26,.079],[s*.535,4.05,.09],[s*.511,3.83,.067],[s*.455,3.86,.097],[s*.463,4.02,.11]],m,.027,40);
   line(p,[[s*.494,4.37,.109],[s*.532,4.31,.116],[s*.494,4.18,.118],[s*.481,4.04,.115]],m,.018,22);
   ell(p,m,s*.484,3.84,.033,.055,.070,.06);
   ell(p,crease,s*.077,4.147,.437,.031,.011,.012);
  }
  // Broad nostrils / philtrum are integrated into the head mesh, not a glued cone.
  if(!authoring){facialLine([[-.035,4.104],[0,4.087],[.035,4.104]],m,.006,.001);
  facialLine([[-.187,4.006],[-.10,4.021],[-.038,4.027],[0,4.017],[.038,4.027],[.10,4.021],[.187,4.006]],m,.016,.005);
  facialLine([[-.187,3.997],[-.09,3.990],[0,3.986],[.09,3.990],[.187,3.997]],crease,.004,.009);
  facialLine([[-.17,3.987],[-.08,3.961],[0,3.958],[.08,3.961],[.17,3.987]],m,.020,.004);}else{facialLine([[-.176,3.990],[-.09,3.999],[0,4.003],[.09,3.999],[.176,3.990]],crease,.0024,.0006);}
  ell(p,m,0,4.603,.305,.023,.027,.012);
  const neck=loft(p,m,[[3.38,.25,.245,-.025],[3.46,.285,.25,-.02],[3.57,.275,.26,-.01],[3.68,.25,.25,0],[3.74,.20,.23,.025]],48,20);neck.name='neck';

  // Temple FAQ: 483 curls remain; 492 including nine lost, not historical 966.
  // Distribution is newly sculpted, not a reconstruction of individual scan locations.
  loft(p,crowned?m:hair,[[4.70,.406,.31,-.04],[4.79,.411,.31,-.04],[4.93,.344,.269,-.04],[5.075,.226,.174,-.04],[5.17,.001,.001,-.04]],48,24);
  const rings=[];for(let j=0;j<21;j++){const phi=-.96+j*2.48/20,yy=4.57+.60*Math.sin(phi),half=yy<4.73;rings.push({phi,yy,half,weight:Math.cos(phi)*(half?.5:1)});}const sum=rings.reduce((a,r)=>a+r.weight,0);let assigned=0;for(let j=0;j<rings.length;j++){rings[j].count=j===rings.length-1?483-assigned:Math.round(483*rings[j].weight/sum);assigned+=rings[j].count;}
  const curls=new T.InstancedMesh(geo(new T.SphereGeometry(1,crowned?6:8,crowned?4:6)),crowned?m:hair,483),t=new T.Object3D();curls.name='bronze-hair-curls';let k=0;for(let j=0;j<rings.length;j++){const r=rings[j];for(let i=0;i<r.count;i++){const a=(r.half?Math.PI/2:0)+(i+.5*(j%2))*(r.half?Math.PI:Math.PI*2)/r.count,rr=Math.cos(r.phi),x=.45*rr*Math.sin(a),z=.365*rr*Math.cos(a)-.04;t.position.set(x,r.yy,z);t.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(Math.sin(a)*rr,Math.sin(r.phi),Math.cos(a)*rr).normalize());t.scale.set(.033,.034,.033);t.updateMatrix();curls.setMatrixAt(k++,t.matrix);}}curls.computeBoundingSphere();p.add(curls);
  // Rounded ushnisha continuous with the curled crown, rather than a finial spike.
  ell(p,crowned?m:hair,0,5.105,-.04,.12,.092,.115);
 }
 function hand(parent,x,y,z,left=false,resting=false,m=bronze,fingerDirection=null){
  const h=new T.Group();h.name=resting?(left?'open-left-hand':'open-right-hand'):'raised-right-hand';parent.add(h);
  const pose=resting?(parent.name.startsWith('flanking-')?'relaxed':'cupped'):'blessing',g=geo(createHandGeometry({pose,detail:detail===1,mirror:left})),o=mesh(h,g,m);h.userData.handPose=pose;
  // Orient an anatomical hand explicitly, and attach its wrist to the forearm.
  // No negative group scale: immutable baking must never invert its face winding.
  if(resting){const fingers=fingerDirection?.clone().normalize()||new T.Vector3(left?-1:1,0,0),normal=new T.Vector3(0,1,0),across=fingers.clone().cross(normal).normalize();h.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(across,fingers,normal));}
  h.position.set(x,y,z).sub(new T.Vector3(...g.userData.wrist).applyQuaternion(h.quaternion));
  h.userData.wrist=[x,y,z];h.userData.fingersDirection=new T.Vector3(0,1,0).applyQuaternion(h.quaternion).toArray();h.userData.palmNormal=new T.Vector3(0,0,1).applyQuaternion(h.quaternion).toArray();
  return h;
 }
 const torsoRows=[[.92,.48,.35,-.07],[1.18,1.05,.56,-.05],[1.50,1.12,.57,-.055],[1.80,.97,.51,-.045],[2.14,.965,.49,-.035],[2.50,1.00,.48,-.04],[2.87,1.045,.45,-.035],[3.15,1.03,.39,-.045],[3.34,.85,.32,-.04],[3.47,.47,.27,-.03],[3.53,.26,.24,-.025]];
 function bodyFront(x,y){let best=torsoRows[0];for(let i=0;i<torsoRows.length-1;i++)if(y>=torsoRows[i][0]&&y<=torsoRows[i+1][0]){const a=torsoRows[i],b=torsoRows[i+1],t=(y-a[0])/(b[0]-a[0]);best=a.map((n,k)=>T.MathUtils.lerp(n,b[k],t));break;}return best[3]+best[2]*Math.sqrt(Math.max(.015,1-(x/best[1])**2));}
 function body(p,m,attendant=false){
  const group=new T.Group();group.name='body-sculpt';p.add(group);p=group;
  // Keep the attendant pose decision on its anatomical group after authoring split.
  if(attendant)group.name='flanking-body-sculpt';
  const torso=loft(p,m,torsoRows,80,64,(x,y,z,a)=>{if(Math.cos(a)>0)z+=.032*gauss(Math.abs(x),.43,.34)*gauss(y,2.94,.28)*Math.cos(a);return[x,y,z];});torso.name='continuous-torso';
  // Broad nested U folds modeled as fabric relief; the chest remains exposed.
  const robeTop=x=>authoring?2.38+.90*Math.pow(Math.abs(x)/1.018,4.1):2.25+1.03*Math.pow(Math.abs(x)/1.018,3.4);
  const robe=mesh(p,surface((u,v)=>{const x=(u*2-1)*1.018,top=robeTop(x),y=1.14+v*(top-1.14),q=y-.60*x*x,folds=authoring?[1.27,1.40,1.58,1.79,2.04,2.34].reduce((a,h,i)=>a-.013*gauss(q,h,.017+i*.0015)+.008*gauss(q,h+.033,.032),0):.017*Math.sin(44*(y-.68*Math.pow(x,2))),vertical=(authoring?.004:.012)*Math.sin(x*87+Math.sin(y*3))*Math.pow(Math.abs(x),5);return[x,y,bodyFront(x,y)+.018+folds+vertical];},authoring?160:96,authoring?112:64),m);robe.name='draped-robe-surface';
  const edge=[];for(let i=0;i<=40;i++){const x=-1.018+2.036*i/40,y=robeTop(x);edge.push([x,y,bodyFront(x,y)+.028]);}line(p,edge,m,.014,72).name='robe-neckline';
  const legs=loft(p,m,[[.87,.04,.04,.1],[.91,1.21,.63,.08],[1.03,1.72,.79,.08],[1.20,1.84,.83,.04],[1.39,1.73,.79,.0],[1.57,1.37,.66,-.025],[1.69,.85,.48,-.03],[1.73,.03,.03,-.03]],96,48,(x,y,z,a)=>{if(Math.cos(a)>0){const folds=.02*Math.sin(29*Math.atan2(x,(y-.78)*1.7)+y*4)*gauss(y,1.17,.34);z+=folds*Math.cos(a);}return[x,y,z];});legs.name='crossed-lotus-legs';
  if(!attendant){
   // Embedded deltoid forms bridge torso and sleeve/upper arm smoothly.
   for(const side of [-1,1])ell(p,m,side*.94,3.16,-.025,.31,.26,.29);
   sweep(p,m,[[-.73,3.20,-.05],[-1.04,3.13,.015],[-1.22,2.85,.07],[-1.31,2.49,.15],[-1.34,2.33,.24]],[[.16,.16],[.30,.29],[.30,.27],[.27,.24],[.235,.22]],36,18);
   sweep(p,m,[[-1.34,2.33,.24],[-1.42,2.48,.40],[-1.41,2.74,.57],[-1.34,2.94,.71]],[[.237,.22],[.24,.22],[.19,.17],[.105,.09]],32,18);
   hand(p,-1.34,2.94,.71,false,false,m);
   sweep(p,m,[[.73,3.20,-.05],[1.04,3.12,.015],[1.21,2.87,.02],[1.28,2.36,.20],[1.29,2.09,.33],[1.12,1.86,.64]],[[.16,.16],[.30,.29],[.28,.26],[.26,.23],[.205,.20],[.10,.09]],44,18);
   hand(p,1.12,1.86,.64,true,true,m,new T.Vector3(-.32,0,.947));
  }else{
   // Attendants have lowered hands and crowns, never cloned abhaya silhouettes.
   for(const s of [-1,1])sweep(p,m,[[s*.95,3.17,0],[s*1.17,2.68,.10],[s*1.15,2.10,.29],[s*.79,1.70,.67]],[[.24,.24],[.25,.23],[.20,.18],[.10,.09]],36,16);
   hand(p,-.79,1.70,.67,false,true,m);hand(p,.79,1.70,.67,true,true,m);
   for(let i=0;i<3;i++)line(p,[[-.48,3.30-i*.08,.20],[-.34,2.92-i*.13,.47],[0,2.66-i*.15,.50],[.34,2.92-i*.13,.47],[.48,3.30-i*.08,.20]],gold,.016,44);
  }
 }
 function lotus(p,m){
  const base=loft(p,dark,[[0,1.68,1.19,0],[.08,1.83,1.28,0],[.16,1.83,1.28,0],[.20,1.72,1.23,0],[.24,1.67,1.20,0],[.27,1.74,1.24,0]],80,18);base.name='lotus-stone-plinth';
  loft(p,m,[[.24,1.55,1.13,0],[.34,1.62,1.17,0],[.53,1.88,1.36,0],[.70,1.89,1.35,0],[.79,1.75,1.25,0],[.865,1.64,1.19,0]],80,24);
  // Cupped, broad bronze lotus leaves with incised outlines, not flat gold decals.
  for(let row=0;row<2;row++)for(let i=0;i<24;i++){const a=i*Math.PI/12+row*Math.PI/24,c=Math.cos(a),s=Math.sin(a),petal=surface((u,v)=>{const q=u*2-1,w=.27*Math.sin(Math.PI*v)**.8,r=1.64+.26*Math.sin(Math.PI*v),y=.28+row*.23+.40*v+.12*(1-q*q)*Math.sin(Math.PI*v),x=q*w,z=r+.065*(1-q*q)*Math.sin(Math.PI*v);return[x*c+z*s,y,z*c-x*s];},12,14);mesh(p,petal,m);
   const pts=[];for(let j=0;j<=20;j++){const v=j/20,r=1.65+.26*Math.sin(Math.PI*v);pts.push([r*s,.29+row*.23+.40*v+.125*Math.sin(Math.PI*v),r*c]);}line(p,pts,m,.006,20);
  }
 }
 function aureole(p){
  const g=new T.Group();g.name='carved-mandorla';g.position.set(0,0,-.73);p.add(g);
  // Arched openwork panel, reaching behind the head with a broad lower shoulder.
  const outline=(a,inset=0)=>{const rx=2.06-inset,ry=2.64-inset;return[Math.sin(a)*rx,3.12+Math.cos(a)*ry,0];};
  const backing=surface((u,v)=>{const a=u*Math.PI*2,rr=v;return[Math.sin(a)*1.94*rr,3.12+Math.cos(a)*2.48*rr,-.10+.012*Math.sin(a*36)*Math.sin(v*30)];},96,16);mesh(g,backing,agedGold);
  // Repousse vine scrolls within the gilded field, in shallow relief.
  for(const s of [-1,1])for(let i=0;i<18;i++){const a=s*(.12+i*.157),[x,y]=outline(a,.72),rr=.16+.025*Math.sin(i);const pts=[];for(let j=0;j<=25;j++){const b=j/25*Math.PI*3,r=rr*(1-j/30);pts.push([x+Math.cos(b)*r,y+Math.sin(b)*r,.006]);}line(g,pts,gold,.009,24);}
  const panel=surface((u,v)=>{const a=u*Math.PI*2,[x,y]=outline(a,.14),q=.84+.16*v;return[x*q,3.12+(y-3.12)*q,-.065];},128,5);mesh(g,panel,agedGold);
  for(const inset of [0,.08,.29]){const pts=[];for(let i=0;i<=128;i++)pts.push(outline(i*Math.PI*2/128,inset));line(g,pts,gold,inset===0?.023:.016,128);}
  // Pointed repousse flame leaves on the rim; curved, cupped surfaces.
  for(let i=0;i<44;i++){const a=i*Math.PI*2/44,[x,y]=outline(a,-.015),h=.19+.055*Math.sin(i*2.3);mesh(g,surface((u,v)=>{const q=u*2-1,w=.045*Math.sin(Math.PI*v),r=h*v;return[x+Math.sin(a)*r+Math.cos(a)*q*w,y+Math.cos(a)*r-Math.sin(a)*q*w,.025*(1-q*q)*Math.sin(Math.PI*v)];},6,8),gold);}
  // Small seated relief figures and radial bands are sculpted from reference photos.
  for(const s of [-1,1])for(let i=0;i<8;i++){const a=s*(.23+i*.337),[x,y]=outline(a,.48),rel=new T.Group();rel.position.set(x,y,.02);g.add(rel);ell(rel,gold,0,.10,0,.092,.12,.040);ell(rel,gold,0,.265,0,.056,.067,.044);ell(rel,gold,0,0,0,.15,.05,.055);line(rel,[[-.065,.19,.02],[-.106,.10,.025],[-.118,.18,.035]],gold,.018,12);ell(rel,gold,-.118,.213,.035,.020,.037,.015);line(rel,[[.07,.19,.012],[.105,.066,.027],[.035,.05,.05]],gold,.018,12);line(rel,[[-.13,0,0],[-.14,.17,-.01],[0,.35,-.02],[.14,.17,-.01],[.13,0,0]],gold,.010,24);}
  // Pairs of straight aureole rays emerge behind the outer relief bands.
  for(const s of [-1,1])for(let i=0;i<7;i++){const a=s*(.35+i*.31),[x,y]=outline(a,.20),[xx,yy]=outline(a,-.16);for(const off of [-.025,.025])line(g,[[x+off,y,.012],[xx+off,yy,.012]],gold,.012,6);}
  return g;
 }
 function figure(name,x,z,scale=1,attendant=false){detail=attendant?.52:1;const g=new T.Group();g.name=name;g.position.set(x,.75,z);g.scale.setScalar(scale);root.add(g);g.userData.reference=attendant?'Crowned flanking bodhisattva':'Todaiji Vairocana / Daibutsu';g.userData.measurements=DAIBUTSU_PROPORTIONS;
  aureole(g);lotus(g,attendant?agedGold:bronze);body(g,attendant?gold:bronze,attendant);head(g,attendant?gold:bronze,attendant);
  if(attendant){loft(g,gold,[[4.76,.43,.33,-.04],[4.86,.46,.35,-.04],[5.08,.32,.27,-.04],[5.26,.13,.13,-.04]],36,20);for(let i=0;i<7;i++){const a=(i-3)*.43;ell(g,gold,Math.sin(a)*.37,5.09+.13*Math.cos(a),Math.cos(a)*.27-.04,.07,.15,.04);}ell(g,gold,0,5.40,-.04,.075,.17,.065);}
  return g;
 }
 figure('vairocana-daibutsu',0,-1.7);figure('flanking-bodhisattva-west',-7.6,-2.1,.66,true);figure('flanking-bodhisattva-east',7.6,-2.1,.66,true);
 mesh(root,geo(new T.BoxGeometry(26,5.1,.15)),wood,0,3.3,-5.15);
 for(const x of [-11.5,-4.5,4.5,11.5]){mesh(root,geo(new T.CylinderGeometry(.19,.22,5.3,20)),vermillion,x,3.4,-4.8);mesh(root,cylinder,gold,x,5.95,-4.8,[.28,.12,.28]);}
 for(const x of [-10,-5,5,10]){mesh(root,geo(new T.BoxGeometry(.045,.8,.045)),vermillion,x,1.15,2.15);for(const y of [1,1.45])mesh(root,geo(new T.BoxGeometry(3.9,.055,.055)),vermillion,x,y,2.15);}
 for(const x of [-4,4]){mesh(root,cylinder,bronze,x,1.1,1.45,[.4,.65,.4]);mesh(root,geo(new T.TorusGeometry(.42,.04,8,40)),gold,x,1.44,1.45).rotation.x=Math.PI/2;for(let i=0;i<5;i++){const xx=x+(i-2)*.13;line(root,[[x,1.4,1.45],[xx,1.8,1.45],[xx,2.1+Math.sin(i)*.2,1.45]],gold,.012,12);ell(root,gold,xx,2.1+Math.sin(i)*.2,1.45,.06,.12,.045);}}
 // Immutable geometry batches retain independently meaningful sculpted groups.
 function colorize(g){const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=.94+.035*Math.sin(x*33+y*17)*Math.sin(z*29-y*13)+.025*Math.sin(x*7.3+y*11+z*3);c.push(n*.985,n,n*.975);}g.setAttribute('color',new T.Float32BufferAttribute(c,3));return g;}
 function bake(parent,deep=false){parent.updateMatrixWorld(true);const inv=parent.matrixWorld.clone().invert(),objects=[];if(deep)parent.traverse(o=>{if(o.isMesh)objects.push(o);});else objects.push(...parent.children);const rows=new Map();for(const o of objects)if(o.isMesh&&!o.isInstancedMesh){const transform=inv.clone().multiply(o.matrixWorld),g=colorize((o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(transform)),list=rows.get(o.material)||[];list.push(g);rows.set(o.material,list);o.removeFromParent();}for(const [m,parts]of rows){const raw=mergeGeometries(parts),merged=geo(mergeVertices(raw));raw.dispose();parts.forEach(g=>g.dispose());const o=new T.Mesh(merged,m);o.castShadow=o.receiveShadow=true;parent.add(o);}}
 // Instances need the same vertex-color attribute as the batched bronze.
 root.traverse(o=>{if(o.isInstancedMesh&&!o.geometry.attributes.color)colorize(o.geometry);});if(!authoring){for(const g of root.children.filter(o=>o.isGroup))bake(g,true);bake(root);}root.updateMatrixWorld(true);root.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});
 const assets=loadSculpture?createBuddhaAssets({parent:root,fallback:root.getObjectByName('vairocana-daibutsu'),load:sculptureLoader}):null;
 return {root,quality:value=>assets?.quality(value),update:camera=>assets?.update(camera)||false,assetStats:()=>assets?.stats(),dispose(){if(disposed)return;disposed=true;assets?.dispose();root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
