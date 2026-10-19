const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url=(process.env.UTS_TEST_URL||'http://127.0.0.1:8080/')+'?debug=ayothaya';await p.goto(url);await p.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 const state=()=>p.evaluate(()=>window.__UTS_WORLD__.snapshot());let a=await state();assert.equal(a.area,'capital');assert(a.world.drone);assert(!a.world.walking);assert.deepEqual((await p.evaluate(()=>window.__UTS_WORLD__.visualStats().world)).capitalOffset,[0,0,0]);
 await p.waitForTimeout(500);let b=await state();assert(b.world.drone.elapsed>a.world.drone.elapsed);assert.notDeepEqual(b.world.position,a.world.position);
 await p.locator('#dronePause').click();a=await state();await p.waitForTimeout(350);b=await state();assert.deepEqual(b.world.position,a.world.position);
 fs.mkdirSync('artifacts/sirin-drone-qa',{recursive:true});await p.screenshot({path:'artifacts/sirin-drone-qa/opening.png'});
 for(let i=0;i<6;i++){await p.evaluate(i=>window.__UTS_WORLD__.droneShot(i),i);assert.equal((await state()).world.drone.index,i);await p.screenshot({path:'artifacts/sirin-drone-qa/shot-'+i+'.png'});}
 await p.locator('#droneNext').click();assert.equal((await state()).world.drone.index,0);
 await p.locator('#dronePause').click();await p.waitForTimeout(250);assert(!(await state()).world.drone.paused);
 await p.locator('.ayothaya-surface canvas').first().click({position:{x:600,y:300}});assert.equal((await state()).world.drone,null,'manual camera interaction exits flight');
 await p.locator('#droneStart').click();await p.waitForFunction(()=>window.__UTS_WORLD__.snapshot().world.drone&&document.querySelector('.ayothaya-fade').hidden);
 await p.evaluate(()=>window.__UTS_WORLD__.dronePause(true));await p.setViewportSize({width:390,height:844});await p.screenshot({path:'artifacts/sirin-drone-qa/mobile.png'});
 for(const [name,width,height]of [['phone-landscape',844,390],['ipad-portrait',820,1180],['ipad-landscape',1180,820]]){await p.setViewportSize({width,height});await p.waitForTimeout(100);await p.screenshot({path:'artifacts/sirin-drone-qa/'+name+'.png'});const r=await p.locator('#tryWalk').boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height,'walk handoff remains visible '+name);}
 await p.evaluate(()=>window.__UTS_WORLD__.walk(true));assert((await state()).world.walking);assert.equal((await state()).world.drone,null);
 await p.evaluate(()=>window.__UTS_WORLD__.visitCampus('city',false));assert(await p.evaluate(()=>window.__UTS_WORLD__.visualStats().world.homeReady),'connected overview remains accessible');
 assert.deepEqual(errors,[]);
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(url);await reduced.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});assert(await reduced.evaluate(()=>window.__UTS_WORLD__.snapshot().world.drone.paused));await reduced.close();
 console.log('PASS SIRIN-first startup, automatic flight, six shots, pause/resume, manual interruption, walk handoff, shared overview, phone/iPad and reduced motion.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
