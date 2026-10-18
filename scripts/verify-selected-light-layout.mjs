import fs from 'node:fs';
import assert from 'node:assert/strict';
import {CITY_LANTERNS,CITY_STRINGS,CITY_LIGHT_SOURCES,INDOOR_CHANDELIERS} from '../src/datacenter/ayothaya-decor-layout.js';
import {decodeNavigation,gridSample,cityCanStand,CITY_SPAWN} from '../src/datacenter/ayothaya-navigation.js';
const nav=decodeNavigation(JSON.parse(fs.readFileSync('web/assets/ayothaya/navigation.json'))),n=nav.width*nav.height,walk=new Uint8Array(n),points=[];
for(let i=0;i<n;i++){const x=(i%nav.width+.5-nav.width/2)*nav.cell,z=(nav.height/2-Math.floor(i/nav.width)-.5)*nav.cell;points[i]={x,z};walk[i]=cityCanStand(nav,x,z);}
const q=[gridSample(nav,CITY_SPAWN.x,CITY_SPAWN.z).index],seen=new Uint8Array(n);seen[q[0]]=1;
for(let k=0;k<q.length;k++)for(const d of [-1,1,-nav.width,nav.width]){const i=q[k],j=i+d;if(j<0||j>=n||Math.abs(d)===1&&Math.floor(j/nav.width)!==Math.floor(i/nav.width)||seen[j]||!walk[j])continue;seen[j]=1;q.push(j);}
const distances=q.map(i=>Math.min(...CITY_LIGHT_SOURCES.map(p=>Math.hypot(points[i].x-p.x,points[i].z-p.z)))),maxDistance=Math.max(...distances);
assert(maxDistance<8,'every reachable walking cell is inside the 10 m warm fill radius, with 2 m margin');
const catalogue=JSON.parse(fs.readFileSync('web/assets/ayothaya/light-catalog/catalog.json'));
const used=new Set([...CITY_LIGHT_SOURCES,...Object.values(INDOOR_CHANDELIERS).flat()].map(p=>p.id));assert.deepEqual([...used].sort(),['L013','L026','L027','L047','L107','L233','L238','L241']);
for(const id of used){const a=catalogue.items.find(p=>p.id===id);assert.equal(a.status,'ready');assert(fs.statSync('web/assets/ayothaya/light-catalog/'+a.file).size>10000);}
for(const s of CITY_STRINGS){const [a,b]=s.ends.map(i=>CITY_LANTERNS[i]),span=Math.hypot(b.x-a.x,b.z-a.z);assert(3.8-span*.127233>2.7,'string lamps have standing headroom');assert.equal(a.id,'post');assert.equal(b.id,'post');}
for(const p of Object.values(INDOOR_CHANDELIERS).flat()){assert(p.y>=2.8);assert(p.y+p.height<p.ceiling);}
const report={reachableCells:q.length,coveredCells:distances.filter(d=>d<8).length,maxDistance,fieldRadius:10,models:Object.fromEntries([...used].map(id=>[id,CITY_LANTERNS.filter(p=>p.id===id).length+CITY_STRINGS.filter(p=>p.id===id).length+Object.values(INDOOR_CHANDELIERS).flat().filter(p=>p.id===id).length])),supports:CITY_LANTERNS.length};
fs.mkdirSync('artifacts/selected-lights',{recursive:true});fs.writeFileSync('artifacts/selected-lights/coverage.json',JSON.stringify(report,null,2));console.log('PASS selected light layout',report);
