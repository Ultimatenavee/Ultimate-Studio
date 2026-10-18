"""v108 original garment/lotus sculpt on the v107 anatomical master.
No paid models, extracted geometry, or reference-image textures are used.
"""
import bpy,bmesh,math,os,argparse,json
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--master',required=True);p.add_argument('--out',required=True);p.add_argument('--preview',required=True);p.add_argument('--quick',action='store_true');a=p.parse_args();os.makedirs(a.out,exist_ok=True);os.makedirs(a.preview,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(a.master));root=next(o for o in bpy.data.objects if str(o.get('revision'))=='107');objects=[o for o in root.children if o.type=='MESH'];body=next(o for o in objects if o.name.endswith('/ body'));hair=next(o for o in objects if o.name.endswith('/ hair'));base=next(o for o in objects if o.name.endswith('/ bronze'));bronze=body.data.materials[0];hairmat=hair.data.materials[0];made=[]
def ga(v,c,w):return math.exp(-((v-c)/w)**2)
def xyz(p):return (p[0],-p[2],p[1])
def mesh(name,pts,faces,mat=bronze,thickness=0):
 me=bpy.data.meshes.new(name);me.from_pydata([xyz(v) for v in pts],[],faces);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000002);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.parent=root;me.materials.append(mat)
 if thickness:
  bpy.context.view_layer.objects.active=o;m=o.modifiers.new('Sculpted fabric thickness','SOLIDIFY');m.thickness=thickness;m.offset=-1;bpy.ops.object.modifier_apply(modifier=m.name)
 me=o.data
 for f in me.polygons:f.use_smooth=True
 col=me.color_attributes.new(name='Patina',type='FLOAT_COLOR',domain='POINT');bc=mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value[:3]
 uv=me.uv_layers.new(name='Surface')
 for v in me.vertices:
  x,z,y=v.co;shade=.96+.025*math.sin(x*17+y*12)*math.sin(z*19-y*3)+.015*math.sin(x*3.7+y*5.2+z*9);col.data[v.index].color=(*(c*shade for c in bc),1)
 for li,l in enumerate(me.loops):q=me.vertices[l.vertex_index].co;uv.data[li].uv=(math.atan2(q.x,-q.y)/math.tau,q.z/6)
 made.append(o);return o

def surf(name,fn,nu,nv,mat=bronze,thickness=0):
 pts=[fn(i/nu,j/nv) for j in range(nv+1) for i in range(nu+1)];faces=[]
 for j in range(nv):
  for i in range(nu):k=j*(nu+1)+i;faces.append((k,k+1,k+nu+2,k+nu+1))
 return mesh(name,pts,faces,mat,thickness)
def curve(points,t):
 f=t*(len(points)-1);i=min(len(points)-2,int(f));u=f-i;p0=Vector(points[max(0,i-1)]);p1=Vector(points[i]);p2=Vector(points[i+1]);p3=Vector(points[min(len(points)-1,i+2)]);return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)
def interpolate(rows,y):
 for i in range(len(rows)-1):
  if y<=rows[i+1][0]:
   aa,bb=rows[i],rows[i+1];t=max(0,min(1,(y-aa[0])/(bb[0]-aa[0])));return [aa[k]*(1-t)+bb[k]*t for k in range(len(aa))]
 return rows[-1]
T=[[1.03,.38,.32,-.04],[1.22,.84,.48,-.04],[1.58,.97,.53,-.04],[1.96,1.01,.54,-.045],[2.35,1.045,.525,-.045],[2.73,1.07,.50,-.045],[3.03,1.075,.45,-.04],[3.20,1.03,.38,-.035],[3.32,.85,.31,-.03],[3.40,.57,.26,-.02],[3.45,.30,.23,-.02]]
# Subtract the earlier broad robe grooves under the replacement garment, keeping anatomy.
for v in body.data.vertices:
 x,nz,y=v.co;z=-nz;_,rx,rz,zc=interpolate(T,y)
 if 1.60<y<3.22 and abs(x)<rx-.008 and z>.16:
  plain=zc+rz*math.sqrt(max(.001,1-(x/rx)**2));blend=ga(y,2.10,.8)*max(0,1-(abs(x)/rx)**8);v.co.y=-(z*(1-blend)+plain*blend)
body.data.update()
# Broad diagonal textile surface: irregular curved tension folds anchored at shoulder/hip.
folds=[(1.31,.10,.45,.034,.026),(1.45,.14,.48,.044,.030),(1.62,.17,.49,.053,.034),(1.81,.20,.46,.060,.037),(2.01,.24,.42,.054,.039),(2.21,.27,.37,.052,.037),(2.40,.29,.30,.045,.034),(2.56,.30,.23,.033,.029)]
def robe(u,v):
 phi=(u*2-1)*1.45;top=2.68+.54*abs(math.sin(phi))**1.3+.13*math.sin(phi);y=1.22+(top-1.22)*v;_,rx,rz,zc=interpolate(T,y);x=rx*math.sin(phi);cc=max(0,math.cos(phi));d=.027
 for h,slope,bow,amp,width in folds:
  path=h+slope*x+bow*x*x;fade=math.exp(-(abs(x)/1.13)**8);w=width*(.90+.23*math.sin(x*2+h));amp*=.85+.23*math.cos(x*2.7+h)
  d+=fade*(amp*ga(y,path,w)-.30*amp*ga(y,path+.042,w*.53))
  d+=.006*fade*ga(y,path-.055,.012)*ga(x,-.45,.6)
 # Fine bunching at the left attachment and a rolled neckline.
 d+=.014*ga(abs(x),.94,.14)*ga(y,2.35,.55)*math.sin(25*y+4*x)
 d+=.014*ga(v,1,.016)
 return [x,y,zc+rz*math.cos(phi)+d*cc**.5]
