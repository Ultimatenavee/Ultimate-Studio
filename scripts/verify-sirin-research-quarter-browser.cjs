const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/sirin/labs/')&&!r.ok())failed.push(r.url());});
 await page.goto((process.env.UTS_TEST_URL||'http://127.0.0.1:8080/')+'?debug=ayothaya');await page.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 const stats=await page.evaluate(()=>window.__UTS_WORLD__.visualStats().world.researchQuarter);
 assert.equal(stats.buildings.length,3);assert(stats.retiredInstances>=4);assert(stats.retiredMeshes>=1);assert(stats.batches<=48);
 const out='artifacts/sirin-labs-qa';fs.mkdirSync(out,{recursive:true});
 const pose=async(position,target)=>{await page.evaluate(async({position,target})=>{const w=window.__UTS_WORLD__;const s=w.snapshot();s.world.drone=null;s.world.walking=false;s.world.position=position;s.world.target=target;s.world.fov=46;await w.restore(s);},{position,target});await page.waitForTimeout(400);};
 for(const [id,x,z]of [['A',-71,0],['B',73,-51],['C',71,0]]){
  await page.evaluate(()=>window.__UTS_WORLD__.timeOfDay('day'));await pose([x+30,23,z+44],[x,6,z]);await page.screenshot({path:out+'/'+id+'-day.png'});
  await page.evaluate(()=>window.__UTS_WORLD__.timeOfDay('night'));await page.screenshot({path:out+'/'+id+'-night.png'});
  assert(await page.evaluate(()=>window.__UTS_WORLD__.visualStats().world.researchQuarter.night));
 }
 await page.evaluate(()=>window.__UTS_WORLD__.timeOfDay('day'));await pose([110,105,155],[0,2,0]);await page.screenshot({path:out+'/square.png'});
 for(const [name,width,height]of [['phone',390,844],['phone-landscape',844,390],['ipad',820,1180],['ipad-landscape',1180,820]]){
  await page.setViewportSize({width,height});await pose([36,30,55],[0,6,-1]);await page.screenshot({path:out+'/'+name+'.png'});
 }
 await page.setViewportSize({width:1440,height:960});
 // Walk under C's elevated bridge: canopy must not become a ground blocker.
 await page.evaluate(async()=>{const w=window.__UTS_WORLD__;await w.visitCampus('capital',true);const s=w.snapshot();s.world.position=[71,1.5,-3];s.world.rotation=[0,Math.PI/2,0,'YXZ'];await w.restore(s);w.focusWalkInput();});
 await page.keyboard.down('KeyW');await page.waitForTimeout(400);await page.keyboard.up('KeyW');assert((await page.evaluate(()=>window.__UTS_WORLD__.snapshot().world.position[0]))<70.7,'walk under bridge');
 // Existing Library and Datacenter rooms still open and return to this city.
 for(const room of ['museum','datacenter']){await page.evaluate(async room=>{const w=window.__UTS_WORLD__;await w.visitCampus(room,true);},room);assert.equal(await page.evaluate(()=>window.__UTS_WORLD__.currentArea()),room);await page.evaluate(()=>window.__UTS_WORLD__.visitCampus('capital',true));}
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS research quarter day/night, all three facades, phone/iPad, bridge walking and existing interiors.',stats);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
