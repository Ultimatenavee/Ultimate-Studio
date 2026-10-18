import assert from 'node:assert/strict';
import * as T from 'three';
import {buildJapaneseTemple,JAPANESE_TEMPLE} from '../src/datacenter/japanese-temple.js';

const temple=buildJapaneseTemple(),root=temple.root;
root.updateMatrixWorld(true);
const bounds=new T.Box3().setFromObject(root),features=new Set(),geometries=new Set(),materials=new Set(),textures=new Set();
assert.equal(root.position.x,-18);assert.equal(root.position.z,-43.5);
assert(bounds.min.y<=-.309&&bounds.min.y>=-.311,'Stone podium meets garden ground');
assert(bounds.max.y>16&&bounds.max.y<=16.6,'Tiered roof and ridge ornaments retain their skyline');
assert(bounds.max.z< -33,'All temple steps stay behind the north garden fence');
assert(bounds.min.z>=-52,'Temple fits the high drone overview frame');
root.traverse(o=>{
  for(const f of o.userData.features||[])features.add(f);
  if(o.geometry){
    geometries.add(o.geometry);
    for(const attribute of Object.values(o.geometry.attributes))for(const value of attribute.array)assert(Number.isFinite(value),'Finite native temple geometry');
    if(o.isInstancedMesh)for(const value of o.instanceMatrix.array)assert(Number.isFinite(value),'Finite instance transforms');
  }
  if(o.userData.templeLod)for(const g of Object.values(o.userData.templeLod))geometries.add(g);
  for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);if(m.map)textures.add(m.map);}
});
for(const key of ['stone-stairs','round-timber-columns','bracket-arms','door-lattice','upper-window-lattice','canopy-tile-ribs'])assert(features.has(key),key+' modeled');
for(const name of ['lower-eaves-curved-tile-surface','upper-roof-curved-tile-surface']){
  const roof=root.getObjectByName(name),p=roof.geometry.attributes.position;
  let min=Infinity,max=-Infinity;for(let i=0;i<p.count;i++){min=Math.min(min,p.getY(i));max=Math.max(max,p.getY(i));}
  assert(max-min>2,'Roof uses a curved three-dimensional surface');
}
const triangles=()=>{let total=0;root.traverse(o=>{if(o.geometry&&o.visible)total+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});return total;};
const budgets={low:120000,performance:150000,balanced:180000,high:260000,ultra:260000},counts={};
for(const [q,max]of Object.entries(budgets)){temple.quality(q);counts[q]=triangles();assert(counts[q]<max,q+' geometry budget');assert.equal(root.position.z,-43.5);}
assert(counts.low<counts.performance&&counts.performance<counts.balanced&&counts.balanced<counts.high,'LOD retains spatial coverage with progressively detailed roof ribs');
assert(temple.stats().templeDraws<=28,'Repeated timbers/tiles are batched');
assert.equal(JAPANESE_TEMPLE.decorative,false);
// Cameras on the garden side see the facade before the closed hall core.
const origin=new T.Vector3(-29,3,-28),direction=new T.Vector3(0,0,-1),ray=new T.Raycaster(origin,direction),hits=ray.intersectObject(root,true);
assert(hits.length>0&&hits[0].point.z>-39,'Facade faces the garden (+Z)');
let disposedGeometries=0,disposedMaterials=0,disposedTextures=0;
for(const g of geometries)g.addEventListener('dispose',()=>disposedGeometries++);
for(const m of materials)m.addEventListener('dispose',()=>disposedMaterials++);
for(const t of textures)t.addEventListener('dispose',()=>disposedTextures++);
temple.dispose();temple.dispose();
assert.equal(disposedGeometries,geometries.size);assert.equal(disposedMaterials,materials.size);assert.equal(disposedTextures,textures.size);
console.log('Japanese temple: finite detailed geometry, north-fence separation, facade orientation, LOD budgets and one-time disposal passed',counts);
