import * as T from 'three';
import manifest from './museum-sprites.json' with {type:'json'};

// One shared image/source for all cards. Texture transforms choose a tile without
// loading models, individual pictures or per-exhibit GPU geometry.
export function createMuseumSpriteAtlas({invalidate=()=>{},loadingManager}={}){
 let disposed=false;const maps=[],materials=[];
 const plane=new T.PlaneGeometry(1,1).translate(0,.5,0);
 const atlas=new T.TextureLoader(loadingManager).load('assets/ayothaya/lab/exhibits.png',()=>{if(!disposed)invalidate();});
 atlas.colorSpace=T.SRGBColorSpace;atlas.generateMipmaps=false;atlas.minFilter=atlas.magFilter=T.LinearFilter;
 function sprite(id,width,maxHeight=Infinity){
  const f=manifest.frames[id];if(!f)throw Error('Missing museum image: '+id);
  const map=atlas.clone();map.repeat.set(f.width/manifest.width,f.height/manifest.height);map.offset.set(f.x/manifest.width,1-(f.y+f.height)/manifest.height);maps.push(map);
  // Clones made while the image is still loading share the same Source; mark
  // them ready on upload too, rather than depending on their creation timing.
  map.needsUpdate=true;
  const material=new T.MeshBasicMaterial({map,transparent:true,alphaTest:.08,depthWrite:true,toneMapped:false,side:T.DoubleSide});materials.push(material);
  // A fixed world-space cutout: equipment keeps its orientation when the player
  // moves the camera. Its transform changes only for explicit exhibit animation.
  const object=new T.Mesh(plane,material),height=Math.min(width/f.aspect,maxHeight);object.scale.set(height*f.aspect,height,1);object.name='Library image: '+id;object.userData.dynamic=true;object.userData.imageId=id;return object;
 }
 return {sprite,dispose(){if(disposed)return;disposed=true;for(const m of materials)m.dispose();for(const t of maps)t.dispose();plane.dispose();atlas.dispose();}};
}
