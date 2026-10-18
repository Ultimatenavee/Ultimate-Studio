import * as T from 'three';
import hands from './sculpt-data/hands.json' with {type:'json'};

// Canonical palm faces +Z, fingers +Y, thumb +X. Every variant is a closed,
// connected mesh baked offline, including finger webs and the thumb saddle.
export function createHandGeometry({pose='blessing',detail=true,mirror=false}={}){
 const d=hands[pose+'-'+(detail?'detail':'walking')];if(!d)throw new Error('Unknown hand pose');
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(d.p,3));g.setIndex(d.i);
 if(mirror){g.scale(-1,1,1);const a=g.index.array;for(let i=0;i<a.length;i+=3)[a[i+1],a[i+2]]=[a[i+2],a[i+1]];}
 const uv=[];for(let i=0;i<g.attributes.position.count;i++)uv.push((g.attributes.position.getX(i)+.4)/.8,(g.attributes.position.getY(i)+.3)/.9);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.userData={pose,wrist:d.wrist,mirror,tips:d.tips.map(t=>({name:t.name,position:[t.tip[0]*(mirror?-1:1),t.tip[1],t.tip[2]]}))};return g;
}
