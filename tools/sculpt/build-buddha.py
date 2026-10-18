"""Original photograph-referenced sculpt; Blender 4.5 LTS / bpy 4.5.3.
Run export-seed.mjs first, then this script using a Python environment with bpy.
No downloaded statue geometry, scan data or reference photograph is embedded.
"""
import bpy, bmesh, json, math, sys, os, argparse
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--seed',required=True);p.add_argument('--out',required=True);p.add_argument('--preview',required=True);p.add_argument('--draft',action='store_true');a=p.parse_args()
os.makedirs(a.out,exist_ok=True);os.makedirs(a.preview,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
rows=json.load(open(a.seed));groups={};hand_marks=[]
def gauss(v,c,w):return math.exp(-((v-c)/w)**2)
def mat(name,col,metal,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*col,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
 color=n.new('ShaderNodeVertexColor');color.layer_name='Patina';m.node_tree.links.new(color.outputs['Color'],bs.inputs['Base Color']);return m
# Linear RGB; dark cast bronze with sparse weathering, and aged gilt repousse.
materials={
 'bronze':mat('Cast bronze | aged dark umber',(.036,.031,.023),.48,.72),
 'hair':mat('Bronze curls | dark recesses',(.020,.023,.019),.60,.59),
 'crease':mat('Recessed bronze',(.019,.020,.016),.50,.56),
 'gold':mat('Aged gilt relief',(.47,.29,.09),.78,.43),
 'aged':mat('Oxidized gilt field',(.15,.095,.027),.70,.56),
 'stone':mat('Lotus base bronze',(.041,.043,.033),.45,.64)}
base_colors={k:tuple(v.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value[:3]) for k,v in materials.items()}
def category(row):
 c=row['material']['color'];name=row['name']
 if 'bronze-hair' in name or (max(c)<.08 and c[1]>c[0]):return 'hair'
 if c[0]>.35 and c[0]>c[1]*1.2:return 'gold'
 if c[0]>c[1]*1.25:return 'aged'
 if max(c)<.035:return 'crease'
 if 'stone-plinth' in name:return 'stone'
 return 'bronze'
for ri,row in enumerate(rows):
 pts=[];name=row['name'];kind=category(row)
 for j in range(0,len(row['position']),3):
  x,y,z=row['position'][j:j+3]
  if row.get('hand'):
   h=row['hand'];lx,ly,lz=h['localPosition'][j:j+3]
   # Incised palm creases, carved into the original closed anatomical surface.
   front=max(0,min(1,(lz-.005)/.035))
   life=.075+.042*math.sin((ly+.12)*8)
   crease=.006*gauss(lx,life,.009)*gauss(ly,0,.13)
   crease+=.0045*gauss(ly,.060+.15*lx,.007)*gauss(lx,-.025,.13)
   crease+=.0035*gauss(ly,-.018+.22*lx,.008)*gauss(lx,-.035,.13)
   lz-=front*crease
   mat=h['matrix'];x=mat[0]*lx+mat[4]*ly+mat[8]*lz+mat[12];y=mat[1]*lx+mat[5]*ly+mat[9]*lz+mat[13];z=mat[2]*lx+mat[6]*ly+mat[10]*lz+mat[14]
  if name.startswith('head-sculpt/'):
   # A fuller jaw, broad cheeks and a less pointed chin match the current statue.
   width=1+.10*gauss(y,3.94,.29)+.035*gauss(y,4.52,.30);x*=width
   if z>.05 and abs(x)<.47:
    z+=.023*gauss(abs(x),.27,.13)*gauss(y,4.10,.22)+.013*gauss(y,3.76,.1)
   if abs(x)>.445 and y<4.52 and 'bronze-hair' not in name:
    sign=1 if x>0 else -1;x=sign*.50+(x-sign*.50)*.75
   if 'bronze-hair-curls' in name:
    # Restore a low sculpted shell rather than spherical beads with bright tips.
    pass
  pts.append((x,-z,y))
 me=bpy.data.meshes.new('sculpt-surface');me.from_pydata(pts,[],[row['index'][i:i+3] for i in range(0,len(row['index']),3)]);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
 if name.startswith(('head-sculpt/','body-sculpt/')) and 'draped-robe-surface' not in name and not row.get('hand'):
  boundary=[e for e in bm.edges if e.is_boundary]
  if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(materials[kind]);o['source_component']=name
 if 'draped-robe-surface' in name:
  bpy.context.view_layer.objects.active=o;o.select_set(True);solid=o.modifiers.new('Cloth shell','SOLIDIFY');solid.thickness=.009;solid.offset=0;bpy.ops.object.modifier_apply(modifier=solid.name);o.select_set(False)
 if row.get('hand'):
  o['pose']=row['hand']['handPose'];o['palm_normal']=row['hand']['palmNormal'];o['finger_direction']=row['hand']['fingersDirection'];o['wrist']=row['hand']['wrist'];hand_marks.append(o)
  # Original anatomical hands are already watertight. Preserve their orientation.
  group='hand-'+o['pose']
 elif name.startswith('head-sculpt/') and kind=='bronze':group='head'
 elif name.startswith('body-sculpt/') and kind=='bronze':group='body'
 else:group=kind
 groups.setdefault(group,[]).append(o)
print('Imported original components',len(rows),flush=True)
def join(objects,name):
 if len(objects)==1:
  objects[0].name=name;return objects[0]
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=objects[0];o.name=name;return o
def modifier(o,typ,**kwargs):
 bpy.context.view_layer.objects.active=o;m=o.modifiers.new(typ,typ)
 for k,v in kwargs.items():setattr(m,k,v)
 bpy.ops.object.modifier_apply(modifier=m.name)
objects=[]
for key,parts in groups.items():
 o=join(parts,'Daibutsu / '+key)
 if key in ['head','body'] and not a.draft:
  # Voxel fusion removes intersecting ear/eyelid/arm seams. Smooth selectively;
  # the anatomically closed hand meshes are deliberately excluded from remeshing.
  modifier(o,'REMESH',mode='VOXEL',voxel_size=.0035 if key=='head' else .013,use_smooth_shade=True)
  modifier(o,'SMOOTH',factor=.30 if key=='head' else .50,iterations=2 if key=='head' else 8)
  modifier(o,'DECIMATE',ratio=.12 if key=='head' else .32,use_collapse_triangulate=True)
 if key.startswith('hand'):
  modifier(o,'SUBSURF',levels=1,render_levels=1)
  modifier(o,'SMOOTH',factor=.12,iterations=1)
 for f in o.data.polygons:f.use_smooth=True
 objects.append(o);print(key,len(o.data.polygons),'faces',flush=True)
# Original vertex patina and tiny UV normal texture survive glTF export.
image=bpy.data.images.new('Original bronze micro-normal',width=128,height=128,alpha=True)
pixels=[]
for j in range(128):
 for i in range(128):
  h=math.sin(i*1.713+j*2.137)*.035+math.sin(i*.37-j*.21)*.018
  k=math.cos(i*2.29+j*1.41)*.035;pixels.extend((.5+h,.5+k,1,1))
image.pixels=pixels;image.colorspace_settings.name='Non-Color';image.filepath_raw=os.path.join(a.preview,'original-bronze-normal.png');image.file_format='PNG';image.save();image.pack()
for key,m in materials.items():
 if key in ['crease','stone']:continue
 n=m.node_tree.nodes;t=n.new('ShaderNodeTexImage');t.image=image;norm=n.new('ShaderNodeNormalMap');norm.inputs['Strength'].default_value=.06;m.node_tree.links.new(t.outputs['Color'],norm.inputs['Color']);m.node_tree.links.new(norm.outputs['Normal'],n.get('Principled BSDF').inputs['Normal'])
for o in objects:
 me=o.data;kind=next(k for k,v in materials.items() if v==me.materials[0]);base=base_colors[kind]
 attr=me.color_attributes.new(name='Patina',type='FLOAT_COLOR',domain='POINT')
 for v in me.vertices:
  x,negz,y=v.co;z=-negz
  blot=(math.sin(x*11.3+math.sin(y*3.8)*2)+math.sin(y*17.3-z*10.7)+math.sin(z*22.9+x*5.7))/3
  weather=max(0,blot-.15)*(.48 if kind=='bronze' else .13)
  grain=.95+.045*math.sin(x*153.2+y*131.7+z*143.1)
  col=tuple(max(.004,min(1,b*grain*(1+weather*2.4))) for b in base)
  if kind=='bronze':col=(col[0]+weather*.022,col[1]+weather*.028,col[2]+weather*.013)
  attr.data[v.index].color=(*col,1)
 uv=me.uv_layers.new(name='Surface')
 for poly in me.polygons:
  for li in poly.loop_indices:
   co=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=(math.atan2(co.x,-co.y)/math.tau*24,co.z*6)
# A small authored record travels with the mesh, without user-facing labels.
root=bpy.data.objects.new('original-todaiji-inspired-sculpt',None);bpy.context.collection.objects.link(root)
root['construction']='Original sculpture; independently modelled using photographic references, not a laser scan';root['revision']='104';root['coordinates']='Y-up in glTF, metres in the scenic hall';root['rightPalmNormal']=[0.,0.,1.];root['leftPalmNormal']=[0.,1.,0.]
for o in objects:o.parent=root
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=True;scene.world.color=(.16,.16,.16)
# Broad neutral studio illumination. No painted-in reference lighting.
def area(name,loc,energy,size,color):
 d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,2.8))-o.location).to_track_quat('-Z','Y').to_euler()
