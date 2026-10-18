// Pack only the referenced face pixels; white margins must not occupy GPU texture memory.
export function packDeviceTexture(texture,info,maxEdge=1536){
 if(texture.userData?.framePacked)return true;const image=texture.image;if(!image?.width||!image?.height)return false;
 try{const frame=info.frame||[0,0,image.width,image.height],scale=Math.min(1,maxEdge/frame[2],maxEdge/frame[3]),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(frame[2]*scale));canvas.height=Math.max(1,Math.round(frame[3]*scale));const ctx=canvas.getContext('2d');if(!ctx)return false;ctx.drawImage(image,...frame,0,0,canvas.width,canvas.height);texture.image=canvas;texture.repeat.set(1,1);texture.offset.set(0,0);texture.userData.framePacked=true;texture.userData.originalPixels=image.width*image.height;texture.userData.packedPixels=canvas.width*canvas.height;texture.needsUpdate=true;return true;}catch{return false;}
}
