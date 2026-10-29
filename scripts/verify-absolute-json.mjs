import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Tests app transactions and event handlers without a browser. This deliberately
// does not claim to verify layout, native dialog behavior, or native WebMCP.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = new Map(), tools = new Map(), blobs = new Map(), downloads = [];
const decode = s => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function attributes(text) {
  const result = {};
  for (const m of text.matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g)) result[m[1]] = decode(m[2] ?? m[3] ?? '');
  return result;
}
class Element {
  constructor(tag = 'div', attrs = {}) {
    this.tagName = tag.toUpperCase(); this.id = attrs.id || ''; this.dataset = {}; this.style = {setProperty(name,value){this[name]=value;}};
    this.hidden=Object.hasOwn(attrs,'hidden');
    this.value = attrs.value || ''; this.checked = Object.hasOwn(attrs, 'checked'); this.disabled = Object.hasOwn(attrs, 'disabled');
    this.textContent = ''; this.open = false; this.listeners = {}; this.children = [];
    this.classes = new Set((attrs.class || '').split(/\s+/).filter(Boolean));
    this.classList = {
      add: (...names) => names.forEach(n => this.classes.add(n)),
      remove: (...names) => names.forEach(n => this.classes.delete(n)),
      toggle: (n, force) => { const set = force ?? !this.classes.has(n); set ? this.classes.add(n) : this.classes.delete(n); return set; },
      contains: n => this.classes.has(n)
    };
    for (const [key, value] of Object.entries(attrs)) if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
  }
  set innerHTML(value) {
    for (const child of this.children) if (ids.get(child.id) === child) ids.delete(child.id);
    this.html = value; this.children = [];
    for (const m of value.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
      const child = new Element(m[1], attributes(m[2])); child.parent = this; this.children.push(child);
      if (child.id) ids.set(child.id, child);
    }
    for (const m of value.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)) {
      const select = ids.get(attributes(m[1]).id); if (!select) continue;
      const options = [...m[2].matchAll(/<option\b([^>]*)>/g)].map(x => attributes(x[1]));
      select.value = (options.find(x => Object.hasOwn(x, 'selected')) || options[0] || {}).value || '';
    }
  }
  get innerHTML() { return this.html || ''; }
  matches(selector) {
    if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));
    if(selector.startsWith('#'))return this.id===selector.slice(1);
    if(selector.startsWith('.'))return this.classes.has(selector.slice(1));
    const match=selector.match(/^(?:([a-z]+))?\[([\w-]+)(?:="([^"]*)")?\]$/i);
    if(match){const [,tag,name,value]=match;if(tag&&this.tagName!==tag.toUpperCase())return false;let actual=name.startsWith('data-')?this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:this[name];return value===undefined?actual!==undefined&&actual!==false:String(actual)===value;}
    return this.tagName===selector.toUpperCase();
  }
  closest(selector){return this.matches(selector)?this:this.parent?.closest(selector)||null;}
  querySelectorAll(selector) { return this.children.filter(x => x.matches(selector)); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  dispatch(name, e = {}) { for (const fn of this.listeners[name] || []) fn(e); this['on' + name]?.(e); }
  getBoundingClientRect() { return { width: 1000, height: 720, left: 0, top: 0 }; }
  setPointerCapture(id){this.capturedPointer=id;} hasPointerCapture(id){return this.capturedPointer===id;} releasePointerCapture(){this.capturedPointer=null;}
  appendChild(child){child.parent=this;this.children.push(child);return child;} remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
  replaceChildren(...children){this.children=children;for(const child of children)child.parent=this;} select(){}
  focus() {} blur(){this.onblur?.();} setAttribute(name,value) { this[name]=value; } getAttribute(name){return this[name]??null;} showModal() { this.open = true; }
  close() { this.open = false; this.onclose?.(); }
  click() { if (this.tagName === 'A') downloads.push({ name: this.download, blob: blobs.get(this.href) }); else this.onclick?.({ target: this }); }
}
const documentListeners=new Map(),localValues=new Map();
const localStorage={getItem:key=>localValues.get(key)??null,setItem:(key,value)=>localValues.set(key,String(value)),removeItem:key=>localValues.delete(key)};
const document = {
  getElementById: id => ids.get(id) || null,
  createElement: tag => new Element(tag),
  documentElement:new Element('html',{'data-theme':'dark'}),body:new Element('body'),
  querySelector:selector=>[...ids.values()].find(el=>el.matches(selector))||null,
  addEventListener(name,fn,capture=false){(documentListeners.get(name)||documentListeners.set(name,[]).get(name)).push({fn,capture});},
  dispatch(name,event){for(const {fn}of [...(documentListeners.get(name)||[])].sort((a,b)=>+b.capture-+a.capture))fn(event);},
  modelContext: { registerTool: t => { assert(!tools.has(t.name)); tools.set(t.name, t); } }
};
for (const m of fs.readFileSync(path.join(root, 'web/studio.html'), 'utf8').matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
  const a = attributes(m[2]); if (a.id) ids.set(a.id, new Element(m[1], a));
}
const windowListeners=new Map();
const context = vm.createContext({ document,localStorage,crypto,Blob,AbortController,console,innerWidth:1440,innerHeight:1000,
  URL: { createObjectURL: b => { const id = 'blob:' + blobs.size; blobs.set(id, b); return id; }, revokeObjectURL() {} },
  requestAnimationFrame: fn => fn(), setTimeout: () => 1, clearTimeout() {}, addEventListener(name,fn){(windowListeners.get(name)||windowListeners.set(name,[]).get(name)).push(fn);} });
