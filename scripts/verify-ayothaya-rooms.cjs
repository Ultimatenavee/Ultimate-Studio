const path=require('node:path'),fs=require('node:fs');const output=path.resolve('artifacts/ayothaya-qa');fs.mkdirSync(output,{recursive:true});
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.goto('http://127.0.0.1:8080/?debug=ayothaya');await page.waitForFunction(()=>!!window.__UTS_WORLD__,null,{timeout:90000});
 const rackCount=await page.locator('#rackTabs [data-rack]').count();console.log('INITIAL RACKS',rackCount);
 for(const area of ['lobby','museum','datacenter']){
  await page.evaluate(area=>window.__UTS_WORLD__.visitCampus(area,false),area);await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.__UTS_WORLD__.currentArea()),area);
  await page.screenshot({path:output+'/'+area+'-overview.png',fullPage:true});
 }
 await page.evaluate(()=>window.__UTS_WORLD__.select(0));await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>window.__UTS_WORLD__.snapshot().interior.selected),0);
 await page.evaluate(()=>window.__UTS_WORLD__.layout());await page.screenshot({path:output+'/rack-layout.png',fullPage:true});
 assert.equal(await page.evaluate(()=>window.__UTS_WORLD__.snapshot().interior.rackEditing),true);
 await page.evaluate(()=>window.__UTS_WORLD__.exitRackView());
 await page.locator('#openMuseum').click();await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.__UTS_WORLD__.currentArea()),'museum');
 console.log('MUSEUM',await page.evaluate(()=>window.__UTS_WORLD__.museumStats()));
 await page.screenshot({path:output+'/library-directory.png',fullPage:true});
 await page.evaluate(()=>window.__UTS_WORLD__.visitCampus('city',false));
 assert.equal(await page.locator('#rackTabs [data-rack]').count(),rackCount);
 // Portrait touch viewport, overview, the shared navigator and lobby layout.
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await page.screenshot({path:output+'/mobile-city.png',fullPage:true});
 await page.locator('#exploreCampus').click();await page.screenshot({path:output+'/mobile-map.png',fullPage:true});await page.locator('#closeCampusNavigation').click();
 await page.evaluate(()=>window.__UTS_WORLD__.visitCampus('lobby',true));await page.waitForTimeout(300);await page.screenshot({path:output+'/mobile-lobby.png',fullPage:true});
 console.log('ERRORS',errors,'FAILED_HTTP',failed);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 await browser.close();console.log('PASS rooms, rack focus/layout, library directory, preserved rack count, mobile viewports and asset loading.');
})().catch(e=>{console.error(e);process.exit(1);});
