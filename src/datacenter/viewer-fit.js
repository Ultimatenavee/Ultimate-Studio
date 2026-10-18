import * as T from 'three';

// Fit actual geometry, including cable assemblies, into the unobstructed viewport.
export function fitDeviceCamera(camera,bounds,direction,{width=800,height=600,top=20,bottom=20,left=20,right=20}={}){
 const center=bounds.getCenter(new T.Vector3()),dir=direction.clone().normalize();
 const horizontal=new T.Vector3().crossVectors(camera.up,dir).normalize();
 if(horizontal.lengthSq()<.000001)horizontal.set(1,0,0);
 const vertical=new T.Vector3().crossVectors(dir,horizontal).normalize();
 const tanV=Math.tan(camera.fov*Math.PI/360),tanH=tanV*camera.aspect;
 const usableX=Math.max(.01,1-(left+right)/width),usableY=Math.max(.01,1-(top+bottom)/height);
 let distance=.01;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const q=new T.Vector3(x,y,z).sub(center),depth=q.dot(dir);
  distance=Math.max(distance,depth+Math.abs(q.dot(horizontal))/(tanH*usableX*.96),depth+Math.abs(q.dot(vertical))/(tanV*usableY*.96));
 }
 camera.setViewOffset(width,height,(right-left)/2,(bottom-top)/2,width,height);
 camera.position.copy(center).addScaledVector(dir,distance);
 camera.near=Math.max(.0001,Math.min(.005,distance/100));camera.far=Math.max(30,distance*4);
 camera.updateProjectionMatrix();camera.lookAt(center);camera.updateMatrixWorld(true);
 return center;
}
