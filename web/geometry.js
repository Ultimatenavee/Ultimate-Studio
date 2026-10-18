'use strict';
(() => {
  const W = 244, H = 88;
  const shortPort = name => String(name).replace(/^TenGigabitEthernet/, 'Te').replace(/^GigabitEthernet/, 'Gi').replace(/^FastEthernet/, 'Fa');
  function imageFrame(model) {
    const d=model.displayDimensions||model.thumbnailDimensions||{width:1000,height:250};
    return {width:d.width,height:d.height,box:model.displayFrame||model.thumbnailFrame||[0,0,d.width,d.height]};
  }
  const deviceSize=(device,models)=>{const m=models?.get(device.modelId);return {width:device.width||m?.nodeWidth||W,height:device.height||m?.nodeHeight||H};};
  function deviceArtBounds(d,models,external=false){
    let m=models.get(d.modelId);if(external&&window.NOAH_AUDIENCE)m=window.NOAH_AUDIENCE.models([m])[0];m=window.NOAH_ICON_STYLE?.model(m,d,external)||m;
    const size=deviceSize(d,models);if(m.generic)return {x:d.x,y:d.y,...size};
    const f=imageFrame(m),fit=Math.min(Math.max(1,size.width-24)/f.box[2],Math.max(1,size.height-12)/f.box[3]),width=f.box[2]*fit,height=f.box[3]*fit;
    return {x:d.x+(size.width-width)/2,y:d.y+(size.height-height)/2,width,height};
  }
  function alignmentGuides(moving,targets,zoom=1){
    if(!moving.length||!targets.length)return [];
    const box={x:Math.min(...moving.map(b=>b.x)),y:Math.min(...moving.map(b=>b.y))};
    box.width=Math.max(...moving.map(b=>b.x+b.width))-box.x;box.height=Math.max(...moving.map(b=>b.y+b.height))-box.y;
    const scale=Math.max(.15,zoom),tolerance=6/scale,padding=16/scale,result=[];
    for(const [axis,size,cross,crossSize] of [['x','width','y','height'],['y','height','x','width']]){
      const candidates=[];
      for(const target of targets)for(const a of [0,.5,1])for(const b of [0,.5,1]){
        const position=target[axis]+target[size]*b,distance=Math.abs(box[axis]+box[size]*a-position);
        if(distance<=tolerance)candidates.push({position,distance,target});
      }
      candidates.sort((a,b)=>a.distance-b.distance);
      if(!candidates.length)continue;
      const best=candidates[0],matches=candidates.filter(c=>Math.abs(c.position-best.position)<.01);
      result.push({axis,position:best.position,aligned:best.distance*scale<=.75,
        start:Math.min(box[cross],...matches.map(c=>c.target[cross]))-padding,
        end:Math.max(box[cross]+box[crossSize],...matches.map(c=>c.target[cross]+c.target[crossSize]))+padding});
    }
    return result;
  }
  function edge(a,b,models,lane=0,shape='curved',offset={x:0,y:0},gap=40,waypoints=null,external=false){
    const as=deviceArtBounds(a,models,external),bs=deviceArtBounds(b,models,external);
    const dx=bs.x+bs.width/2-as.x-as.width/2,dy=bs.y+bs.height/2-as.y-as.height/2,horizontal=Math.abs(dx)>Math.abs(dy),shift=lane*gap;
    const forward=(horizontal?dx:dy)>=0;
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    const start=horizontal?[as.x+(forward?as.width-1:1),clamp(as.y+as.height/2+shift,as.y+1,as.y+as.height-1)]:[clamp(as.x+as.width/2+shift,as.x+1,as.x+as.width-1),as.y+(forward?as.height-1:1)];
    const end=horizontal?[bs.x+(forward?1:bs.width-1),clamp(bs.y+bs.height/2+shift,bs.y+1,bs.y+bs.height-1)]:[clamp(bs.x+bs.width/2+shift,bs.x+1,bs.x+bs.width-1),bs.y+(forward?1:bs.height-1)];
    const mx=horizontal?(start[0]+end[0])/2:(a.x+deviceSize(a,models).width/2+b.x+deviceSize(b,models).width/2)/2+shift,my=horizontal?(a.y+deviceSize(a,models).height/2+b.y+deviceSize(b,models).height/2)/2+shift:(start[1]+end[1])/2,ox=offset.x||0,oy=offset.y||0;
    const c1=horizontal?[mx+ox*4/3,start[1]+(my-(start[1]+end[1])/2+oy)*4/3]:[start[0]+(mx-(start[0]+end[0])/2+ox)*4/3,my+oy*4/3];
    const c2=horizontal?[mx+ox*4/3,end[1]+(my-(start[1]+end[1])/2+oy)*4/3]:[end[0]+(mx-(start[0]+end[0])/2+ox)*4/3,my+oy*4/3];
    let polyline=null,path=`M${start} C${c1} ${c2} ${end}`,x=mx+ox,y=my+oy;
    if(waypoints?.length){polyline=[start,...waypoints,end];const center=waypoints[Math.floor((waypoints.length-1)/2)];x=center[0];y=center[1];}
    else if(shape==='straight'){polyline=ox||oy||Math.abs(mx-(start[0]+end[0])/2)>.01||Math.abs(my-(start[1]+end[1])/2)>.01?[start,[x,y],end]:[start,end];}
    else if(shape==='orthogonal'){
      const sign=(horizontal?Math.sign(end[0]-start[0]):Math.sign(end[1]-start[1]))||1;
      polyline=horizontal?[start,[start[0]+sign*25,start[1]],[start[0]+sign*25,y],[x,y],[end[0]-sign*25,y],[end[0]-sign*25,end[1]],end]:[start,[start[0],start[1]+sign*25],[x,start[1]+sign*25],[x,y],[x,end[1]-sign*25],[end[0],end[1]-sign*25],end];
    }
    if(polyline)path=polyline.map((p,i)=>(i?'L':'M')+p.join(',')).join(' ');
    return {path,x,y,points:[start,c1,c2,end],polyline,horizontal};
  }
  const port = (models, d, id) => models.get(d.modelId).ports.find(p => p.id === id)||((models.get(d.modelId).topologyOnly||d.diagramOnly||d.importedPorts?.includes(id))&&typeof id==='string'&&id.trim()&&id.length<=64&&!/[\x00-\x1f]/.test(id)?{id,name:id,group:window.NOAH_PE_INTERFACES?.socket(d.modelId,id)||id,connector:'Interface สำหรับแบบ',kind:'diagram',unverified:true}:null);
  function linkText(link,ap,bp){
    const speed=link.speed>=1000?link.speed/1000+'G':link.speed+'M';
    const lines=link.displayText!==undefined?link.displayText.split('\n'):[(link.cid||link.label||(link.cable==='copper'?'UTP':'Fiber'))+' · '+speed,shortPort(ap.name)+' ↔ '+shortPort(bp.name)];
    if(link.displayText===undefined&&link.vlans)lines.push('VLAN '+link.vlans);return {lines,width:Math.max(170,...lines.map(t=>[...t].length*7.8+24)),height:20*lines.length};
  }
  function pathSamples(route){
    if(route.polyline)return route.polyline.flatMap((a,i,points)=>i===points.length-1?[a]:Array.from({length:9},(_,j)=>[a[0]+(points[i+1][0]-a[0])*j/9,a[1]+(points[i+1][1]-a[1])*j/9]));
    const p=route.points;return Array.from({length:25},(_,i)=>{const t=i/24,k=1-t;return [k*k*k*p[0][0]+3*k*k*t*p[1][0]+3*k*t*t*p[2][0]+t*t*t*p[3][0],k*k*k*p[0][1]+3*k*k*t*p[1][1]+3*k*t*t*p[2][1]+t*t*t*p[3][1]];});
  }
  function linkLayout(link, project, models) {
    const a = project.devices.find(d => d.id === link.a.device), b = project.devices.find(d => d.id === link.b.device);
    const ap = port(models, a, link.a.port), bp = port(models, b, link.b.port);
    const {lines,width,height}=linkText(link,ap,bp);
    const rank=l=>l.role==='main'?0:l.role==='backup'?2:1;
    const pair=[link.a.device,link.b.device].sort().join(':'),parallel=project.links.filter(l=>[l.a.device,l.b.device].sort().join(':')===pair).sort((a,b)=>rank(a)-rank(b)||a.id.localeCompare(b.id));
    const gap=(project.linkGridSize||20)*2;
    const route=l=>edge(project.devices.find(d=>d.id===l.a.device),project.devices.find(d=>d.id===l.b.device),models,parallel.findIndex(p=>p.id===l.id)-(parallel.length-1)/2,l.shape||'curved',l.routeOffset||{x:0,y:0},gap,l.waypoints,window.NOAH_AUDIENCE?.external(project));
    const portNumber=ep=>Number(String(ep.port).match(/(\d+)$/)?.[1]),peers=parallel.filter(l=>l.a.device!==l.b.device),stackPair=peers.length===2&&models.get(a.modelId)?.category==='switch'&&a.modelId===b.modelId&&/main/i.test(a.hostname+' '+b.hostname)&&/backup/i.test(a.hostname+' '+b.hostname)&&peers.every(l=>l.cable!=='copper');
    const ends=l=>l.a.device===a.id?[l.a,l.b]:[l.b,l.a],first=peers[0]&&ends(peers[0]),second=peers[1]&&ends(peers[1]);
    const stack=stackPair&&portNumber(first[0])===portNumber(second[1])&&portNumber(first[1])===portNumber(second[0])&&portNumber(first[0])!==portNumber(first[1]);
    const position=route(link);
    if(stack&&!link.waypoints?.length&&!link.routeOffset){const as=deviceArtBounds(a,models,window.NOAH_AUDIENCE?.external(project)),bs=deviceArtBounds(b,models,window.NOAH_AUDIENCE?.external(project)),top=a.y<=b.y?a:b,bottom=top===a?b:a,ts=top===a?as:bs,ns=top===a?bs:as,two=peers.map(l=>l.a.device===top.id?l.a:l.b).map(portNumber).sort((x,y)=>x-y),te=link.a.device===top.id?link.a:link.b,be=link.a.device===bottom.id?link.a:link.b,sx=ts.x+ts.width*(portNumber(te)===two[0] ? .38 : .62),ex=ns.x+ns.width*(portNumber(be)===two[0] ? .38 : .62),sy=ts.y+ts.height-1,ey=ns.y+1,stub=Math.min(28,Math.max(8,(ey-sy)/4)),points=[[sx,sy],[sx,sy+stub],[ex,ey-stub],[ex,ey]];Object.assign(position,{polyline:points,path:points.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '),x:(sx+ex)/2,y:(sy+ey)/2,horizontal:false,stack:true,endpointLabels:[{x:sx,y:sy-10,text:shortPort(port(models,top,te.port).name)},{x:ex,y:ey+22,text:shortPort(port(models,bottom,be.port).name)}]});if(link.displayText===undefined){lines.splice(0,lines.length,...(portNumber(te)===two[0]?['iStack']:[]));}}


    // Main/standard labels sit above their cables; Backup labels sit below.
    // Stack only labels on the same side, keeping the full text clear of paths.
    const backup=link.role==='backup';
    const labels=parallel.filter(l=>l.showLabel!==false&&(l.role==='backup')===backup).map(l=>{const ad=project.devices.find(d=>d.id===l.a.device),bd=project.devices.find(d=>d.id===l.b.device);return {id:l.id,...linkText(l,port(models,ad,l.a.port),port(models,bd,l.b.port))};});
    if(!labels.length)labels.push({id:link.id,width,height});
    const maxWidth=Math.max(...labels.map(l=>l.width)),totalHeight=labels.reduce((n,l)=>n+l.height,0)+(labels.length-1)*12;
    const routes=parallel.map(route),samples=routes.flatMap(pathSamples);
    const index=Math.max(0,labels.findIndex(l=>l.id===link.id));
    let labelX,labelY;
    if(position.horizontal){
      const crossed=samples.filter(p=>Math.abs(p[0]-position.x)<=maxWidth/2+12);
      const boundary=backup?Math.max(position.y,...crossed.map(p=>p[1])):Math.min(position.y,...crossed.map(p=>p[1]));
      labelX=position.x;labelY=(backup?boundary+12:boundary-totalHeight-12)+labels.slice(0,index).reduce((n,l)=>n+l.height+12,0);
    }else{
      const left=link.role==='main';
      labelX=left?Math.min(position.x,...samples.map(p=>p[0]))-width/2-14:Math.max(position.x,...samples.map(p=>p[0]))+width/2+14;
      labelY=position.y-totalHeight/2+labels.slice(0,index).reduce((n,l)=>n+l.height+12,0);
    }
    if(position.stack){labelX=position.x;labelY=position.y-10;}
    labelX+=link.labelOffset?.x||0;labelY+=link.labelOffset?.y||0;

    return { ...position, width, height, labelX, labelY, lines, a, b, ap, bp };
  }
  function labelSize(label) {
    const lines = label.text.split('\n'), size = label.fontSize || 18;
    return { width: label.width||Math.max(50, ...lines.map(t => [...t].length * size * .64 + 18)), height:label.height||lines.length * size * 1.45 + 12, lines };
  }
  function groupBounds(group,project,models){const items=[...project.devices.filter(d=>group.deviceIds.includes(d.id)).map(d=>({...d,...deviceSize(d,models)})),...(project.labels||[]).filter(l=>group.labelIds.includes(l.id)).map(l=>({...l,...labelSize(l)}))];if(!items.length)return null;const x=Math.min(...items.map(i=>i.x))-24,y=Math.min(...items.map(i=>i.y))-35;return {x,y,width:Math.max(...items.map(i=>i.x+i.width))-x+24,height:Math.max(...items.map(i=>i.y+i.height))-y+24};}
  function groupTitle(group,project,models,box=groupBounds(group,project,models)){
    if(!box)return null;
    const title={x:box.x+14,y:box.y-13,width:Math.max(60,[...group.name].length*8+18),height:26};
    const labels=(project.labels||[]).filter(l=>!group.labelIds.includes(l.id)).map(l=>{const size=labelSize(l);return {x:l.x,y:l.y,width:l.kind==='region'?Math.max(...size.lines.map(t=>[...t].length*l.fontSize*.64+18)):size.width,height:l.kind==='region'?size.lines.length*l.fontSize*1.45+12:size.height};});
    for(let i=0;i<6&&labels.some(l=>title.x<l.x+l.width&&title.x+title.width>l.x&&title.y<l.y+l.height&&title.y+title.height>l.y);i++)title.y-=30;
    return title;
  }
  function linkStyle(link,project,models){const active=ep=>{const d=project.devices.find(d=>d.id===ep.device);return d?.powerOn&&(models.get(d.modelId).topologyOnly||d.supplies.some(s=>s.present&&s.connected));},up=active(link.a)&&active(link.b),backup=link.role==='backup';return {up,backup,color:link.enabled===false?'#718198':!up?'#ef4444':link.color||(backup?'#f59e0b':link.cable==='copper'?'#19b99a':'#38bdf8'),dash:link.enabled===false||!up?'6 6':backup?'10 7':''};}
  function bounds(project, models) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const add = (x,y,w,h) => { minX = Math.min(minX,x); minY = Math.min(minY,y); maxX = Math.max(maxX,x+w); maxY = Math.max(maxY,y+h); };
    for (const d of project.devices) {const s=deviceSize(d,models);add(d.x,d.y,s.width,s.height+28);}
    for (const l of project.links) { const g = linkLayout(l,project,models);for(const p of pathSamples(g))add(p[0],p[1],1,1);if(l.showLabel!==false)add(g.labelX-g.width/2,g.labelY,g.width,g.height); }
    for (const l of project.labels || []) { const b = labelSize(l); add(l.x,l.y,b.width,b.height); }
    for(const g of project.groups||[]){const b=groupBounds(g,project,models);if(b){add(b.x,b.y,b.width,b.height);const t=groupTitle(g,project,models,b);add(t.x,t.y,t.width,t.height);}}
    if (!Number.isFinite(minX)) return { x:0,y:0,width:800,height:500 };
    return { x:minX-50,y:minY-50,width:Math.max(500,maxX-minX+100),height:Math.max(320,maxY-minY+100) };
  }
  // Cluster nearby center lines without cascading across distant rows/columns.
  function smartAlign(devices,models,tolerance=20){
    const result=devices.map(d=>({...d,...deviceSize(d,models)}));
    for(const [axis,size] of [['x','width'],['y','height']]){
      const sorted=[...result].sort((a,b)=>(a[axis]+a[size]/2)-(b[axis]+b[size]/2));
      for(let i=0;i<sorted.length;){let j=i+1;const anchor=sorted[i][axis]+sorted[i][size]/2;
        while(j<sorted.length&&sorted[j][axis]+sorted[j][size]/2-anchor<=tolerance)j++;
        if(j-i>1){const group=sorted.slice(i,j),center=group.reduce((sum,d)=>sum+d[axis]+d[size]/2,0)/group.length;for(const d of group)d[axis]=center-d[size]/2;}
        i=j;
      }
    }
    return result.map(({id,x,y})=>({id,x,y}));
  }
  window.NOAH_GEOMETRY = { deviceArtBounds,smartAlign,W,H,shortPort,edge,linkLayout,labelSize,bounds,imageFrame,deviceSize,alignmentGuides,groupBounds,groupTitle,linkStyle,port,pathSamples };
})();
