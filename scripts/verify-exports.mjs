import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Generates actual exports using the app's scene/PDF/PPTX functions. Sharp is
// only a test renderer; it does not verify the browser's SVG-to-canvas pipeline.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const require=createRequire(path.join(modules,'package.json'));
const sharp=require('sharp'),PDFLib=require('pdf-lib'),JSZip=require('jszip');
const output=path.resolve(process.argv[2] || '/tmp/noah-export-qa');
await fs.mkdir(output,{recursive:true});
const context=vm.createContext({console,Blob,setTimeout,clearTimeout,Uint8Array,ArrayBuffer});
context.window=context;context.self=context;context.global=context;
for(const file of ['catalog.js','audience.js','icon-styles.js','elements.js','geometry.js','ppt-template.js','exports.js','vendor/pptxgen.bundle.js','vendor/pdf-lib.min.js'])vm.runInContext(await fs.readFile(path.join(root,'web',file),'utf8'),context);
assert.equal(typeof context.PptxGenJS,'function','Vendored browser constructor must match lazy-loader global');
const E=context.NOAH_EXPORT,G=context.NOAH_GEOMETRY,catalog=context.NOAH_CATALOG;
const models=new Map(catalog.map(m=>[m.id,m]));
const device=(modelId,id,x,y)=>({id,modelId,x,y,hostname:id,powerOn:true,supplies:[{present:true,connected:true}],transceivers:{}});
const project={format:'noah-topology',version:3,name:'NOAH — โครงข่ายสาขา',devices:[
  device('cisco-asr-1001-x','PE-01',60,225),device('huawei-s5735-l8t4x-qa-v2','ACCESS-01',520,70),
  device('alcatel-os6450-10','CPE-01',1000,250),device('fortinet-fortigate-100f','FW-01',520,460)
],links:[
  {role:'main',id:'uplink',a:{device:'PE-01',port:'te0'},b:{device:'ACCESS-01',port:'x1'},speed:10000,cable:'sm',cid:'CID-1001',vlans:'1850, 4022'},
  {role:'main',id:'access',a:{device:'ACCESS-01',port:'ge1'},b:{device:'CPE-01',port:'r1'},speed:1000,cable:'copper',cid:'CID-1002',vlans:'1850'},
  {id:'backup',role:'backup',shape:'orthogonal',a:{device:'PE-01',port:'ge0'},b:{device:'ACCESS-01',port:'x3'},speed:1000,cable:'sm',cid:'CID-BACKUP',vlans:'1850'},
  {id:'security',a:{device:'ACCESS-01',port:'x2'},b:{device:'FW-01',port:'x1'},speed:10000,cable:'sm',cid:'CID-1003',vlans:'200'}
],groups:[{id:'branch-group',name:'Branch A',deviceIds:['ACCESS-01','FW-01'],labelIds:[],color:'#38bdf8'}],labels:[
  {id:'branch',x:530,y:15,text:'สาขา กรุงเทพฯ',fontSize:24,color:'#154c8a',bold:true},
  {id:'region',kind:'region',background:'transparent',align:'left',width:300,height:190,x:480,y:430,text:'Security',fontSize:16,color:'#304864',bold:true},
  {id:'rack',x:530,y:665,text:'Rack 01\nFirewall / WAN edge',fontSize:18,color:'#52657e',bold:false}
]};
const resolveImage=async source=>{
  let bytes=await fs.readFile(path.join(root,'web',source));
  const metadata=await sharp(bytes).metadata();
  let mime=metadata.format==='jpeg'?'image/jpeg':'image/png';
  if(!['jpeg','png'].includes(metadata.format))bytes=await sharp(bytes).png().toBuffer();
  return 'data:'+mime+';base64,'+bytes.toString('base64');
};
async function verifyPPTX(s,name,count){
  const pptx=E.makePPTX(s,context.PptxGenJS);
  const bytes=Buffer.from(await pptx.write({outputType:'arraybuffer',compression:true}));
  await fs.writeFile(path.join(output,name+'.pptx'),bytes);
  const zip=await JSZip.loadAsync(bytes),xml=await zip.file('ppt/slides/slide2.xml').async('string');
  assert.equal((xml.match(/<p:pic>/g)||[]).length,count,'Devices must remain individual image objects');
  assert((xml.match(/<p:sp>/g)||[]).length>s.project.labels.length,'Text and links must remain native shapes');
  assert.equal(Object.keys(zip.files).filter(f=>/^ppt\/slides\/slide\d+\.xml$/.test(f)).length,3);
  const first=await zip.file('ppt/slides/slide1.xml').async('string'),last=await zip.file('ppt/slides/slide3.xml').async('string');assert(first.includes(s.project.name));assert(first.includes('Customer name'));assert(last.includes('Thank You'));
  assert(!Object.keys(zip.files).some(f=>f.endsWith('.webp')));
  assert(!xml.includes('name="Link label '),'Link labels must not add opaque box shapes');
  const links=[...xml.matchAll(/<p:sp>([\s\S]*?)<\/p:sp>/g)].filter(m=>/name="Link [^"]+"/.test(m[1]));assert.equal(links.length,s.project.links.length,'One native object per complete Link');for(const m of links)assert(m[1].includes('<a:custGeom>'));
  const interfaceText=[...xml.matchAll(/<p:sp>([\s\S]*?)<\/p:sp>/g)].filter(m=>m[1].includes('name="Interfaces '));
  if(s.options.labels!==false)assert.equal(interfaceText.length,s.project.links.filter(l=>l.showLabel!==false).reduce((n,l)=>n+G.linkLayout(l,s.project,s.models).lines.length,0));
  for(const m of interfaceText)assert(m[1].includes('<a:noFill/>'),'Editable link text must have a transparent background');
  for(const l of s.project.labels)for(const line of l.text.split('\n'))assert(xml.includes(line));
  if(s.project.links.some(l=>l.role==='backup')){assert(xml.includes('val="dash"'));assert(!xml.includes('<a:t>BACKUP ·'));}
  assert((xml.match(/<a:srcRect /g)||[]).length===count,'Subject framing is stored as native crop metadata');
  const emu=914400;
  for(const m of xml.matchAll(/<a:xfrm[^>]*>\s*<a:off x="(-?\d+)" y="(-?\d+)"\/>\s*<a:ext cx="(\d+)" cy="(\d+)"/g)){
    const [x,y,w,h]=m.slice(1).map(Number);assert(x>=0&&y>=0&&x+w<=13.334*emu&&y+h<=7.501*emu,'Export shape must fit the slide');
  }
  await fs.writeFile(path.join(output,name+'-slide.xml'),xml);
  console.log('PASS '+name+' PPTX: '+count+' real images, editable text/links, valid crop and slide bounds');
}
const s=await E.scene(project,catalog,resolveImage),svg=E.svgFromScene(s);
assert(svg.includes('Te0/0/0 ↔ 10GE1/0/1'));assert(!svg.includes('>BACKUP ·'));assert(!svg.includes('>MAIN ·'));assert(svg.includes('stroke-dasharray="10 7"'));assert(svg.includes('Branch A'));assert(svg.includes('Security')); assert(svg.includes('GE1/0/1 ↔ 1/1'));
assert.equal((svg.match(/class="link-label-text"/g)||[]).length,project.links.reduce((n,l)=>n+G.linkLayout(l,project,models).lines.length,0));
for(const l of project.links){const g=G.linkLayout(l,project,models);assert(g.horizontal?(l.role==='backup'?g.labelY>g.y:g.labelY+g.height<g.y):(l.role==='main'?g.labelX+g.width/2<g.x:g.labelX-g.width/2>g.x));assert(s.bounds.y<=g.labelY&&s.bounds.y+s.bounds.height>=g.labelY+g.height);}
await fs.writeFile(path.join(output,'topology.svg'),svg);
const jpeg=await sharp(Buffer.from(svg),{density:216}).jpeg({quality:98}).toBuffer(),meta=await sharp(jpeg).metadata();
await fs.writeFile(path.join(output,'topology.jpg'),jpeg);
assert(meta.width>3000&&meta.height>1200);
const pdf=await E.makePDF(jpeg,meta.width,meta.height,project.name,context.PDFLib);
await fs.writeFile(path.join(output,'topology.pdf'),pdf);
const parsed=await PDFLib.PDFDocument.load(pdf);assert.equal(parsed.getPageCount(),1);assert.equal(parsed.getTitle(),project.name);assert(Math.abs(parsed.getPage(0).getWidth()-1190.55)<.01);
console.log('PASS JPEG/PDF: high-resolution scene with Thai labels, equipment, exact interfaces, A3 page');
await verifyPPTX(s,'topology',4);
const gallery={format:'noah-topology',version:3,name:'All 34 normalized equipment illustrations',links:[],devices:[],labels:[]};
for(const [i,m]of catalog.filter(m=>!m.hidden).entries()){
  const x=40+(i%4)*330,y=75+Math.floor(i/4)*300;
  const metadata=await sharp(await fs.readFile(path.join(root,'web',m.displayImage))).metadata();
  assert.equal(metadata.width,m.displayDimensions.width,m.id);assert.equal(metadata.height,m.displayDimensions.height,m.id);
  const f=G.imageFrame(m);assert(f.box[0]>=0&&f.box[1]>=0&&f.box[0]+f.box[2]<=f.width&&f.box[1]+f.box[3]<=f.height,m.id);
  gallery.devices.push(device(m.id,'d-'+i,x,y));gallery.labels.push({id:'l-'+i,x,y:y+m.nodeHeight+32,text:m.model,fontSize:14,color:'#eaf2ff',bold:false});
}
const gs=await E.scene(gallery,catalog,resolveImage,{background:'theme',theme:'dark',details:false}),gsvg=E.svgFromScene(gs);
await fs.writeFile(path.join(output,'catalog-gallery.svg'),gsvg);
await sharp(Buffer.from(gsvg),{density:144}).png().toFile(path.join(output,'catalog-gallery.png'));
await verifyPPTX(gs,'catalog-gallery',34);
const ts=await E.scene(project,catalog,resolveImage,{background:'transparent',labels:false,details:false,area:'viewport',bounds:{x:400,y:0,width:600,height:500}});const tsvg=E.svgFromScene(ts);assert(!tsvg.includes('<rect x="400" y="0" width="600" height="500" fill="#ffffff"'));assert(!tsvg.includes('BACKUP'));assert(tsvg.includes('viewBox="400 0 600 500"'));await fs.writeFile(path.join(output,'viewport-transparent.svg'),tsvg);await sharp(Buffer.from(tsvg)).png().toFile(path.join(output,'viewport-transparent.png'));const tm=await sharp(path.join(output,'viewport-transparent.png')).metadata();assert(tm.hasAlpha);assert.equal(tm.width,600);const portrait=await E.makePDF(jpeg,meta.width,meta.height,project.name,context.PDFLib,'portrait');assert((await PDFLib.PDFDocument.load(portrait)).getPage(0).getHeight()>1000);console.log('PASS PNG/SVG viewport, transparency, hidden labels and portrait PDF');
// Imported models without artwork export as labelled placeholders, while moved
// routes and labels use the same geometry in SVG/PDF/PPTX.
context.crypto=(await import('node:crypto')).default;
vm.runInContext(await fs.readFile(path.join(root,'web/port-resources.js'),'utf8'),context);
vm.runInContext(await fs.readFile(path.join(root,'web/importer.js'),'utf8'),context);
const ip=context.NOAH_IMPORT.convert(context.NOAH_IMPORT.parse(await fs.readFile(path.join(root,'scripts/fixtures/acm-hops.txt'),'utf8')).data,catalog).project;
ip.links[0].routeOffset={x:180,y:-240};ip.links[0].labelOffset={x:75,y:-100};ip.links[1].waypoints=[[400,800],[700,850]];
const is=await E.scene(ip,catalog,resolveImage,{theme:'light',background:'white'}),isvg=E.svgFromScene(is);assert(!isvg.includes('undefined'));assert(ip.devices.filter(d=>d.modelId==='huawei-ne40e-x8a').length===2);assert(isvg.includes('Ten0/0'));const ig=G.linkLayout(ip.links[0],ip,models);assert(is.bounds.y<=ig.labelY);for(const l of ip.links){for(const p of G.pathSamples(G.linkLayout(l,ip,models)))assert(p[0]>=is.bounds.x&&p[1]>=is.bounds.y&&p[0]<=is.bounds.x+is.bounds.width&&p[1]<=is.bounds.y+is.bounds.height);}
await fs.writeFile(path.join(output,'imported-topology.svg'),isvg);await sharp(Buffer.from(isvg),{density:144}).png().toFile(path.join(output,'imported-topology.png'));
await verifyPPTX(is,'imported-topology',7);
console.log('PASS Imported placeholders and free route/label positions preserved in export');
const elementsProject={format:'noah-topology',version:3,name:'Network Elements',devices:[],links:[],labels:Object.keys(context.NOAH_ELEMENTS.names).filter(k=>!context.NOAH_ELEMENTS.assets[k]).map((shape,i)=>({id:'shape-'+i,kind:'shape',shape,x:40+(i%4)*300,y:90+Math.floor(i/4)*260,width:220,height:140,text:shape==='cloud'?'Internet':shape==='can'?'Database':shape,fontSize:18,color:'#203953',bold:false,align:'center',background:'#d8efff',backgroundOpacity:.8,stroke:'#148ec4',strokeWidth:2}))};
const es=await E.scene(elementsProject,catalog,resolveImage),esvg=E.svgFromScene(es);assert(esvg.includes('Internet'));assert(esvg.includes('M50 3 L97 50'));assert(esvg.includes('<ellipse'));
await fs.writeFile(path.join(output,'elements.svg'),esvg);const epng=await sharp(Buffer.from(esvg)).png().toBuffer();await fs.writeFile(path.join(output,'elements.png'),epng);assert.equal((await sharp(epng).metadata()).format,'png');const ejpg=await sharp(epng).jpeg().toBuffer();await fs.writeFile(path.join(output,'elements.jpg'),ejpg);const emeta=await sharp(ejpg).metadata();await fs.writeFile(path.join(output,'elements.pdf'),await E.makePDF(ejpg,emeta.width,emeta.height,elementsProject.name,context.PDFLib));await verifyPPTX(es,'elements',0);const exml=await fs.readFile(path.join(output,'elements-slide.xml'),'utf8');for(const shape of Object.keys(context.NOAH_ELEMENTS.names).filter(k=>!context.NOAH_ELEMENTS.assets[k]))assert(exml.includes('prst="'+shape+'"'),'Element must stay a native editable PowerPoint shape: '+shape);
console.log('PASS all eight Elements in SVG/PNG/JPEG/PDF and native editable PowerPoint shapes');
console.log('Export verification completed. Inspect rendered samples; browser download/canvas behavior is unverified.');

