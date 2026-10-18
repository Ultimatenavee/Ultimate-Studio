import assert from 'node:assert/strict';
import * as T from 'three';
import {campusOverviewPose,panOverview,OVERVIEW_BOUNDS} from '../src/datacenter/overview-camera.js';

const framingBoxes=[[-43,9,0,5.5,-12,12],[-44,12,-.31,6.5,15,29.5],[-36.4,.4,0,17,-52,-33.2]];
for(const aspect of [.4,.55,.75,4/3,16/9,2.5,3.5]){
 const pose=campusOverviewPose(aspect),camera=new T.PerspectiveCamera(46,aspect,.05,1000);
 camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
 for(const [x0,x1,y0,y1,z0,z1]of framingBoxes)for(const x of [x0,x1])for(const y of [y0,y1])for(const z of [z0,z1]){
  const p=new T.Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<=.950001&&Math.abs(p.y)<=.850001&&Math.abs(p.z)<1,'Museum, racks, pond and temple fit '+aspect);
 }
 const museum=new T.Vector3(-26,2,0).project(camera),racks=new T.Vector3(0,1,0).project(camera),temple=new T.Vector3(-18,16.5,-43).project(camera),pond=new T.Vector3(-17,0,25).project(camera);
 assert(museum.x<0&&racks.x>0&&temple.y>0&&pond.y<0,'front reference composition is preserved');
}

function view(yaw=0,distance=74){const camera=new T.PerspectiveCamera(46,16/9,.05,400),target=new T.Vector3(-17,2,-3);camera.position.copy(target).add(new T.Vector3(Math.sin(yaw)*distance*.96,distance*.28,Math.cos(yaw)*distance*.96));camera.lookAt(target);camera.updateMatrixWorld();return {camera,target};}
for(const [forward,strafe,axis,sign]of [[1,0,'z',-1],[-1,0,'z',1],[0,-1,'x',-1],[0,1,'x',1]]){
 const {camera,target}=view(),before=camera.position.clone(),center=target.clone(),offset=before.clone().sub(center);
 assert(panOverview(camera,target,forward,strafe,.05));assert((target[axis]-center[axis])*sign>0,'WASD works with orbit center outside the original room');
 assert(camera.position.clone().sub(target).distanceTo(offset)<1e-10,'pan preserves camera orientation and zoom');assert.equal(camera.position.y,before.y);assert.equal(target.y,center.y);
}
const straight=view(),diagonal=view(),fast=view(),capped=view();
for(const [v,f,s,dt,sprint]of [[straight,1,0,.05,false],[diagonal,1,1,.05,false],[fast,1,0,.05,true],[capped,1,0,20,false]]){v.before=v.target.clone();panOverview(v.camera,v.target,f,s,dt,sprint);}
const distance=v=>v.before.distanceTo(v.target);assert(Math.abs(distance(straight)-distance(diagonal))<1e-10);assert(Math.abs(distance(fast)/distance(straight)-3)<1e-10);assert.equal(distance(capped),distance(straight));
const turned=view(Math.PI/2),turnX=turned.target.x;panOverview(turned.camera,turned.target,1,0,.05);assert(turned.target.x<turnX,'W follows a manually rotated view');
const edge=view();edge.camera.position.x+=OVERVIEW_BOUNDS.maxX-edge.target.x;edge.target.x=OVERVIEW_BOUNDS.maxX;const z=edge.target.z;panOverview(edge.camera,edge.target,1,1,.05);assert.equal(edge.target.x,OVERVIEW_BOUNDS.maxX);assert(edge.target.z<z,'boundary does not block the other movement axis');
console.log('PASS Bird’s-eye camera: front reference composition, responsive framing at seven aspect ratios, campus-wide WASD, rotated view axes, unchanged elevation/zoom, normalized diagonal, Shift ×3, suspended-tab cap and independent boundary sliding.');
