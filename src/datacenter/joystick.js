// Circular analog input: clamp diagonal travel and ignore small finger jitter.
export function joystickVector(dx,dy,radius,deadZone=.12){
 const distance=Math.hypot(dx,dy);if(!Number.isFinite(distance)||!Number.isFinite(radius)||radius<=0)return {x:0,y:0,forward:0,strafe:0};
 const travel=Math.min(distance,radius),strength=Math.max(0,(travel/radius-deadZone)/(1-deadZone)),ux=distance?dx/distance:0,uy=distance?dy/distance:0;
 return {x:ux*travel,y:uy*travel,forward:-uy*strength||0,strafe:ux*strength||0};
}
export function bindJoystick(control,{onMove,windowTarget=window,documentTarget=document}){
 const abort=new AbortController(),on=(target,event,fn)=>target.addEventListener(event,fn,{signal:abort.signal});let pointer=null,bounds=null;
 function reset(){const id=pointer;pointer=null;bounds=null;control.style.setProperty('--stick-x','0px');control.style.setProperty('--stick-y','0px');control.classList.remove('is-active');if(id!==null&&control.hasPointerCapture?.(id))control.releasePointerCapture(id);onMove(0,0);}
 function move(e){if(e.pointerId!==pointer||!bounds)return;e.preventDefault();const radius=Math.min(bounds.width,bounds.height)*.28,v=joystickVector(e.clientX-bounds.left-bounds.width/2,e.clientY-bounds.top-bounds.height/2,radius);control.style.setProperty('--stick-x',v.x+'px');control.style.setProperty('--stick-y',v.y+'px');onMove(v.forward,v.strafe);}
 on(control,'pointerdown',e=>{if(pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();pointer=e.pointerId;bounds=control.getBoundingClientRect();control.setPointerCapture(pointer);control.classList.add('is-active');move(e);});
 on(control,'pointermove',move);
 const release=e=>{if(e.pointerId===pointer)reset();};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])on(control,event,release);
 on(windowTarget,'pointerup',release);on(windowTarget,'blur',reset);on(documentTarget,'visibilitychange',()=>{if(documentTarget.hidden)reset();});
 return {reset,dispose(){reset();abort.abort();}};
}
