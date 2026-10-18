// Image pickers sit above the validated compatibility selects used by the renderer.
// Text from local item tables is always assigned as text, never parsed as HTML.
export function bindWardrobePickers(dialog,{fields,items,onSelect}){
 const q=s=>dialog.querySelector(s),job=q('[data-class-trigger]'),menu=q('[data-class-list]');
 let slot='upper',limit=120;
 const icon=(item,size=48)=>{const im=document.createElement('img');im.src=item.icon;im.alt='';im.width=im.height=size;im.loading='lazy';return im;};
 const label=item=>item?.label||'ไม่ใส่';
 function imageButton(item,key,selected){const b=document.createElement('button');b.type='button';b.dataset.item=item.id;b.title=label(item);b.setAttribute('aria-label',label(item));b.setAttribute('aria-pressed',String(item.id===selected));if(item.icon)b.append(icon(item));else b.textContent='◇';b.onclick=()=>onSelect(key,item.id);return b;}
 function close(){menu.hidden=true;job.setAttribute('aria-expanded','false');}
 function classes(){
  const list=items('body'),selected=list.find(x=>x.id===fields.body.value);job.replaceChildren();if(selected?.icon)job.append(icon(selected,30));const text=document.createElement('span');text.textContent=selected?.label||'เลือกอาชีพ';job.append(text,document.createTextNode(' ▾'));
  menu.replaceChildren();let group;
  for(const item of list){if(group!==item.group){group=item.group;const title=document.createElement('div');title.className='ro-job-group';title.textContent=group;title.setAttribute('role','presentation');menu.append(title);}
   const option=imageButton(item,'body',fields.body.value);option.removeAttribute('aria-pressed');option.setAttribute('role','option');option.setAttribute('aria-selected',String(item.id===fields.body.value));option.append(document.createTextNode(item.label));option.onclick=()=>{close();job.focus();onSelect('body',item.id);};menu.append(option);
  }
  dialog.querySelectorAll('[data-sex]').forEach(b=>b.setAttribute('aria-pressed',String(fields.sex.value===b.dataset.sex)));
 }
 function hair(){const grid=q('[data-hair-grid]');grid.replaceChildren(...items('head').filter(x=>x.icon).map(x=>imageButton(x,'head',fields.head.value)));q('[data-hair-caption]').textContent=`Hair Style · ${fields.sex.value==='female'?'หญิง':'ชาย'} · ${grid.children.length} แบบ`;}
 function equipment(){
  dialog.querySelectorAll('[data-slot]').forEach(b=>{const key=b.dataset.slot,selected=items(key).find(x=>x.id===fields[key].value);b.setAttribute('aria-selected',String(key===slot));b.tabIndex=key===slot?0:-1;const picture=b.querySelector('span');picture.replaceChildren();if(selected?.icon)picture.append(icon(selected,38));else picture.textContent='⊘';b.title=label(selected);q(`[data-clear="${key}"]`).disabled=!selected;});
  const term=fields.search.value.trim().toLocaleLowerCase(),unknown=q('[data-unknown]').checked;
  const matching=items(slot).filter(x=>x.icon&&(slot==='robe'||x.slots?.includes(slot)||unknown&&!x.slots?.length)&&(!term||`${x.label} ${x.itemId||''}`.toLocaleLowerCase().includes(term)));
  q('[data-equipment-grid]').replaceChildren(...matching.slice(0,limit).map(x=>imageButton(x,slot,fields[slot].value)));
  q('[data-item-count]').textContent=`${({upper:'Upper',middle:'Middle',lower:'Lower',robe:'Garment'})[slot]} · ${matching.length.toLocaleString()} ชิ้น`;
  q('[data-more]').hidden=matching.length<=limit;q('[data-empty]').hidden=!!matching.length;q('[data-unknown-label]').hidden=slot==='robe';
  const selected=items(slot).find(x=>x.id===fields[slot].value);q('[data-selected-item]').textContent=selected?label(selected)+(slot==='robe'||selected.slots?.length?'':' · ไม่ระบุตำแหน่งในข้อมูลเกม'):'เลือกภาพไอเทมเพื่อดูตัวอย่างทันที';
 }
 job.onclick=()=>{menu.hidden=!menu.hidden;job.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector('[aria-selected=true]')?.focus();};
 job.onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();menu.hidden=false;job.setAttribute('aria-expanded','true');menu.querySelector('[aria-selected=true]')?.focus();}};
 menu.onkeydown=e=>{const options=[...menu.querySelectorAll('[role=option]')],at=options.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();options[e.key==='Home'?0:e.key==='End'?options.length-1:(at+(e.key==='ArrowDown'?1:-1)+options.length)%options.length]?.focus();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();job.focus();}};
 dialog.addEventListener('click',e=>{if(!e.target.closest('.ro-class-picker'))close();});
 dialog.querySelectorAll('[data-sex]').forEach(b=>b.onclick=()=>{fields.sex.value=b.dataset.sex;fields.sex.onchange();});
 dialog.querySelectorAll('[data-slot]').forEach(b=>{b.onclick=()=>{slot=b.dataset.slot;limit=120;equipment();};b.onkeydown=e=>{const tabs=[...dialog.querySelectorAll('[data-slot]')];if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?3:(tabs.indexOf(b)+(e.key==='ArrowRight'?1:3))%4;tabs[n].click();tabs[n].focus();}};});
 dialog.querySelectorAll('[data-clear]').forEach(b=>b.onclick=()=>onSelect(b.dataset.clear,''));
 fields.search.oninput=()=>{limit=120;equipment();};q('[data-unknown]').onchange=()=>{limit=120;equipment();};q('[data-more]').onclick=()=>{limit+=120;equipment();};
 return {refresh(){classes();hair();equipment();},equipment,close};
}
