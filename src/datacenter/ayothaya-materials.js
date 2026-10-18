import * as T from 'three';
// These RO building textures already contain their painted shading. Applying PBR
// sun/normal shading again made the stores, inn and houses almost black.
const BUILDING=/아요타야.*(주점|도구점|무기점|여관|민가|사원|궁외벽)/;
export function normalizeAyothayaBuildings(root){
 const replacements=new Map();let meshes=0;
 root.traverse(o=>{if(!o.isMesh)return;let p=o,building=false;while(p){if(BUILDING.test(p.name)){building=true;break;}p=p.parent;}if(!building)return;meshes++;
  const convert=m=>{if(!replacements.has(m)){const n=new T.MeshBasicMaterial({name:m.name+' / RO painted color',map:m.map,color:m.color,side:m.side,alphaTest:m.alphaTest,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,vertexColors:m.vertexColors});replacements.set(m,n);}return replacements.get(m);};
  o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
 });
 // Maps remain shared; release only the replaced material programs.
 const retained=new Set();root.traverse(o=>{for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])retained.add(m);});
 for(const m of replacements.keys())if(!retained.has(m))m.dispose();
 return {meshes,materials:replacements.size};
}
