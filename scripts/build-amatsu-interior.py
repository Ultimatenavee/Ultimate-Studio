"""Author the Kamakura hall with original Amatsu surfaces and Japanese props.

Run in a separate Blender process. Z-up authoring uses (x, -worldZ, worldY).
The altar, clear central aisle and all furniture footprints are explicit.
"""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'artifacts/royal-temple-candidates'
TEX=ROOT/'assets-source/royal-temple/amatsu-textures'
OUT=ROOT/'web/assets/sirin/royal-temple'
bpy.ops.wm.read_factory_settings(use_empty=True)
static=[];overhead=[];counts={};colliders=[];templates={}

def material(name,texture=None,crop=None,color=(1,1,1),emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.85
 if texture:
  im=bpy.data.images.load(str(TEX/(texture+'.png')),check_existing=True)
  if crop:
   import numpy as np
   w,h=im.size;data=np.array(im.pixels[:]).reshape(h,w,4);x0,y0,x1,y1=crop
   data=data[int((1-y1)*h):int((1-y0)*h),int(x0*w):int(x1*w)].copy()
   tile=bpy.data.images.new(name+' original RO crop',width=data.shape[1],height=data.shape[0],alpha=True);tile.pixels=data.flatten();tile.pack();im=tile
  else:im.pack()
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 if emit:p.inputs['Emission Color'].default_value=(1,.62,.25,1);p.inputs['Emission Strength'].default_value=emit
 return m
wood=material('Amatsu timber planks','japan_bottom02')
dark=material('Dark stained Amatsu timber','japan_bottom02',color=(.25,.20,.16))
plaster=material('Amatsu lime plaster','japan_in04',(.02,.34,.31,.91))
tatami=material('Amatsu woven tatami','japan_bottom01',(0,0,.5,.5))
stone=material('Amatsu stone inset','japan_bottom01',(.04,.54,.44,.94))
paper=material('Warm washi inset','japan_door03',(.18,.14,.81,.60))
brass=material('Restrained aged brass',color=(.40,.27,.10))

def box(name,x,z,y,w,d,h,mat,ceiling=False,repeat=1):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y+h/2));o=bpy.context.object;o.name=name;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(mat)
 if repeat!=1:
  for uv in o.data.uv_layers.active.data:uv.uv*=repeat
 (overhead if ceiling else static).append(o);return o

def prop(key,x,z,y,height=None,width=None,yaw=0,ceiling=False):
 if key not in templates:
  before=set(bpy.data.objects);asset='japanese-lantern' if key=='japanese-pendant' else key;bpy.ops.import_scene.gltf(filepath=str(SRC/(asset+'.glb')))
  objs=[o for o in bpy.data.objects if o not in before and o.type=='MESH']
  for o in objs:
   world=o.matrix_world.copy();o.parent=None;o.matrix_world.identity();o.data.transform(world)
  if key=='japanese-pendant':
   vertices=[v.co.z for o in objs for v in o.data.vertices];cut=min(vertices)+(max(vertices)-min(vertices))*.43
   for o in objs:
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=(0,0,cut),plane_no=(0,0,1),clear_inner=True);bm.to_mesh(o.data);bm.free()
  points=[v.co for o in objs for v in o.data.vertices];lo=Vector(tuple(min(p[a]for p in points)for a in range(3)));hi=Vector(tuple(max(p[a]for p in points)for a in range(3)))
  templates[key]=(objs,lo,hi)
 objs,lo,hi=templates[key];centre=(lo+hi)/2;k=height/(hi.z-lo.z) if height else width/(hi.x-lo.x)
 # Face local GLTF +Z toward the room; preserve all asset proportions.
 transform=Matrix.Translation(Vector((x,-z,y))) @ Matrix.Rotation(yaw,4,'Z') @ Matrix.Diagonal((k,k,k,1)) @ Matrix.Translation(-Vector((centre.x,centre.y,lo.z)))
 for src in objs:
  o=src.copy();o.data=src.data.copy();bpy.context.collection.objects.link(o);o.data.transform(transform);o.name=key; (overhead if ceiling else static).append(o)
 counts[key]=counts.get(key,0)+1
 return (hi-lo)*k

