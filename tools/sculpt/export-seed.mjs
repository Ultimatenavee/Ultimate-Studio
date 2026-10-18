// Development-only interchange: original native meshes, never reference photographs.
import fs from 'node:fs/promises';
import * as T from 'three';
import {buildBuddhaHall} from '../../src/datacenter/buddha-hall.js';
const handsOnly=process.argv.includes('--hands-only');
const hall=buildBuddhaHall({authoring:true}),central=hall.root.getObjectByName('vairocana-daibutsu');
central.updateMatrixWorld(true);const inverse=central.matrixWorld.clone().invert(),rows=[];
central.traverse(o=>{if(!o.isMesh||handsOnly&&!o.parent.userData.handPose)return;let part=o.name||'surface',p=o.parent;while(p&&p!==central){part=p.name+'/'+part;p=p.parent;}
 const base=inverse.clone().multiply(o.matrixWorld),instances=o.isInstancedMesh?o.count:1;
 for(let i=0;i<instances;i++){const m=base.clone();if(o.isInstancedMesh){const inst=new T.Matrix4();o.getMatrixAt(i,inst);m.multiply(inst);}const g=o.geometry.clone().applyMatrix4(m),a=g.attributes.position;
 rows.push({name:part+(instances>1?'-'+i:''),position:Array.from(a.array),index:g.index?Array.from(g.index.array):Array.from({length:a.count},(_,k)=>k),material:{color:o.material.color.toArray(),metalness:o.material.metalness,roughness:o.material.roughness},hand:o.parent.userData.handPose?{...o.parent.userData,matrix:base.toArray(),localPosition:Array.from(o.geometry.attributes.position.array)}:null});g.dispose();}
});
await fs.writeFile(process.argv[2]||'/tmp/buddha-seed.json',JSON.stringify(rows));hall.dispose();console.log(`Exported ${rows.length} original sculpt components.`);
