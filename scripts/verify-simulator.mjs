import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {interfaceSide,rackRotation,rackDisplayModel} from '../src/datacenter/device-orientation.js';
import {clone,freeSlot,validateRacks,fromBayface,toBayface,moveTarget} from '../src/datacenter/rack-placement.js';
const models=JSON.parse(fs.readFileSync('src/datacenter/devices.json')),known=new Set(models.map(m=>m.id));
const rack={id:'r1',name:'Test',units:42,x:0,z:0,rotation:0,items:[{id:'m8',name:'PE',model:'huawei-ne8000-m8',u:10,size:3},{id:'top',name:'Top',u:40,size:3}]};
assert.equal(freeSlot(rack,3,11),13);assert.equal(freeSlot(rack,3,11,'m8'),11);assert.equal(freeSlot(rack,43,1),null);assert.equal(freeSlot(rack,27,14),13);assert.equal(freeSlot(rack,28,13),null);
assert.throws(()=>validateRacks([{...rack,items:[...rack.items,{id:'collision',name:'collision',u:12,size:1}]}],known));
assert.throws(()=>validateRacks([{...rack,items:[{id:'bad',name:'bad',model:'unknown',u:1,size:1}]}],known));
assert.throws(()=>validateRacks([{...rack,x:NaN}],known));
const c={window:{}};for(const file of ['bayface-accessories','bayface-model'])vm.runInNewContext(fs.readFileSync('web/'+file+'.js','utf8'),c);
const accessory=models.find(m=>m.accessory);const input={title:'Customer rack',racks:[{id:'r1',name:'42U',units:42,phase:'A'},{id:'r2',name:'60U',units:60,phase:'B'}],items:[{id:'pe',rackId:'r1',kind:'device',modelId:'huawei-ne8000-m8',u:1,height:3,label:'Custom PE',notes:'keep notes',color:'#abcdef'},{id:'odf',rackId:'r2',kind:accessory.kind,accessoryId:accessory.id,modelId:'',u:50,height:accessory.u,label:'ODF',notes:'do not lose',color:'#123456'}]};
const converted=fromBayface(input,models);validateRacks(converted,known);let restored=toBayface(converted,input.title,models);assert.deepEqual(restored,input);c.window.NOAH_BAYFACE_MODEL.validate(restored,known);
// A cross-rack move updates identity/location, not engineering or annotations.
const moved=clone(converted),device=moved[0].items.pop();device.u=55;moved[1].items.push(device);restored=toBayface(validateRacks(moved,known),input.title,models);c.window.NOAH_BAYFACE_MODEL.validate(restored,known);const out=restored.items.find(i=>i.id==='pe');assert.equal(out.rackId,'r2');assert.equal(out.u,55);assert.equal(out.notes,'keep notes');assert.equal(out.color,'#abcdef');assert.equal(out.modelId,'huawei-ne8000-m8');
const generic=clone(input);generic.items[0].modelId='generic-network-device';assert.equal(toBayface(fromBayface(generic,models),generic.title,models).items[0].modelId,'generic-network-device');
assert.equal(input.items[0].rackId,'r1');assert.equal(input.items[0].u,1);
assert.deepEqual(toBayface(fromBayface({title:'Empty',racks:[],items:[]},models),'Empty',models),{title:'Empty',racks:[],items:[]});
// UI wiring: each direct ID lookup resolves; integration never reinstates the removed modal designer.
const html=fs.readFileSync('web/index.html','utf8');for(const file of ['entry','simulator-editor'])for(const match of fs.readFileSync('src/datacenter/'+file+'.js','utf8').matchAll(/\$\('([\w-]+)'\)/g)){assert(html.includes('id="'+match[1]+'"')||['mapPosition','deviceDetail'].includes(match[1]),file+': '+match[1])}
assert(!fs.readFileSync('src/datacenter/entry.js','utf8').includes('openRackDesigner'));
assert(!fs.readFileSync('src/datacenter/studio-viewer.js','utf8').includes('openRackDesigner'));
assert(!fs.readFileSync('src/datacenter/scene.js','utf8').includes('ArrowHelper'));
assert(!fs.readFileSync('src/datacenter/scene.js','utf8').includes('doorMat'));
assert(!/\bDEMO\b|24 RACKS/.test(html));
console.log('PASS Simulator placement: exact multi-U fit, nearest free slot, collisions, full racks, unknown models, finite coordinates, Bayface device/accessory roundtrip, cross-rack identity/notes preservation, empty project and UI wiring.');

