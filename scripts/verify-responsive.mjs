import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// DOM/event contract checks. No browser layout, native dialogs or physical
// iPhone/iPad gesture support is claimed by this harness.
class Element {
  constructor(tag='div',attrs={}){this.tagName=tag;this.attrs={...attrs};this.dataset={};this.children=[];this.listeners={};this.style={setProperty(){}};this.hidden=false;this.open=false;this.value='';this.scrollLeft=this.scrollTop=0;this.captured=new Set();this.classes=new Set((attrs.class||'').split(' ').filter(Boolean));this.classList={contains:c=>this.classes.has(c),add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,v)=>v?this.classes.add(c):this.classes.delete(c)};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v;}
  set id(v){this.attrs.id=v} get id(){return this.attrs.id}
  set className(v){this.classes=new Set(v.split(' '))}
  setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]}
  matches(q){return q.split(',').some(s=>{s=s.trim();if(s.startsWith('.'))return this.classes.has(s.slice(1));if(s.startsWith('#'))return this.id===s.slice(1);const a=s.match(/^\[([^\]=]+)(?:="([^"]*)")?\]$/);return a?Object.hasOwn(this.attrs,a[1])&&(a[2]===undefined||this.attrs[a[1]]===a[2]):s===this.tagName;});}
  closest(q){return this.matches(q)?this:this.parentElement?.closest(q)||null}
  querySelectorAll(q){return this.children.flatMap(c=>[...(c.matches(q)?[c]:[]),...c.querySelectorAll(q)])}querySelector(q){return this.querySelectorAll(q)[0]||null}
  appendChild(c){c.remove();c.parentElement=this;this.children.push(c);return c}remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(c=>c!==this);this.parentElement=null}}
  before(c){c.remove();const p=this.parentElement;p.children.splice(p.children.indexOf(this),0,c);c.parentElement=p}
  replaceWith(c){this.before(c);this.remove()}replaceChildren(...cs){for(const c of [...this.children])c.remove();cs.forEach(c=>this.appendChild(c))}
  set innerHTML(html){this.replaceChildren();const stack=[this];for(const t of html.matchAll(/<\/?[a-z][^>]*>/g)){const raw=t[0],tag=raw.match(/^<\/?([\w-]+)/)[1];if(raw.startsWith('</')){if(stack.length>1)stack.pop();continue;}const a={};for(const m of raw.matchAll(/([\w-]+)="([^"]*)"/g))a[m[1]]=m[2];const child=stack.at(-1).appendChild(new Element(tag,a));if(!['input','br','hr'].includes(tag))stack.push(child);}}
  addEventListener(t,fn,opts){(this.listeners[t]||=[]).push({fn,capture:!!(opts===true||opts?.capture)})}
  dispatchEvent(e){e.target ||= this;for(const {fn}of [...(this.listeners[e.type]||[])].sort((a,b)=>+b.capture-+a.capture)){fn(e);if(e.stopped)return;}this['on'+e.type]?.(e)}
  click(){this.dispatchEvent(new Event('click',{target:this}))}focus(){focused=this}showModal(){this.open=true}close(){this.open=false;queuedClose.push(()=>this.dispatchEvent(new Event('close')))}
  getBoundingClientRect(){return {left:0,top:0,width:390,height:540,right:390,bottom:540}}
  setPointerCapture(id){this.captured.add(id)}hasPointerCapture(id){return this.captured.has(id)}releasePointerCapture(id){this.captured.delete(id)}
}
class Event{constructor(type,props={}){this.type=type;Object.assign(this,props)}preventDefault(){this.prevented=true}stopImmediatePropagation(){this.stopped=true}}
let focused,queuedClose=[],compact=true;
const body=new Element('body'),doc={body,createElement:t=>new Element(t),createComment:()=>new Element('comment'),getElementById:id=>body.querySelector('#'+id),querySelector:q=>body.querySelector(q)};
const add=(parent,tag,id,cls)=>parent.appendChild(new Element(tag,{...(id?{id}:{}),...(cls?{class:cls}:{})}));
const top=add(body,'nav',null,'top-actions'),workspace=add(body,'main','workspace'),lib=add(workspace,'aside',null,'catalog'),catalog=add(lib,'div','catalogList'),accessory=add(lib,'div','bayfaceAccessoryList'),toolbar=add(workspace,'div',null,'canvas-toolbar'),bayLayout=add(workspace,'div',null,'bayface-layout'),bi=add(bayLayout,'aside','bayfaceInspector'),ins=add(workspace,'aside','inspector');
for(const id of ['libraryShow','libraryCollapse','inspectorCollapse','bayfaceInspectorToggle','addRackBtn','topologyTab','bayfaceTab','specsTab'])add(toolbar,'button',id);
for(const id of ['newBtn','openBtn','quickPasteJSONBtn','saveBtn','templatesBtn','projectMenuBtn','exportOptionsBtn','bayfacePresent','presentationBtn','settingsBtn','sourcesBtn','selectionMenuBtn','studioBtn','animationBtn'])add(top,'button',id);
const canvas=add(workspace,'div','canvas'),bayCanvas=add(bayLayout,'div','bayfaceCanvas'),specPage=add(workspace,'div',null,'spec-page'),layout=add(specPage,'div',null,'spec-layout'),filters=add(layout,'aside',null,'spec-controls');
for(const id of ['specType','specBrand','specU','specPower','specConnector','specSpeed','specThroughput','specField','specValue','specReset'])add(filters,'input',id);
const $=id=>doc.getElementById(id),mq={get matches(){return compact},addEventListener(_,fn){this.change=fn}};
let device,oldCatalogCalled=0,draft='untouched',newProjectCount=0,desktopOpen=0;
const project={bayface:{racks:[{id:'rack'}]}},app={getProject:()=>project,getView:()=>({width:390,height:540,zoom:2,pan:{x:-80,y:30}}),getCatalog:()=>[{id:'switch',model:'Test Switch'}],addDevice:(id,x,y)=>device={id,x,y},toast(){},setView(){}};
$('newBtn').onclick=()=>newProjectCount++;
$('libraryShow').onclick=()=>desktopOpen++;
catalog.onclick=()=>{oldCatalogCalled++;draft='selected switch'};
const context={document:doc,NOAH_APP:app,NOAH_BAYFACE:{fitRack(){},getZoom:()=>1,setZoom(){}},NOAH_EDITOR:{onViewChange(){}},NOAH_GEOMETRY:{deviceSize:()=>({width:244,height:88})},NOAH_TOUCH:{install(){}},matchMedia:()=>mq,addEventListener(){},requestAnimationFrame:fn=>fn(),getComputedStyle:()=>({paddingLeft:'22',paddingTop:'28'}),console};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync('web/responsive.js','utf8'),context);
assert(body.classList.contains('compact-workspace'));
$('libraryShow').click();assert.equal(lib.parentElement.id,'responsivePanelBody');assert.equal(focused.id,'responsivePanelClose');
const card=add(catalog,'button',null);card.attrs['data-model']='switch';card.dataset.model='switch';catalog.onclick({target:card});assert.equal(device.x,15.5);assert.equal(device.y,76);assert.equal(lib.parentElement,workspace);assert.equal(oldCatalogCalled,0);
console.log('PASS Compact Library adds at the visible canvas center and restores its DOM location');
body.classList.add('bayface-mode');$('libraryShow').click();catalog.onclick({target:card});assert.equal(draft,'selected switch');assert.equal(oldCatalogCalled,1);assert.equal(bi.parentElement.id,'responsivePanelBody');for(const fn of queuedClose.splice(0))fn();assert.equal(bi.parentElement.id,'responsivePanelBody');assert($('responsivePanel').open);
context.NOAH_RESPONSIVE.closePanel();assert.equal(bi.parentElement,bayLayout);assert.equal(lib.parentElement,workspace);
console.log('PASS Rack drafts survive Library-to-Inspector transitions and queued native close events');
$('specFiltersBtn').click();$('specBrand').value='Huawei';filters.dispatchEvent(new Event('change'));assert.equal($('specFiltersBtn').textContent,'ตัวกรอง · 1');compact=false;mq.change();assert.equal(filters.parentElement,layout);assert.equal($('specBrand').value,'Huawei');assert(!body.classList.contains('compact-workspace'));$('libraryShow').click();assert.equal(desktopOpen,1);
console.log('PASS Resizing to desktop restores panels, filter values and desktop controls');
compact=true;mq.change();$('workspaceActionsBtn').click();const grid=$('responsivePanelBody').children[0];grid.children[0].click();assert.equal(newProjectCount,1);assert(!$('responsivePanel').open);
console.log('PASS Compact Project actions call the original operation exactly once');

const gestureContext={window:null,PointerEvent:Event,Date,console,addEventListener(){}};gestureContext.window=gestureContext;vm.createContext(gestureContext);vm.runInContext(fs.readFileSync('web/touch-gestures.js','utf8'),gestureContext);
const surface=new Element('div'),target=new Element('div');let view={zoom:1,pan:{x:-80,y:30}},cancelled=0,normalMoves=0,normalUps=0;
surface.addEventListener('pointercancel',()=>cancelled++);
surface.addEventListener('pointermove',()=>normalMoves++);
surface.addEventListener('pointerup',()=>normalUps++);
gestureContext.NOAH_TOUCH.install(surface,{min:.15,max:3,read:()=>view,write:v=>view=v});
const touch=(type,id,x,y,extra={})=>{const e=new Event(type,{target,pointerType:'touch',pointerId:id,clientX:x,clientY:y,...extra});surface.dispatchEvent(e);return e};
touch('pointerdown',1,100,100);touch('pointermove',1,100,100);assert.equal(normalMoves,1);touch('pointerdown',2,200,100);assert.equal(cancelled,1);
touch('pointermove',2,300,100);assert.equal(view.zoom,2);assert.equal(view.pan.x,-260);assert.equal(view.pan.y,-40);assert.equal(normalMoves,1);
touch('pointermove',2,1000,100);assert.equal(view.zoom,3);touch('pointerup',2,1000,100);const held=JSON.stringify(view);touch('pointermove',1,130,130);assert.equal(JSON.stringify(view),held);touch('pointerup',1,130,130);assert.equal(normalUps,0);const click=new Event('click');surface.dispatchEvent(click);assert(click.prevented);
console.log('PASS Two-finger zoom holds its world anchor, clamps scale and suppresses editing/clicks');
touch('pointerdown',3,60,50);touch('pointerdown',4,90,50);touch('pointercancel',4,90,50);touch('pointercancel',3,60,50);touch('pointerdown',5,70,70);touch('pointermove',5,90,90);touch('pointerup',5,90,90);assert.equal(normalMoves,2);assert.equal(normalUps,1);
console.log('PASS Cancelled touch gestures recover normal one-finger interactions');
