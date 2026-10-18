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

check('Catalog includes 34 display assets, 29 documented profiles and 5 PE illustrations', () => {
  const catalog = app.getCatalog().filter(m=>!m.hidden); assert.equal(catalog.length, 34); assert.equal(catalog.filter(m => m.physicalReady).length, 34); assert.equal(catalog.filter(m => m.calibrated).length, 7);
  for (const m of catalog) {
    assert(m.sources.length); for (const s of m.sources) assert(/^https:\/\//.test(s.url));
    assert(fs.statSync(path.join(root, 'web', m.thumbnail)).size > 500); assert(fs.statSync(path.join(root,'web',m.displayImage)).size>500); if(m.topologyOnly){assert.equal(m.ports.length,0);assert.equal(m.powerSlots,0);assert.deepEqual(plain(m.verifiedSpecs),{});assert.deepEqual(plain(m.originalSpecs),{});continue;} if (!m.physicalReady) continue;
    for (const file of Object.values(m.images)) assert(fs.statSync(path.join(root, 'web', file)).size > 500);
    for (const x of [...m.ports, ...Object.values(m.components).flat()]) if (x.box) {
      const [left, top, width, height] = x.box; assert(width > 0 && height > 0);
      assert(left >= 0 && top >= 0 && left + width <= 100.1 && top + height <= 100.1, JSON.stringify(x));
    }
  }
});
check('Manufacturer-specific physical socket and logical interface counts', () => {
  const models = app.getCatalog(); const net = id => models.find(m => m.id === id).ports.filter(p => p.kind === 'network');
  assert.equal(net(cisco).length, 8); assert.equal(net(huawei).length, 12); assert.equal(net(ale).length, 14);
  assert.equal(new Set(net(ale).map(p => p.group || p.id)).size, 12);
  assert.deepEqual(plain(net(cisco).find(p => p.id === 'te0').speeds), [10000]);
});
check('Initial workspace is empty and round-trips its project data', () => {
  const p = app.getProject(); assert.equal(p.devices.length, 0); assert.equal(p.links.length, 0); assert.equal(p.labels.length, 0); assert.equal(p.groups.length, 0);
  assert.deepEqual(plain(app.sanitizeProject(plain(p))), plain(p));
  assert(!get('nodes').innerHTML.includes('data-device')); assert(!get('links').innerHTML.includes('data-link'));
});
check('Selection preserves DOM targets for double-click and small movement', () => {
  device(huawei);
  const node = get('nodes').children.find(e => e.dataset.device); assert(node);
  const before = get('nodes').innerHTML;
  const target = { closest: s => s === '[data-device]' ? node : null };
  get('canvas').dispatch('pointerdown', { target, clientX: 100, clientY: 100, pointerId: 1 });
  assert.equal(get('nodes').innerHTML, before);
  const origin = app.getProject().devices.find(d => d.id === node.dataset.device);
  get('canvas').dispatch('pointermove', { target, clientX: 101, clientY: 101 });
  get('canvas').dispatch('pointerup', { target, clientX: 101, clientY: 101 });
  const after = app.getProject().devices.find(d => d.id === node.dataset.device);
  assert.equal(after.x, origin.x); assert.equal(after.y, origin.y);
  get('canvas').ondblclick({ target }); assert(get('physicalDialog').open); get('physicalDialog').close();
});
check('Valid copper connection, duplicate occupancy and atomic rejection', () => {
  newProject(); const a = device(huawei), b = device(ale), c = device(huawei);
  app.saveLink(link(a, 'ge1', b, 'r1', { vlans: '100-110, 1850' })); assert.equal(app.getProject().links.length, 1);
  const before = plain(app.getProject());
  assert.throws(() => app.saveLink(link(a, 'ge1', c, 'ge1')), /Combo Port/);
  assert.throws(() => app.saveLink(link(a, 'ge2', c, 'ge2', { speed: 10000 })), /ความเร็ว/);
  assert.throws(() => app.saveLink(link(a, 'ge2', c, 'ge2', { vlans: '4095' })), /VLAN/);
  assert.throws(() => app.saveLink(link(a, 'ge2', a, 'ge3')), /อีกเครื่อง/);
  assert.deepEqual(plain(app.getProject()), before);
});
check('ALE combo port blocks the alternate physical socket', () => {
  const p = app.getProject(), a = p.devices[0].id, b = p.devices[1].id, c = p.devices[2].id;
  app.saveLink(link(a, 'ge2', b, 'r9'));
  assert.throws(() => app.saveLink(link(c, 'x1', b, 's9', { cable: 'sm' }), { [c + ':x1']: 'lx', [b + ':s9']: 'lx' }), /Combo Port/);
  assert.equal(app.getProject().links.length, 2);
});
check('Fiber requires matching optics, media, speed and form factor', () => {
  const p = app.getProject(), a = p.devices[0].id, b = p.devices[1].id, c = p.devices[2].id;
  const f = link(c, 'x2', b, 's10', { cable: 'sm' });
  assert.throws(() => app.saveLink(f), /Transceiver/);
  assert.throws(() => app.saveLink(f, { [c + ':x2']: 'lx', [b + ':s10']: 'sx' }), /ชนิด Fiber/);
  assert.throws(() => app.saveLink(f, { [c + ':x2']: 'lx', [b + ':s10']: 'lr' }), /ความเร็ว/);
  app.saveLink(f, { [c + ':x2']: 'lx', [b + ':s10']: 'lx' });
  assert.equal(app.getProject().devices.find(d => d.id === c).transceivers.x2, 'lx');
  assert.throws(() => app.saveLink(link(a, 'ge3', c, 'x3', { cable: 'sm' })), /Fiber/);
  const r = device(cisco), oneG = link(r, 'te0', a, 'x3', { cable: 'sm' });
  assert.throws(() => app.saveLink(oneG, { [r + ':te0']: 'lx', [a + ':x3']: 'lx' }), /ความเร็ว/);
  app.saveLink({ ...oneG, speed: 10000 }, { [r + ':te0']: 'lr', [a + ':x3']: 'lr' });
});
check('Front/rear physical views, redundant power, LED and link status', () => {
  const p = app.getProject(), router = p.devices.find(d => d.modelId === cisco);
  app.openPhysical(router.id); action(get('physicalContent'), {visual:'diagram'}); assert(get('physicalContent').innerHTML.includes('cisco-asr1001x-front.png'));
  action(get('physicalContent'), { face: 'rear' }); assert(get('physicalContent').innerHTML.includes('cisco-asr1001x-rear-ac.png'));
  const setSupply = i => get('physicalContent').onchange({ target: { dataset: { supply: String(i), supplyField: 'connected' }, type: 'checkbox', checked: false } });
  setSupply(0); assert(get('physicalContent').innerHTML.includes('มีแหล่งจ่ายไฟ'));
  setSupply(1); assert(get('physicalContent').innerHTML.includes('ไม่มีแหล่งจ่ายไฟ')); assert(get('links').innerHTML.includes('stroke-dasharray'));
  app.undo(); assert(get('physicalContent').innerHTML.includes('มีแหล่งจ่ายไฟ'));
  get('physicalContent').onchange({ target: { id: 'alarmState', dataset: {}, value: 'critical' } });
  action(get('physicalContent'), { face: 'front' }); assert(get('physicalContent').innerHTML.includes('component-active alarm-critical'));
  get('physicalDialog').close();
});
check('Delete cascades links and undo/redo preserves the complete project', () => {
  const before = plain(app.getProject()), id = before.devices[1].id;
  app.deleteDevice(id); assert(!app.getProject().links.some(l => l.a.device === id || l.b.device === id));
  app.undo(); assert.deepEqual(plain(app.getProject()), before);
  app.redo(); assert(!app.getProject().devices.some(d => d.id === id)); app.undo();
});
check('Import rejects unknown models, duplicate IDs, stale ports and wrong optics', () => {
  const original = plain(app.getProject()); const mutate = fn => { const p = plain(original); fn(p); return p; };
  assert.throws(() => app.sanitizeProject(mutate(p => p.devices[0].modelId = 'unknown')), /Catalog/);
  assert.throws(() => app.sanitizeProject(mutate(p => p.devices[1].id = p.devices[0].id)), /ID/);
  assert.throws(() => app.sanitizeProject(mutate(p => p.links[0].a.port = 'unknown')), /พอร์ต/);
  assert.throws(() => app.sanitizeProject(mutate(p => p.devices[0].transceivers.ge1 = 'lr')), /Transceiver/);
  assert.throws(() => app.sanitizeProject(mutate(p => p.devices[0].x = null)), /ตำแหน่ง/);
  assert.deepEqual(plain(app.getProject()), original);
});
check('Every device opens its image, all spec rows and label editor', () => {
  for (const m of app.getCatalog().filter(m=>!m.hidden)) {
    const id = device(m.id); app.openPhysical(id);
    assert(get('physicalContent').innerHTML.includes(m.model)); assert(get('physicalContent').innerHTML.includes(m.physicalImages?.front?.src||m.photos?.front||m.images?.front||m.diagramImages?.front||m.physicalImages?.rear?.src||m.photos?.rear||m.images?.rear||'ยังไม่มีภาพด้านนี้ที่ยืนยันได้'));
    action(get('physicalContent'), {deviceTab:'specs'}); if(m.topologyOnly){assert(!get('physicalContent').innerHTML.includes('data-device-tab="specs"'));assert(!get('physicalContent').innerHTML.includes('data-port='));}else{assert(get('physicalContent').innerHTML.includes('สเปกทั้งหมด'));assert(get('physicalContent').innerHTML.includes('Physical network sockets'));}
    action(get('physicalContent'), {deviceTab:'labels'}); assert(get('deviceHostname')); get('physicalDialog').close();
  }
  assert.deepEqual(plain(app.sanitizeProject(plain(app.getProject()))), plain(app.getProject()));
  assert(!get('nodes').innerHTML.includes('node-brand')); assert(!get('nodes').innerHTML.includes('POWER ON')); assert(!get('nodes').innerHTML.includes('node-bottom'));
});
check('HTML escapes imported project labels', () => {
  get('inspector').onchange({ target: { dataset: { field: 'hostname' }, value: '<img src=x onerror=alert(1)>' } });
  assert(!get('nodes').innerHTML.includes('<img src=x')); assert(get('nodes').innerHTML.includes('&lt;img'));
});
check('Connection editor can edit an existing fiber link from either endpoint', () => {
  const p = app.getProject(), f = p.links.find(l => l.cable === 'sm');
  app.openConnect(f.b.device, f.b.port, f.id);
  assert(get('connectContent').innerHTML.includes('แก้ไขการเชื่อมต่อ')); assert.equal(get('opticA').value, 'lx');
  assert.equal(get('targetDevice').value, f.a.device); assert.equal(get('targetPort').value, f.a.port); get('connectDialog').close();
});
check('Application tool handlers use the same mutations and reject invalid requests', () => {
  assert.equal(tools.size, 3); assert.equal(tools.get('get_network_project').annotations.readOnlyHint, true);
  const before = app.getProject().devices.length;
  const added = tools.get('add_network_devices').execute({ devices: [{ modelId: huawei, hostname: 'API-01' }, { modelId: ale, hostname: 'API-02' }] });
  assert.equal(app.getProject().devices.length, before + 2); assert(get('nodes').innerHTML.includes('API-01'));
  const connect = tools.get('connect_network_ports');
  const linked = connect.execute({ a: { device: added.added[0].id, port: 'ge1' }, b: { device: added.added[1].id, port: 'r1' }, cable: 'copper', speed: 1000, cid: '=FORMULA', vlans: '1850' });
  assert.equal(linked.status, 'up');
  assert.throws(() => connect.execute({ a: { device: added.added[0].id, port: 'ge1' }, b: { device: added.added[1].id, port: 'r2' }, cable: 'copper', speed: 1000 }), /Combo Port/);
  assert.equal(tools.get('get_network_project').execute().project.links.length, app.getProject().links.length);
});
check('PE, Switch, Router, Firewall, brand and search filters compose', () => {
  for (const category of ['pe','switch','router','firewall']) {
    action(get('typeFilters'), {category});
    const visible = [...get('catalogList').innerHTML.matchAll(/data-model="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(visible, plain(app.getCatalog().filter(m=>!m.hidden&&(category==='pe'?m.topologyOnly:m.category===category)).map(m=>m.id)));
    if(category==='pe'){assert.equal(visible.length,5);assert(visible.includes('huawei-ne40e-x8a'));}
  }
  action(get('filters'), {brand:'Fortinet'}); assert(get('catalogList').innerHTML.includes('fortinet-fortigate-100f'));
  get('search').value='100F'; get('search').oninput(); assert(get('catalogList').innerHTML.includes('100F'));
  action(get('typeFilters'), {category:'switch'}); assert(get('catalogList').innerHTML.includes('ไม่พบ'));
  action(get('typeFilters'), {category:'All'}); action(get('filters'), {brand:'All'}); get('search').value=''; get('search').oninput();
});
check('Main labels stay above and Backup labels below their cables without a background box',()=>{
  newProject();const a=app.addDevice(huawei,100,100).id,b=app.addDevice(ale,700,100).id;
  app.saveLink(link(a,'ge1',b,'r1',{role:'main',cid:'Main branch',vlans:'1850'}));
  const G=context.NOAH_GEOMETRY,models=new Map(app.getCatalog().map(m=>[m.id,m]));
  let p=app.getProject(),g=G.linkLayout(p.links[0],p,models),bounds=G.bounds(p,models);
  assert(g.labelY+g.height<g.y);assert.equal(g.labelX,g.x);assert(bounds.y<=g.labelY);
  assert(!get('links').innerHTML.includes('<rect'));assert(get('links').innerHTML.includes('GE1/0/1 ↔ 1/1'));
  assert.equal((get('links').innerHTML.match(/<text /g)||[]).length,3);
  app.transaction(p=>{p.devices[1].x=100;p.devices[1].y=600;});p=app.getProject();g=G.linkLayout(p.links[0],p,models);
  assert(g.labelX+g.width/2<g.x,'Vertical Main text stays on the left');
  app.saveLink({...p.links[0],role:'backup'});p=app.getProject();g=G.linkLayout(p.links[0],p,models);
  assert(g.labelX-g.width/2>g.x,'Vertical Backup text stays on the right');
  bounds=G.bounds(p,models);assert(bounds.y+bounds.height>=g.labelY+g.height);
  app.saveLink(link(b,'r2',a,'ge2',{role:'main',cid:'Parallel Main'}));
  for(const shape of ['curved','straight','orthogonal']){
    app.transaction(p=>{p.devices[1].x=700;p.devices[1].y=250;p.links.forEach(l=>l.shape=shape);});p=app.getProject();
    const backup=G.linkLayout(p.links[0],p,models),main=G.linkLayout(p.links[1],p,models);
    assert(backup.labelY>backup.y,shape+' Backup text belongs below');assert(main.labelY+main.height<main.y,shape+' Main text belongs above');
  }
  app.saveLink({...p.links[0],role:'main'});p=app.getProject();g=G.linkLayout(p.links[0],p,models);assert(g.labelY+g.height<g.y);
  app.deleteLink(p.links[1].id);p=app.getProject();
  app.saveLink({...p.links[0],showLabel:false});assert(!get('links').innerHTML.includes('class="link-label"'));
});
check('UTP and Fiber tools pick endpoints and submit compatible connections', () => {
  newProject(); const fw=device('fortinet-fortigate-100f'),sw=device(huawei);
  app.setTool('utp'); app.openCablePicker(fw);
  assert(get('connectContent').innerHTML.includes('data-cable-port="wan1"')); assert(!get('connectContent').innerHTML.includes('data-cable-port="x1"'));
  app.selectCablePort(fw,'wan1'); assert(!get('connectDialog').open); assert(get('toolHint').textContent.includes('ปลายทาง'));
  app.openCablePicker(sw); app.selectCablePort(sw,'ge1');
  assert.equal(get('targetDevice').value,sw); assert.equal(get('targetPort').value,'ge1'); assert.equal(get('cableType').value,'copper');
  get('linkCID').value='=FORMULA'; get('linkVLAN').value='1850'; get('connectContent').onsubmit({preventDefault(){}});
  assert.equal(app.getProject().links.length,1); assert(!get('connectDialog').open); assert(get('links').innerHTML.includes('wan1 ↔ GE1/0/1'));
  app.setTool('fiber'); app.openCablePicker(fw); assert(!get('connectContent').innerHTML.includes('data-cable-port="wan1"'));
  app.selectCablePort(fw,'x1'); app.openCablePicker(sw); app.selectCablePort(sw,'x1');
  assert.equal(get('linkSpeed').value,'10000'); assert.equal(get('opticA').value,'lr'); assert.equal(get('opticB').value,'lr');
  get('connectContent').onsubmit({preventDefault(){}});
  const p=app.getProject(); assert.equal(p.links.length,2); assert.equal(p.devices.find(d=>d.id===fw).transceivers.x1,'lr');
  app.setTool('select');
});
check('FortiGate shared copper/fiber port and fixed dual power are accurate', () => {
  const p=app.getProject(),fw=p.devices[0].id,sw=p.devices[1].id;
  assert.equal(p.devices[0].supplies.length,2);
  app.saveLink(link(fw,'port17:copper',sw,'ge2'));
  assert.throws(()=>app.saveLink(link(fw,'port17:fiber',sw,'x2',{cable:'sm'}),{[fw+':port17:fiber']:'lx',[sw+':x2']:'lx'}),/Combo Port/);
  app.setTool('fiber'); app.openCablePicker(fw);
  const blocked=get('connectContent').children.find(c=>c.dataset.cablePort==='port17:fiber'); assert(blocked.disabled);
  get('connectDialog').close(); app.setTool('select'); app.openPhysical(fw);
  assert(!get('physicalContent').innerHTML.includes('data-supply-field="present"')); get('physicalDialog').close();
});
check('Text labels create, edit, move, delete and round-trip with history', () => {
  app.openLabel(null, -120, 50); get('labelText').value='สาขา กรุงเทพฯ\nRack 01'; get('labelColor').value='#125abc'; get('labelFontSize').value='24'; get('labelBold').checked=true;
  get('labelContent').onsubmit({preventDefault(){}}); assert(!get('labelDialog').open);
  const original=plain(app.getProject().labels[0]); assert.equal(original.text,'สาขา กรุงเทพฯ\nRack 01'); assert.equal(original.fontSize,24);
  app.saveLabel({...original,text:'<script>alert(1)</script>'}); assert(!get('textLabels').innerHTML.includes('<script>')); app.undo();
  const label=get('textLabels').children.find(n=>n.dataset.label===original.id),target={closest:s=>s==='[data-label]'?label:null};
  get('canvas').dispatch('pointerdown',{target,clientX:100,clientY:100,pointerId:2}); get('canvas').dispatch('pointermove',{target,clientX:130,clientY:120}); get('canvas').dispatch('pointerup',{target,clientX:130,clientY:120});
  assert.notEqual(app.getProject().labels[0].x,original.x); app.undo(); assert.deepEqual(plain(app.getProject().labels[0]),original);
  app.deleteLabel(original.id); assert.equal(app.getProject().labels.length,0); app.undo(); assert.deepEqual(plain(app.getProject().labels[0]),original);
  const p=plain(app.getProject()); assert.deepEqual(plain(app.sanitizeProject(p)),p);
  assert.throws(()=>app.sanitizeProject({...p,labels:[{...original,x:Infinity}]}),/Text Label/);
  assert.throws(()=>app.saveLabel({...original,id:'<bad>'}),/ID/);
});
check('Single-click selects Inspector and double-click opens physical after pointer capture', () => {
  const node=get('nodes').children.find(e=>e.dataset.device),target={closest:s=>s==='[data-device]'?node:null};
  get('canvas').dispatch('pointerdown',{target,clientX:100,clientY:100,pointerId:3});
  get('canvas').dispatch('pointerup',{target:{closest:()=>null},clientX:100,clientY:100});
  assert(!get('physicalDialog').open);assert(get('inspector').innerHTML.includes('100F'));get('canvas').ondblclick({target});assert(get('physicalDialog').open);get('physicalDialog').close();
});
check('Version 1 projects migrate devices that previously had no physical profile', () => {
  const p=plain(app.getProject()); p.version=1; delete p.labels;
  const d=plain(p.devices[1]); d.id='old-router'; d.modelId='cisco-1941'; d.transceivers={}; d.supplies=[]; p.devices.push(d);
  const migrated=app.sanitizeProject(p); assert.equal(migrated.version,3); assert.equal(migrated.labels.length,0); assert.equal(migrated.devices.at(-1).supplies[0].mode,'AC');
});
get('saveBtn').onclick();
const jsonDownload = downloads.at(-1);
assert(jsonDownload.name.endsWith('.noah.json'));
const saved = JSON.parse(await jsonDownload.blob.text()); assert.deepEqual(saved, plain(app.getProject()));
assert.equal(get('exportBtn'),null);assert.equal(get('commandBtn'),null);
count++; console.log('PASS JSON download preserves project; Port Mapping and command palette removed');
await get('projectFile').onchange({ target: { files: [{ size: 1000, text: async () => JSON.stringify(saved) }], value: 'project.json' } });
assert.deepEqual(plain(app.getProject()), saved); count++; console.log('PASS File-open event restores the saved project');


check('Main and Backup roles, parallel routing and project migration remain stable',()=>{
  newProject();const a=app.addDevice(huawei,100,100).id,b=app.addDevice(ale,700,100).id;
  const main=link(a,'ge1',b,'r1',{role:'main'}),backup=link(a,'ge2',b,'r2',{role:'backup',shape:'orthogonal'});
  app.saveLink(main);app.saveLink(backup);const p=app.getProject(),models=new Map(app.getCatalog().map(m=>[m.id,m])),G=context.NOAH_GEOMETRY;
  assert(get('links').innerHTML.includes('backup-animated'));assert(G.linkLayout(p.links[1],p,models).lines.every(t=>!/^MAIN|^BACKUP/.test(t)));
  assert.equal(G.linkStyle(p.links[1],p,models).color,'#f59e0b');assert.equal(G.linkStyle(p.links[1],p,models).dash,'10 7');
  const mg=G.linkLayout(p.links[0],p,models),bg=G.linkLayout(p.links[1],p,models);assert.notDeepEqual(plain(mg.points),plain(bg.points));assert(bg.polyline);
  assert(mg.labelY+mg.height<mg.y,'Main text stays above its path');assert(bg.labelY>bg.y,'Backup text stays below its path');
  assert(mg.labelY+mg.height<bg.labelY,'Parallel Main/Backup text blocks must remain separate');
  app.openConnect(a,'ge2',backup.id);assert.equal(get('linkRole').value,'backup');get('connectDialog').close();
  assert.deepEqual(plain(app.sanitizeProject(plain(p))),plain(p));
  const old=plain(p);old.version=2;old.links.forEach(l=>{delete l.role;delete l.shape;});assert(app.sanitizeProject(old).links.every(l=>l.role==='standard'));
  assert.throws(()=>app.saveLink({...backup,role:'failover'}),/บทบาท/);assert.throws(()=>app.saveLink({...backup,mtu:0}),/MTU/);
  app.saveLink({...backup,enabled:false});assert.equal(G.linkStyle(app.getProject().links[1],app.getProject(),models).color,'#718198');
});
check('PE manual interfaces remain diagram labels while documented peer validation stays strict',()=>{
  newProject();const pe=device('huawei-ne8000-m8'),sw=device(huawei);
  assert.throws(()=>app.saveLink(link(pe,'',sw,'ge1')),/พอร์ต/);
  assert.throws(()=>app.saveLink(link(pe,'GE0/1/0',sw,'x1')),/UTP/);
  assert.throws(()=>app.saveLink(link(pe,'GE0/1/0',sw,'ge1',{speed:100000})),/ความเร็ว/);
  app.saveLink(link(pe,'GE0/1/0',sw,'ge1',{role:'main'}));
  assert.throws(()=>app.saveLink(link(pe,'GE0/1/0',sw,'ge2')),/Combo Port/);
  assert.throws(()=>app.saveLink(link(pe,'GE0/2/0',sw,'x1',{cable:'sm'})),/Transceiver/);
  app.saveLink(link(pe,'GE0/2/0',sw,'x1',{cable:'sm',role:'backup'}),{[sw+':x1']:'lx'});
  const p=plain(app.getProject());assert.deepEqual(p.devices[0].transceivers,{});assert.deepEqual(p.devices[0].supplies,[]);assert.deepEqual(plain(app.sanitizeProject(p)),p);
  app.setTool('utp');app.openCablePicker(pe);assert(get('manualPortForm'));assert.equal(get('manualPortName').tagName,'SELECT');get('manualPortName').value='GigabitEthernet0/3/0';get('connectContent').onsubmit({preventDefault(){},target:get('manualPortForm')});assert(!get('connectDialog').open);app.setTool('select');
});
check('PE vendor presets cover full declared slots, show dropdowns, preserve legacy JSON and block alias double use',()=>{
 const P=context.NOAH_PE_INTERFACES;
 for(const [model,count] of [['huawei-ne8000-f1a',56],['huawei-ne8000-m8',80],['huawei-ne8000-m14',140],['huawei-ne8000-x4',80],['huawei-ne40e-x8a',109]]){
  const profile=P.profiles[model],names=profile.groups.flatMap(g=>g.names);assert.equal(names.length,count);assert.equal(new Set(names).size,count);if(model!=='huawei-ne40e-x8a')assert(profile.sources.some(s=>s.url.includes('huawei.com')));newProject();const pe=device(model);app.setTool('fiber');app.openCablePicker(pe);assert.equal(get('manualPortName').tagName,'SELECT');assert(get('connectContent').innerHTML.includes(names.at(-1)));get('connectDialog').close();
 }
 const x8=P.profiles['huawei-ne40e-x8a'].groups.flatMap(g=>g.names);assert(x8.includes('GE6/1/23'));assert(x8.includes('50|100GE2/1/2'));assert(!x8.includes('100GE8/0/3'));
 newProject();const pe=device('huawei-ne8000-m8'),sw=device(huawei);app.saveLink(link(pe,'GE0/1/0',sw,'ge1'));assert.throws(()=>app.saveLink(link(pe,'GigabitEthernet0/1/0',sw,'ge2')),/Combo Port/);app.setTool('fiber');app.openCablePicker(pe);assert(get('connectContent').innerHTML.includes('GigabitEthernet0/1/0"  disabled'));get('connectDialog').close();
 const p=plain(app.getProject());assert.deepEqual(plain(app.sanitizeProject(p)),p);const other=device('huawei-ne8000-m14');app.openConnect(pe,'GigabitEthernet0/3/0',null,{device:other,port:'LegacyPortFromJSON'},'sm');assert.equal(get('targetPort').tagName,'SELECT');assert(get('connectContent').innerHTML.includes('LegacyPortFromJSON'));get('connectDialog').close();app.setTool('select');
});
vm.runInContext(fs.readFileSync(path.join(root,'web/editor.js'),'utf8'),context);
const editor=context.NOAH_EDITOR;
vm.runInContext(fs.readFileSync(path.join(root,'web/element-style-tools.js'),'utf8'),context);
const event=(target,extra={})=>({target,button:0,pointerId:10,clientX:100,clientY:100,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},...extra});
check('Workspace boot wires local persistence, preferences and context Inspector',()=>{
  assert(editor);assert.equal(document.documentElement.dataset.theme,'light');app.transaction(p=>p.name='Workspace test');assert(editor.saveLocal());assert(localStorage.getItem('noah-workspace-v3'));
  get('themeBtn').onclick();assert.equal(document.documentElement.dataset.theme,'dark');assert.equal(JSON.parse(localStorage.getItem('noah-preferences-v3')).theme,'dark');
  get('animationBtn').onclick();assert(document.body.classList.contains('motion-paused'));get('animationBtn').onclick();
  app.select({device:app.getProject().devices[0].id});assert(get('inspector').innerHTML.includes('Management IP'));
});
check('Hand canvas drags pan without moving objects, changing selection or adding undo history',()=>{
  newProject();app.setTool('hand');app.setView({zoom:.8,pan:{x:20,y:30}});
  const a=app.addDevice(huawei,100,100).id,b=app.addDevice(ale,700,300).id;editor.setSelection([a,b]);
  const before=plain(app.getProject()),canvas=get('canvas');
  canvas.dispatch('pointerdown',event(canvas));canvas.dispatch('pointermove',event(canvas,{clientX:240,clientY:170}));
  assert.deepEqual(plain(app.getView().pan),{x:160,y:100});assert(get('selectionRect').hidden);assert(canvas.classList.contains('is-panning'));
  canvas.dispatch('pointerup',event(canvas,{clientX:240,clientY:170}));assert(!canvas.classList.contains('is-panning'));
  assert(editor.isSelected('device',a)&&editor.isSelected('device',b));assert.deepEqual(plain(app.getProject()),before);
  app.undo();assert.equal(app.getProject().devices.length,1);app.redo();assert.deepEqual(plain(app.getProject()),before);
  editor.setSelection([a]);canvas.dispatch('pointerdown',event(canvas));canvas.dispatch('pointerup',event(canvas));assert.equal(app.getSelection().device,null);
  const view=plain(app.getView().pan);canvas.dispatch('pointerdown',event(canvas,{button:1}));canvas.dispatch('pointermove',event(canvas,{clientX:150,clientY:130}));canvas.dispatch('pointerup',event(canvas,{clientX:150,clientY:130}));assert.deepEqual(plain(app.getView().pan),{x:view.x+50,y:view.y+30});
});
check('Inspector resize handles pointer, keyboard, cancellation, responsive limits and saved preferences',()=>{
  const handle=get('inspectorResize'),workspace=get('workspace'),before=plain(app.getProject());
  handle.dispatch('pointerdown',event(handle,{clientX:900}));handle.dispatch('pointermove',event(handle,{clientX:830}));
  assert.equal(workspace.style['--inspector-width'],'330px');assert(document.body.classList.contains('is-resizing-inspector'));
  handle.dispatch('pointerup',event(handle,{clientX:830}));assert.equal(JSON.parse(localStorage.getItem('noah-preferences-v3')).inspectorWidth,330);assert(!document.body.classList.contains('is-resizing-inspector'));
  handle.dispatch('keydown',event(handle,{key:'ArrowRight'}));assert.equal(workspace.style['--inspector-width'],'310px');
  handle.dispatch('pointerdown',event(handle,{clientX:900}));handle.dispatch('pointermove',event(handle,{clientX:400}));assert.equal(+handle.getAttribute('aria-valuenow'),+handle.getAttribute('aria-valuemax'));
  handle.dispatch('pointercancel',event(handle));assert.equal(workspace.style['--inspector-width'],'310px');assert.equal(editor.preferences.inspectorWidth,310);
  context.innerWidth=340;for(const fn of windowListeners.get('resize'))fn();assert.equal(workspace.style['--inspector-width'],'308px');assert.equal(editor.preferences.inspectorWidth,310);
  context.innerWidth=1440;for(const fn of windowListeners.get('resize'))fn();assert.equal(workspace.style['--inspector-width'],'310px');
  handle.dispatch('keydown',event(handle,{key:'Home'}));assert.equal(workspace.style['--inspector-width'],'240px');
  handle.dispatch('dblclick',event(handle));assert.equal(workspace.style['--inspector-width'],'260px');assert.equal(JSON.parse(localStorage.getItem('noah-preferences-v3')).inspectorWidth,null);
  assert.deepEqual(plain(app.getProject()),before);
});
check('Multi-selection groups, moves, copies internal links and undoes atomically',()=>{
  newProject();const a=app.addDevice(huawei,100,100).id,b=app.addDevice(ale,500,300).id;
  app.saveLink(link(a,'ge1',b,'r1',{role:'backup'}));editor.setSelection([a,b]);editor.arrange('group');
  const before=plain(app.getProject());assert.equal(before.groups.length,1);assert(get('groups').innerHTML.includes('Group 1'));
  const node=get('nodes').children.find(n=>n.dataset.device===a);
  get('canvas').dispatch('pointerdown',event(node));get('canvas').dispatch('pointermove',event(node,{clientX:180,clientY:170}));get('canvas').dispatch('pointerup',event(get('canvas'),{clientX:180,clientY:170}));
  const moved=app.getProject();assert.notEqual(moved.devices[0].x,before.devices[0].x);assert.equal(moved.devices[1].x-before.devices[1].x,moved.devices[0].x-before.devices[0].x);
  app.undo();assert.deepEqual(plain(app.getProject()),before);
  editor.copy();editor.paste();const after=app.getProject();assert.equal(after.devices.length,4);assert.equal(after.links.length,2);assert.equal(after.groups.length,2);assert.equal(after.links[1].role,'backup');assert(after.links[1].a.device!==a);
  assert.deepEqual(plain(app.sanitizeProject(plain(after))),plain(after));app.undo();assert.deepEqual(plain(app.getProject()),before);
  editor.setSelection([a,b]);editor.arrange('ungroup');assert.equal(app.getProject().groups.length,0);
});
check('Alignment guides show nearby edges and centers at a constant screen tolerance without changing drag coordinates',()=>{
  const G=context.NOAH_GEOMETRY,box={x:94,y:94,width:244,height:88},target={x:100,y:100,width:244,height:88};
  assert.equal(G.alignmentGuides([box],[target],1).length,2);assert.equal(G.alignmentGuides([box],[target],2).length,0);
  assert.equal(G.alignmentGuides([box],[],1).length,0);
  const exact=G.alignmentGuides([{...box,x:100,y:100}],[target],1);assert(exact.every(g=>g.aligned));
  newProject();app.setView({zoom:1,pan:{x:0,y:0}});const a=app.addDevice(huawei,100,100).id;app.addDevice(ale,500,300);
  const node=get('nodes').children.find(n=>n.dataset.device===a),canvas=get('canvas');
  canvas.dispatch('pointerdown',event(node));canvas.dispatch('pointermove',event(node,{clientX:497,clientY:299}));
  assert.equal((get('guides').innerHTML.match(/<line/g)||[]).length,2);assert(get('guides').innerHTML.includes('alignment-guide'));
  assert.equal(app.getProject().devices[0].x,497);assert.equal(app.getProject().devices[0].y,299);
  canvas.dispatch('pointerup',event(canvas,{clientX:497,clientY:299}));assert.equal(get('guides').innerHTML,'');
  app.undo();assert.equal(app.getProject().devices[0].x,100);
  const restored=get('nodes').children.find(n=>n.dataset.device===a);canvas.dispatch('pointerdown',event(restored));canvas.dispatch('pointermove',event(restored,{clientX:500,clientY:300}));canvas.dispatch('pointercancel',event(canvas));assert.equal(get('guides').innerHTML,'');assert.equal(app.getProject().devices[0].x,100);
});
check('Library placement previews alignment and clears transient guides after drop',()=>{
  newProject();app.setView({zoom:1,pan:{x:0,y:0}});app.addDevice(huawei,500,300);
  const card=new Element('div',{'data-model':ale}),canvas=get('canvas');
  get('catalogList').dispatch('dragstart',event(card,{dataTransfer:{setData(){}}}));canvas.dispatch('dragover',event(canvas,{clientX:622,clientY:344,dataTransfer:{types:['application/noah-model']}}));
  assert(get('guides').innerHTML.includes('alignment-guide'));assert.equal(app.getProject().devices.length,1);
  canvas.dispatch('drop',event(canvas,{clientX:622,clientY:344,dataTransfer:{getData:()=>ale}}));assert.equal(get('guides').innerHTML,'');assert.equal(app.getProject().devices.length,2);assert.equal(app.getProject().devices[1].x,500);assert.equal(app.getProject().devices[1].y,300);
});
check('Shift selection and regions work while dragging stays free of Snap',()=>{
  newProject();app.setView({zoom:1,pan:{x:0,y:0}});const a=app.addDevice(huawei,100,100).id,b=app.addDevice(ale,550,350).id;
  const canvas=get('canvas');editor.clearSelection();canvas.dispatch('pointerdown',event(canvas,{clientX:60,clientY:60,shiftKey:true}));canvas.dispatch('pointermove',event(canvas,{clientX:400,clientY:230,shiftKey:true}));canvas.dispatch('pointerup',event(canvas,{clientX:400,clientY:230,shiftKey:true}));
  assert(editor.isSelected('device',a));assert(!editor.isSelected('device',b));
  assert.equal(get('snapBtn'),null);assert.equal(get('prefSnap'),null);const node=get('nodes').children.find(n=>n.dataset.device===a);canvas.dispatch('pointerdown',event(node));canvas.dispatch('pointermove',event(node,{clientX:129,clientY:129}));canvas.dispatch('pointerup',event(canvas,{clientX:129,clientY:129}));assert.equal(app.getProject().devices[0].x,129);
  app.setTool('region');canvas.dispatch('pointerdown',event(canvas,{clientX:20,clientY:20}));canvas.dispatch('pointermove',event(canvas,{clientX:400,clientY:500}));canvas.dispatch('pointerup',event(canvas,{clientX:400,clientY:500}));
  const p=plain(app.getProject());assert.equal(p.labels[0].kind,'region');assert.equal(p.labels[0].width,380);assert(get('regions').innerHTML.includes('region-label'));assert.deepEqual(plain(app.sanitizeProject(p)),p);
  assert.throws(()=>app.sanitizeProject({...p,labels:[{...p.labels[0],width:0}]}),/กรอบ/);app.undo();assert.equal(app.getProject().labels.length,0);
});
check('Manual alignment and shortcuts work; Auto Layout is removed',()=>{
  newProject();const a=app.addDevice(huawei,100,100).id,b=app.addDevice(ale,550,350).id,c=app.addDevice('huawei-ne8000-x4',940,600).id;
  editor.setSelection([a,b,c]);editor.arrange('align-left');assert(app.getProject().devices.every(d=>d.x===100));app.undo();
  assert.equal(get('autoLayoutBtn'),null);assert.equal(editor.autoLayout,undefined);
  document.dispatch('keydown',event(document.body,{key:'a',ctrlKey:true}));assert(app.getProject().devices.every(d=>editor.isSelected('device',d.id)));
  document.dispatch('keydown',event(document.body,{key:'d',ctrlKey:true}));assert.equal(app.getProject().devices.length,6);
  document.dispatch('keydown',event(document.body,{key:'Delete'}));assert.equal(app.getProject().devices.length,3);app.undo();assert.equal(app.getProject().devices.length,6);
});
check('Autosave recovers project and gracefully handles storage failure',()=>{
  assert(editor.saveLocal());const saved=JSON.parse(localStorage.getItem('noah-workspace-v3'));assert.equal(saved.active,app.getProject().id);
  const content=plain(saved.projects.find(p=>p.id===saved.active).project);app.replaceProject(app.blankProject('Transient'));editor.saveLocal();
  app.replaceProject(content);assert.deepEqual(plain(app.getProject()),content);editor.saveLocal();
  const original=localStorage.setItem;localStorage.setItem=()=>{throw new Error('quota')};app.transaction(p=>p.name='Quota test');assert.equal(editor.saveLocal(),false);assert(get('saveStatus').textContent.includes('ไม่ได้'));localStorage.setItem=original;assert(editor.saveLocal());
});
check('Repeated canvas clicks open hardware and inline annotation editing commits safely',()=>{
  newProject();app.setTool('select');const id=device(huawei),canvas=get('canvas');
  for(let i=0;i<2;i++){const node=get('nodes').children.find(n=>n.dataset.device===id);canvas.dispatch('pointerdown',event(node));canvas.dispatch('pointerup',event(canvas));}
  assert(get('physicalDialog').open);assert(!get('physicalContent').innerHTML.includes('class="port-hotspot'));get('physicalDialog').close();
  const label=app.saveLabel({x:0,y:0,text:'Original',fontSize:18,color:'#203953',bold:false});editor.beginInlineLabel(label);
  const el=get('textLabels').children.find(n=>n.dataset.label===label);assert.equal(el.contentEditable,'true');el.innerText='แก้ไขจาก Canvas';el.blur();
  assert.equal(app.getProject().labels[0].text,'แก้ไขจาก Canvas');app.undo();assert.equal(app.getProject().labels[0].text,'Original');
});
check('Enter commits project, device, physical and annotation values immediately without saving IME or Shift+Enter',()=>{
  newProject();const id=device(huawei);
  const enter=field=>document.dispatch('keydown',event(field,{key:'Enter'}));
  get('projectName').value='Enter project';enter(get('projectName'));assert.equal(app.getProject().name,'Enter project');
  for(const key of ['hostname','managementIP','role','serial','asset','notes']){
    const field=get(key);field.value='Saved '+key;enter(field);assert.equal(app.getProject().devices[0][key],'Saved '+key);
  }
  assert.equal(JSON.parse(localStorage.getItem('noah-workspace-v3')).projects[0].project.devices[0].notes,'Saved notes');
  let field=get('notes');field.value='Not yet';document.dispatch('keydown',event(field,{key:'Enter',shiftKey:true}));assert.equal(app.getProject().devices[0].notes,'Saved notes');
  document.dispatch('keydown',event(field,{key:'Enter',isComposing:true}));assert.equal(app.getProject().devices[0].notes,'Saved notes');
  // PE physical label tab is directly editable and shares the same save handler.
  const pe=device('huawei-ne8000-m8');app.openPhysical(pe);get('physicalContent').onclick({target:get('physicalContent').children.find(x=>x.dataset.deviceTab==='labels')});get('deviceHostname').value='PE Enter';enter(get('deviceHostname'));assert.equal(app.getProject().devices.find(d=>d.id===pe).hostname,'PE Enter');get('physicalDialog').close();
  const label=app.saveLabel({x:0,y:0,text:'Original',fontSize:18,color:'#203953',bold:false});editor.setSelection([],[label]);
  field=get('inspector').children.find(x=>x.dataset.inspectorLabel==='text');field.value='Inspector Enter';enter(field);assert.equal(app.getProject().labels[0].text,'Inspector Enter');
  editor.beginInlineLabel(label);const el=get('textLabels').children.find(x=>x.dataset.label===label);el.innerText='Inline Enter';const shift=event(el,{key:'Enter',shiftKey:true});el.onkeydown(shift);assert(shift.stopped);el.onkeydown(event(el,{key:'Enter',isComposing:true}));assert.equal(app.getProject().labels[0].text,'Inspector Enter');el.onkeydown(event(el,{key:'Enter'}));assert.equal(app.getProject().labels[0].text,'Inline Enter');
});
check('Enter submits editing forms through their existing validation handlers',()=>{
  newProject();
  const wire=(field,form,owner)=>{field.parent=form;form.requestSubmit=()=>owner.onsubmit(event(form));};
  app.openLabel(null,0,0);let field=get('labelText');field.value='Enter label';wire(field,get('textLabelForm'),get('labelContent'));document.dispatch('keydown',event(field,{key:'Enter'}));assert.equal(app.getProject().labels[0].text,'Enter label');assert(!get('labelDialog').open);
  const a=device(huawei),b=device(ale);app.openConnect(a,'ge1');get('targetDevice').value=b;get('connectContent').onchange({target:get('targetDevice')});get('targetPort').value='r1';get('connectContent').onchange({target:get('targetPort')});
  field=get('linkVLAN');field.value='4095';wire(field,get('connectionForm'),get('connectContent'));document.dispatch('keydown',event(field,{key:'Enter'}));assert.equal(app.getProject().links.length,0);assert(get('connectionError').textContent.includes('VLAN'));
  field.value='1850';document.dispatch('keydown',event(field,{key:'Enter'}));assert.equal(app.getProject().links[0].vlans,'1850');assert(!get('connectDialog').open);
  field=get('prefGrid');field.value='40';wire(field,get('settingsForm'),get('settingsForm'));document.dispatch('keydown',event(field,{key:'Enter'}));assert.equal(JSON.parse(localStorage.getItem('noah-preferences-v3')).grid,40);
});
check('New device names stay unsuffixed and new links default to MTU 9216',()=>{
  newProject();const a=device(huawei),b=device(huawei);const model=app.getCatalog().find(m=>m.id===huawei);
  assert(app.getProject().devices.every(d=>d.hostname===model.model));app.openConnect(a,'ge1');assert.equal(get('linkMTU').value,'9216');get('connectDialog').close();
  app.saveLink(link(a,'ge1',b,'ge1'));assert.equal(app.getProject().links[0].mtu,9216);
});
check('Parallel links have two-grid spacing, vertical side labels and persistent independent route and label positions',()=>{
  newProject();app.setView({zoom:1,pan:{x:0,y:0}});app.setTool('select');
  const a=app.addDevice(huawei,100,100).id,b=app.addDevice(ale,700,100).id;
  app.saveLink(link(a,'ge1',b,'r1',{role:'main'}));app.saveLink(link(a,'ge2',b,'r2',{role:'backup'}));
  const G=context.NOAH_GEOMETRY,models=new Map(app.getCatalog().map(m=>[m.id,m]));
  for(const shape of ['curved','straight','orthogonal']){
    app.transaction(p=>{p.linkGridSize=20;p.links.forEach(l=>l.shape=shape);});let p=app.getProject(),routes=p.links.map(l=>G.linkLayout(l,p,models));assert.equal(Math.abs(routes[0].y-routes[1].y),40,shape);
    app.transaction(p=>p.linkGridSize=40);p=app.getProject();routes=p.links.map(l=>G.linkLayout(l,p,models));assert.equal(Math.abs(routes[0].y-routes[1].y),80,shape+' 40 px grid');
  }
  app.transaction(p=>{p.linkGridSize=20;p.devices[1].x=100;p.devices[1].y=700;});let p=app.getProject(),routes=p.links.map(l=>G.linkLayout(l,p,models));assert.equal(Math.abs(routes[0].x-routes[1].x),40);assert(routes[0].labelX+routes[0].width/2<routes[0].x);assert(routes[1].labelX-routes[1].width/2>routes[1].x);
  const id=p.links[0].id,canvas=get('canvas'),target=()=>get('links').children.find(n=>n.dataset.link===id);const before=plain(p);
  canvas.dispatch('pointerdown',event(target()));canvas.dispatch('pointermove',event(canvas,{clientX:180,clientY:160}));canvas.dispatch('pointerup',event(canvas,{clientX:180,clientY:160}));p=app.getProject();assert.deepEqual(plain(p.links[0].routeOffset),{x:80,y:60});assert.deepEqual(plain(p.links[1]),before.links[1]);assert(get('links').innerHTML.includes('data-link-bend'));
  const labelNode=get('links').children.find(n=>n.dataset.linkLabel===id);labelNode.parent=target();canvas.dispatch('pointerdown',event(labelNode));canvas.dispatch('pointermove',event(canvas,{clientX:140,clientY:180}));canvas.dispatch('pointerup',event(canvas,{clientX:140,clientY:180}));p=app.getProject();assert.deepEqual(plain(p.links[0].labelOffset),{x:40,y:80});assert.deepEqual(plain(p.links[0].routeOffset),{x:80,y:60});
  assert.deepEqual(plain(app.sanitizeProject(plain(p))),plain(p));app.undo();assert(!app.getProject().links[0].labelOffset);app.redo();assert.deepEqual(plain(app.getProject()),plain(p));
  canvas.dispatch('pointerdown',event(target()));canvas.dispatch('pointermove',event(canvas,{clientX:300,clientY:300}));canvas.dispatch('pointercancel',event(canvas));assert.deepEqual(plain(app.getProject()),plain(p));
  app.select({link:id});action(get('inspector'),{action:'add-link-bend'});assert.equal(app.getProject().links[0].waypoints.length,1);action(get('inspector'),{action:'reset-link-layout'});assert(!app.getProject().links[0].routeOffset&&!app.getProject().links[0].labelOffset&&!app.getProject().links[0].waypoints);
  assert.throws(()=>app.sanitizeProject({...plain(app.getProject()),links:[{...plain(app.getProject().links[0]),waypoints:[[Infinity,2]]}]}),/จุดหักมุม/);
});
check('Device Library resize supports pointer, keyboard, cancellation, reset and persisted preferences',()=>{
  const h=get('libraryResize'),w=get('workspace'),before=plain(app.getProject());
  h.dispatch('pointerdown',event(h));h.dispatch('pointermove',event(h,{clientX:190}));assert.equal(w.style['--library-width'],'330px');h.dispatch('pointerup',event(h,{clientX:190}));assert.equal(JSON.parse(localStorage.getItem('noah-preferences-v3')).libraryWidth,330);
  h.dispatch('keydown',event(h,{key:'ArrowLeft'}));assert.equal(w.style['--library-width'],'310px');h.dispatch('pointerdown',event(h));h.dispatch('pointermove',event(h,{clientX:20}));h.dispatch('pointercancel',event(h));assert.equal(w.style['--library-width'],'310px');h.dispatch('dblclick',event(h));assert.equal(w.style['--library-width'],'240px');assert.deepEqual(plain(app.getProject()),before);
});
check('ACM import repairs raw newlines, deduplicates nodes, preserves interfaces and redundancy without source secrets',()=>{
  const I=context.NOAH_IMPORT,text=fs.readFileSync(path.join(root,'scripts/fixtures/acm-hops.txt'),'utf8'),parsed=I.parse(text),r=I.convert(parsed.data,app.getCatalog());
  assert(parsed.repaired);assert.equal(r.project.devices.length,7);assert.equal(r.project.links.length,7);assert.equal(r.project.links.filter(l=>l.role==='backup').length,2);assert.equal(r.project.links.filter(l=>l.label==='Interconnect').length,2);assert(!r.warnings.some(t=>t.includes('S6730-H24')));
  const p=app.sanitizeProject(r.project);assert.equal(p.devices.filter(d=>d.modelId==='generic-network-device').length,0);assert(p.links.some(l=>l.a.port==='x24'&&l.b.port==='XGigabitEthernet1/0/24'));assert(p.links.some(l=>l.mtu===9600));assert(!JSON.stringify(p).includes('do-not-persist'));
  newProject();app.replaceProject(p);assert(get('nodes').innerHTML.includes('huawei-s6730-h24x6c'));assert(!get('nodes').innerHTML.includes('undefined'));assert.deepEqual(plain(app.sanitizeProject(plain(app.getProject()))),plain(app.getProject()));
  const cpe=p.devices.find(d=>d.sourceModel.toLowerCase()==='asr1001-x'),l=p.links.find(l=>l.b.device===cpe.id);app.openConnect(l.a.device,l.a.port,l.id);assert.equal(get('targetPort').tagName,'INPUT');assert.equal(get('targetPort').value,'Ten0/0');get('connectDialog').close();
  assert.throws(()=>I.parse('{bad'),/JSON/);assert.throws(()=>I.convert({hops:{HOP1:{}}},app.getCatalog()),/start/);
  const noInterface=plain(parsed.data);delete noInterface.hops.HOP3.end['Interface Name'];assert(I.convert(noInterface,app.getCatalog()).warnings.some(t=>t.includes('Interface ครบ')));
});
check('Known JSON devices retain physical controls, canonical ports, optical modules and strict manual cable editing',()=>{
 const row=(name,model,brand,port)=>({'Node Name':name,Model:model,Brand:brand,'Interface Name':port,'Cable Type':'Fiber Singlemode'});
 const source={hops:{HOP1:{start:row('AR','AR5710-S8T2X','Huawei','10GE0/0/0'),end:row('ASR','ASR1001-X','Cisco','TenGigabitEthernet0/0/0')}}};
 const result=context.NOAH_IMPORT.convert(source,app.getCatalog()),p=app.sanitizeProject(result.project);
 assert(p.devices.every(d=>!d.diagramOnly));assert(p.links.every(l=>!l.designOnly));assert.equal(p.links[0].a.port,'wan0-s');assert.equal(p.links[0].b.port,'te0');assert(p.devices.every(d=>Object.values(d.transceivers).includes('lr')));
 newProject();app.replaceProject(p);const a=p.devices[0];app.openPhysical(a.id);assert(get('physicalContent').innerHTML.includes('id="devicePower"'));assert(get('physicalContent').innerHTML.includes('data-supply="0"'));assert(get('physicalContent').innerHTML.includes('data-port="wan0-s"'));get('physicalDialog').close();
 app.openConnect(p.links[0].a.device,p.links[0].a.port,p.links[0].id);assert.equal(get('targetPort').tagName,'SELECT');get('connectDialog').close();app.saveLink(plain(p.links[0]));assert.deepEqual(plain(app.sanitizeProject(plain(app.getProject()))),plain(app.getProject()));
 const legacy=plain(p);legacy.devices.forEach(d=>d.diagramOnly=true);legacy.links[0].a.port='10GE0/0/0';legacy.links[0].b.port='TenGigabitEthernet0/0/0';const migrated=app.sanitizeProject(legacy);assert(migrated.devices.every(d=>!d.diagramOnly));assert.equal(migrated.links[0].a.port,'wan0-s');
 source.hops.HOP1.end['Interface Name']='Ten0/9';const unresolved=app.sanitizeProject(context.NOAH_IMPORT.convert(source,app.getCatalog()).project);assert.equal(unresolved.links[0].b.port,'Ten0/9');assert(unresolved.links[0].designOnly);assert(unresolved.devices[1].importedPorts.includes('Ten0/9'));assert(!unresolved.devices[1].diagramOnly);
});
check('Physical selection never substitutes the opposite face; CLI audit preserves IDs and vendor corrections',()=>{
 newProject();const id=device('cisco-c1121-8pltep');app.openPhysical(id);action(get('physicalContent'),{face:'front'});assert(get('physicalContent').innerHTML.includes('ยังไม่มีภาพด้านนี้ที่ยืนยันได้'));assert(!get('physicalContent').innerHTML.includes('src="assets/cisco-c1121-8pltep-color.jpg"'));action(get('physicalContent'),{face:'rear'});assert(get('physicalContent').innerHTML.includes('cisco-c1121-8pltep-illustration-v03.png'));get('physicalDialog').close();
 const ms=new Map(app.getCatalog().map(m=>[m.id,m]));assert.equal(ms.get('cisco-isr-4331').ports.find(p=>p.id==='gigabitethernet0-0-2').connector,'SFP');assert.equal(ms.get('cisco-asr-1001-x').ports.find(p=>p.id==='mgmt').name,'GigabitEthernet0');assert.equal(ms.get('hitachi-apresia13200-52gt-psr2').ports.find(p=>p.kind==='network').name,'1/1');assert.equal(ms.get('huawei-s6730-h24x6c').ports.find(p=>p.id==='console').face,'rear');assert(ms.get('telco-t-marc-280').ports.filter(p=>p.kind==='network').every(p=>p.cliVerified===false));
});
vm.runInContext(fs.readFileSync(path.join(root,'web/project-tools.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'web/templates.js'),'utf8'),context);
async function checkAsync(name,fn){await fn();count++;console.log('PASS '+name);}
await checkAsync('Clipboard import opens directly, fills only the input and preserves existing text when access fails',async()=>{
 const before=plain(app.getProject()),text=JSON.stringify(before);context.navigator={clipboard:{readText:async()=>text}};
 get('quickPasteJSONBtn').onclick();assert(get('importDialog').open);await get('pasteClipboardBtn').onclick();assert.equal(get('importJSON').value,text);assert.deepEqual(plain(app.getProject()),before);assert(!get('pasteClipboardBtn').disabled);
 context.navigator.clipboard.readText=async()=>{throw new Error('NotAllowedError');};await get('pasteClipboardBtn').onclick();assert.equal(get('importJSON').value,text);assert(get('importError').textContent.includes('Ctrl+V'));assert.deepEqual(plain(app.getProject()),before);
 context.navigator.clipboard.readText=async()=>'';await get('pasteClipboardBtn').onclick();assert.equal(get('importJSON').value,text);assert(get('importError').textContent.includes('ไม่มีข้อความ'));
 delete context.navigator;get('importDialog').close();
});
await checkAsync('Paste and uploaded JSON flows validate before replacing the canvas and preserve work on malformed input',async()=>{
  const text=fs.readFileSync(path.join(root,'scripts/fixtures/acm-hops.txt'),'utf8'),before=plain(app.getProject());
  const uploaded=await context.NOAH_IMPORT_UI.fromText(text);assert.equal(uploaded,null);assert(get('importDialog').open);assert.deepEqual(plain(app.getProject()),before);assert(get('importSummary').innerHTML.includes('7 อุปกรณ์'));
  get('importForm').onsubmit(event(get('importForm')));assert.equal(app.getProject().devices.length,7);assert.equal(app.getProject().links.length,7);assert(!get('importDialog').open);
  const imported=plain(app.getProject());get('importJSON').value='{bad';get('importForm').onsubmit(event(get('importForm')));assert(get('importError').textContent.includes('JSON'));assert.deepEqual(plain(app.getProject()),imported);
  const native=await context.NOAH_IMPORT_UI.fromText(JSON.stringify(imported));assert.deepEqual(plain(native),imported);app.undo();assert.deepEqual(plain(app.getProject()),before);
});
await checkAsync('Shared Template UI saves the current project, loads an independent copy and retains canvas on server errors',async()=>{
  const rows=new Map();let fail=false;
  context.fetch=async(url,options)=>{
    if(fail)return {ok:false,json:async()=>({error:'Temporarily unavailable'})};
    if(options.method==='POST'){const body=JSON.parse(options.body);rows.set(body.id,body);return {ok:true,json:async()=>({id:body.id})};}
    const id=url.slice('/api/templates/'.length),body=url==='/api/templates'?{templates:[...rows.values()].map(t=>({id:t.id,name:t.name,createdAt:new Date().toISOString(),deviceCount:t.project.devices.length,linkCount:t.project.links.length}))}:rows.get(id);
    return {ok:true,json:async()=>body};
  };
  get('templateName').value='Reusable demo';await get('saveTemplateForm').onsubmit(event(get('saveTemplateForm')));assert.equal(rows.size,1);assert(get('templateList').innerHTML.includes('Reusable demo'));
  const [id,t]=[...rows.entries()][0],original=plain(app.getProject());await get('templateList').onclick({target:{closest:()=>({dataset:{templateAction:'use',templateId:id},disabled:false})}});assert.notEqual(app.getProject().id,t.project.id);assert.deepEqual(plain(app.getProject().devices),plain(t.project.devices));app.transaction(p=>p.devices[0].hostname='Changed copy');assert.notEqual(rows.get(id).project.devices[0].hostname,'Changed copy');
  const before=plain(app.getProject());get('templateName').value='Retry demo';fail=true;await get('saveTemplateForm').onsubmit(event(get('saveTemplateForm')));assert(get('templateStatus').textContent.includes('unavailable'));assert.deepEqual(plain(app.getProject()),before);assert(!get('saveTemplateBtn').disabled);
});
check('New vendor switch profiles enforce Combo, QSFP speeds and APRESIA shared banks',()=>{
  newProject();const a=device('huawei-s5720-12tp-li-ac'),b=device('huawei-s5335-s32st4x');
  app.saveLink(link(a,'ge9c',b,'ge17c'));assert.throws(()=>app.saveLink(link(a,'ge9f',b,'ge17',{cable:'sm'}),{[a+':ge9f']:'lx',[b+':ge17']:'lx'}),/Combo/);
  newProject();const c=device('huawei-s5732-h24s6q'),d=device('huawei-s6730-h24x6c');
  app.saveLink(link(c,'q1',d,'q1',{speed:40000,cable:'sm'}),{[c+':q1']:'lr4',[d+':q1']:'lr4'});assert.equal(app.getProject().links[0].speed,40000);
  assert.throws(()=>app.saveLink(link(c,'q2',d,'q2',{speed:100000,cable:'sm'}),{[c+':q2']:'lr100',[d+':q2']:'lr100'}),/ความเร็ว/);
  const e=device('huawei-s6730-h24x6c');app.saveLink(link(d,'q2',e,'q1',{speed:100000,cable:'mm'}),{[d+':q2']:'sr100',[e+':q1']:'sr100'});
  newProject();const f=device('hitachi-apresia15000-32xl-psr2'),g=device('huawei-s6720-30c-ei-24s-ac');
  assert.throws(()=>app.saveLink(link(f,'q25',g,'q1',{speed:40000,cable:'sm'}),{[f+':q25']:'lr4',[g+':q1']:'lr4'}),/Transceiver/);
  app.saveLink(link(f,'q25',g,'q1',{speed:40000,cable:'mm'}),{[f+':q25']:'sr4',[g+':q1']:'sr4'});
  for(const i of [25,26,27,28])assert.throws(()=>app.saveLink(link(f,'p'+i,g,'x1',{speed:10000,cable:'sm'}),{[f+':p'+i]:'lr',[g+':x1']:'lr'}),/Combo/);
  app.saveLink(link(f,'p29',g,'x1',{speed:10000,cable:'sm'}),{[f+':p29']:'lr',[g+':x1']:'lr'});assert.throws(()=>app.saveLink(link(f,'q29',g,'q2',{speed:40000,cable:'mm'}),{[f+':q29']:'sr4',[g+':q2']:'sr4'}),/Combo/);
  assert.deepEqual(plain(app.sanitizeProject(plain(app.getProject()))),plain(app.getProject()));
});
check('Known PE and requested S6730-H24 shorthand resolve to their Library profiles',()=>{
  const I=context.NOAH_IMPORT,r=I.convert(I.parse(fs.readFileSync(path.join(root,'scripts/fixtures/acm-hops.txt'),'utf8')).data,app.getCatalog());
  assert(r.project.devices.filter(d=>d.sourceModel==='NE40E-X8A(V8)').every(d=>d.modelId==='huawei-ne40e-x8a'));
  assert(r.project.devices.filter(d=>d.sourceModel==='S6730-H24').every(d=>d.modelId==='huawei-s6730-h24x6c'));
});
check('Project opens in the top layer; Elements place, drag, edit, copy and round-trip',()=>{
  newProject();get('projectMenuBtn').onclick();assert(get('projectMenuDialog').open);get('projectMenuDialog').close();
  get('elementsBtn').onclick();assert(get('elementsDialog').open);assert.equal((get('elementsGrid').innerHTML.match(/data-element=/g)||[]).length,19);
  const grid=get('elementsGrid'),card=grid.querySelector('[data-element="cloud"]'),canvas=get('canvas');app.setView({zoom:2,pan:{x:20,y:30}});
  grid.onclick(event(card));assert.equal(app.getProject().labels.length,0);assert(get('elementsDialog').open);
  grid.dispatch('pointerdown',event(card,{clientX:20,clientY:20,pointerId:81}));document.dispatch('pointermove',event(card,{clientX:460,clientY:310,pointerId:81}));assert(!get('elementsDialog').open);assert(document.body.classList.contains('is-element-dragging'));
  document.dispatch('pointerup',event(canvas,{clientX:460,clientY:310,pointerId:81}));assert.equal(app.getProject().labels[0].x,110);assert.equal(app.getProject().labels[0].y,70);assert(!document.body.classList.contains('is-element-dragging'));
  get('elementsBtn').onclick();grid.dispatch('pointerdown',event(card,{clientX:20,clientY:20,pointerId:82}));document.dispatch('pointermove',event(card,{clientX:1100,clientY:800,pointerId:82}));document.dispatch('pointerup',event(canvas,{clientX:1100,clientY:800,pointerId:82}));assert.equal(app.getProject().labels.length,1);app.setView({zoom:1,pan:{x:0,y:0}});
  const l=plain(app.getProject().labels[0]);assert.equal(l.kind,'shape');assert.equal(l.shape,'cloud');assert.equal(l.text,'Internet');assert.equal(app.getTool(),'select');assert(get('regions').innerHTML.includes('Internet'));assert(!get('textLabels').innerHTML.includes('Internet'));
  const el=get('regions').querySelector(`[data-label="${l.id}"]`);canvas.dispatch('pointerdown',event(el,{clientX:100,clientY:150}));canvas.dispatch('pointermove',event(el,{clientX:140,clientY:190}));canvas.dispatch('pointerup',event(el,{clientX:140,clientY:190}));assert.equal(app.getProject().labels[0].x,l.x+40);app.undo();assert.equal(app.getProject().labels[0].x,l.x);app.redo();
  app.openLabel(l.id);assert(get('elementShape'));get('elementShape').value='hexagon';get('elementStroke').value='#f59e0b';get('elementStrokeWidth').value='4';get('labelWidth').value='300';get('labelHeight').value='180';get('labelText').value='WAN';get('labelContent').onsubmit(event(get('textLabelForm')));assert.equal(app.getProject().labels[0].shape,'hexagon');assert.equal(app.getProject().labels[0].width,300);assert.equal(app.getProject().labels[0].strokeWidth,4);
  editor.setSelection([],[l.id]);editor.copy();editor.paste();assert.equal(app.getProject().labels.length,2);assert.deepEqual(plain(app.sanitizeProject(plain(app.getProject()))),plain(app.getProject()));
  assert.throws(()=>app.sanitizeProject({...plain(app.getProject()),labels:[{...l,shape:'script'}]}),/รูปทรง/);
  get('newBtn').onclick();assert.equal(app.getProject().labels.length,0);assert.equal(app.getProject().devices.length,0);assert.equal(app.getTool(),'select');app.undo();assert.equal(app.getProject().labels.length,2);
});
check('Element quick styling preserves outline, live opacity, one Undo step, cancellation and JSON round-trip',()=>{
 newProject();const E=context.NOAH_ELEMENTS,T=context.NOAH_ELEMENT_STYLE;E.pending='ellipse';E.pendingStyle='outline';const id=E.place(100,100);assert.equal(app.getProject().labels[0].background,'transparent');assert.equal((get('regions').innerHTML.match(/data-element-resize=/g)||[]).length,8);assert(!get('elementStyleBar').hidden);
 T.apply({stroke:'#ef4444',strokeWidth:5});assert.equal(app.getProject().labels[0].stroke,'#ef4444');const slider=get('elementQuickOpacity');slider.value='35';get('elementStyleBar').dispatch('input',event(slider));assert.equal(app.getProject().labels[0].opacity,.35);assert(get('regions').querySelector(`[data-label="${id}"]`).innerHTML.includes('opacity="0.35"'));get('elementStyleBar').dispatch('change',event(slider));app.undo();assert.equal(app.getProject().labels[0].opacity,undefined);app.redo();assert.equal(app.getProject().labels[0].opacity,.35);
 app.setView({zoom:2,pan:{x:0,y:0}});const node=get('regions').querySelector(`[data-label="${id}"]`),handle=get('regions').querySelector('[data-element-resize="e"]');handle.parent=node;const original=plain(app.getProject().labels[0]);get('canvas').dispatch('pointerdown',event(handle,{clientX:100,clientY:100}));get('canvas').dispatch('pointermove',event(handle,{clientX:140,clientY:200}));get('canvas').dispatch('pointerup',event(handle,{clientX:140,clientY:200}));assert.equal(app.getProject().labels[0].width,original.width+20);assert.equal(app.getProject().labels[0].height,original.height);app.undo();app.setView({zoom:1,pan:{x:0,y:0}});
 const before=plain(app.getProject());get('elementQuickOpacity').value='10';get('elementStyleBar').dispatch('input',event(get('elementQuickOpacity')));T.cancel();assert.deepEqual(plain(app.getProject()),before);app.openLabel(id);get('labelContent').onsubmit(event(get('textLabelForm')));get('labelDialog').close();assert.equal(app.getProject().labels[0].opacity,.35);assert.deepEqual(plain(app.sanitizeProject(plain(app.getProject()))),plain(app.getProject()));assert.throws(()=>app.sanitizeProject({...plain(app.getProject()),labels:[{...plain(app.getProject().labels[0]),opacity:2}]}),/โปร่งแสง/);E.pendingStyle='filled';
});
check('Smart Uplink raises earlier main and backup hops, retains larger uplinks and excludes lateral links',()=>{
  const I=context.NOAH_IMPORT,source=I.parse(fs.readFileSync(path.join(root,'scripts/fixtures/acm-hops.txt'),'utf8')).data;
  const imported=I.convert(source,app.getCatalog());assert(imported.project.links.filter(l=>l.label==='HOP1').every(l=>l.speed===10000));assert(imported.warnings.some(t=>t.includes('Smart Uplink')));
  const lateral=plain(source);lateral.hops.HOP1.end['Int. Redundant 1']='100GE0/0/24';lateral.hops.HOP1.end['Redundant Int. 1']='100GE1/0/24';const side=I.convert(lateral,app.getCatalog()).project;assert(side.links.some(l=>l.label==='Interconnect'&&l.speed===100000));assert(side.links.filter(l=>l.label==='HOP1').every(l=>l.speed===10000));
  const row=(name,port)=>({'Node Name':name,Brand:'Huawei',Model:'NE40E-X8A','Interface Name':port});
  const sample={hops:{HOP1:{start:row('PE','GigabitEthernet0/0/1'),end:row('Access','GigabitEthernet0/0/1'),backup:{start:row('PE-B','GigabitEthernet0/0/1'),end:row('Access-B','GigabitEthernet0/0/1')}},HOP2:{start:row('Access','40GE0/0/2'),end:row('CPE','40GE0/0/1')}}};
  const r=I.convert(sample,app.getCatalog());assert(r.project.links.every(l=>l.speed===40000));
  sample.hops.HOP1.start['Interface Name']='100GE0/0/1';sample.hops.HOP1.end['Interface Name']='100GE0/0/1';sample.hops.HOP2.start['Interface Name']='GigabitEthernet0/0/2';sample.hops.HOP2.end['Interface Name']='GigabitEthernet0/0/1';const lower=I.convert(sample,app.getCatalog()).project;assert.equal(lower.links.find(l=>l.label==='HOP1'&&l.role==='main').speed,100000);assert.equal(lower.links.find(l=>l.label==='HOP2').speed,1000);
  const native=plain(app.blankProject('Explicit speed'));assert.deepEqual(plain(I.convert(native,app.getCatalog()).project),native);
});
check('Elements resize freely at all four corners through zoom, cancellation, Undo and minimum size',()=>{
  newProject();app.setView({zoom:2,pan:{x:0,y:0}});const id=context.NOAH_ELEMENTS.place(100,150),canvas=get('canvas');
  const resizeHandle=corner=>{const h=get('regions').querySelector(`[data-element-resize="${corner}"]`);h.parent=get('regions').querySelector(`[data-label="${id}"]`);return h;};
  for(const corner of ['nw','ne','sw','se']){
    const before=plain(app.getProject()),l=before.labels[0];editor.setSelection([],[id]);const handle=resizeHandle(corner);assert(handle);
    canvas.dispatch('pointerdown',event(handle,{clientX:300,clientY:300}));canvas.dispatch('pointermove',event(handle,{clientX:354,clientY:346}));canvas.dispatch('pointerup',event(canvas,{clientX:354,clientY:346}));const changed=app.getProject().labels[0];assert.notEqual(changed.width,l.width);assert.notEqual(changed.height,l.height);assert.equal(corner.includes('w')?changed.x+changed.width:changed.x,corner.includes('w')?l.x+l.width:l.x);assert.equal(corner.includes('n')?changed.y+changed.height:changed.y,corner.includes('n')?l.y+l.height:l.y);app.undo();assert.deepEqual(plain(app.getProject()),before);
  }
  const before=plain(app.getProject()),handle=resizeHandle('se');canvas.dispatch('pointerdown',event(handle));canvas.dispatch('pointermove',event(handle,{clientX:250,clientY:250}));canvas.dispatch('pointercancel',event(canvas));assert.deepEqual(plain(app.getProject()),before);
  const h=resizeHandle('se');canvas.dispatch('pointerdown',event(h));canvas.dispatch('pointermove',event(h,{clientX:-10000,clientY:-10000}));canvas.dispatch('pointerup',event(canvas,{clientX:-10000,clientY:-10000}));assert.equal(app.getProject().labels[0].width,32);assert.equal(app.getProject().labels[0].height,32);assert.deepEqual(plain(app.sanitizeProject(app.getProject())),plain(app.getProject()));
});
// Exercise the new controls against the actual Worker API and SQLite schema.
const {DatabaseSync}=await import('node:sqlite'),{default:worker}=await import('../server/index.mjs');
const dbStudio=new DatabaseSync(':memory:');for(const file of fs.readdirSync(path.join(root,'drizzle')).filter(f=>f.endsWith('.sql')))dbStudio.exec(fs.readFileSync(path.join(root,'drizzle',file),'utf8'));
const studioDB={prepare(sql){const st=dbStudio.prepare(sql);return {bind(...args){return {async first(){return st.get(...args)||null;},async all(){return {results:st.all(...args)};},async run(){return {meta:{changes:st.run(...args).changes}};}};}};}};
context.fetch=async(url,options={})=>worker.fetch(new Request('https://noah.example'+url,{...options,headers:{...options.headers,Origin:'https://noah.example'}}),{DB:studioDB,ASSETS:{fetch:()=>new Response('asset')}});
context.location={href:'https://noah.example/',hash:''};const oldURL=context.URL;context.URL=class extends URL{};Object.assign(context.URL,oldURL);context.confirm=()=>true;
vm.runInContext(fs.readFileSync(path.join(root,'web/design-logic.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'web/studio.js'),'utf8'),context);
const studioButton=(id,dataset={})=>({id,dataset,disabled:false});
const studioClick=button=>get('studioContent').onclick({target:{closest:()=>button}});
const studioTab=key=>get('studioTabs').onclick({target:{closest:()=>({dataset:{studioTab:key}})}});
const templateAction=(action,id)=>get('templateList').onclick({target:{closest:()=>({dataset:{templateAction:action,templateId:id},disabled:false})}});
await checkAsync('Template UI edits the original, persists tags/favorites, copies independently and deletes the exact revision',async()=>{
 newProject();device('huawei-s5735-l8t4x-qa-v2');get('templateName').value='Editable UI';get('templateTags').value='DI, Dual PE';get('templateFavorite').checked=true;await get('saveTemplateForm').onsubmit(event(get('saveTemplateForm')));
 const row=dbStudio.prepare('SELECT id,revision FROM topology_templates').get();assert(row);assert(get('templateList').innerHTML.includes('Editable UI'));
 await templateAction('edit',row.id);assert(!get('templateEditBanner').hidden);app.transaction(p=>p.devices[0].hostname='Updated in canvas');get('templateName').value='Edited UI';await get('saveTemplateForm').onsubmit(event(get('saveTemplateForm')));
 const saved=await (await context.fetch('/api/templates/'+row.id)).json();assert.equal(saved.name,'Edited UI');assert.equal(saved.project.devices[0].hostname,'Updated in canvas');assert.equal(saved.revision,2);assert.equal(saved.favorite,true);assert.deepEqual(saved.tags,['DI','Dual PE']);
 await templateAction('favorite',row.id);assert.equal((await (await context.fetch('/api/templates/'+row.id)).json()).favorite,false);
 await templateAction('use',row.id);assert(get('templateEditBanner').hidden);app.transaction(p=>p.devices[0].hostname='Independent copy');assert.equal((await (await context.fetch('/api/templates/'+row.id)).json()).project.devices[0].hostname,'Updated in canvas');
 await templateAction('delete',row.id);assert.equal(dbStudio.prepare('SELECT COUNT(*) AS n FROM topology_templates').get().n,0);assert.equal(app.getProject().devices[0].hostname,'Independent copy');
});
check('CID filtering, simulation reset and presentation Hop stepping highlight actual canvas objects',()=>{
 const source=fs.readFileSync(path.join(root,'scripts/fixtures/acm-hops.txt'),'utf8');const p=context.NOAH_IMPORT.convert(context.NOAH_IMPORT.parse(source).data,app.getCatalog()).project;app.replaceProject(p);
 get('serviceSelect').value=p.links[0].cid;get('serviceSelect').onchange({target:get('serviceSelect')});get('routeNext').onclick();assert(get('links').querySelectorAll('[data-link]').some(el=>el.classes.has('service-muted')));get('routeReset').onclick();assert(!get('links').querySelectorAll('[data-link]').some(el=>el.classes.has('service-muted')));
 studioTab('simulate');const target={dataset:{downDevice:p.devices[0].id},checked:true};get('studioContent').onchange({target});assert(get('nodes').querySelector('[data-device="'+p.devices[0].id+'"]').classes.has('sim-down'));studioClick(studioButton('simReset'));assert(!get('nodes').querySelector('[data-device="'+p.devices[0].id+'"]').classes.has('sim-down'));
});
await checkAsync('Compare file reports changes while malformed data preserves the current canvas',async()=>{
 const p=plain(app.getProject()),old=structuredClone(p);old.devices[0].hostname='Previous name';studioTab('compare');await get('studioContent').onchange({target:{id:'compareFile',dataset:{},files:[{size:100,text:async()=>JSON.stringify(old)}]}});assert(get('compareResults').innerHTML.includes('hostname'));assert.deepEqual(plain(app.getProject()),p);
 await get('studioContent').onchange({target:{id:'compareFile',dataset:{},files:[{size:100,text:async()=>'{bad'}]}});assert.deepEqual(plain(app.getProject()),p);
});
await checkAsync('Compare accepts pasted JSON and Clipboard, preserves the canvas and reports malformed JSON inline',async()=>{
 const before=plain(app.getProject()),older=structuredClone(before);older.devices[0].hostname='Clipboard previous';studioTab('compare');context.navigator={clipboard:{readText:async()=>JSON.stringify(older)}};
 await studioClick(studioButton('comparePasteClipboard'));assert.equal(get('compareJSON').value,JSON.stringify(older));await get('studioContent').onsubmit(event(get('compareJSONForm')));assert(get('compareResults').innerHTML.includes('hostname'));assert.deepEqual(plain(app.getProject()),before);
 const validResults=get('compareResults').innerHTML;get('compareJSON').value='{bad';await get('studioContent').onsubmit(event(get('compareJSONForm')));assert(get('compareError').textContent.includes('JSON'));assert.equal(get('compareResults').innerHTML,validResults);assert.deepEqual(plain(app.getProject()),before);
 delete context.navigator;await studioClick(studioButton('comparePasteClipboard'));assert(get('compareError').textContent.includes('Ctrl+V'));assert.equal(get('compareJSON').value,'{bad');
});
await checkAsync('Site groups save members, rename, collapse, move as a group and restore through Undo',async()=>{
 studioTab('sites');const input=get('studioContent').querySelectorAll('[data-site-device]')[0];input.value='Telehouse / Rack A';const form=get('sitesForm');form.children=[input];await get('studioContent').onsubmit(event(form));const p=plain(app.getProject()),g=p.groups.find(g=>g.name==='Telehouse / Rack A');assert(g);assert.equal(p.devices[0].site,g.name);
 await studioClick(studioButton('',{collapseGroup:g.id}));assert(get('nodes').querySelector('[data-device="'+g.deviceIds[0]+'"]').hidden);assert.equal(app.sanitizeProject(app.getProject()).groups.find(x=>x.id===g.id).collapsed,true);app.undo();assert(!get('nodes').querySelector('[data-device="'+g.deviceIds[0]+'"]').hidden);
 const rename={dataset:{groupName:g.id},value:'Site A'};await get('studioContent').onchange({target:rename});assert.equal(app.getProject().groups.find(x=>x.id===g.id).name,'Site A');
});
await checkAsync('Reports export UTF-8 device and link CSV without executing spreadsheet formulas',async()=>{
 app.transaction(p=>p.devices[0].hostname='=TEST');studioTab('report');await studioClick(studioButton('reportDevices'));await studioClick(studioButton('reportLinks'));const files=downloads.slice(-2);assert.equal(files[0].name,'devices.csv');assert.equal(files[1].name,'links.csv');const content=await files[0].blob.text();assert(content.includes("'=TEST"));assert(content.includes('Management IP'));
});
await checkAsync('Share Review creates a durable snapshot and Comments pin to selected devices with shared status',async()=>{
 studioTab('review');await studioClick(studioButton('shareReview'));const row=dbStudio.prepare('SELECT id FROM design_reviews').get();assert(row);assert(get('reviewLink').innerHTML.includes('#review='+row.id));const d=app.getProject().devices[0];app.select({device:d.id});studioTab('review');get('reviewAuthor').value='QA reviewer';get('reviewText').value='ตรวจสอบ Main และ Backup';await get('studioContent').onsubmit(event(get('commentForm')));
 const r=await (await context.fetch('/api/reviews/'+row.id)).json();assert.equal(r.comments[0].target,'device:'+d.id);assert.equal(context.NOAH_STUDIO.reviewCount('device',d.id),1);assert(get('nodes').innerHTML.includes('comment-pin'));
 await get('studioContent').onchange({target:{dataset:{commentStatus:r.comments[0].id},value:'approved'}});assert.equal((await (await context.fetch('/api/reviews/'+row.id)).json()).comments[0].status,'approved');
 app.transaction(p=>p.devices[0].hostname='Modified after sharing');assert.notEqual((await (await context.fetch('/api/reviews/'+row.id)).json()).project.devices[0].hostname,'Modified after sharing');
});
dbStudio.close();
vm.runInContext(fs.readFileSync(path.join(root,'web/bayface.js'),'utf8'),context);
check('Bayface tab starts empty and preserves Topology while adding separate racks',()=>{
 const before=plain(app.getProject());get('bayfaceTab').onclick();assert(!get('bayfaceWorkspace').hidden);assert(get('canvas').hidden);assert(get('serviceToolbar').hidden);assert(get('bayfaceCanvas').innerHTML.includes('เริ่มออกแบบ'));get('addRackBtn').onclick();const p=plain(app.getProject());assert.equal(p.bayface.racks.length,1);assert.equal(p.bayface.racks[0].units,42);assert.deepEqual(p.devices,before.devices);assert.deepEqual(p.links,before.links);assert(get('bayfaceCanvas').innerHTML.includes('data-u="42"'));get('topologyTab').onclick();assert(!get('canvas').hidden);assert(get('bayfaceWorkspace').hidden);
});
check('Bayface equipment uses existing device art and rack-unit sizes with atomic overlap rejection',()=>{
 get('bayfaceTab').onclick();const r=app.getProject().bayface.racks[0];context.NOAH_BAYFACE.addDevice('cisco-1941',r.id,1);const p=plain(app.getProject()),i=p.bayface.items[0];assert.equal(i.height,2);assert(get('bayfaceCanvas').innerHTML.includes('cisco-1941-illustration'));assert.throws(()=>context.NOAH_BAYFACE.addDevice('huawei-s5735-l8t4x-qa-v2',r.id,2),/ซ้อน/);assert.deepEqual(plain(app.getProject()),p);assert.throws(()=>context.NOAH_BAYFACE.addDevice('cisco-1941',r.id,42),/U/);assert.deepEqual(plain(app.getProject()),p);
});
check('Bayface annotations double-click, Enter persists, Escape cancels, IME Enter stays open and hover retains full text',()=>{
 const rack=app.getProject().bayface.racks[0],canvas=get('bayfaceCanvas');
 const begin=(selector)=>{const target=canvas.querySelector(selector);assert(target);canvas.ondblclick({target,preventDefault(){},stopImmediatePropagation(){}});return target.children[0];};
 let input=begin('[data-inline-field="name"]');input.value='Rack inline renamed';input.onkeydown({key:'Enter',stopPropagation(){},preventDefault(){}});assert.equal(app.getProject().bayface.racks[0].name,'Rack inline renamed');assert(get('bayfaceCanvas').innerHTML.includes('title="Rack inline renamed"'));assert(JSON.stringify([...localValues.values()]).includes('Rack inline renamed'),'saved locally');
 input=begin('[data-inline-field="phase"]');input.value='Do not save';input.onkeydown({key:'Escape',stopPropagation(){},preventDefault(){}});assert.notEqual(app.getProject().bayface.racks[0].phase,'Do not save');
 input=begin('[data-inline-field="label"]');const before=app.getProject().bayface.items[0].label;input.value='อุปกรณ์ชื่อยาวสำหรับแสดง Tooltip';input.onkeydown({key:'Enter',isComposing:true,stopPropagation(){}});assert.equal(app.getProject().bayface.items[0].label,before);input.onkeydown({key:'Enter',stopPropagation(){},preventDefault(){}});assert.equal(app.getProject().bayface.items[0].label,'อุปกรณ์ชื่อยาวสำหรับแสดง Tooltip');assert(get('bayfaceCanvas').innerHTML.includes('title="อุปกรณ์ชื่อยาวสำหรับแสดง Tooltip"'));app.undo();app.undo();
});
check('Rack forms reject shrink below occupied U and retain Bayface through Undo and JSON',()=>{
 const before=plain(app.getProject());get('rackName').value='RACK Phase 1';get('rackPhase').value='Telehouse';get('rackUnits').value='1';get('bayfaceInspector').onsubmit(event(get('rackForm')));assert.deepEqual(plain(app.getProject()),before);assert(get('bayfaceError').textContent.includes('U'));
 get('rackUnits').value='47';get('bayfaceInspector').onsubmit(event(get('rackForm')));assert.equal(app.getProject().bayface.racks[0].units,47);assert.equal(app.getProject().bayface.racks[0].phase,'Telehouse');assert.deepEqual(plain(app.sanitizeProject(app.getProject())),plain(app.getProject()));app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('Reserved tenant blocks can be edited, deleted and restored without overlap',()=>{
 get('bayfaceInspector').onclick({target:{closest:()=>({id:'bayfaceDeselect',dataset:{}})}});get('bayfaceKind').value='reserved';get('bayfaceLabel').value='CAT';get('bayfaceU').value='10';get('bayfaceHeight').value='6';get('bayfaceColor').value='#64748b';get('bayfaceInspector').onsubmit(event(get('bayfaceItemForm')));const item=app.getProject().bayface.items.find(i=>i.kind==='reserved');assert(item);assert.equal(item.height,6);assert(get('bayfaceCanvas').innerHTML.includes('CAT'));get('bayfaceInspector').onclick({target:{closest:()=>({dataset:{deleteItem:item.id}})}});assert(!app.getProject().bayface.items.some(i=>i.id===item.id));app.undo();assert(app.getProject().bayface.items.some(i=>i.id===item.id));
});
check('Cross-rack drag moves into exact U slots and rejects collisions without losing the item',()=>{
 context.NOAH_BAYFACE.addRack();const p=app.getProject(),r=p.bayface.racks[1],item=p.bayface.items[0],drop=get('bayfaceCanvas').querySelector('[data-rack-drop="'+r.id+'"]');const ev={target:drop,clientY:0,preventDefault(){},dataTransfer:{getData:type=>type==='application/noah-rack-item'?item.id:'',types:['application/noah-rack-item']}};get('bayfaceCanvas').ondrop(ev);const moved=app.getProject().bayface.items.find(i=>i.id===item.id);assert.equal(moved.rackId,r.id);assert.equal(moved.u,41);assert.equal(moved.height,2);
 context.NOAH_BAYFACE.addDevice('huawei-s5735-l8t4x-qa-v2',r.id,39);get('bayfaceAutoU').checked=false;const before=plain(app.getProject());get('bayfaceCanvas').ondrop({...ev,clientY:3*18});assert.deepEqual(plain(app.getProject()),before);get('bayfaceAutoU').checked=true;
});
await checkAsync('Bayface export contains multiple racks, cropped embedded images and reserved blocks',async()=>{
 const s=await context.NOAH_BAYFACE.svg(async()=> 'data:image/png;base64,aA==');assert(s.svg.includes('<svg'));assert(s.svg.includes('data:image/png'));assert(s.svg.includes('CAT'));assert(s.svg.includes('RACK 2'));assert(s.width>800);assert(s.height>800);
});
check('Rack positions persist, cancel safely and drag independently of zoom',()=>{
 const B=context.NOAH_BAYFACE,c=get('bayfaceCanvas'),r=app.getProject().bayface.racks[0],old=r.x;
 B.setZoom(2);const handle=c.querySelector('[data-rack-drag="'+r.id+'"]');
 c.onpointerdown({target:handle,button:0,clientX:100,pointerId:501,preventDefault(){}});c.onpointermove({clientX:300,pointerId:501});c.onpointerup({pointerId:501});assert.equal(app.getProject().bayface.racks[0].x,old+100);assert.deepEqual(plain(app.sanitizeProject(app.getProject())),plain(app.getProject()));app.undo();assert.equal(app.getProject().bayface.racks[0].x,old);
 const h=c.querySelector('[data-rack-drag="'+r.id+'"]');c.onpointerdown({target:h,button:0,clientX:100,pointerId:502,preventDefault(){}});c.onpointermove({clientX:500,pointerId:502});c.onpointercancel({pointerId:502});assert.equal(app.getProject().bayface.racks[0].x,old);
 const bad=plain(app.getProject());bad.bayface.racks[0].x=-1;assert.throws(()=>app.sanitizeProject(bad),/ตำแหน่ง/);B.setZoom(1);
});
check('Bayface Hand pans across equipment, empty-space pans in Select and cancellation preserves project data',()=>{
 const c=get('bayfaceCanvas'),before=plain(app.getProject()),i=before.bayface.items[0],target=c.querySelector('[data-bayface-item="'+i.id+'"]');
 get('bayfaceHandTool').onclick();assert(c.classList.contains('bayface-hand-mode'));c.scrollLeft=300;c.scrollTop=400;
 c.onpointerdown({target,button:0,pointerId:901,clientX:100,clientY:100,preventDefault(){}});c.onpointermove({pointerId:902,clientX:0,clientY:0});assert.equal(c.scrollLeft,300);
 c.onpointermove({pointerId:901,clientX:40,clientY:70});assert.equal(c.scrollLeft,360);assert.equal(c.scrollTop,430);assert(c.classList.contains('bayface-panning'));c.onpointerup({pointerId:901});assert(!c.classList.contains('bayface-panning'));c.onclick({target});assert.deepEqual(plain(app.getProject()),before);
 get('bayfaceSelectTool').onclick();assert(!c.classList.contains('bayface-hand-mode'));const blank={closest:()=>null};c.onpointerdown({target:blank,button:0,pointerId:903,clientX:100,clientY:100,preventDefault(){}});c.onpointermove({pointerId:903,clientX:120,clientY:110});assert.equal(c.scrollLeft,340);assert.equal(c.scrollTop,420);c.onpointercancel({pointerId:903});assert(!c.classList.contains('bayface-panning'));assert.deepEqual(plain(app.getProject()),before);
 c.scrollLeft=c.scrollTop=0;
});
check('Equipment drops preserve U coordinates at 200 percent zoom',()=>{
 const B=context.NOAH_BAYFACE,c=get('bayfaceCanvas'),d=app.getProject().bayface,r=d.racks[1],item=d.items[0];B.setZoom(2);const drop=c.querySelector('[data-rack-drop="'+r.id+'"]');const before=plain(app.getProject());c.ondrop({target:drop,clientY:10*18*2,preventDefault(){},dataTransfer:{getData:t=>t==='application/noah-rack-item'?item.id:''}});assert.equal(app.getProject().bayface.items.find(i=>i.id===item.id).u,31);app.undo();assert.deepEqual(plain(app.getProject()),before);B.setZoom(1);
});
await checkAsync('Mixed-height rack exports share a ground line and retain free horizontal positions',async()=>{
 const before=plain(app.getProject());app.transaction(p=>{p.bayface.racks[1].units=48;p.bayface.racks[1].x=650;});const s=await context.NOAH_BAYFACE.svg(async()=> 'data:image/png;base64,aA==');const frames=[...s.svg.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="294" height="([^"]+)"/g)];assert.equal(frames.length,2);assert.equal(+frames[0][2]+ +frames[0][3],+frames[1][2]+ +frames[1][3]);assert.equal(+frames[1][1],703);app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('All 34 library models have auditable rack dimensions and PE defaults use their actual chassis size',()=>{
 const visible=app.getCatalog().filter(m=>!m.hidden),B=context.NOAH_BAYFACE;assert.equal(visible.length,34);for(const m of visible){assert(m.rackProfile,m.id);assert(Number.isInteger(m.rackProfile.occupiedU));assert(m.rackProfile.heightMm>0);assert(m.rackProfile.sourceUrl.startsWith('https://'));assert.equal(B.defaultHeight(m),m.rackProfile.occupiedU);}
 for(const [id,u] of [['huawei-ne8000-f1a',1],['huawei-ne8000-m8',3],['huawei-ne8000-m14',5],['huawei-ne8000-x4',10],['huawei-ne40e-x8a',21]])assert.equal(B.defaultHeight(app.getCatalog().find(m=>m.id===id)),u);assert.equal(app.getCatalog().find(m=>m.id==='huawei-ne8000-x4').rackProfile.chassisU,9.8);
});
check('Click and Delete removes the selected Bayface item without touching Topology or intercepting text editing',()=>{
 const p=app.getProject(),item=p.bayface.items[0],c=get('bayfaceCanvas');c.onclick({target:c.querySelector('[data-bayface-item="'+item.id+'"]')});const before=plain(app.getProject());get('bayfaceLabel').value='Editing';document.dispatch('keydown',event(get('bayfaceLabel'),{key:'Delete'}));assert.deepEqual(plain(app.getProject()),before);
 document.dispatch('keydown',event(c,{key:'Delete'}));assert(!app.getProject().bayface.items.some(i=>i.id===item.id));assert.deepEqual(plain(app.getProject().devices),before.devices);assert.deepEqual(plain(app.getProject().links),before.links);app.undo();assert.deepEqual(plain(app.getProject()),before);
});
await checkAsync('Area color commits immediately for hardware and reserved blocks and follows SVG exports',async()=>{
 const c=get('bayfaceCanvas');for(const kind of ['device','reserved']){const item=app.getProject().bayface.items.find(i=>i.kind===kind),before=plain(app.getProject());c.onclick({target:c.querySelector('[data-bayface-item="'+item.id+'"]')});get('bayfaceLabel').value='Unsaved label';get('bayfaceColor').value='#f59e0b';get('bayfaceInspector').onchange({target:get('bayfaceColor')});assert.equal(app.getProject().bayface.items.find(i=>i.id===item.id).color,'#f59e0b');assert.equal(get('bayfaceLabel').value,'Unsaved label');const el=c.querySelector('[data-bayface-item="'+item.id+'"]');assert(c.innerHTML.includes('background:#f59e0b'));const s=await context.NOAH_BAYFACE.svg(async()=> 'data:image/png;base64,aA==');assert(s.svg.includes('fill="#f59e0b"'));app.undo();assert.deepEqual(plain(app.getProject()),before);}
 const css=fs.readFileSync(path.join(root,'web/bayface.css'),'utf8');assert(!css.includes('background:linear-gradient(#28323d,#171e26)!important'));
});
check('Smart U finds nearest contiguous space, excludes self and refuses fragmented/full racks',()=>{
 const M=context.NOAH_BAYFACE_MODEL,d={racks:[{id:'r',units:12}],items:[{id:'a',rackId:'r',u:3,height:3},{id:'b',rackId:'r',u:9,height:2}]};assert.equal(M.findSlot(d,'r',3,4),6);assert.equal(M.findSlot(d,'r',4,1),null);assert.equal(M.findSlot(d,'r',3,3,'a'),3);assert.equal(M.findSlot(d,'r',13),null);const r=app.getProject().bayface.racks[0],before=plain(app.getProject());context.NOAH_BAYFACE.addDevice('huawei-ne8000-m8',r.id,10,true);const i=app.getProject().bayface.items.at(-1);assert.equal(i.height,3);assert(i.u>=16||i.u<=7);app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('Arrow moves selected equipment one U with Undo, preserves text editing and rejects overflow',()=>{
 const c=get('bayfaceCanvas'),i=app.getProject().bayface.items.find(i=>i.kind==='device');c.onclick({target:c.querySelector('[data-bayface-item="'+i.id+'"]')});const before=plain(app.getProject());document.dispatch('keydown',event(c,{key:'ArrowDown'}));assert.equal(app.getProject().bayface.items.find(x=>x.id===i.id).u,i.u-1);app.undo();assert.deepEqual(plain(app.getProject()),before);document.dispatch('keydown',event(get('bayfaceU'),{key:'ArrowDown'}));assert.deepEqual(plain(app.getProject()),before);document.dispatch('keydown',event(c,{key:'ArrowUp'}));assert.deepEqual(plain(app.getProject()),before);
});
check('Inspector closes, opens and resizes; presentation blocks edits and restores the workspace',()=>{
 const B=context.NOAH_BAYFACE,before=plain(app.getProject());B.setInspectorWidth(900);assert.equal(get('bayfaceInspectorResize').getAttribute('aria-valuenow'),600);B.setInspectorWidth(100);assert.equal(get('bayfaceInspectorResize').getAttribute('aria-valuenow'),240);B.toggleInspector(false);assert(get('bayfaceInspector').hidden);B.toggleInspector(true);assert(!get('bayfaceInspector').hidden);B.presentation(true);assert(document.body.classList.contains('bayface-presentation'));document.dispatch('keydown',event(get('bayfaceCanvas'),{key:'Delete'}));assert.deepEqual(plain(app.getProject()),before);B.presentation(false);assert(!document.body.classList.contains('bayface-presentation'));
});
check('Pointer drag preview equals committed multi-U landing and cancellation preserves state',()=>{
 const B=context.NOAH_BAYFACE,c=get('bayfaceCanvas'),i=app.getProject().bayface.items.find(i=>i.kind==='device'),r=app.getProject().bayface.racks.find(r=>r.id!==i.rackId),before=plain(app.getProject());let drop=c.querySelector('[data-rack-drop="'+r.id+'"]');document.elementFromPoint=()=>drop;B.setZoom(1);
 const start=pointer=>c.onpointerdown({target:c.querySelector('[data-bayface-item="'+i.id+'"]'),button:0,pointerId:pointer,clientX:20,clientY:20,preventDefault(){}});start(701);c.onpointermove({pointerId:701,clientX:40,clientY:40});assert(drop.children.some(el=>el.className?.includes('rack-landing')));c.onpointercancel({pointerId:701});assert.deepEqual(plain(app.getProject()),before);assert(!drop.children.some(el=>el.className?.includes('rack-landing')));
 start(702);c.onpointermove({pointerId:702,clientX:40,clientY:40});const expected=B.landing(drop,40,i);assert(expected.valid);c.onpointerup({pointerId:702});const moved=app.getProject().bayface.items.find(x=>x.id===i.id);assert.equal(moved.rackId,expected.rackId);assert.equal(moved.u,expected.u);app.undo();assert.deepEqual(plain(app.getProject()),before);delete document.elementFromPoint;
});
await checkAsync('Bayface SVG export supports dark color, transparent viewport and hidden captions',async()=>{
 const B=context.NOAH_BAYFACE,resolve=async()=> 'data:image/png;base64,aA==';const dark=await B.svg(resolve,{background:'theme',theme:'dark',details:false});assert(dark.svg.includes('fill="#0b1220"'));B.setZoom(1);get('bayfaceCanvas').scrollLeft=0;get('bayfaceCanvas').scrollTop=0;const viewport=await B.svg(resolve,{background:'transparent',area:'viewport'});assert(!viewport.svg.includes('fill="white"'));assert(viewport.width<dark.width);assert(viewport.svg.includes('viewBox="30 20'));
});
await checkAsync('All researched ODF and AC/DC profiles allocate the correct U and round-trip with source IDs and exports',async()=>{
 const profiles=context.NOAH_BAYFACE_ACCESSORIES,B=context.NOAH_BAYFACE,before=plain(app.getProject()),r=before.bayface.racks[0];assert.equal(profiles.length,6);assert.equal(profiles.find(a=>a.id==='odf-commscope-760241650').adapters,12);assert.equal(profiles.find(a=>a.id==='odf-commscope-760241650').fibers,24);for(const a of profiles){assert(a.sourceUrl.startsWith('https://'));assert(a.useCase);B.addAccessory(a.id,r.id,1,true);const i=app.getProject().bayface.items.at(-1);assert.equal(i.accessoryId,a.id);assert.equal(i.height,a.units);assert.equal(i.kind,a.kind);}const clean=plain(app.sanitizeProject(app.getProject()));assert.deepEqual(clean,plain(app.getProject()));const s=await B.svg(async()=> 'data:image/png;base64,aA==');assert(s.svg.includes('NetSure 211'));assert(s.svg.includes('760241650'));
 const bad=plain(app.getProject());bad.bayface.items.at(-1).accessoryId='unknown';assert.throws(()=>app.sanitizeProject(bad),/Library/);const wrong=plain(app.getProject());wrong.bayface.items.at(-1).accessoryId='odf-commscope-760241650';assert.throws(()=>app.sanitizeProject(wrong),/ประเภท/);for(let n=0;n<profiles.length;n++)app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('Accessory menu and Inspector expose matching profiles, default sizes and persist a changed AC/DC choice',()=>{
 const before=plain(app.getProject()),menu=get('bayfaceAccessoryList'),a=context.NOAH_BAYFACE_ACCESSORIES.find(a=>a.id==='dc-vertiv-netsure211-2u');menu.onclick({target:menu.querySelector('[data-accessory="'+a.id+'"]')});assert.equal(get('bayfaceKind').value,'power');assert.equal(get('bayfaceHeight').value,2);assert.equal(get('bayfaceAccessory').value,a.id);assert(get('bayfaceDeviceField').hidden);assert(!get('bayfaceAccessoryField').hidden);assert(get('bayfaceAccessoryReference').innerHTML.includes('−48V'));
 get('bayfaceInspector').onsubmit(event(get('bayfaceItemForm')));const i=app.getProject().bayface.items.at(-1);assert.equal(i.accessoryId,a.id);assert.equal(i.height,2);get('bayfaceAccessory').value='ac-apc-ap9565';get('bayfaceInspector').onchange({target:get('bayfaceAccessory')});assert.equal(get('bayfaceHeight').value,1);get('bayfaceInspector').onsubmit(event(get('bayfaceItemForm')));assert.equal(app.getProject().bayface.items.at(-1).accessoryId,'ac-apc-ap9565');app.undo();app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('Legacy generic power items retain manual identity and height when edited',()=>{
 const before=plain(app.getProject()),r=before.bayface.racks[0],item={id:'legacy-power',rackId:r.id,u:25,height:3,kind:'power',modelId:'',label:'Existing DC shelf',notes:'Custom',color:'#202831'};app.transaction(p=>p.bayface.items.push(item));const c=get('bayfaceCanvas');c.onclick({target:c.querySelector('[data-bayface-item="'+item.id+'"]')});assert.equal(get('bayfaceAccessory').value,'');get('bayfaceLabel').value='Existing custom';get('bayfaceInspector').onsubmit(event(get('bayfaceItemForm')));const saved=app.getProject().bayface.items.find(i=>i.id===item.id);assert.equal(saved.height,3);assert(!saved.accessoryId);app.undo();app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('Bayface click selects equipment and blank click clears the highlight without mutating the project',()=>{
 const c=get('bayfaceCanvas'),before=plain(app.getProject()),item=before.bayface.items[0],target=c.querySelector('[data-bayface-item="'+item.id+'"]');
 get('bayfaceSelectTool').onclick();c.onpointerdown({target,button:0,pointerId:920,clientX:20,clientY:20,preventDefault(){}});c.onpointerup({pointerId:920});c.onclick({target:c});assert(c.innerHTML.includes('rack-equipment selected'));c.onclick({target:{closest:()=>null}});assert(!c.innerHTML.includes('rack-equipment selected'));assert.deepEqual(plain(app.getProject()),before);
});
check('ODF AC/DC Library drags carry accessory identity, show a landing preview and drop with correct U',()=>{
 const c=get('bayfaceCanvas'),a=context.NOAH_BAYFACE_ACCESSORIES[3];context.NOAH_BAYFACE.addRack();const r=app.getProject().bayface.racks.at(-1),drop=c.querySelector('[data-rack-drop="'+r.id+'"]'),values=new Map(),dt={setData:(k,v)=>values.set(k,v),getData:k=>values.get(k)||''};
 get('bayfaceAccessoryList').ondragstart({target:{closest:()=>({dataset:{accessory:a.id}})},dataTransfer:dt});assert.equal(dt.getData('application/noah-accessory'),a.id);c.ondragover({target:drop,clientY:0,dataTransfer:dt,preventDefault(){}});assert(drop.children.some(el=>el.className?.includes('rack-landing')));c.ondrop({target:drop,clientY:0,dataTransfer:dt,preventDefault(){}});const item=app.getProject().bayface.items.at(-1);assert.equal(item.accessoryId,a.id);assert.equal(item.height,2);assert.equal(item.u,41);assert(!drop.children.some(el=>el.className?.includes('rack-landing')));get('bayfaceAccessoryList').ondragend();app.undo();
});
check('Long project names survive editing, JSON round-trip and duplication without truncation',()=>{
 const original=app.getProject(),name='Network service provider / โครงการทดสอบชื่อยาว '.repeat(35);get('projectName').onchange({target:{value:name}});assert.equal(app.getProject().name,name);assert.equal(app.sanitizeProject(plain(app.getProject())).name,name);get('duplicateProjectBtn').onclick();assert.equal(app.getProject().name,name+' copy');app.replaceProject(original);
});
context.URLSearchParams=URLSearchParams;
for(const f of ['spec-matrix-data.js','specs.js'])vm.runInContext(fs.readFileSync(path.join(root,'web',f),'utf8'),context);
check('Device Specs integrates every Library and accessory model and preserves all uploaded Matrix fields',()=>{
 const S=context.NOAH_SPECS;assert.equal(S.devices.length,40);assert.equal(S.devices.filter(d=>d.matrix).length,18);
 for(const raw of context.NOAH_SPEC_MATRIX){const m=S.devices.find(d=>d.id===raw.id);assert(m);for(const [key,value]of Object.entries(raw.fields).filter(([,v])=>!['','-','—','NaN'].includes(String(v))))assert(m.groups.some(g=>g.fields[key]===value),raw.name+' '+key);}
 assert.equal(S.filterModels('',{type:'pe'}).length,5);assert.equal(S.filterModels('',{type:'odf'}).length,2);assert.equal(S.filterModels('',{type:'power'}).length,4);
 assert.deepEqual(plain(S.filterModels('S5735 QA V2').map(m=>m.id)),['huawei-s5735-l8t4x-qa-v2']);assert.equal(S.filterModels('unmatched-model-0000').length,0);
 assert(S.filterModels('',{type:'switch',brand:'Huawei',speed:'10000',connector:'SFP+'}).every(m=>m.type==='switch'&&m.brand==='Huawei'&&m.ports.some(p=>p.connector==='SFP+'&&p.speeds.includes(10000))));
 assert.equal(S.filterModels('',{type:'pe',speed:'10000'}).length,0);assert(S.filterModels('',{u:'2',type:'power'}).length===2);assert(S.filterModels('',{type:'router',throughput:2500}).every(m=>S.throughput(m)>=2500));
});
check('Specs tab, details and comparison are read-only and return to each design workspace',()=>{
 const S=context.NOAH_SPECS,before=plain(app.getProject());S.show('specs');assert(document.body.classList.contains('specs-mode'));assert.equal(get('specsTab').getAttribute('aria-selected'),'true');assert.equal(get('topologyTab').getAttribute('aria-selected'),'false');assert(!get('specsWorkspace').hidden);
 S.openDetail('cisco-1941');const modal=document.body.children.find(e=>e.id==='specDetailDialog');assert(modal.open);assert(modal.innerHTML.includes('License'));assert(modal.innerHTML.includes('Port inventory'));modal.close();
 const rows=S.compareRows(['huawei-ne8000-m8','huawei-ne8000-m14'],true);assert(rows.some(r=>r.key==='Rack occupancy (U)'&&r.values.join(',')==='3,5'));
 const compare=id=>get('specsWorkspace').onclick({target:{closest:selector=>selector==='[data-spec-compare]'?{dataset:{specCompare:id}}:null}});compare('cisco-1941');compare('cisco-asr-1001-x');get('specCompareOpen').onclick();assert(modal.innerHTML.includes('spec-compare-table'));assert(modal.innerHTML.includes('ISR')||modal.innerHTML.includes('ASR'));modal.close();
 document.dispatch('keydown',event(new Element('button'),{key:'Delete'}));assert.deepEqual(plain(app.getProject()),before);get('bayfaceTab').onclick();assert(document.body.classList.contains('bayface-mode'));assert(!document.body.classList.contains('specs-mode'));get('topologyTab').onclick();assert(!document.body.classList.contains('bayface-mode'));assert(get('specsWorkspace').hidden);assert.deepEqual(plain(app.getProject()),before);
});
check('Imported comma-separated interfaces reserve every physical port and reject duplicate aliases',()=>{
 newProject();const sw=device('huawei-s5731-s48t4x'),pe=device('huawei-ne8000-f1a');const p=plain(app.getProject());p.devices[0].sourceModel='S5731-S48T4X';p.devices[0].sourceBrand='Huawei';p.links=[link(pe,'Gi0/1/2,GigabitEthernet0/1/3',sw,'XEthernet0/0/1,XEthernet0/0/2',{cable:'sm',designOnly:true})];app.replaceProject(p);app.setTool('fiber');app.openCablePicker(sw);for(const id of ['x1','x2']){const b=get('connectContent').querySelector(`[data-cable-port="${id}"]`);assert(b.disabled);}assert(!get('connectContent').querySelector('[data-cable-port="x3"]').disabled);get('connectDialog').close();assert.throws(()=>app.saveLink(link(pe,'GigabitEthernet0/1/5',sw,'x2',{cable:'sm'})),/Combo Port/);assert.throws(()=>app.saveLink(link(pe,'GE0/1/2',sw,'x3',{cable:'sm'})),/Combo Port/);const saved=plain(app.getProject());assert.deepEqual(plain(app.sanitizeProject(saved)),saved);
 const m=app.getCatalog().find(m=>m.id==='huawei-s5731-s48t4x');assert.equal(context.NOAH_IMPORT.resolvePort(m,'XEthernet0/0/1','sm').id,'x1');app.setTool('select');
});
check('Dropping a Library device replaces model while preserving identity, geometry, metadata, links and Undo',()=>{
 newProject();const a=device('generic-network-device'),b=device('huawei-s5731-s48t4x');app.transaction(p=>{const d=p.devices.find(d=>d.id===a);d.hostname='PE Existing';d.x=321;d.y=432;d.managementIP='10.0.0.1';d.site='Bangkok';d.sourceModel='unknown';d.sourceBrand='Huawei';p.links.push(link(a,'Gi0/1/2,GigabitEthernet0/1/3',b,'x1',{cable:'sm',designOnly:true,color:'',enabled:true,mtu:9216,role:'standard',shape:'curved',showLabel:true,vlanMode:'trunk'}));});const before=plain(app.getProject()),node=get('nodes').querySelector(`[data-device="${a}"]`);get('canvas').ondrop(event(node,{dataTransfer:{getData:()=> 'huawei-ne8000-f1a'}}));const after=plain(app.getProject());assert.equal(after.devices.length,2);const d=after.devices.find(d=>d.id===a);assert.equal(d.modelId,'huawei-ne8000-f1a');for(const field of ['hostname','x','y','managementIP','site'])assert.equal(d[field],before.devices.find(d=>d.id===a)[field]);assert.equal(after.links.length,1);assert.equal(after.links[0].a.device,a);assert.deepEqual(plain(app.sanitizeProject(after)),after);app.undo();assert.deepEqual(plain(app.getProject()),before);app.redo();assert.equal(app.getProject().devices.find(d=>d.id===a).modelId,'huawei-ne8000-f1a');assert(app.replaceDevice(b,huawei));assert.equal(app.getProject().devices.length,2);assert.equal(app.getProject().links.length,1);assert(app.getProject().devices.find(d=>d.id===b).importedPorts.includes('XGigabitEthernet0/0/1'));app.undo();
});
check('Double-click edits link captions and shape text inline, preserves endpoints and supports Enter/Escape/Undo',()=>{
 newProject();const a=device('huawei-ne8000-m8'),b=device(huawei);app.saveLink(link(a,'GE0/1/0',b,'ge1',{cid:'DI41554'}));const original=plain(app.getProject()),id=original.links[0].id,hit=get('links').querySelector(`[data-link-label="${id}"]`);get('canvas').ondblclick(event(hit));let input=document.body.children.find(e=>e.tagName==='TEXTAREA');assert(input);input.value='Customer circuit\nPrimary connection';input.onkeydown(event(input,{key:'Enter'}));assert.equal(app.getProject().links[0].displayText,'Customer circuit\nPrimary connection');assert.deepEqual(plain(app.getProject().links[0].a),original.links[0].a);assert.equal(app.getProject().links[0].cid,'DI41554');assert.deepEqual(plain(app.sanitizeProject(plain(app.getProject()))),plain(app.getProject()));app.undo();assert.equal(app.getProject().links[0].displayText,undefined);app.redo();editor.beginInlineLink(id);input=document.body.children.find(e=>e.tagName==='TEXTAREA');input.value='Cancelled';input.onkeydown(event(input,{key:'Escape'}));assert.equal(app.getProject().links[0].displayText,'Customer circuit\nPrimary connection');editor.beginInlineLink(id);input=document.body.children.find(e=>e.tagName==='TEXTAREA');input.value='';input.onkeydown(event(input,{key:'Enter'}));assert.equal(app.getProject().links[0].displayText,undefined);
 context.NOAH_ELEMENTS.pending='ellipse';const shape=context.NOAH_ELEMENTS.place(100,100);editor.beginInlineLabel(shape);input=document.body.children.find(e=>e.tagName==='TEXTAREA');assert(input);assert(!get('labelDialog').open);input.value='Network region';input.onkeydown(event(input,{key:'Enter'}));assert.equal(app.getProject().labels.find(l=>l.id===shape).text,'Network region');assert.equal(app.getProject().labels.find(l=>l.id===shape).shape,'ellipse');
});
check('Both theme palettes meet 4.5:1 for main, muted, action, error and reserved text',()=>{
 const css=fs.readFileSync(path.join(root,'web/contrast.css'),'utf8'),rules=[...css.matchAll(/:root(?:\[data-theme=light\])?\{([^}]+)\}/g)].slice(0,2);
 const lum=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 for(const rule of rules){const vars=Object.fromEntries([...rule[1].matchAll(/--([\w-]+):(#[\da-f]{6})/g)].map(m=>[m[1],m[2]]));for(const bg of ['surface','panel','elevated','glass-control','canvas'])for(const fg of ['ink','muted','accent','error'])assert(ratio(vars[fg],vars[bg])>=4.5,fg+' on '+bg);assert(ratio(vars.accent,vars['on-accent'])>=4.5);}
 for(const color of ['#64748b','#ffffff','#000000','#f59e0b'])assert(ratio(color,context.NOAH_BAYFACE.textColor(color))>=4.5);
 assert(css.includes('input::placeholder'));assert(css.includes('.spec-list dd'));assert(css.includes('.cable-port-list small'));get('topologyTab').onclick();
});
check('Double-click device names survives canvas pointer capture and preserves Internal PE identity in External',()=>{
 app.startProject('internal');const d=app.addDevice('huawei-ne8000-m8',100,100);let node=get('nodes').querySelector(`[data-device="${d.id}"]`),name=node.querySelector('.device-hostname');
 for(let i=0;i<2;i++){node=get('nodes').querySelector(`[data-device="${d.id}"]`);name=node.appendChild(new Element('span',{class:'device-hostname'}));editor.pointerDown(event(name,{clientX:110,clientY:160,pointerId:88}));editor.pointerUp(event(get('canvas'),{clientX:110,clientY:160,pointerId:88}));}
 let input=document.body.children.find(e=>e.tagName==='TEXTAREA');assert(input,'Name hit must be remembered before pointer capture');input.value='Core Bangkok';input.onkeydown(event(input,{key:'Enter'}));assert.equal(app.getProject().devices[0].hostname,'Core Bangkok');app.undo();assert.equal(app.getProject().devices[0].hostname,'NetEngine 8000 M8');app.redo();app.setAudience('external');node=get('nodes').querySelector(`[data-device="${d.id}"]`);get('canvas').ondblclick(event(node));input=document.body.children.find(e=>e.tagName==='TEXTAREA');assert(input);input.value='Provider Edge A';input.onkeydown(event(input,{key:'Enter'}));assert.equal(context.NOAH_AUDIENCE.publicProject(app.getProject()).devices[0].hostname,'Provider Edge A');app.setAudience('internal');assert.equal(app.getProject().devices[0].hostname,'Core Bangkok');
});
check('ASR 1001 copper SFP confirmation, cancellation, port occupancy and JSON persistence',()=>{
 for(const model of ['cisco-asr-1001','cisco-asr-1001-x']){app.startProject('internal');const a=app.addDevice(model,100,100),b=app.addDevice(huawei,500,100),port=app.getCatalog().find(m=>m.id===model).ports.find(p=>p.copperSfp).id;app.setTool('utp');app.openCablePicker(a.id);assert(get('connectContent').innerHTML.includes('data-cable-port="'+port+'"'));if(model.endsWith('-x'))assert(!get('connectContent').innerHTML.includes('data-cable-port="te0"'));let prompts=0;context.confirm=()=>{prompts++;return false;};app.selectCablePort(a.id,port);assert.equal(app.getProject().devices[0].transceivers[port],undefined);context.confirm=()=>{prompts++;return true;};app.selectCablePort(a.id,port);assert.equal(prompts,2);assert.equal(app.getProject().devices[0].transceivers[port],'ct');const l=link(a.id,port,b.id,'ge1');app.saveLink(l);assert.deepEqual(plain(app.sanitizeProject(app.getProject())),plain(app.getProject()));assert.throws(()=>app.saveLink({...l,id:'duplicate'}),/พอร์ต/);app.deleteLink(l.id);assert.throws(()=>app.saveLink({...l,speed:10000}),/ความเร็ว/);app.transaction(p=>{p.devices[0].transceivers[port]='lx';});assert.throws(()=>app.saveLink(l),/Copper SFP/);}
 context.confirm=()=>true;
});
check('Link palette commits swatch colors and reference image Elements round-trip',()=>{
 app.startProject('internal');const a=device(huawei),b=device(huawei);app.openConnect(a,'ge1');assert(get('connectContent').innerHTML.includes('data-link-swatch'));get('connectContent').onclick(event(new Element('button',{'data-link-swatch':'#ec4899'})));assert.equal(get('linkColor').value,'#ec4899');assert(get('linkCustomColor').checked);get('connectContent').onsubmit(event(get('connectionForm')));assert.equal(app.getProject().links[0].color,'#ec4899');for(const shape of ['symphonyLogo','symphonyCloud','customerBuilding']){context.NOAH_ELEMENTS.pending=shape;const id=context.NOAH_ELEMENTS.place(100,100);const l=app.getProject().labels.find(l=>l.id===id);assert(context.NOAH_ELEMENTS.svg(l).includes('<image'));}assert.deepEqual(plain(app.sanitizeProject(app.getProject())),plain(app.getProject()));
});
{
 const original=plain(app.getProject());get('saveBtn').onclick();const exported=JSON.parse(await downloads.at(-1).blob.text());
 check('JSON export removes company artwork without changing the editable project or interfaces',()=>{
 assert(!exported.labels.some(l=>l.shape==='symphonyLogo'||l.shape==='symphonyCloud'));
 assert(exported.labels.some(l=>l.shape==='cloud'));assert(exported.labels.some(l=>l.shape==='customerBuilding'));
 assert.deepEqual(exported.devices,original.devices);assert.deepEqual(exported.links,original.links);assert.deepEqual(plain(app.getProject()),original);
 assert.deepEqual(plain(app.sanitizeProject(exported)),exported);
 });
}

check('Device resize, Select marquee and cross-object layer controls persist with Undo',()=>{
 app.startProject('internal');const d=app.addDevice(huawei,100,100);let node=get('nodes').querySelector(`[data-device="${d.id}"]`),handle=node.appendChild(new Element('span',{'data-device-resize':'se'}));app.setView({zoom:1,pan:{x:0,y:0}});editor.pointerDown(event(handle,{clientX:300,clientY:180,pointerId:92}));editor.pointerMove(event(get('canvas'),{clientX:400,clientY:230,pointerId:92}));editor.pointerUp(event(get('canvas'),{clientX:400,clientY:230,pointerId:92}));assert.equal(app.getProject().devices[0].width,344);assert.equal(app.getProject().devices[0].height,138);assert.deepEqual(plain(app.sanitizeProject(app.getProject())),plain(app.getProject()));app.undo();assert.equal(app.getProject().devices[0].width,undefined);app.redo();node=get('nodes').querySelector(`[data-device="${d.id}"]`);get('canvas').dispatch('contextmenu',event(node));assert(get('contextMenu').innerHTML.includes('data-layer-action="front"'));get('contextMenu').onclick(event(new Element('button',{'data-layer-action':'back'})));assert.equal(app.getProject().devices[0].zIndex,1);assert.deepEqual(plain(app.sanitizeProject(app.getProject())),plain(app.getProject()));app.undo();assert.equal(app.getProject().devices[0].zIndex,undefined);
 const label=app.saveLabel({x:500,y:100,text:'Site A',fontSize:18,color:'#203953',kind:'text'});editor.clearSelection();app.setTool('select');editor.pointerDown(event(get('canvas'),{clientX:50,clientY:50,pointerId:94,shiftKey:true}));editor.pointerMove(event(get('canvas'),{clientX:850,clientY:350,pointerId:94}));assert(!get('selectionRect').hidden);editor.pointerUp(event(get('canvas'),{clientX:850,clientY:350,pointerId:94}));assert(editor.isSelected('device',d.id));assert(editor.isSelected('label',label));assert(get('selectionRect').hidden);
});
check('iStack detects Main/Backup switches with swapped port pairs and preserves explicit routes',()=>{
 app.startProject('internal');const a=app.addDevice(huawei,100,100),b=app.addDevice(huawei,100,360);app.transaction(p=>{p.devices[0].hostname='SW(Main)';p.devices[1].hostname='SW(Backup)';});const first=link(a.id,'x1',b.id,'x2',{cable:'sm',speed:10000}),second=link(a.id,'x2',b.id,'x1',{cable:'sm',speed:10000});app.saveLink(first,{[a.id+':x1']:'lr',[b.id+':x2']:'lr'});app.saveLink(second,{[a.id+':x2']:'lr',[b.id+':x1']:'lr'});const p=app.getProject(),m=new Map(app.getCatalog().map(m=>[m.id,m])),g=context.NOAH_GEOMETRY.linkLayout(p.links[0],p,m),h=context.NOAH_GEOMETRY.linkLayout(p.links[1],p,m);assert.equal(g.lines[0],'iStack');assert.equal(g.polyline.length,4);assert(g.polyline[0][0]<h.polyline[0][0]);assert(g.polyline.at(-1)[0]>h.polyline.at(-1)[0]);p.links[0].waypoints=[[80,250]];assert.equal(context.NOAH_GEOMETRY.linkLayout(p.links[0],p,m).polyline.length,3);
});
check('Combined Select pans immediately, long-hold selects, and Ctrl+Z undoes a single saved change',()=>{
 app.startProject('internal');app.setView({zoom:1,pan:{x:0,y:0}});const d=app.addDevice(huawei,100,100),canvas=get('canvas');editor.pointerDown(event(canvas,{clientX:0,clientY:0,pointerId:97}));editor.pointerMove(event(canvas,{clientX:30,clientY:20,pointerId:97}));editor.pointerUp(event(canvas,{clientX:30,clientY:20,pointerId:97}));assert.equal(app.getView().pan.x,30);app.setView({pan:{x:0,y:0}});let clock=1000;context.Date=class extends Date{static now(){return clock;}};editor.pointerDown(event(canvas,{clientX:0,clientY:0,pointerId:98}));clock+=300;editor.pointerMove(event(canvas,{clientX:500,clientY:300,pointerId:98}));assert(!get('selectionRect').hidden);editor.pointerUp(event(canvas,{clientX:500,clientY:300,pointerId:98}));delete context.Date;assert(editor.isSelected('device',d.id));const savedName=app.getProject().devices[0].hostname;app.transaction(p=>p.devices[0].hostname='Changed');document.dispatch('keydown',event(canvas,{key:'z',ctrlKey:true}));assert.equal(app.getProject().devices[0].hostname,savedName);assert.equal(app.getProject().devices.length,1);
});
check('Groups rename and allow moving one member without ungrouping; Internal styles preserve ports',()=>{
 app.startProject('internal');const a=app.addDevice(huawei,100,100),b=app.addDevice(huawei,500,100);editor.setSelection([a.id,b.id]);editor.arrange('group');const gid=app.getProject().groups[0].id;let node=get('nodes').querySelector(`[data-device="${a.id}"]`);get('canvas').dispatch('contextmenu',event(node));context.prompt=()=> 'Core Site';get('contextMenu').onclick(event(new Element('button',{'data-group-edit':'rename'})));assert.equal(app.getProject().groups[0].name,'Core Site');get('canvas').dispatch('contextmenu',event(node));get('contextMenu').onclick(event(new Element('button',{'data-group-edit':'members'})));node=get('nodes').querySelector(`[data-device="${a.id}"]`);const before=app.getProject();editor.pointerDown(event(node,{clientX:110,clientY:110,pointerId:99}));editor.pointerMove(event(get('canvas'),{clientX:160,clientY:130,pointerId:99}));editor.pointerUp(event(get('canvas'),{clientX:160,clientY:130,pointerId:99}));assert.equal(app.getProject().devices[1].x,before.devices[1].x);assert.equal(app.getProject().groups[0].id,gid);app.transaction(p=>p.devices[0].iconStyle='outline');assert(get('nodes').innerHTML.includes('switch-outline.png'));assert.deepEqual(plain(app.sanitizeProject(app.getProject())),plain(app.getProject()));assert.equal(app.getProject().devices[0].modelId,huawei);document.dispatch('keydown',event(get('canvas'),{key:'Escape'}));
});
check('Canvas copy/paste works with Thai keyboard layout, remaps links, and leaves text editing alone',()=>{
 document.body.classList.remove('bayface-mode','specs-mode');for(const e of ids.values())if(e.tagName==='DIALOG')e.close();
 app.startProject('internal');const a=app.addDevice(huawei,100,100),b=app.addDevice(huawei,500,100);app.saveLink(link(a.id,'ge1',b.id,'ge2'));editor.setSelection([a.id,b.id]);
 const canvas=get('canvas'),copyEvent=event(canvas,{key:'แ',code:'KeyC',ctrlKey:true});document.dispatch('keydown',copyEvent);assert(copyEvent.defaultPrevented);
 const before=plain(app.getProject());const pasteEvent=event(canvas,{key:'อ',code:'KeyV',ctrlKey:true});document.dispatch('keydown',pasteEvent);assert(pasteEvent.defaultPrevented);let p=app.getProject();assert.equal(p.devices.length,4);assert.equal(p.links.length,2);assert.notEqual(p.links[1].a.device,p.links[0].a.device);assert.notEqual(p.links[1].b.device,p.links[0].b.device);assert.deepEqual(plain(app.sanitizeProject(p)),plain(p));app.undo();assert.deepEqual(plain(app.getProject()),before);
 for(const key of ['c','v']){const e=event(get('projectName'),{key,code:'Key'+key.toUpperCase(),ctrlKey:true});document.dispatch('keydown',e);assert(!e.defaultPrevented);assert.deepEqual(plain(app.getProject()),before);}
 const input=get('projectName');let blurred=false;input.onblur=()=>blurred=true;document.activeElement=input;editor.pointerDown(event(canvas,{button:0,clientX:20,clientY:20,pointerId:888}));assert(blurred);assert.equal(canvas.getAttribute('tabindex'),'0');editor.pointerUp(event(canvas,{button:0,clientX:20,clientY:20,pointerId:888}));delete document.activeElement;input.onblur=null;
});
check('User X8A preset has exactly 109 unique interfaces and shares 50/100GE socket occupancy',()=>{
 const PE=context.NOAH_PE_INTERFACES,names=PE.profiles['huawei-ne40e-x8a'].groups.flatMap(g=>g.names);assert.equal(names.length,109);assert.equal(new Set(names).size,109);assert(names.includes('GE6/1/23'));assert(names.includes('50GE2/1/1'));assert(names.includes('50|100GE1/0/0'));assert(!names.includes('100GE8/1/1'));
 const model=app.getCatalog().find(m=>m.id==='huawei-ne40e-x8a'),R=context.NOAH_PORT_RESOURCES;assert.deepEqual(plain(R.keys(model,'50|100GE1/0/0')),plain(R.keys(model,'100GE1/0/0')));assert.equal(PE.socket(model.id,'50|100GE1/0/0'),PE.socket(model.id,'50GE1/0/0'));
 app.startProject('internal');const pe=app.addDevice(model.id,100,100),sw=app.addDevice(huawei,500,100);app.saveLink(link(pe.id,'50|100GE1/0/0',sw.id,'ge1'));assert.throws(()=>app.saveLink(link(pe.id,'100GE1/0/0',sw.id,'ge2')),/Combo Port/);assert.deepEqual(plain(app.sanitizeProject(app.getProject())),plain(app.getProject()));
 const html=PE.select(model.id,'test','',n=>R.keys(model,n)[0]===R.keys(model,'100GE1/0/0')[0]);assert(html.includes('value="50|100GE1/0/0"  disabled'));
});
check('Bandwidth-first Specs filters use the chosen Matrix license and hide unknown capacities',()=>{
 const S=context.NOAH_SPECS,idsFor=f=>S.filterModels('',f).map(m=>m.id);
 assert(idsFor({throughput:500}).includes('cisco-c1121-8pltep'));assert(!idsFor({throughput:500,license:'security'}).includes('cisco-c1121-8pltep'));assert(idsFor({throughput:250,license:'security'}).includes('cisco-c1121-8pltep'));assert(!idsFor({throughput:1000}).includes('cisco-c1121-8pltep'));assert(idsFor({throughput:2500}).includes('cisco-asr-1001-x'));assert(S.filterModels('',{throughput:100}).every(m=>m.type==='router'&&S.throughput(m)>=100));
 const html=get('specsWorkspace').innerHTML;assert(html.indexOf('id="specThroughput"')<html.indexOf('id="specType"'));assert(html.indexOf('id="specThroughput"')<html.indexOf('class="spec-advanced"'));assert(html.includes('รองรับอย่างน้อย 950 Mbps'));get('specReset').onclick();assert(get('specResults').innerHTML.includes('IPBase <strong>'));
 get('specThroughput').onchange({target:{value:'500'}});get('specLicense').onchange({target:{value:'security'}});assert(!get('specResults').innerHTML.includes('data-spec-open="cisco-c1121-8pltep"'));get('specReset').onclick();assert.equal(get('specLicense').value,'');assert.equal(get('specThroughput').value,'');
});
vm.runInContext(fs.readFileSync(path.join(root,'web/network-visual-engine.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'web/control-center.js'),'utf8'),context);
check('Control Center integrates session-only traffic, fault reset, animation pause and immutable topology',()=>{
 const C=context.NOAH_CONTROL;app.startProject('internal');const a=app.addDevice(huawei,100,100),b=app.addDevice(huawei,500,100);app.saveLink(link(a.id,'ge1',b.id,'ge2'));const before=plain(app.getProject());C.show(true,'simulation');get('ccStart').onclick();assert(C.getState().enabled);assert(get('links').innerHTML.includes('cc-traffic'));assert(get('links').innerHTML.includes('SIM 50%'));get('ccPause').onclick();assert(document.body.classList.contains('cc-sim-paused'));get('ccPause').onclick();assert(!document.body.classList.contains('cc-sim-paused'));
 get('ccFailDevice').value=a.id;get('ccToggleDevice').onclick();assert.equal(C.calculate().counts.down,1);assert(get('links').innerHTML.includes('SIM DOWN'));assert.deepEqual(plain(app.getProject()),before);assert(context.NOAH_STUDIO.getFailures().downDevices.includes(a.id));get('routeReset').onclick();assert.equal(C.calculate().counts.down,0);assert(!get('links').innerHTML.includes('SIM DOWN'));get('ccToggleDevice').onclick();assert.equal(C.calculate().counts.down,1);get('ccReset').onclick();assert(!C.getState().enabled);assert.equal(C.calculate().counts.down,0);assert.deepEqual(plain(app.getProject()),before);
 context.NOAH_SPECS.show('specs');get('specsWorkspace').onclick(event(new Element('button',{'data-spec-add':'cisco-asr-1001-x'})));assert(!document.body.classList.contains('specs-mode'));assert.equal(app.getProject().devices.length,3);assert.equal(app.getProject().devices.at(-1).modelId,'cisco-asr-1001-x');app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('Optional grid snap preserves group offsets and Auto layout is undoable without changing interfaces',()=>{
 const C=context.NOAH_CONTROL;app.startProject('internal');const a=app.addDevice(huawei,103,107),b=app.addDevice(huawei,411,121);app.saveLink(link(a.id,'ge1',b.id,'ge2'));const before=plain(app.getProject());editor.setSelection([a.id,b.id]);editor.setSnap(true);const node=get('nodes').querySelector('[data-device="'+a.id+'"]');editor.pointerDown(event(node,{clientX:100,clientY:100,pointerId:808}));editor.pointerMove(event(get('canvas'),{clientX:129,clientY:129,pointerId:808}));editor.pointerUp(event(get('canvas'),{clientX:129,clientY:129,pointerId:808}));const p=app.getProject();assert.equal(p.devices[0].x%20,0);assert.equal(p.devices[0].y%20,0);assert.equal(p.devices[1].x-p.devices[0].x,308);app.undo();assert.deepEqual(plain(app.getProject()),before);editor.setSnap(false);C.layout();assert.deepEqual(plain(app.getProject().links),before.links);app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('Cold starts are always empty, preserve saved projects and allow manual reopening',()=>{
  const existing=plain(app.getProject()),empty=plain(app.blankProject('Empty draft'));
  const notes=plain(app.sanitizeProject({...app.blankProject('Planning notes'),labels:[{id:'startup-note',x:100,y:100,text:'Site notes',fontSize:18,color:'#203953',bold:false}]}));
  function boot(project=null){
    ids.clear();tools.clear();localValues.clear();documentListeners.clear();windowListeners.clear();
    document.documentElement=new Element('html',{'data-theme':'dark'});document.body=new Element('body');
    for(const m of fs.readFileSync(path.join(root,'web/studio.html'),'utf8').matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)){const a=attributes(m[2]);if(a.id)ids.set(a.id,new Element(m[1],a));}
    if(project)localStorage.setItem('noah-workspace-v3',JSON.stringify({active:project.id,projects:[{id:project.id,name:project.name,updatedAt:project.metadata.updatedAt,project}]}));
    const fresh=vm.createContext({document,localStorage,crypto,Blob,AbortController,console,innerWidth:1440,innerHeight:1000,URL:context.URL,requestAnimationFrame:fn=>fn(),setTimeout:()=>1,clearTimeout(){},addEventListener(){}});fresh.window=fresh;
    for(const file of ['catalog.js','audience.js','icon-styles.js','elements.js','geometry.js','exports.js','port-resources.js','importer.js','bayface-accessories.js','bayface-model.js','app.js','editor.js'])vm.runInContext(fs.readFileSync(path.join(root,'web',file),'utf8'),fresh);
    return fresh.NOAH_APP;
  }
  for(const savedProject of [null,empty,existing,notes]){
    const started=boot(savedProject),p=started.getProject();
    for(const key of ['devices','links','labels','groups'])assert.equal(p[key].length,0,key);
    assert(!get('emptyCanvas').hidden);assert.notEqual(p.id,savedProject?.id);
    const expected=savedProject?JSON.stringify({active:savedProject.id,projects:[{id:savedProject.id,name:savedProject.name,updatedAt:savedProject.metadata.updatedAt,project:savedProject}]}):null;
    assert.equal(localStorage.getItem('noah-workspace-v3'),expected,'Startup must leave saved storage unchanged');
    get('localProjectsBtn').onclick();assert.equal(localStorage.getItem('noah-workspace-v3'),expected,'Opening the project list must not save the untouched blank workspace');
    if(savedProject){
      get('localProjectsList').onclick({target:{closest:s=>s==='[data-open-local]'?{dataset:{openLocal:savedProject.id}}:null}});
      assert.deepEqual(plain(started.getProject()),savedProject,'Saved work opens only on explicit selection');
      get('newBtn').onclick();assert.equal(started.getProject().devices.length,0);assert.equal(started.getProject().labels.length,0);
      started.undo();assert.deepEqual(plain(started.getProject()),savedProject);
    }
  }
});
check('Internal swaps preserve source hardware; External-origin generic projects cannot swap back',()=>{
 const V=context.NOAH_AUDIENCE;app.startProject('internal');const pe=app.addDevice('huawei-ne8000-m8',100,100);assert(pe);app.transaction(p=>{p.devices[0].hostname='Huawei M8 core';p.name='Huawei M8 diagram';});const original=app.getProject();assert(app.setAudience('external'));assert.equal(app.getProject().devices[0].modelId,pe.modelId);assert(!get('nodes').innerHTML.includes('Huawei'));const safe=V.publicProject(app.getProject());assert.equal(safe.devices[0].modelId,'external-pe');assert(!JSON.stringify(safe).includes('Huawei'));assert.equal(app.sanitizeProject(safe).designOrigin,'external');assert(app.setAudience('internal'));assert.equal(app.getProject().devices[0].hostname,original.devices[0].hostname);
 app.startProject('external');for(const role of ['pe','switch','router','firewall','ap'])assert(app.addDevice('external-'+role,100,100));assert.equal(app.setAudience('internal'),false);assert.equal(app.getProject().presentation,'external');app.setTool('fiber');app.openCablePicker(app.getProject().devices[0].id);assert(get('connectContent').innerHTML.includes('P1'));assert(!get('connectContent').innerHTML.includes('manualPortForm'));
});
check('External projection keeps every PE size, center and custom geometry consistent with preview and export',()=>{
 app.startProject('internal');const catalog=app.getCatalog(),models=new Map(catalog.map(m=>[m.id,m])),G=context.NOAH_GEOMETRY;
 for(const m of catalog.filter(m=>m.topologyOnly&&!m.externalRole&&!m.generic))app.addDevice(m.id,120,200);
 app.transaction(p=>{p.devices[0].width=333;p.devices[0].height=177;});const original=plain(app.getProject());app.setAudience('external');
 const safe=context.NOAH_AUDIENCE.publicProject(app.getProject()),externalModels=new Map(context.NOAH_AUDIENCE.models(catalog).map(m=>[m.id,m]));
 for(const d of safe.devices){const before=original.devices.find(v=>v.id===d.id);assert.deepEqual(plain(G.deviceSize(d,externalModels)),plain(G.deviceSize(before,models)));assert.equal(d.x,before.x);assert.equal(d.y,before.y);}
 app.preview(()=>{});assert.deepEqual(plain(app.getProject().devices),original.devices);app.setAudience('internal');assert.deepEqual(plain(app.getProject().devices),original.devices);
});
check('Smart alignment groups nearby centers independently, avoids chaining distant rows and supports Undo',()=>{
 app.startProject('internal');for(const [x,y] of [[100,100],[108,300],[600,109],[608,600]])app.addDevice('external-router',x,y);
 const before=plain(app.getProject());context.NOAH_EDITOR.clearSelection();context.NOAH_EDITOR.arrange('smart-align');const d=app.getProject().devices;
 assert.equal(d[0].x,d[1].x);assert.equal(d[2].x,d[3].x);assert.equal(d[0].y,d[2].y);assert.equal(d[1].y,300);assert.equal(d[3].y,600);app.undo();assert.deepEqual(plain(app.getProject()),before);
 const aligned=context.NOAH_GEOMETRY.smartAlign([{id:'a',modelId:'external-router',x:0,y:0},{id:'b',modelId:'external-router',x:18,y:300},{id:'c',modelId:'external-router',x:36,y:600}],new Map(app.getCatalog().map(m=>[m.id,m])));assert.equal(aligned[2].x,36);
});
check('Workspace chooser opens on every load including returning users and deep links',()=>{
 const dialog=get('onboardingDialog');dialog.close();context.location={search:'?project=example',hash:'#bayface'};vm.runInContext(fs.readFileSync(path.join(root,'web/onboarding.js'),'utf8'),context);assert(dialog.open);assert(dialog.innerHTML.includes('เลือกพื้นที่ทำงานของคุณ'));assert(dialog.innerHTML.includes('ultimate-logo.png'));dialog.close();vm.runInContext(fs.readFileSync(path.join(root,'web/onboarding.js'),'utf8'),context);assert(dialog.open);
});
check('External icon variant preserves model interfaces and round-trips JSON',()=>{
 app.startProject('external');const d=app.addDevice('external-router',100,100);app.transaction(p=>p.devices[0].externalIconStyle='glass');const safe=context.NOAH_AUDIENCE.publicProject(app.getProject());assert.equal(app.sanitizeProject(safe).devices[0].externalIconStyle,'glass');const m=app.getCatalog().find(m=>m.id===d.modelId),art=context.NOAH_ICON_STYLE.model(m,app.getProject().devices[0],true);assert(art.displayImage.endsWith('router-glass.png'));assert.equal(art.ports,m.ports);
});
check('Copy device creates an independent unconnected device with the same art and size and supports Undo',()=>{
 app.startProject('external');const source=app.addDevice('external-pe',120,140);app.transaction(p=>{p.devices[0].width=280;p.devices[0].height=160;p.devices[0].externalIconStyle='glass';});const before=plain(app.getProject());context.NOAH_EDITOR.copyDevice(source.id);const p=app.getProject(),copy=p.devices[1];assert.notEqual(copy.id,source.id);assert.equal(copy.width,280);assert.equal(copy.height,160);assert.equal(copy.externalIconStyle,'glass');assert.equal(p.links.length,0);assert.equal(copy.x,160);app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('Uniform device size preserves centers, selection scope and Undo',()=>{
 app.startProject('internal');const a=app.addDevice('external-router',100,100),b=app.addDevice('external-switch',400,400),c=app.addDevice('external-ap',700,700);app.transaction(p=>{p.devices[0].width=300;p.devices[0].height=180;p.devices[1].width=400;p.devices[1].height=100;});const before=plain(app.getProject());context.NOAH_EDITOR.setSelection([a.id,b.id],[]);context.NOAH_EDITOR.arrange('same-size');const p=app.getProject();assert.equal(p.devices[1].width,300);assert.equal(p.devices[1].height,180);assert.equal(p.devices[1].x+150,600);assert.equal(p.devices[1].y+90,450);assert.deepEqual(plain(p.devices[2]),before.devices[2]);app.undo();assert.deepEqual(plain(app.getProject()),before);
});
check('Link endpoints touch visible artwork after resize across External icons and Internal styles',()=>{
 const G=context.NOAH_GEOMETRY,models=new Map(app.getCatalog().map(m=>[m.id,m]));
 for(const presentation of ['internal','external'])for(const iconStyle of ['real','threeD','outline','flat'])for(const externalIconStyle of ['classic','glass'])for(const [width,height] of [[100,60],[600,200],[200,600]]){
 const a={id:'a',modelId:'external-router',x:100,y:100,width,height,iconStyle,externalIconStyle},b={...a,id:'b',modelId:'external-switch',x:1100,y:100},p={presentation,devices:[a,b],links:[{id:'l',a:{device:'a',port:'P1'},b:{device:'b',port:'P1'},speed:10000,cable:'fiber',role:'main',shape:'straight'}],labels:[],groups:[]},g=G.linkLayout(p.links[0],p,models),ab=G.deviceArtBounds(a,models,presentation==='external'),bb=G.deviceArtBounds(b,models,presentation==='external');assert(Math.abs(g.points[0][0]-(ab.x+ab.width))<=1.01);assert(Math.abs(g.points[3][0]-bb.x)<=1.01);assert(g.points[0][1]>=ab.y&&g.points[0][1]<=ab.y+ab.height);
 b.x=100;b.y=1100;const v=G.linkLayout(p.links[0],p,models),vb=G.deviceArtBounds(b,models,presentation==='external');assert(Math.abs(v.points[0][1]-(ab.y+ab.height))<=1.01);assert(Math.abs(v.points[3][1]-vb.y)<=1.01);
 }
});
console.log(`Verified ${count} behavior groups. Browser layout, canvas downloads and native WebMCP were not tested.`);