def blocked(x,z,w,d):colliders.append({'minX':round(x-w/2,3),'maxX':round(x+w/2,3),'minZ':round(z-d/2,3),'maxZ':round(z+d/2,3)})

# Timber floor and plaster envelope; original 4m exit opening remains clear.
box('Timber floor',0,0,-.24,24,34,.24,wood,repeat=12)
box('Rear plaster',0,-17,0,24,.35,11,plaster,repeat=5)
for x in [-12,12]:box('Side plaster',x,0,0,.35,34,11,plaster,repeat=5)
for x in [-7,7]:box('Entry plaster',x,17,0,10,.35,11,plaster,repeat=3)
box('Entry lintel',0,17,5,4,.35,6,plaster)
# Engawa perimeter rails, exposed load-bearing beams and ceiling coffers.
for x in [-11.75,11.75]:
 for y,h in [(0,.35),(1,.15),(5.25,.30),(7.3,.25),(10.35,.45)]:box('Side wall timber rail',x,0,y,.24,34,h,dark,repeat=5)
for z in [-16.75,16.75]:
 for y in [1,5.25,7.3,10.35]:box('End wall timber rail',0,z,y,23.6,.24,.25,dark,repeat=5)
box('Coffered ceiling',0,0,10.9,24,34,.2,wood,True,repeat=9)
for z in [-15,-12,-9,-6,-3,0,3,6,9,12,15]:box('Cross roof beams',0,z,10.4,24,.3,.5,dark,True,repeat=6)
for x in [-9,-6,-3,0,3,6,9]:box('Long roof beams',x,0,10.55,.28,34,.35,dark,True,repeat=6)
for x in [-8.4,8.4]:
 for z in [-12,-6,0,6,12]:
  box('Stone column shoe',x,z,0,1.9,1.9,.16,stone)
  prop('amatsu-column',x,z,.16,height=10.25)
  box('Column head crosspiece',x,z,10.12,2.45,.5,.28,dark,True)
  blocked(x,z,1.9,1.9)

# Paired doors in each wall bay: pine-painted fusuma near the altar,
# translucent shoji around the seating area. Frames meet wall rails.
for side in [-1,1]:
 for z in [-12,-6,0,6,12]:
  for dz in [-1.18,1.18]:
   key=('amatsu-shoji1' if dz<0 else 'amatsu-shoji2') if z<=-6 else 'amatsu-shoji3'
   prop(key,side*11.65,z+dz,.5,height=4.6,yaw=-side*math.pi/2)
  box('Window head sill',side*11.65,z,5.12,.32,5.3,.18,dark)
  # High transom windows carry the same Amatsu paper palette.
  box('Upper washi window',side*11.72,z,7.7,.10,4.8,1.9,paper)
  for dz in [-2.4,-1.6,-.8,0,.8,1.6,2.4]:box('Upper lattice',side*11.62,z+dz,7.7,.15,.055,1.9,dark)
  for y in [7.7,8.65,9.6]:box('Upper lattice rail',side*11.62,z,y,.15,4.85,.055,dark)

# Large timber dais carries the statue and its own stone base. No Thai altar.
for y,w,d,h,mat in [(0,11.4,9,.35,dark),(.35,10.8,8.4,.22,wood),(.57,10.2,7.8,.4,dark),(.97,9.6,7.2,.13,wood)]:box('Buddha timber dais',0,-11,y,w,d,h,mat,repeat=3)
blocked(0,-10.9,11.6,9.2)
prop('japanese-screen',0,-15.2,1.1,width=10.6)
# Symmetrical side flower/bonsai stands with objects resting exactly on tops.
for x in [-6.4,6.4]:
 size=prop('amatsu-table',x,-10.1,0,height=.9);prop('amatsu-vase',x,-10.1,size.z,height=.95);blocked(x,-10.1,size.x+.12,size.y+.12)
for x in [-5,5]:
 # Pair of softly glowing floor lanterns flanking the altar.
 prop('japanese-lantern',x,-5.2,0,height=2.1);blocked(x,-5.2,1.05,1.05)
