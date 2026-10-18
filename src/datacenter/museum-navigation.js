import {canStand} from './navigation.js';
export function planWalkPath(start,target,boxes,bounds,step=.35){
 const regions=bounds.regions||[],minX=regions.length?Math.min(...regions.map(r=>r.minX)):-bounds.width/2,minZ=regions.length?Math.min(...regions.map(r=>r.minZ)):-bounds.depth/2,maxX=regions.length?Math.max(...regions.map(r=>r.maxX)):bounds.width/2,maxZ=regions.length?Math.max(...regions.map(r=>r.maxZ)):bounds.depth/2,nx=Math.ceil((maxX-minX)/step)+1,nz=Math.ceil((maxZ-minZ)/step)+1;
 const ix=x=>Math.max(0,Math.min(nx-1,Math.round((x-minX)/step))),iz=z=>Math.max(0,Math.min(nz-1,Math.round((z-minZ)/step))),key=(x,z)=>z*nx+x,point=n=>({x:minX+n%nx*step,z:minZ+Math.floor(n/nx)*step}),safe=n=>{const p=point(n);return canStand(p.x,p.z,boxes,bounds,.25);};
 let first=key(ix(start.x),iz(start.z)),last=key(ix(target.x),iz(target.z));if(!safe(first)||!safe(last))return [];
 const seen=new Int32Array(nx*nz).fill(-1),queue=new Int32Array(nx*nz);let head=0,tail=0;queue[tail++]=first;seen[first]=first;
 while(head<tail){const n=queue[head++];if(n===last)break;const x=n%nx,z=Math.floor(n/nx);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const next=key(xx,zz);if(seen[next]!==-1||!safe(next))continue;seen[next]=n;queue[tail++]=next;}}
 if(seen[last]===-1)return [];const out=[];for(let n=last;n!==first;n=seen[n])out.push(point(n));out.reverse();return out;
}
export function standNear(target,boxes,bounds){if(canStand(target.x,target.z,boxes,bounds))return target;for(let r=.35;r<3;r+=.35)for(let n=0;n<16;n++){const a=n*Math.PI/8,p={...target,x:target.x+Math.sin(a)*r,z:target.z+Math.cos(a)*r};if(canStand(p.x,p.z,boxes,bounds))return p;}return null;}
