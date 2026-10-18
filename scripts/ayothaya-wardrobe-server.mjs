import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let indexPromise,uiPromise,active=0;const pending=new Map(),cache=new Map();
const index=()=>indexPromise??=fs.readFile(path.join(root,'assets-source/ayothaya/wardrobe-index.json'),'utf8').then(JSON.parse);
const uiIndex=()=>uiPromise??=fs.readFile(path.join(root,'assets-source/ayothaya/wardrobe-ui.json'),'utf8').then(JSON.parse);
const readable=(item,i)=>({...item,label:/[\uac00-\ud7af\ufffd]/.test(item.label)?'Item '+String(i+1).padStart(4,'0'):item.label});
const publicItem=({id,name,label,sex,race,job,variant})=>({id,name,label,sex,race,job,variant});
export function wardrobeChoices(db,bodyId,headId){
 const body=db.bodies.find(x=>x.id===bodyId);if(!body)throw Error('Unknown body');
 const heads=db.heads.filter(x=>x.sex===body.sex&&x.race===body.race).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})),head=heads.find(x=>x.id===headId)||heads[0];
 return {head:head?.id,heads:heads.map(publicItem),headgear:db.headgear.filter(x=>x.sex===body.sex&&x.race===body.race).map(publicItem),
  robes:db.robes.filter(x=>x.variants[body.name]).map(publicItem),
  weapons:db.weapons.filter(x=>x.sex===body.sex&&x.job===body.job).map(publicItem),shields:db.shields.filter(x=>x.sex===body.sex&&x.job===body.job).map(publicItem),
  bodyPalettes:db.palettes.filter(x=>x.name.startsWith(body.name+'_')).map(publicItem),hairPalettes:db.palettes.filter(x=>x.name.startsWith((body.race==='human'?'머리':'')+head?.name+'_')).map(publicItem)};
}
function normalize(db,input){
 const body=db.bodies.find(x=>x.id===input.body);if(!body)throw Error('Unknown body');
 const choices=wardrobeChoices(db,body.id,input.head),result={body:body.id,head:input.head};
 if(!choices.heads.some(x=>x.id===result.head))throw Error('Hair does not match body');
 for(const [key,list]of Object.entries({upper:'headgear',middle:'headgear',lower:'headgear',robe:'robes',weapon:'weapons',shield:'shields',bodyPalette:'bodyPalettes',hairPalette:'hairPalettes'})){
  if(!input[key])continue;if(!choices[list].some(x=>x.id===input[key]))throw Error('Incompatible '+key);result[key]=input[key];
 }
 return result;
}
async function generate(config){
 // Reuse exported sprites after a server restart too. Match Python's sorted
 // JSON separators and v4 hash; only validated, compatible IDs reach this point.
 const canonical='{'+Object.keys(config).sort().map(k=>JSON.stringify(k)+': '+JSON.stringify(config[k])).join(', ')+'}',id=createHash('sha256').update('v4:'+canonical).digest('hex').slice(0,20),base='assets/ayothaya/avatar/outfits/'+id;
 try{await Promise.all(['.json','.png'].map(ext=>fs.access(path.join(root,'web',base+ext))));return {base,appearance:config};}catch{}
 const settings=JSON.parse(await fs.readFile(path.join(root,'scripts/ayothaya-local.json'),'utf8'));
 return new Promise((resolve,reject)=>{
  const child=spawn('uv',['run','--python','3.12','--with','numpy','--with','pillow','--with','psutil','python',path.join(root,'assets-source/ayothaya/wardrobe.py'),'render','--ragx',settings.ragx,'--client',settings.client||'C:\\Program Files\\RagnarokOnline'],{cwd:root,windowsHide:true,env:{...process.env,PYTHONIOENCODING:'utf-8'},stdio:['pipe','pipe','pipe']});
  let output='',error='';const timer=setTimeout(()=>{child.kill();reject(Error('Outfit rendering timed out'));},90000);
  child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>error+=b);
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);try{const data=JSON.parse(output.trim());if(code||data.error)reject(Error(data.error||'Outfit render failed'));else resolve(data);}catch{reject(Error(error.slice(-700)||'Unable to render outfit'));}});
  child.stdin.end(JSON.stringify(config));
 });
}
export async function wardrobeRequest(req,res,url){
 if(!url.pathname.startsWith('/api/ayothaya/wardrobe/'))return false;
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
  const db=await index();
  if(req.method==='GET'&&url.pathname.endsWith('/catalog')){send(200,{bodies:(await uiIndex()).classes,counts:db.counts});return true;}
  if(req.method==='GET'&&url.pathname.endsWith('/choices')){const choices=wardrobeChoices(db,url.searchParams.get('body'),url.searchParams.get('head')),ui=await uiIndex();for(const [key,list]of Object.entries(choices))if(Array.isArray(list))choices[key]=list.map((item,i)=>({...readable(item,i),...ui.items[item.id]}));send(200,choices);return true;}
  if(req.method!=='POST'||!url.pathname.endsWith('/render')){send(405,{error:'Method not allowed'});return true;}
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){send(403,{error:'Same-origin requests only'});return true;}
  let body='';for await(const chunk of req){body+=chunk;if(body.length>8192){send(413,{error:'Outfit request too large'});return true;}}
  const config=normalize(db,JSON.parse(body)),key=JSON.stringify(config);
  if(cache.has(key)){send(200,cache.get(key));return true;}
  if(!pending.has(key)){
   if(active>=2){send(429,{error:'กำลังเตรียมชุด กรุณารอสักครู่แล้วลองใหม่'});return true;}
   active++;pending.set(key,generate(config).then(data=>{cache.set(key,data);return data;}).finally(()=>{active--;pending.delete(key);}));
  }
  send(200,await pending.get(key));
 }catch(error){send(400,{error:error.message});}
 return true;
}
