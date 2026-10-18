import * as T from 'three';
import {CAMPUS_LAWNS,CAMPUS_POOLS} from './campus-layout.js';
export const CAMPUS_GROUND_Y=-.31;
// A single surface with real cut-outs: lawn and pond patches never share coplanar
// triangles with the old campus ground. No depth bias or camera-dependent offset.
export function campusGroundGeometry(){
 const shape=new T.Shape();shape.moveTo(-122,-85);shape.lineTo(88,-85);shape.lineTo(88,85);shape.lineTo(-122,85);shape.closePath();
 for(const p of [...CAMPUS_LAWNS,...CAMPUS_POOLS]){const x=p.x-p.width/2,y=-p.z-p.depth/2,path=new T.Path();path.moveTo(x,y);path.lineTo(x,y+p.depth);path.lineTo(x+p.width,y+p.depth);path.lineTo(x+p.width,y);path.closePath();shape.holes.push(path);}
 const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);g.translate(0,CAMPUS_GROUND_Y,0);const pos=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+122)/210,(85-pos.getZ(i))/170);
 g.computeBoundingBox();g.computeBoundingSphere();return g;
}
