const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1920,height:1080}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto('http://127.0.0.1:8080/?debug=ayothaya');await p.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 const stats=()=>p.evaluate(()=>window.__UTS_WORLD__.visualStats());const shot=async name=>{await p.waitForTimeout(200);await p.screenshot({path:'artifacts/selected-lights/'+name+'.png'});};
 await p.evaluate(()=>{window.__UTS_WORLD__.openingView();window.__UTS_WORLD__.timeOfDay('day');});await shot('city-day');
 await p.evaluate(()=>window.__UTS_WORLD__.timeOfDay('night'));await shot('city-night');
 assert.deepEqual((await stats()).world.lanterns.models,{L013:2,L047:32,L026:2,L027:2,L241:4});
 assert.deepEqual((await stats()).interior.chandeliers.models,{L233:2,L238:2});assert.equal((await stats()).world.lanterns.lit,58);
 async function pose(area,position,rotation){await p.evaluate(async({area,position,rotation})=>{const w=window.__UTS_WORLD__;await w.visitCampus(area,true);const s=w.snapshot(),v=['city','lobby'].includes(area)?s.world:s.interior;v.position=position;v.rotation=[...rotation,'YXZ'];await w.restore(s);},{area,position,rotation});}
 await pose('city',[-24,.225,9],[0,0,0]);await shot('village-night');
 await pose('city',[-1.25,.5,12.8],[0,Math.PI/2,0]);await shot('harbor-night');
 await pose('city',[3,1.1,1],[-.1,0,0]);await shot('market-night');
 await pose('city',[12,1.05,-20],[0,0,0]);await shot('temple-night');
 await pose('museum',[-12,1.5,0],[0,-Math.PI/2,0]);await shot('library-wall');
 const before=await p.evaluate(()=>window.__UTS_WORLD__.snapshot().interior.position);await p.keyboard.down('w');await p.waitForTimeout(1500);await p.keyboard.up('w');const after=await p.evaluate(()=>window.__UTS_WORLD__.snapshot());assert.equal(after.area,'museum');assert(after.interior.position[0]<-9.3,'sealed wall remains impassable');assert(after.interior.position[0]>before[0],'walked toward former door');
 await pose('museum',[-39,1.5,7.8],[.2,0,0]);await shot('library-chandelier');assert.equal((await stats()).interior.chandeliers.activeLights,2);
 await pose('datacenter',[-5.2,1.5,8.2],[.45,.7,0]);await shot('datacenter-chandelier');assert.equal((await stats()).interior.chandeliers.activeLights,2);
 await p.evaluate(()=>window.__UTS_WORLD__.visitCampus('lobby',true));await shot('temple-chandeliers');assert.equal((await stats()).world.lanterns.activeLights,4);
 await p.evaluate(()=>window.__UTS_WORLD__.timeOfDay('day'));assert.equal((await stats()).world.lanterns.lit,0);
 fs.writeFileSync('artifacts/selected-lights/browser-results.json',JSON.stringify({stats:await stats(),errors},null,2));assert.deepEqual(errors,[]);console.log('PASS seven selected assets, day/night, scene-isolated lights, sealed library wall and clear interior headroom.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
