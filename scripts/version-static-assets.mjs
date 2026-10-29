import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Give HTML entry points URLs tied to the exact JS/CSS bytes in this release.
export async function versionStaticAssets(directory){
  const root=path.resolve(directory);
  for(const file of await fs.readdir(root)){
    if(!file.endsWith('.html'))continue;
    const filename=path.join(root,file),html=await fs.readFile(filename,'utf8');
    const matches=[...html.matchAll(/\b(?:src|href)=(['"])([^'"\s<>]+\.(?:js|css)(?:\?[^'"\s<>]*)?)\1/g)];
    let output=html;
    for(const match of matches){
      const url=match[2],asset=url.split('?')[0];
      if(/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(asset))continue;
      const target=path.resolve(root,asset),relative=path.relative(root,target);
      if(relative.startsWith('..')||path.isAbsolute(relative))continue;
      const bytes=await fs.readFile(target),version=createHash('sha256').update(bytes).digest('hex').slice(0,16);
      output=output.replace(match[0],match[0].replace(url,asset+'?v='+version));
    }
    if(output!==html)await fs.writeFile(filename,output);
  }
}
