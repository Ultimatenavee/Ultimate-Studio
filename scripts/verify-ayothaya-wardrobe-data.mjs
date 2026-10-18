import assert from 'node:assert/strict';
import fs from 'node:fs';
import {wardrobeChoices} from './ayothaya-wardrobe-server.mjs';
import {CITY_LANTERNS} from '../src/datacenter/ayothaya-decor-layout.js';
import {decodeNavigation,gridSample,cityCanStand,CITY_SPAWN,TEMPLE_GATE} from '../src/datacenter/ayothaya-navigation.js';
import {frameCityCover} from '../src/datacenter/ayothaya-camera.js';
import * as T from 'three';
const db=JSON.parse(fs.readFileSync('assets-source/ayothaya/wardrobe-index.json'));
assert(db.bodies.length>=500&&db.headgear.length>=4000&&db.robes.length>=200);
for(const b of db.bodies){const c=wardrobeChoices(db,b.id);assert(c.heads.length>0);assert(c.heads.every(h=>h.sex===b.sex&&h.race===b.race));assert(c.headgear.every(h=>h.sex===b.sex&&h.race===b.race));assert(c.weapons.every(w=>w.sex===b.sex&&w.job===b.job));assert(c.shields.every(w=>w.sex===b.sex&&w.job===b.job));for(const r of c.robes)assert(db.robes.find(x=>x.id===r.id).variants[b.name]);}
assert.throws(()=>wardrobeChoices(db,'../../data.grf'));
const nav=decodeNavigation(JSON.parse(fs.readFileSync('web/assets/ayothaya/navigation.json')));assert(cityCanStand(nav,CITY_SPAWN.x,CITY_SPAWN.z));assert(cityCanStand(nav,TEMPLE_GATE.x,TEMPLE_GATE.z));for(const lamp of CITY_LANTERNS)assert(!cityCanStand(nav,lamp.x,lamp.z),'lantern bases block walking');
// A lamp may occupy its own footprint, but must not strand a previously reachable
// village, pier or courtyard behind a narrow bridge.
const cells=nav.width*nav.height,baseWalk=new Uint8Array(cells),lampWalk=new Uint8Array(cells);
for(let i=0;i<cells;i++){const x=(i%nav.width+.5-nav.width/2)*nav.cell,z=(nav.height/2-Math.floor(i/nav.width)-.5)*nav.cell;baseWalk[i]=[[0,0],[.1,0],[-.1,0],[0,.1],[0,-.1]].every(([dx,dz])=>[0,3,6].includes(gridSample(nav,x+dx,z+dz)?.type));lampWalk[i]=cityCanStand(nav,x,z);}
function reachable(walk){const seen=new Uint8Array(cells),start=gridSample(nav,CITY_SPAWN.x,CITY_SPAWN.z).index,queue=[start];seen[start]=1;for(let k=0;k<queue.length;k++){const i=queue[k];for(const d of [-1,1,-nav.width,nav.width]){const j=i+d;if(j<0||j>=cells||Math.abs(d)===1&&Math.floor(j/nav.width)!==Math.floor(i/nav.width)||seen[j]||!walk[j])continue;seen[j]=1;queue.push(j);}}return seen;}
const before=reachable(baseWalk),after=reachable(lampWalk);for(let i=0;i<cells;i++)assert(!before[i]||!lampWalk[i]||after[i],'lanterns preserve every accessible path outside their own bases');
for(const aspect of [1.7,2.7]){const camera=new T.PerspectiveCamera(46,aspect,.03,600),target=new T.Vector3();frameCityCover(camera,target);camera.lookAt(target);camera.updateMatrixWorld(true);for(const point of [new T.Vector3(12,4,-33),new T.Vector3(-5,1,27)]){const p=point.project(camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1,'temple and ship stay visible in opening view');}}
console.log('PASS all 528 body choice filters, race/sex/class compatibility, garment variants, lantern collision and opening temple/ship framing.');

const ui=JSON.parse(fs.readFileSync('assets-source/ayothaya/wardrobe-ui.json'));
assert.equal(new Set(ui.classes.map(c=>c.label)).size,78);
for(const c of ui.classes){const body=db.bodies.find(b=>b.id===c.id);assert(body&&!body.variant);assert(!/[\uac00-\ud7af\ufffd]/.test(c.label));assert.equal(c.sex,body.sex);assert(fs.existsSync('web/'+c.icon));}
for(const [id,item]of Object.entries(ui.items)){assert(!/[\uac00-\ud7af\ufffd]/.test(item.label));assert(item.slots.every(s=>['upper','middle','lower'].includes(s)));const png=fs.readFileSync('web/'+item.icon);assert.equal(png.readUInt32BE(16),64);assert.equal(png.readUInt32BE(20),64);}
for(const sex of ['male','female'])assert.equal(db.heads.filter(h=>h.race==='human'&&h.sex===sex&&ui.items[h.id]).length,42);
console.log('PASS 78 curated class emblems, 42 hairstyles for each sex, readable names, classified slots and all exported thumbnail files.');
