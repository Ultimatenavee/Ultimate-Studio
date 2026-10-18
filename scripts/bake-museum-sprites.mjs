import {build} from 'esbuild';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const bundle='web/museum-bake-temp.js';
await build({entryPoints:['assets-source/ayothaya/bake-museum-sprites.js'],outfile:bundle,bundle:true,format:'iife',platform:'browser'});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:8080/lantern-catalog.html');await page.addScriptTag({url:'/museum-bake-temp.js'});const result=await page.evaluate(()=>window.bakeMuseum());await fs.mkdir('web/assets/ayothaya/lab',{recursive:true});await fs.writeFile('web/assets/ayothaya/lab/exhibits.png',Buffer.from(result.png,'base64'));await fs.writeFile('src/datacenter/museum-sprites.json',JSON.stringify(result.manifest,null,2)+'\n');console.log('Baked',Object.keys(result.manifest.frames).length,'sprites');}finally{await browser.close();await fs.unlink(bundle);}
