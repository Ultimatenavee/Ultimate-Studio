import './build-worker.mjs';
import {versionStaticAssets} from './version-static-assets.mjs';
import fs from 'node:fs/promises';import path from 'node:path';
const output=path.resolve('artifacts/github-pages/Ultimate-Studio'),expected=path.join(process.cwd(),'artifacts','github-pages','Ultimate-Studio');
if(output!==expected)throw Error('Unexpected Pages build path');
await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});await fs.cp('dist/client',output,{recursive:true});await fs.writeFile(path.join(output,'.nojekyll'),'');await versionStaticAssets(output);console.log('Prepared GitHub Pages at '+output);
