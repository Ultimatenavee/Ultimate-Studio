import * as T from 'three';

// A fixed world-space irradiance texture. Camera position never selects lights.
export function buildLightField(sources,bounds,radius,size=512){
 const data=new Uint8Array(size*size*4),values=new Float32Array(size*size),[x0,x1,z0,z1]=bounds;
 for(const p of sources){
  const xa=Math.max(0,Math.floor((p.x-radius-x0)/(x1-x0)*size)),xb=Math.min(size-1,Math.ceil((p.x+radius-x0)/(x1-x0)*size));
  const za=Math.max(0,Math.floor((p.z-radius-z0)/(z1-z0)*size)),zb=Math.min(size-1,Math.ceil((p.z+radius-z0)/(z1-z0)*size));
  for(let z=za;z<=zb;z++)for(let x=xa;x<=xb;x++){const d=Math.hypot(x0+(x+.5)/size*(x1-x0)-p.x,z0+(z+.5)/size*(z1-z0)-p.z),v=Math.pow(Math.max(0,1-d/radius),1.25),i=z*size+x;values[i]=Math.max(values[i],v);}
 }
 for(let i=0;i<values.length;i++){data[i*4]=Math.round(values[i]*255);data[i*4+3]=255;}
 return {data,size,bounds,radius};
}
export function createStaticLightField(root,sources,{bounds=[-40,40,-40,40],radius=12,height=7,size=512}={}){
 const field=buildLightField(sources,bounds,radius,size),night={value:0},map=new T.DataTexture(field.data,size,size,T.RGBAFormat);map.minFilter=map.magFilter=T.LinearFilter;map.needsUpdate=true;
 const materials=new Map();root.traverse(o=>{if(!o.isMesh||o.userData.cameraIgnore)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if((m.isMeshStandardMaterial||m.isMeshBasicMaterial)&&!m.transparent&&!materials.has(m))materials.set(m,{compile:m.onBeforeCompile,key:m.customProgramCacheKey});});
 for(const [m,original]of materials){m.onBeforeCompile=function(shader,renderer){original.compile.call(this,shader,renderer);shader.uniforms.fixedLampField={value:map};shader.uniforms.fixedLampNight=night;
  shader.vertexShader='varying vec3 vFixedLampWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
  vec4 fixedLampPosition=vec4(transformed,1.0);
  #ifdef USE_INSTANCING
   fixedLampPosition=instanceMatrix*fixedLampPosition;
  #endif
  vFixedLampWorld=(modelMatrix*fixedLampPosition).xyz;`);
  shader.fragmentShader='uniform sampler2D fixedLampField; uniform float fixedLampNight; varying vec3 vFixedLampWorld;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`vec2 fixedLampUV=(vFixedLampWorld.xz-vec2(${bounds[0].toFixed(3)},${bounds[2].toFixed(3)}))/vec2(${(bounds[1]-bounds[0]).toFixed(3)},${(bounds[3]-bounds[2]).toFixed(3)});
  float fixedLampFill=(.12+texture2D(fixedLampField,fixedLampUV).r)*fixedLampNight;
  fixedLampFill*=1.0-smoothstep(${(height*.4).toFixed(3)},${height.toFixed(3)},vFixedLampWorld.y);
  outgoingLight+=diffuseColor.rgb*vec3(2.1,1.25,.55)*fixedLampFill;
  #include <opaque_fragment>`);
 };m.customProgramCacheKey=()=>`fixed-city-lights-v1-${bounds.join(',')}-${height}`;m.needsUpdate=true;}
 return {setNight:v=>{night.value=v?1:0;},stats:()=>({mode:'fixed-world-field',cameraDependent:false,sources:sources.length,enabled:!!night.value,radius,materials:materials.size}),dispose(){map.dispose();for(const [m,old]of materials){m.onBeforeCompile=old.compile;m.customProgramCacheKey=old.key;m.needsUpdate=true;}}};
}
export function createFixedGlows(parent,emitters){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#fff8da');gradient.addColorStop(.18,'#ffe2a8e8');gradient.addColorStop(.5,'#ffba5a60');gradient.addColorStop(1,'#ffad4000');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
 material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);
  mvPosition.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
  gl_Position=projectionMatrix*mvPosition;`);};material.customProgramCacheKey=()=> 'fixed-lamp-billboards-v1';
 const geometry=new T.PlaneGeometry(1,1),mesh=new T.InstancedMesh(geometry,material,emitters.length),matrix=new T.Matrix4();mesh.name='All fixed city lamp glows';mesh.userData.cameraIgnore=true;mesh.frustumCulled=false;
 emitters.forEach((p,i)=>{matrix.makeScale(p.size,p.size,1);matrix.setPosition(p.x,p.y,p.z);mesh.setMatrixAt(i,matrix);});parent.add(mesh);
 return {setNight:v=>{mesh.visible=!!v;},stats:()=>({count:emitters.length,lit:mesh.visible?emitters.length:0,drawCalls:1,cameraDependent:false}),dispose(){mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();texture.dispose();}};
}
