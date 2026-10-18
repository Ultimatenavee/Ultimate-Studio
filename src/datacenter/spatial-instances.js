import * as T from 'three';
// Partition static instances once at construction. Each small batch gets a tight
// bounding sphere so Three can cull it in both camera and shadow passes. Materials,
// geometry, textures and all instance transforms are retained at full fidelity.
export function instancePartition(source,count,indexAt){
 const target=new T.InstancedMesh(source.geometry,source.material,count);
 target.name=source.name;target.castShadow=source.castShadow;target.receiveShadow=source.receiveShadow;target.visible=source.visible;target.userData={...source.userData};
 const out=target.instanceMatrix.array,input=source.instanceMatrix.array;
 const colors=source.instanceColor?new Float32Array(count*3):null;
 for(let i=0;i<count;i++){const at=indexAt(i);for(let n=0;n<16;n++)out[i*16+n]=input[at*16+n];if(colors)for(let n=0;n<3;n++)colors[i*3+n]=source.instanceColor.array[at*3+n];}
 target.instanceMatrix.needsUpdate=true;if(colors){target.instanceColor=new T.InstancedBufferAttribute(colors,3);target.instanceColor.needsUpdate=true;}
 if(count){target.computeBoundingBox();target.computeBoundingSphere();target.boundingBox.expandByScalar(.12);target.boundingSphere.radius+=.12;}
 target.matrixAutoUpdate=false;return target;
}