for(const id of ['cisco-c1121-8pltep','cisco-1941','cisco-2911-k9','cisco-3925e','cisco-3945e','cisco-isr-4331','cisco-isr-4431']){assert.equal(interfaceSide({id}),'rear');assert.equal(rackRotation({id}),Math.PI);}
assert.equal(rackRotation({id:'cisco-asr-1001-x'}),0);assert.equal(rackRotation({id:'huawei-ne8000-m8'}),0);
const originalModel={id:'cisco-c1121-8pltep',images:{rear:{src:'physical-rear'},front:{src:'bezel'}}};const presented=rackDisplayModel(originalModel);assert.equal(presented.images.rear.src,'physical-rear');assert.equal(presented.images.front.src,'bezel');
const opened=rackDisplayModel({id:'huawei-ne40e-x8a',images:{front:{src:'cover'}},interfaceImage:{src:'open-card-view'}});assert.equal(opened.images.front.src,'open-card-view');
const css=fs.readFileSync('web/datacenter.css','utf8');assert(css.includes('.walking #deviceLibrary:not([hidden])'));assert(html.includes('id="walkLibrary"'));assert(css.includes('NotoSansThai.ttf'));assert(fs.readFileSync('src/datacenter/scene.js','utf8').includes('mats.glassWall=wall'));
console.log('PASS Interface-facing rack orientation preserves real face labels; open-card presentation overlay, walk Library, Thai font and transparent wall configuration.');

// Asset metadata survives storage, validation and Simulator/Bayface round trips.
const detailed=clone(input);detailed.racks[0].name='PE Rack A';detailed.racks[0].room='Telehouse ห้อง A';detailed.items[0].serialNumber='SN-TEST-001';
const savedMetadata=JSON.parse(JSON.stringify(toBayface(validateRacks(fromBayface(detailed,models),known),detailed.title,models)));
const validatedMetadata=c.window.NOAH_BAYFACE_MODEL.validate(savedMetadata,known);
assert.equal(validatedMetadata.racks[0].room,detailed.racks[0].room);assert.equal(validatedMetadata.items[0].serialNumber,'SN-TEST-001');
const metadataMove=fromBayface(validatedMetadata,models),asset=metadataMove[0].items.pop();asset.u=55;metadataMove[1].items.push(asset);
assert.equal(toBayface(validateRacks(metadataMove,known),detailed.title,models).items.find(i=>i.id==='pe').serialNumber,'SN-TEST-001');
assert.throws(()=>validateRacks([{...rack,room:123}],known));assert.throws(()=>validateRacks([{...rack,items:[{...rack.items[0],serialNumber:'x'.repeat(151)}]}],known));
console.log('PASS Rack room/name and per-device serial survive JSON persistence, Bayface validation, round trips and cross-rack moves; invalid metadata rejected.');

const origin={rack:0,itemId:'m8'},moveRacks=[clone(rack)];moveRacks[0].items[0].serialNumber='KEEP-123';
assert(moveTarget(moveRacks,origin,{rack:0,u:20}).valid);assert(!moveTarget(moveRacks,origin,{rack:0,u:41}).valid);assert(!moveTarget(moveRacks,origin,{rack:0,u:39}).valid);assert(!moveTarget(moveRacks,origin,{rack:1,u:20}).valid);assert(!moveTarget(moveRacks,origin,null).valid);assert(moveTarget(moveRacks,origin,{rack:0,u:11}).valid,'overlap with own old U is allowed');assert.equal(moveTarget(moveRacks,origin,{rack:0,u:20}).item.serialNumber,'KEEP-123');assert.equal(moveRacks[0].items[0].u,10,'preview cannot mutate storage');
console.log('PASS Direct drag destination rejects overlap, boundaries and other racks; self overlap is allowed and metadata remains intact.');
