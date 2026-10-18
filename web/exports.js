'use strict';
(() => {
  const G=window.NOAH_GEOMETRY,imageCache=new Map(),libraryCache=new Map();
  const xml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const defaults={background:'white',theme:'light',scale:3,labels:true,details:true,grid:false,gridSize:20,orientation:'auto',area:'all'};
  function imageData(source){
    if(!imageCache.has(source))imageCache.set(source,fetch(source).then(r=>{if(!r.ok)throw new Error('โหลดภาพสำหรับ Export ไม่สำเร็จ');return r.blob();}).then(blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);})).then(async data=>{
      if(!/^data:image\/(webp|avif)/.test(data))return data;
      const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=data;});
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL('image/png');
    }).catch(e=>{imageCache.delete(source);throw e;}));return imageCache.get(source);
  }
  function library(name,source){
    if(window[name])return Promise.resolve(window[name]);
    if(!libraryCache.has(name))libraryCache.set(name,new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=source;script.onload=()=>window[name]?resolve(window[name]):reject(new Error('เปิดระบบ Export ไม่สำเร็จ'));script.onerror=()=>reject(new Error('โหลดระบบ Export ไม่สำเร็จ'));document.head.append(script);}).catch(e=>{libraryCache.delete(name);throw e;}));return libraryCache.get(name);
  }
  function palette(options){
    const dark=options.background==='theme'&&options.theme==='dark';
    return {background:dark?'#0b1220':'#ffffff',panel:dark?'#16263d':'#ffffff',ink:dark?'#eaf2ff':'#203953',muted:dark?'#94a3b8':'#60738c',line:dark?'#29415e':'#d6e1ef',grid:dark?'#34455d':'#d8e1eb'};
  }
  // Sanitize a copy for every file format; never alter the editable project.
  function projectSnapshot(input){
    const project=JSON.parse(JSON.stringify(input));
    project.labels=(project.labels||[]).filter(l=>!(l.kind==='shape'&&l.shape==='symphonyLogo')).map(l=>l.kind==='shape'&&l.shape==='symphonyCloud'?{...l,shape:'cloud'}:l);
    const labels=new Set(project.labels.map(l=>l.id));
    if(project.groups)project.groups=project.groups.map(g=>({...g,labelIds:(g.labelIds||[]).filter(id=>labels.has(id))})).filter(g=>(g.deviceIds?.length||0)+g.labelIds.length);
    return project;
  }
  async function scene(project,catalog,resolveImage=imageData,options={}){
    project=projectSnapshot(project);
    if(window.NOAH_AUDIENCE?.external(project)){project=window.NOAH_AUDIENCE.publicProject(project,catalog);catalog=window.NOAH_AUDIENCE.models(catalog);}
    const models=new Map(catalog.map(m=>[m.id,m])),devices=new Map(project.devices.map(d=>[d.id,d])),opts={...defaults,...options};
    const viewport=opts.bounds,validViewport=viewport&&[viewport.x,viewport.y,viewport.width,viewport.height].every(Number.isFinite)&&viewport.width>0&&viewport.height>0;
    const bounds=opts.area==='viewport'&&validViewport?{...viewport}:G.bounds(project,models);
    const images=new Map(await Promise.all([...new Set(project.devices.map(d=>d.modelId))].map(async id=>{const m=models.get(id);if(m.generic)return [id,null];return [id,await resolveImage(m.displayImage||m.thumbnail||m.photos?.front||m.images.front)];})));
    const artModels=new Map();for(const d of project.devices){const art=window.NOAH_ICON_STYLE?.model(models.get(d.modelId),d,window.NOAH_AUDIENCE?.external(project))||models.get(d.modelId);artModels.set(d.id,art);if((d.iconStyle&&d.iconStyle!=='real'&&!window.NOAH_AUDIENCE?.external(project))||d.externalIconStyle==='glass'&&window.NOAH_AUDIENCE?.external(project))images.set('device:'+d.id,await resolveImage(art.displayImage));}
    for(const l of project.labels||[])if(window.NOAH_ELEMENTS.assets[l.shape])images.set('element:'+l.shape,await resolveImage(window.NOAH_ELEMENTS.assets[l.shape]));
    const fontData=opts.fontData||(resolveImage===imageData?await imageData('fonts/NotoSansThai.ttf'):null);return {project,models,artModels,devices,bounds,images,fontData,options:opts};
  }
  function svgFromScene(s){
    const {project,models,bounds:b,images}=s,o={...defaults,...s.options},p=palette(o),parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="${b.height}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}">`];
    if(s.fontData)parts.push(`<defs><style>@font-face{font-family:'NOAH Export';src:url('${xml(s.fontData)}') format('truetype');font-weight:100 900}</style></defs>`);
    if(o.background!=='transparent')parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="${p.background}"/>`);
    if(o.grid){const size=o.gridSize;parts.push(`<defs><pattern id="grid" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="${p.grid}"/></pattern></defs><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="url(#grid)"/>`);}
    parts.push('<g font-family="NOAH Export, Noto Sans Thai, Tahoma, Arial, sans-serif">');
    parts.push(`<text x="${b.x+18}" y="${b.y+23}" font-size="14" fill="${p.muted}">${xml(project.name)}</text>`);
    const objects=[],capture=(o,z,fn)=>{const start=parts.length;fn();objects.push({z:o.zIndex??z,html:parts.splice(start).join('')});};
    for(const group of project.groups||[]){capture(group,5,()=>{const g=G.groupBounds(group,project,models);if(!g)return;parts.push(`<rect x="${g.x}" y="${g.y}" width="${g.width}" height="${g.height}" rx="12" fill="none" stroke="${group.color}" stroke-dasharray="6 5"/>`);const t=G.groupTitle(group,project,models,g);parts.push(`<rect x="${t.x}" y="${t.y}" width="${t.width}" height="${t.height}" rx="5" fill="${p.background}" stroke="${group.color}" stroke-opacity=".4"/><text x="${t.x+9}" y="${t.y+18}" font-size="13" fill="${group.color}">${xml(group.name)}</text>`);});}
    function label(l){if(l.kind==='shape'){parts.push(`<g transform="translate(${l.x} ${l.y})" opacity="${l.opacity??1}">${window.NOAH_ELEMENTS.content({...l,assetData:images.get('element:'+l.shape)})}</g>`);return;}const g=G.labelSize(l),region=l.kind==='region',x=l.align==='center'?l.x+g.width/2:l.align==='right'?l.x+g.width-9:l.x+9,anchor=l.align==='center'?'middle':l.align==='right'?'end':'start';
      if(region||l.background&&l.background!=='transparent')parts.push(`<rect x="${l.x}" y="${l.y}" width="${g.width}" height="${g.height}" rx="${region?10:5}" fill="${xml(l.background||'transparent')}" fill-opacity="${l.backgroundOpacity??1}" ${region?'stroke="#38bdf8" stroke-opacity=".55"':''}/>`);
      g.lines.forEach((text,i)=>parts.push(`<text x="${x}" y="${l.y+6+(i+1)*l.fontSize*1.45-l.fontSize*.28}" font-size="${l.fontSize}" font-weight="${l.bold?'700':'400'}" fill="${xml(l.color)}" text-anchor="${anchor}">${xml(text)}</text>`));
    }
    for(const l of (project.labels||[]).filter(l=>['region','shape'].includes(l.kind)))capture(l,10,()=>label(l));
    for(const l of project.links){capture(l,20,()=>{const g=G.linkLayout(l,project,models),style=G.linkStyle(l,project,models);parts.push(`<path d="${g.path}" fill="none" stroke="${style.color}" stroke-width="2.5"${style.dash?` stroke-dasharray="${style.dash}"`:''}/>`);});}
    for(const d of project.devices){capture(d,30,()=>{const m=s.artModels?.get(d.id)||models.get(d.modelId),f=G.imageFrame(m),size=G.deviceSize(d,models);if(m.generic)parts.push(`<rect x="${d.x}" y="${d.y}" width="${size.width}" height="${size.height}" rx="12" fill="${p.panel}" stroke="${p.muted}" stroke-dasharray="4 4"/><text x="${d.x+size.width/2}" y="${d.y+size.height/2}" text-anchor="middle" font-size="15" fill="${p.ink}">${xml(d.sourceModel||'Imported device')}</text><text x="${d.x+size.width/2}" y="${d.y+size.height/2+20}" text-anchor="middle" font-size="11" fill="${p.muted}">ไม่มีภาพของรุ่นนี้</text>`);else parts.push(`<svg x="${d.x+12}" y="${d.y+6}" width="${size.width-24}" height="${size.height-12}" viewBox="${f.box.join(' ')}" preserveAspectRatio="xMidYMid meet" overflow="hidden"><image href="${xml((images.get('device:'+d.id)||images.get(d.modelId)))}" width="${f.width}" height="${f.height}"/></svg>`);
      if(o.details)parts.push(`<text x="${d.x+size.width/2}" y="${d.y+size.height+20}" font-size="14" text-anchor="middle" fill="${p.ink}">${xml(d.hostname)}</text>`);
    });}
    if(o.labels)for(const l of project.links){if(l.showLabel===false)continue;capture(l,20,()=>{const g=G.linkLayout(l,project,models),style=G.linkStyle(l,project,models);for(const t of g.endpointLabels||[])parts.push(`<text x="${t.x}" y="${t.y}" text-anchor="middle" fill="${p.ink}" font-size="11">${xml(t.text)}</text>`);g.lines.forEach((text,i)=>parts.push(`<text class="link-label-text" x="${g.labelX}" y="${g.labelY+14+i*20}" font-size="12" font-weight="${i===0?600:400}" text-anchor="middle" paint-order="stroke" stroke="${p.background}" stroke-width="3" stroke-linejoin="round" fill="${i===0&&style.backup?'#f59e0b':i===1?p.ink:p.muted}">${xml(text)}</text>`));});}
    for(const l of (project.labels||[]).filter(l=>!['region','shape'].includes(l.kind)))capture(l,40,()=>label(l));
    parts.push(...objects.sort((a,b)=>a.z-b.z).map(o=>o.html));
    parts.push('</g></svg>');return parts.join('');
  }
  async function raster(s,format='jpeg'){
    const b=s.bounds,o=s.options,scale=Math.min(Math.max(1,Math.min(4,o.scale||3)),6000/b.width,6000/b.height,Math.sqrt(16000000/(b.width*b.height))),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(b.width*scale));canvas.height=Math.max(1,Math.round(b.height*scale));
    const image=new Image(),url=URL.createObjectURL(new Blob([svgFromScene(s)],{type:'image/svg+xml;charset=utf-8'}));
    try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('สร้างภาพ Topology ไม่สำเร็จ'));image.src=url;});const ctx=canvas.getContext('2d');if(format==='jpeg'||o.background!=='transparent'){ctx.fillStyle=palette(o).background;ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(image,0,0,canvas.width,canvas.height);const type=format==='png'?'image/png':'image/jpeg';return {blob:await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('สร้างภาพไม่สำเร็จ')),type,.98)),width:canvas.width,height:canvas.height};}finally{URL.revokeObjectURL(url);}
  }
  async function makePDF(jpeg,width,height,title,PDFLib,orientation='auto'){
    const pdf=await PDFLib.PDFDocument.create();pdf.setTitle(title);pdf.setCreator('Ultimate Topology studio');
    const landscape=orientation==='landscape'||orientation==='auto'&&width>=height,size=landscape?[1190.55,841.89]:[841.89,1190.55],page=pdf.addPage(size),image=await pdf.embedJpg(jpeg),scale=Math.min((size[0]-48)/width,(size[1]-48)/height),w=width*scale,h=height*scale;
    page.drawImage(image,{x:(size[0]-w)/2,y:(size[1]-h)/2,width:w,height:h});return pdf.save();
  }
  function bezier(points,t){const k=1-t;return [k*k*k*points[0][0]+3*k*k*t*points[1][0]+3*k*t*t*points[2][0]+t*t*t*points[3][0],k*k*k*points[0][1]+3*k*k*t*points[1][1]+3*k*t*t*points[2][1]+t*t*t*points[3][1]];}
  function makePPTX(s,PptxGenJS){
    const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Ultimate Topology studio';pptx.subject='Network topology';pptx.title=s.project.name;pptx.lang='th-TH';pptx.theme={headFontFace:'Tahoma',bodyFontFace:'Tahoma',lang:'th-TH'};
    const o={...defaults,...s.options},p=palette(o);if(window.NOAH_PPT_TEMPLATE)window.NOAH_PPT_TEMPLATE.cover(pptx,s.project.name);else{const cover=pptx.addSlide();cover.addText(s.project.name,{x:1,y:2.5,w:11,h:2,fontSize:42,fit:'shrink'});}const slide=pptx.addSlide();slide.background={color:p.background.slice(1)};
    const b=s.bounds,scale=Math.min(12.45/b.width,6.0/b.height),ox=(13.333-b.width*scale)/2,oy=1.1+(6.0-b.height*scale)/2,x=v=>ox+(v-b.x)*scale,y=v=>oy+(v-b.y)*scale;
    const shape=(name,box,fill,line)=>slide.addShape(pptx.ShapeType.rect,{x:x(box.x),y:y(box.y),w:box.width*scale,h:box.height*scale,fill,line,objectName:name});
    const text=(content,box,opts={})=>slide.addText(content,{x:x(box.x),y:y(box.y),w:box.width*scale,h:box.height*scale,fontFace:'Tahoma',fontSize:Math.max(1,(opts.size||14)*scale*72),color:opts.color||p.ink.slice(1),margin:0,breakLine:false,valign:'top',...opts});
    slide.addText(s.project.name,{x:.45,y:.18,w:9.6,h:.3,fontFace:'Tahoma',fontSize:14,color:p.muted.slice(1),margin:0,breakLine:false});
    if(o.grid){const count=Math.ceil(b.width/o.gridSize)*Math.ceil(b.height/o.gridSize),step=o.gridSize*Math.max(1,Math.ceil(Math.sqrt(count/1500)));for(let px=Math.ceil(b.x/step)*step;px<b.x+b.width;px+=step)for(let py=Math.ceil(b.y/step)*step;py<b.y+b.height;py+=step)slide.addShape(pptx.ShapeType.ellipse,{x:x(px),y:y(py),w:.008,h:.008,line:{color:p.grid.slice(1),transparency:100},fill:{color:p.grid.slice(1)},objectName:'Grid'});}
    for(const group of s.project.groups||[]){const g=G.groupBounds(group,s.project,s.models);if(!g)continue;shape('Group '+group.id,g,{color:p.background.slice(1),transparency:100},{color:group.color.slice(1),width:.7,dashType:'dash'});const t=G.groupTitle(group,s.project,s.models,g);shape('Group title '+group.id,t,{color:p.background.slice(1)},{color:group.color.slice(1),width:.5});text(group.name,{x:t.x+9,y:t.y+3,width:t.width-18,height:t.height-6},{size:13,color:group.color.slice(1),objectName:'Group name '+group.id});}
    function label(l){if(l.kind==='shape'){if(window.NOAH_ELEMENTS.assets[l.shape]){const [aw,ah]=window.NOAH_ELEMENTS.assetDimensions[l.shape],fit=Math.min(l.width/aw,l.height/ah),iw=aw*fit,ih=ah*fit;slide.addImage({data:s.images.get('element:'+l.shape),x:x(l.x+(l.width-iw)/2),y:y(l.y+(l.height-ih)/2),w:iw*scale,h:ih*scale,transparency:(1-(l.opacity??1))*100,objectName:'Element '+l.shape+' '+l.id});return;}slide.addShape(pptx.ShapeType[l.shape],{x:x(l.x),y:y(l.y),w:l.width*scale,h:l.height*scale,fill:{color:l.background==='transparent'?p.background.slice(1):l.background.slice(1),transparency:l.background==='transparent'?100:(1-l.backgroundOpacity*(l.opacity??1))*100},line:{color:l.stroke.slice(1),width:l.strokeWidth*scale*72,transparency:l.strokeWidth===0?100:(1-(l.opacity??1))*100},objectName:'Element '+l.shape+' '+l.id});if(l.text){const h=G.labelSize({...l,width:undefined,height:undefined}).height;text(l.text,{x:l.x+l.width*.2,y:l.y+l.height*(l.shape==='can'?.75:.5)-h/2,width:l.width*.6,height:h},{size:l.fontSize,color:l.color.slice(1),bold:l.bold,align:l.align,valign:'mid',transparency:(1-(l.opacity??1))*100,objectName:'Element text '+l.id});}return;}const g=G.labelSize(l),region=l.kind==='region';if(region||l.background&&l.background!=='transparent')shape('Region '+l.id,{...g,x:l.x,y:l.y},{color:l.background&&l.background!=='transparent'?l.background.slice(1):p.background.slice(1),transparency:l.background&&l.background!=='transparent'?(1-(l.backgroundOpacity??1))*100:100},{color:'38BDF8',width:region?.7:0,transparency:region?0:100});text(g.lines.join('\n'),{x:l.x+9,y:l.y+6,width:g.width-18,height:g.height-6},{size:l.fontSize,color:l.color.slice(1),bold:l.bold,align:l.align||'left',objectName:'Text label '+l.id});}
    for(const l of (s.project.labels||[]).filter(l=>['region','shape'].includes(l.kind)))label(l);
    for(const l of s.project.links){
      const g=G.linkLayout(l,s.project,s.models),style=G.linkStyle(l,s.project,s.models),pts=g.polyline||g.points,minX=Math.min(...pts.map(p=>p[0])),minY=Math.min(...pts.map(p=>p[1])),maxX=Math.max(...pts.map(p=>p[0])),maxY=Math.max(...pts.map(p=>p[1])),relative=p=>({x:(p[0]-minX)*scale,y:(p[1]-minY)*scale});
      const points=g.polyline?g.polyline.map(relative):[{...relative(g.points[0]),moveTo:true},{...relative(g.points[3]),curve:{type:'cubic',x1:relative(g.points[1]).x,y1:relative(g.points[1]).y,x2:relative(g.points[2]).x,y2:relative(g.points[2]).y}}];
      slide.addShape(pptx.ShapeType.custGeom||'custGeom',{x:x(minX),y:y(minY),w:Math.max(.0001,(maxX-minX)*scale),h:Math.max(.0001,(maxY-minY)*scale),points,fill:{color:p.background.slice(1),transparency:100},line:{color:style.color.slice(1),width:1.3,dashType:style.dash?'dash':'solid'},objectName:'Link '+l.id});
    }
    for(const d of s.project.devices){const data=s.images.get('device:'+d.id)||s.images.get(d.modelId),m=s.artModels?.get(d.id)||s.models.get(d.modelId),f=G.imageFrame(m),[cx,cy,cw,ch]=f.box,size=G.deviceSize(d,s.models),fit=Math.min((size.width-24)/cw,(size.height-12)/ch),iw=cw*fit,ih=ch*fit,ix=d.x+12+((size.width-24)-iw)/2,iy=d.y+6+((size.height-12)-ih)/2,unit=fit*scale;
      // Native Office crop: full source dimensions plus the visible source window.
      if(m.generic){shape('Imported '+d.id,{x:d.x,y:d.y,width:size.width,height:size.height},{color:p.panel.slice(1)},{color:p.muted.slice(1),width:1});text(d.sourceModel||'Imported device',{x:d.x+8,y:d.y+20,width:size.width-16,height:48},{size:15,align:'center',objectName:'Source model '+d.id});}else slide.addImage({data,x:x(ix),y:y(iy),w:f.width*unit,h:f.height*unit,sizing:{type:'crop',x:cx*unit,y:cy*unit,w:cw*unit,h:ch*unit},altText:d.hostname+' '+m.name,objectName:d.hostname});
      if(o.details)text(d.hostname,{x:d.x,y:d.y+size.height+3,width:size.width,height:24},{size:14,align:'center',objectName:'Hostname '+d.id});
    }
    if(o.labels)for(const l of s.project.links){if(l.showLabel===false)continue;const g=G.linkLayout(l,s.project,s.models),style=G.linkStyle(l,s.project,s.models);g.lines.forEach((line,i)=>text(line,{x:g.labelX-g.width/2,y:g.labelY+i*20,width:g.width,height:20},{size:12,color:i===0&&style.backup?'F59E0B':i===1?p.ink.slice(1):p.muted.slice(1),bold:i===0,align:'center',valign:'mid',objectName:'Interfaces '+l.id+' line '+i}));for(const [i,t] of (g.endpointLabels||[]).entries())text(t.text,{x:t.x-85,y:t.y-14,width:170,height:20},{size:11,align:'center',objectName:'Stack interface '+l.id+' '+i});}
    for(const l of (s.project.labels||[]).filter(l=>!['region','shape'].includes(l.kind)))label(l);
    const ordered=[...(s.project.groups||[]).map(o=>({o,z:o.zIndex??5})),...s.project.labels.map(o=>({o,z:o.zIndex??(o.kind==='text'?40:10)})),...s.project.links.map(o=>({o,z:o.zIndex??20})),...s.project.devices.map(o=>({o,z:o.zIndex??30}))];const layerOf=obj=>{const name=obj.options?.objectName||obj.image?.objectName||obj.objectName||'';const item=ordered.find(x=>name.includes(x.o.id)||name===x.o.hostname);return item?.z??-1;};slide._slideObjects.sort((a,b)=>layerOf(a)-layerOf(b));
    if(window.NOAH_PPT_TEMPLATE){window.NOAH_PPT_TEMPLATE.decorate(pptx,slide);window.NOAH_PPT_TEMPLATE.closing(pptx);}else{const last=pptx.addSlide();last.addText('Thank You',{x:1,y:2.5,w:11,h:2,fontSize:42,align:'center'});}return pptx;
  }
  function download(blob,name){const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  async function exportTopology(format,project,catalog,options={}){
    if(!project.devices.length&&!project.labels?.length)throw new Error('เพิ่มอุปกรณ์หรือ Text Label ก่อน Export');
    if(!['jpeg','png','svg','pdf','pptx'].includes(format))throw new Error('ไม่รองรับรูปแบบ Export นี้');
    // Formats without transparency use a solid background matching the selected theme.
    if(!['png','svg'].includes(format)&&options.background==='transparent')options={...options,background:'white'};
    const s=await scene(project,catalog,imageData,options),filename=s.project.name.replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,80)||'NOAH-Topology';
    if(format==='svg'){download(new Blob([svgFromScene(s)],{type:'image/svg+xml;charset=utf-8'}),filename+'.svg');return;}
    if(format==='pptx'){const ctor=await library('PptxGenJS','vendor/pptxgen.bundle.js'),pptx=makePPTX(s,ctor);await appendPower(pptx,s.project.bayface);download(await pptx.write({outputType:'blob',compression:true}),filename+'.pptx');return;}
    const image=await raster(s,format==='png'?'png':'jpeg');if(format==='jpeg'||format==='png'){download(image.blob,filename+(format==='png'?'.png':'.jpg'));return;}
    const lib=await library('PDFLib','vendor/pdf-lib.min.js'),bytes=await makePDF(await image.blob.arrayBuffer(),image.width,image.height,project.name,lib,s.options.orientation);download(new Blob([bytes],{type:'application/pdf'}),filename+'.pdf');
  }
  async function appendPower(pptx,bayface){if(!bayface?.racks?.length)return;if(!window.NOAH_BAYFACE_REPORT?.powerSlides)throw Error('ระบบรายงาน Power ยังไม่พร้อม กรุณาลอง Export อีกครั้ง');await window.NOAH_BAYFACE_REPORT.powerSlides(pptx,bayface,{template:window.NOAH_PPT_TEMPLATE});}
  async function exportRasterDocument(format,blob,width,height,title,filename,options={}){
    if(format==='pdf'){const lib=await library('PDFLib','vendor/pdf-lib.min.js'),bytes=await makePDF(await blob.arrayBuffer(),width,height,title,lib,options.orientation||'auto');download(new Blob([bytes],{type:'application/pdf'}),filename+'.pdf');return;}
    if(format!=='pptx')throw new Error('ไม่รองรับรูปแบบ Export');const ctor=await library('PptxGenJS','vendor/pptxgen.bundle.js'),pptx=new ctor();pptx.layout='LAYOUT_WIDE';pptx.title=title;pptx.author='Ultimate Topology studio';pptx.lang='th-TH';pptx.theme={headFontFace:'Tahoma',bodyFontFace:'Tahoma',lang:'th-TH'};window.NOAH_PPT_TEMPLATE?.cover(pptx,title);const slide=pptx.addSlide(),scale=Math.min(12.5/width,6.6/height),data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});slide.addImage({data,x:(13.333-width*scale)/2,y:(7.5-height*scale)/2,w:width*scale,h:height*scale});window.NOAH_PPT_TEMPLATE?.decorate(pptx,slide);window.NOAH_PPT_TEMPLATE?.closing(pptx);await appendPower(pptx,options.bayface);download(await pptx.write({outputType:'blob',compression:true}),filename+'.pptx');
  }
  window.NOAH_EXPORT={projectSnapshot,exportTopology,scene,svgFromScene,makePDF,makePPTX,exportRasterDocument};
})();
