import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Bundle data for Node without relying on browser import-assertion support.
import {build} from 'esbuild';
const result=await build({entryPoints:['src/datacenter/data.js'],bundle:true,write:false,platform:'node',format:'cjs'});
const context={exports:{}};context.module={exports:context.exports};vm.runInNewContext(result.outputFiles[0].text,context);const {racks,devices,occupied,routeStatus,room}=context.module.exports;
assert.equal(racks.length,24);
assert.equal(racks.filter(r=>r.zone==='gpu').length,6);
assert.equal(racks.flatMap(r=>r.items).filter(i=>i.kind==='gpu').length,24);
const c={window:{}};vm.runInNewContext(fs.readFileSync('web/catalog.js','utf8'),c);
for(const r of racks){const units=new Set();for(const item of r.items){assert(item.u>=1&&item.u+item.size-1<=42);for(let n=item.u;n<item.u+item.size;n++){assert(!units.has(n),r.id+' overlapping U');units.add(n)}if(item.model){const m=devices.find(m=>m.id===item.model),original=c.window.NOAH_CATALOG.find(m=>m.id===item.model);assert(m);assert.equal(item.size,original.rackProfile.occupiedU);for(const image of Object.values(m.images)){assert(fs.existsSync('web/'+image.src));const [x,y,w,h]=image.frame;assert(x>=0&&y>=0&&x+w<=image.width&&y+h<=image.height)}}}assert.equal(units.size,occupied(r));}
assert.equal(routeStatus(true).a,false);assert.equal(routeStatus(true).b,true);assert.equal(routeStatus(true).edgeAvailable,true);assert.equal(routeStatus(false).a,true);
// Each paired row must face its own cold aisle.
for(const r of racks)assert(Math.cos(r.rotation)*(r.aisle-r.z)>0);
const html=fs.readFileSync('web/index.html','utf8'),entry=fs.readFileSync('web/datacenter-entry.js','utf8'),scene=fs.readFileSync('src/datacenter/scene.js','utf8');assert(html.includes('href="studio.html"'));assert(!html.includes('location.replace'));assert(entry.includes('import(')||entry.includes('Promise.resolve().then('));assert(scene.includes('dispose()'));assert(scene.includes('document.hidden'));
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!m[1].startsWith('http'))assert(fs.existsSync('web/'+m[1].split('?')[0]),m[1])}
console.log('Datacenter: 24 racks / four rows / 24 GPU nodes, no U collisions, catalog dimensions/assets, inward-facing aisles, demo A/B states, lazy local assets and Studio entry passed.');

const nav=await import('../src/datacenter/navigation.js');
const boxes=nav.obstacles(racks);
assert(nav.canStand(room.spawn.x,room.spawn.z,boxes,room));
for(const r of racks){assert(!nav.canStand(r.x,r.z,boxes,room));const z=r.z+Math.cos(r.rotation)*1.25;assert(nav.canStand(r.x,z,boxes,room));}
assert(!nav.canStand(room.width/2,0,boxes,room));
assert(nav.canStand(-7,0,boxes,room),'removed cooling cabinet leaves walkable space');
assert(nav.canStand(7,0,boxes,room),'removed power cabinet leaves walkable space');
const first=racks[0],start={x:first.x,z:first.z+1.3};
const hit=nav.walkStep(start,0,-3,boxes,room);assert(hit.z>first.z+.8,'cannot tunnel through a rack');
const diagonal=nav.movement(1,1,0,1/60),forward=nav.movement(1,0,0,1/60);assert(Math.abs(Math.hypot(diagonal.dx,diagonal.dz)-Math.hypot(forward.dx,forward.dz))<1e-9);
assert(Math.abs(nav.movement(1,0,0,10).dz+.09)<1e-9); // cap after suspended tab
const fps=fs.readFileSync('src/datacenter/scene.js','utf8');assert(!fps.includes('requestPointerLock'));assert(!fps.includes('PointerLockControls'));assert(!html.includes('lockMouse'));assert(fps.includes('walkStep'));assert(fps.includes('InstancedMesh'));assert(fps.includes('envTarget.dispose()'));
console.log('Navigation: safe spawn, rack/wall collision, removed cabinet positions are walkable, no tunneling, normalized diagonal speed, suspended-tab delta cap and safe front inspection positions passed.');

const boot=fs.readFileSync('src/datacenter/entry.js','utf8');
assert(boot.includes('showRack(0,false);setLayer();start();'));
assert(boot.includes('scene?.layer({fiber:true,power:true})'));
assert(!html.includes('data-layer='));
assert(!html.includes('id="failPower"'));
assert(html.includes('id="rackPowerDetails"'),'rack power planning is retained');
assert(boot.includes('await waitForStartup(scene.ensureMuseum());'), 'Museum is loaded before presentation');
assert(boot.includes('scene.stopPresentation();await waitForStartup(scene.openingView());scene.renderReady();'), 'Default startup awaits the SIRIN drone opening');
assert(!boot.includes('await scene.startDrone();'),'Drone tour is opt-in');
assert(html.includes('id="rotateOverview" aria-pressed="false"'));
assert(html.includes('WASD / ลูกศร เลื่อนมุมมอง'));
assert(!boot.includes('layerDescription'));
assert(html.includes('id="exploreCampus"'));
assert(!scene.includes('doorMat'));
assert(!html.includes('id="doors"'));
assert(!scene.includes('ArrowHelper'));
assert(!html.includes('data-layer="cooling"'));
assert(!scene.includes('animateAir'));
assert(!scene.includes('simulated-rack-airflow'));
console.log('Defaults: automatic 3D, retired Fiber/Power controls, open racks without doors and removed airflow layer passed.');
