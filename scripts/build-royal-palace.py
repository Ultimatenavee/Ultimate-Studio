"""Compose a new royal exterior from RO palace + Ayothaya roof assets in Blender.
Run in a separate background process; no existing authoring scene is changed.
"""
import bpy,bmesh,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'artifacts/royal-temple-candidates';OUT=ROOT/'web/assets/sirin/royal-temple';AUTHOR=ROOT/'assets-source/royal-temple';AUTHOR.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
def load(name,width,center):
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(SRC/(name+'.glb')))
 objs=[o for o in bpy.data.objects if o not in before and o.type=='MESH']
 for o in objs:
  matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=matrix
 verts=[o.matrix_world@Vector(c)for o in objs for c in o.bound_box];low=Vector(tuple(min(v[a]for v in verts)for a in range(3)));high=Vector(tuple(max(v[a]for v in verts)for a in range(3)));mid=(low+high)/2;scale=width/(high.x-low.x)
 for o in objs:
  o.data.transform(o.matrix_world);o.matrix_world.identity()
  for v in o.data.vertices:v.co=(v.co-Vector((mid.x,mid.y,low.z)))*scale+Vector(center)
  o.name=name+'/'+o.name
 return objs,(high-low)*scale
def material(name,texture,color=(1,1,1)):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.78
 if texture:
  image=bpy.data.images.load(str(ROOT/'assets-source/sirin-labs/textures'/texture),check_existing=True);image.pack();t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=image;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 return m
stone=material('RO Dewata pale plaster','plaster.png');gold=material('RO Verus bronze trim','bronze.png');red=material('RO Ayothaya warm accents','warm.png');shadow=material('Door recess',None,(.045,.035,.025))
def box(name,p,d,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name=name;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);return o
main,size=load('chinese-palace',36,(0,-8,0));depth=size.y
# Ayothaya roof assemblies only: avoids repeating the old INN storefront/signs.
for label,width,x,y,base in [('rear crown',32,0,12.4,16.5),('west pavilion',18,-16.5,-4,10),('east pavilion',18,16.5,-4,10)]:
 objs,dim=load('ayothaya-inn',width,(x,y,0));cut=dim.z*.40
 for o in objs:
  bm=bmesh.new();bm.from_mesh(o.data)
  bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=(0,0,cut),plane_no=(0,0,1),clear_inner=True)
  bm.to_mesh(o.data);bm.free()
  if not len(o.data.polygons):bpy.data.objects.remove(o,do_unlink=True);continue
  for v in o.data.vertices:v.co.z+=base-cut
  o.name=label+'/'+o.name
 # Columns and recessed walls carry every reused roof on a coherent plinth.
 wallw=width*.78;walld=dim.y*.63
 box(label+' wall',(x,y,base/2),(wallw,walld,base),stone)
 for z in [.25,base-.28]:box(label+' cornice',(x,y,z),(wallw+.6,walld+.6,.28),gold)
 for dx in [-wallw/2,wallw/2]:
  for dy in [-walld/2,walld/2]:
   box(label+' column',(x+dx,y+dy,base/2),(.55,.55,base),red)
   box(label+' capital',(x+dx,y+dy,base-.2),(.85,.85,.4),gold)
 for dx in [-wallw*.3,0,wallw*.3]:
  box(label+' window frame',(x+dx,y-walld/2-.06,base*.55),(1.7,.16,3.2),gold)
  box(label+' recessed window',(x+dx,y-walld/2-.16,base*.55),(1.36,.08,2.85),shadow)
  for u in [-.38,0,.38]:box(label+' grille',(x+dx+u,y-walld/2-.23,base*.55),(.06,.08,2.9),gold)
# Central gilded spire adds a vertical royal silhouette beyond the two lateral wings.
for z,r1,r2,h in [(26,2.0,1.6,.6),(26.6,1.6,1.2,.8),(27.4,1.3,.9,.7),(28.1,.9,.55,1.2),(29.3,.6,.08,5.4)]:
 bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=r1,radius2=r2,depth=h,location=(0,9,z+h/2));bpy.context.object.name='Gilded crown spire';bpy.context.object.data.materials.append(gold)
# Save an editable asset with original RO materials, then batch static faces by material.
for o in list(bpy.data.objects):
 if o.type=='EMPTY':bpy.data.objects.remove(o,do_unlink=True)
for im in bpy.data.images:
 if im.source=='FILE':im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(AUTHOR/'sirin-royal-palace.blend'))
# Geometry budget is low; join and let glTF Transform deduplicate/encode textures.
bpy.ops.object.select_all(action='DESELECT');meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();obj=bpy.context.object;obj.name='SIRIN Royal Palace — composed RO architecture'
bpy.ops.export_scene.gltf(filepath=str(SRC/'royal-palace-raw.glb'),export_format='GLB',export_materials='EXPORT')
print('ROYAL_BUILD',json.dumps({'triangles':sum(len(p.vertices)-2 for p in obj.data.polygons),'materials':len(obj.data.materials)}),flush=True)
