'use strict';
(() => {
  const id=p=>p+'-'+crypto.randomUUID().slice(0,8),norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,''),text=(v,max=100)=>String(v??'').trim().slice(0,max);
  function parse(textValue){
    if(typeof textValue!=='string'||textValue.length>10*1024*1024)throw new Error('JSON ต้องมีขนาดไม่เกิน 10 MB');
    const input=textValue.replace(/^\uFEFF/,'');
    try{return {data:JSON.parse(input),repaired:false};}catch(first){
      // Some ACM exports contain literal line breaks inside quoted remarks.
      let quoted=false,escaped=false,fixed='';
      for(const c of input){
        if(quoted&&c.charCodeAt(0)<32){fixed+='\\u'+c.charCodeAt(0).toString(16).padStart(4,'0');continue;}
        fixed+=c;if(escaped){escaped=false;continue;}if(c==='\\'&&quoted){escaped=true;continue;}if(c==='"')quoted=!quoted;
      }
      try{return {data:JSON.parse(fixed),repaired:true};}catch{throw new Error('JSON ไม่ถูกต้อง: '+first.message);}
    }
  }
  const nodeKey=v=>text(v,160).toLowerCase().replace(/\([^)]*backup[^)]*\)/gi,'(backup)').replace(/\s+/g,' ').trim();
  const interfaceSpeed=v=>/400ge/i.test(v)?400000:/100ge|hundred/i.test(v)?100000:/40ge|forty/i.test(v)?40000:/25ge/i.test(v)?25000:/xgig|tengig|^ten|10ge|^te\d/i.test(v)?10000:/fast|^fa\d/i.test(v)?100:1000;
  const cliKey=v=>String(v||'').toLowerCase().replace(/\s+/g,'');
  function resolvePort(model,value,cable){
    if(globalThis.NOAH_PORT_RESOURCES)return globalThis.NOAH_PORT_RESOURCES.resolve(model,value,cable);
    const exact=model.ports.find(p=>p.kind==='network'&&p.id===value);if(exact)return exact;
    const candidates=model.ports.filter(p=>p.kind==='network'&&p.cliVerified===true&&[p.name,...(p.cliAliases||[])].some(n=>cliKey(n)===cliKey(value)));
    if(candidates.length===1)return candidates[0];
    const matching=cable?candidates.filter(p=>(p.connector==='RJ45')===(cable==='copper')):candidates;
    return matching.length===1?matching[0]:null;
  }
  function upgrade(input,catalog,warnings=[]){
    if(!input||!Array.isArray(input.devices)||!Array.isArray(input.links))return input;
    const project=JSON.parse(JSON.stringify(input)),models=new Map(catalog.map(m=>[m.id,m])),devices=new Map(project.devices.map(d=>[d.id,d]));
    for(const d of project.devices){const m=models.get(d.modelId);if(!m)continue;
      if(!m.generic&&!m.topologyOnly&&d.sourceModel){delete d.diagramOnly;d.importedPorts=[];d.transceivers||={};}
    }
    for(const link of project.links){
      let imported=false,valid=true;
      for(const side of ['a','b']){const ep=link[side],d=devices.get(ep?.device),m=models.get(d?.modelId);if(!d||!m)continue;
        if(!d.sourceModel||m.generic||m.topologyOnly)continue;imported=true;
        const raw=ep.port,p=resolvePort(m,raw,link.cable);
        if(!p){valid=false;if(typeof raw==='string'&&raw.trim()&&raw.length<=64){d.importedPorts||=[];if(!d.importedPorts.includes(raw))d.importedPorts.push(raw);}warnings.push(d.hostname+' · '+raw+' ยังจับคู่กับ CLI ของรุ่นนี้ไม่ได้ — เก็บชื่อจาก JSON');continue;}
        ep.port=p.id;
        if(!p.speeds.includes(link.speed)||((p.connector==='RJ45'||!!p.copperSfp&&link.cable==='copper')!==(link.cable==='copper')))valid=false;
        if(link.cable==='copper'&&p.copperSfp&&link.speed===1000)d.transceivers[p.id]='ct';
        if(link.cable!=='copper'&&p.connector!=='RJ45'){
          const form=p.connector==='QSFP28'?100000:p.connector==='QSFP+'?40000:p.connector==='SFP+'?10000:1000;
          const rate=p.speeds.includes(link.speed)?link.speed:Math.max(...p.speeds.filter(v=>v<=form));
          const opt=({1000:link.cable==='mm'?'sx':'lx',10000:link.cable==='mm'?'sr':'lr',40000:link.cable==='mm'?'sr4':'lr4',100000:link.cable==='mm'?'sr100':'lr100'})[rate];
          if(opt&&(!p.allowedOptics||p.allowedOptics.includes(opt)))d.transceivers[p.id]||=opt;else valid=false;
        }
      }
      if(imported&&!valid){link.designOnly=true;warnings.push((link.label||link.id)+' · ความเร็ว/สายหรือ Interface ยังไม่ยืนยันกับฮาร์ดแวร์ เป็นข้อมูลของแบบ');}
      else if(imported)delete link.designOnly;
    }
    return project;
  }
  function convert(data,catalog){
    if(data?.format==='noah-topology'){const warnings=[];return {project:upgrade(data,catalog,warnings),warnings,source:'NOAH Project'};}
    if(data?.layout==='absolute'||data?.nodes!==undefined||data?.edges!==undefined)return absolute(data,catalog);
    if(!data||typeof data!=='object'||!data.hops||typeof data.hops!=='object'||Array.isArray(data.hops))throw new Error('รองรับ Ultimate Topology studio Project หรือ JSON ที่มี hops.HOP1.start / end ตามไฟล์ ACM');
    const timestamp=new Date().toISOString(),info=data.serviceInfo||{},warnings=[],seenWarnings=new Set(),nodes=new Map(),edgeKeys=new Set(),pendingRedundancy=[];
    const warn=t=>{if(!seenWarnings.has(t)){seenWarnings.add(t);warnings.push(t);}};
    const project={format:'noah-topology',version:3,id:id('project'),name:text(info['Service Access Point Name']||info.CID||'Imported topology',Infinity),metadata:{createdAt:timestamp,updatedAt:timestamp},devices:[],links:[],labels:[],groups:[]};
    const known=catalog.filter(m=>!m.generic),cid=text(info.CID);
    function device(row,column,backup=false){
      if(!row||typeof row!=='object'||!text(row['Node Name']))throw new Error('แต่ละ HOP ต้องมี Node Name ของต้นทางและปลายทาง');
      const key=nodeKey(row['Node Name']);if(nodes.has(key))return nodes.get(key);
      const sourceModel=text(row.Model),sourceBrand=text(row.Brand,80);
      const model=known.find(m=>(norm(m.model)===norm(sourceModel)||(m.aliases||[]).some(alias=>norm(alias)===norm(sourceModel)))&&(!sourceBrand||norm(m.brand)===norm(sourceBrand)))||catalog.find(m=>m.generic);
      if(!model)throw new Error('ไม่พบโปรไฟล์สำหรับรุ่นจาก JSON');
      if(model.generic)warn('ไม่มีรุ่น '+sourceBrand+' '+sourceModel+' ใน Library — แสดงชื่อรุ่นจากไฟล์ ไม่มีภาพหรือสเปกแทนรุ่น');
      const d={id:id('d'),modelId:model.id,hostname:text(row['Node Name'],80),sourceModel,sourceBrand,diagramOnly:!!(model.generic||model.topologyOnly),x:80+column*440,y:backup?430:130,managementIP:text(row['MGMTv4 Main']||row['IP Loopback']),serial:'',asset:'',notes:'นำเข้าจาก ACM · ชื่อ Interface ตามไฟล์ ตรวจจับคู่กับโปรไฟล์รุ่นที่ยืนยันได้',role:text(row['Type Name'],80),powerOn:true,alarm:'normal',transceivers:{},supplies:Array.from({length:model.powerSlots},(_,i)=>({present:i<(model.defaultInstalledPowerSupplies??model.powerSlots),connected:i<(model.defaultInstalledPowerSupplies??model.powerSlots),mode:model.powerModes?.[0]||'AC',source:i?'Feed B':'Feed A'}))};
      // Keep different nodes at the same hop on separate rows.
      while(project.devices.some(p=>p.x===d.x&&Math.abs(p.y-d.y)<160))d.y+=300;
      project.devices.push(d);nodes.set(key,d);return d;
    }
    function connect(a,b,ar,br,role,label,portA=ar['Interface Name'],portB=br['Interface Name']){
      portA=text(portA,64);portB=text(portB,64);
      if(!portA||!portB){warn(label+' ไม่มี Interface ครบทั้งสองฝั่ง — ไม่สร้างสายที่เดา Interface');return;}
      const key=[a.id+':'+portA,b.id+':'+portB].sort().join('|');if(edgeKeys.has(key)||a.id===b.id)return;
      if(project.links.some(l=>[l.a,l.b].some(e=>{const device=e.device===a.id?a:e.device===b.id?b:null;if(!device)return false;const model=catalog.find(m=>m.id===device.modelId),raw=device===a?portA:portB;return globalThis.NOAH_PORT_RESOURCES.keys(model,e.port,l.cable).some(k=>globalThis.NOAH_PORT_RESOURCES.keys(model,raw).includes(k));}))){warn(label+' ใช้ Interface ซ้ำ — ข้ามสายที่ขัดแย้ง');return;}
      edgeKeys.add(key);
      const speeds=[interfaceSpeed(portA),interfaceSpeed(portB)],speed=Math.min(...speeds);
      if(speeds[0]!==speeds[1])warn(label+' ชื่อ Interface สื่อความเร็วไม่ตรงกัน — ความเร็วที่แสดงเป็นการอนุมานสำหรับแบบ โปรดตรวจสอบพอร์ตจริง');
      const vlan=text(ar['cVLAN Number']||br['cVLAN Number'],200);
      if(vlan&&!/^\d{1,4}(?:\s*[-,]\s*\d{1,4})*$/.test(vlan))throw new Error('รูปแบบ VLAN ใน '+label+' ไม่ถูกต้อง');
      const rawMTU=Number(ar.MTU||br.MTU),mtu=Number.isInteger(rawMTU)&&rawMTU>=576&&rawMTU<=65535?rawMTU:9216;
      const cableText=text(ar['Cable Type']||br['Cable Type']||ar['Media Type']||br['Media Type']).toLowerCase();
      const cable=/utp|copper|rj45/.test(cableText)||speed===100?'copper':/multimode|\bmm\b/.test(cableText)?'mm':'sm';
      if(!cableText)warn('ชนิดสายและความเร็วอนุมานจากชื่อ Interface — ตรวจสอบ UTP / Fiber หลังนำเข้าได้');
      project.links.push({id:id('l'),a:{device:a.id,port:portA},b:{device:b.id,port:portB},speed,cable,cid,vlans:vlan,label:text(label,150),role,shape:'curved',color:'',enabled:true,showLabel:true,vlanMode:/untagged/i.test(ar['Tagged Type']||br['Tagged Type']||'')?'access':'trunk',mtu});
    }
    const hops=Object.entries(data.hops).filter(([key])=>/^hop\d+$/i.test(key)).sort((a,b)=>Number(a[0].match(/\d+/)[0])-Number(b[0].match(/\d+/)[0]));
    if(!hops.length||hops.length>100)throw new Error('ไม่พบ HOP หรือจำนวน HOP มากเกินไป');
    for(const [name,h] of hops){
      const column=Number(name.match(/\d+/)[0])-1;
      for(const [route,branch] of [['main',h],['backup',h.backup]]){
        if(!branch?.start||!branch?.end){if(route==='main')throw new Error(name+' ไม่มี start / end');continue;}
        const a=device(branch.start,column,route==='backup'),b=device(branch.end,column+1,route==='backup');
        connect(a,b,branch.start,branch.end,route,name);
        for(const [row,d]of [[branch.start,a],[branch.end,b]])if(text(row['Redundant Node']))pendingRedundancy.push({row,d,name});
      }
    }
    for(const {row,d,name} of pendingRedundancy){
      const peer=nodes.get(nodeKey(row['Redundant Node']));if(!peer){warn(name+' ไม่พบ Redundant Node '+text(row['Redundant Node']));continue;}
      for(const n of [1,2])if(text(row['Int. Redundant '+n])&&text(row['Redundant Int. '+n]))connect(d,peer,row,{},'standard','Interconnect',row['Int. Redundant '+n],row['Redundant Int. '+n]);
    }
    // HOP numbers represent upstream-to-access order for this one service.
    // Interconnects are lateral links, so they do not impose an uplink constraint.
    let downstream=0;
    for(const [hop] of [...hops].reverse()){
      const links=project.links.filter(l=>l.label===hop);
      for(const l of links)if(l.speed<downstream){
        const previous=l.speed;l.speed=downstream;
        warn('Smart Uplink: '+hop+' '+(l.role==='backup'?'Backup':'Main')+' ปรับ '+previous/1000+'G → '+downstream/1000+'G เพื่อให้ Uplink ไม่น้อยกว่า Access ใน Hop ถัดไป — เป็นความเร็วตามเกณฑ์ของแบบ ไม่ใช่ค่าที่อ่านจากอุปกรณ์');
      }
      downstream=Math.max(downstream,...links.map(l=>l.speed));
    }
    if(project.devices.length>200||project.links.length>400)throw new Error('Topology เกินขนาดที่รองรับ');
    return {project:upgrade(project,catalog,warnings),warnings:[...new Set(warnings)],source:'ACM HOP JSON'};
  }
  function absolute(data,catalog){
    const fail=message=>{throw new Error(message);};
    if(data.layout!=='absolute'||!Array.isArray(data.nodes)||!Array.isArray(data.edges))fail('Absolute JSON ต้องมี layout: absolute, nodes และ edges');
    if(data.nodes.length>200||data.edges.length>400)fail('Topology รองรับไม่เกิน 200 nodes และ 400 edges');
    const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
    const string=(v,max=1000)=>typeof v==='string'&&v.length<=max?v:fail('ข้อความใน Absolute JSON ไม่ถูกต้อง');
    const idValue=v=>typeof v==='string'&&/^[\w-]{1,64}$/.test(v)?v:fail('ID ต้องเป็นตัวอักษร ตัวเลข _ หรือ - ไม่เกิน 64 ตัว');
    if(!number(data.viewBox?.width,1,100000)||!number(data.viewBox?.height,1,100000))fail('viewBox ต้องมี width และ height เป็นจำนวนบวก');
    const now=new Date().toISOString(),project={format:'noah-topology',version:3,id:id('project'),name:'Imported absolute topology',metadata:{createdAt:now,updatedAt:now},viewBox:{width:data.viewBox.width,height:data.viewBox.height},devices:[],links:[],labels:[],groups:[]},nodes=new Map(),edgeIds=new Set();
    const types={internet:'internet',cloud:'internet',pe:'pe',sw:'switch',switch:'switch',cpe:'router',router:'router',ap:'ap',firewall:'firewall'};
    for(const n of data.nodes){
      if(!n||typeof n!=='object')fail('Node ไม่ถูกต้อง');
      const nid=idValue(n.id);if(nodes.has(nid))fail('Node ID ซ้ำ: '+nid);
      const type=types[n.type];if(!type)fail('ไม่รองรับ node type: '+String(n.type));
      const model=catalog.find(m=>m.id==='external-'+type);if(!model)fail('ไม่พบไอคอนสำหรับ '+type);
      if(!number(n.position?.x,-100000,100000)||!number(n.position?.y,-100000,100000)||!number(n.size?.width,32,10000)||!number(n.size?.height,32,10000))fail('ตำแหน่งหรือขนาดของ '+nid+' ไม่ถูกต้อง (ขนาด 32–10000)');
      if(!Array.isArray(n.metadata)||n.metadata.length>100)fail('metadata ของ '+nid+' ต้องเป็น array ไม่เกิน 100 รายการ');
      const header=string(n.header??''),badge=string(n.badge??''),metadata=n.metadata.map(m=>{if(!m||typeof m!=='object')fail('metadata ไม่ถูกต้อง');return {k:string(m.k,100),v:string(m.v,1000)};});
      const details=[header,badge,...metadata.map(m=>m.k+': '+m.v)].filter(Boolean).join('\n');if(details.length>1000)fail('ข้อมูลของ '+nid+' ยาวเกิน 1000 ตัวอักษร');
      const d={id:nid,modelId:model.id,hostname:string(n.title,80),role:string(n.type,80),x:n.position.x,y:n.position.y,width:n.size.width,height:n.size.height,managementIP:metadata.find(m=>m.k.toLowerCase()==='ip')?.v||'',notes:details,serial:'',asset:'',diagramOnly:true,powerOn:true,alarm:'normal',supplies:[],transceivers:{},importedPorts:[]};
      if(d.managementIP.length>100)fail('IP ยาวเกิน 100 ตัวอักษร');
      nodes.set(nid,d);project.devices.push(d);
      if(details)project.labels.push({id:id('label'),kind:'text',text:details,x:d.x+d.width/2-140,y:d.y+d.height+32,width:280,fontSize:12,color:'#60738c',bold:false,align:'center',background:'transparent'});
    }
    for(const e of data.edges){
      if(!e||typeof e!=='object')fail('Edge ไม่ถูกต้อง');const eid=idValue(e.id);if(edgeIds.has(eid)||nodes.has(eid))fail('Edge ID ซ้ำ: '+eid);edgeIds.add(eid);
      const a=nodes.get(e.source),b=nodes.get(e.target);if(!a||!b||a===b)fail('Edge '+eid+' ต้องอ้างอิง source / target คนละ node ที่มีอยู่');
      const sides=['left','right','top','bottom'];if(!sides.includes(e.sourceSide)||!sides.includes(e.targetSide))fail('ด้านของ Edge ไม่ถูกต้อง');
      if(!['solid','dashed','dotted'].includes(e.lineStyle??'solid')||!['none','forward','backward','both'].includes(e.arrowStyle??'none')||!/^#[\da-f]{6}$/i.test(e.color??'#38bdf8'))fail('รูปแบบหรือสีของ Edge ไม่ถูกต้อง');
      const pa='edge-'+project.links.length+'-a',pb='edge-'+project.links.length+'-b';a.importedPorts.push(pa);b.importedPorts.push(pb);
      project.links.push({id:eid,a:{device:a.id,port:pa},b:{device:b.id,port:pb},sourceSide:e.sourceSide,targetSide:e.targetSide,lineStyle:e.lineStyle??'solid',arrowStyle:e.arrowStyle??'none',color:e.color??'#38bdf8',shape:'straight',designOnly:true,cable:'sm',speed:1000,cid:'',vlans:'',label:'',role:'standard',enabled:true,showLabel:false,vlanMode:'trunk',mtu:9216});
    }
    return {project,warnings:project.links.length?['เส้นจาก nodes/edges เป็นเส้นของแผนภาพ ไม่ได้ระบุพอร์ต ความเร็ว หรือชนิดสายจริง']:[],source:'Absolute nodes/edges JSON'};
  }
  window.NOAH_IMPORT={parse,convert,resolvePort,upgrade};
})();
