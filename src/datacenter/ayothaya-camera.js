import * as T from 'three';
// Frame the town landmarks tightly; a continuation of the original sea fills
// the viewport outside the rectangular map export. Whole-map overview is unchanged.
export function frameCityCover(camera,target){
 // View from the south: the ship in front, the temple on the horizon.
 // Widen portrait screens without changing the requested heading or pitch.
 target.set(6.5,0,8.6);camera.fov=36;
 const offset=new T.Vector3(0,20.21,46.225).multiplyScalar(Math.max(1,2/camera.aspect)),distance=offset.length();
 camera.position.copy(target).add(offset);
 camera.far=Math.max(600,distance*3);camera.updateProjectionMatrix();camera.lookAt(target);
 return distance;
}
// Fit every bounding-box corner at the current aspect, including tall/narrow viewports.
export function frameBounds(camera,target,min,max,margin=1.16){
 const center=new T.Vector3().addVectors(min,max).multiplyScalar(.5),direction=new T.Vector3(.48,.8,1).normalize();
 camera.position.copy(center).add(direction);camera.lookAt(center);camera.updateMatrixWorld(true);
 const inverse=camera.quaternion.clone().invert(),tanV=Math.tan(T.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect;
 let distance=1;
 for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z]){
  const p=new T.Vector3(x,y,z).sub(center).applyQuaternion(inverse);
  distance=Math.max(distance,p.z+Math.abs(p.x)*margin/tanH,p.z+Math.abs(p.y)*margin/tanV);
 }
 camera.position.copy(center).addScaledVector(direction,distance);camera.far=Math.max(600,distance*3);camera.updateProjectionMatrix();target.copy(center);
 return distance;
}
