import * as T from 'three';

// Front elevation from the reference: Museum left, racks right, pond in front,
// timber temple behind. The garden's outer fence may extend beyond wide screens.
export const OVERVIEW_BOUNDS={minX:-53,maxX:27,minZ:-53,maxZ:34};
const framingBoxes=[[-43,9,0,5.5,-12,12],[-44,12,-.31,6.5,15,29.5],[-36.4,.4,0,17,-52,-33.2]];
export function campusOverviewPose(aspect=16/9,fov=46){
 const target=new T.Vector3(-17,2,-3),direction=new T.Vector3(0,Math.sin(.28),Math.cos(.28));
 const right=new T.Vector3(1,0,0),up=new T.Vector3().crossVectors(direction,right),tanV=Math.tan(fov*Math.PI/360),tanH=tanV*Math.max(.25,aspect);
 let distance=74;
 for(const [x0,x1,y0,y1,z0,z1]of framingBoxes)for(const x of [x0,x1])for(const y of [y0,y1])for(const z of [z0,z1]){
  const point=new T.Vector3(x,y,z).sub(target);
  distance=Math.max(distance,point.dot(direction)+Math.abs(point.dot(right))/(tanH*.95),point.dot(direction)+Math.abs(point.dot(up))/(tanV*.85));
 }
 return {position:target.clone().addScaledVector(direction,distance),target};
}

// Ground-plane movement follows the current view, including a manually rotated
// camera. Move camera and orbit center together to preserve elevation and zoom.
const forwardAxis=new T.Vector3(),rightAxis=new T.Vector3(),upAxis=new T.Vector3(0,1,0);
export function panOverview(camera,target,forward,strafe,dt,fast=false,bounds=OVERVIEW_BOUNDS){
 const length=Math.hypot(forward,strafe);if(!length)return false;
 camera.getWorldDirection(forwardAxis);forwardAxis.y=0;
 if(forwardAxis.lengthSq()<1e-8)forwardAxis.set(0,0,-1);else forwardAxis.normalize();
 rightAxis.crossVectors(forwardAxis,upAxis).normalize();
 const step=T.MathUtils.clamp(camera.position.distanceTo(target)*.12,2.4,20)*Math.min(Math.max(dt,0),.05)*(fast?3:1)/Math.max(1,length);
 let dx=(forwardAxis.x*forward+rightAxis.x*strafe)*step,dz=(forwardAxis.z*forward+rightAxis.z*strafe)*step;
 dx=T.MathUtils.clamp(target.x+dx,bounds.minX,bounds.maxX)-target.x;
 dz=T.MathUtils.clamp(target.z+dz,bounds.minZ,bounds.maxZ)-target.z;
 if(!dx&&!dz)return false;
 camera.position.x+=dx;camera.position.z+=dz;target.x+=dx;target.z+=dz;return true;
}
