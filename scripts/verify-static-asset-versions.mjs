import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {versionStaticAssets} from './version-static-assets.mjs';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'uts-assets-'));
try{
  await fs.writeFile(path.join(root,'importer.js'),'window.importVersion=1;');
  await fs.writeFile(path.join(root,'studio.css'),'body{color:black}');
  await fs.writeFile(path.join(root,'studio.html'),'<script src="importer.js?v=old"></script><link href="studio.css" rel="stylesheet"><script src="https://example.com/lib.js"></script><a href="../outside.js">outside</a>');
  await versionStaticAssets(root);
  const first=await fs.readFile(path.join(root,'studio.html'),'utf8');
  assert.match(first,/importer\.js\?v=[a-f0-9]{16}/);assert.match(first,/studio\.css\?v=[a-f0-9]{16}/);
  assert(first.includes('https://example.com/lib.js'));assert(first.includes('../outside.js'));assert(!first.includes('?v=old'));
  await versionStaticAssets(root);assert.equal(await fs.readFile(path.join(root,'studio.html'),'utf8'),first);
  await fs.writeFile(path.join(root,'importer.js'),'window.importVersion=2;');await versionStaticAssets(root);
  const next=await fs.readFile(path.join(root,'studio.html'),'utf8');assert.notEqual(next,first);
  assert.equal(next.match(/studio\.css\?v=[a-f0-9]{16}/)[0],first.match(/studio\.css\?v=[a-f0-9]{16}/)[0]);
  console.log('PASS static asset versions change with content, remain stable otherwise, and preserve external URLs.');
}finally{
  // Delete only the unique temporary directory created by this test.
  await fs.rm(root,{recursive:true,force:true});
}
