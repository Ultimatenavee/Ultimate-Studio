// Original/High/Ultra preserve native sharpness up to their DPR cap, regardless of viewport size.
// Pixel-area limits apply only to explicitly chosen Performance/Low profiles.
// Resolution budgets, not FPS guarantees. Native rAF follows the display/browser refresh.
export function pixelRatioBudget(quality,width,height,nativeRatio=1,scale=1){
 const profile={performance:[1,1.6e6],low:[.9,1.1e6],balanced:[1.5,Infinity],high:[1.75,Infinity],ultra:[2,Infinity]}[quality]||[1.5,Infinity];
 return Math.max(.35,Math.min(nativeRatio,profile[0],Math.sqrt(profile[1]/Math.max(1,width*height)))*scale);
}
export function adaptRenderBudget(quality,scale,fps,slowWindows){
 if(!fps||fps>=50)return {quality,scale,slowWindows:0};
 if(++slowWindows<2)return {quality,scale,slowWindows};
 if(scale>.66)return {quality,scale:Math.max(.65,scale*.85),slowWindows:0};
 if(fps<35){const next=quality==='ultra'?'high':quality==='high'?'balanced':quality==='balanced'?'performance':'low';return {quality:next,scale:next===quality?scale:1,slowWindows:0};}
 return {quality,scale,slowWindows:0};
}
