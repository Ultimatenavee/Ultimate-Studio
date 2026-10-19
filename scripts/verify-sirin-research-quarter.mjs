import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {researchNavigation,installResearchQuarter} from '../src/datacenter/sirin-research-quarter.js';
import {capitalCanStand,capitalStep,CAPITAL_ROOMS,CAPITAL_RETURNS} from '../src/datacenter/sirin-navigation.js';
const base='web/assets/sirin/',layout=JSON.parse(fs.readFileSync(base+'labs/layout.json'));
const old=JSON.parse(fs.readFileSync(base+'ground-navigation.json')),nav=researchNavigation(old,layout);
assert.equal(layout.buildings.length,3);assert.equal(layout.replaces.length,5);
assert(!layout.replaces.includes('V03_Tower_019.002'),'energy tower retained');
assert(layout.replaces.includes('V01_Lab_009.002'),'old datacenter replaced');
assert(nav.footprints.some(f=>f.object==='V03_Tower_019.002'),'original tower collision retained');
assert.equal(nav.colliders.length,nav.footprints.length);
for(const name of layout.replaces)assert(!nav.footprints.some(f=>f.object===name),'retired building collision removed');
for(const p of [[0,-1],[-71,-1],[57,-1],[84,-2],[73,-51]])assert(!capitalCanStand(nav,...p),'solid building '+p);
for(const p of [[0,20],[-71,8],[71,-3],[-40,0],[40,0],[73,-38],[73,-43]])assert(capitalCanStand(nav,...p),'plaza, courtyard, bridge and Lotus doorway remain open '+p);
for(const p of [...Object.values(CAPITAL_ROOMS),...Object.values(CAPITAL_RETURNS)])assert(capitalCanStand(nav,p.x,p.z),'existing interior approach remains accessible');
const atrium=layout.buildings.find(b=>b.id==='B_Lotus_Nexus').atriumPolygon;
const stop=capitalStep(nav,{x:73,z:-38},0,-30);assert(stop.z>Math.max(...atrium.map(p=>p[1])),'sprint cannot pass through the relocated atrium');
const towerStop=capitalStep(nav,{x:0,z:20},0,-40);assert(towerStop.z>5,'sprint cannot pass through the energy tower');
// Verify individual instance retirement, including objects whose pivot is
// outside the parcel but whose canopy would intersect the new building.
const city=new T.Group(),newRoot=new T.Group(),mesh=new T.InstancedMesh(new T.BoxGeometry(2,2,2),new T.MeshBasicMaterial(),3);
for(const [i,x]of [-71,-97.5,-120].entries())mesh.setMatrixAt(i,new T.Matrix4().makeTranslation(x,1,0));
city.add(mesh);const installed=installResearchQuarter(city,newRoot,layout);
assert.equal(mesh.count,1);assert.equal(installed.stats().retiredInstances,2);
const m=new T.Matrix4();mesh.getMatrixAt(0,m);assert.equal(m.elements[12],-120,'other city instances preserved');
const bytes=fs.readFileSync(base+'labs/research-quarter.glb'),g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
assert(bytes.length<5*1024*1024,'research quarter download budget');assert(g.images.every(i=>!i.uri),'embedded artwork, no game files needed');
assert.equal(g.scenes.length,1,'only authored scene exported');assert(!g.nodes.some(n=>n.name==='Cube'),'no Blender default objects');
for(const b of layout.buildings)assert(g.nodes.some(n=>n.name===b.id),'all three approved concepts shipped');
assert(g.meshes.length<=48,'bounded material batches');
const source='assets-source/sirin-labs/',provenance=JSON.parse(fs.readFileSync(source+'texture-provenance.json'));
assert.deepEqual(JSON.parse(fs.readFileSync(base+'labs/texture-provenance.json')),provenance,'published surface provenance matches source');
assert.equal(provenance.materials.length,16);
for(const material of provenance.materials){
  const png=fs.readFileSync(source+'textures/'+material.material+'.png');
  assert.equal(createHash('sha256').update(png).digest('hex'),material.pngSHA256,'Ragnarok source swatch integrity: '+material.material);
  assert(material.source.startsWith('data\\texture\\'));
  // glTF optimization merges materials with identical source pixels/properties.
  const aliases=provenance.materials.filter(other=>other.pngSHA256===material.pngSHA256).map(other=>'SIRIN_'+other.material);
  assert(g.materials.some(m=>aliases.includes(m.name)&&m.pbrMetallicRoughness?.baseColorTexture),'source texture bound to exported material: '+material.material);
}
console.log('PASS three original Blender buildings, embedded textures, instance replacement, accessible plaza/bridge, solid walls, original portals and asset budget.');
