import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ROYAL_TEMPLE} from './royal-temple-layout.js';
import {installResearchQuarter} from './sirin-research-quarter.js';
const BASE='assets/sirin/royal-temple/';
export async function installRoyalExterior(city,decor){
 const root=(await new GLTFLoader().loadAsync(BASE+'exterior.glb')).scene;
 const b=new T.Box3().setFromObject(root),size=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3()),scale=ROYAL_TEMPLE.depth/size.z;
 root.scale.multiplyScalar(scale);root.position.set(-c.x*scale,-b.min.y*scale,ROYAL_TEMPLE.z-c.z*scale);
 // Retire only this parcel's old INN and overlapping props (including instances).
 const result=installResearchQuarter(city,root,{replaces:['A02_Inn_016.002','A02_Inn_016.001'],buildings:[{id:'RoyalUbosot',parcel:ROYAL_TEMPLE.parcel}]});
 root.name='SIRIN Royal Ubosot / Ayothaya sanctuary';
 const dress=new T.Group();dress.name='Royal temple entrance furnishings';city.add(dress);
 const gold=new T.MeshStandardMaterial({color:'#d3b775',roughness:.6,metalness:.35});
 const beam=(w,h,d,x,y,z)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),gold);mesh.position.set(x,y,z);dress.add(mesh);};
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#372e22';ctx.fillRect(0,0,1536,320);ctx.strokeStyle='#d9bc76';ctx.lineWidth=12;ctx.strokeRect(8,8,1520,304);ctx.fillStyle='#f5dfaa';ctx.textAlign='center';ctx.font='600 76px sans-serif';ctx.fillText('พระอุโบสถหลวงศิริน',768,138);ctx.font='38px sans-serif';ctx.fillText('SIRIN  /  ROYAL UBOSOT',768,235);
 const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;const plaque=new T.Mesh(new T.PlaneGeometry(11.5,2.4),new T.MeshBasicMaterial({map:tx}));plaque.position.set(0,12,-110.92);dress.add(plaque);
 for(const x of [-5.25,5.25]){beam(.18,10.4,.18,x,5.2,-110.94);beam(.7,.24,.6,x,.12,-110.94);}beam(10.7,.18,.18,0,10.4,-110.94);
 await decor.props(dress,[-7.5,7.5].flatMap(x=>[{id:'plant',x,z:-109,width:2,height:3.1},{id:'urn',x,z:-112.5,width:1.2,height:1.8}]));
 return {width:size.x*scale,height:size.y*scale,depth:size.z*scale,...result.stats()};
}
export async function createRoyalInterior(decor){
 const root=new T.Group();root.name='Royal Ubosot Interior';const ceiling=new T.Group();root.add(ceiling);
 const loader=new GLTFLoader(),textureLoader=new T.TextureLoader();
 const [buddha,altar,chandelier,wood,mural,carpet,stone]=await Promise.all([
  loader.loadAsync(BASE+'buddha.glb'),loader.loadAsync(BASE+'altar.glb'),loader.loadAsync('assets/ayothaya/light-catalog/L241.glb'),
  ...['assets/ayothaya/decor/temple-wood.png','assets/ayothaya/decor/temple-mural.png','assets/ayothaya/decor/temple-carpet.png'].map(url=>textureLoader.loadAsync(url)),
  textureLoader.loadAsync('assets/ayothaya/decor/temple-wood.png')
 ]);
 for(const t of [wood,mural,carpet,stone]){t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;}
 wood.wrapS=wood.wrapT=T.RepeatWrapping;wood.repeat.set(12,17);stone.wrapS=stone.wrapT=T.RepeatWrapping;stone.repeat.set(2,4);carpet.wrapT=T.RepeatWrapping;carpet.repeat.set(1,8);mural.repeat.set(.5,.5);mural.offset.set(.5,0);
 const mat=(color,map=null,metalness=0)=>new T.MeshStandardMaterial({color,map,roughness:metalness?.48:.85,metalness});
 const ivory=mat('#f4e3bd',stone),gold=mat('#c8a458',null,.5),red=mat('#773a31'),dark=mat('#302522'),floor=mat('#e7d5ac',wood),rug=mat('#c9966e',carpet);
 function box(w,h,d,x,y,z,m,parent=root){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 function fitted(source,height,x,y,z,width=Infinity){const o=source.clone(true),b=new T.Box3().setFromObject(o),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3()),k=Math.min(height/s.y,width/s.x);o.scale.multiplyScalar(k);o.position.set(x-c.x*k,y-b.min.y*k,z-c.z*k);root.add(o);return o;}
 box(24,.24,34,0,-.12,0,floor);
 box(24,11,.35,0,5.5,-17,ivory);for(const x of [-12,12])box(.35,11,34,x,5.5,0,ivory);
 for(const x of [-7,7])box(10,11,.35,x,5.5,17,ivory);box(4,6,.35,0,8,17,ivory);
 box(24,.25,34,0,11,0,dark,ceiling);
 for(const z of [-15,-9,-3,3,9,15]){box(24,.2,.3,0,10.6,z,gold,ceiling);box(22,.12,.12,0,10.4,z,red,ceiling);}
 for(const x of [-10,-5,0,5,10])box(.16,.18,34,x,10.75,0,gold,ceiling);
 for(const x of [-11.75,11.75])for(const y of [.24,1.1,8.9,10.1])box(.14,.14,33.6,x,y,0,gold);
 for(const y of [.24,1.1,8.9,10.1])box(23.6,.14,.14,0,y,-16.75,gold);
 for(const x of [-8.4,8.4])for(const z of [-12,-6,0,6,12]){
  box(.7,9.6,.7,x,5.3,z,red);for(const [y,w,h]of [[.2,1.15,.4],[.65,.95,.4],[1,.82,.18],[9.7,.86,.35],[10,1.2,.3]])box(w,h,w,x,y,z,gold);
  for(const dx of [-.36,.36])box(.025,8.3,.025,x+dx,5.3,z+.36,gold);
 }
 // Framed original RO murals, mounted on both walls and behind the altar.
 const painting=new T.MeshBasicMaterial({map:mural,color:'#ead4aa'});
 for(const side of [-1,1])for(const z of [-12,-6,0,6,12]){box(.14,4.65,3.8,side*11.72,5,z,gold);const p=new T.Mesh(new T.PlaneGeometry(3.5,4.35),painting);p.position.set(side*11.61,5,z);p.rotation.y=-side*Math.PI/2;root.add(p);box(.22,.3,4.1,side*11.65,2.5,z,red);}
 box(12.5,9,.15,0,5.4,-16.68,red);for(const x of [-6.15,6.15])box(.17,9,.15,x,5.4,-16.55,gold);
 // Three stable dais tiers support the uploaded seated Buddha; visitors stay below.
 box(11.4,.35,9,0,.175,-11,red);box(10.8,.22,8.4,0,.46,-11,gold);box(10.2,.4,7.8,0,.77,-11,red);box(9.6,.13,7.2,0,1.035,-11,gold);
 const statue=fitted(buddha.scene,7.8,0,1.1,-11,7.4);statue.name='User Buddha / 90000 triangles';
 fitted(altar.scene,1.3,0,.03,-5.5,3.2);
 box(4.8,.025,16,0,.025,4.1,rug);for(const x of [-2.38,2.38])box(.055,.03,16,x,.035,4.1,gold);
 for(const x of [-4.8,4.8])for(const z of [-2.5,1,4.5,8]){box(1.1,.09,.9,x,.06,z,red);box(1.13,.025,.93,x,.025,z,gold);}
 // Real Ayothaya chandeliers, each attached to the coffered ceiling.
 for(const z of [-9,0,9]){fitted(chandelier.scene,1.7,0,8,z,2.5);box(.045,1.3,.045,0,10.35,z,gold,ceiling);const light=new T.PointLight('#ffdc9b',45,21,2);light.position.set(0,8.4,z);root.add(light);}
 const key=new T.PointLight('#ffe2b8',65,17,2);key.position.set(0,7,-5);root.add(key);
 await decor.props(root,[...[-5,5].flatMap(x=>[{id:'urn',x,z:-7.8,y:1.1,width:.8,height:1.35},{id:'plant',x,z:-14,y:1.1,width:1,height:2.2},{id:'brazier',x,z:-5.2,y:0,width:.7,height:1.3}]),...[-10.4,10.4].flatMap(x=>[-14.6,14].map(z=>({id:'plant',x,z,width:1.2,height:2.1})))]);
 await decor.portal(root,0,.03,15.6,2.8);
 return {root,ceiling,stats:()=>({buddhaTriangles:90000,uploadedBuddha:true,chandeliers:3,columns:10,area:24*34})};
}
