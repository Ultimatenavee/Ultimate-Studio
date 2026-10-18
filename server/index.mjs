import {validateProject} from './template-validation.mjs';
import models from './models.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function readBody(request){const max=1024*1024;if(Number(request.headers.get('content-length'))>max)throw new Error('ข้อมูลต้องไม่เกิน 1 MB');const reader=request.body?.getReader();if(!reader)throw new Error('ไม่มีข้อมูล');let length=0,parts=[];for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();throw new Error('ข้อมูลต้องไม่เกิน 1 MB');}parts.push(value);}const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('ข้อมูล JSON ไม่ถูกต้อง');return value;}
const id=v=>typeof v==='string'&&/^[\da-f]{8}-[\da-f-]{27}$/i.test(v);
const text=(v,max)=>typeof v==='string'&&v.trim()&&v.trim().length<=max;
const meta=v=>({tags:Array.isArray(v?.tags)?v.tags.slice(0,12).filter(t=>typeof t==='string'&&t.length<=40):[],favorite:v?.favorite===true});
function validateInput(project){try{return validateProject(project,models);}catch(e){e.isValidation=true;throw e;}}
async function handle(request,env){
 const url=new URL(request.url);if(decodeURIComponent(url.pathname).toLowerCase().endsWith('.pptx'))return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 const match=url.pathname.match(/^\/api\/(templates|reviews)(?:\/([\w-]{1,64}))?(?:\/(comments)(?:\/([\w-]{1,64}))?)?$/);if(!match)return json({error:'ไม่พบรายการ'},404);
 if(!env.DB)return json({error:'ข้อมูลในเว็บไซต์ยังไม่พร้อมใช้งาน กรุณาลองใหม่'},503);
 const [_,kind,key,comments,commentId]=match,db=env.DB;
 const first=(sql,...args)=>db.prepare(sql).bind(...args).first();const run=(sql,...args)=>db.prepare(sql).bind(...args).run();const all=async(sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
 try{
  if(request.method!=='GET'){
   if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin&&request.headers.get('Origin')!==PAGES_ORIGIN)return json({error:'บันทึกจากเว็บไซต์นี้เท่านั้น'},403);
   if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return json({error:'ส่งข้อมูล JSON เท่านั้น'},415);
  }
  if(kind==='reviews'){
   if(request.method==='GET'&&key&&!comments){const r=await first('SELECT * FROM design_reviews WHERE id=?',key);return r?json({id:r.id,name:r.name,project:JSON.parse(r.project_json),comments:await all('SELECT id,target,author,text,status,created_at AS createdAt FROM review_comments WHERE review_id=? ORDER BY created_at,id',key)}):json({error:'ไม่พบ Review'},404);}
   if(request.method==='POST'&&!key){const b=await readBody(request);if(!id(b.id)||!text(b.name,Infinity))return json({error:'ชื่อ Review ไม่ถูกต้อง'},422);const p=validateInput(b.project);const existing=await first('SELECT id FROM design_reviews WHERE id=?',b.id);if(existing)return json({id:b.id});const total=await first('SELECT COUNT(*) AS n FROM design_reviews');if(total.n>=1000)return json({error:'Review เต็ม'},409);await run('INSERT INTO design_reviews(id,name,project_json,created_at) VALUES(?,?,?,?)',b.id,b.name.trim(),JSON.stringify(p),new Date().toISOString());return json({id:b.id},201);}
   if(key&&comments){const review=await first('SELECT project_json FROM design_reviews WHERE id=?',key);if(!review)return json({error:'ไม่พบ Review'},404);const b=await readBody(request);
    if(request.method==='POST'&&!commentId){const p=JSON.parse(review.project_json);if(!id(b.id)||!text(b.author,80)||!text(b.text,2000)||!['project',...p.devices.map(d=>'device:'+d.id),...p.links.map(l=>'link:'+l.id)].includes(b.target))return json({error:'Comment ไม่ถูกต้อง'},422);const total=await first('SELECT COUNT(*) AS n FROM review_comments WHERE review_id=?',key);if(total.n>=500)return json({error:'Comment เต็ม'},409);await run('INSERT INTO review_comments(id,review_id,target,author,text,status,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',b.id,key,b.target,b.author.trim(),b.text.trim(),'pending',new Date().toISOString());return json({id:b.id},201);}
    if(request.method==='PATCH'&&commentId&&['pending','changes','approved'].includes(b.status)){const r=await run('UPDATE review_comments SET status=? WHERE id=? AND review_id=?',b.status,commentId,key);return r.meta?.changes?json({id:commentId}):json({error:'ไม่พบ Comment'},404);}
   }
   return json({error:'ไม่รองรับคำสั่งนี้'},405);
  }
  if(comments)return json({error:'ไม่พบรายการ'},404);
  if(request.method==='GET'){
   if(!key)return json({templates:(await all('SELECT id,name,device_count AS deviceCount,link_count AS linkCount,created_at AS createdAt,metadata_json,revision FROM topology_templates ORDER BY created_at DESC,id DESC LIMIT 500')).map(r=>{const {metadata_json,...t}=r;return {...t,...JSON.parse(metadata_json)};})});
   const r=await first('SELECT * FROM topology_templates WHERE id=?',key);return r?json({id:r.id,name:r.name,revision:r.revision,...JSON.parse(r.metadata_json),project:JSON.parse(r.project_json)}):json({error:'ไม่พบ Template'},404);
  }
  if(!['POST','PUT','DELETE'].includes(request.method)||request.method==='POST'&&key||request.method!=='POST'&&!key)return json({error:'ไม่รองรับคำสั่งนี้'},405);
  const b=await readBody(request),existing=key?await first('SELECT * FROM topology_templates WHERE id=?',key):null;
  if(key&&!existing)return json({error:'ไม่พบ Template'},404);
  if(key&&b.revision!==existing.revision)return json({error:'Template ถูกแก้ไขแล้ว บันทึก Canvas เป็น Template ใหม่ หรือเปิดต้นฉบับล่าสุดเพื่อแก้ไข'},409);
  if(request.method==='DELETE'){const r=await run('DELETE FROM topology_templates WHERE id=? AND revision=?',key,b.revision);return r.meta?.changes?json({id:key}):json({error:'Template ถูกแก้ไขแล้ว'},409);}
  if(!id(b.id)||!text(b.name,80)||key&&b.id!==key)return json({error:'ชื่อหรือรหัส Template ไม่ถูกต้อง'},422);
  const p=validateInput(b.project),name=b.name.trim(),projectJson=JSON.stringify(p),metadata=JSON.stringify(meta(b));
  if(key){const r=await run('UPDATE topology_templates SET name=?,project_json=?,device_count=?,link_count=?,metadata_json=?,revision=revision+1 WHERE id=? AND revision=?',name,projectJson,p.devices.length,p.links.length,metadata,key,b.revision);return r.meta?.changes?json({id:key,revision:b.revision+1}):json({error:'Template ถูกแก้ไขแล้ว'},409);}
  const previous=await first('SELECT * FROM topology_templates WHERE id=?',b.id);if(previous)return previous.name===name&&previous.project_json===projectJson?json({id:b.id}):json({error:'รหัส Template นี้มีข้อมูลอยู่แล้ว'},409);
  const result=await run('INSERT INTO topology_templates(id,name,project_json,device_count,link_count,created_at,metadata_json) SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM topology_templates)<500 ON CONFLICT(id) DO NOTHING',b.id,name,projectJson,p.devices.length,p.links.length,new Date().toISOString(),metadata);return result.meta?.changes?json({id:b.id},201):json({error:'Shared Templates เต็มหรือมีรายการซ้ำ'},409);
 }catch(e){if(e.isValidation||e instanceof SyntaxError||/ข้อมูล|Topology|Template|MB/.test(e.message))return json({error:e.message},422);console.error('Database operation failed',e?.name);return json({error:'เปิดหรือบันทึกข้อมูลไม่ได้ ข้อมูลบน Canvas ยังอยู่ กรุณาลองใหม่'},503);}
}

// Allow only this owner's GitHub Pages frontend to use the existing public API.
const PAGES_ORIGIN='https://ultimatenavee.github.io';
export default {async fetch(request,env){
 const api=new URL(request.url).pathname.startsWith('/api/'),allowed=api&&request.headers.get('Origin')===PAGES_ORIGIN;
 if(api&&request.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers:allowed?{'Access-Control-Allow-Origin':PAGES_ORIGIN,'Access-Control-Allow-Methods':'GET, POST, PUT, PATCH, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{}});
 const response=await handle(request,env);if(!allowed)return response;
 const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',PAGES_ORIGIN);headers.append('Vary','Origin');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}};
