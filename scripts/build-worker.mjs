import './build-datacenter.mjs';
import './split-ayothaya-gltf.mjs';
import {CITY_LANTERNS,CITY_STRINGS,INDOOR_CHANDELIERS} from '../src/datacenter/ayothaya-decor-layout.js';
import {ROYAL_LANTERNS} from '../src/datacenter/royal-temple-layout.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {build} from 'esbuild';
const root=process.cwd(),web=path.join(root,'web'),dist=path.join(root,'dist'),client=path.join(dist,'client'),server=path.join(dist,'server');
// Generated Hunyuan assets are private source/review files, never public static assets.
try{await fs.access(path.join(web,'assets/sculpt/neural-v109'));throw new Error('Restricted sculpture assets must not be copied to the public web tree');}catch(e){if(e.code!=='ENOENT')throw e;}
await fs.rm(client,{recursive:true,force:true});await fs.rm(server,{recursive:true,force:true});await fs.mkdir(client,{recursive:true});await fs.mkdir(server,{recursive:true});
for(const entry of await fs.readdir(web,{withFileTypes:true})){if(['client','server','.openai'].includes(entry.name))continue;await fs.cp(path.join(web,entry.name),path.join(client,entry.name),{recursive:true});}
// The original GLB remains a development source; hosted clients use its exact
// data repacked into bounded glTF buffers.
await fs.unlink(path.join(client,'assets/ayothaya/ayothaya.glb'));
// The full selection catalogue remains available. Ship all in-use fixtures;
// optional catalogue-only models are immutable public repository assets.
const capitalLighting=JSON.parse(await fs.readFile(path.join(client,'assets/sirin/lighting-layout.json'),'utf8'));
const lightDirectory=path.join(client,'assets/ayothaya/light-catalog'),includedModels=[...new Set([...CITY_LANTERNS,...CITY_STRINGS,...Object.values(INDOOR_CHANDELIERS).flat(),...capitalLighting.added,...ROYAL_LANTERNS].map(p=>p.id).filter(id=>/^L\d{3}$/.test(id)))];
await Promise.all(includedModels.map(id=>fs.access(path.join(lightDirectory,id+'.glb'))));
const lightCatalog=JSON.parse(await fs.readFile(path.join(lightDirectory,'catalog.json'),'utf8'));lightCatalog.includedModels=includedModels;lightCatalog.modelArchive='https://raw.githubusercontent.com/Ultimatenavee/Ultimate-Studio/aa9d265dd844150ad04fd41f92c2e1491dded0df/web/assets/ayothaya/light-catalog/';
await fs.writeFile(path.join(lightDirectory,'catalog.json'),JSON.stringify(lightCatalog));
for(const name of await fs.readdir(lightDirectory))if(name.endsWith('.glb')&&!includedModels.includes(name.slice(0,-4)))await fs.unlink(path.join(lightDirectory,name));
const ctx=vm.createContext({window:{}});vm.runInContext(await fs.readFile(path.join(web,'catalog.js'),'utf8'),ctx);vm.runInContext(await fs.readFile(path.join(web,'audience.js'),'utf8'),ctx);
const models=Object.fromEntries(ctx.window.NOAH_CATALOG.map(m=>[m.id,{powerSlots:m.powerSlots,powerModes:m.powerModes,allowsMixedPower:!!m.allowsMixedPower,topologyOnly:!!m.topologyOnly,id:m.id,brand:m.brand,ports:m.ports}]));
await fs.writeFile(path.join(root,'server/models.mjs'),'export default '+JSON.stringify(models)+';\n');
await fs.writeFile(path.join(root,'server/port-resources.mjs'),(await fs.readFile(path.join(web,'port-resources.js'),'utf8')).replace('globalThis.NOAH_PORT_RESOURCES=','export default '));
await build({entryPoints:[path.join(root,'server/index.mjs')],outfile:path.join(server,'index.js'),bundle:true,format:'esm',platform:'browser',target:'es2022'});
for(const file of ['models.mjs','template-validation.mjs','port-resources.mjs'])await fs.copyFile(path.join(root,'server',file),path.join(server,file));
await fs.writeFile(path.join(server,'wrangler.json'),JSON.stringify({name:'noah-topology-studio',main:'index.js',compatibility_date:'2026-01-01',assets:{directory:'../client',binding:'ASSETS',run_worker_first:['/api/*','/assets/*.pptx']},d1_databases:[{binding:'DB',database_name:'noah-templates',database_id:'00000000-0000-0000-0000-000000000000'}]},null,2)+'\n');
await fs.mkdir(path.join(dist,'.openai'),{recursive:true});await fs.copyFile(path.join(root,'.openai/hosting.json'),path.join(dist,'.openai/hosting.json'));
console.log('Built Worker API and preserved client assets');
