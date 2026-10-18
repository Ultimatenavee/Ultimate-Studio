import assert from 'node:assert/strict';
import {pixelRatioBudget,adaptRenderBudget} from '../src/datacenter/render-budget.js';
import {createExhibitMotion,advanceExhibitMotion} from '../src/datacenter/exhibit-motion.js';
for(const [w,h]of [[390,844],[1024,1366],[1920,1080],[3840,2160]]){const r=pixelRatioBudget('performance',w,h,3);assert(r<=1);assert(w*h*r*r<=1.6e6+1);assert(pixelRatioBudget('performance',w,h,3,.8)<=r);}
for(const [w,h]of [[390,844],[1920,1080],[3840,2160],[5120,2880]])for(const [quality,cap]of [['balanced',1.5],['high',1.75],['ultra',2]]){assert.equal(pixelRatioBudget(quality,w,h,3),cap,'sharp profiles never blur large screens to meet a pixel-area budget');assert.equal(pixelRatioBudget(quality,w,h,1),1,'native 1x remains sharp');}
for(const hz of [60,120,144]){const result=adaptRenderBudget('performance',1,hz,0);assert.equal(result.scale,1,'refresh ceiling alone does not downgrade quality');}
let state={quality:'performance',scale:1,slowWindows:0};for(let i=0;i<12;i++)state=adaptRenderBudget(state.quality,state.scale,30,state.slowWindows);assert(state.quality==='low'||state.scale<1);state=adaptRenderBudget('low',.65,20,1);assert.equal(state.scale,.65,'lowest budget never resets itself to a more expensive scale');
const sixty=createExhibitMotion(),oneTwenty=createExhibitMotion();for(let i=0;i<60;i++)advanceExhibitMotion(sixty,true,1/60);for(let i=0;i<120;i++)advanceExhibitMotion(oneTwenty,true,1/120);assert(Math.abs(sixty.lift-oneTwenty.lift)<1e-9);assert(Math.abs(sixty.turn-oneTwenty.turn)<1e-9,'animation speed is independent of refresh rate');
console.log('PASS Render budgets: bounded pixels through4K, no false downgrade on60/120/144Hz, sustained-low-frame fallback, stable lowest scale and refresh-independent animation. No hardware FPS claim.');
