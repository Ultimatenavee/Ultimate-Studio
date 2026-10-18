import * as T from 'three';
// Interaction-driven automatic door, independent of the decorative Animation switch.
export function createCampusDoor({parent,box,glass,frame,x,z,width=3.2}){
 const root=new T.Group();root.name='campus-garden-door';root.userData.dynamic=true;root.position.set(x,0,z);parent.add(root);
 for(const dx of [-width/2-.06,width/2+.06])box(.12,3.3,.18,dx,1.65,0,frame,root);
 box(width+.25,.18,.22,0,3.22,0,frame,root);
 const leaves=[-1,1].map(side=>{const leaf=box(width/2-.02,3.05,.035,side*width/4,1.525,0,glass,root);leaf.name='campus-garden-door-leaf';box(.035,3.05,.055,side*width/4,0,0,frame,leaf);box(width/2-.02,.04,.055,0,-.45,0,frame,leaf);return leaf;});
 let opening=0,last=null;
 return {root,update(camera,t){const dt=last===null?0:Math.min(.05,Math.max(0,(t-last)/1000));last=t;const previous=opening,target=Math.hypot(camera.position.x-x,camera.position.z-z)<4?1:0;opening=T.MathUtils.damp(opening,target,9,dt);leaves.forEach((leaf,i)=>{const side=i?1:-1;leaf.position.x=side*(width/4+opening*width/2);});return Math.abs(previous-opening)>.00001;}};
}
