'use strict';
(() => {
 let loading;
 function library(){
  if(window.ExcelJS)return Promise.resolve(window.ExcelJS);
  if(!loading)loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='vendor/exceljs-4.4.0.min.js';
   script.onload=()=>resolve(window.ExcelJS);
   script.onerror=()=>{script.remove();loading=null;reject(Error('โหลดเครื่องมือ Excel ไม่สำเร็จ กรุณาลองอีกครั้ง'));};
   document.head.append(script);
  });
  return loading;
 }
 function loadImage(src){
  return new Promise((resolve,reject)=>{
   const image=new Image();
   image.onload=()=>resolve(image);
   image.onerror=()=>reject(Error('โหลดภาพสำหรับ Excel ไม่สำเร็จ '+src));
   image.src=src;
  });
 }
 function surface(w,h){
  const canvas=document.createElement('canvas');
  canvas.width=w;canvas.height=h;
  return canvas;
 }
 async function artwork(model,item){
  const img=await loadImage(model.displayImage||model.thumbnail);
  const f=window.NOAH_GEOMETRY.imageFrame(model),[x,y,w,h]=f.box;
  const scale=Math.min(1,1024/Math.max(w,h)),canvas=surface(Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));
  const ctx=canvas.getContext('2d');
  ctx.drawImage(img,x*img.naturalWidth/f.width,y*img.naturalHeight/f.height,w*img.naturalWidth/f.width,h*img.naturalHeight/f.height,0,0,canvas.width,canvas.height);
  if(item?.kind==='dwdm'){
   const embedded=await window.NOAH_CHASSIS.images(model,item,async src=>(await reference(src)).toDataURL('image/png'));
   const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="'+f.box.join(' ')+'">'+window.NOAH_CHASSIS.plates(model,item,embedded)+'</svg>';
   const overlay=await loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));
   ctx.drawImage(overlay,0,0,canvas.width,canvas.height);
  }
  return canvas;
 }
 async function reference(src){
  const image=await loadImage(src),canvas=surface(image.naturalWidth,image.naturalHeight);
  canvas.getContext('2d').drawImage(image,0,0);return canvas;
 }
 function label(text){
  const canvas=surface(800,96),ctx=canvas.getContext('2d');
  ctx.fillStyle='#d5eaf0';ctx.fillRect(0,0,800,96);
  ctx.fillStyle='#172f44';ctx.font='bold 36px Arial';ctx.textAlign='center';
  ctx.fillText(text,400,60,772);
  return canvas;
 }
 async function write(data,models,accessories){
  const ExcelJS=await library(),book=new ExcelJS.Workbook(),pictures=new Map(),listed=new Set();
  book.title=data.title;book.creator='Ultimate Studio';
  function sheet(name,headers,widths){
   const sheet=book.addWorksheet(name,{views:[{state:'frozen',ySplit:1}]});
   sheet.columns=headers.map((header,i)=>({header,width:widths[i]}));
   const row=sheet.getRow(1);row.height=26;
   row.eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF193E56'}};});
   return sheet;
  }
  const rackSheet=sheet('Bayface',['Rack','Site','U','Bayface','ชื่ออุปกรณ์ / NE','รุ่น'],[24,22,8,44,34,32]);
  const inventory=sheet('Equipment',['Rack','Site','ห้อง','U ล่าง','U บน','ประเภท','รุ่น','ชื่อ / NE','Serial number','หมายเหตุ'],[22,20,20,10,10,18,31,30,22,46]);
  const slots=sheet('DWDM Slots',['Rack','NE','Subrack ID','Chassis','IU','การ์ด','สถานะ','พื้นที่ช่อง'],[22,28,16,26,10,30,16,18]);
  const assetSheets={};
  function assets(name){
   return assetSheets[name]??=sheet(name,['รูปที่คัดลอกได้','รุ่น / รหัส','ชนิดรูป','เอกสารอ้างอิง'],[46,34,28,72]);
  }
  async function picture(key,render){
   if(!pictures.has(key)){
    const canvas=await render();
    pictures.set(key,{id:book.addImage({base64:canvas.toDataURL('image/png'),extension:'png'}),w:canvas.width,h:canvas.height});
   }
   return pictures.get(key);
  }
  function place(s,p,col,row,maxW,maxH){
   const fit=Math.min(maxW/p.w,maxH/p.h);
   let endRow=row,remainder=p.h*fit;
   while(remainder>=s.getRow(endRow+1).height*4/3){
    remainder-=s.getRow(endRow+1).height*4/3;endRow++;
    if(remainder<1)break;
   }
   // DrawingML positions use 9,525 English Metric Units per pixel at 96 dpi.
   s.addImage(p.id,{tl:{col,row},br:{nativeCol:col,nativeColOff:Math.round(p.w*fit*9525),
    nativeRow:endRow,nativeRowOff:Math.round(remainder*9525)},editAs:'oneCell'});
  }
  async function addAsset(group,key,name,kind,source,render){
   if(listed.has(group+'/'+key))return;
   listed.add(group+'/'+key);
   const s=assets(group),row=s.addRow(['',name,kind,source||'']),p=await picture(key,render);
   const height=Math.min(160,Math.max(38,Math.ceil(280*p.h/p.w)));
   row.height=height*.75+4;
   place(s,p,0,row.number-1,280,height);
  }
  for(const rack of data.racks){
   const equipment=data.items.filter(i=>i.rackId===rack.id).sort((a,b)=>b.u-a.u);
   const first=rackSheet.rowCount+1;
   for(let u=rack.units;u>=1;u--){
    const row=rackSheet.addRow([rack.name,rack.phase,u,'','','']);row.height=18;
    row.getCell(4).fill={type:'pattern',pattern:'solid',fgColor:{argb:u%2?'FFF0F4F7':'FFE6EDF1'}};
   }
   for(const item of equipment){
    const model=accessories.get(item.accessoryId)||models.get(item.modelId),optical=item.kind==='dwdm';
    const row=first+rack.units-item.u-item.height+1;
    rackSheet.getCell(row,5).value=item.label;rackSheet.getCell(row,6).value=model?.model||item.kind;
    inventory.addRow([rack.name,rack.phase,rack.room||'',item.u,item.u+item.height-1,optical?'DWDM':model?.category||item.kind,model?.model||'',item.label,item.serialNumber||'',item.notes||'']);
    if(model&&(model.displayImage||model.thumbnail)){
     const key=model.id,group=optical?'DWDM Assets':['router','switch'].includes(model.category)?'Switch Router Assets':'Other Assets';
     await addAsset(group,key,model.model,'ภาพอุปกรณ์อ้างอิง',model.sourceUrl,()=>artwork(model));
     const asset=optical?await picture('installed/'+item.id,()=>artwork(model,item)):pictures.get(key);
     place(rackSheet,asset,3,row-1,288,item.height*24);
    }else rackSheet.getCell(row,4).value=item.label||item.kind;
    if(!optical)continue;
    for(const ref of model.referenceCards){
     await addAsset('DWDM Assets',ref.image,ref.name,'ภาพหน้าการ์ดอ้างอิง',ref.source||model.slotSource,()=>reference(ref.image));
    }
    for(const slot of window.NOAH_BAYFACE_MODEL.slotMap(model,item).sort((a,b)=>a.slot-b.slot)){
     const card=item.cards.find(c=>c.slot===slot.slot);
     slots.addRow([rack.name,item.label,item.subrackId||'',model.model,slot.slot,card?.board||'',card?'ติดตั้ง':'ว่าง',card?.full?'IU'+card.slot+' + IU'+(card.slot+12):'IU'+slot.slot]);
     if(card&&!window.NOAH_CHASSIS.face(model,card.board))await addAsset('DWDM Assets','label/'+card.board,card.board,'ป้ายรหัสการ์ด',null,()=>label(card.board));
    }
   }
  }
  for(const s of [slots,inventory])s.autoFilter={from:{row:1,column:1},to:{row:s.rowCount,column:s.columnCount}};
  return new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 }
 async function copy(render){
  if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw Error('เบราว์เซอร์นี้คัดลอกรูปไม่ได้ ใช้รูปในไฟล์ Excel ที่ส่งออกได้');
  const png=Promise.resolve().then(render).then(canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('สร้าง PNG ไม่สำเร็จ')),'image/png')));
  await navigator.clipboard.write([new ClipboardItem({'image/png':png})]);
 }
 window.NOAH_BAYFACE_EXCEL={export:write,copyEquipment:(m,i)=>copy(()=>artwork(m,i)),
  copyLabel:name=>copy(()=>label(name)),copyReference:src=>copy(()=>reference(src))};
})();
