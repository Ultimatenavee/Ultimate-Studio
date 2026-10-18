// Offline placement audit: source geometry support, unobstructed sky, GAT connectivity.
const fs=require('node:fs'),{build}=require('esbuild'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await browser.newPage();await p.goto('http://127.0.0.1:8080/assets/ayothaya/navigation.json');await p.setContent('<body></body>');
 const code=await build({stdin:{resolveDir:process.cwd(),contents:`
 import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
 import {decodeNavigation,gridSample,CITY_SPAWN} from './src/datacenter/ayothaya-navigation.js';
 import {CITY_LANTERNS} from './src/datacenter/ayothaya-decor-layout.js';
 const nav=decodeNavigation(await (await fetch('/assets/ayothaya/navigation.json')).json());
 const g=(await new GLTFLoader().loadAsync('/assets/ayothaya/ayothaya.glb')).scene;g.scale.setScalar(.05);g.updateMatrixWorld(true);
 const floors=[];g.traverse(o=>{if(o.isMesh&&/terrain_|나무받침대/.test(o.name))floors.push(o);});
 const ray=new T.Raycaster();function floor(x,z){ray.set(new T.Vector3(x,20,z),new T.Vector3(0,-1,0));return ray.intersectObjects(floors,false)[0];}
 const n=nav.width*nav.height,walk=new Uint8Array(n),points=[];
 for(let i=0;i<n;i++){const x=(i%nav.width+.5-nav.width/2)*nav.cell,z=(nav.height/2-Math.floor(i/nav.width)-.5)*nav.cell;points[i]={x,z};walk[i]=[[0,0],[.1,0],[-.1,0],[0,.1],[0,-.1]].every(([dx,dz])=>[0,3,6].includes(gridSample(nav,x+dx,z+dz)?.type));}
 function reach(w){const seen=new Uint8Array(n),q=[gridSample(nav,CITY_SPAWN.x,CITY_SPAWN.z).index];seen[q[0]]=1;for(let k=0;k<q.length;k++)for(const d of [-1,1,-nav.width,nav.width]){const i=q[k],j=i+d;if(j<0||j>=n||Math.abs(d)===1&&Math.floor(j/nav.width)!==Math.floor(i/nav.width)||seen[j]||!w[j])continue;seen[j]=1;q.push(j);}return seen;}
 const baseline=reach(walk),targets=points.filter((v,i)=>baseline[i]),lamps=CITY_LANTERNS.map(p=>({...p}));
 const radius=p=>p.id==='L013'?.65:.36;
 function connected(p){const w=walk.slice();for(let i=0;i<n;i++){const v=points[i];if(lamps.concat(p).some(l=>Math.abs(v.x-l.x)<radius(l)+.1&&Math.abs(v.z-l.z)<radius(l)+.1))w[i]=0;}const r=reach(w);return w.every((v,i)=>!baseline[i]||!v||r[i]);}
 const candidates=[];
 for(let x=-30;x<=31;x+=.75)for(let z=-38;z<=29;z+=.75){if(!targets.some(p=>Math.hypot(p.x-x,p.z-z)<1.2))continue;const h=floor(x,z);if(!h||h.point.y<-.95)continue;
 if(![[.38,.38],[.38,-.38],[-.38,.38],[-.38,-.38]].every(([dx,dz])=>{const a=floor(x+dx,z+dz);return a&&Math.abs(a.point.y-h.point.y)<.09;}))continue;
 ray.set(new T.Vector3(x,20,z),new T.Vector3(0,-1,0));if(ray.intersectObject(g,true)[0]?.point.y-h.point.y>.3)continue;
 if(Math.abs(x-12)<2&&z<-25&&z>-31)continue;
 candidates.push({x,z,y:Math.round(h.point.y*10000)/10000});}
 const dist=(p,l)=>Math.hypot(p.x-l.x,p.z-l.z);let uncovered;
 for(let step=0;step<60;step++){
 uncovered=targets.filter(p=>Math.min(...lamps.map(l=>dist(p,l)))>7);
 if(!uncovered.length)break;
 const options=candidates.filter(p=>lamps.every(l=>dist(p,l)>4.5)).map(p=>({p,score:uncovered.reduce((n,t)=>n+(dist(p,t)<=7),0)})).filter(v=>v.score).sort((a,b)=>b.score-a.score);
 const chosen=options.find(v=>connected(v.p));if(!chosen)break;lamps.push(chosen.p);
 }
 window.result={lamps,added:lamps.length-CITY_LANTERNS.length,walkable:targets.length,covered:targets.length-uncovered.length,maxDistance:Math.max(...targets.map(p=>Math.min(...lamps.map(l=>dist(p,l))))),uncovered};
 `},bundle:true,format:'esm',write:false});
 await p.addScriptTag({type:'module',content:code.outputFiles[0].text});await p.waitForFunction(()=>window.result,null,{timeout:180000});
 const result=await p.evaluate(()=>window.result);fs.mkdirSync('artifacts/selected-lights',{recursive:true});fs.writeFileSync('artifacts/selected-lights/placement-plan.json',JSON.stringify(result,null,2));console.log({...result,lamps:result.lamps,uncovered:result.uncovered.length});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