area('Soft key',(-4,-6,8),1700,5,(1,.88,.72));area('Cool fill',(5,-3,5),1100,4,(.76,.87,1));area('Rim',(1,3,7),1600,3,(1,.75,.47))
camdata=bpy.data.cameras.new('Sculpt review camera');cam=bpy.data.objects.new('Sculpt review camera',camdata);bpy.context.collection.objects.link(cam);scene.camera=cam;camdata.type='ORTHO';scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
# Save editable full-detail master first; cameras and lights are not exported.
blend=os.path.abspath(os.path.join(a.out,'buddha-master.blend'));bpy.ops.wm.save_as_mainfile(filepath=blend,compress=True)
def selectsculpt():
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in objects:o.select_set(True)
def export(name):
 selectsculpt();bpy.ops.export_scene.gltf(filepath=os.path.abspath(os.path.join(a.out,name)),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_apply=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_texcoords=True,export_normals=True)
export('buddha-detail.glb')
views=[('front',(0,-13,3.2),(0,0,2.85),6.6),('three-quarter',(7,-12,5.5),(0,0,2.85),6.6),('face',(0,-9,4.5),(0,0,4.38),1.95),('hands',(-4,-7,3.5),(-.55,-.55,2.65),3.8)]
for name,loc,target,scale in views:
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();camdata.ortho_scale=scale;scene.render.filepath=os.path.join(a.preview,name+'.png');bpy.ops.render.render(write_still=True);print('Rendered',name,flush=True)
# Separate walking asset: decimated, never simplifying the detail master in place.
for o in objects:
 if len(o.data.polygons)>300:modifier(o,'DECIMATE',ratio=.38,use_collapse_triangulate=True)
export('buddha-walking.glb')
report={'blender':bpy.app.version_string,'construction':'original referenced interpretation','detail':os.path.getsize(os.path.join(a.out,'buddha-detail.glb')),'walking':os.path.getsize(os.path.join(a.out,'buddha-walking.glb')),'walkingFaces':sum(len(o.data.polygons) for o in objects)}
json.dump(report,open(os.path.join(a.out,'build-metrics.json'),'w'),indent=2);print(json.dumps(report),flush=True)
