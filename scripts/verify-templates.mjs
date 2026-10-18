import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import worker from '../server/index.mjs';
const ctx={crypto};ctx.window=ctx;vm.createContext(ctx);for(const file of ['catalog.js','audience.js','port-resources.js','importer.js'])vm.runInContext(fs.readFileSync(new URL('../web/'+file,import.meta.url),'utf8'),ctx);
const data=ctx.NOAH_IMPORT.parse(fs.readFileSync(new URL('fixtures/acm-hops.txt',import.meta.url),'utf8')).data;
const project=ctx.NOAH_IMPORT.convert(data,ctx.NOAH_CATALOG).project;
project.links[0].routeOffset={x:80,y:-90};project.links[0].labelOffset={x:20,y:50};project.links[1].waypoints=[[500,500],[600,550]];
const database=new DatabaseSync(':memory:');for(const f of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')))database.exec(fs.readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
const DB={prepare(sql){const statement=database.prepare(sql);return {bind(...args){return {async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){return {meta:{changes:statement.run(...args).changes}};}};},async all(){return {results:statement.all()};}};}};
const env={DB,ASSETS:{fetch:()=>new Response('asset')}};
const request=(path='',method='GET',body=null,headers={})=>new Request('https://noah.example/api/templates'+path,{method,headers:{'Content-Type':'application/json',Origin:'https://noah.example',...headers},...(body?{body:JSON.stringify(body)}:{})});
let count=0;const check=async(name,fn)=>{await fn();count++;console.log('PASS '+name);};
const payload={id:crypto.randomUUID(),name:'Dual PE shared',project};
await check('Shared template writes and two independent requests see identical persisted projects',async()=>{
 assert.equal((await worker.fetch(request(),env)).status,200);
 const saved=await worker.fetch(request('','POST',payload),env);assert.equal(saved.status,201);
 const clientA=await (await worker.fetch(request(),env)).json(),clientB=await (await worker.fetch(request(),env)).json();assert.deepEqual(clientA,clientB);assert.equal(clientB.templates.length,1);assert.equal(clientB.templates[0].deviceCount,7);assert.equal(clientB.templates[0].linkCount,7);
 const loaded=await (await worker.fetch(request('/'+payload.id),env)).json();assert.equal(loaded.project.devices[0].sourceModel,'NE40E-X8A(V8)');assert.deepEqual(loaded.project.links[0].routeOffset,{x:80,y:-90});assert.deepEqual(loaded.project.links[0].labelOffset,{x:20,y:50});assert.deepEqual(loaded.project.links[1].waypoints,[[500,500],[600,550]]);assert(!JSON.stringify(loaded).includes('do-not-persist'));
});
await check('Retry is idempotent and mutations require the current revision',async()=>{
 assert.equal((await worker.fetch(request('','POST',payload),env)).status,200);assert.equal(database.prepare('SELECT COUNT(*) AS n FROM topology_templates').get().n,1);
 assert.equal((await worker.fetch(request('','POST',{...payload,name:'Overwrite'}),env)).status,409);assert.equal((await worker.fetch(request('/'+payload.id,'DELETE',{revision:99}),env)).status,409);
 assert.equal((await worker.fetch(request('/missing'),env)).status,404);
});
await check('Template API rejects cross-origin writes, wrong media, malformed or invalid topology and oversized input',async()=>{
 assert.equal((await worker.fetch(request('','POST',payload,{Origin:'https://other.example'}),env)).status,403);
 assert.equal((await worker.fetch(request('','POST',payload,{'Content-Type':'text/plain'}),env)).status,415);
 for(const bad of [{...project,devices:[]},{...project,links:[{...project.links[0],a:{device:'missing',port:'x'}}]},{...project,links:[{...project.links[0],labelOffset:{x:Infinity,y:0}}]},{...project,devices:project.devices.map((d,i)=>i?d:{...d,x:NaN})}])assert.equal((await worker.fetch(request('','POST',{...payload,id:crypto.randomUUID(),project:bad}),env)).status,422);
 const huge={...payload,name:'x',project:{...project,name:'x'.repeat(1024*1024)}};assert.equal((await worker.fetch(request('','POST',huge),env)).status,422);
 assert.equal(database.prepare('SELECT COUNT(*) AS n FROM topology_templates').get().n,1);
});
await check('Unavailable database returns a recoverable error and static paths still use the asset binding',async()=>{
 assert.equal((await worker.fetch(request(),{ASSETS:env.ASSETS})).status,503);
 assert.equal((await worker.fetch(request(),{DB:{prepare(){throw new Error('offline');}},ASSETS:env.ASSETS})).status,503);
 assert.equal(await (await worker.fetch(new Request('https://noah.example/catalog.js'),env)).text(),'asset');
});
await check('New QSFP profiles persist, reject shared-bank overlap and enforce model-specific optic restrictions',async()=>{
 const create=(model,id)=>{const m=ctx.NOAH_CATALOG.find(m=>m.id===model);return {id,modelId:model,hostname:m.model,x:100,y:100,powerOn:true,alarm:'normal',transceivers:{},supplies:Array.from({length:m.powerSlots},()=>({present:true,connected:true,mode:'AC',source:'Feed A'}))};};
 const a=create('hitachi-apresia15000-32xl-psr2','new-a'),b=create('huawei-s6730-h24x6c','new-b');a.transceivers={q25:'sr4'};b.transceivers={q1:'sr4'};
 const base={...project,id:'qsfp-test',devices:[a,b],links:[{id:'qsfp-link',a:{device:a.id,port:'q25'},b:{device:b.id,port:'q1'},speed:40000,cable:'mm',role:'main',shape:'curved',mtu:9216,vlanMode:'trunk'}],labels:[],groups:[]};
 assert.equal((await worker.fetch(request('','POST',{id:crypto.randomUUID(),name:'QSFP template',project:base}),env)).status,201);
 const overlap=JSON.parse(JSON.stringify(base));overlap.devices[0].transceivers.p26='lr';overlap.devices[1].transceivers.x1='lr';overlap.links.push({...overlap.links[0],id:'overlap-link',a:{device:a.id,port:'p26'},b:{device:b.id,port:'x1'},speed:10000,cable:'sm'});
 assert.equal((await worker.fetch(request('','POST',{id:crypto.randomUUID(),name:'Reject overlap',project:overlap}),env)).status,422);
 const forbidden=JSON.parse(JSON.stringify(base));forbidden.devices.forEach(d=>Object.keys(d.transceivers).forEach(k=>d.transceivers[k]='lr4'));forbidden.links[0].cable='sm';assert.equal((await worker.fetch(request('','POST',{id:crypto.randomUUID(),name:'Reject optic',project:forbidden}),env)).status,422);
 const c=create('huawei-s6730-h24x6c','new-c'),d=create('huawei-s6730-h24x6c','new-d');c.transceivers.q1='lr100';d.transceivers.q1='lr100';c.supplies[1].mode='DC';
 const hundred={...base,id:'hundred-test',devices:[c,d],links:[{...base.links[0],a:{device:c.id,port:'q1'},b:{device:d.id,port:'q1'},speed:100000,cable:'sm'}]};assert.equal((await worker.fetch(request('','POST',{id:crypto.randomUUID(),name:'100GE template',project:hundred}),env)).status,201);
});
await check('Website Templates preserve all Elements for independent visitors',async()=>{
 const shapes=['cloud','rect','roundRect','ellipse','diamond','hexagon','rightArrow','can'];const p=JSON.parse(JSON.stringify(project));p.labels=shapes.map((shape,i)=>({id:'element-'+i,kind:'shape',shape,x:i*250,y:100,width:220,height:140,text:i===0?'Internet':'',fontSize:18,color:'#eaf2ff',bold:false,align:'center',background:'#123957',backgroundOpacity:.8,stroke:'#38bdf8',strokeWidth:2}));
 p.labels[1].width=32;p.labels[1].height=32;
 const data={id:crypto.randomUUID(),name:'Shared Elements',project:p};assert.equal((await worker.fetch(request('','POST',data),env)).status,201);
 const readA=await (await worker.fetch(request('/'+data.id),env)).json(),readB=await (await worker.fetch(request('/'+data.id),env)).json();assert.deepEqual(readA.project.labels,p.labels);assert.deepEqual(readA,readB);
 const invalid=JSON.parse(JSON.stringify(data));invalid.id=crypto.randomUUID();invalid.project.labels[0].shape='script';assert.equal((await worker.fetch(request('','POST',invalid),env)).status,422);
});
await check('Template edits, shared favorites/tags and revision conflicts are durable; deletion cannot erase a newer revision',async()=>{
 const item={id:crypto.randomUUID(),name:'Editable template',project,tags:['DI','Dual PE'],favorite:true};
 assert.equal((await worker.fetch(request('','POST',item),env)).status,201);
 const first=await (await worker.fetch(request('/'+item.id),env)).json();assert.equal(first.revision,1);assert.deepEqual(first.tags,['DI','Dual PE']);assert.equal(first.favorite,true);
 const updated={...item,name:'Updated name',revision:1,project:structuredClone(project)};updated.project.devices[0].site='Telehouse';updated.project.links[0].fiberRoute='Route A';updated.project.groups.push({id:'review-group',name:'Rack A',deviceIds:[updated.project.devices[0].id],labelIds:[],color:'#38bdf8',collapsed:true});
 assert.equal((await worker.fetch(request('/'+item.id,'PUT',updated),env)).status,200);
 const second=await (await worker.fetch(request('/'+item.id),env)).json();assert.equal(second.revision,2);assert.equal(second.name,'Updated name');assert.equal(second.project.devices[0].site,'Telehouse');assert.equal(second.project.links[0].fiberRoute,'Route A');assert.equal(second.project.groups[0].collapsed,true);
 assert.equal((await worker.fetch(request('/'+item.id,'PUT',updated),env)).status,409);
 assert.equal((await worker.fetch(request('/'+item.id,'DELETE',{revision:1}),env)).status,409);
 assert.equal((await worker.fetch(request('/'+item.id,'DELETE',{revision:2}),env)).status,200);
 assert.equal((await worker.fetch(request('/'+item.id),env)).status,404);
 assert.equal((await worker.fetch(request('/'+payload.id,'DELETE',{revision:1},{Origin:'https://other.example'}),env)).status,403);
});
await check('Review snapshots and pinned comments persist across independent readers with validated targets and status',async()=>{
 const review={id:crypto.randomUUID(),name:'Design review',project};
 const req=(path='',method='GET',body)=>new Request('https://noah.example/api/reviews'+path,{method,headers:{'Content-Type':'application/json',Origin:'https://noah.example'},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await worker.fetch(req('','POST',review),env)).status,201);
 const comment={id:crypto.randomUUID(),target:'device:'+project.devices[0].id,author:'Reviewer',text:'ตรวจสอบเส้นทาง Backup'};
 assert.equal((await worker.fetch(req('/'+review.id+'/comments','POST',comment),env)).status,201);
 assert.equal((await worker.fetch(req('/'+review.id+'/comments','POST',comment),env)).status,201);
 const a=await (await worker.fetch(req('/'+review.id),env)).json(),b=await (await worker.fetch(req('/'+review.id),env)).json();assert.deepEqual(a,b);assert.equal(a.comments.length,1);assert.equal(a.comments[0].target,comment.target);assert.equal(a.comments[0].status,'pending');
 assert.equal((await worker.fetch(req('/'+review.id+'/comments/'+comment.id,'PATCH',{status:'approved'}),env)).status,200);
 assert.equal((await (await worker.fetch(req('/'+review.id),env)).json()).comments[0].status,'approved');
 assert.equal((await worker.fetch(req('/'+review.id+'/comments','POST',{...comment,id:crypto.randomUUID(),target:'device:missing'}),env)).status,422);
 assert.equal((await worker.fetch(req('/'+review.id+'/comments/'+comment.id,'PATCH',{status:'unknown'}),env)).status,405);
 const changed=structuredClone(project);changed.devices[0].hostname='After sharing';assert.notEqual(a.project.devices[0].hostname,changed.devices[0].hostname);
 assert(!JSON.stringify(a).includes('do-not-persist'));
});
await check('Bayface-only Templates preserve rack elevations for independent readers and reject overlap, invalid models or orphan rack items',async()=>{
 const p={...project,devices:[],links:[],labels:[],groups:[],bayface:{title:'Data Center Bayface',racks:[{id:'rack1',name:'RACK 1',room:'Main Hall',phase:'Phase 1',units:42}],items:[{id:'bay-device',rackId:'rack1',u:1,height:2,kind:'device',modelId:'cisco-1941',label:'Router A',serialNumber:'SN-TEST-001',notes:'',color:'#64748b'},{id:'bay-reserved',rackId:'rack1',u:20,height:10,kind:'reserved',modelId:'',label:'CAT',serialNumber:'',notes:'จองพื้นที่',color:'#64748b'}]}};
 const payload={id:crypto.randomUUID(),name:'Bayface only',project:p};assert.equal((await worker.fetch(request('','POST',payload),env)).status,201);
 const a=await (await worker.fetch(request('/'+payload.id),env)).json(),b=await (await worker.fetch(request('/'+payload.id),env)).json();assert.deepEqual(a,b);assert.deepEqual(a.project.bayface,p.bayface);
 for(const changes of [{u:2},{rackId:'missing'},{u:42},{modelId:'unknown'}]){const bad=structuredClone(p);Object.assign(bad.bayface.items[0],changes);if(changes.u===2)bad.bayface.items.push({...bad.bayface.items[0],id:'overlap'});assert.equal((await worker.fetch(request('','POST',{id:crypto.randomUUID(),name:'Invalid Bayface',project:bad}),env)).status,422);}
});
await check('ODF and AC/DC Templates retain accessory identities for independent readers and reject invalid profiles',async()=>{
 const p={...project,devices:[],links:[],labels:[],groups:[],bayface:{title:'POP power and fiber',racks:[{id:'rack-infra',name:'POP Rack',room:'',phase:'',units:42}],items:globalThis.NOAH_BAYFACE_ACCESSORIES.map((a,index)=>({id:'infra-'+index,rackId:'rack-infra',u:1+index*3,height:a.units,kind:a.kind,modelId:'',accessoryId:a.id,label:a.model,serialNumber:'',notes:'',color:'#202831'}))}};const payload={id:crypto.randomUUID(),name:'POP Infrastructure',project:p};assert.equal((await worker.fetch(request('','POST',payload),env)).status,201);const a=await (await worker.fetch(request('/'+payload.id),env)).json(),b=await (await worker.fetch(request('/'+payload.id),env)).json();assert.deepEqual(a.project.bayface,p.bayface);assert.deepEqual(a,b);for(const change of [{accessoryId:'unknown'},{accessoryId:'ac-apc-ap9565'},{accessoryId:undefined}]){const bad=structuredClone(p);Object.assign(bad.bayface.items[0],change);assert.equal((await worker.fetch(request('','POST',{id:crypto.randomUUID(),name:'Invalid accessory',project:bad}),env)).status,422);}
});
await check('Long project names persist in shared templates without truncation',async()=>{
 const p={...project,name:'โครงข่าย Service Provider / '.repeat(50)},id=crypto.randomUUID();assert.equal((await worker.fetch(request('','POST',{id,name:'Long project title',project:p}),env)).status,201);assert.equal((await (await worker.fetch(request('/'+id),env)).json()).project.name,p.name);
});
console.log('Verified '+count+' API behavior groups against real SQLite migrations.');database.close();
