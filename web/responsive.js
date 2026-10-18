'use strict';
(() => {
  const $ = id => document.getElementById(id), A = window.NOAH_APP, B = window.NOAH_BAYFACE;
  const breakpoint = window.matchMedia('(max-width: 1180px), (pointer: coarse) and (max-width: 1440px)');
  const panel = document.createElement('dialog');
  panel.id = 'responsivePanel'; panel.className = 'responsive-panel';
  panel.setAttribute('aria-labelledby','responsivePanelTitle');
  panel.innerHTML = '<div class="dialog-heading"><h2 id="responsivePanelTitle"></h2><button id="responsivePanelClose" aria-label="ปิดแผง">ปิด</button></div><p id="responsivePanelNote" class="panel-note" hidden></p><div id="responsivePanelBody" class="responsive-panel-body"></div>';
  document.body.appendChild(panel);
  const compact = () => breakpoint.matches;
  const isBayface = () => document.body.classList.contains('bayface-mode');
  let mounted = null;
  function restore() {
    if (!mounted) return;
    const {element,marker,hidden} = mounted; mounted = null;
    marker.replaceWith(element); element.hidden = hidden;
  }
  function closePanel() { restore(); if(panel.open) panel.close(); }
  function openPanel(kind, element, title, note='') {
    closePanel();
    panel.dataset.panel = kind;
    $('responsivePanelTitle').textContent = title;
    $('responsivePanelNote').textContent = note;
    $('responsivePanelNote').hidden = !note;
    const body = $('responsivePanelBody'); body.replaceChildren();
    if (element) {
      const marker = document.createComment('responsive panel origin');
      element.before(marker); mounted={element,marker,hidden:element.hidden};
      element.hidden=false; body.appendChild(element);
    }
    panel.showModal(); body.scrollTop=0;
    // Keep the software keyboard closed until the user chooses a field.
    $('responsivePanelClose').focus({preventScroll:true});
  }
  function inspector() {
    openPanel('inspector',$(isBayface()?'bayfaceInspector':'inspector'),isBayface()?'Rack Inspector':'Project Inspector');
  }
  $('responsivePanelClose').onclick=closePanel;
  // Native close events are queued; a different panel may already be open.
  panel.addEventListener('close',()=>{if(!panel.open)restore();});
  panel.addEventListener('cancel',e=>{e.preventDefault();closePanel();});
  panel.addEventListener('click',e=>{if(e.target!==panel)return;const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel();});
  function button(id,label,parent) {
    const b=document.createElement('button');b.id=id;b.type='button';b.className='compact-only';b.textContent=label;parent.appendChild(b);return b;
  }
  const actionsButton=button('workspaceActionsBtn','•••',document.querySelector('.top-actions'));
  actionsButton.setAttribute('aria-label','เมนู Project และ Export'); actionsButton.setAttribute('aria-haspopup','dialog');
  button('compactInspector','Inspector',document.querySelector('.canvas-toolbar')).onclick=inspector;
  const filterButton=button('specFiltersBtn','ตัวกรอง',document.querySelector('.spec-page'));
  document.querySelector('.spec-layout').before(filterButton);
  filterButton.onclick=()=>openPanel('filters',document.querySelector('.spec-controls'),'ตัวกรองอุปกรณ์');
  const filters=['specType','specBrand','specU','specPower','specConnector','specSpeed','specThroughput','specField','specValue'];
  function filterCount(){const n=filters.filter(id=>$(id).value).length;filterButton.textContent='ตัวกรอง'+(n?' · '+n:'');}
  document.querySelector('.spec-controls').addEventListener('change',filterCount);
  document.querySelector('.spec-controls').addEventListener('input',filterCount);
  $('specReset').addEventListener('click',filterCount);
  function actions() {
    openPanel('actions',null,'เมนู Workspace','ลากพื้นที่ว่างเพื่อเลื่อน · บีบสองนิ้วเพื่อซูม · เลือกอุปกรณ์แล้วเปิด Inspector เพื่อแก้ไข');
    const grid=document.createElement('div');grid.className='responsive-actions';
    const entries=[['newBtn','＋ New Project'],['openBtn','เปิด Project'],['quickPasteJSONBtn','วาง JSON'],['saveBtn','ดาวน์โหลด JSON'],['templatesBtn','☆ Templates'],['projectMenuBtn','จัดการ Project'],['exportOptionsBtn','Export ไฟล์'],[isBayface()?'bayfacePresent':'presentationBtn','นำเสนอ'],['settingsBtn','ตั้งค่า'],['sourcesBtn','เอกสารอ้างอิง']];
    if (!isBayface()) entries.push(['audienceSwap',$('audienceSwap').textContent],['selectionMenuBtn','จัดแนว / ลบสิ่งที่เลือก'],['studioBtn','Design tools'],['animationBtn','เปิด / หยุด Animation'],['serviceToolsBtn','CID / Hop']);
    for (const [target,label] of entries) {
      const b=document.createElement('button');b.textContent=label;b.onclick=()=>{closePanel();$(target).click();};grid.appendChild(b);
    }
    $('responsivePanelBody').appendChild(grid);
  }
  actionsButton.onclick=actions;
  for (const id of ['libraryShow','libraryCollapse','inspectorCollapse','bayfaceInspectorToggle']) {
    const old=$(id).onclick;
    $(id).onclick=e=>{
      if (!compact()) return old?.(e);
      if (id==='libraryCollapse') return closePanel();
      if (id==='libraryShow') return openPanel('library',document.querySelector('.catalog'),'Device Library',isBayface()?'แตะรุ่นอุปกรณ์ แล้วเลือก U และเพิ่มลง Rack':'แตะอุปกรณ์เพื่อวางกลางพื้นที่ที่กำลังดู แล้วลากเพื่อจัดตำแหน่ง');
      inspector();
    };
  }
  const oldCatalog=$('catalogList').onclick;
  $('catalogList').onclick=e=>{
    const card=e.target.closest('[data-model]');
    if (!compact()||!card||e.target.closest('[data-favorite]')) return oldCatalog?.(e);
    if (isBayface()) {
      if (!A.getProject().bayface?.racks.length) return A.toast('เพิ่ม Rack ก่อนเลือกอุปกรณ์');
      oldCatalog?.(e); inspector(); return;
    }
    const view=A.getView(),model=A.getCatalog().find(m=>m.id===card.dataset.model);
    const size=window.NOAH_GEOMETRY.deviceSize({modelId:model.id},new Map([[model.id,model]]));
    const device=A.addDevice(model.id,(view.width/2-view.pan.x)/view.zoom-size.width/2,(view.height/2-view.pan.y)/view.zoom-size.height/2);
    if (device) {closePanel();A.toast('เพิ่ม '+model.model+' แล้ว · ลากเพื่อย้าย / แตะสองครั้งเพื่อดูอุปกรณ์');}
  };
  const oldAccessory=$('bayfaceAccessoryList').onclick;
  $('bayfaceAccessoryList').onclick=e=>{
    oldAccessory?.(e);
    if(compact()&&e.target.closest('[data-accessory]')&&A.getProject().bayface?.racks.length)inspector();
  };
  // Rack draft values and all event handlers stay attached when moving panels.
  const oldAddRack=$('addRackBtn').onclick;
  $('addRackBtn').onclick=e=>{oldAddRack?.(e);if(compact())requestAnimationFrame(()=>B.fitRack());};
  $('bayfaceCanvas').addEventListener('click',e=>{if(compact()&&e.target.closest('[data-add-first-rack]'))requestAnimationFrame(()=>B.fitRack());});
  $('bayfaceInspector').addEventListener('submit',()=>{if(compact())requestAnimationFrame(()=>{if(!$('bayfaceError')?.textContent){closePanel();B.fitRack();}});});
  for (const id of ['topologyTab','bayfaceTab','specsTab']) $(id).addEventListener('click',closePanel);
  function adapt() {
    closePanel();document.body.classList.toggle('compact-workspace',compact());
    window.NOAH_GLASS?.resizeTitle();window.NOAH_EDITOR?.onViewChange();
  }
  breakpoint.addEventListener('change',adapt);adapt();
  window.addEventListener('orientationchange',()=>requestAnimationFrame(()=>window.NOAH_GLASS?.resizeTitle()));
  function dialogViewport() {
    const v=window.visualViewport;if(!v||v.scale!==1)return;
    document.documentElement.style.setProperty('--dialog-viewport-height',v.height+'px');
    document.documentElement.style.setProperty('--dialog-viewport-top',v.offsetTop+'px');
  }
  window.visualViewport?.addEventListener('resize',dialogViewport);
  window.visualViewport?.addEventListener('scroll',dialogViewport);dialogViewport();
  window.NOAH_TOUCH.install($('canvas'),{min:.15,max:3,read:A.getView,write:A.setView});
  window.NOAH_TOUCH.install($('bayfaceCanvas'),{
    min:.25,max:3,
    read:()=>{const c=$('bayfaceCanvas'),s=getComputedStyle(c);return {zoom:B.getZoom(),pan:{x:parseFloat(s.paddingLeft)-c.scrollLeft,y:parseFloat(s.paddingTop)-c.scrollTop}};},
    write:v=>{const c=$('bayfaceCanvas'),s=getComputedStyle(c);B.setZoom(v.zoom);c.scrollLeft=parseFloat(s.paddingLeft)-v.pan.x;c.scrollTop=parseFloat(s.paddingTop)-v.pan.y;}
  });
  window.NOAH_RESPONSIVE={compact,openPanel,closePanel,adapt};
})();
