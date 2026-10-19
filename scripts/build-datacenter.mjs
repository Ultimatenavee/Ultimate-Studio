import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import fs from 'node:fs/promises';
await import('./sync-datacenter-catalog.mjs');
await fs.rm('web/dc-chunks',{recursive:true,force:true});
await build({entryPoints:{'datacenter-entry':'src/datacenter/entry.js','device-viewer-entry':'src/datacenter/studio-viewer.js'},outdir:'web',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,chunkNames:'dc-chunks/[name]-[hash]',legalComments:'eof'});
// One self-contained boot module avoids a stalled dynamic-import dependency waterfall.
await build({entryPoints:['src/datacenter/entry.js'],outfile:'web/datacenter-entry.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof'});
await build({entryPoints:['assets-source/ayothaya/light-catalog-ui.js'],outfile:'web/lantern-catalog.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof'});
await fs.copyFile('node_modules/three/LICENSE','web/THREE-LICENSE.txt');
console.log('Bundled local Datacenter assets; Three.js is loaded on demand.');

// Version the entire module graph together. A cached/incomplete dependency from
// a previous deployment must not keep a fresh entry waiting indefinitely.
const moduleFiles=['web/datacenter-entry.js','web/device-viewer-entry.js',...(await fs.readdir('web/dc-chunks')).filter(f=>f.endsWith('.js')).sort().map(f=>'web/dc-chunks/'+f)];
const graphHash=createHash('sha256');for(const file of moduleFiles)graphHash.update(await fs.readFile(file));
const graphVersion=graphHash.digest('hex').slice(0,12);
for(const file of moduleFiles){const text=await fs.readFile(file,'utf8');await fs.writeFile(file,text.replace(/(["'])(\.\.?\/[^"']+\.js)\1/g,(_,quote,url)=>quote+url+'?v='+graphVersion+quote));}
const entryVersion=createHash('sha256').update(await fs.readFile('web/datacenter-entry.js')).digest('hex').slice(0,12);
const index=await fs.readFile('web/index.html','utf8');
await fs.writeFile('web/index.html',index.replace(/src="datacenter-entry\.js(?:\?v=[a-f0-9]+)?"/,'src="datacenter-entry.js?v='+entryVersion+'"'));
