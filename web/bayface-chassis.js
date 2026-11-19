'use strict';
(() => {
 const map=(profile,item)=>window.NOAH_BAYFACE_MODEL.slotMap(profile,item);
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function plates(profile,item){
  const compact=profile.slotLayout==='M24',cols=compact?14:13;
  const [x,y,width,height]=compact?[20,72,238,245]:[95,167,730,447];
  return map(profile,item).map(({slot,col,row,rows})=>{
   const board=item.cards?.find(c=>c.slot===slot)?.board;
   const w=width/cols,h=height*rows/2,cx=x+(col+.5)*w,cy=y+row*height/2;
   const font=w*.49;
   return `<g><title>IU${slot} · ${esc(board||'ว่าง')}</title><rect x="${cx-w/2}" y="${cy}" width="${w}" height="${h}" stroke="#526476" stroke-width="${w*.045}" fill="${board?'#bee2eb':'#e5e9ed'}"/><text x="${cx}" y="${cy+font*1.5}" text-anchor="middle" fill="#21384a" font-family="Arial" font-size="${font}">${slot}</text>${board?`<text transform="translate(${cx} ${cy+h*.55}) rotate(-90)" text-anchor="middle" fill="#173947" font-family="Arial" font-size="${font*1.15}">${esc(board.length>15?board.slice(0,14)+'…':board)}</text>`:''}</g>`;
  }).join('');
 }
 function preview(profile,item){
  const {width,height}=profile.displayDimensions;
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="ผังการ์ด ${esc(profile.model)}"><image href="${esc(profile.displayImage)}" width="${width}" height="${height}"/>${plates(profile,item)}</svg>`;
 }
 function mount(host,profile,initial={}){
  if(!host)return;
  host.replaceChildren();
  host.readChassis=undefined;
  if(!profile?.slotLayout)return;
  const m12=profile.slotLayout==='M12';
  const item={slotMode:initial.slotMode||'service',subrackId:initial.subrackId||'',cards:(initial.cards||[]).map(c=>({...c}))};
  host.innerHTML=`<fieldset><legend>การ์ดใน Chassis</legend><label class="field">Subrack ID<input data-subrack maxlength="32" value="${esc(item.subrackId)}"></label>${m12?`<label class="field">ช่องขวาสุด<select data-mode><option value="service">IU13 · Service</option><option value="control">IU72 + IU71 · Control</option></select></label>`:''}<div data-face></div><p class="small-note">กรอกรหัสบนหน้าการ์ดตามเครื่องจริง ล้างช่องเพื่อถอดการ์ด · <a target="_blank" rel="noopener" href="${esc(profile.slotSource)}">ผังช่อง Huawei</a></p><div data-boards class="form-grid"></div><p data-slot-error role="alert"></p></fieldset>`;
  const refs=document.createElement('details');
  refs.innerHTML='<summary>ภาพการ์ดอ้างอิง Huawei</summary>'+profile.referenceCards.map(c=>`<figure><img loading="lazy" height="110" alt="${esc(c.name)}" src="${esc(c.image)}"><figcaption>${esc(c.name)}</figcaption></figure>`).join('');
  host.append(refs);
  for(const [idx,figure] of [...refs.querySelectorAll('figure')].entries()){
   const button=document.createElement('button');
   button.type='button';button.textContent='คัดลอกรูป';button.dataset.copyReference=String(idx);
   figure.append(button);
  }
  host.onclick=async e=>{
   const button=e.target.closest('[data-copy-reference],[data-copy-slot]');
   if(!button)return;
   try{
    if(button.hasAttribute('data-copy-reference'))await window.NOAH_BAYFACE_EXCEL.copyReference(profile.referenceCards[Number(button.dataset.copyReference)].image);
    else{
     const card=item.cards.find(c=>c.slot===Number(button.dataset.copySlot));
     if(!card)throw Error('กรอกรหัสการ์ดก่อนคัดลอก');
     await window.NOAH_BAYFACE_EXCEL.copyLabel(card.board);
    }
    window.NOAH_APP.toast('คัดลอกแล้ว กด Ctrl+V ใน Excel');
   }catch(error){window.NOAH_APP.toast(error.message);}
  };
  const get=s=>host.querySelector(s);
  const draw=()=>{get('[data-face]').innerHTML=preview(profile,item);};
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
    copy.type='button';copy.dataset.copySlot=input.dataset.slot;copy.textContent='คัดลอกป้าย';
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
  host.readChassis=()=>({slotMode:item.slotMode,subrackId:item.subrackId.trim(),cards:item.cards.map(c=>({...c}))});
  fields();
 }
 window.NOAH_CHASSIS={mount,plates};
})();