context.IntersectionObserver=class { observe(){} unobserve(){} disconnect(){} };
context.window = context;
vm.runInContext(fs.readFileSync(path.join(root, 'web/catalog.js'), 'utf8'), context);vm.runInContext(fs.readFileSync(path.join(root, 'web/audience.js'), 'utf8'), context);vm.runInContext(fs.readFileSync(path.join(root, 'web/icon-styles.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root,'web/port-resources.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'web/importer.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root, 'web/elements.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'web/geometry.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'web/exports.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root,'web/bayface-accessories.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root, 'web/bayface-model.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'web/pe-interfaces.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'web/app.js'), 'utf8'), context);
const app = context.NOAH_APP, get = id => document.getElementById(id);
const plain = x => JSON.parse(JSON.stringify(x));
let count = 0;
function check(name, fn) { fn(); count++; console.log('PASS ' + name); }
function action(el, dataset) { el.onclick({ target: { closest: () => ({ dataset }) } }); }
function newProject() { get('newBtn').onclick(); }
function device(model) { const result = app.addDevice(model, 100, 100); assert(result); return result.id; }
function link(a, ap, b, bp, extra = {}) { return { id: 'test-' + crypto.randomUUID().slice(0, 8), a: { device: a, port: ap }, b: { device: b, port: bp }, speed: 1000, cable: 'copper', cid: '', vlans: '', label: '', ...extra }; }
const cisco = 'cisco-asr-1001-x', huawei = 'huawei-s5735-l8t4x-qa-v2', ale = 'alcatel-os6450-10';


const fixture=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/absolute-topology.json'),'utf8'));
const convert=data=>context.NOAH_IMPORT.convert(data,app.getCatalog()).project;
check('Supplied JSON imports four nodes, two links and all presentation data',()=>{
 const p=app.sanitizeProject(convert(fixture));assert.equal(p.devices.length,4);assert.equal(p.links.length,2);assert.equal(p.labels.length,4);
 fixture.nodes.forEach((n,i)=>{const d=p.devices[i];assert.equal(d.id,n.id);assert.equal(d.hostname,n.title);assert.equal(d.x,n.position.x);assert.equal(d.y,n.position.y);assert.equal(d.width,n.size.width);assert.equal(d.height,n.size.height);assert(d.notes.includes(n.header));assert(d.notes.includes(n.badge));});
 assert.equal(p.devices[2].managementIP,'172.16.63.166');assert.deepEqual(plain(p.viewBox),fixture.viewBox);
 app.replaceProject(p);assert(get('nodes').innerHTML.includes('cloud.svg'));assert(get('links').innerHTML.includes('fill="#ffffff"'));
 assert.deepEqual(plain(app.sanitizeProject(JSON.parse(JSON.stringify(p)))),plain(p));
 const models=new Map(app.getCatalog().map(m=>[m.id,m])),G=context.NOAH_GEOMETRY,g=G.linkLayout(p.links[0],p,models);
 assert.equal(g.path,'M385,380 L812,380');assert(G.arrows(p.links[0],g,'#ffffff').includes('Z'));
 assert.equal(G.linkStyle(p.links[0],p,models).dash,'');
 app.undo();assert.equal(app.getProject().devices.length,0);
});
check('All endpoint sides, line patterns and arrow directions survive validation',()=>{
 for(const side of ['left','right','top','bottom'])for(const lineStyle of ['solid','dashed','dotted'])for(const arrowStyle of ['none','forward','backward','both']){
 const data=plain(fixture);Object.assign(data.edges[0],{sourceSide:side,targetSide:side,lineStyle,arrowStyle});const p=app.sanitizeProject(convert(data)),l=p.links[0],models=new Map(app.getCatalog().map(m=>[m.id,m])),G=context.NOAH_GEOMETRY,g=G.linkLayout(l,p,models);
 assert.equal((G.arrows(l,g,l.color).match(/<path/g)||[]).length,arrowStyle==='both'?2:arrowStyle==='none'?0:1);
 assert.equal(G.linkStyle(l,p,models).dash,{solid:'',dashed:'10 7',dotted:'2 5'}[lineStyle]);
 assert.equal(l.sourceSide,side);assert.deepEqual(plain(app.sanitizeProject(p)),plain(p));
 }
});
check('Invalid structures reject without changing the current project',()=>{
 const before=plain(app.getProject());const mutations=[d=>d.nodes.push(d.nodes[0]),d=>d.edges.push(d.edges[0]),d=>d.edges[0].source='missing',d=>d.edges[0].target=d.edges[0].source,d=>d.edges[0].color='url(evil)',d=>d.edges[0].sourceSide='oops',d=>d.edges[0].arrowStyle='oops',d=>d.edges[0].lineStyle='oops',d=>d.viewBox.width=0,d=>d.nodes[0].position.x='5',d=>d.nodes[0].size.width=0,d=>d.nodes[0].metadata=null,d=>d.nodes[0].type='unknown',d=>d.nodes[0].id='bad id',d=>d.nodes=Array(201).fill(d.nodes[0]),d=>d.edges=Array(401).fill(d.edges[0])];
 for(const mutate of mutations){const data=plain(fixture);mutate(data);assert.throws(()=>convert(data));}assert.deepEqual(plain(app.getProject()),before);
});
const p=app.sanitizeProject(convert(fixture)),scene=await context.NOAH_EXPORT.scene(p,app.getCatalog(),async()=> 'data:image/png;base64,AA==');
const svg=context.NOAH_EXPORT.svgFromScene(scene);assert(svg.includes('fill="#ffffff"'));assert(svg.includes('172.16.63.166'));assert(scene.bounds.width>=1280);assert(svg.includes('M385,380 L812,380'));
console.log('PASS SVG export preserves arrows, colors, viewBox coverage and metadata');
check('ACM and native project import remain compatible',()=>{const data=context.NOAH_IMPORT.parse(fs.readFileSync(path.join(root,'scripts/fixtures/acm-hops.txt'),'utf8')).data;const r=context.NOAH_IMPORT.convert(data,app.getCatalog());assert(r.project.devices.length>0);app.sanitizeProject(r.project);assert.equal(context.NOAH_IMPORT.convert(p,app.getCatalog()).source,'NOAH Project');});
console.log('Verified absolute JSON import, round-trip, geometry, export and legacy formats.');

const {validateProject}=await import('../server/template-validation.mjs');
const {default:serverModels}=await import('../server/models.mjs');
check('Shared templates retain the imported geometry and style fields',()=>{
 const saved=validateProject(p,serverModels);assert.deepEqual(plain(saved.viewBox),plain(p.viewBox));assert.deepEqual(plain(saved.links),plain(p.links));assert.deepEqual(plain(app.sanitizeProject(saved).links),plain(p.links));
 const invalid=plain(p);invalid.links[0].arrowStyle='invalid';assert.throws(()=>validateProject(invalid,serverModels));
});
vm.runInContext(fs.readFileSync(path.join(root,'web/editor.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'web/project-tools.js'),'utf8'),context);
check('Existing JSON dialog previews and imports nodes/edges with undo',()=>{
 const before=plain(app.getProject());get('importJSON').value=JSON.stringify(fixture);get('previewJSONBtn').onclick();assert.equal(get('importError').textContent,'');assert(get('importSummary').innerHTML.includes('4 อุปกรณ์'));get('importForm').onsubmit({preventDefault(){}});assert.equal(app.getProject().links.length,2);app.undo();assert.deepEqual(plain(app.getProject()),before);
});
