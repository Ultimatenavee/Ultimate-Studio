const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='artifacts/ayothaya-live-preview';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:3420,height:1265}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/?debug=ayothaya');await page.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 const state=()=>page.evaluate(()=>window.__UTS_WORLD__.snapshot()),stats=()=>page.evaluate(()=>window.__UTS_WORLD__.visualStats());
 const shot=async name=>{await page.waitForTimeout(150);await page.screenshot({path:out+'/'+name+'.png'});};
 const opening=await state();assert(Math.abs(opening.world.rotation[1])<.01,'opening faces north toward temple');await shot('opening-reference');
 await page.mouse.move(1700,650);await page.mouse.wheel(0,-300);await page.waitForTimeout(200);
 const distance=s=>Math.hypot(...s.position.map((v,i)=>v-s.target[i]));assert(distance((await state()).world)<distance(opening.world),'overview scroll zoom');
 await page.locator('#walkMode').click();await page.locator('button[data-perspective=third]').click();await page.waitForTimeout(200);
 assert(Math.abs((await stats()).world.avatar.height-1.092)<.001,'character height reduced without changing eye/collision height');
 for(const area of ['city','lobby','museum','datacenter']){
  await page.evaluate(a=>window.__UTS_WORLD__.visitCampus(a,true),area);await page.waitForTimeout(180);const key=['city','lobby'].includes(area)?'world':'interior',before=await state(),scale=(await stats())[key].avatar.zoomScale;
  await page.mouse.move(1700,650);await page.mouse.wheel(0,-300);await page.waitForTimeout(160);
  assert((await stats())[key].avatar.zoomScale<scale,area+' third-person wheel moves follow camera closer');assert.equal((await state())[key].fov,before[key].fov);assert.deepEqual((await state())[key].position,before[key].position);
  await page.mouse.wheel(0,300);await page.waitForTimeout(120);assert(Math.abs((await stats())[key].avatar.zoomScale-scale)<.0001,area+' wheel reverses');
  await page.locator('button[data-perspective=first]').click();const first=(await state())[key];await page.mouse.move(1700,650);await page.mouse.wheel(0,-300);await page.waitForTimeout(120);assert((await state())[key].fov<first.fov,area+' first-person wheel zoom');await page.locator('button[data-perspective=third]').click();
 }
 await page.evaluate(()=>window.__UTS_WORLD__.visitCampus('city',true));await shot('smaller-avatar');
 await page.locator('.ayothaya-wardrobe-toggle').click();await page.waitForFunction(()=>!document.querySelector('[data-apply]').disabled,null,{timeout:90000});
 const ready=()=>page.waitForFunction(()=>!document.querySelector('[data-apply]').disabled,null,{timeout:90000});
 const choices=await page.locator('[data-equipment-grid] [data-item]').evaluateAll(options=>options.slice(0,4).map(o=>o.dataset.item));assert.equal(choices.length,4);
 let release,entered;const started=new Promise(r=>entered=r),gate=new Promise(r=>release=r);let intercept=true;
 await page.route('**/api/ayothaya/wardrobe/render',async route=>{if(intercept){intercept=false;entered();await gate;}await route.continue();});
 await page.locator(`[data-equipment-grid] [data-item="${choices[0]}"]`).click();await started;
 assert.equal(await page.locator('.ro-dress-fields').evaluate(e=>e.inert),false,'selectors remain usable during generation');
 await page.locator(`[data-equipment-grid] [data-item="${choices[1]}"]`).click();await page.locator(`[data-equipment-grid] [data-item="${choices[2]}"]`).click();await page.waitForTimeout(180);release();await ready();
 const rendered=await page.locator('.ro-dress-preview canvas').getAttribute('data-appearance');const metadata=await page.evaluate(base=>fetch(base+'.json').then(r=>r.json()),rendered);assert.equal(metadata.appearance.upper,choices[2],'latest outfit wins delayed response');
 await shot('live-wardrobe');await page.locator(`[data-equipment-grid] [data-item="${choices[3]}"]`).click();await ready();await page.locator(`[data-equipment-grid] [data-item="${choices[2]}"]`).click();await ready();assert.equal(await page.locator('.ro-dress-preview canvas').getAttribute('data-appearance'),rendered,'cached preview matches selected outfit');
 await page.locator('[data-clear=upper]').click();await ready();const cleared=await page.locator('.ro-dress-preview canvas').getAttribute('data-appearance');const clearMeta=await page.evaluate(base=>fetch(base+'.json').then(r=>r.json()),cleared);assert(!clearMeta.appearance.upper,'slot clear previews automatically');
 const beforeCancel=(await stats()).world.avatar.appearance;await page.keyboard.press('Escape');assert.equal((await stats()).world.avatar.appearance,beforeCancel,'cancel leaves worn outfit unchanged');
 await page.evaluate(()=>{window.__UTS_WORLD__.openingView();window.__UTS_WORLD__.timeOfDay('night');});await page.waitForTimeout(250);const lamps=(await stats()).world.lanterns;assert.equal(lamps.city,54);assert.equal(lamps.lit,58);assert(lamps.activeLights>0&&lamps.activeLights<=8);await shot('night-map');
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.__UTS_WORLD__.timeOfDay('day'));await page.reload();await page.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});await shot('opening-laptop');
 await page.setViewportSize({width:390,height:844});await shot('opening-mobile');assert.deepEqual(errors,[]);
 console.log('PASS reference opening, smaller avatar, real wheel input in all 4 maps and both perspectives, live outfit selection/cache/clear/cancel, delayed-response race, 58 emitters with 8-light budget, laptop and mobile.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
