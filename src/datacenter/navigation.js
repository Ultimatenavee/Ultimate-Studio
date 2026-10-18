// Metre-scale, deterministic navigation. No scene/camera side effects.
export function obstacles(racks){return racks.map(r=>({minX:r.x-.43,maxX:r.x+.43,minZ:r.z-.65,maxZ:r.z+.65}));}
export function canStand(x,z,boxes,bounds,radius=.22){if(bounds.regions){if(!bounds.regions.some(r=>x>=r.minX+radius+.05&&x<=r.maxX-radius-.05&&z>=r.minZ+radius+.05&&z<=r.maxZ-radius-.05)){const openPortal=x>-9-.65&&x<-9+.65&&Math.abs(z)<1.4;if(!openPortal)return false;}}else if(x<-bounds.width/2+radius+.15||x>bounds.width/2-radius-.15||z<-bounds.depth/2+radius+.15||z>bounds.depth/2-radius-.15)return false;return !boxes.some(b=>x>b.minX-radius&&x<b.maxX+radius&&z>b.minZ-radius&&z<b.maxZ+radius)}
export function walkStep(position,dx,dz,boxes,bounds,stopAt){const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));let {x,z}=position;if(stopAt?.(x,z))return {x,z};for(let i=0;i<count;i++){if(canStand(x+dx/count,z,boxes,bounds))x+=dx/count;if(canStand(x,z+dz/count,boxes,bounds))z+=dz/count;if(stopAt?.(x,z))break}return {x,z}}
export function movement(forward,strafe,yaw,delta,fast=false,multiplier=3){const length=Math.hypot(forward,strafe);if(!length)return {dx:0,dz:0};const speed=(1.8*(fast?sprintMultiplier(multiplier):1))*Math.min(Math.max(delta,0),.05);const divisor=Math.max(1,length);forward/=divisor;strafe/=divisor;return {dx:(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)*speed,dz:(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)*speed}}

export function sprintMultiplier(value){const n=Number(value);return Number.isFinite(n)&&value!==null&&value!==''?Math.min(20,Math.max(1,Math.round(n))):3;}
// Search outward at half-metre intervals, keeping exact valid clicks unchanged.
export function nearestWalkPoint(x,z,canStand,maxRadius=80){
 if(!Number.isFinite(x)||!Number.isFinite(z))return null;
 if(canStand(x,z))return {x,z};
 for(let r=.5;r<=maxRadius;r+=.5){const n=Math.ceil(2*Math.PI*r/.5);for(let i=0;i<n;i++){const a=i*2*Math.PI/n,p={x:x+Math.cos(a)*r,z:z+Math.sin(a)*r};if(canStand(p.x,p.z))return p;}}
 return null;
}
