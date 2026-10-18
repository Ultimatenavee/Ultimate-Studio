import {build} from 'esbuild';
import fs from 'node:fs/promises';
await import('./sync-datacenter-catalog.mjs');
await fs.rm('web/dc-chunks',{recursive:true,force:true});
await build({entryPoints:{'datacenter-entry':'src/datacenter/entry.js','device-viewer-entry':'src/datacenter/studio-viewer.js'},outdir:'web',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,chunkNames:'dc-chunks/[name]-[hash]',legalComments:'eof'});
await build({entryPoints:['assets-source/ayothaya/light-catalog-ui.js'],outfile:'web/lantern-catalog.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof'});
await fs.copyFile('node_modules/three/LICENSE','web/THREE-LICENSE.txt');
console.log('Bundled local Datacenter assets; Three.js is loaded on demand.');
