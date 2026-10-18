// One presentation per approach. Pause advances no time; leaving settles to the original pose.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function createExhibitMotion(){return {active:false,time:0,lift:0,turn:0,returnTime:1,fromLift:0,fromTurn:0};}
export function advanceExhibitMotion(state,active,dt,motion=true){
 if(active!==state.active){state.active=active;if(active){state.fromLift=state.lift;state.fromTurn=Math.atan2(Math.sin(state.turn),Math.cos(state.turn));state.time=0;state.returnTime=0;}else{state.fromLift=state.lift;state.fromTurn=Math.atan2(Math.sin(state.turn),Math.cos(state.turn));state.returnTime=0;}}
 if(!motion)return state;
 const step=Math.max(0,Math.min(.05,dt||0));
 if(active){state.time=Math.min(6.1,state.time+step);state.lift=state.fromLift+(.2-state.fromLift)*smooth(state.time/.8);state.turn=state.fromTurn+(Math.PI*2-state.fromTurn)*smooth((state.time-.8)/4.8);}
 else{state.returnTime=Math.min(.75,state.returnTime+step);const settle=1-smooth(state.returnTime/.75);state.lift=state.fromLift*settle;state.turn=settle===0?0:state.fromTurn*settle;}
 return state;
}
