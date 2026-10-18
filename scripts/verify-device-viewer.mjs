import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import {createDeviceModel,dimensions} from '../src/datacenter/device-model.js';
const ctx={window:{}};for(const name of ['catalog','bayface-accessories','pe-interfaces','bayface-model'])vm.runInNewContext(fs.readFileSync('web/'+name+'.js','utf8'),ctx);
const catalog=ctx.window.NOAH_CATALOG.filter(m=>!m.generic),accessories=ctx.window.NOAH_BAYFACE_ACCESSORIES,models=JSON.parse(fs.readFileSync('src/datacenter/devices.json'));
assert.equal(models.length,catalog.length+accessories.length);
for(const original of catalog){const m=models.find(m=>m.id===original.id);assert(m);assert.deepEqual(m.ports,JSON.parse(JSON.stringify(original.ports||[])));assert.equal(m.u,original.rackProfile.occupiedU);const p=ctx.window.NOAH_PE_INTERFACES.profiles[m.id];if(p)assert.deepEqual(m.interfacePreset,JSON.parse(JSON.stringify(p)));}
assert.equal(models.find(m=>m.id==='huawei-ne40e-x8a').interfacePreset.groups.flatMap(g=>g.names).length,109);
for(const m of models){for(const side of ['front','rear'])assert(m.images[side],m.id+' missing '+side);assert.equal(m.faceAudit.missingFaces.length,0,m.id+' face audit');const dim=dimensions(m);for(const n of ['width','height','depth'])assert(Number.isFinite(dim[n])&&dim[n]>0,m.id);const body=createDeviceModel({...m,images:{}},{detail:false});body.group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(body.group),size=bounds.getSize(new T.Vector3());assert(Math.abs(size.x-dim.width)<1e-6,m.id);assert(Math.abs(size.y-dim.height)<1e-6,m.id);assert(Math.abs(size.z-dim.depth)<1e-6,m.id);body.dispose();body.dispose();for(const image of Object.values(m.images)){assert(fs.existsSync('web/'+image.src));assert(image.width>0&&image.height>0,m.id+' image dimensions');assert(image.frame?.length===4,m.id+' cropped artwork');}}
const M=ctx.window.NOAH_BAYFACE_MODEL,known=new Set(catalog.map(m=>m.id));let data={title:'Test',racks:[{id:'r1',name:'42U',phase:'',units:42},{id:'r2',name:'24U',phase:'',units:24}],items:[]};
const make=(id,modelId,u,rackId='r1')=>({id,rackId,u,height:models.find(m=>m.id===modelId).u,kind:'device',modelId,label:id,notes:'',color:'#202831'});
data.items.push(make('large','huawei-ne40e-x8a',1));data.items.push(make('top','huawei-ne8000-x4',33));data=M.validate(data,known);
assert.equal(M.findSlot(data,'r1',10,20),22);assert.equal(M.findSlot(data,'r1',12,1),null);
const moved={...data.items[0],rackId:'r2',u:4};assert(M.fits(data,moved));assert(!M.fits(data,{...moved,u:5}));assert(!M.fits(data,{...moved,rackId:'r1',u:20}));
const accessory=accessories[0];data.items.push({id:'odf',rackId:'r2',u:1,height:accessory.units,kind:accessory.kind,accessoryId:accessory.id,modelId:'',label:accessory.name,notes:'',color:'#202831'});const restored=M.validate(JSON.parse(JSON.stringify(data)),known);assert.equal(restored.items.at(-1).accessoryId,accessory.id);
const original=JSON.stringify(data),next=JSON.parse(original);next.items=next.items.filter(i=>i.id!=='large');M.validate(next,known);assert.equal(JSON.stringify(data),original,'editing a snapshot cannot mutate original');
assert(!fs.readFileSync('src/datacenter/scene.js','utf8').includes('6.4,3.25'),'no overhead power feeder');
console.log('PASS 3D viewer: all 34 models + 6 accessories, identical interfaces and X8A preset, finite 3D bounds, cropped assets, multi-U placement, collision/full-rack rejection, cross-rack move, accessory round-trip and snapshot isolation.');