# Amatsu low offering table with stable legs, on the existing protected footprint.
prop('amatsu-table',0,-5.5,0,height=1.15);blocked(0,-5.5,3.3,1.5)
for x in [-.6,.6]:prop('amatsu-jar',x,-5.5,1.15,height=.32)

# Tatami seating islands leave the centre aisle (x=-2.5..2.5) unobstructed.
for side in [-1,1]:
 for z in [-1.5,2.5,6.5,10.5]:
  for dx in [0,1.85]:box('Individual Amatsu tatami',side*(3.6+dx),z,.015,1.8,3.6,.045,tatami)
  for dz in [-.65,.65]:prop('japanese-cushion',side*4.55,z+dz,.06,width=.72,yaw=0)

# Furnished side alcoves; all substantial objects have navigation footprints.
for x in [-10.15,10.15]:
 for z in [-14.4,-3,5]:
  size=prop('amatsu-table',x,z,0,height=.9);prop('amatsu-bonsai',x,z,size.z,height=1.15)
  blocked(x,z,size.x+.12,size.y+.12)
 for z in [-9,1,15]:
  prop('japanese-lantern',x,z,0,height=1.8);blocked(x,z,.9,.9)
 # Floor vases and jars clustered near rear wall, away from the exit axis.
 prop('amatsu-vase',x,-16,0,height=1.2);blocked(x,-16,.65,.65)
 prop('amatsu-jar',x,13.6,0,height=.65);blocked(x,13.6,.8,.8)

# One irori alcove, with a real timber frame supporting its kettle hook.
prop('amatsu-teacup',-10.1,9.5,0,height=1.8);blocked(-10.1,9.5,1.8,1.8)
for x in [-10.95,-9.25]:box('Irori frame upright',x,9.5,0,.12,.12,2.3,dark)
box('Irori frame crossbar',-10.1,9.5,2.3,1.9,.13,.13,dark)
box('Kettle hook support',-10.1,9.5,1.8,.035,.035,.5,brass)
# Quiet screen/reading niche opposite the hearth.
prop('japanese-screen',10.35,10.3,0,height=1.9,yaw=-math.pi/2);blocked(10.35,10.3,.85,4.25)

# Paper globes are adapted from the Japanese lamp by removing its floor stand.
# Each globe has a thin suspension cord that reaches an actual roof beam.
for x in [-4.8,4.8]:
 for z in [-9,0,9]:
  prop('japanese-pendant',x,z,8.3,height=1.25,ceiling=True)
  box('Lantern suspension cord',x,z,9.55,.035,.035,.85,brass,True)

# Remove import templates, retain only placed instances and structural meshes.
for objs,_,_ in templates.values():
 for o in objs:bpy.data.objects.remove(o,do_unlink=True)
for o in list(bpy.data.objects):
 if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
for im in bpy.data.images:
 if im.source=='FILE':im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets-source/royal-temple/sirin-amatsu-interior.blend'))
for name,objects in [('AmatsuInterior',static),('AmatsuCeiling',overhead)]:
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=name
bpy.ops.export_scene.gltf(filepath=str(SRC/'amatsu-interior-raw.glb'),export_format='GLB',export_materials='EXPORT')
metadata={'theme':'Amatsu Japanese interior','models':counts,'columns':10,'area':816,'ceilingHeight':11,'colliders':colliders,'clearAisleWidth':5,'sources':'amatsu-interior-sources.json'}
(OUT/'amatsu-interior-layout.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
(ROOT/'src/datacenter/royal-interior-obstacles.js').write_text('// Generated by scripts/build-amatsu-interior.py from placed object footprints.\nexport const ROYAL_OBSTACLES='+json.dumps(colliders,separators=(',',':'))+';\n',encoding='utf8')
(OUT/'amatsu-interior-sources.json').write_bytes((ROOT/'assets-source/royal-temple/amatsu-interior-sources.json').read_bytes())
print('AMATSU_INTERIOR',json.dumps(metadata),flush=True)
