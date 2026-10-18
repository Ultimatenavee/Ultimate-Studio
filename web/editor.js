'use strict';
(() => {
  // Workspace interactions are separated from model-specific physical behavior.
  const A=window.NOAH_APP,G=window.NOAH_GEOMETRY,$=id=>document.getElementById(id);
  const models=new Map(A.getCatalog().map(m=>[m.id,m]));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=x=>JSON.parse(JSON.stringify(x)),storageKey='noah-workspace-v3',prefsKey='noah-preferences-v3';
  const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
  const stored=load(prefsKey,{}),preferences={theme:'light',grid:20,hostnames:true,deviceDetails:false,linkLabels:true,motion:true,...stored};preferences.snap=stored.snap===true;
  if(!['dark','light'].includes(preferences.theme))preferences.theme='light';
  if(![20,40].includes(preferences.grid))preferences.grid=20;
  preferences.inspectorWidth=Number.isFinite(stored.inspectorWidth)?Math.max(240,Math.min(600,stored.inspectorWidth)):null;
  preferences.libraryWidth=Number.isFinite(stored.libraryWidth)?Math.max(200,Math.min(480,stored.libraryWidth)):null;
  const favorites=new Set(Array.isArray(stored.favorites)?stored.favorites.filter(id=>models.has(id)):[]);
  let recent=Array.isArray(stored.recent)?stored.recent.filter(id=>models.has(id)).slice(0,12):[],libraryView='all';
  const selection={devices:new Set(),labels:new Set(),links:new Set()};
  let editingGroup=null,lastClick=null,gesture=null,space=false,suppressClick=false,clipboard=null,saveTimer=null,lastSaved='',saveFailed=false;
  let projects=load(storageKey,{active:null,projects:[]});
  if(!Array.isArray(projects.projects))projects={active:null,projects:[]};
  projects.projects=projects.projects.slice(0,8);
  const coreSelection=()=>A.getSelection();
  const selectedIds=()=>{
    if(selection.devices.size+selection.labels.size+selection.links.size)return {devices:[...selection.devices],labels:[...selection.labels],links:[...selection.links]};
    const c=coreSelection();return {devices:c.device?[c.device]:[],labels:c.label?[c.label]:[],links:c.link?[c.link]:[]};
  };
  const itemCount=()=>{const s=selectedIds();return s.devices.length+s.labels.length+s.links.length;};
  function clearSelection(render=true){selection.devices.clear();selection.labels.clear();selection.links.clear();if(render)A.select(null);}
  function setSelection(devices=[],labels=[],primary=null,links=[]){
    selection.devices=new Set(devices);selection.labels=new Set(labels);selection.links=new Set(links);
    $('workspace').classList.remove('inspector-hidden');
    A.select(primary||{device:devices[0],label:devices.length?null:labels[0]});
  }
  function preferenceSave(){
    try{localStorage.setItem(prefsKey,JSON.stringify({...preferences,favorites:[...favorites],recent}));}catch{A.toast('บันทึกการตั้งค่าในเครื่องไม่ได้');}
  }
  let inspectorResize=null;
  function inspectorLimits(){
    const width=window.innerWidth,workspace=$('workspace');
    const library=workspace.classList.contains('library-hidden')?0:(+$('libraryResize').getAttribute('aria-valuenow')||270)+16;
    const available=width>1000?workspace.getBoundingClientRect().width-library-328:width-32;
    const max=Math.max(180,Math.min(600,available));return {min:Math.min(240,max),max};
  }
  function applyInspectorWidth(value=preferences.inspectorWidth,persist=false){
    const limits=inspectorLimits(),fallback=260;
    const width=Math.round(Math.max(limits.min,Math.min(limits.max,value??fallback)));
    $('workspace').style.setProperty('--inspector-width',width+'px');
    const handle=$('inspectorResize');
    handle.setAttribute('aria-valuemin',String(limits.min));handle.setAttribute('aria-valuemax',String(limits.max));
    handle.setAttribute('aria-valuenow',String(width));handle.setAttribute('aria-valuetext',width+' pixels');
    if(persist){preferences.inspectorWidth=width;preferenceSave();}
    requestAnimationFrame(onViewChange);return width;
  }
  function finishInspectorResize(cancel=false){
    if(!inspectorResize)return;
    if(cancel)applyInspectorWidth(inspectorResize.original);
    else applyInspectorWidth(+$('inspectorResize').getAttribute('aria-valuenow'),true);
    const pointerId=inspectorResize.pointerId;inspectorResize=null;
    document.body.classList.remove('is-resizing-inspector');
    if($('inspectorResize').hasPointerCapture(pointerId))$('inspectorResize').releasePointerCapture(pointerId);
  }
  let libraryResize=null;
  function libraryLimits(){const w=window.innerWidth;return {min:200,max:Math.max(200,Math.min(480,w-(w>1000&&!$('workspace').classList.contains('inspector-hidden')?+$('inspectorResize').getAttribute('aria-valuenow')||300:0)-400))};}
  function applyLibraryWidth(value=preferences.libraryWidth,persist=false){
    const limits=libraryLimits(),fallback=240;
    const width=Math.round(Math.max(limits.min,Math.min(limits.max,value??fallback))),h=$('libraryResize');
    $('workspace').style.setProperty('--library-width',width+'px');
    h.setAttribute('aria-valuemin',String(limits.min));h.setAttribute('aria-valuemax',String(limits.max));h.setAttribute('aria-valuenow',String(width));
    h.setAttribute('aria-valuetext',width+' pixels');if(persist){preferences.libraryWidth=width;preferenceSave();}requestAnimationFrame(onViewChange);return width;
  }
  function finishLibraryResize(cancel=false){
    if(!libraryResize)return;const g=libraryResize;libraryResize=null;
    applyLibraryWidth(cancel?g.original:+$('libraryResize').getAttribute('aria-valuenow'),!cancel);applyInspectorWidth();
    document.body.classList.remove('is-resizing-library');if($('libraryResize').hasPointerCapture(g.pointerId))$('libraryResize').releasePointerCapture(g.pointerId);
  }
  function applyPreferences(){
    document.documentElement.dataset.theme=preferences.theme;
    document.body.classList.toggle('motion-paused',!preferences.motion);
    $('canvas').style.backgroundSize=preferences.grid+'px '+preferences.grid+'px';
    $('animationBtn').setAttribute('aria-pressed',String(!preferences.motion));
    $('animationBtn').textContent=preferences.motion?'หยุด Animation':'เปิด Animation';
    $('themeBtn').title=preferences.theme==='dark'?'เปลี่ยนเป็น Light':'เปลี่ยนเป็น Dark';
    applyLibraryWidth();applyInspectorWidth();
  }
  function saveLocal(){
    clearTimeout(saveTimer);saveTimer=null;
    const p=A.getProject(),serialized=JSON.stringify(p);
    if(serialized===lastSaved)return true;
    const entry={id:p.id,name:p.name,updatedAt:p.metadata.updatedAt,project:p};
    const next={active:p.id,projects:[entry,...projects.projects.filter(e=>e.id!==p.id)].slice(0,8)};
    try{
      localStorage.setItem(storageKey,JSON.stringify(next));projects=next;lastSaved=serialized;saveFailed=false;
      $('saveStatus').textContent='บันทึกในเครื่องแล้ว';$('saveStatus').classList.remove('dirty');return true;
    }catch{
      saveFailed=true;$('saveStatus').textContent='บันทึกอัตโนมัติไม่ได้ · ดาวน์โหลด Project';$('saveStatus').classList.add('dirty');return false;
    }
  }
  function queueSave(){
    const serialized=JSON.stringify(A.getProject());if(serialized===lastSaved)return;
    $('saveStatus').textContent='กำลังบันทึกในเครื่อง…';$('saveStatus').classList.add('dirty');
    clearTimeout(saveTimer);saveTimer=setTimeout(saveLocal,500);
  }
  function markSaved(){saveLocal();$('saveStatus').textContent=saveFailed?'ดาวน์โหลด Project แล้ว':'บันทึกในเครื่องและดาวน์โหลดแล้ว';$('saveStatus').classList.remove('dirty');}
  function renderGroups(){
    const p=window.NOAH_AUDIENCE.publicProject(A.getProject());$('groups').innerHTML=(p.groups||[]).map(g=>{
      const b=G.groupBounds(g,p,models);if(!b)return '';const title=G.groupTitle(g,p,models,b);
      return `<div class="group-box ${editingGroup===g.id?'group-editing':''}" style="left:${b.x}px;top:${b.y}px;width:${b.width}px;height:${b.height}px;border-color:${g.color};z-index:${g.zIndex??5}"><button class="group-header" data-group="${esc(g.id)}" style="color:${g.color};left:${title.x-b.x}px;top:${title.y-b.y}px">${esc(g.name)}</button></div>`;
    }).join('');
  }
  let miniMapCache=false;
  function onViewChange(){
    const v=A.getView(),svg=$('miniMapSvg');
    if(!miniMapCache){const p=window.NOAH_AUDIENCE.publicProject(A.getProject()),b=G.bounds(p,models);svg.setAttribute('viewBox',`${b.x} ${b.y} ${b.width} ${b.height}`);svg.innerHTML=[...p.links.map(l=>{const g=G.linkLayout(l,p,models),s=G.linkStyle(l,p,models);return `<path d="${g.path}" fill="none" stroke="${s.color}" stroke-width="5" ${s.dash?'stroke-dasharray="12 8"':''}/>`;}),...p.devices.map(d=>{const s=G.deviceSize(d,models);return `<rect x="${d.x}" y="${d.y}" width="${s.width}" height="${s.height}" rx="8" fill="#38bdf855" stroke="#38bdf8" stroke-width="3"/>`;}),'<rect id="miniMapViewport" fill="#38bdf808" stroke="#94a3b8" stroke-width="4"/>'].join('');miniMapCache=true;}
    const viewport=svg.querySelector('#miniMapViewport');if(viewport)for(const [k,val] of Object.entries({x:-v.pan.x/v.zoom,y:-v.pan.y/v.zoom,width:v.width/v.zoom,height:v.height/v.zoom}))viewport.setAttribute(k,val);
  }
  function onRender(){
    miniMapCache=false;
    $('guides').innerHTML='';
    const p=A.getProject();for(const id of selection.devices)if(!p.devices.some(d=>d.id===id))selection.devices.delete(id);
    for(const id of selection.labels)if(!p.labels.some(l=>l.id===id))selection.labels.delete(id);for(const id of selection.links)if(!p.links.some(l=>l.id===id))selection.links.delete(id);
    if(coreSelection().link)clearSelection(false);
    renderGroups();onViewChange();queueSave();
    $('emptyCanvas').hidden=!!(p.devices.length+p.labels.length);
    $('selectionStatus').textContent=itemCount()?`เลือก ${itemCount()} รายการ`:coreSelection().link?'เลือก Link':'';
  }
  function renderInspector(){
    const ids=selectedIds();if(ids.devices.length+ids.labels.length+ids.links.length>1){
      $('inspector').innerHTML=`<div class="section-title"><h2>เลือก ${itemCount()} รายการ</h2></div><p class="muted">${ids.devices.length} อุปกรณ์ · ${ids.labels.length} Labels · ${ids.links.length} Links</p><div class="arrange-actions" style="padding:10px 0">${[['same-size','ขนาดอุปกรณ์เท่ากัน'],['align-left','ชิดซ้าย'],['align-top','ชิดบน'],['distribute-x','กระจายแนวนอน'],['distribute-y','กระจายแนวตั้ง'],['group','Group'],['ungroup','Ungroup'],['duplicate','สำเนา'],['delete','ลบ']].map(([id,name])=>`<button data-editor-action="${id}">${name}</button>`).join('')}</div><p class="small-note">ลากอุปกรณ์ที่เลือกเพื่อย้ายพร้อมกัน · Shift + คลิก เพื่อเพิ่มหรือลดรายการ</p>`;return true;
    }
    const c=coreSelection(),l=c.label&&A.getProject().labels.find(l=>l.id===c.label);
    if(l){
      $('inspector').innerHTML=`<div class="section-title"><h2>${l.kind==='shape'?'Element · '+window.NOAH_ELEMENTS.names[l.shape]:l.kind==='region'?'กรอบพื้นที่':'Text Label'}</h2></div><label class="field">ข้อความ<textarea data-inspector-label="text" maxlength="1000">${esc(l.text)}</textarea></label><div class="form-grid"><label class="field">X<input data-inspector-label="x" type="number" value="${l.x}"></label><label class="field">Y<input data-inspector-label="y" type="number" value="${l.y}"></label><label class="field">ขนาดตัวอักษร<input data-inspector-label="fontSize" type="number" min="12" max="48" value="${l.fontSize}"></label><label class="field">สี<input data-inspector-label="color" type="color" value="${l.color}"></label>${['region','shape'].includes(l.kind)?`<label class="field">ความกว้าง<input data-inspector-label="width" type="number" min="${l.kind==='shape'?32:80}" max="10000" value="${l.width}"></label><label class="field">ความสูง<input data-inspector-label="height" type="number" min="${l.kind==='shape'?32:60}" max="10000" value="${l.height}"></label>`:''}</div>${l.kind==='shape'?window.NOAH_ELEMENTS.fields(l,true):''}<label class="check-label"><input type="checkbox" data-inspector-label="bold" ${l.bold?'checked':''}>ตัวหนา</label><label class="field">แนวข้อความ<select data-inspector-label="align">${[['left','ซ้าย'],['center','กลาง'],['right','ขวา']].map(([k,v])=>`<option value="${k}" ${l.align===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="field">พื้นหลัง<input type="color" data-inspector-label="background" value="${l.background&&l.background!=='transparent'?l.background:'#16263d'}"></label><label class="field">ความทึบของพื้นหลัง<input type="range" data-inspector-label="backgroundOpacity" min="0" max="1" step="0.05" value="${l.backgroundOpacity??1}"></label><button data-action="edit-label" class="wide primary">แก้ไขรูปแบบ</button><button data-editor-action="duplicate" class="wide">ทำสำเนา</button><button data-action="delete-label" class="wide danger">ลบ Label</button>`;return true;
    }
    return false;
  }
  let inlineInput=null,inlineTarget=null;
  function inlineBox(target,value,save,max=1000){
    if(inlineInput){if(inlineTarget===target)return;inlineInput.blur();}
    const el=typeof target==='string'?document.querySelector(target):target;if(!el)return;
    const r=el.getBoundingClientRect(),input=document.createElement('textarea'),width=Math.min(Math.max(r.width,240),innerWidth-24);input.className='inline-text-editor';input.dataset.editKey=target;input.value=value;input.maxLength=max;input.setAttribute('aria-label','แก้ไขข้อความ Label');input.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';input.style.top=Math.max(12,Math.min(r.top,innerHeight-130))+'px';input.style.width=width+'px';input.style.height=Math.min(180,Math.max(70,24*(value.split('\n').length+1)))+'px';document.body.appendChild(input);inlineInput=input;inlineTarget=target;let cancelled=false,done=false;
    input.onpointerdown=e=>e.stopPropagation();input.onblur=()=>{if(done)return;done=true;inlineInput=null;inlineTarget=null;const text=input.value.replace(/\r/g,'').slice(0,max);input.remove();if(cancelled||text===value)return;try{save(text);saveLocal();}catch(err){A.toast(err.message);A.render();}};
    input.onkeydown=e=>{e.stopPropagation();if(e.isComposing||e.keyCode===229)return;if(e.key==='Escape'){e.preventDefault();cancelled=true;input.blur();}else if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();input.blur();}};input.focus();input.select?.();A.toast('Enter บันทึก · Shift+Enter ขึ้นบรรทัดใหม่ · Esc ยกเลิก');return input;
  }
  function beginInlineLink(id){const p=A.getProject(),l=p.links.find(l=>l.id===id);if(!l)return;const models=new Map(A.getCatalog().map(m=>[m.id,m])),g=G.linkLayout(l,p,models);return inlineBox($('links').querySelector(`[data-link-label="${id}"]`),l.displayText??g.lines.join('\n'),text=>A.transaction(p=>{const link=p.links.find(l=>l.id===id);if(text.trim())link.displayText=text;else delete link.displayText;}));}
  function beginInlineDevice(id){const d=A.getProject().devices.find(d=>d.id===id);if(!d)return;return inlineBox($('nodes').querySelector(`[data-device="${id}"]`)?.querySelector('.device-hostname')||$('nodes').querySelector(`[data-device="${id}"]`),window.NOAH_AUDIENCE.publicProject(A.getProject()).devices.find(x=>x.id===id).hostname,text=>{if(!text.trim())throw new Error('ชื่ออุปกรณ์ต้องไม่ว่าง');A.transaction(p=>{p.devices.find(d=>d.id===id)[window.NOAH_AUDIENCE.external(p)&&window.NOAH_AUDIENCE.role(A.getCatalog().find(m=>m.id===d.modelId),d)==='pe'?'externalName':'hostname']=text.replace(/\n/g,' ');});},80);}
  function beginInlineLabel(id){
    const original=A.getProject().labels.find(l=>l.id===id);if(!original)return;if(original.kind==='shape'){setSelection([],[id]);return inlineBox($('regions').querySelector(`[data-label="${id}"]`),original.text,text=>A.saveLabel({...original,text}));}
    setSelection([],[id]);const el=(['region','shape'].includes(original.kind)?$('regions'):$('textLabels')).querySelector(`[data-label="${id}"]`);if(!el)return;
    el.contentEditable='true';el.setAttribute('contenteditable','true');el.style.cursor='text';el.style.outline='1px solid var(--accent)';
    el.onpointerdown=e=>e.stopPropagation();let cancelled=false,committed=false;
    const commit=()=>{if(committed)return;committed=true;const text=(el.innerText||el.textContent||'').replace(/\r/g,'');el.contentEditable='false';if(cancelled||!text.trim()||text===original.text){A.render();return;}try{A.saveLabel({...original,text});}catch(err){A.toast(err.message);A.render();}};
    el.onblur=commit;el.onkeydown=e=>{if(e.key==='Enter')e.stopPropagation();if(e.isComposing||e.keyCode===229)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancelled=true;el.blur();}else if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();e.stopPropagation();el.blur();saveLocal();}else if(e.key.toLowerCase()==='s'&&(e.ctrlKey||e.metaKey)){e.preventDefault();el.blur();A.saveProject();}};
    el.focus();A.toast('แก้ไขข้อความ · Enter บันทึก · Shift+Enter ขึ้นบรรทัดใหม่ · Esc ยกเลิก');
  }
  function inspectorChange(e){
    const field=e.target.dataset.inspectorLabel;if(!field)return false;
    const l=A.getProject().labels.find(l=>l.id===coreSelection().label);if(!l)return true;
    const value=field==='bold'?e.target.checked:['x','y','fontSize','width','height','backgroundOpacity','strokeWidth'].includes(field)?+e.target.value:e.target.value;
    if(l[field]===value)return true;
    try{A.saveLabel({...l,[field]:value});}catch(err){A.toast(err.message);}return true;
  }
  const point=e=>{const r=$('canvas').getBoundingClientRect(),v=A.getView();return {x:(e.clientX-r.left-v.pan.x)/v.zoom,y:(e.clientY-r.top-v.pan.y)/v.zoom,sx:e.clientX-r.left,sy:e.clientY-r.top};};
  const boundsFor=(type,item)=>({...item,...(type==='device'?G.deviceSize(item,models):G.labelSize(item))});
  function showAlignment(moving,excluded=new Set()){
    const p=A.getProject(),hidden=new Set((p.groups||[]).filter(g=>g.collapsed).flatMap(g=>g.deviceIds));
    const targets=p.devices.filter(d=>!excluded.has(d.id)&&!hidden.has(d.id)).map(d=>boundsFor('device',d));
    const guides=G.alignmentGuides(moving,targets,A.getView().zoom);
    $('guides').innerHTML=guides.map(g=>`<line class="alignment-guide ${g.aligned?'aligned':'near'}" x1="${g.axis==='x'?g.position:g.start}" y1="${g.axis==='y'?g.position:g.start}" x2="${g.axis==='x'?g.position:g.end}" y2="${g.axis==='y'?g.position:g.end}"/>`).join('');
  }
  function pointerDown(e){
    const node=e.target.closest('[data-device]'),label=e.target.closest('[data-label]'),group=e.target.closest('[data-group]'),link=e.target.closest('[data-link]'),tool=A.getTool();
    if(e.target.closest('.control-center,.cc-float-tools,.cc-ribbon'))return false;
    if(e.target.closest('.zoom-controls,.mini-map,.canvas-legend,#exitPresentation')||e.target.closest('button')&&!group)return false;
    if(e.button!==0&&e.button!==1)return false;
    document.activeElement?.closest?.('input,textarea,select,[contenteditable="true"]')?.blur?.();$('canvas').setAttribute('tabindex','0');$('canvas').focus?.({preventScroll:true});
    if(e.button===1||space||tool==='hand'){$('world').classList.remove('zooming');gesture={kind:'pan',blank:!node&&!label&&!group&&!link,startX:e.clientX,startY:e.clientY,view:A.getView()};e.preventDefault();}
    else if(tool==='region'){gesture={kind:'region',start:point(e),before:A.getProject()};e.preventDefault();}
    else if(tool!=='select')return false;
    else if(e.target.closest('[data-device-resize]')&&node){const p=A.getProject(),d=p.devices.find(d=>d.id===node.dataset.device);gesture={kind:'device-resize',id:d.id,startX:e.clientX,startY:e.clientY,before:p,original:{...d,...G.deviceSize(d,models)}};e.preventDefault();}
    else if(e.target.closest('[data-element-resize]')&&label){
      const p=A.getProject(),l=p.labels.find(l=>l.id===label.dataset.label);if(l?.kind!=='shape')return false;
      setSelection([],[l.id]);gesture={kind:'element-resize',id:l.id,corner:e.target.closest('[data-element-resize]').dataset.elementResize,startX:e.clientX,startY:e.clientY,before:p,original:clone(l)};e.preventDefault();
    }
    else if(link){
      const p=A.getProject(),l=p.links.find(l=>l.id===link.dataset.link),labelHit=e.target.closest('[data-link-label]'),pointHit=e.target.closest('[data-link-point]');
      clearSelection(false);A.select({link:l.id});
      gesture={kind:pointHit?'link-point':labelHit?'link-label':'link-route',id:l.id,index:pointHit?+pointHit.dataset.linkPoint:null,startX:e.clientX,startY:e.clientY,before:p,original:clone(l)};
      e.preventDefault();
    }
    else if(node||label||group){
      const editDeviceName=!!e.target.closest('.device-hostname,.device-hover-name');
      const p=A.getProject(),id=node?.dataset.device||label?.dataset.label,type=node?'device':'label',groupItem=group?p.groups.find(g=>g.id===group.dataset.group):null;
      const existing=selectedIds();selection.devices=new Set(existing.devices);selection.labels=new Set(existing.labels);
      const list=type==='device'?selection.devices:selection.labels;
      if(groupItem){selection.devices=new Set(groupItem.deviceIds);selection.labels=new Set(groupItem.labelIds);}
      else if(e.shiftKey||e.ctrlKey||e.metaKey){list.has(id)?list.delete(id):list.add(id);}
      else if(!list.has(id)){
        selection.devices.clear();selection.labels.clear();
        const attached=p.groups.find(g=>g.deviceIds.includes(id)||g.labelIds.includes(id));
        if(attached&&!e.altKey&&editingGroup!==attached.id){selection.devices=new Set(attached.deviceIds);selection.labels=new Set(attached.labelIds);}
        else (type==='device'?selection.devices:selection.labels).add(id);
      }
      setSelection([...selection.devices],[...selection.labels]);
      gesture={kind:'items',hit:group?null:{id,type,editDeviceName},startX:e.clientX,startY:e.clientY,before:p,items:[...p.devices.filter(d=>selection.devices.has(d.id)).map(d=>({type:'device',id:d.id,x:d.x,y:d.y})),...p.labels.filter(l=>selection.labels.has(l.id)).map(l=>({type:'label',id:l.id,x:l.x,y:l.y}))]};
    }else if(e.shiftKey){
      gesture={kind:'rectangle',start:point(e),before:A.getProject(),add:e.shiftKey,initial:selectedIds()};
    }else{
      $('world').classList.remove('zooming');
      gesture={kind:'blank',blank:true,started:Date.now(),start:point(e),before:A.getProject(),add:false,initial:selectedIds(),startX:e.clientX,startY:e.clientY,view:A.getView()};e.preventDefault();
    }
    if(gesture?.kind==='pan')$('canvas').classList.add('is-panning');
    if(gesture){gesture.pointerId=e.pointerId;$('canvas').setPointerCapture(e.pointerId);return true;}return false;
  }
  function showRectangle(start,end){
    const el=$('selectionRect');el.hidden=false;el.style.left=Math.min(start.sx,end.sx)+'px';el.style.top=Math.min(start.sy,end.sy)+'px';el.style.width=Math.abs(end.sx-start.sx)+'px';el.style.height=Math.abs(end.sy-start.sy)+'px';
  }
  function pointerMove(e){
    if(!gesture)return false;if(gesture.kind==='click')return true;
    if(e.pointerId!==undefined&&e.pointerId!==gesture.pointerId)return false;
    if(gesture.kind==='blank'){if(Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)<4)return true;gesture.kind=Date.now()-gesture.started>=220?'rectangle':'pan';if(gesture.kind==='pan')$('canvas').classList.add('is-panning');}
    if(gesture.kind==='pan'){const dx=e.clientX-gesture.startX,dy=e.clientY-gesture.startY;if(Math.hypot(dx,dy)>3)gesture.moved=true;if(gesture.moved)A.setView({pan:{x:gesture.view.pan.x+dx,y:gesture.view.pan.y+dy}});return true;}
    if(gesture.kind==='rectangle'||gesture.kind==='region'){gesture.end=point(e);showRectangle(gesture.start,gesture.end);return true;}
    const v=A.getView(),moved=Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>3;
    if(!moved&&!gesture.moved)return true;gesture.moved=true;document.body.classList.add('is-dragging');
    if(gesture.kind==='device-resize'){const g=gesture,o=g.original;A.preview(p=>Object.assign(p.devices.find(d=>d.id===g.id),{width:Math.max(32,Math.min(10000,o.width+(e.clientX-g.startX)/v.zoom)),height:Math.max(32,Math.min(10000,o.height+(e.clientY-g.startY)/v.zoom))}));return true;}
    if(gesture.kind==='element-resize'){
      const g=gesture,o=g.original,dx=(e.clientX-g.startX)/v.zoom,dy=(e.clientY-g.startY)/v.zoom,west=g.corner.includes('w'),north=g.corner.includes('n');
      const width=Math.max(32,Math.min(10000,o.width+(/[we]/.test(g.corner)?(west?-dx:dx):0))),height=Math.max(32,Math.min(10000,o.height+(/[ns]/.test(g.corner)?(north?-dy:dy):0)));
      A.preview(p=>Object.assign(p.labels.find(l=>l.id===g.id),{width,height,x:Math.max(-100000,Math.min(100000,west?o.x+o.width-width:o.x)),y:Math.max(-100000,Math.min(100000,north?o.y+o.height-height:o.y))}));return true;
    }
    if(gesture.kind.startsWith('link-')){
      let dx=(e.clientX-gesture.startX)/v.zoom,dy=(e.clientY-gesture.startY)/v.zoom;
      const g=gesture,clamp=v=>Math.max(-100000,Math.min(100000,v));
      A.preview(p=>{const l=p.links.find(l=>l.id===g.id),original=g.original;
        if(g.kind==='link-label')l.labelOffset={x:clamp((original.labelOffset?.x||0)+dx),y:clamp((original.labelOffset?.y||0)+dy)};
        else if(g.kind==='link-point')l.waypoints=original.waypoints.map((p,i)=>i===g.index?[clamp(p[0]+dx),clamp(p[1]+dy)]:p);
        else if(original.waypoints?.length)l.waypoints=original.waypoints.map(p=>[clamp(p[0]+dx),clamp(p[1]+dy)]);
        else l.routeOffset={x:clamp((original.routeOffset?.x||0)+dx),y:clamp((original.routeOffset?.y||0)+dy)};
      });return true;
    }
    const delta={dx:(e.clientX-gesture.startX)/v.zoom,dy:(e.clientY-gesture.startY)/v.zoom};
    if(preferences.snap&&gesture.items.length){const anchor=gesture.items[0],grid=preferences.grid;delta.dx=Math.round((anchor.x+delta.dx)/grid)*grid-anchor.x;delta.dy=Math.round((anchor.y+delta.dy)/grid)*grid-anchor.y;}
    A.preview(p=>{for(const item of gesture.items){const d=(item.type==='device'?p.devices:p.labels).find(d=>d.id===item.id);d.x=Math.max(-100000,Math.min(100000,item.x+delta.dx));d.y=Math.max(-100000,Math.min(100000,item.y+delta.dy));}});
    const current=A.getProject(),moving=gesture.items.map(item=>boundsFor(item.type,(item.type==='device'?current.devices:current.labels).find(d=>d.id===item.id)));
    showAlignment(moving,new Set(gesture.items.filter(i=>i.type==='device').map(i=>i.id)));return true;
  }
  function pointerUp(e){
    if(!gesture)return false;if(e.pointerId!==undefined&&e.pointerId!==gesture.pointerId)return false;const g=gesture;gesture=null;suppressClick=true;$('selectionRect').hidden=true;$('guides').innerHTML='';document.body.classList.remove('is-dragging');$('canvas').classList.remove('is-panning');
    if(g.kind==='blank'){lastClick=null;clearSelection();}
    if(g.kind==='pan'){lastClick=null;if(g.blank&&!g.moved)clearSelection();}
    if((g.kind.startsWith('link-')||g.kind==='element-resize'||g.kind==='device-resize')&&g.moved){lastClick=null;A.transaction(()=>{},g.before);saveLocal();}
    if(g.kind==='link-label'&&!g.moved){const now=Date.now();if(lastClick?.type==='link-label'&&lastClick.id===g.id&&now-lastClick.time<380){beginInlineLink(g.id);lastClick=null;}else lastClick={type:'link-label',id:g.id,time:now};}
    if(g.kind==='items'&&g.moved){lastClick=null;A.transaction(()=>{},g.before);}else if(g.kind==='items'&&g.hit){const now=Date.now();if(lastClick&&lastClick.id===g.hit.id&&now-lastClick.time<380){g.hit.type==='device'?((g.hit.editDeviceName||window.NOAH_AUDIENCE.external(A.getProject()))?beginInlineDevice(g.hit.id):A.openPhysical(g.hit.id)):beginInlineLabel(g.hit.id);lastClick=null;}else lastClick={...g.hit,time:now};}
    if((g.kind==='rectangle'||g.kind==='region')&&g.end){
      const x=Math.min(g.start.x,g.end.x),y=Math.min(g.start.y,g.end.y),width=Math.abs(g.end.x-g.start.x),height=Math.abs(g.end.y-g.start.y);
      if(g.kind==='region'&&width>=80&&height>=60){const id=A.saveLabel({x,y,width,height,text:'Region',fontSize:18,color:preferences.theme==='dark'?'#eaf2ff':'#203953',bold:true,kind:'region',background:'#38bdf8',backgroundOpacity:.07,align:'left'});A.setTool('select');setSelection([],[id]);}
      else if(g.kind==='rectangle'){
        const inside=b=>b.x+b.width>=x&&b.x<=x+width&&b.y+b.height>=y&&b.y<=y+height;
        const p=A.getProject(),devices=p.devices.filter(d=>inside(boundsFor('device',d))).map(d=>d.id),labels=p.labels.filter(l=>inside(boundsFor('label',l))).map(l=>l.id);
        const links=p.links.filter(l=>{const route=G.linkLayout(l,p,models),points=G.pathSamples(route);return points.some(pt=>pt[0]>=x&&pt[0]<=x+width&&pt[1]>=y&&pt[1]<=y+height);}).map(l=>l.id);setSelection([...new Set([...(g.add?g.initial.devices:[]),...devices])],[...new Set([...(g.add?g.initial.labels:[]),...labels])],null,[...new Set([...(g.add?g.initial.links:[]),...links])]);
      }
    }
    return true;
  }
  function pointerCancel(){if(gesture&&(gesture.kind==='items'||gesture.kind==='element-resize'||gesture.kind==='device-resize'||gesture.kind.startsWith('link-')))A.preview(p=>Object.assign(p,gesture.before));gesture=null;$('selectionRect').hidden=true;$('guides').innerHTML='';document.body.classList.remove('is-dragging');$('canvas').classList.remove('is-panning');suppressClick=true;}
  function consumeClick(){if(suppressClick){suppressClick=false;return true;}return false;}
  function selectedItems(p=A.getProject()){const ids=selectedIds();return [...p.devices.filter(d=>ids.devices.includes(d.id)).map(d=>({type:'device',...boundsFor('device',d)})),...p.labels.filter(l=>ids.labels.includes(l.id)).map(l=>({type:'label',...boundsFor('label',l)}))];}
  function copyDevice(id){const p=A.getProject(),source=p.devices.find(d=>d.id===id);if(!source)return;if(p.devices.length>=200){A.toast('จำนวนอุปกรณ์ถึงขีดจำกัดแล้ว');return;}const d={...clone(source),id:A.uid('d'),x:source.x+40,y:source.y+40};A.transaction(p=>p.devices.push(d));setSelection([d.id],[]);A.toast('คัดลอกอุปกรณ์แล้ว · Ctrl+Z ย้อนกลับได้');}
  function arrange(action){
    const items=selectedItems(),ids=selectedIds();
    if(action==='same-size'){const p=A.getProject(),devices=ids.devices.length>=2?p.devices.filter(d=>ids.devices.includes(d.id)):p.devices;if(devices.length<2){A.toast('ต้องมีอุปกรณ์อย่างน้อย 2 ตัว');return;}const size=G.deviceSize(devices[0],models);A.transaction(p=>{for(const source of devices){const d=p.devices.find(d=>d.id===source.id),old=G.deviceSize(d,models);d.x+=(old.width-size.width)/2;d.y+=(old.height-size.height)/2;d.width=size.width;d.height=size.height;}});A.toast('ปรับขนาดเท่ากันโดยรักษาจุดศูนย์กลางแล้ว');return;}
    if(action==='smart-align'){const p=A.getProject(),devices=ids.devices.length>=2?p.devices.filter(d=>ids.devices.includes(d.id)):p.devices;if(devices.length<2){A.toast('ต้องมีอุปกรณ์อย่างน้อย 2 ตัว');return;}const aligned=G.smartAlign(devices,models);A.transaction(p=>{for(const a of aligned){const d=p.devices.find(d=>d.id===a.id);d.x=a.x;d.y=a.y;}});A.toast('จัดแนวศูนย์กลาง X / Y ที่อยู่ใกล้กันแล้ว · Ctrl+Z ย้อนกลับได้');return;}
    if(action==='duplicate'){copy();paste();return;}
    if(action==='delete'){const link=coreSelection().link;if(!items.length&&link){A.deleteLink(link);return;}if(!items.length&&!ids.links.length)return;A.transaction(p=>{p.devices=p.devices.filter(d=>!ids.devices.includes(d.id));p.labels=p.labels.filter(l=>!ids.labels.includes(l.id));p.links=p.links.filter(l=>!ids.links.includes(l.id)&&!ids.devices.includes(l.a.device)&&!ids.devices.includes(l.b.device));});clearSelection();return;}
    if(!items.length){A.toast('เลือกอุปกรณ์หรือ Label ก่อน');return;}
    if(action==='group'){
      if(items.length<2){A.toast('เลือกอย่างน้อย 2 รายการเพื่อสร้าง Group');return;}
      A.transaction(p=>{p.groups=p.groups.map(g=>({...g,deviceIds:g.deviceIds.filter(id=>!ids.devices.includes(id)),labelIds:g.labelIds.filter(id=>!ids.labels.includes(id))})).filter(g=>g.deviceIds.length+g.labelIds.length);p.groups.push({id:A.uid('g'),name:'Group '+(p.groups.length+1),deviceIds:ids.devices,labelIds:ids.labels,color:'#38bdf8'});});return;
    }
    if(action==='ungroup'){A.transaction(p=>{p.groups=p.groups.filter(g=>!g.deviceIds.some(id=>ids.devices.includes(id))&&!g.labelIds.some(id=>ids.labels.includes(id)));});return;}
    if(items.length<2){A.toast('เลือกอย่างน้อย 2 รายการเพื่อจัดแนว');return;}
    const axis=action.endsWith('x')||['align-left','align-center'].includes(action)?'x':'y',size=axis==='x'?'width':'height',sorted=[...items].sort((a,b)=>a[axis]-b[axis]);
    const min=Math.min(...items.map(i=>i[axis])),max=Math.max(...items.map(i=>i[axis]+i[size])),center=(min+max)/2;
    A.transaction(p=>{
      const gap=sorted.length>2?(sorted[sorted.length-1][axis]-sorted[0][axis]-sorted.slice(0,-1).reduce((sum,i)=>sum+i[size],0))/(sorted.length-1):0;let cursor=min;
      for(const item of sorted){const d=(item.type==='device'?p.devices:p.labels).find(d=>d.id===item.id);
        if(action.startsWith('distribute')){if(sorted.length<3)continue;d[axis]=cursor;cursor+=item[size]+gap;}
        else d[axis]=['align-center','align-middle'].includes(action)?center-item[size]/2:min;
      }
    });
  }
  function copy(){
    const p=A.getProject(),s=selectedIds();if(!s.devices.length&&!s.labels.length)return;
    clipboard={devices:p.devices.filter(d=>s.devices.includes(d.id)),labels:p.labels.filter(l=>s.labels.includes(l.id)),links:p.links.filter(l=>s.devices.includes(l.a.device)&&s.devices.includes(l.b.device)),groups:p.groups.filter(g=>g.deviceIds.every(id=>s.devices.includes(id))&&g.labelIds.every(id=>s.labels.includes(id)))};
    clipboard=clone(clipboard);A.toast('คัดลอก '+itemCount()+' รายการ');
  }
  function paste(){
    if(!clipboard)return;const current=A.getProject();if(current.devices.length+clipboard.devices.length>200||current.labels.length+clipboard.labels.length>200||current.links.length+clipboard.links.length>400){A.toast('จำนวนรายการเกินขอบเขต Project');return;}
    const remap=new Map(),devices=clipboard.devices.map(d=>{const id=A.uid('d');remap.set(d.id,id);return {...clone(d),id,hostname:(d.hostname+' copy').slice(0,80),x:d.x+40,y:d.y+40};}),labels=clipboard.labels.map(l=>{const id=A.uid('t');remap.set(l.id,id);return {...clone(l),id,x:l.x+40,y:l.y+40};});
    A.transaction(p=>{p.devices.push(...devices);p.labels.push(...labels);p.links.push(...clipboard.links.map(l=>({...clone(l),id:A.uid('l'),a:{...l.a,device:remap.get(l.a.device)},b:{...l.b,device:remap.get(l.b.device)}})));p.groups.push(...clipboard.groups.map(g=>({...clone(g),id:A.uid('g'),deviceIds:g.deviceIds.map(id=>remap.get(id)),labelIds:g.labelIds.map(id=>remap.get(id))})));});
    setSelection(devices.map(d=>d.id),labels.map(l=>l.id));
  }
  function localProjectList(){
    saveLocal();$('localProjectsList').innerHTML=projects.projects.map(e=>`<div class="local-project"><button data-open-local="${esc(e.id)}">${esc(e.name)}<small>${esc(new Date(e.updatedAt).toLocaleString('th-TH'))}</small></button><button class="danger" data-delete-local="${esc(e.id)}" aria-label="ลบ ${esc(e.name)}">ลบ</button></div>`).join('')||'<p class="muted">ยังไม่มี Project ในเครื่อง</p>';$('localProjectsDialog').showModal();
  }
  function duplicateProject(){saveLocal();const p=A.getProject();p.id=A.uid('project');p.name=p.name+' copy';p.metadata={createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};clearSelection(false);A.replaceProject(p);A.toast('สร้างสำเนา Project แล้ว');}
  function presentation(value=!document.body.classList.contains('presentation')){if(value)document.documentElement.requestFullscreen?.().catch(()=>{});else if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});document.body.classList.toggle('presentation',value);$('exitPresentation').hidden=!value;requestAnimationFrame(A.fit);}
  function exportOptions(){
    const v=A.getView();return {area:$('exportArea').value||'all',bounds:{x:-v.pan.x/v.zoom,y:-v.pan.y/v.zoom,width:v.width/v.zoom,height:v.height/v.zoom},scale:+$('exportScale').value||3,background:$('exportBackground').value||'theme',theme:preferences.theme,grid:$('exportGrid').checked,gridSize:preferences.grid,labels:$('exportLabels').checked,details:$('exportDetails').checked,orientation:$('exportOrientation').value||'auto'};
  }
  let libraryObserver;
  function loadCatalogImages(){
    if(typeof IntersectionObserver!=='function')return;
    libraryObserver?.disconnect();libraryObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const img=entry.target.querySelector('[data-image-src]');if(img)img.setAttribute('href',img.dataset.imageSrc);libraryObserver.unobserve(entry.target);}},{root:$('catalogList'),rootMargin:'180px'});
    for(const card of $('catalogList').querySelectorAll('[data-model]'))libraryObserver.observe(card);
  }
  function toggleFavorite(id){favorites.has(id)?favorites.delete(id):favorites.add(id);preferenceSave();A.renderCatalog();}
  function onDeviceAdded(id){A.preview(p=>p.linkGridSize=preferences.grid);clearSelection(false);recent=[id,...recent.filter(x=>x!==id)].slice(0,12);preferenceSave();}
  window.NOAH_EDITOR={preferences,setSnap:value=>{preferences.snap=!!value;preferenceSave();},copyDevice,onRender,onViewChange,renderGroups,renderInspector,inspectorChange,beginInlineLabel,beginInlineLink,beginInlineDevice,pointerDown,pointerMove,pointerUp,pointerCancel,consumeClick,clearSelection,setSelection,arrange,copy,paste,saveLocal,markSaved,exportOptions,toggleFavorite,onDeviceAdded,loadCatalogImages,isFavorite:id=>favorites.has(id),libraryVisible:id=>libraryView==='favorites'?favorites.has(id):libraryView==='recent'?recent.includes(id):true,isSelected:(type,id)=>selection.devices.size+selection.labels.size+selection.links.size?(type==='link'?selection.links:type==='device'?selection.devices:selection.labels).has(id):(type==='link'?coreSelection().link:type==='device'?coreSelection().device:coreSelection().label)===id};
  $('libraryTabs').onclick=e=>{const b=e.target.closest('[data-library-view]');if(!b)return;libraryView=b.dataset.libraryView;for(const item of $('libraryTabs').querySelectorAll('button'))item.classList.toggle('active',item===b);A.renderCatalog();};
  $('libraryCollapse').onclick=()=>{$('workspace').classList.add('library-hidden');applyInspectorWidth();};$('libraryShow').onclick=()=>{$('workspace').classList.remove('library-hidden');applyLibraryWidth();applyInspectorWidth();};
  $('inspectorCollapse').onclick=()=>{$('workspace').classList.toggle('inspector-hidden');requestAnimationFrame(onViewChange);};
  $('libraryResize').onpointerdown=e=>{if(e.button!==0||libraryResize)return;e.preventDefault();e.stopPropagation();$('libraryResize').focus({preventScroll:true});libraryResize={pointerId:e.pointerId,startX:e.clientX,width:+$('libraryResize').getAttribute('aria-valuenow'),original:preferences.libraryWidth};$('libraryResize').setPointerCapture(e.pointerId);document.body.classList.add('is-resizing-library');};
  $('libraryResize').onpointermove=e=>{if(!libraryResize||e.pointerId!==libraryResize.pointerId)return;applyLibraryWidth(libraryResize.width+e.clientX-libraryResize.startX);applyInspectorWidth();};
  $('libraryResize').onpointerup=e=>{if(e.pointerId===libraryResize?.pointerId)finishLibraryResize();};
  $('libraryResize').onpointercancel=()=>finishLibraryResize(true);$('libraryResize').onlostpointercapture=()=>finishLibraryResize(true);
  $('libraryResize').ondblclick=()=>{preferences.libraryWidth=null;applyLibraryWidth();applyInspectorWidth();preferenceSave();};
  $('libraryResize').onkeydown=e=>{if(e.key==='Escape'&&libraryResize){e.preventDefault();e.stopPropagation();finishLibraryResize(true);return;}const limits=libraryLimits(),width=+$('libraryResize').getAttribute('aria-valuenow'),step=e.shiftKey?40:20,next=e.key==='ArrowRight'?width+step:e.key==='ArrowLeft'?width-step:e.key==='Home'?limits.min:e.key==='End'?limits.max:null;if(next!==null){e.preventDefault();e.stopPropagation();applyLibraryWidth(next,true);applyInspectorWidth();}};
  $('inspectorResize').onpointerdown=e=>{
    if(e.button!==0||inspectorResize)return;e.preventDefault();e.stopPropagation();
    $('inspectorResize').focus({preventScroll:true});
    inspectorResize={pointerId:e.pointerId,startX:e.clientX,width:+$('inspectorResize').getAttribute('aria-valuenow'),original:preferences.inspectorWidth};
    $('inspectorResize').setPointerCapture(e.pointerId);document.body.classList.add('is-resizing-inspector');
  };
  $('inspectorResize').onpointermove=e=>{if(!inspectorResize||e.pointerId!==inspectorResize.pointerId)return;applyInspectorWidth(inspectorResize.width+inspectorResize.startX-e.clientX);};
  $('inspectorResize').onpointerup=e=>{if(e.pointerId===inspectorResize?.pointerId)finishInspectorResize();};
  $('inspectorResize').onpointercancel=()=>finishInspectorResize(true);
  $('inspectorResize').onlostpointercapture=()=>finishInspectorResize(true);
  $('inspectorResize').ondblclick=()=>{preferences.inspectorWidth=null;applyInspectorWidth();preferenceSave();};
  $('inspectorResize').onkeydown=e=>{
    if(e.key==='Escape'&&inspectorResize){e.preventDefault();e.stopPropagation();finishInspectorResize(true);return;}
    const limits=inspectorLimits(),width=+$('inspectorResize').getAttribute('aria-valuenow'),step=e.shiftKey?40:20;
    const next=e.key==='ArrowLeft'?width+step:e.key==='ArrowRight'?width-step:e.key==='Home'?limits.min:e.key==='End'?limits.max:null;
    if(next!==null){e.preventDefault();e.stopPropagation();applyInspectorWidth(next,true);}
  };
  $('animationBtn').onclick=()=>{preferences.motion=!preferences.motion;preferenceSave();applyPreferences();};
  $('themeBtn').onclick=()=>{preferences.theme=preferences.theme==='dark'?'light':'dark';applyPreferences();preferenceSave();A.render();};
  $('settingsBtn').onclick=()=>{for(const [id,key]of [['prefHostnames','hostnames'],['prefDeviceDetails','deviceDetails'],['prefLinkLabels','linkLabels'],['prefMotion','motion']])$(id).checked=preferences[key];$('prefGrid').value=String(preferences.grid);$('settingsDialog').showModal();};
  $('settingsForm').onsubmit=e=>{e.preventDefault();for(const [id,key]of [['prefHostnames','hostnames'],['prefDeviceDetails','deviceDetails'],['prefLinkLabels','linkLabels'],['prefMotion','motion']])preferences[key]=$(id).checked;preferences.grid=+$('prefGrid').value;A.transaction(p=>p.linkGridSize=preferences.grid);applyPreferences();preferenceSave();$('settingsDialog').close();A.render();};
  $('selectionMenuBtn').onclick=()=>$('arrangeDialog').showModal();
  document.addEventListener('click',e=>{
    const close=e.target.closest('[data-close-dialog]');if(close)$(close.dataset.closeDialog).close();
    const action=e.target.closest('[data-editor-action]');if(action){arrange(action.dataset.editorAction);$('contextMenu').hidden=true;}
    if(!e.target.closest('#contextMenu'))$('contextMenu').hidden=true;
  });
  $('miniMap').onclick=e=>{const p=A.getProject(),b=G.bounds(p,models),r=$('miniMapSvg').getBoundingClientRect(),fit=Math.min(r.width/b.width,r.height/b.height),ox=(r.width-b.width*fit)/2,oy=(r.height-b.height*fit)/2,v=A.getView(),x=b.x+(e.clientX-r.left-ox)/fit,y=b.y+(e.clientY-r.top-oy)/fit;A.setView({pan:{x:v.width/2-x*v.zoom,y:v.height/2-y*v.zoom}});};
  $('duplicateProjectBtn').onclick=duplicateProject;$('localProjectsBtn').onclick=localProjectList;
  $('localProjectsList').onclick=e=>{
    const open=e.target.closest('[data-open-local]'),del=e.target.closest('[data-delete-local]');
    if(open){const entry=projects.projects.find(x=>x.id===open.dataset.openLocal);if(entry){saveLocal();clearSelection(false);try{A.replaceProject(entry.project);$('localProjectsDialog').close();}catch(err){A.toast(err.message);}}}
    if(del){const id=del.dataset.deleteLocal;if(id===A.getProject().id){A.toast('เปิด Project อื่นก่อนลบ Project ที่กำลังทำงาน');return;}projects.projects=projects.projects.filter(x=>x.id!==id);try{localStorage.setItem(storageKey,JSON.stringify(projects));localProjectList();}catch{A.toast('ลบ Project ในเครื่องไม่ได้');}}
  };
  $('presentationBtn').onclick=()=>presentation();$('exitPresentation').onclick=()=>presentation(false);
  $('exportOptionsBtn').onclick=()=>{$('exportMenu').open=false;$('exportDialog').showModal();};
  $('exportForm').onsubmit=async e=>{e.preventDefault();const format=$('exportFormat').value,options=exportOptions();$('exportDialog').close();await A.runExport(format,options);};
  $('catalogList').onkeydown=e=>{if(e.key==='Enter'){const card=e.target.closest('[data-model]');if(card&&!e.target.closest('[data-favorite]')){e.preventDefault();A.addDevice(card.dataset.model);}}};
  let guideModel=null;
  $('catalogList').addEventListener('dragstart',e=>{guideModel=e.target.closest('[data-model]')?.dataset.model||null;});
  $('catalogList').addEventListener('dragend',()=>{guideModel=null;$('guides').innerHTML='';});
  $('canvas').addEventListener('dragover',e=>{
    if(!guideModel||document.body.classList.contains('bayface-mode'))return;
    if(e.target.closest?.('[data-device]')){$('guides').innerHTML='';return;}
    const pos=point(e),size=G.deviceSize({modelId:guideModel},models);
    showAlignment([{x:pos.x-G.W/2,y:pos.y-G.H/2,...size}]);
  });
  $('canvas').addEventListener('dragleave',e=>{if(!e.relatedTarget||!$('canvas').contains(e.relatedTarget))$('guides').innerHTML='';});
  $('canvas').addEventListener('drop',()=>{guideModel=null;$('guides').innerHTML='';});
  $('canvas').addEventListener('contextmenu',e=>{
    e.preventDefault();const node=e.target.closest('[data-device]'),label=e.target.closest('[data-label]'),link=e.target.closest('[data-link]');
    if(node&&!selectedIds().devices.includes(node.dataset.device))setSelection([node.dataset.device]);
    if(label&&!selectedIds().labels.includes(label.dataset.label))setSelection([],[label.dataset.label]);
    if(link){clearSelection(false);A.select({link:link.dataset.link});}
    const menu=$('contextMenu'),has=itemCount()>0;menu.dataset.layerTarget=node?.dataset.device||label?.dataset.label||link?.dataset.link||e.target.closest('[data-group]')?.dataset.group||'';
    const p=A.getProject(),groupId=e.target.closest('[data-group]')?.dataset.group||p.groups.find(g=>g.deviceIds.includes(node?.dataset.device)||g.labelIds.includes(label?.dataset.label))?.id;menu.dataset.groupTarget=groupId||'';
    menu.innerHTML=`${groupId?'<button data-group-edit="rename">ตั้งชื่อ Group</button><button data-group-edit="members">จัดตำแหน่ง Object ใน Group</button>':''}${editingGroup?'<button data-group-edit="exit">จบการแก้ไข Group</button>':''}${menu.dataset.layerTarget?'<button data-layer-action="front">อยู่บนสุด</button><button data-layer-action="up">ขึ้น 1 Layer</button><button data-layer-action="down">ลง 1 Layer</button><button data-layer-action="back">อยู่ล่างสุด</button>':''}${node?'<button data-copy-device>Copy device</button><button data-context-physical>Physical View</button>':''}${has?'<button data-editor-action="duplicate">ทำสำเนา · Ctrl+D</button><button data-editor-action="group">Group</button><button data-editor-action="ungroup">Ungroup</button>':''}<button data-context-fit>จัดพอดี · F</button>${has||link?'<button data-editor-action="delete" class="danger">ลบ · Delete</button>':''}`;
    menu.style.left=Math.max(8,Math.min(e.clientX,window.innerWidth-240))+'px';menu.style.top=Math.max(8,Math.min(e.clientY,window.innerHeight-220))+'px';menu.hidden=false;
  });
  $('contextMenu').onclick=e=>{if(e.target.closest('[data-copy-device]'))copyDevice($('contextMenu').dataset.layerTarget);const edit=e.target.closest('[data-group-edit]');if(edit){const id=$('contextMenu').dataset.groupTarget;if(edit.dataset.groupEdit==='rename'){const g=A.getProject().groups.find(g=>g.id===id),name=window.prompt('ชื่อ Group',g?.name||'');if(name?.trim())A.transaction(p=>{p.groups.find(g=>g.id===id).name=name.trim().slice(0,80);});}else{editingGroup=edit.dataset.groupEdit==='exit'?null:id;clearSelection();A.toast(editingGroup?'กำลังแก้ไข Group · คลิก Object เพื่อย้ายแยก · Esc จบ':'จบการแก้ไข Group');}}const layer=e.target.closest('[data-layer-action]');if(layer){const id=$('contextMenu').dataset.layerTarget;A.transaction(p=>{const all=[...p.groups.map(o=>({o,z:o.zIndex??5})),...p.labels.map(o=>({o,z:o.zIndex??(o.kind==='text'?40:10)})),...p.links.map(o=>({o,z:o.zIndex??20})),...p.devices.map(o=>({o,z:o.zIndex??30}))].sort((a,b)=>a.z-b.z),index=all.findIndex(x=>x.o.id===id);if(index<0)return;const [item]=all.splice(index,1),pos=layer.dataset.layerAction==='front'?all.length:layer.dataset.layerAction==='back'?0:Math.max(0,Math.min(all.length,index+(layer.dataset.layerAction==='up'?1:-1)));all.splice(pos,0,item);all.forEach((x,i)=>x.o.zIndex=i+1);});}if(e.target.closest('[data-context-physical]'))A.openPhysical(coreSelection().device);if(e.target.closest('[data-context-fit]'))A.fit();$('contextMenu').hidden=true;};
  // Commit edited values through their existing validation and save handlers.
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.key!=='Enter'||e.isComposing||e.keyCode===229)return;
    const field=e.target.closest('input,textarea,select');if(!field)return;
    if(e.shiftKey&&field.tagName==='TEXTAREA')return;
    const form=field.closest('form');
    const owner=field.id==='projectName'?field:field.closest('#inspector,#physicalContent');
    if(!form&&!owner)return;
    e.preventDefault();e.stopPropagation();
    if(form){form.requestSubmit();saveLocal();return;}
    if(field.checkValidity&&!field.checkValidity()){field.reportValidity();return;}
    owner.onchange?.({target:field});saveLocal();
  },true);
  // Canvas shortcuts belong to the visible design surface.
  document.addEventListener('keydown',e=>{
    if(e.target.closest('.control-center,.cc-float-tools,.cc-ribbon'))return;
    if(document.body.classList.contains('bayface-mode')||document.body.classList.contains('specs-mode'))return;
    const editing=e.target.closest('input,textarea,select,[contenteditable="true"]'),modifier=e.ctrlKey||e.metaKey,key=/^Key[A-Z]$/.test(e.code||'')?e.code.slice(3).toLowerCase():e.key.toLowerCase();
    if(e.key==='Escape'){editingGroup=null;if(document.body.classList.contains('presentation')){e.preventDefault();presentation(false);} $('contextMenu').hidden=true;return;}
    if(e.defaultPrevented)return;
    if(modifier&&['z','y'].includes(key)&&!e.target.closest('.inline-text-editor,[contenteditable="true"]')&&!document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation?.();e.target.blur?.();key==='y'||e.shiftKey?A.redo():A.undo();return;}
    if(editing||document.querySelector('dialog[open]'))return;
    if(e.code==='Space'){e.preventDefault();space=true;$('canvas').style.cursor='grab';return;}
    if(modifier&&key==='a'){e.preventDefault();const p=A.getProject();setSelection(p.devices.map(d=>d.id),p.labels.map(l=>l.id));}
    else if(modifier&&key==='c'){e.preventDefault();copy();}
    else if(modifier&&key==='v'){e.preventDefault();paste();}
    else if(modifier&&key==='d'){e.preventDefault();arrange('duplicate');}
    else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();arrange('delete');}
    else if(!modifier&&key==='f'){e.preventDefault();A.fit();}
  },true);
  document.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;$('canvas').style.cursor='';}});
  window.addEventListener('blur',()=>{space=false;$('canvas').style.cursor='';pointerCancel();finishInspectorResize(true);finishLibraryResize(true);});
  window.addEventListener('beforeunload',e=>{if(!saveLocal()&&saveFailed){e.preventDefault();e.returnValue='';}});
  window.addEventListener('resize',()=>{applyLibraryWidth();applyInspectorWidth();});
  applyPreferences();A.preview(p=>p.linkGridSize=preferences.grid);
  // A fresh blank workspace must not overwrite or evict saved projects.
  lastSaved=JSON.stringify(A.getProject());
  $('saveStatus').textContent='พร้อมเริ่ม Topology';
  A.renderCatalog();A.render();
})();