cloth=surf('Carved multi-layer diagonal robe',robe,220,210,thickness=.145)
# Draped fabric below raised wrist; broad pleats narrow toward the tension point.
def hanging(u,v):
 q=u*2-1;y=1.37+1.45*v;xc=-.99-.51*v+.055*math.sin(math.pi*v);width=.29-.12*v;x=xc+q*width;z=.60+.14*v+.025*math.sin(math.pi*v)
 amp=.043*(.55+.45*math.sin(math.pi*v));z+=amp*(.65*math.cos(q*math.pi*3+.45*v)+.24*math.cos(q*math.pi*6-.30*v))*(1-.55*abs(q))
 y+=.08*q*(1-v)+.03*math.cos(q*math.pi)*(1-v);return [x,y,z]
surf('Hanging raised sleeve | longitudinal pleats',hanging,100,120,thickness=.04)
# Physical cloth sleeves have nonuniform compression around the bent arm, not smooth pipes.
def sleeve(name,pts,radii):
 def fn(u,v):
  center=curve(pts,v);tan=(curve(pts,min(1,v+.001))-curve(pts,max(0,v-.001))).normalized();n=Vector((0,0,1));n=(n-tan*n.dot(tan)).normalized();b=tan.cross(n).normalized();f=v*(len(radii)-1);i=min(len(radii)-2,int(f));r=radii[i]*(1-(f-i))+radii[i+1]*(f-i);theta=u*math.tau
  r+=math.sin(math.pi*v)*(.012*math.cos(theta*6+v*2)+.006*math.cos(theta*11-v*1.5));r+=.010*ga(v,.68,.20)*math.sin(v*24+theta);cap=min(1,v/.035,(1-v)/.035);return center+(n*math.cos(theta)+b*math.sin(theta))*r*max(0,cap)
 return surf(name,fn,84,150)
sleeve('Lowered sleeve | gathered elbow folds',[[.88,3.01,-.10],[1.17,2.84,-.035],[1.42,2.43,.18],[1.40,2.15,.42],[1.30,1.86,.72]],[.24,.32,.29,.22,.14])
# Remove the old thin petals and create thick closed carved leaves, a rounded bowl,
# and moulded rings. All are original vertex surfaces, not image embossing.
objects.remove(base);bpy.data.objects.remove(base,do_unlink=True)
def ring(name,rows):
 def fn(u,v):
  yy=rows[0][0]+(rows[-1][0]-rows[0][0])*v;_,rx,rz=interpolate(rows,yy);theta=u*math.tau;return [rx*math.sin(theta),yy,rz*math.cos(theta)]
 return surf(name,fn,160,40,thickness=.020)
ring('Moulded lotus foot',[[0,1.82,1.29],[.055,1.98,1.43],[.12,1.98,1.43],[.16,1.89,1.37],[.20,1.86,1.35],[.25,1.77,1.28]])
ring('Carved lotus bowl',[[.20,1.62,1.16],[.40,1.68,1.21],[.64,1.78,1.28],[.86,1.74,1.25],[.97,1.61,1.16]])
surf('Closed elliptical lotus seat',lambda u,v:[1.80*math.sin(math.pi*v)*math.cos(u*math.tau),.91+.09*math.cos(math.pi*v),1.28*math.sin(math.pi*v)*math.sin(u*math.tau)],160,40)
petals=[]
for row in range(2):
 count=18
 for idx in range(count):
  theta=(idx+.5*row)*math.tau/count;st,ct=math.sin(theta),math.cos(theta)
  def petal(u,v):
   q=u*2-1;shape=max(.00001,math.sin(math.pi*v))**.72;w=.36*shape*(.65+.55*v);xx=q*w;y=.18+row*.28+.49*v
   radius=1.64+.060*math.sin(math.pi*v)+.12*v;rr=radius+.022*(1-q*q)*math.sin(math.pi*v)+.025*ga(abs(q),.80,.13)*math.sin(math.pi*v)
   # Real recessed central vein and two nested relief contours on each leaf.
   carved=.022*ga(q,0,.045)*math.sin(math.pi*v)
   for inset in [.30,.64]:
    curveq=inset*max(.005,math.sin(math.pi*v))**.55;carved+=.016*ga(abs(q),curveq,.045)*math.sin(math.pi*v)
   rr-=carved;zz=rr*.73
   return [xx*ct+rr*st,y,zz*ct-xx*st*.73]
  petals.append(surf('Carved layered lotus petal',petal,34,52,thickness=.026))
