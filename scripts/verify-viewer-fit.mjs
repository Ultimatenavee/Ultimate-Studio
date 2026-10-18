import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import * as T from 'three';
import {createDeviceModel} from '../src/datacenter/device-model.js';
import {fitDeviceCamera} from '../src/datacenter/viewer-fit.js';
const models=[...JSON.parse(fs.readFileSync('src/datacenter/devices.json')),...JSON.parse(fs.readFileSync('src/datacenter/museum-optics.json'))];
const previous=globalThis.document;
class ImageStub{addEventListener(){}removeEventListener(){}set src(v){}}
globalThis.document={createElementNS:()=>new ImageStub(),createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
let cases=0;
try{
 for(const model of models){
  const asset=createDeviceModel(model,{detail:false});asset.group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(asset.group);
  for(const [width,height,top,bottom]of [[320,300,48,210],[360,340,48,140],[600,600,48,110],[1000,620,48,110],[1600,650,48,70]]){
   const camera=new T.PerspectiveCamera(35,width/height,.005,30),insets={width,height,top,bottom,left:20,right:20};
   for(const dir of [new T.Vector3(0,0,1),new T.Vector3(0,0,-1),new T.Vector3(1,0,0),new T.Vector3(-1,0,0),new T.Vector3(0,1,.0001),new T.Vector3(0,-1,.0001),...Array.from({length:24},(_,i)=>new T.Vector3(Math.sin(i*Math.PI/12),.4,Math.cos(i*Math.PI/12)))]){
    fitDeviceCamera(camera,bounds,dir,insets);let occupied=0;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
     const p=new T.Vector3(x,y,z).project(camera),px=(p.x+1)*width/2,py=(1-p.y)*height/2;
     assert(px>=20-.001&&px<=width-20+.001,model.id+' stays within horizontal viewport');
     assert(py>=top-.001&&py<=height-bottom+.001,model.id+' clears top label and wrapped toolbar');
     assert(p.z>-1&&p.z<1,model.id+' no near/far clipping');occupied=Math.max(occupied,Math.abs(p.x)*width/(width-40),Math.abs(py-(top+height-bottom)/2)*2/(height-top-bottom));
    }
    assert(occupied>.8,model.id+' fills available window rather than a distant thumbnail');cases++;
   }
  }
  asset.dispose();
 }
}finally{globalThis.document=previous;}
console.log(`PASS Device framing: ${models.length} catalog / optical models, ${cases} projected views including a full rotation, phone/tablet/desktop/ultrawide, actual cable bounds, toolbar clearance and useful viewport occupancy.`);

// Exercise the actual viewer/resize/controls glue with native cameras and a renderer double.
{let camera,scene,resize,orbit,next=1;const frames=new Map();let width=1000,height=620;
 class El{constructor(){this.listeners=new Map();}append(){}remove(){}addEventListener(k,f){this.listeners.set(k,f)}getBoundingClientRect(){return {left:0,top:0,bottom:height,width,height}}}
 const doc=new El();doc.hidden=false;doc.body={classList:{contains:()=>false}};doc.createElementNS=()=>new ImageStub();doc.createElement=()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})});
 const host=new El();host.parentElement={querySelector:s=>({getBoundingClientRect:()=>s==='.dv-floating-tag'?{top:20,bottom:44,height:24}:s==='.dv-views'?{top:height-130,height:84}:{top:height-36,height:30}})};
 class Renderer{constructor(){this.domElement=new El();this.shadowMap={}}setPixelRatio(){}setSize(){}render(s,c){scene=s;camera=c;s.updateMatrixWorld(true);c.updateMatrixWorld(true)}dispose(){}forceContextLoss(){}}
 class Orbit extends El{constructor(c){super();orbit=this;this.camera=c;this.target=new T.Vector3()}update(){this.camera.lookAt(this.target)}dispose(){}}
 const context={require:createRequire(import.meta.url),exports:{},document:doc,performance:{now:()=>0},devicePixelRatio:1,AbortController,ResizeObserver:class{constructor(fn){resize=fn}observe(){}disconnect(){}},requestAnimationFrame:f=>{const id=next++;frames.set(id,f);return id},cancelAnimationFrame:id=>frames.delete(id),__Renderer:Renderer,__Orbit:Orbit,__PMREM:class{fromScene(){return {texture:null,dispose(){}}}dispose(){}},__Room:class{dispose(){}}};context.module={exports:context.exports};
 const source=fs.readFileSync('src/datacenter/viewer-scene.js','utf8').replace("import {OrbitControls} from 'three/addons/controls/OrbitControls.js';",'const OrbitControls=__Orbit;').replace("import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';",'const RoomEnvironment=__Room;').replace('new T.WebGLRenderer(', 'new __Renderer(').replace('new T.PMREMGenerator(', 'new __PMREM(');
 const bundle=await build({stdin:{contents:source,resolveDir:process.cwd()+'/src/datacenter'},bundle:true,platform:'node',format:'cjs',write:false,external:['three','three/*']});vm.runInNewContext(bundle.outputFiles[0].text,context);
 const tick=t=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(t));};
 globalThis.document=doc;
 try{for(const id of ['cisco-c1121-8pltep','huawei-ne40e-x8a','optic-40g-dac']){
  const model=models.find(m=>m.id===id);assert(model,id);width=1000;height=620;const viewer=context.module.exports.createViewerScene(host,{model});tick(0);
  const check=()=>{const bounds=new T.Box3();for(const child of scene.children)if(child.isGroup)bounds.union(new T.Box3().setFromObject(child));for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<=1&&Math.abs(p.y)<=1,'actual viewer pose stays in window');}};
  check();const initial=camera.position.distanceTo(orbit.target);viewer.zoom(.5);tick(40);assert(camera.position.distanceTo(orbit.target)<initial*.6,'manual zoom remains available');viewer.fit();tick(80);check();width=360;height=340;resize();tick(120);assert.equal(camera.aspect,360/340);check();
  for(const side of ['front','rear','left','right','top','bottom','perspective']){viewer.view(side);tick(160);check();}viewer.rotate(true);for(let i=0;i<200;i++){tick(200+i*40);check();}viewer.dispose();assert.equal(frames.size,0,'closing viewer cancels all frames');
 }}finally{globalThis.document=previous;}
 console.log('PASS Actual viewer wiring: initial fit, manual zoom / Fit, resize, all side buttons, auto-rotation and disposal with native Three math / mocked renderer. Browser/GPU appearance remains untested.');
}
