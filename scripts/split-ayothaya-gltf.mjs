// Lossless glTF buffer-view repack: every image/mesh byte is preserved while
// keeping each publicly hosted file below the platform's 25 MiB asset limit.
import fs from 'node:fs';import path from 'node:path';
const directory='web/assets/ayothaya',bytes=fs.readFileSync(path.join(directory,'ayothaya.glb')),jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.toString('utf8',20,20+jsonLength)),binStart=20+jsonLength+8,limit=12*1024*1024;
if(bytes.toString('ascii',0,4)!=='glTF'||gltf.buffers.length!==1)throw Error('Expected one embedded GLB buffer');
const buffers=[];let blocks=[],length=0;
function flush(){if(!length)return;const uri='ayothaya-buffer-'+buffers.length+'.bin',data=Buffer.concat(blocks);fs.writeFileSync(path.join(directory,uri),data);buffers.push({uri,byteLength:data.length});blocks=[];length=0;}
for(const view of gltf.bufferViews){const data=bytes.subarray(binStart+(view.byteOffset||0),binStart+(view.byteOffset||0)+view.byteLength);if(data.length>limit)throw Error('A single buffer view exceeds the split budget');let pad=(4-length%4)%4;if(length+pad+data.length>limit){flush();pad=0;}if(pad)blocks.push(Buffer.alloc(pad));length+=pad;view.buffer=buffers.length;view.byteOffset=length;blocks.push(data);length+=data.length;}
flush();gltf.buffers=buffers;fs.writeFileSync(path.join(directory,'ayothaya.gltf'),JSON.stringify(gltf));console.log('Prepared lossless Ayothaya glTF with '+buffers.length+' buffers below 12 MiB each');