# Consolidate materials and retain a bounded topology for web delivery.
def decimate(o,ratio):
 bpy.context.view_layer.objects.active=o;m=o.modifiers.new('Authoring retopology','DECIMATE');m.ratio=ratio;m.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=m.name)
for o in list(made):
 if o.name.startswith('Carved layered lotus petal'):decimate(o,.46)
 elif o.name.startswith('Carved multi-layer'):decimate(o,.48)
 elif len(o.data.polygons)>1000:decimate(o,.50)
# Combine new bronze garments with anatomy, preserving all local UV/color/material data.
bronzeParts=[body]+[o for o in made if o.data.materials[0]==bronze];hairParts=[hair]+[o for o in made if o.data.materials[0]==hairmat]
for parts,name in [(bronzeParts,'Original carved sculpture / body'),(hairParts,'Original carved sculpture / hair')]:
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();parts[0].name=name
 if parts[0]==body:
  m=body.modifiers.new('Sculpt volume union','REMESH');m.mode='VOXEL';m.voxel_size=.0055;m.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=m.name)
  m=body.modifiers.new('Soft sculpt transitions','SMOOTH');m.factor=.35;m.iterations=3;bpy.ops.object.modifier_apply(modifier=m.name)
  vg=body.vertex_groups.new(name='Sleeve finishing')
  for vert in body.data.vertices:
   x,z,y=vert.co;weight=ga(x,1.35,.30)*ga(y,2.42,.63)
   if weight>.002:vg.add([vert.index],weight,'REPLACE')
  m=body.modifiers.new('Soft bent sleeve','SMOOTH');m.vertex_group=vg.name;m.factor=.55;m.iterations=8;bpy.ops.object.modifier_apply(modifier=m.name)
  body.data.calc_loop_triangles();decimate(body,min(1,300000/len(body.data.loop_triangles)))
  for v in body.data.vertices:v.co.z=max(0,v.co.z)
  # Voxel union recreates surface attributes; restore local original microfinish.
  col=body.data.color_attributes.get('Patina') or body.data.color_attributes.new(name='Patina',type='FLOAT_COLOR',domain='POINT');uv=body.data.uv_layers.get('Surface') or body.data.uv_layers.new(name='Surface')
  for v in body.data.vertices:
   x,z,y=v.co;n=.96+.025*math.sin(x*17+y*12)*math.sin(z*19-y*3);col.data[v.index].color=(.05*n,.043*n,.032*n,1)
  for li,l in enumerate(body.data.loops):
   q=body.data.vertices[l.vertex_index].co;uv.data[li].uv=(math.atan2(q.x,-q.y)/math.tau,q.z/6)
  for f in body.data.polygons:f.use_smooth=True
objects=[o for o in root.children if o.type=='MESH'];root.name='original-carved-buddha-v108';root['revision']='108';root['curlCount']=483;root['construction']='Original v108 detailed garment and carved lotus vertices on the independently authored v107 anatomical model. No purchased or extracted Meshy geometry.';root['finish']='Closed thick lotus petals with recessed veins; layered diagonal robe, hanging sleeve, elbow pleats, covered knee folds with preserved anatomical hands and face.'
# Garment, pedestal and skin share bronze, while all detail remains inspectable as geometry.
bronze.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.49
scene=bpy.context.scene;scene.cycles.samples=24 if a.quick else 40;cam=scene.camera;scene.render.resolution_x=1000;scene.render.resolution_y=1100
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(a.out,'buddha-master.blend')),compress=True)
def export(name):
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.abspath(os.path.join(a.out,name)),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_yup=True)
export('buddha-detail.glb')
def render(name,loc,target,scale):
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;scene.render.filepath=os.path.join(a.preview,name+'.png');bpy.ops.render.render(write_still=True)
views=[('front',(0,-13,3.2),(0,0,2.85),6.6),('three-quarter',(7,-12,5.5),(0,0,2.85),6.6),('face',(0,-9,4.6),(0,0,4.40),2.05),('carving',(3,-7,2),(0,0,.9),3.7),('profile',(11,-.1,4.1),(0,0,3.0),6.6)]
for name,loc,target,scale in views:
 if a.quick and name not in ['front','three-quarter','carving']:continue
 render(name,loc,target,scale)
for o in objects:
 if len(o.data.polygons)>300:decimate(o,.26)
export('buddha-walking.glb')
json.dump({'revision':108,'blender':bpy.app.version_string,'construction':root['construction'],'finish':root['finish'],'detail':os.path.getsize(os.path.join(a.out,'buddha-detail.glb')),'walking':os.path.getsize(os.path.join(a.out,'buddha-walking.glb')),'walkingFaces':sum(len(o.data.polygons) for o in objects)},open(os.path.join(a.out,'build-metrics.json'),'w'),indent=2)
print('FINISHED ORIGINAL CARVED MODEL',flush=True)
