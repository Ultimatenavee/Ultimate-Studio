import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {wardrobeRequest} from './ayothaya-wardrobe-server.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../web'),offline=path.resolve(root,'../desktop/offline.js');
const port=Number(process.env.UTS_LOCAL_PORT||8080);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
  if(await wardrobeRequest(req,res,url))return;
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  if(pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local mode: cloud review and shared templates require the hosted backend.'}));return;}
  const file=pathname==='/__offline.js'?offline:path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname)),relative=path.relative(root,file);
  if(file!==offline&&(relative.startsWith('..')||path.isAbsolute(relative))){res.writeHead(403);res.end();return;}
  let bytes=await fs.readFile(file);if(path.extname(file)==='.html')bytes=Buffer.from(bytes.toString().replace('<script src="catalog.js">','<script>window.UTS_BROWSER_LOCAL=true</script><script src="/__offline.js"></script><script src="catalog.js">'));
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Ultimate Topology Studio local: http://127.0.0.1:${port} (templates are browser-local)`));
