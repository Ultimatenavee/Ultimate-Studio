import assert from 'node:assert/strict';
import {SIRIN_DRONE_SHOTS,SIRIN_SHOT_SECONDS,sirinDronePose} from '../src/datacenter/sirin-drone.js';
const period=SIRIN_DRONE_SHOTS.length*SIRIN_SHOT_SECONDS;
for(const aspect of [.46,.7,1.33,1.78,2.4]){let previous=null;for(let t=0;t<=period;t+=.1){const p=sirinDronePose(t,aspect);assert(p.position.toArray().every(Number.isFinite));assert(p.position.y>75,'route stays above rooftops');assert(p.position.distanceTo(p.target)>70);if(previous)assert(p.position.distanceTo(previous)<5,'smooth flight without camera cuts');previous=p.position;}}
assert(sirinDronePose(0).position.distanceTo(sirinDronePose(period).position)<1e-8,'seamless loop');
for(let i=0;i<SIRIN_DRONE_SHOTS.length;i++)assert.equal(sirinDronePose(i*SIRIN_SHOT_SECONDS).index,i);
console.log('PASS six-shot drone route, rooftop clearance, portrait framing, smooth motion and seamless loop.');