const externalProject={...project,presentation:'external',designOrigin:'internal',metadata:{},devices:[{...device('huawei-ne8000-m8','private-pe',60,225),hostname:'Huawei M8',role:'PE'}],links:[],labels:[],groups:[]};
const externalScene=await E.scene(externalProject,catalog,resolveImage,{});assert.equal(externalScene.project.devices[0].hostname,'PE 01');assert.equal(externalScene.project.devices[0].modelId,'external-pe');await verifyPPTX(externalScene,'external-private-pe',1);const externalZip=await JSZip.loadAsync(Buffer.from(await E.makePPTX(externalScene,context.PptxGenJS).write({outputType:'arraybuffer'})));for(const [name,file] of Object.entries(externalZip.files))if(name.endsWith('.xml'))assert(!/Huawei|NetEngine|NE8000|M8/i.test(await file.async('string')),'External slide and notes must not expose PE identity');console.log('PASS External PPTX artwork, slide text and notes hide PE hardware identity');

const assetsProject={...elementsProject,labels:Object.keys(context.NOAH_ELEMENTS.assets).map((shape,i)=>({...elementsProject.labels[0],id:'asset-'+i,shape,text:'',x:i*260}))};
assetsProject.groups=[{id:'mixed',name:'Site',deviceIds:[],labelIds:['asset-0','asset-1','asset-2'],color:'#38bdf8'},{id:'logo-only',name:'Brand',deviceIds:[],labelIds:['asset-0'],color:'#38bdf8'}];
const assetsBefore=JSON.stringify(assetsProject),resolved=[];
const assetScene=await E.scene(assetsProject,catalog,async source=>{resolved.push(source);return resolveImage(source);},{}),assetSVG=E.svgFromScene(assetScene);
assert.equal(JSON.stringify(assetsProject),assetsBefore,'file export leaves the editor project unchanged');
assert(!resolved.some(source=>/symphony/i.test(source)),'no branded artwork is loaded for export');
assert.deepEqual(JSON.parse(JSON.stringify(assetScene.project.labels.map(l=>l.shape))),['cloud','customerBuilding']);
assert.deepEqual(JSON.parse(JSON.stringify(assetScene.project.groups.map(g=>g.labelIds))),[['asset-1','asset-2']],'removed logos leave no dangling or empty groups');
assert.equal((assetSVG.match(/href="data:image/g)||[]).length,1,'only the neutral customer building is embedded');assert(!/symphony/i.test(assetSVG));assert(assetSVG.includes('linearGradient'),'branded cloud becomes a native neutral cloud');
const assetBytes=Buffer.from(await E.makePPTX(assetScene,context.PptxGenJS).write({outputType:'arraybuffer'})),assetZip=await JSZip.loadAsync(assetBytes);
assert.equal(((await assetZip.file('ppt/slides/slide2.xml').async('string')).match(/<p:pic>/g)||[]).length,1);await fs.writeFile(path.join(output,'reference-elements.png'),await sharp(Buffer.from(assetSVG)).png().toBuffer());
console.log('PASS Branded Elements omitted/replaced in export snapshots; neutral artwork, geometry, group membership and original editor project preserved');

const neutralBytes=await E.makePPTX(s,context.PptxGenJS).write({outputType:'arraybuffer'}),neutral=await JSZip.loadAsync(neutralBytes);
for(let i=1;i<=3;i++){const xml=await neutral.file('ppt/slides/slide'+i+'.xml').async('string');assert(!/Symphony|SYMC|Orange footer|F05623/i.test(xml));assert(xml.includes('Document footer'));assert(!xml.includes('AMR'));}
for(const [name,file]of Object.entries(neutral.files))if(name.endsWith('.xml')||name.endsWith('.rels')){const xml=await file.async('string');assert(!/symphony|customer-template|Orange footer/i.test(xml),'all slide/notes/properties/relationships are neutral');}
const brandedLogo=await fs.readFile('web/assets/elements/symphony-logo.png');for(const [name,file]of Object.entries(neutral.files))if(name.startsWith('ppt/media/')&&!file.dir)assert(!(await file.async('nodebuffer')).equals(brandedLogo),'no hidden logo payload');
assert(!Object.keys(neutral.files).some(n=>n.startsWith('generated/')));await fs.writeFile(path.join(output,'neutral-template.pptx'),Buffer.from(neutralBytes));
console.log('PASS Neutral three-slide PowerPoint: no company logo, orange brand band, source deck, hidden logo, or branded metadata');
const layeredProject=JSON.parse(JSON.stringify(project));layeredProject.devices[0].zIndex=100;layeredProject.labels[0].zIndex=1;layeredProject.devices[0].width=380;layeredProject.devices[0].height=135;const layeredScene=await E.scene(layeredProject,catalog,resolveImage,{});const orderedSVG=E.svgFromScene(layeredScene);assert(orderedSVG.indexOf('สาขา กรุงเทพฯ')<orderedSVG.indexOf('<image'),'SVG must honor label below equipment');const layeredZip=await JSZip.loadAsync(await E.makePPTX(layeredScene,context.PptxGenJS).write({outputType:'arraybuffer'}));const layeredXML=await layeredZip.file('ppt/slides/slide2.xml').async('string');assert(layeredXML.indexOf('name="PE-01"')>layeredXML.indexOf('name="Text label branch"'),'PowerPoint must honor equipment above label');console.log('PASS Free device sizes and cross-object layers survive SVG and native PowerPoint exports');

const styledProject={...project,devices:['real','threeD','outline','flat'].map((iconStyle,i)=>({...project.devices[0],id:'style-'+i,hostname:iconStyle,iconStyle,x:i*280,y:100})),links:[],labels:[],groups:[]};const styledScene=await E.scene(styledProject,catalog,resolveImage,{});await verifyPPTX(styledScene,'internal-icon-styles',4);await fs.writeFile(path.join(output,'internal-icon-styles.png'),await sharp(Buffer.from(E.svgFromScene(styledScene))).png().toBuffer());console.log('PASS Four Internal icon styles export independently while retaining actual model identities');
const glassProject={...externalProject,name:'External icon gallery',devices:['pe','switch','router','firewall','ap'].map((role,i)=>({...externalProject.devices[0],id:'glass-'+role,modelId:'external-'+role,hostname:role,externalIconStyle:'glass',x:i*300,y:100,width:260,height:160})),links:[],labels:[],groups:[]};
const glassScene=await E.scene(glassProject,catalog,resolveImage,{});for(const d of glassScene.project.devices){assert(glassScene.images.get('device:'+d.id));assert(glassScene.artModels.get(d.id).displayImage.endsWith('-glass.png'));}await verifyPPTX(glassScene,'external-glass-icons',5);await fs.writeFile(path.join(output,'external-glass-icons.png'),await sharp(Buffer.from(E.svgFromScene(glassScene))).png().toBuffer());console.log('PASS Five generated External icon variants embed independently in SVG and PowerPoint');
