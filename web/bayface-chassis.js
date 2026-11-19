'use strict';
(() => {
 const map=(profile,item)=>window.NOAH_BAYFACE_MODEL.slotMap(profile,item);
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function face(profile,board){
  if(!board)return;
  const code=board.trim().toUpperCase().replace(/^TN/,'');
  return profile?.referenceCards.find(ref=>ref.code===code);
 }
 async function images(profile,item,resolve){
  const paths=new Set((item.cards||[]).map(c=>face(profile,c.board)?.image).filter(Boolean));
  return new Map(await Promise.all([...paths].map(async path=>[path,await resolve(path)])));
 }
 function plates(profile,item,embedded){
  const compact=profile.slotLayout==='M24',cols=compact?14:13;
  const [x,y,width,height]=compact?[20,72,238,245]:[95,167,730,447];
  return map(profile,item).map(({slot,col,row,rows,box})=>{
   const board=item.cards?.find(c=>c.slot===slot)?.board;
   const [left,cy,w,h]=box||[x+col*width/cols,y+row*height/2,width/cols,height*rows/2],cx=left+w/2;
   const hit=embedded?'':`<rect data-card-iu="${slot}" aria-label="IU${slot} ${esc(board||'ว่าง')}" x="${left}" y="${cy}" width="${w}" height="${h}" fill="transparent"/>`;
   const font=w*.49;
   const ref=face(profile,board);
   if(ref)return `<g><title>IU${slot} · ${esc(ref.name)}</title><image href="${esc(embedded?.get(ref.image)||ref.image)}" x="${cx-w/2}" y="${cy}" width="${w}" height="${h}" preserveAspectRatio="none"/>${hit}</g>`;
   return `<g><title>IU${slot} · ${esc(board||'ว่าง')}</title><rect x="${cx-w/2}" y="${cy}" width="${w}" height="${h}" stroke="#526476" stroke-width="${w*.045}" fill="${board?'#bee2eb':'#e5e9ed'}"/><text x="${cx}" y="${cy+font*1.5}" text-anchor="middle" fill="#21384a" font-family="Arial" font-size="${font}">${slot}</text>${board?`<text transform="translate(${cx} ${cy+h*.55}) rotate(-90)" text-anchor="middle" fill="#173947" font-family="Arial" font-size="${font*1.15}">${esc(board.length>15?board.slice(0,14)+'…':board)}</text>`:''}${hit}</g>`;
  }).join('');
 }
 function preview(profile,item){
  const {width,height}=profile.displayDimensions;
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="ผังการ์ด ${esc(profile.model)}"><image href="${esc(profile.displayImage)}" width="${width}" height="${height}"/>${plates(profile,item)}</svg>`;
 }
 function bindLibrary(library,{targetFor,install,enabled}){
  const entries=new Map();
  for(const p of window.NOAH_DWDM_CHASSIS)for(const ref of p.referenceCards){
   if(!ref.code)continue;
   if(!entries.has(ref.code))entries.set(ref.code,{ref,models:[]});
   entries.get(ref.code).models.push(p.slotLayout);
  }
  library.innerHTML='<h3>การ์ด DWDM</h3><p class="small-note">ลากรูปลงช่อง IU หรือเลือกการ์ดแล้วคลิกช่องสีเขียว</p><div class="board-palette">'+[...entries.values()].map(({ref,models})=>
   `<div class="board-asset-row"><button type="button" draggable="true" class="board-asset" data-board-asset="${ref.code}" aria-pressed="false"><img draggable="false" src="${esc(ref.image)}" alt=""><span><strong>${esc(ref.code)}</strong><small>${models.join(' / ')}</small></span></button><button type="button" class="asset-copy" data-copy-board="${ref.code}" aria-label="คัดลอกรูป ${ref.code}">คัดลอกรูป</button></div>`).join('')+'</div>';
  const root=library.ownerDocument,placement=window.NOAH_BAYFACE_MODEL.cardPlacement;
  let selected='',dragging=false,hover;
  function clear(){
   selected='';dragging=false;hover=null;
   root.body.classList.remove('placing-board');
   for(const el of root.querySelectorAll('[data-board-asset][aria-pressed="true"]'))el.setAttribute('aria-pressed','false');
   for(const el of root.querySelectorAll('.board-available,.board-hover')){
    el.classList.remove('board-available','board-hover');el.removeAttribute('tabindex');
   }
  }
  function start(code){
   clear();selected=code;root.body.classList.add('placing-board');
   library.querySelector('[data-board-asset="'+code+'"]')?.setAttribute('aria-pressed','true');
   const contexts=new Map();
   for(const hit of root.querySelectorAll('#bayfaceCanvas [data-card-iu],#bayfaceChassis [data-face] [data-card-iu]')){
    const owner=hit.closest('[data-face],[data-bayface-item]');
    if(!contexts.has(owner))contexts.set(owner,targetFor(owner));
    const dest=contexts.get(owner);
    if(dest&&placement(dest.profile,dest.item,code,Number(hit.dataset.cardIu))){
     hit.classList.add('board-available');hit.setAttribute('tabindex','0');
    }
   }
  }
  function place(hit){
   const owner=hit?.closest('[data-face],[data-bayface-item]'),dest=owner&&targetFor(owner);
   const card=dest&&placement(dest.profile,dest.item,selected,Number(hit.dataset.cardIu));
   if(!card){window.NOAH_APP.toast('เลือกช่อง IU สีเขียวที่ว่างและรองรับการ์ดนี้');return;}
   try{
    install(owner,card);clear();
    window.NOAH_APP.toast(card.board+' → IU'+card.slot+(owner.matches('[data-face]')?' · กดบันทึกรายการเพื่อใช้กับ Rack':''));
   }
   catch(err){clear();window.NOAH_APP.toast(err.message);}
  }
  root.addEventListener('dragstart',e=>{
   const el=e.target.closest?.('[data-board-asset]');
   if(!el||!enabled()||!entries.has(el.dataset.boardAsset))return;
   start(el.dataset.boardAsset);dragging=true;
   e.dataTransfer.setData('application/x-ultimate-dwdm-card',selected);e.dataTransfer.effectAllowed='copy';
  },true);
  root.addEventListener('dragover',e=>{
   if(!dragging)return;
   e.preventDefault();e.stopPropagation();
   const hit=e.target.closest?.('[data-card-iu].board-available');
   if(hover!==hit){hover?.classList.remove('board-hover');hit?.classList.add('board-hover');hover=hit;}
   e.dataTransfer.dropEffect=hit?'copy':'none';
  },true);
  root.addEventListener('drop',e=>{
   if(!dragging)return;
   e.preventDefault();e.stopPropagation();
   if(enabled())place(e.target.closest?.('[data-card-iu]'));clear();
  },true);
  root.addEventListener('dragend',()=>{if(dragging)clear();},true);
  root.addEventListener('pointerdown',e=>{
   if(selected&&e.target.closest?.('[data-card-iu]'))e.stopPropagation();
  },true);
  root.addEventListener('click',e=>{
   const asset=e.target.closest?.('[data-board-asset]');
   if(asset&&enabled()){e.preventDefault();e.stopPropagation();if(selected===asset.dataset.boardAsset)clear();else start(asset.dataset.boardAsset);return;}
   if(!selected)return;
   const hit=e.target.closest?.('[data-card-iu]');
   if(hit&&enabled()){e.preventDefault();e.stopPropagation();place(hit);}else clear();
  },true);
  root.addEventListener('keydown',e=>{
   if(!selected)return;
   if(e.key==='Escape'){clear();return;}
   if((e.key==='Enter'||e.key===' ')&&enabled()&&e.target.matches?.('[data-card-iu]')){
    e.preventDefault();e.stopPropagation();place(e.target);
   }
  },true);
 }
 function mount(host,profile,initial={}){
  if(!host)return;
  host.replaceChildren();
  host.readChassis=undefined;
  if(!profile?.slotLayout)return;
  const m12=profile.slotLayout==='M12';
  const item={slotMode:initial.slotMode||'service',subrackId:initial.subrackId||'',cards:(initial.cards||[]).map(c=>({...c}))};
  host.innerHTML=`<fieldset><legend>การ์ดใน Chassis</legend><label class="field">Subrack ID<input data-subrack maxlength="32" value="${esc(item.subrackId)}"></label>${m12?`<label class="field">ช่องขวาสุด<select data-mode><option value="service">IU13 · Service</option><option value="control">IU72 + IU71 · Control</option></select></label>`:''}<div data-face></div><p class="small-note">ลากการ์ดจากคลัง DWDM มาวางบนผังช่อง แล้วกดบันทึกรายการ · <a target="_blank" rel="noopener" href="${esc(profile.slotSource)}">ผังช่อง Huawei</a></p><details data-manual><summary>รายการตามช่อง / กรอกรหัสเพิ่มเติม</summary><div data-boards class="form-grid"></div></details><p data-slot-error role="alert"></p></fieldset>`;
  const refs=document.createElement('details');
  refs.open=!m12;
  refs.innerHTML='<summary>การ์ด DWDM และภาพอ้างอิง</summary>'+profile.referenceCards.map(c=>`<figure><img ${c.code?`draggable="true" data-board-asset="${c.code}"`: ''} loading="lazy" height="110" alt="${esc(c.name)}" src="${esc(c.image)}"><figcaption>${esc(c.name)}</figcaption>${c.source?`<a href="${esc(c.source)}" target="_blank" rel="noopener">ที่มาภาพ</a>`:''} ${c.code?`<button type="button" data-install="${c.code}">ใส่ช่องว่าง</button>`:''}</figure>`).join('');
  host.append(refs);
  for(const [idx,figure] of [...refs.querySelectorAll('figure')].entries()){
   const button=document.createElement('button');
   button.type='button';button.textContent='คัดลอกรูป';button.dataset.copyReference=String(idx);
   figure.append(button);
  }
  host.onclick=async e=>{
   const remove=e.target.closest('[data-remove-board]');
   if(remove){
    item.cards=item.cards.filter(card=>card.slot!==Number(remove.dataset.removeBoard));fields();return;
   }
   const install=e.target.closest('[data-install]');
   if(install){
    const board=install.dataset.install;
    const card=map(profile,item).map(s=>window.NOAH_BAYFACE_MODEL.cardPlacement(profile,item,board,s.slot)).find(Boolean);
    if(!card){get('[data-slot-error]').textContent='ไม่มีช่องว่างที่รองรับ '+board;return;}
    item.cards.push(card);get('[data-slot-error]').textContent='';fields();
    return;
   }
   const button=e.target.closest('[data-copy-reference],[data-copy-slot]');
   if(!button)return;
   try{
    if(button.hasAttribute('data-copy-reference'))await window.NOAH_BAYFACE_EXCEL.copyReference(profile.referenceCards[Number(button.dataset.copyReference)].image);
    else{
     const card=item.cards.find(c=>c.slot===Number(button.dataset.copySlot));
     if(!card)throw Error('กรอกรหัสการ์ดก่อนคัดลอก');
     const ref=face(profile,card.board);
     if(ref)await window.NOAH_BAYFACE_EXCEL.copyReference(ref.image);
     else await window.NOAH_BAYFACE_EXCEL.copyLabel(card.board);
    }
    window.NOAH_APP.toast('คัดลอกแล้ว กด Ctrl+V ใน Excel');
   }catch(error){window.NOAH_APP.toast(error.message);}
  };
  const get=s=>host.querySelector(s);
  const installed=document.createElement('div');
  installed.className='installed-boards';get('[data-face]').after(installed);
  const draw=()=>{
   get('[data-face]').innerHTML=preview(profile,item);
   installed.innerHTML=item.cards.map(c=>`<div><span>IU${c.slot} · ${esc(c.board)}</span><button type="button" data-remove-board="${c.slot}" aria-label="ถอด ${esc(c.board)} จาก IU${c.slot}">ถอด</button></div>`).join('');
  };
  function fields(){
   draw();
   if(m12)get('[data-mode]').value=item.slotMode;
   get('[data-boards]').innerHTML=map(profile,item).sort((a,b)=>a.slot-b.slot).map(({slot})=>{
    const card=item.cards.find(c=>c.slot===slot);
    const hint=m12?'':slot===71?'G4CXP':slot<=12?(slot===6||slot===7?'G3CXCS':'S2N504'):'';
    return `<div><label class="field">IU${slot}<input maxlength="64" data-slot="${slot}" placeholder="${hint?'เช่น '+hint:'ว่าง'}" value="${esc(card?.board)}"></label>${!m12&&slot<=12?`<label class="check-label"><input type="checkbox" data-full="${slot}" ${card?.full?'checked':''}>11U</label>`:''}</div>`;
   }).join('');
   for(const input of get('[data-boards]').querySelectorAll('[data-slot]')){
    const copy=document.createElement('button');
    copy.type='button';copy.dataset.copySlot=input.dataset.slot;copy.textContent='คัดลอกการ์ด';
    input.parentElement.after(copy);
   }
  }
  host.oninput=e=>{
   if(e.target.matches('[data-subrack]'))item.subrackId=e.target.value;
   if(!e.target.matches('[data-slot]'))return;
   const slot=Number(e.target.dataset.slot),board=e.target.value.trim(),old=item.cards.find(c=>c.slot===slot);
   const before=Boolean(old?.full);
   if(old)old.board=board;
   else if(board)item.cards.push({slot,board});
   if(!board)item.cards=item.cards.filter(c=>c.slot!==slot);
   if(before&&!board)fields();else draw();
  };
  host.onchange=e=>{
   if(e.target.matches('[data-slot]')&&!m12){
    const slot=Number(e.target.dataset.slot),card=item.cards.find(c=>c.slot===slot);
    const rule=card&&window.NOAH_BAYFACE_MODEL.boardRule(card.board);
    if(rule?.slots.includes(slot)&&rule.full&&!card.full&&!item.cards.some(c=>c.slot===slot+12)){
     card.full=true;fields();
    }
    return;
   }
   if(!e.target.matches('[data-mode],[data-full]'))return;
   const error=get('[data-slot-error]');
   error.textContent='';
   if(e.target.matches('[data-mode]')){
    const mode=e.target.value,removed=mode==='control'?[13]:[71,72];
    if(item.cards.some(c=>removed.includes(c.slot)))error.textContent='ถอดการ์ดในช่องขวาสุดก่อนเปลี่ยนรูปแบบ';
    else item.slotMode=mode;
   }else{
    const slot=Number(e.target.dataset.full),card=item.cards.find(c=>c.slot===slot);
    if(!card)error.textContent='กรอกรหัสการ์ดก่อนเลือก 11U';
    else if(e.target.checked&&item.cards.some(c=>c.slot===slot+12))error.textContent='ถอดการ์ดใน IU'+(slot+12)+' ก่อนใช้การ์ดเต็มความสูง';
    else card.full=e.target.checked;
   }
   fields();
  };
  host.installBoard=card=>{item.cards.push(card);fields();};
  host.readChassis=()=>({slotMode:item.slotMode,subrackId:item.subrackId.trim(),cards:item.cards.map(c=>({...c}))});
  fields();
 }
 window.NOAH_CHASSIS={mount,plates,images,face,bindLibrary};
})();
