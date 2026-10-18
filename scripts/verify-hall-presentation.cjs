const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
fs.mkdirSync('artifacts/hybrid-lab',{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/?debug=ayothaya');await page.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});await page.evaluate(()=>window.__UTS_WORLD__.visitCampus('museum',true));
 for(const [name,position,yaw] of [['fixed-monitor',[-39.5,1.5,-3.5],Math.PI/2],['network-research-lab',[-39.1,1.5,-4.2],0],['east-wall',[-16,1.5,2],-Math.PI/2]]){
  await page.evaluate(async({position,yaw})=>{const w=window.__UTS_WORLD__,s=w.snapshot();s.interior.position=position;s.interior.rotation=[0,yaw,0,'YXZ'];await w.restore(s)},{position,yaw});await page.waitForTimeout(700);await page.screenshot({path:'artifacts/hybrid-lab/'+name+'.png'});
 }
 await page.evaluate(()=>window.__UTS_WORLD__.focusExhibit('huawei-ne40e-x8a'));await page.waitForTimeout(200);const canvas=page.locator('.ayothaya-surface canvas').last(),rect=await canvas.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.waitForTimeout(1800);await page.screenshot({path:'artifacts/hybrid-lab/device-hover.png'});
 assert((await page.evaluate(()=>window.__UTS_WORLD__.museumStats())).loaded>0,'hover uses real 3D equipment');await page.mouse.move(5,5);await page.waitForTimeout(900);await page.screenshot({path:'artifacts/hybrid-lab/device-rest.png'});assert.deepEqual(errors,[]);console.log('PASS fixed monitor, textured east wall and pointer-hover/rest views captured with real 3D equipment.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
