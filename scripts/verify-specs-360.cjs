const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('ultimate-topology-onboarding-v1','seen'));
 const base=process.env.UTS_TEST_URL||'http://127.0.0.1:8080/';await page.goto(base+'studio.html?view=specs',{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#onboardingDialog').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.locator('#specResults [data-spec-3d]').first().waitFor();
 const ids=await page.locator('#specResults [data-spec-3d]').evaluateAll(bs=>bs.map(b=>b.getAttribute('data-spec-3d'))),models=JSON.parse(fs.readFileSync('src/datacenter/devices.json','utf8'));
 for(const id of ids)assert(models.some(m=>m.id===id),'3D model exists: '+id);assert.equal(ids.length,40);
 await page.locator('#specResults [data-spec-3d]').first().click();await page.locator('.dv-device canvas').waitFor({timeout:45000});
 const modal=page.locator('.dv-device');await modal.locator('[data-view=front]').click();await page.waitForTimeout(300);const front=await modal.locator('canvas').screenshot();
 await modal.locator('[data-view=rear]').click();await page.waitForTimeout(300);const rear=await modal.locator('canvas').screenshot();assert(!front.equals(rear),'front/rear render different physical faces');
 await modal.locator('[data-view=perspective]').click();const canvas=modal.locator('canvas'),box=await canvas.boundingBox();const before=await canvas.screenshot();await page.mouse.move(box.x+box.width*.45,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y+box.height*.62,{steps:15});await page.mouse.up();await page.waitForTimeout(300);assert(!(await canvas.screenshot()).equals(before),'drag rotates 3D');
 await modal.locator('[data-zoom="0.8"]').click();await modal.locator('[data-view=perspective]').click();await page.waitForTimeout(200);await page.screenshot({path:'artifacts/ragnarok-life-qa/specs-360-desktop.png'});await modal.locator('.dv-close').click();
 await page.setViewportSize({width:390,height:844});await page.locator('#specResults [data-spec-open]').first().click();await page.locator('#specDetailDialog [data-spec-3d]').click();await page.locator('.dv-device canvas').waitFor({timeout:45000});await page.screenshot({path:'artifacts/ragnarok-life-qa/specs-360-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS 40 specs devices linked to real 3D models, card/detail launch, distinct front/rear, orbit drag, zoom and mobile viewer.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
