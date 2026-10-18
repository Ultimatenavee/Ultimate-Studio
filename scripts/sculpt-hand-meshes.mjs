// Development-only sculpt bake. No voxelization or mesh simplification runs in a browser.
import * as T from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {SimplifyModifier} from 'three/addons/modifiers/SimplifyModifier.js';
import fs from 'node:fs';
const min=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
function ell(x,y,z,c,r){x-=c[0];y-=c[1];z-=c[2];const k0=Math.hypot(x/r[0],y/r[1],z/r[2]),k1=Math.hypot(x/(r[0]*r[0]),y/(r[1]*r[1]),z/(r[2]*r[2]));return k1>1e-9?k0*(k0-1)/k1:-Math.min(...r);}
function cap(x,y,z,a,b,r0,r1){const vx=b[0]-a[0],vy=b[1]-a[1],vz=b[2]-a[2],dx=x-a[0],dy=y-a[1],dz=z-a[2],t=T.MathUtils.clamp((dx*vx+dy*vy+dz*vz)/(vx*vx+vy*vy+vz*vz),0,1);return Math.hypot(dx-vx*t,dy-vy*t,dz-vz*t)-(r0+(r1-r0)*t);}
function fingerPaths(pose){
 const xs=[-.132,-.048,.041,.125],lengths=[.225,.292,.322,.278],radii=[.029,.033,.035,.033],paths=[];
 for(let i=0;i<4;i++){const x=xs[i],l=lengths[i],base=.13+(i===0?-.025:0),curl=pose==='cupped'?(i===2?.235:.090):pose==='relaxed'?.080:i===2?.070:.025;
  const points=[[x,base-.045,0],[x,base+.045,.001],[x*1.04,base+l*.51,curl*.18],[x*1.055,base+l*.82,curl*.57],[x*1.04,base+l*(pose==='cupped'&&i===2?.81:.98),curl]];
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments=[];for(let j=0;j<16;j++){const a=curve.getPoint(j/16).toArray(),b=curve.getPoint((j+1)/16).toArray(),r=radii[i];segments.push([a,b,r*(1-.25*j/16),r*(1-.25*(j+1)/16)]);}paths.push({name:['little','ring','middle','index'][i],segments,tip:curve.getPoint(1).toArray()});
 }
 const thumb=new T.CatmullRomCurve3([[.105,-.10,.003],[.185,-.035,.006],[.239,.027,.020],[.263,.099,.039],[.252,.148,.046]].map(p=>new T.Vector3(...p))),segments=[];for(let j=0;j<18;j++)segments.push([thumb.getPoint(j/18).toArray(),thumb.getPoint((j+1)/18).toArray(),.055*(1-.53*j/18),.055*(1-.53*(j+1)/18)]);paths.push({name:'thumb',segments,tip:thumb.getPoint(1).toArray()});return paths;
}
function weldAndSmooth(raw){raw.deleteAttribute('normal');let g=mergeVertices(raw,1e-5);const p=g.attributes.position,idx=g.index.array,neighbors=Array.from({length:p.count},()=>new Set());for(let i=0;i<idx.length;i+=3){const [a,b,c]=idx.slice(i,i+3);neighbors[a].add(b).add(c);neighbors[b].add(a).add(c);neighbors[c].add(a).add(b);}for(let pass=0;pass<4;pass++)for(const strength of [.35,-.36]){const src=p.array.slice();for(let i=0;i<p.count;i++){const row=neighbors[i];if(!row.size)continue;for(let j=0;j<3;j++){let avg=0;for(const q of row)avg+=src[q*3+j];p.array[i*3+j]=src[i*3+j]+strength*(avg/row.size-src[i*3+j]);}}}g.computeVertexNormals();return g;}
const output={};for(const pose of ['blessing','cupped','relaxed']){
 const paths=fingerPaths(pose),mc=new MarchingCubes(104,new T.MeshBasicMaterial(),false,false,80000);mc.isolation=0;const n=mc.size;
 for(let iz=0;iz<n;iz++)for(let iy=0;iy<n;iy++)for(let ix=0;ix<n;ix++){
  const x=(ix/n-.5),y=iy/n-.5+.10,z=iz/n-.5;let d=ell(x,y,z,[0,-.025,0],[.173,.213,.062]);d=min(d,ell(x,y,z,[.095,-.066,.024],[.083,.128,.051]),.027);d=min(d,ell(x,y,z,[-.102,-.075,.011],[.065,.126,.045]),.025);d=min(d,cap(x,y,z,[0,-.274,-.006],[0,-.12,0],.078,.104),.026);
  for(const f of paths){let q=1;for(const [a,b,r0,r1]of f.segments)q=Math.min(q,cap(x,y,z,a,b,r0,r1));d=min(d,q,f.name==='thumb'?.026:.016);}
  mc.field[iz*n*n+iy*n+ix]=-d;
 }
 mc.update();const raw=new T.BufferGeometry();raw.setAttribute('position',new T.Float32BufferAttribute(mc.geometry.attributes.position.array.slice(0,mc.count*3),3));raw.scale(.5,.5,.5);raw.translate(0,.10,0);const g=weldAndSmooth(raw);raw.dispose();
 for(const [lod,target]of (pose==='relaxed'?[['walking',2000]]:[['detail',6800],['walking',2000]])){const ratio=Math.min(1,target/(g.index.count/3)),optimized=await new SimplifyModifier().modify(g,Math.floor(g.attributes.position.count*(1-ratio)));optimized.computeVertexNormals();output[pose+'-'+lod]={p:Array.from(optimized.attributes.position.array,n=>+n.toFixed(6)),i:Array.from(optimized.index.array),tips:paths.map(({name,tip})=>({name,tip})),wrist:[0,-.255,0]};console.log(pose,lod,optimized.index.count/3);optimized.dispose();}
 g.dispose();mc.geometry.dispose();mc.material.dispose();
}
fs.writeFileSync(new URL('../src/datacenter/sculpt-data/hands.json',import.meta.url),JSON.stringify(output));
