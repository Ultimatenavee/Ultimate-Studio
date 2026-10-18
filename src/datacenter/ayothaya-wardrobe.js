import {bindWardrobePickers} from './wardrobe-picker.js';
const BASE='/api/ayothaya/wardrobe/',KEY='uts-ayothaya-appearance';
export function savedAppearance(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch{return null;}}
export function createWardrobe(host,{apply,pause,onError}){
 const button=document.createElement('button');button.type='button';button.className='ayothaya-wardrobe-toggle';button.textContent='♙ แต่งตัวละคร';host.append(button);
 const dialog=document.createElement('dialog');dialog.className='ayothaya-wardrobe';
 dialog.innerHTML=`<form method="dialog" class="ro-dress-heading"><div><strong>แต่งตัวละคร</strong><small>Ragnarok · พรีวิวชุดทันที</small></div><button aria-label="ปิดหน้าต่างแต่งตัว">✕</button></form>
 <div class="ro-dress-content"><section class="ro-dress-fields">
 <div class="ro-class-picker"><label id="ro-class-label">Class Selection</label><button type="button" data-class-trigger aria-labelledby="ro-class-label" aria-haspopup="listbox" aria-expanded="false" aria-controls="ro-class-list"></button><div id="ro-class-list" data-class-list role="listbox" aria-label="เลือกอาชีพ" hidden></div></div>
 <div class="ro-gender" role="group" aria-label="เพศ"><button type="button" data-sex="male">♂ ชาย</button><button type="button" data-sex="female">♀ หญิง</button></div>
 <strong data-hair-caption>Hair Style</strong><div data-hair-grid class="ro-icon-grid ro-hair-grid" aria-label="เลือกทรงผม"></div>
 <div class="ro-dress-pair"><label>สีผม<select name="hairPalette"></select></label><label>สีชุด<select name="bodyPalette"></select></label></div>
 <details class="ro-advanced"><summary>อาวุธ / โล่</summary><label>อาวุธ<select name="weapon"></select></label><label>โล่<select name="shield"></select></label></details>
 <div hidden><select name="race"><option value="human">Human</option><option value="doram">Doram</option></select><select name="sex"><option value="male">ชาย</option><option value="female">หญิง</option></select><select name="body"></select><select name="head"></select><select name="upper"></select><select name="middle"></select><select name="lower"></select><select name="robe"></select></div>
 </section><section class="ro-dress-preview"><small class="ro-preview-kicker">LIVE PREVIEW</small><canvas width="300" height="360" aria-label="ตัวอย่างชุดตัวละคร"></canvas><div><button type="button" data-turn="-1" aria-label="หมุนซ้าย">↶</button><button type="button" data-walk>ทดลองเดิน</button><button type="button" data-sit-preview>นั่ง</button><button type="button" data-turn="1" aria-label="หมุนขวา">↷</button></div><strong data-preview-class></strong><small>เลือกอาชีพ ทรงผม หรือไอเทม<br>เพื่อดูตัวอย่างก่อนใช้ชุด</small><small data-counts></small></section>
 <section class="ro-equipment"><label class="ro-item-search">ค้นหาของสวมใส่<input type="search" name="search" placeholder="ชื่อไอเทม / หมายเลขไอเทม"></label><div class="ro-slot-tabs" role="tablist" aria-label="ตำแหน่งสวมใส่">
 <div><button type="button" role="tab" data-slot="upper" aria-selected="true" aria-controls="ro-equipment-grid">UPPER<span>⊘</span></button><button type="button" data-clear="upper" aria-label="ล้าง Upper">CLEAR</button></div>
 <div><button type="button" role="tab" data-slot="middle" aria-selected="false" aria-controls="ro-equipment-grid">MIDDLE<span>⊘</span></button><button type="button" data-clear="middle" aria-label="ล้าง Middle">CLEAR</button></div>
 <div><button type="button" role="tab" data-slot="lower" aria-selected="false" aria-controls="ro-equipment-grid">LOWER<span>⊘</span></button><button type="button" data-clear="lower" aria-label="ล้าง Lower">CLEAR</button></div>
 <div><button type="button" role="tab" data-slot="robe" aria-selected="false" aria-controls="ro-equipment-grid">GARMENT<span>⊘</span></button><button type="button" data-clear="robe" aria-label="ล้าง Garment">CLEAR</button></div></div>
 <div class="ro-item-meta"><small data-item-count></small><label data-unknown-label><input type="checkbox" data-unknown> รวมไอเทมที่ไม่ระบุตำแหน่ง</label></div>
 <div class="ro-item-scroll"><div id="ro-equipment-grid" data-equipment-grid class="ro-icon-grid" role="tabpanel" aria-label="ของสวมใส่"></div><p data-empty hidden>ไม่พบไอเทมที่ตรงกัน ลองเปลี่ยนคำค้นหรือหมวด</p><button type="button" data-more hidden>แสดงเพิ่ม</button></div><p data-selected-item></p></section></div>
 <footer><span role="status" aria-live="polite"></span><button type="button" data-reset>คืนชุด Novice</button><button type="button" data-retry hidden>ลองโหลดอีกครั้ง</button><button type="button" data-apply disabled>ใช้ชุดนี้</button></footer>`;
 document.body.append(dialog);
 const fields=Object.fromEntries([...dialog.querySelectorAll('[name]')].map(e=>[e.name,e])),status=dialog.querySelector('[role=status]'),retry=dialog.querySelector('[data-retry]'),save=dialog.querySelector('[data-apply]'),canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d');
 let catalog=null,draft={},candidate=null,image=null,meta=null,direction=0,walking=false,sitting=false,frame=0,revision=0,openRevision=0,previewRevision=0,closed=false,loading=false,loadingChoices=false,rendering=false,queued=null,timer=0,lists={};
 const previews=new Map();
 const pickers=bindWardrobePickers(dialog,{fields,items:key=>lists[key]?.items||[],onSelect:(key,id)=>{fields[key].value=id;fields[key].onchange();}});
 const message=text=>status.textContent=text;
 const request=async(url,options)=>{if(!window.UTS_BROWSER_LOCAL||window.UTS_PORTABLE_WARDROBE!==false)return (await import('./online-wardrobe.js')).onlineWardrobeRequest(url,options);const r=await fetch(BASE+url,options),data=await r.json();if(!r.ok)throw Error(data.error||'โหลดรายการไม่สำเร็จ');return data;};
 function fill(key,items,{optional=true,search=false}={}){
  lists[key]={items,optional,search};const selected=draft[key]||'',query='',shown=search&&query?items.filter(x=>x.id===selected||(x.label+' '+x.name).toLowerCase().includes(query)):items;
  fields[key].replaceChildren();if(optional)fields[key].add(new Option(key.includes('Palette')?'สีต้นฉบับ':'ไม่ใส่',''));
  for(const item of shown){const label=key.includes('Palette')?'สี '+item.name.split('_').at(-1):item.label;fields[key].add(new Option(label,item.id));}
  fields[key].value=items.some(x=>x.id===selected)?selected:optional?'':shown[0]?.id||'';draft[key]=fields[key].value;
 }
 function bodies(){fill('body',catalog.bodies.filter(x=>x.sex===fields.sex.value),{optional:false});pickers.refresh();}
 function invalid(){previewRevision++;clearTimeout(timer);queued=null;candidate=null;save.disabled=true;retry.hidden=true;canvas.setAttribute('aria-busy','true');}
 // One render at a time, with only the latest selection waiting. A slow older
 // response must never replace a newer preview or enable Apply for the wrong outfit.
 function schedule(){invalid();if(loadingChoices)return;message('กำลังอัปเดตตัวอย่าง…');const version=previewRevision,config=read();timer=setTimeout(()=>{queued={version,config};void renderLatest();},140);}
 async function renderLatest(){
  if(rendering||!queued||closed||!dialog.open)return;
  const job=queued;queued=null;rendering=true;const key=JSON.stringify(job.config);
  try{
   let outfit=previews.get(key);
   if(!outfit){const result=await request('render',{method:'POST',headers:{'Content-Type':'application/json'},body:key});const pixels=await loadOutfit(result.base);outfit={result,...pixels};previews.set(key,outfit);if(previews.size>24)previews.delete(previews.keys().next().value);}
   if(job.version!==previewRevision||closed||!dialog.open)return;
   ({meta,image}=outfit);candidate=outfit.result;canvas.dataset.appearance=candidate.base;canvas.setAttribute('aria-busy','false');save.disabled=false;message('พรีวิวอัปเดตแล้ว · หมุนดูหรือทดลองเดิน แล้วกด “ใช้ชุดนี้”');
  }catch(e){if(job.version===previewRevision&&dialog.open&&!closed){message(e.message);retry.hidden=false;canvas.setAttribute('aria-busy','false');}}
  finally{rendering=false;if(queued)void renderLatest();}
 }
 async function refresh(){
  const n=++revision;loadingChoices=true;invalid();message('กำลังโหลดรายการที่เข้ากับชุด…');
  try{const data=await request('choices?'+new URLSearchParams({body:draft.body,head:draft.head||''}));if(n!==revision||closed||!dialog.open)return;fill('head',data.heads,{optional:false});for(const [key,list]of Object.entries({upper:'headgear',middle:'headgear',lower:'headgear',robe:'robes',weapon:'weapons',shield:'shields',bodyPalette:'bodyPalettes',hairPalette:'hairPalettes'}))fill(key,data[list],{search:!key.includes('Palette')});loadingChoices=false;pickers.refresh();dialog.querySelector('[data-preview-class]').textContent=catalog.bodies.find(x=>x.id===draft.body)?.label||'';schedule();}
  catch(e){if(n===revision){message(e.message);retry.hidden=false;canvas.setAttribute('aria-busy','false');}}finally{if(n===revision)loadingChoices=false;}
 }
 function read(){for(const key of ['body','head','upper','middle','lower','robe','weapon','shield','bodyPalette','hairPalette'])draft[key]=fields[key].value;return {...draft};}
 async function loadOutfit(base){
  if(base.startsWith('ro-outfit:')){const a=await (await import('./online-wardrobe.js')).onlineOutfitAssets(base),im=new Image();im.src=a.url;await im.decode();return {meta:a.meta,image:im};}const r=await fetch(base+'.json');if(!r.ok)throw Error('โหลดภาพชุดไม่สำเร็จ');const m=await r.json(),im=new Image();im.src=base+'.png';await im.decode();return {meta:m,image:im};
 }
 function paint(time){
  if(closed)return;frame=requestAnimationFrame(paint);if(!dialog.open)return;
  ctx.clearRect(0,0,300,360);ctx.fillStyle='#dde7e6';ctx.fillRect(0,0,300,360);ctx.strokeStyle='#b6c9c7';for(let y=270;y<360;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(300,y);ctx.stroke();}
  ctx.fillStyle='#213a4c33';ctx.beginPath();ctx.ellipse(150,318,35,9,0,0,Math.PI*2);ctx.fill();
  if(!image||!meta)return;const a=meta.actions[(sitting&&meta.actions.length>=24?16:walking?8:0)+direction],f=a.start+(walking?Math.floor(time/a.frameMs)%a.count:0),s=Math.min(2.6,230/meta.height,260/meta.width),anchor=meta.anchor||[.5,2/meta.height];ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,(f%meta.columns)*meta.width,Math.floor(f/meta.columns)*meta.height,meta.width,meta.height,150-meta.width*anchor[0]*s,318-meta.height*(1-anchor[1])*s,meta.width*s,meta.height*s);
 }
 retry.onclick=()=>void refresh();
 save.onclick=async()=>{if(!candidate||loading)return;const selected=candidate;loading=true;save.disabled=true;dialog.querySelector('.ro-dress-content').inert=true;message('กำลังเปลี่ยนชุด…');try{await apply(selected.base);try{localStorage.setItem(KEY,JSON.stringify(selected));}catch{}dialog.close();}catch(e){message(e.message);}finally{loading=false;dialog.querySelector('.ro-dress-content').inert=false;save.disabled=!candidate;}};
 dialog.querySelector('[data-reset]').onclick=async()=>{if(loading)return;try{await apply('assets/ayothaya/avatar/novice');localStorage.removeItem(KEY);draft={};dialog.close();}catch(e){message(e.message);}};
 dialog.querySelectorAll('[data-turn]').forEach(b=>b.onclick=()=>direction=(direction+Number(b.dataset.turn)+8)%8);
 dialog.querySelector('[data-walk]').onclick=e=>{sitting=false;dialog.querySelector('[data-sit-preview]').textContent='นั่ง';walking=!walking;e.currentTarget.textContent=walking?'หยุดเดิน':'ทดลองเดิน';};
 dialog.querySelector('[data-sit-preview]').onclick=e=>{sitting=!sitting;walking=false;dialog.querySelector('[data-walk]').textContent='ทดลองเดิน';e.currentTarget.textContent=sitting?'ยืน':'นั่ง';};
 fields.sex.onchange=()=>{const label=catalog.bodies.find(x=>x.id===draft.body)?.label,body=catalog.bodies.find(x=>x.sex===fields.sex.value&&x.label===label)||catalog.bodies.find(x=>x.sex===fields.sex.value&&x.label==='Novice');draft={body:body.id};bodies();void refresh();};
 fields.body.onchange=()=>{draft={body:fields.body.value};void refresh();};fields.head.onchange=()=>{draft.head=fields.head.value;draft.hairPalette='';pickers.refresh();void refresh();};
 for(const key of ['upper','middle','lower','robe','weapon','shield','bodyPalette','hairPalette']){
  fields[key].onchange=()=>{draft[key]=fields[key].value;pickers.refresh();schedule();};

 }
 dialog.addEventListener('close',()=>{pickers.close();revision++;openRevision++;invalid();loadingChoices=false;});
 button.onclick=async()=>{
  pause();dialog.showModal();invalid();const n=++openRevision;dialog.querySelector('.ro-dress-content').inert=true;message('กำลังเปิดตู้เสื้อผ้า…');
  try{catalog??=await request('catalog');const saved=savedAppearance(),pixels=await loadOutfit(saved?.base||'assets/ayothaya/avatar/novice');if(n!==openRevision||closed||!dialog.open)return;({meta,image}=pixels);draft={...(saved?.appearance||{})};const initial=catalog.bodies.find(x=>x.id===draft.body)||catalog.bodies.find(x=>x.label==='Novice'&&x.sex==='male');draft.body=initial.id;fields.race.value=initial.race;fields.sex.value=initial.sex;fields.search.value='';bodies();await refresh();dialog.querySelector('[data-counts]').textContent=`${new Set(catalog.bodies.map(x=>x.label)).size} อาชีพ · สไปรต์ต้นฉบับ`;}catch(e){if(n===openRevision&&!closed){message('เปิดตู้เสื้อผ้าไม่สำเร็จ: '+e.message);onError?.(e);}}finally{if(n===openRevision)dialog.querySelector('.ro-dress-content').inert=false;}
 };
 frame=requestAnimationFrame(paint);
 return {dispose(){closed=true;revision++;invalid();previews.clear();cancelAnimationFrame(frame);dialog.remove();button.remove();}};
}
