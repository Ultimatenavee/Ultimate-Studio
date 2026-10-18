const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const context=await browser.newContext({viewport:{width:1440,height:960},hasTouch:true}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
const url=(process.env.UTS_TEST_URL||'http://127.0.0.1:8080/')+'?debug=ayothaya';await p.goto(url);await p.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
await p.evaluate(()=>window.__UTS_WORLD__.visitCampus('capital',true));await p.locator('#walkMenuToggle').click();await p.locator('#walkRunSpeed').selectOption('20');assert.equal(await p.evaluate(()=>window.__UTS_WORLD__.sprintSpeed()),20);assert.match(await p.locator('#walkSprint').innerText(),/20/);await p.locator('#walkMenuToggle').click();
for(const [area,x,z] of [['city',12,-22],['capital',0,100],['lobby',0,4],['museum',-39,5],['datacenter',0,7]]){
 await p.evaluate(area=>window.__UTS_WORLD__.visitCampus(area,true),area);await p.waitForFunction(area=>window.__UTS_WORLD__.currentArea()===area,area);await p.waitForTimeout(100);
 const q=await p.evaluate(({x,z})=>window.__UTS_WORLD__.mapView().point(x,z),{x,z}),b=await p.locator('.walk-minimap-map svg').boundingBox();
 await p.mouse.click(b.x+q.x*b.width/320,b.y+q.y*b.height/320);await p.waitForTimeout(100);
 const v=await p.evaluate(()=>{const w=window.__UTS_WORLD__,s=w.snapshot();return {area:w.currentArea(),position:(['museum','datacenter'].includes(s.area)?s.interior:s.world).position,speed:w.sprintSpeed()}});
 assert.equal(v.area,area);assert(Math.hypot(v.position[0]-x,v.position[2]-z)<.05,area+' click teleports to exact clear point');assert.equal(v.speed,20);
 const tr=await p.locator('#walkMiniPlayer').getAttribute('transform');assert(tr.includes('translate('));
}
await p.evaluate(()=>window.__UTS_WORLD__.visitCampus('capital',true));
const measure=async fast=>{await p.evaluate(async fast=>{const w=window.__UTS_WORLD__;w.teleport(0,100);const s=w.snapshot();s.world.rotation=[0,0,0,'YXZ'];await w.restore(s);},fast);await p.waitForTimeout(100);if(fast)await p.keyboard.down('Shift');await p.keyboard.down('w');await p.waitForTimeout(280);await p.keyboard.up('w');await p.keyboard.up('Shift');return p.evaluate(()=>100-window.__UTS_WORLD__.snapshot().world.position[2]);};
const normal=await measure(false),fast=await measure(true);assert(fast>normal*8,`actual 20x sprint moves faster: ${normal}, ${fast}`);
// A building click lands on a nearby collision-free surface, not inside its walls.
const adjusted=await p.evaluate(()=>window.__UTS_WORLD__.teleport(-73,-70));assert(adjusted);assert(Math.hypot(adjusted.x+73,adjusted.z+70)>.1);
fs.mkdirSync('artifacts/walk-tools',{recursive:true});
for(const [name,width,height]of [['phone',390,844],['phone-landscape',844,390],['ipad',820,1180],['ipad-landscape',1180,820]]){
 await p.setViewportSize({width,height});await p.waitForTimeout(200);
 const map=await p.locator('.walk-minimap').boundingBox();assert(map&&map.x>=0&&map.y>=0&&map.x+map.width<=width+1&&map.y+map.height<=height+1,name+' minimap fits');
 for(const sel of ['#walkJoystick','#walkSprint','#walkJump','.ayothaya-camera-modes','.walk-primary']){const r=await p.locator(sel).boundingBox();assert(!r||Math.min(map.x+map.width,r.x+r.width)<=Math.max(map.x,r.x)||Math.min(map.y+map.height,r.y+r.height)<=Math.max(map.y,r.y),name+' map overlaps '+sel);}
 await p.locator('#walkMenuToggle').tap();assert(await p.locator('#walkRunSpeed').isVisible());await p.locator('#walkRunSpeed').selectOption('12');await p.locator('#walkMenuToggle').tap();
 const q=await p.evaluate(()=>window.__UTS_WORLD__.mapView().point(0,100)),svg=await p.locator('.walk-minimap-map svg').boundingBox();await p.touchscreen.tap(svg.x+q.x*svg.width/320,svg.y+q.y*svg.height/320);const landed=await p.evaluate(()=>window.__UTS_WORLD__.snapshot().world.position);assert(Math.hypot(landed[0],landed[2]-100)<.05,name+' touch map teleports');await p.locator('#walkSprint').tap();assert.equal(await p.locator('#walkSprint').getAttribute('aria-pressed'),'true');await p.locator('#walkSprint').tap();
 await p.screenshot({path:'artifacts/walk-tools/'+name+'.png'});
}
await p.reload();await p.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});assert.equal(await p.evaluate(()=>window.__UTS_WORLD__.sprintSpeed()),12);assert.deepEqual(errors,[]);
console.log('PASS live minimap clicks/marker in five areas, safe blocked-target landing, actual 20x Shift sprint, shared speed across warps and reload, phone/iPad orientations without control overlaps.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
