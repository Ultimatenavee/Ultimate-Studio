// Online wardrobe: original indexed SPR pixels + ACT transforms, composed only
// for the selected outfit. No game installation or executable server is needed.
const ROOT='assets/ayothaya/wardrobe/',PREFIX='ro-outfit:';
let database;const parts=new Map(),outfits=new Map(),actionGroups=new Map();
const db=()=>database??=fetch(ROOT+'catalog.jsonz?v=mounts-v1').then(r=>{if(!r.ok)throw Error('โหลดข้อมูลตู้เสื้อผ้าไม่สำเร็จ');return new Response(r.body.pipeThrough(new DecompressionStream('deflate'))).json();}).catch(e=>{database=null;throw e;});
const publicItem=({id,name,label,sex,race,job,variant,...extra})=>({id,name,label,sex,race,job,variant,...Object.fromEntries(Object.entries(extra).filter(([k])=>['icon','slots','unknown','itemId','group','order'].includes(k)))});
function choices(data,bodyId,headId,mountId){
 const original=data.bodies.find(b=>b.id===bodyId);if(!original)throw Error('ไม่พบอาชีพ');
 const mounts=(data.mounts||[]).filter(m=>m.classId===bodyId),mount=mountId?mounts.find(m=>m.id===mountId):null;
 if(mountId&&!mount)throw Error('สัตว์ขี่ไม่รองรับอาชีพหรือเพศนี้');
 const body=mount||original;
 const heads=data.heads.filter(x=>x.sex===body.sex&&x.race===body.race).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})),head=heads.find(h=>h.id===headId)||heads[0];
 return {mounts:mounts.map(publicItem),head:head?.id,heads:heads.map(publicItem),headgear:data.headgear.filter(x=>x.sex===body.sex&&x.race===body.race).map(publicItem),robes:data.robes.filter(x=>x.variants[body.name]).map(publicItem),weapons:data.weapons.filter(x=>x.sex===body.sex&&x.job===body.job).map(publicItem),shields:data.shields.filter(x=>x.sex===body.sex&&x.job===body.job).map(publicItem),bodyPalettes:data.palettes.filter(x=>x.name.startsWith(body.name+'_')).map(publicItem),hairPalettes:data.palettes.filter(x=>x.name.startsWith((body.race==='human'?'머리':'')+head?.name+'_')).map(publicItem)};
}
function normalize(data,input){
 const options=choices(data,input.body,input.head,input.mount),config={body:input.body,head:input.head};
 if(input.mount)config.mount=input.mount;
 if(!options.heads.some(x=>x.id===config.head))throw Error('ทรงผมไม่ตรงกับเพศหรืออาชีพ');
 for(const [key,list]of Object.entries({upper:'headgear',middle:'headgear',lower:'headgear',robe:'robes',weapon:'weapons',shield:'shields',hairPalette:'hairPalettes',bodyPalette:'bodyPalettes'}))if(input[key]){if(!options[list].some(x=>x.id===input[key]))throw Error('ไอเทมไม่รองรับชุดนี้: '+key);config[key]=input[key];}
 return config;
}
export async function onlineWardrobeRequest(route,options={}){
 const data=await db();if(route==='catalog')return {bodies:data.classes,counts:data.counts};
 if(route.startsWith('choices?')){const q=new URLSearchParams(route.split('?')[1]);return choices(data,q.get('body'),q.get('head'),q.get('mount'));}
 if(route==='render'){const config=normalize(data,JSON.parse(options.body)),base=PREFIX+encodeURIComponent(JSON.stringify(config));await onlineOutfitAssets(base);return {base,appearance:config};}
 throw Error('ไม่พบคำสั่งตู้เสื้อผ้า');
}
function spriteFrames(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);let p=4;const u16=()=>{const n=view.getUint16(p,true);p+=2;return n;};
 if(bytes[0]!==83||bytes[1]!==80)throw Error('Invalid sprite');const minor=bytes[2],major=bytes[3],indexed=u16(),rgba=major>=2?u16():0,frames=[];
 for(let i=0;i<indexed;i++){const width=u16(),height=u16(),pixels=new Uint8Array(width*height);if(major>=2&&minor>=1){const length=u16(),end=p+length;let at=0;while(p<end){const n=bytes[p++];if(n===0)at+=bytes[p++];else pixels[at++]=n;}if(at>pixels.length)throw Error('Invalid sprite RLE');}else{pixels.set(bytes.subarray(p,p+pixels.length));p+=pixels.length;}frames.push({width,height,indices:pixels});}
 for(let i=0;i<rgba;i++){const width=u16(),height=u16(),pixels=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const a=p+((height-1-y)*width+x)*4,b=(y*width+x)*4;pixels[b]=bytes[a+3];pixels[b+1]=bytes[a+2];pixels[b+2]=bytes[a+1];pixels[b+3]=bytes[a];}p+=width*height*4;frames.push({width,height,pixels});}
 return {frames,indexed,palette:bytes.subarray(bytes.length-1024)};
}
async function actionsFor(key){const bucket=key.slice(0,2);if(!actionGroups.has(bucket))actionGroups.set(bucket,fetch(ROOT+'actions/'+bucket+'.jsonz?v=mounts-v1').then(r=>{if(!r.ok)throw Error('โหลดท่าทางไม่สำเร็จ');return new Response(r.body.pipeThrough(new DecompressionStream('deflate'))).json();}));try{const group=await actionGroups.get(bucket);if(actionGroups.size>8){const oldest=actionGroups.keys().next().value;if(oldest!==bucket)actionGroups.delete(oldest);}if(!group[key])throw Error('ไม่พบท่าทางไอเทม');return group[key];}catch(e){actionGroups.delete(bucket);throw e;}}
async function component(data,source){
 const files=data.assets[source];if(!files)throw Error('ไม่มีสไปรต์สำหรับไอเทมนี้');const key=files.join(':');
 if(!parts.has(key))parts.set(key,(async()=>{const [sprite,actions]=await Promise.all([fetch(ROOT+files[0]).then(r=>{if(!r.ok)throw Error('โหลดสไปรต์ไม่สำเร็จ');return new Response(r.body.pipeThrough(new DecompressionStream('deflate'))).arrayBuffer();}),actionsFor(files[1])]);return {...spriteFrames(sprite),actions};})());
 try{const result=await parts.get(key);if(parts.size>64){const oldest=parts.keys().next().value;if(oldest!==key)parts.delete(oldest);}return result;}catch(e){parts.delete(key);throw e;}
}
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function prepareLayer(part,l){
 if(part.layers.has(l))return part.layers.get(l);const [index,type,,,mirror,color,sx,sy,angle]=l,f=part.frames[index+(type?part.indexed:0)];if(index<0||!f)return null;
 const pixels=new Uint8ClampedArray(f.width*f.height*4),palette=part.selectedPalette||part.palette;
 for(let i=0;i<f.width*f.height;i++){const at=i*4;if(f.indices){const n=f.indices[i];if(!n)continue;pixels[at]=palette[n*4];pixels[at+1]=palette[n*4+1];pixels[at+2]=palette[n*4+2];pixels[at+3]=255;}else pixels.set(f.pixels.subarray(at,at+4),at);for(let k=0;k<4;k++)pixels[at+k]=Math.floor(pixels[at+k]*color[k]/255);}
 const original=canvas(f.width,f.height);original.getContext('2d').putImageData(new ImageData(pixels,f.width,f.height),0,0);
 const w=Math.max(1,Math.round(f.width*Math.abs(sx))),h=Math.max(1,Math.round(f.height*Math.abs(sy))),scaled=canvas(w,h),s=scaled.getContext('2d');s.imageSmoothingEnabled=false;s.translate((!!mirror!==(sx<0))?w:0,sy<0?h:0);s.scale((!!mirror!==(sx<0))?-1:1,sy<0?-1:1);s.drawImage(original,0,0,w,h);
 let result=scaled;if(angle){const a=angle*Math.PI/180,rw=Math.ceil(Math.abs(w*Math.cos(a))+Math.abs(h*Math.sin(a))-1e-8),rh=Math.ceil(Math.abs(w*Math.sin(a))+Math.abs(h*Math.cos(a))-1e-8);result=canvas(rw,rh);const r=result.getContext('2d');r.imageSmoothingEnabled=false;r.translate(rw/2,rh/2);r.rotate(a);r.drawImage(scaled,-w/2,-h/2);}
 const rgba=result.getContext('2d').getImageData(0,0,result.width,result.height).data;let bottom=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i])bottom=Math.floor((i/4)/result.width)+1;
 const prepared={image:result,bottom};part.layers.set(l,prepared);return prepared;
}
async function compose(data,config){
 const get=(group,key)=>data[group].find(x=>x.id===config[key]),original=get('bodies','body'),body=config.mount?data.mounts.find(x=>x.id===config.mount&&x.classId===original.id):original,head=get('heads','head'),spec=[{kind:'body',source:body.source,palette:config.bodyPalette},{kind:'head',source:head.source,palette:config.hairPalette}];
 for(const kind of ['lower','middle','upper']){const item=get('headgear',kind);if(item)spec.push({kind,source:item.source});}const robe=get('robes','robe');if(robe)spec.push({kind:'robe',source:robe.variants[body.name]});for(const kind of ['weapon','shield']){const item=get(kind==='weapon'?'weapons':'shields',kind);if(item)spec.push({kind,source:item.source});}
 const loaded=await Promise.all(spec.map(async p=>({...p,...await component(data,p.source),selectedPalette:data.paletteData[p.palette]?Uint8Array.from(atob(data.paletteData[p.palette]),c=>c.charCodeAt(0)):null,layers:new Map()}))),actions=[],rendered=[],bounds=[],bodyBounds=[];
 const unmounted=config.mount?{kind:'body',...await component(data,original.source),layers:new Map()}:null;
 if(loaded[0].actions.length<24)throw Error('อาชีพนี้ไม่มีท่านั่งครบ');
 function layers(part,ai,fi,bf){const a=part.actions[ai%part.actions.length];if(!a?.frames.length)return [];const f=a.frames[(ai>=8&&ai<16?fi:0)%a.frames.length],attach=['head','upper','middle','lower'].includes(part.kind)&&bf.attach.length&&f.attach.length,ox=attach?bf.attach[0][0]-f.attach[0][0]:0,oy=attach?bf.attach[0][1]-f.attach[0][1]:0;return f.layers.map(l=>{const prepared=prepareLayer(part,l);return prepared&&{...prepared,x:Math.round(l[2]+ox-prepared.image.width/2),y:Math.round(l[3]+oy-prepared.image.height/2)};}).filter(Boolean);}
 for(let ai=0;ai<24;ai++){const active=unmounted&&ai>=16?[unmounted,...loaded.slice(1)]:loaded,ba=active[0].actions[ai],count=ai>=8&&ai<16?ba.frames.length:1;actions.push({start:rendered.length,count,frameMs:ba.delay});for(let fi=0;fi<count;fi++){const bf=ba.frames[fi],byKind=Object.fromEntries(active.map(p=>[p.kind,layers(p,ai,fi,bf)])),foot=Math.max(...byKind.body.filter(x=>x.bottom).map(x=>x.y+x.bottom)),order=[0,1,7].includes(ai%8)?['robe','shield','body','head','lower','middle','upper','weapon']:['weapon','body','head','lower','middle','upper','shield','robe'],frame=[];if(!Number.isFinite(foot))throw Error('ท่าตัวละครไม่มีภาพ');for(const kind of order)for(const l of byKind[kind]||[]){const y=l.y-foot,b=[l.x,y,l.x+l.image.width,y+l.image.height];frame.push({...l,y});bounds.push(b);if(kind==='body'||kind==='head')bodyBounds.push(b);}rendered.push(frame);}}
 // Keep the rider's scale consistent instead of shrinking a large mount to human height.
 let referenceHeight=null;if(unmounted){const bf=unmounted.actions[0].frames[0],reference=[...layers(unmounted,0,0,bf),...layers(loaded[1],0,0,bf)];referenceHeight=Math.max(...reference.map(l=>l.y+l.bottom))-Math.min(...reference.map(l=>l.y));}
 const minx=Math.min(...bounds.map(b=>b[0]))-2,miny=Math.min(...bounds.map(b=>b[1]))-2,maxx=Math.max(...bounds.map(b=>b[2]))+2,maxy=Math.max(...bounds.map(b=>b[3]))+2,width=maxx-minx,height=maxy-miny,columns=Math.min(8,rendered.length),rows=Math.ceil(rendered.length/columns);
 if(width*height*columns*rows>32000000)throw Error('ชุดนี้มีขนาดภาพเกินที่รองรับ');const sheet=canvas(width*columns,height*rows),context=sheet.getContext('2d');context.imageSmoothingEnabled=false;rendered.forEach((frame,i)=>frame.forEach(l=>context.drawImage(l.image,i%columns*width+l.x-minx,Math.floor(i/columns)*height+l.y-miny)));
 const blob=await new Promise(resolve=>sheet.toBlob(resolve,'image/png'));if(!blob)throw Error('สร้างภาพชุดไม่สำเร็จ');
 return {meta:{version:5,columns,rows,width,height,frames:rendered.length,actions,anchor:[-minx/width,maxy/height],bodyHeight:referenceHeight||Math.max(...bodyBounds.map(b=>b[3]))-Math.min(...bodyBounds.map(b=>b[1])),mounted:!!config.mount,appearance:config},url:URL.createObjectURL(blob)};
}
export async function onlineOutfitAssets(base){
 if(!base?.startsWith(PREFIX))return null;
 if(!outfits.has(base))outfits.set(base,(async()=>{const data=await db(),config=normalize(data,JSON.parse(decodeURIComponent(base.slice(PREFIX.length))));return compose(data,config);})());
 try{const result=await outfits.get(base);if(outfits.size>24){const oldest=outfits.keys().next().value;if(oldest!==base){outfits.get(oldest).then(v=>URL.revokeObjectURL(v.url)).catch(()=>{});outfits.delete(oldest);}}return result;}catch(e){outfits.delete(base);throw e;}
}
