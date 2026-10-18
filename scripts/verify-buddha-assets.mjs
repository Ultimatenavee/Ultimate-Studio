import assert from 'node:assert/strict';
import * as T from 'three';
import {createBuddhaAssets} from '../src/datacenter/buddha-assets.js';
const tick=()=>new Promise(r=>setImmediate(r));
function deferred(){let resolve,reject;return {promise:new Promise((a,b)=>{resolve=a;reject=b;}),resolve,reject};}
function setup(load){const parent=new T.Group(),fallback=new T.Group();fallback.position.set(0,.75,-1.7);parent.add(fallback);return {parent,fallback,api:createBuddhaAssets({parent,fallback,load})};}
function asset(){const g=new T.BoxGeometry(),m=new T.MeshStandardMaterial(),tex=new T.DataTexture(new Uint8Array([0,0,0,255]),1,1);m.normalMap=tex;const scene=new T.Group();scene.add(new T.Mesh(g,m));let disposal=0;for(const r of [g,m,tex])r.addEventListener('dispose',()=>disposal++);return {scene,disposal:()=>disposal};}
{
 const walk=deferred(),detail=deferred(),calls=[],s=setup(url=>{calls.push(url);return url.includes('walking')?walk.promise:detail.promise;});
 assert(s.fallback.visible);assert.equal(calls.length,0,'lazy request begins in a microtask');
 await tick();assert.equal(calls.length,1);const w=asset();walk.resolve(w);await tick();assert.equal(s.fallback.visible,false);assert.equal(s.parent.children.length,2);assert(w.scene.position.equals(s.fallback.position));assert.equal(calls.length,1,'detail not loaded at a distance');
 const camera=new T.PerspectiveCamera();camera.position.set(0,2,5);assert(s.api.update(camera));await tick();assert.equal(calls.length,2);const d=asset();detail.resolve(d);await s.api.settled();assert(d.scene.visible&&!w.scene.visible);assert(s.api.update(camera),'asynchronous arrival invalidates rendering even with animations off');assert(!s.api.update(camera),'stationary model causes no repeated invalidation');
 camera.position.z=10.5;s.api.update(camera);assert(d.scene.visible,'distance hysteresis avoids rapid LOD swaps');camera.position.z=15;s.api.update(camera);assert(w.scene.visible&&!d.scene.visible);camera.position.z=5;s.api.update(camera);assert(d.scene.visible);s.api.quality('performance');assert(w.scene.visible&&!d.scene.visible);s.api.quality('high');assert(d.scene.visible);s.api.dispose();s.api.dispose();assert.equal(w.disposal(),3);assert.equal(d.disposal(),3);assert.equal(s.parent.children.length,1);assert(s.fallback.parent,'asset ownership never disposes the native hall fallback');
}
{
 const gate=deferred(),s=setup(()=>gate.promise);await tick();s.api.dispose();const late=asset();gate.resolve(late);await s.api.settled();assert.equal(late.disposal(),3,'late request is disposed rather than attached after exit');assert.equal(s.parent.children.length,1);
}
{
 const s=setup(()=>Promise.reject(new Error('offline')));await s.api.settled();assert(s.fallback.visible);assert.deepEqual(s.api.stats().failed,['walking']);s.api.dispose();
}
{
 const w=asset(),s=setup(url=>url.includes('walking')?Promise.resolve(w):Promise.reject(new Error('detail unavailable')));const c=new T.PerspectiveCamera();c.position.z=5;s.api.update(c);await s.api.settled();assert(w.scene.visible&&!s.fallback.visible);assert.deepEqual(s.api.stats().failed,['detail']);s.api.dispose();
}
console.log('PASS Buddha asset lifecycle: lazy coarse/detail loading, transforms, distance hysteresis, quality, paused rendering invalidation, offline fallback and late/idempotent disposal.');
