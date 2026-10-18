const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const output=path.resolve('artifacts/ayothaya-visuals');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 const boot=async()=>{await page.goto('http://127.0.0.1:8080/?debug=ayothaya');await page.waitForFunction(()=>!!window.__UTS_WORLD__,null,{timeout:90000});};
 const shot=async name=>{await page.waitForTimeout(250);await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});};
 await boot();await page.evaluate(()=>window.__UTS_WORLD__.timeOfDay('day'));
 await shot('city-day-overview');await page.locator('#walkMode').click();await page.waitForTimeout(300);
 const day=await page.evaluate(()=>({snapshot:window.__UTS_WORLD__.snapshot(),visual:window.__UTS_WORLD__.visualStats()}));
 assert.equal(day.visual.world.eyeHeight,1.05);assert.equal(day.visual.interior.eyeHeight,1.5);
 assert.equal(day.visual.world.decor.props,9);assert.equal(day.visual.world.decor.portals,4);assert.equal(day.visual.interior.decor.props,15);assert.equal(day.visual.interior.decor.portals,2);assert.equal(day.visual.interior.decor.sprites,2);
 await shot('city-day-walk');
 await page.locator('.ayothaya-sky-toggle').click();assert.equal(await page.locator('.ayothaya-sky-toggle').getAttribute('aria-pressed'),'true');
 const night=await page.evaluate(()=>window.__UTS_WORLD__.snapshot());assert.equal(night.timeOfDay,'night');assert.deepEqual(night.world.position,day.snapshot.world.position,'sky toggle preserves walking pose');assert.equal(night.interior.selected,day.snapshot.interior.selected);
 await shot('city-night-walk');await page.evaluate(()=>window.__UTS_WORLD__.overview());await shot('city-night-overview');
 // Frame progression is real ACT timing and stops with reduced motion.
 await page.evaluate(()=>window.__UTS_WORLD__.motion(true));
 const frame=()=>page.evaluate(()=>window.__UTS_WORLD__.visualStats().world.decor.frames[0].frame);
 const before=await frame();await page.waitForTimeout(450);assert.notEqual(await frame(),before);
 await page.evaluate(()=>window.__UTS_WORLD__.motion(false));await page.waitForTimeout(100);const still=await frame();await page.waitForTimeout(400);assert.equal(await frame(),still);
 for(const area of ['lobby','museum','datacenter']){await page.evaluate(area=>window.__UTS_WORLD__.visitCampus(area,true),area);await shot(area+'-walk');await page.evaluate(()=>window.__UTS_WORLD__.overview());await shot(area+'-overview');}
 await page.evaluate(()=>window.__UTS_WORLD__.visitCampus('city',true));assert.equal(await page.evaluate(()=>window.__UTS_WORLD__.snapshot().timeOfDay),'night','choice survives all room transitions');
 await boot();assert.equal(await page.evaluate(()=>window.__UTS_WORLD__.snapshot().timeOfDay),'night','choice survives reload');
 await page.setViewportSize({width:390,height:844});await shot('mobile-night');const button=await page.locator('.ayothaya-sky-toggle').boundingBox();assert(button.x>=0&&button.x+button.width<=390&&button.height>=40);
 await page.locator('.ayothaya-sky-toggle').click();assert.equal(await page.evaluate(()=>window.__UTS_WORLD__.snapshot().timeOfDay),'day');await shot('mobile-day');
 console.log('VISUALS',day.visual);console.log('ERRORS',errors,'FAILED_HTTP',failed);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS day/night toggle and persisted preference, unchanged navigation/rack selection, calibrated eye height, actual ACT animation and reduced motion, all room decorations, mobile toggle.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
