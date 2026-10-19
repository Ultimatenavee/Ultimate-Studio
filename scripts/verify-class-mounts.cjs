const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{build}=require('esbuild');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/wardrobe/'))missing.push(r.url());});
 await page.route('**/api/ayothaya/wardrobe/**',r=>r.abort());
 await page.goto((process.env.UTS_TEST_URL||'http://127.0.0.1:8080/')+'?debug=ayothaya');await page.waitForFunction(()=>window.__UTS_WORLD__,null,{timeout:90000});
 const bundle=await build({entryPoints:['src/datacenter/online-wardrobe.js'],bundle:true,format:'iife',globalName:'MountQA',write:false});await page.addScriptTag({content:bundle.outputFiles[0].text});
 const result=process.env.UTS_MOUNTS_UI_ONLY?JSON.parse(fs.readFileSync('artifacts/mounts-qa/renders.json')):await page.evaluate(async()=>{
  const api=MountQA,cat=await api.onlineWardrobeRequest('catalog'),results=[];
  for(const body of cat.bodies){
   const choices=await api.onlineWardrobeRequest('choices?'+new URLSearchParams({body:body.id}));
   if(!choices.mounts.length)throw Error('No mount for '+body.label+'/'+body.sex);
   for(const mount of choices.mounts){
    const q=await api.onlineWardrobeRequest('choices?'+new URLSearchParams({body:body.id,mount:mount.id}));
    const outfit=await api.onlineWardrobeRequest('render',{body:JSON.stringify({body:body.id,head:q.head,mount:mount.id,upper:q.headgear.find(x=>x.slots?.includes('upper'))?.id,hairPalette:q.hairPalettes[0]?.id})}),assets=await api.onlineOutfitAssets(outfit.base);
    if(!assets.meta.mounted||assets.meta.actions.length!==24||!Number.isFinite(assets.meta.bodyHeight)||assets.meta.bodyHeight<=0)throw Error('Invalid mounted metadata');
    const image=new Image();image.src=assets.url;await image.decode();const canvas=document.createElement('canvas');canvas.width=assets.meta.width;canvas.height=assets.meta.height;const ctx=canvas.getContext('2d');
    for(const action of assets.meta.actions){const f=action.start;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,f%assets.meta.columns*canvas.width,Math.floor(f/assets.meta.columns)*canvas.height,canvas.width,canvas.height,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;if(!pixels.some((v,i)=>i%4===3&&v>0))throw Error('Empty mount pose '+body.label+'/'+mount.label);}
    results.push({class:body.label,sex:body.sex,mount:mount.label,frames:assets.meta.frames});
   }
  }
  const male=cat.bodies.find(b=>b.label==='Knight'&&b.sex==='male'),female=cat.bodies.find(b=>b.label==='Knight'&&b.sex==='female'),m=await api.onlineWardrobeRequest('choices?'+new URLSearchParams({body:male.id}));
  let rejected=false;try{await api.onlineWardrobeRequest('choices?'+new URLSearchParams({body:female.id,mount:m.mounts[0].id}));}catch{rejected=true;}if(!rejected)throw Error('Cross-sex mount accepted');
  return results;
 });
 const out='artifacts/mounts-qa';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/renders.json',JSON.stringify(result,null,2));
 console.log('Rendered and validated',result.length,'class/sex mount options.');
 await page.evaluate(()=>window.__UTS_WORLD__.visitCampus('capital',true));
 const ready=()=>page.waitForFunction(()=>!document.querySelector('[data-apply]')?.disabled,null,{timeout:90000});
 await page.locator('.ayothaya-wardrobe-toggle').click();await ready();
 const choose=async(label,sex)=>{await page.locator('[data-sex='+sex+']').click();await ready();await page.locator('[data-class-trigger]').click();await page.getByRole('option',{name:label,exact:true}).click();await ready();};
 for(const [job,sex,label]of [['Novice','male','Poring'],['Rune Knight','male','Dragon 1'],['Royal Guard','female','Gryphon'],['Meister','male','Mado Gear']]){
  await choose(job,sex);await page.locator('select[name=mount]').selectOption({label});await ready();await page.locator('[data-walk]').click();await page.waitForTimeout(150);await page.screenshot({path:out+'/'+job.replaceAll(' ','-')+'.png'});await page.locator('[data-walk]').click();
 }
 const selected=await page.locator('canvas[data-appearance]').getAttribute('data-appearance');assert(JSON.parse(decodeURIComponent(selected.slice(10))).mount);
 for(const [name,width,height]of [['phone',390,844],['phone-landscape',844,390],['ipad',820,1180],['ipad-landscape',1180,820]]){await page.setViewportSize({width,height});await page.locator('select[name=mount]').scrollIntoViewIfNeeded();const rect=await page.locator('select[name=mount]').boundingBox();assert(rect&&rect.x>=0&&rect.x+rect.width<=width);await page.screenshot({path:out+'/'+name+'.png'});}
 await page.setViewportSize({width:1440,height:1000});await page.locator('[data-apply]').click();await page.waitForFunction(()=>!document.querySelector('.ayothaya-wardrobe').open);
 await page.reload();await page.waitForFunction(base=>window.__UTS_WORLD__?.visualStats().world.avatar?.appearance===base,selected,{timeout:90000});
 for(const area of ['capital','museum','datacenter']){
  await page.evaluate(async a=>{const w=window.__UTS_WORLD__;await w.visitCampus(a,true);w.perspective('third');w.focusWalkInput();},area);
  const key=area==='capital'?'world':'interior';assert.equal(await page.evaluate(k=>window.__UTS_WORLD__.visualStats()[k].avatar.appearance,key),selected);
  await page.waitForTimeout(150);await page.screenshot({path:out+'/'+area+'-mounted.png'});
  await page.keyboard.press('Insert');await page.waitForFunction(k=>window.__UTS_WORLD__.visualStats().sitting&&window.__UTS_WORLD__.visualStats()[k].avatar.action>=16,key,{timeout:10000});
  await page.screenshot({path:out+'/'+area+'-sitting.png'});await page.keyboard.press('Insert');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS '+result.length+' mounted class/sex renders, all 24 directions/actions, compatibility rejection, live preview, mobile/iPad, Apply/reload, sitting and Hall/Datacenter.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
