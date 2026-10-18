// Vertical walk physics is independent of visual animation / frame rate.
export function createJump(){
 let height=0,velocity=0;
 return {get height(){return height;},trigger(){velocity=Math.min(7,Math.max(0,velocity)+3.8);},reset(h=0,v=0){height=Math.max(0,Number(h)||0);velocity=Number(v)||0;},snapshot:()=>({height,velocity}),step(delta,ceiling){const dt=Math.min(.05,Math.max(0,delta)),cap=Math.max(0,ceiling);height=Math.min(height,cap);if(!dt)return height;if(!height&&velocity<=0){velocity=0;return height;}const next=height+velocity*dt-9.81*dt*dt/2;velocity-=9.81*dt;if(next>=cap){height=cap;velocity=Math.min(0,velocity);}else if(next<=0){height=velocity=0;}else height=next;return height;}};
}
