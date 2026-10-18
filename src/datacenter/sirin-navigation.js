// East Ayothaya promenade -> west gate of the new capital. Arrivals are
// deliberately outside every trigger; coordinates here are Three.js X/Z.
export const EAST_GATE={x:28,z:-4,width:1.4,depth:1.7};
export const EAST_RETURN={x:25.5,z:-4,yaw:Math.PI/2};
export const CAPITAL_GATE={x:-170,z:0,width:3,depth:5};
export const CAPITAL_SPAWN={x:-162,z:0,yaw:-Math.PI/2};
export const CAPITAL_ROOMS={museum:{x:-73,z:-56},datacenter:{x:73,z:-43}};
export const CAPITAL_RETURNS={museum:{x:-73,z:-51,yaw:Math.PI},datacenter:{x:73,z:-38,yaw:Math.PI}};
export function insidePortal(p,x,z){return Math.abs(x-p.x)<p.width/2&&Math.abs(z-p.z)<p.depth/2;}
export function capitalPortalAt(x,z){
 if(insidePortal(CAPITAL_GATE,x,z))return 'city';
 for(const [id,p]of Object.entries(CAPITAL_ROOMS))if(insidePortal({...p,width:3,depth:2},x,z))return id;
 return null;
}
export function capitalCanStand(nav,x,z,r=.25){
 if(!nav)return false;
 const [x0,x1,z0,z1]=nav.bounds;
 return x>x0+r&&x<x1-r&&z>z0+r&&z<z1-r&&!nav.colliders.some(b=>x>b[0]-r&&x<b[1]+r&&z>b[2]-r&&z<b[3]+r);
}
export function capitalStep(nav,position,dx,dz){
 let {x,z}=position;const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));
 for(let i=0;i<n;i++){if(capitalCanStand(nav,x+dx/n,z))x+=dx/n;if(capitalCanStand(nav,x,z+dz/n))z+=dz/n;}
 return {x,z};
}
