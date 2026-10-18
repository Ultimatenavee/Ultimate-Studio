'use strict';
(() => {
  // Functional diagram geometry shared by canvas and exports; no equipment ports.
  const assets={symphonyLogo:'assets/elements/symphony-logo.png',symphonyCloud:'assets/elements/symphony-cloud.png',customerBuilding:'assets/elements/customer-site-v62.png'};
  const names={symphonyLogo:'Symphony Logo',symphonyCloud:'Symphony Cloud',customerBuilding:'Customer Site',cloud:'Cloud / Internet',rect:'สี่เหลี่ยม',roundRect:'สี่เหลี่ยมมน',ellipse:'วงกลม / วงรี',diamond:'ข้าวหลามตัด',hexagon:'หกเหลี่ยม',rightArrow:'ลูกศร',can:'ฐานข้อมูล'};
  const paths={cloud:'M22 82 C5 82 3 56 18 50 C12 31 33 19 46 31 C50 6 82 12 84 36 C103 35 105 64 91 71 C94 82 84 88 73 84 L22 84 Z',diamond:'M50 3 L97 50 L50 97 L3 50 Z',hexagon:'M25 3 L75 3 L97 50 L75 97 L25 97 L3 50 Z',rightArrow:'M3 28 L60 28 L60 3 L97 50 L60 97 L60 72 L3 72 Z',can:'M3 18 C3 0 97 0 97 18 L97 82 C97 100 3 100 3 82 Z'};
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function valid(l){return Object.hasOwn(names,l.shape)&&/^#[\da-f]{6}$/i.test(l.stroke)&&Number.isFinite(l.strokeWidth)&&l.strokeWidth>=0&&l.strokeWidth<=12;}
  // Cloud silhouette and database geometry adapted from the vendored Lucide SVGs.
  const icons={cloud:'cloud',rect:'square',roundRect:'rectangle-horizontal',ellipse:'circle',diamond:'diamond',hexagon:'hexagon',rightArrow:'arrow-right',can:'database'};
  function handles(){return ['nw','n','ne','e','se','s','sw','w'].map(c=>`<span class="element-resize-handle handle-${c}" data-element-resize="${c}" aria-hidden="true" title="ลากปรับขนาด"></span>`).join('');}
  function geometry(l){
    const gradient='element-fill-'+(l.id||l.shape),base=l.background==='transparent'?'#123957':l.background||'#123957';
    const rgb=base.match(/\w\w/g).map(v=>parseInt(v,16)),light='#'+rgb.map(v=>Math.round(v+(255-v)*.22).toString(16).padStart(2,'0')).join('');
    const defs=`<defs><linearGradient id="${esc(gradient)}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${esc(base)}"/></linearGradient></defs>`;
    const attrs=`fill="${l.background==='transparent'?'none':'url(#'+esc(gradient)+')'}" fill-opacity="${l.backgroundOpacity??1}" stroke="${esc(l.stroke||'#38bdf8')}" stroke-width="${l.strokeWidth??2}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
    if(l.shape==='cloud')return defs+`<g transform="translate(-7 -30) scale(4.7 6.7)"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" ${attrs}/></g>`;
    if(l.shape==='can')return defs+`<g transform="translate(-10 -10) scale(5)"><path d="M3 5V19A9 3 0 0 0 21 19V5" ${attrs}/><ellipse cx="12" cy="5" rx="9" ry="3" ${attrs}/><path d="M3 12A9 3 0 0 0 21 12" fill="none" stroke="${esc(l.stroke)}" stroke-width="${l.strokeWidth}" vector-effect="non-scaling-stroke"/></g>`;
    if(l.shape==='rect'||l.shape==='roundRect')return defs+`<rect x="2" y="2" width="96" height="96" rx="${l.shape==='roundRect'?16:0}" ${attrs}/>`;
    if(l.shape==='ellipse')return defs+`<ellipse cx="50" cy="50" rx="47" ry="47" ${attrs}/>`;
    return defs+`<path d="${paths[l.shape]}" ${attrs}/>`;
  }
  function content(l){
    if(assets[l.shape])return `<image href="${esc(l.assetData||assets[l.shape])}" x="0" y="0" width="${l.width}" height="${l.height}" preserveAspectRatio="xMidYMid meet"/>`;
    const lines=(l.text||'').split('\n'),size=l.fontSize||18,lineHeight=size*1.45,start=l.height*(l.shape==='can'?.75:.5)-(lines.length-1)*lineHeight/2+size*.35;
    const x=l.align==='left'?l.width*.2:l.align==='right'?l.width*.8:l.width/2,anchor=l.align==='left'?'start':l.align==='right'?'end':'middle';
    return `<svg x="0" y="0" width="${l.width}" height="${l.height}" viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible">${geometry(l)}</svg>`+lines.map((t,i)=>`<text x="${x}" y="${start+i*lineHeight}" text-anchor="${anchor}" font-size="${size}" font-weight="${l.bold?700:400}" fill="${esc(l.color)}">${esc(t)}</text>`).join('');
  }
  function svg(l){return `<svg xmlns="http://www.w3.org/2000/svg" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" overflow="visible" aria-hidden="true"><g opacity="${l.opacity??1}">${content(l)}</g></svg>`;}
  function fields(l,inspector=false){const a=(key,id)=>inspector?`data-inspector-label="${key}"`:`id="${id}"`;return `<div class="form-grid"><label class="field">รูปทรง<select ${a('shape','elementShape')}>${Object.entries(names).map(([key,name])=>`<option value="${key}" ${key===l.shape?'selected':''}>${name}</option>`).join('')}</select></label><label class="field">สีเส้นขอบ<input type="color" ${a('stroke','elementStroke')} value="${l.stroke}"></label><label class="field">ความหนาเส้น<input type="number" min="0" max="12" step="0.5" ${a('strokeWidth','elementStrokeWidth')} value="${l.strokeWidth}"></label></div>`;}
  const E=window.NOAH_ELEMENTS={assets,assetDimensions:{symphonyLogo:[1987,791],symphonyCloud:[382,245],customerBuilding:[1374,1145]},names,valid,geometry,content,svg,fields,handles,pending:'cloud',pendingStyle:'filled',place(x,y){
    const A=window.NOAH_APP,shape=E.pending,light=document.documentElement.dataset.theme==='light';
    const id=A.saveLabel({kind:'shape',shape,x,y,width:shape==='ellipse'?160:220,height:shape==='symphonyLogo'?88:shape==='customerBuilding'?160:shape==='ellipse'?160:140,text:shape==='cloud'?'Internet':shape==='can'?'Database':'',fontSize:18,color:light?'#203953':'#eaf2ff',bold:false,align:'center',background:E.pendingStyle==='outline'?'transparent':light?'#d8efff':'#123957',backgroundOpacity:.92,stroke:E.pendingStyle==='outline'?(light?'#203953':'#eaf2ff'):'#38bdf8',strokeWidth:E.pendingStyle==='outline'?3:2});
    A.setTool('select');window.NOAH_EDITOR.setSelection([],[id]);return id;
  },init(){
    const $=id=>document.getElementById(id);$('elementsBtn').onclick=()=>{$('elementsGrid').innerHTML=Object.entries(names).flatMap(([shape,name])=>(assets[shape]?['image']:['filled','outline']).map(style=>`<button data-element="${shape}" data-element-style="${style}">${svg({shape,width:150,height:95,text:'',background:style==='outline'?'transparent':'#123957',backgroundOpacity:.92,stroke:style==='outline'?'#64748b':'#38bdf8',strokeWidth:style==='outline'?3:2,color:'#eaf2ff'})}<span class="element-palette-label"><img src="${assets[shape]||'vendor/lucide/'+icons[shape]+'.svg'}" alt="">${name} · ${style==='image'?'ภาพ':style==='outline'?'เส้นขอบ':'มีสีพื้น'}</span></button>`)).join('');$('elementsDialog').showModal();};
    const grid=$('elementsGrid'),dialog=$('elementsDialog'),canvas=$('canvas');let drag=null,suppressDropClick=false;
    function cleanup(){if(drag&&canvas.hasPointerCapture?.(drag.id))canvas.releasePointerCapture(drag.id);drag?.ghost?.remove();drag=null;document.body.classList.remove('is-element-dragging');}
    function inside(x,y){const r=canvas.getBoundingClientRect();return x>=r.left&&x<=r.left+r.width&&y>=r.top&&y<=r.top+r.height;}
    grid.addEventListener('pointerdown',e=>{
      const card=e.target.closest('[data-element]');if(!card||e.button!==0)return;
      e.preventDefault();drag={shape:card.dataset.element,style:card.dataset.elementStyle||'filled',id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    });
    document.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id)return;
      if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
      e.preventDefault();if(!drag.moved){drag.moved=true;dialog.close();canvas.setPointerCapture?.(e.pointerId);const ghost=document.createElement('div');ghost.className='element-drag-preview';ghost.setAttribute('aria-hidden','true');ghost.innerHTML=svg({shape:drag.shape,width:150,height:95,text:'',background:drag.style==='outline'?'transparent':'#123957',backgroundOpacity:.8,stroke:'#38bdf8',strokeWidth:2,color:'#eaf2ff'});document.body.appendChild(ghost);drag.ghost=ghost;document.body.classList.add('is-element-dragging');}
      drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';drag.ghost.classList.toggle('valid-drop',inside(e.clientX,e.clientY));
    },{passive:false});
    document.addEventListener('pointerup',e=>{
      if(!drag||e.pointerId!==drag.id)return;const current=drag;cleanup();
      if(!current.moved)return;
      if(!inside(e.clientX,e.clientY)){window.NOAH_APP.toast('ลาก Element ไปวางใน Network Canvas');return;}
      const r=canvas.getBoundingClientRect(),v=window.NOAH_APP.getView(),size=current.shape==='ellipse'?{w:160,h:160}:{w:220,h:140};
      E.pending=current.shape;E.pendingStyle=current.style;E.place((e.clientX-r.left-v.pan.x)/v.zoom-size.w/2,(e.clientY-r.top-v.pan.y)/v.zoom-size.h/2);
      suppressDropClick=true;setTimeout(()=>{suppressDropClick=false;},0);e.preventDefault();e.stopPropagation();
    },true);
    document.addEventListener('click',e=>{if(suppressDropClick){suppressDropClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
    document.addEventListener('pointercancel',cleanup);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')cleanup();});
    grid.onclick=e=>{if(e.target.closest('[data-element]'))e.preventDefault();};
    grid.addEventListener('keydown',e=>{const card=e.target.closest('[data-element]');if(!card||!['Enter',' '].includes(e.key))return;e.preventDefault();E.pending=card.dataset.element;E.pendingStyle=card.dataset.elementStyle||'filled';dialog.close();const v=window.NOAH_APP.getView(),size=E.pending==='ellipse'?{w:160,h:160}:{w:220,h:140};E.place((v.width/2-v.pan.x)/v.zoom-size.w/2,(v.height/2-v.pan.y)/v.zoom-size.h/2);});

  }};
})();
