import fs from 'node:fs';import {inflateSync} from 'node:zlib';import assert from 'node:assert/strict';
const root='web/assets/ayothaya/wardrobe/',db=JSON.parse(inflateSync(fs.readFileSync(root+'catalog.jsonz')).toString()),ids=new Set(db.bodies.map(b=>b.id));
for(const b of db.classes){assert(ids.has(b.id));assert(!/[\uac00-\ud7af\ufffd]/.test(b.label));}
assert(db.classes.some(b=>b.sex==='male'));assert(db.classes.some(b=>b.sex==='female'));
assert(db.mounts.length>=180,'class-compatible mounted bodies are published');
for(const c of db.classes){const mounts=db.mounts.filter(m=>m.classId===c.id);assert(mounts.length,'mount available for '+c.label+'/'+c.sex);for(const m of mounts){assert.equal(m.sex,c.sex);assert.equal(m.race,c.race);assert(!/[\uac00-\ud7af\ufffd]/.test(m.label));}}
const sources=new Set([...['bodies','heads','headgear','weapons','shields','mounts'].flatMap(k=>db[k].map(x=>x.source)),...db.robes.flatMap(r=>Object.values(r.variants))]);
const groups=new Map();for(const source of sources){const pair=db.assets[source];assert(pair,source);assert(fs.existsSync(root+pair[0]),pair[0]);const bucket=pair[1].slice(0,2);if(!groups.has(bucket))groups.set(bucket,JSON.parse(inflateSync(fs.readFileSync(root+'actions/'+bucket+'.jsonz')).toString()));assert(groups.get(bucket)[pair[1]],pair[1]);}
for(const b of db.bodies)assert(db.heads.some(h=>h.sex===b.sex&&h.race===b.race));for(const p of db.palettes)assert.equal(Buffer.from(db.paletteData[p.id]||'','base64').length,1024,p.id);
for(const r of db.robes){assert(r.icon,'Garment icon metadata: '+r.id);assert(fs.existsSync('web/'+r.icon),r.icon);assert(!/[\uac00-\ud7af\ufffd]/.test(r.label));}
console.log('PASS online wardrobe: '+db.classes.length+' class/sex choices, '+sources.size+' independently hosted components, complete compatible hair, palettes and no missing files.');
