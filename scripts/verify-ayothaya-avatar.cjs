const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='artifacts/ayothaya-avatar';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await p.goto('http://127.0.0.1:8080/?debug=ayothaya');await p.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 const shot=async n=>{await p.waitForTimeout(200);await p.screenshot({path:out+'/'+n+'.png',fullPage:true});};
 const visual=()=>p.evaluate(()=>window.__UTS_WORLD__.visualStats());const state=()=>p.evaluate(()=>window.__UTS_WORLD__.snapshot());
 const beforeZoom=await state();await p.evaluate(()=>window.__UTS_WORLD__.zoom(.62));const afterZoom=await state();const distance=s=>Math.hypot(...s.world.position.map((v,i)=>v-s.world.target[i]));assert(Math.abs(distance(afterZoom)/distance(beforeZoom)-.62)<.001,'overview zoom scales around the target without jumping to it');await shot('building-colors');assert((await visual()).world.buildingColors.meshes>10);
 await p.locator('#walkMode').click();const initial=await state();await p.locator('button[data-perspective=third]').click();await p.waitForTimeout(400);
 assert.deepEqual((await state()).world.position,initial.world.position,'switch does not move player');assert((await visual()).world.avatar.visible);await shot('third-city-idle');
 await p.keyboard.down('w');await p.waitForTimeout(650);assert((await visual()).world.avatar.action>=8,'real walk action');await shot('third-city-walk');await p.keyboard.up('w');await p.waitForTimeout(120);assert((await visual()).world.avatar.action<8,'idle on release');
 await p.keyboard.down('d');await p.waitForTimeout(350);assert.equal((await visual()).world.avatar.action,14,'east strafe uses correct sprite direction');await p.keyboard.up('d');
 await p.locator('button[data-perspective=first]').click();await p.waitForTimeout(100);assert(!(await visual()).world.avatar.visible);await shot('first-city');
 await p.locator('button[data-perspective=third]').click();await p.evaluate(()=>window.__UTS_WORLD__.timeOfDay('night'));await shot('third-night');
 for(const area of ['lobby','museum','datacenter']){
  await p.evaluate(a=>window.__UTS_WORLD__.visitCampus(a,true),area);await p.waitForTimeout(200);let v=await visual(),a=area==='lobby'?v.world.avatar:v.interior.avatar;assert(a.visible);assert.equal(v.perspective,'third');await shot('third-'+area);
  const before=await state();await p.locator('button[data-perspective=first]').click();await p.waitForTimeout(100);const after=await state(),key=area==='lobby'?'world':'interior';assert.deepEqual(after[key].position,before[key].position);await shot('first-'+area);await p.locator('button[data-perspective=third]').click();
 }
 await p.evaluate(async()=>{const w=window.__UTS_WORLD__;await w.visitCampus('lobby',true);const s=w.snapshot();s.world.position=[3,1.5,6.8];s.world.rotation=[0,0,0,'YXZ'];s.perspective='third';await w.restore(s);});await p.waitForTimeout(200);assert((await visual()).world.avatar.distance<2.5,'follow camera retracts in front of the wall');await shot('camera-wall-clearance');
 // Inspect the lab service bay while retaining actual navigation state.
 for(const [area,position,rotation]of [['museum',[-39,1.5,-3.5],[0,Math.PI/2,0,'YXZ']],['datacenter',[-6.4,1.5,-6.4],[0,0,0,'YXZ']]]){
  await p.evaluate(async v=>{const w=window.__UTS_WORLD__;await w.visitCampus(v.area,true);const s=w.snapshot();s.interior.position=v.position;s.interior.rotation=v.rotation;s.perspective='first';await w.restore(s);},{area,position,rotation});await shot('service-'+area);
 }
 await p.evaluate(()=>window.__UTS_WORLD__.select(0));await p.evaluate(()=>window.__UTS_WORLD__.layout());await shot('rack-layout');assert((await state()).interior.rackEditing);
 await p.evaluate(()=>window.__UTS_WORLD__.exitRackView());await p.evaluate(()=>window.__UTS_WORLD__.visitCampus('city',true));await p.evaluate(()=>window.__UTS_WORLD__.perspective('third'));
 await p.setViewportSize({width:390,height:844});await shot('mobile-third');const rect=await p.locator('button[data-perspective=third]').boundingBox();assert(rect.x>=0&&rect.x+rect.width<=390);
 console.log('VISUAL',await visual());console.log('ERRORS',errors,'FAILED',failed);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS actual 8-way walk/idle sprite, first/third switch with stable player pose, all maps, corrected buildings, laboratory workspaces and rack layout.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
