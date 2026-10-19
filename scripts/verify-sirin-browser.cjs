const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const output='artifacts/sirin-qa';fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/assets/sirin/capital.glb*',route=>route.abort());
 await p.goto((process.env.UTS_TEST_URL||'http://127.0.0.1:8080/')+'?debug=ayothaya');await p.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 const pose=async(area,position,yaw)=>{await p.keyboard.up('Shift');await p.evaluate(async({area,position,yaw})=>{const w=window.__UTS_WORLD__;await w.visitCampus(area,true);let s=w.snapshot(),v=area==='museum'||area==='datacenter'?s.interior:s.world;v.position=position;v.rotation=[0,yaw,0,'YXZ'];await w.restore(s);w.focusWalkInput();},{area,position,yaw});if(process.env.UTS_SPRINT_TEST==='20'){await p.evaluate(()=>window.__UTS_WORLD__.sprintSpeed(20));await p.keyboard.down('Shift');}};
 const waitArea=async area=>{await p.waitForFunction(area=>window.__UTS_WORLD__.currentArea()===area&&document.querySelector('.ayothaya-fade').hidden,area,{timeout:90000});await p.keyboard.up('KeyW');};
 await pose('city',[25.5,1,-4],-Math.PI/2);await p.screenshot({path:output+'/ayothaya-east-gate.png'});
 assert.equal(await p.evaluate(()=>window.__UTS_WORLD__.visualStats().world.capitalLoaded),false,'failed Home preview leaves Ayothaya usable');
 // A failed first download leaves the old town playable and allows a retry.
 await p.keyboard.down('KeyW');
 await p.waitForFunction(()=>!document.querySelector('.ayothaya-fade').hidden);await p.keyboard.up('KeyW');
 await p.waitForFunction(()=>document.querySelector('.ayothaya-fade').hidden,null,{timeout:15000});
 await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>window.__UTS_WORLD__.currentArea()),'city');assert(await p.locator('.ayothaya-fade').isHidden(),'failed warp does not loop');await p.unroute('**/assets/sirin/capital.glb*');
 await pose('city',[25.5,1,-4],-Math.PI/2);await p.keyboard.down('KeyW');await waitArea('capital');
 await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>window.__UTS_WORLD__.currentArea()),'capital','arrival does not bounce');
 await p.screenshot({path:output+'/capital-west-arrival.png'});
 for(const room of ['museum','datacenter']){
  await pose('capital',[room==='museum'?-73:73,1.5,room==='museum'?-51:-38],0);await p.keyboard.down('KeyW');await waitArea(room);
  assert.equal(await p.evaluate(()=>window.__UTS_WORLD__.snapshot().roomOrigin),'capital');
  await pose(room,[room==='museum'?-39:0,1.5,room==='museum'?9:7],Math.PI);await p.keyboard.down('KeyW');await waitArea('capital');
 }
 await p.evaluate(()=>{const w=window.__UTS_WORLD__;w.overview();w.timeOfDay('day');});await p.waitForTimeout(600);await p.screenshot({path:output+'/capital-overview.png'});
 await pose('capital',[-162,1.5,0],-Math.PI/2);await p.evaluate(()=>{const w=window.__UTS_WORLD__;w.perspective('third');w.timeOfDay('night');});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:output+'/mobile-capital.png'});
 for(const id of ['walkJoystick','walkSprint','walkJump'])assert(await p.locator('#'+id).isVisible());
 await p.locator('#walkJump').click();await p.waitForTimeout(110);assert((await p.evaluate(()=>window.__UTS_WORLD__.snapshot().world.position[1]))>1.6);
 await p.waitForTimeout(1000);await p.setViewportSize({width:1366,height:1024});await p.screenshot({path:output+'/ipad-capital.png'});
 await pose('capital',[-166,1.5,0],Math.PI/2);await p.keyboard.down('KeyW');await waitArea('city');await p.waitForTimeout(1000);
 const state=await p.evaluate(()=>window.__UTS_WORLD__.snapshot());assert.equal(state.area,'city');assert.equal(state.timeOfDay,'night');assert.equal(state.perspective,'third');assert(Math.abs(state.world.position[0]-25.5)<.2);
 await p.evaluate(()=>window.__UTS_WORLD__.visitCampus('lobby',true));await p.evaluate(()=>window.__UTS_WORLD__.visitCampus('museum',true));assert.equal(await p.evaluate(()=>window.__UTS_WORLD__.snapshot().roomOrigin),'lobby','original temple route preserved');
 assert.deepEqual(errors,[]);console.log('PASS automatic east/west warps, lazy load failure/retry, no bounce, both room returns, third person/night persistence, phone controls and jump.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
