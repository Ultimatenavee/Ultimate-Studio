const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.UTS_TEST_URL||'http://127.0.0.1:8080/')+'?debug=ayothaya');
 await p.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 await p.evaluate(async()=>{const w=window.__UTS_WORLD__;await w.visitCampus('capital',true);w.perspective('third');w.timeOfDay('day');w.teleport(96,-44);let s=w.snapshot();s.world.rotation=[0,0,0,'YXZ'];await w.restore(s);w.focusWalkInput();});
 await p.keyboard.down('w');await p.waitForFunction(()=>window.__UTS_WORLD__.snapshot().world.position[2]<-60,null,{timeout:18000});await p.keyboard.up('w');
 let pos=await p.evaluate(()=>window.__UTS_WORLD__.snapshot().world.position);assert(Math.abs(pos[0]-96)<.05);
 await p.evaluate(async()=>{const w=window.__UTS_WORLD__;w.teleport(96,-62);let s=w.snapshot();s.world.rotation=[0,Math.PI/2,0,'YXZ'];await w.restore(s);w.focusWalkInput();});
 await p.keyboard.down('w');await p.waitForFunction(()=>window.__UTS_WORLD__.snapshot().world.position[0]<87,null,{timeout:15000});await p.keyboard.up('w');
 pos=await p.evaluate(()=>window.__UTS_WORLD__.snapshot().world.position);assert(Math.abs(pos[2]+62)<.05);
 fs.mkdirSync('artifacts/footprint-qa',{recursive:true});await p.screenshot({path:'artifacts/footprint-qa/lab-corner.png'});
 const direct=await p.evaluate(()=>window.__UTS_WORLD__.teleport(90,-62));assert(Math.hypot(direct.x-90,direct.z+62)<.05,'minimap teleport must land on the clicked open corner');
 const blocked=await p.evaluate(()=>window.__UTS_WORLD__.teleport(73,-73));assert(!blocked||Math.hypot(blocked.x-73,blocked.z+73)>.5,'building centre is not a valid teleport target');
 assert.deepEqual(errors,[]);console.log('PASS browser keyboard walk through old lab rectangle and around concave corner, direct open-floor teleport and blocked building interior.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
