const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const out='artifacts/wardrobe-refresh';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8080/?debug=ayothaya');await p.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 const stats=()=>p.evaluate(()=>window.__UTS_WORLD__.visualStats()),state=()=>p.evaluate(()=>window.__UTS_WORLD__.snapshot());
 const ready=()=>p.waitForFunction(()=>!document.querySelector('[data-apply]').disabled,null,{timeout:90000});
 const shot=async n=>{await p.waitForTimeout(120);await p.screenshot({path:out+'/'+n+'.png'});};
 await p.locator('.ayothaya-wardrobe-toggle').click();await ready();
 const classes=await p.locator('[data-class-list] [role=option]').allTextContents();assert(classes.length>60);assert(classes.every(t=>!/[\uac00-\ud7af]/.test(t)));assert(!classes.some(t=>/riding|peco|mount/i.test(t)));
 assert.equal(await p.locator('[data-hair-grid] button').count(),42);await shot('desktop');await p.locator('[data-class-trigger]').click();await shot('classes');
 await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await ready();assert.match(await p.locator('[data-class-trigger]').innerText(),/Swordman/);
 await p.locator('[data-sex=female]').click();await ready();assert.equal(await p.locator('[data-hair-grid] button').count(),42);assert.match(await p.locator('[data-class-trigger]').innerText(),/Swordman/);await p.locator('[data-hair-grid] button').nth(10).click();await ready();
 let expected={};
 for(const slot of ['upper','middle','lower','robe']){await p.locator(`[data-slot=${slot}]`).click();assert.equal(await p.locator(`[data-slot=${slot}]`).getAttribute('aria-selected'),'true');const items=p.locator('[data-equipment-grid] button');assert(await items.count()>0,slot+' compatible icons');const selected=items.first();expected[slot]=await selected.getAttribute('data-item');await selected.click();await ready();assert.equal(await p.locator(`[data-clear=${slot}]`).isEnabled(),true);}
 const base=await p.locator('canvas[data-appearance]').getAttribute('data-appearance');const metadata=await p.evaluate(b=>fetch(b+'.json').then(r=>r.json()),base);assert.equal(metadata.actions.length,24);for(const [k,v]of Object.entries(expected))assert.equal(metadata.appearance[k],v);
 await p.locator('[data-sit-preview]').click();await shot('female-outfit');
 await p.locator('[data-apply]').click();await p.waitForFunction(()=>!document.querySelector('.ayothaya-wardrobe').open);assert.equal((await stats()).perspective,'third');
 for(const area of ['city','lobby','museum','datacenter']){
  await p.evaluate(a=>window.__UTS_WORLD__.visitCampus(a,true),area);await p.waitForTimeout(200);const key=['city','lobby'].includes(area)?'world':'interior';
  await p.keyboard.press('Insert');await p.waitForTimeout(250);assert.equal((await stats()).sitting,true);assert((await stats())[key].avatar.action>=16,area+' sit sprite');assert.equal((await stats())[key].avatar.appearance,base);
  const before=await state();await p.keyboard.down('Insert');await p.keyboard.down('Insert');await p.keyboard.up('Insert');assert.equal((await stats()).sitting,false,'repeat does not toggle twice');await p.keyboard.press('Insert');
  await p.locator('button[data-perspective=first]').click();await p.waitForTimeout(200);assert.equal((await stats()).sitting,true);assert.equal(await p.locator('button[data-perspective=first]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('button[data-perspective=third]').getAttribute('aria-pressed'),'false');assert(!(await stats())[key].avatar.visible);assert((await state())[key].position[1]<before[key].position[1]+.01);
  await p.locator('button[data-perspective=third]').click();await p.keyboard.down('a');await p.waitForTimeout(80);await p.keyboard.up('a');assert.equal((await stats()).sitting,false,area+' move stands');
 }
 await p.evaluate(()=>window.__UTS_WORLD__.visitCampus('city',true));await p.keyboard.press('Insert');const box=await p.locator('#walkJoystick').boundingBox();assert(box&&box.width>80,'desktop joystick visible');
 const start=(await state()).world.position;await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width*.75,box.y+box.height*.25);await p.waitForTimeout(300);assert.equal((await stats()).sitting,false,'joystick stands');await p.mouse.up();const stopped=(await state()).world.position;assert(Math.hypot(stopped[0]-start[0],stopped[2]-start[2])>.1,'diagonal joystick moves');await p.waitForTimeout(200);assert.deepEqual((await state()).world.position,stopped,'release stops');
 await p.keyboard.press('Insert');await shot('sitting');await p.locator('#walkMenuToggle').click();await p.locator('#walkHelp').click();assert.match(await p.locator('#walkGuide').innerText(),/Ins \/ Insert/);assert.match(await p.locator('#walkGuide').innerText(),/First Person/);await p.locator('#dismissWalkGuide').click();
 await p.locator('.ayothaya-wardrobe-toggle').click();await ready();await p.locator('[name=search]').fill('test');await p.keyboard.press('Insert');assert.equal((await stats()).sitting,true,'typing in wardrobe never toggles posture');await p.keyboard.press('Escape');
 await p.reload();await p.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});assert.equal((await stats()).world.avatar.appearance,base,'outfit persisted');
 await p.setViewportSize({width:390,height:844});await p.locator('button[data-perspective=third]').click();await shot('mobile-controls');await p.locator('.ayothaya-sit-toggle').click();assert.equal((await stats()).sitting,true);
 await p.locator('.ayothaya-wardrobe-toggle').click();await ready();await shot('mobile-wardrobe');const rect=await p.locator('.ayothaya-wardrobe').boundingBox();assert(rect.x>=0&&rect.x+rect.width<=391&&rect.y>=0&&rect.y+rect.height<=845);assert(await p.locator('.ayothaya-wardrobe').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 await p.locator('[data-slot=middle]').click();await shot('mobile-equipment');await p.locator('[data-equipment-grid] button').first().click();await ready();
 await p.keyboard.press('Escape');assert.deepEqual(errors,[]);console.log('PASS class icons/dropdown keyboard, both-sex hair, four compatible equipment tabs and preview/apply/persistence, original sitting in all maps, mode highlights, joystick movement/release, help and mobile layout.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
