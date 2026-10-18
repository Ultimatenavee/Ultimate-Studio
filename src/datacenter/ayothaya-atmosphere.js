import * as T from 'three';

// Keep the sky in the render layer. No clock, navigation, or saved device state is changed.
export function createAyothayaSky(parent){
 const uniforms={night:{value:0},time:{value:0}};
 const material=new T.ShaderMaterial({uniforms,side:T.BackSide,depthWrite:false,toneMapped:false,
  vertexShader:'varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 direction; uniform float night; uniform float time;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
   void main(){vec3 d=normalize(direction);float h=max(d.y,0.0);
    vec3 day=mix(vec3(.73,.89,.98),vec3(.11,.47,.88),pow(h,.55));
    vec3 dusk=mix(vec3(.10,.16,.30),vec3(.012,.025,.09),pow(h,.5));
    vec3 col=mix(day,dusk,night);
    vec2 uv=d.xz/max(d.y+.22,.05)*2.1+vec2(time*.003,0.0);
    float cloud=noise(uv)*.57+noise(uv*2.03)*.28+noise(uv*4.1)*.15;
    cloud=smoothstep(.51,.73,cloud)*smoothstep(.03,.22,d.y)*.82;
    col=mix(col,mix(vec3(1,.98,.91),vec3(.24,.29,.43),night),cloud);
    float sun=dot(d,normalize(vec3(-.55,.46,-.65)));
    col+=vec3(1,.81,.42)*pow(max(sun,0.0),40.0)*.16*(1.0-night);
    col=mix(col,vec3(1,.96,.75),smoothstep(.9993,.99965,sun)*(1.0-night));
    float moon=dot(d,normalize(vec3(.35,.45,-.8)));
    col+=vec3(.25,.36,.65)*pow(max(moon,0.0),65.0)*.16*night;
    col=mix(col,vec3(.88,.94,1.0),smoothstep(.9991,.9995,moon)*night);
    gl_FragColor=vec4(col,1.0);
   }`});
 const root=new T.Group(),dome=new T.Mesh(new T.SphereGeometry(290,32,20),material);dome.renderOrder=-20;root.add(dome);parent.add(root);
 const positions=[];let seed=73491;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<500;i++){const y=.08+random()*.92,a=random()*Math.PI*2,r=Math.sqrt(1-y*y);positions.push(Math.cos(a)*r*270,y*270,Math.sin(a)*r*270);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 const stars=new T.Points(geo,new T.PointsMaterial({color:'#d3e7ff',size:1.5,sizeAttenuation:false,transparent:true,opacity:.85,depthWrite:false,toneMapped:false}));stars.renderOrder=-19;stars.visible=false;root.add(stars);
 return {setNight(value){uniforms.night.value=value?1:0;stars.visible=value;},update(camera,time,motion){root.position.copy(camera.position);uniforms.time.value=motion?time/1000:0;}};
}
