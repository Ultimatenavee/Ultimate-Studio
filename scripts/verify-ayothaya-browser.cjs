const path=require('node:path'),fs=require('node:fs');const output=path.resolve('artifacts/ayothaya-qa');fs.mkdirSync(output,{recursive:true});
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message);});
 page.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url());});
 await page.goto('http://127.0.0.1:8080/?debug=ayothaya');await page.waitForFunction(()=>!!window.__UTS_WORLD__,null,{timeout:90000});
 const state=()=>page.evaluate(()=>{const s=window.__UTS_WORLD__.snapshot();return {area:s.area,walking:window.__UTS_WORLD__.isWalking(),position:['city','lobby'].includes(s.area)?s.world.position:s.interior.position};});
 const shot=async name=>{await page.screenshot({path:output+'/'+name+'.png',fullPage:true});console.log(name,await state());};
 async function move(key,predicate,label){await page.keyboard.down('Shift');await page.keyboard.down(key);try{await page.waitForFunction(predicate,null,{timeout:25000});}finally{await page.keyboard.up(key);await page.keyboard.up('Shift');}await page.waitForTimeout(900);await shot(label);}
 await page.locator('#walkMode').click();await shot('city-walk');
 if(process.env.UTS_THIRD_PERSON==='1')await page.locator('button[data-perspective=third]').click();
 await move('w',()=>window.__UTS_WORLD__.currentArea()==='lobby','lobby');
 await move('w',()=>window.__UTS_WORLD__.snapshot().world.position[2]<.1,'lobby-center');
 await move('a',()=>window.__UTS_WORLD__.currentArea()==='museum','library');
 await move('s',()=>window.__UTS_WORLD__.currentArea()==='lobby','library-return');
 await move('w',()=>window.__UTS_WORLD__.currentArea()==='datacenter','datacenter');
 await move('d',()=>window.__UTS_WORLD__.snapshot().interior.position[0]>-.1,'datacenter-door');
 await move('s',()=>window.__UTS_WORLD__.currentArea()==='lobby','datacenter-return');
 await move('w',()=>window.__UTS_WORLD__.snapshot().world.position[0]<.1,'lobby-return-center');
 // Face the south exit with drag-look, then walk through it.
 const yaw=await page.evaluate(()=>window.__UTS_WORLD__.snapshot().world.rotation[1]);
 const rect=await page.locator('.ayothaya-surface').first().locator('canvas').boundingBox(),cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
 await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx-(Math.PI-yaw)/.004,cy,{steps:10});await page.mouse.up();
 await move('w',()=>window.__UTS_WORLD__.currentArea()==='city','city-return');
 await page.waitForTimeout(1200);assert.equal((await state()).area,'city','return does not immediately re-enter temple');
 await page.locator('#exitWalk').click();await shot('overview-return');assert.equal((await state()).walking,false);
 await page.locator('#exploreCampus').click();await shot('map-menu');
 assert.deepEqual(errors,[]);console.log('PASS portal round trip and overview');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
