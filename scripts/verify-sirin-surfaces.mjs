import fs from 'node:fs';
import assert from 'node:assert/strict';
const base='web/assets/sirin/',manifest=JSON.parse(fs.readFileSync(base+'capital-manifest.json'));
const terrain=JSON.parse(fs.readFileSync(base+'terrain-triangles.json')).map(t=>({...t,b:[Math.min(...t.xy.map(p=>p[0])),Math.min(...t.xy.map(p=>p[1])),Math.max(...t.xy.map(p=>p[0])),Math.max(...t.xy.map(p=>p[1]))]}));
function clip(poly,axis,edge,greater){
 const out=[];if(!poly.length)return out;
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],inside=p=>greater?p[axis]>=edge:p[axis]<=edge,ia=inside(a),ib=inside(b);
  if(ia)out.push(a);
  if(ia!==ib){const t=(edge-a[axis])/(b[axis]-a[axis]);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
 }
 return out;
}
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
const lamps=JSON.parse(fs.readFileSync(base+'lighting-layout.json')).added.map((p,i)=>({object:'Additional lamp '+i,surface:p.surface,envelope:[p.bounds[0],-p.bounds[3],p.bounds[1],-p.bounds[2]]}));
for(const object of [...manifest.placements,...manifest.characters,...lamps]){
 const b=object.envelope;assert(b?.length===4&&b.every(Number.isFinite));let covered=0;
 for(const t of terrain){
  if(t.b[2]<b[0]||t.b[0]>b[2]||t.b[3]<b[1]||t.b[1]>b[3])continue;
  if((t.mat==='RO_Grass_surface'?'grass':'paved')!==object.surface)continue;
  let poly=t.xy;for(const [axis,edge,greater]of [[0,b[0],true],[0,b[2],false],[1,b[1],true],[1,b[3],false]])poly=clip(poly,axis,edge,greater);
  covered+=area(poly);
 }
 const expected=(b[2]-b[0])*(b[3]-b[1]);
 assert(Math.abs(covered-expected)<Math.max(.006,expected*1e-6),`${object.object} straddles surfaces: ${expected-covered} m²`);
}
assert.equal(manifest.version,5);assert(manifest.placements.length>1400);assert(manifest.new_asset_types_used>=20);
const bytes=fs.readFileSync(base+'capital.glb');assert(bytes.length<12*1024*1024,'mobile download budget');
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
assert(gltf.extensionsUsed.includes('EXT_mesh_gpu_instancing'),'repeat props must be instanced');
assert(gltf.images.every(i=>!i.uri),'all texture artwork is embedded; no game installation needed');
console.log(`PASS exact triangle/rectangle coverage: ${manifest.placements.length} models + ${manifest.characters.length} citizens + ${lamps.length} additional lamps stay entirely on their assigned surface; instanced self-contained asset ${(bytes.length/1e6).toFixed(2)} MB.`);
