const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const T=await import('three'),browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];let downloads=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/i.test(m.text()))errors.push(m.text());});page.on('request',r=>{if(/capital\.glb/.test(r.url()))downloads++;});
 const url=(process.env.UTS_TEST_URL||'http://127.0.0.1:8080/')+'?debug=ayothaya';
 await page.goto(url);await page.waitForFunction(()=>window.__UTS_WORLD__?.visualStats().world.homeReady,null,{timeout:90000});
 const stats=()=>page.evaluate(()=>window.__UTS_WORLD__.visualStats().world);
 assert.deepEqual((await stats()).visibleMaps,['city','capital']);assert.deepEqual((await stats()).capitalOffset,[232,0,-4]);assert.equal(downloads,1);
 fs.mkdirSync('artifacts/home-world-qa',{recursive:true});await page.evaluate(()=>{window.__UTS_WORLD__.motion(false);window.__UTS_WORLD__.timeOfDay('day');});await page.screenshot({path:'artifacts/home-world-qa/desktop-day.png'});
 await page.evaluate(()=>window.__UTS_WORLD__.timeOfDay('night'));await page.screenshot({path:'artifacts/home-world-qa/desktop-night.png'});assert((await stats()).capitalLanterns.field.enabled);
 // Pick the actual SIRIN geometry in the combined overview.
 const state=await page.evaluate(()=>window.__UTS_WORLD__.snapshot().world),rect=await page.locator('.ayothaya-surface canvas').first().boundingBox(),camera=new T.PerspectiveCamera(state.fov,rect.width/rect.height,.03,5000);
 camera.position.fromArray(state.position);camera.rotation.fromArray(state.rotation);camera.updateMatrixWorld();const pick=new T.Vector3(232,0,56).project(camera);
 await page.mouse.dblclick(rect.x+(pick.x+1)*rect.width/2,rect.y+(1-pick.y)*rect.height/2);await page.waitForFunction(()=>window.__UTS_WORLD__.currentArea()==='capital'&&window.__UTS_WORLD__.isWalking()&&document.querySelector('.ayothaya-fade').hidden);
 assert.deepEqual((await stats()).capitalOffset,[0,0,0]);assert.deepEqual((await stats()).visibleMaps,['capital']);
 const at=await page.evaluate(()=>window.__UTS_WORLD__.teleport(90,-62));assert(Math.hypot(at.x-90,at.z+62)<.05);
 await page.evaluate(()=>window.__UTS_WORLD__.openingView());await page.waitForFunction(()=>window.__UTS_WORLD__.visualStats().world.homeReady);assert.deepEqual((await stats()).capitalOffset,[232,0,-4]);
 await page.locator('[data-enter-city="city"]').click();await page.waitForFunction(()=>window.__UTS_WORLD__.currentArea()==='city'&&window.__UTS_WORLD__.isWalking()&&document.querySelector('.ayothaya-fade').hidden);assert.deepEqual((await stats()).visibleMaps,['city']);
 await page.evaluate(()=>window.__UTS_WORLD__.openingView());
 for(const [name,width,height]of [['phone-portrait',390,844],['phone-landscape',844,390],['ipad-portrait',820,1180],['ipad-landscape',1180,820]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);await page.evaluate(()=>window.__UTS_WORLD__.timeOfDay('day'));await page.screenshot({path:'artifacts/home-world-qa/'+name+'.png'});
  const boxes=await page.locator('[data-enter-city]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(const b of boxes)assert(b.x>=0&&b.y>=0&&b.x+b.w<=width&&b.y+b.h<=height&&b.h>=40,'touch targets stay visible '+name);
  const [a,b]=boxes;assert(a.x+a.w<=b.x+.5||b.x+b.w<=a.x+.5||a.y+a.h<=b.y+.5||b.y+b.h<=a.y+.5,'city buttons do not overlap');
 }
 assert.equal(downloads,1,'preview and walking reuse the same capital asset');assert.deepEqual(errors,[]);
 // An unavailable optional capital download leaves Ayothaya usable, then retries.
 const fallback=await browser.newPage();await fallback.route('**/assets/sirin/capital.glb*',r=>r.abort());await fallback.goto(url);await fallback.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});assert.equal(await fallback.evaluate(()=>window.__UTS_WORLD__.visualStats().world.capitalLoaded),false);
 await fallback.unroute('**/assets/sirin/capital.glb*');await fallback.evaluate(()=>window.__UTS_WORLD__.openingView());await fallback.waitForFunction(()=>window.__UTS_WORLD__.visualStats().world.homeReady,null,{timeout:90000});await fallback.close();
 console.log('PASS combined Home day/night, real-map picking, both walking modes, local coordinates, single asset download, four responsive views and failed-download retry.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
