import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ROYAL_TEMPLE} from './royal-temple-layout.js';
import {installResearchQuarter} from './sirin-research-quarter.js';
const BASE='assets/sirin/royal-temple/';
export async function installRoyalExterior(city,decor){
 const root=(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(BASE+'japanese-keep.glb')).scene;
 const b=new T.Box3().setFromObject(root),size=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());
 // Authored in metres with one uniform scale. Align the foot of the original
 // stair with the existing portal; never stretch the building to fill a parcel.
 root.position.set(-c.x,-b.min.y,ROYAL_TEMPLE.frontZ-b.max.z);
 // Retire only this parcel's old INN and overlapping props (including instances).
 const result=installResearchQuarter(city,root,{replaces:['A02_Inn_016.002','A02_Inn_016.001'],buildings:[{id:'RoyalUbosot',parcel:ROYAL_TEMPLE.parcel}]});
 root.name='SIRIN Kamakura Hall / intact Amatsu keep';
 const dress=new T.Group();dress.name='Royal temple entrance furnishings';city.add(dress);
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#302b25';ctx.fillRect(0,0,1536,320);ctx.strokeStyle='#aa9061';ctx.lineWidth=12;ctx.strokeRect(8,8,1520,304);ctx.fillStyle='#ede1c9';ctx.textAlign='center';ctx.font='600 76px sans-serif';ctx.fillText('หอพระคามาคุระ · ศิริน',768,138);ctx.font='38px sans-serif';ctx.fillText('KAMAKURA BUDDHA HALL',768,235);
 const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;const plaque=new T.Mesh(new T.PlaneGeometry(4.8,1),new T.MeshBasicMaterial({map:tx}));plaque.position.set(-8,2.1,-108);dress.add(plaque);
 // Grounded information board beside the stair, not a floating facade sign.
 const timber=new T.MeshStandardMaterial({color:'#4a372b',roughness:.9});
 for(const x of [-10,-6]){const post=new T.Mesh(new T.BoxGeometry(.16,2.7,.16),timber);post.position.set(x,1.35,-108.12);dress.add(post);}
 const back=new T.Mesh(new T.BoxGeometry(4.9,1.1,.12),timber);back.position.set(-8,2.1,-108.08);dress.add(back);
 return {model:'Amatsu intact Japanese keep',width:size.x,height:size.y,depth:size.z,...result.stats()};
}
export async function createRoyalInterior(decor){
 const root=new T.Group();root.name='Amatsu Kamakura Buddha Hall';
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 const [interior,buddha,layout]=await Promise.all([
  loader.loadAsync(BASE+'amatsu-interior.glb?v=open-hall'),loader.loadAsync(BASE+'kamakura-buddha.glb'),
  fetch(BASE+'amatsu-interior-layout.json?v=open-hall').then(r=>{if(!r.ok)throw Error('Amatsu interior layout unavailable');return r.json();})
 ]);
 root.add(interior.scene);const ceiling=interior.scene.getObjectByName('AmatsuCeiling');
 if(!ceiling)throw Error('Amatsu ceiling group missing');
 interior.scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.map)m.map.anisotropy=4;}});
 const statue=buddha.scene,b=new T.Box3().setFromObject(statue),size=b.getSize(new T.Vector3()),centre=b.getCenter(new T.Vector3()),k=Math.min(7.8/size.y,7.4/size.x);
 statue.scale.multiplyScalar(k);statue.position.set(-centre.x*k,1.1-b.min.y*k,-11-centre.z*k);statue.name='Kamakura Buddha / 89999 triangles';root.add(statue);
 // Pair of paper pendants per bay; bounded light count keeps mobile rendering
 // equivalent to the previous hall. The altar receives its own warm key.
 for(const z of [-9,0,9]){const light=new T.PointLight('#ffe7c2',45,22,2);light.position.set(0,8.8,z);root.add(light);}
 const key=new T.PointLight('#ffe6c8',65,17,2);key.position.set(0,7,-5);root.add(key);
 await decor.portal(root,0,.03,15.6,2.8);
 return {root,ceiling,stats:()=>({theme:layout.theme,buddhaTriangles:89999,buddhaModel:'Kamakura Buddha',uploadedBuddha:true,chandeliers:0,columns:layout.columns,area:layout.area,props:layout.models,clearAisleWidth:layout.clearAisleWidth})};
}
