const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/ragnarok-life/')&&!r.ok())failed.push(r.url());});
 await page.goto((process.env.UTS_TEST_URL||'http://127.0.0.1:8080/')+'?debug=ayothaya');await page.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 await page.evaluate(()=>window.__UTS_WORLD__.visitCampus('capital',false));
 const life=()=>page.evaluate(()=>window.__UTS_WORLD__.visualStats().world.decor.life);
 assert.equal((await life()).count,120);assert.equal((await life()).retiredStaticBatches,10);assert.equal((await life()).shadowBatches,1);
 assert.equal((await life()).actors.filter(a=>a.rank==='mvp').length,8);assert.equal((await life()).actors.filter(a=>a.kind==='monster').length,78);
 const out='artifacts/ragnarok-life-qa';fs.mkdirSync(out,{recursive:true});
 await page.evaluate(()=>window.__UTS_WORLD__.motion(false));const person=(await life()).actors.find(a=>a.name==='CITIZEN_ThaiMan_5.001');
 const pose=async(p,heading,range=3)=>{await page.evaluate(async({p,heading,range})=>{const w=window.__UTS_WORLD__,s=w.snapshot();s.world.drone=null;s.world.walking=false;s.world.position=[p[0]+Math.sin(heading)*range,range>3?3.6:2.1,p[2]+Math.cos(heading)*range];s.world.target=[p[0],range>3?1.3:.9,p[2]];s.world.fov=48;await w.restore(s);},{p,heading,range});await page.waitForTimeout(150);};
 const directions=[];
 for(let i=0;i<8;i++){await pose(person.position,i*Math.PI/4);const a=(await life()).actors.find(a=>a.name===person.name);directions.push(a.direction);await page.screenshot({path:out+'/npc-view-'+i+'.png'});}
 assert(new Set(directions).size>=7,'camera circling reveals front/side/back sprite poses');
 const frozen=await life();await page.waitForTimeout(500);assert.deepEqual((await life()).actors.map(a=>[a.frame,a.position]),frozen.actors.map(a=>[a.frame,a.position]),'animation and roaming pause');
 await page.evaluate(()=>window.__UTS_WORLD__.motion(true));await page.waitForTimeout(1200);const active=await life();
 assert(active.actors.some((a,i)=>a.frame!==frozen.actors[i].frame),'ACT frames animate');assert(active.actors.some((a,i)=>a.kind==='monster'&&Math.hypot(a.position[0]-frozen.actors[i].position[0],a.position[2]-frozen.actors[i].position[2])>.05),'monsters walk');
 for(const boss of active.actors.filter(a=>a.rank==='mvp')){await pose(boss.position,.3,7);await page.screenshot({path:out+'/boss-'+boss.id+'.png'});}
 // Staff in front of Lotus Nexus face the forecourt and welcome a nearby walker.
 await page.evaluate(async()=>{const w=window.__UTS_WORLD__;await w.visitCampus('capital',true);const s=w.snapshot();s.world.position=[66,1.5,-43];s.world.rotation=[0,Math.PI/2,0,'YXZ'];await w.restore(s);});
 await page.waitForTimeout(1900);const staff=(await life()).actors.find(a=>a.name==='CITIZEN_Scientist_29.001');assert(staff.attending);assert(Math.cos(staff.heading-Math.PI/2)>.98,'staff turns toward the visitor');
 await page.screenshot({path:out+'/lotus-staff-welcome.png'});await page.evaluate(()=>window.__UTS_WORLD__.visitCampus('capital',false));await page.waitForTimeout(1600);
 const reset=(await life()).actors.find(a=>a.name===staff.name);assert(!reset.attending);assert(Math.cos(reset.heading-reset.baseHeading)>.999,'overview leaves staff facing forecourt');
 const creature=active.actors.find(a=>a.kind==='monster');await pose(creature.position,0);await page.screenshot({path:out+'/monster.png'});
 for(const [name,width,height]of [['phone',390,844],['ipad',1180,820]]){await page.setViewportSize({width,height});await pose(creature.position,Math.PI/2);await page.screenshot({path:out+'/'+name+'.png'});}
 for(const room of ['museum','datacenter']){await page.evaluate(r=>window.__UTS_WORLD__.visitCampus(r,true),room);await page.waitForTimeout(150);const stats=await page.evaluate(()=>window.__UTS_WORLD__.visualStats().interior);assert.equal(stats.decor.life.count,2);await page.screenshot({path:out+'/'+room+'.png'});}
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS 120 occupants, 78 monsters including eight MVP, public-facing staff and smooth visitor attention, eight camera views, animation, pause, phone/iPad and indoor staff.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
