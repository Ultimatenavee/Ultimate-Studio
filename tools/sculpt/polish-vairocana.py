"""Finish the authored v107 master: soften shoulder transitions, retain hand frames,
export bounded LODs and render the actual final meshes. No input imagery required.
"""
import bpy,math,os,json,argparse
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--master',required=True);p.add_argument('--out',required=True);p.add_argument('--preview',required=True);a=p.parse_args();os.makedirs(a.out,exist_ok=True);os.makedirs(a.preview,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(a.master));root=bpy.data.objects.get('refined-vairocana-v107');assert root
objects=[o for o in root.children if o.type=='MESH'];body=next(o for o in objects if o.name.endswith('/ body'))
def ga(v,c,w):return math.exp(-((v-c)/w)**2)
# Retract the shoulder's frontal sleeve root slightly behind the continuous robe.
# Local diffusion removes the lip where the volume-based sleeve meets the torso.
vg=body.vertex_groups.new(name='Shoulder continuity')
for v in body.data.vertices:
 x,z,y=v.co;w=ga(abs(x),1.02,.21)*ga(y,3.04,.24);front=max(0,min(1,(-z+.06)/.28));v.co.y+=.075*w*front
 if w>.002:vg.add([v.index],w,'REPLACE')
bpy.context.view_layer.objects.active=body;m=body.modifiers.new('Local sculpt smoothing','SMOOTH');m.vertex_group=vg.name;m.factor=.65;m.iterations=28;bpy.ops.object.modifier_apply(modifier=m.name);body.data.update();vg=body.vertex_groups.get('Shoulder continuity')
if vg:body.vertex_groups.remove(vg)
root['finish']='Localized anatomical shoulder smoothing; original seamless bronze microfinish; refined v107 silhouette'
scene=bpy.context.scene;scene.cycles.samples=40;cam=scene.camera;cam.data.type='ORTHO';scene.render.resolution_x=1000;scene.render.resolution_y=1100
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(a.out,'buddha-master.blend')),compress=True)
def export(name):
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.abspath(os.path.join(a.out,name)),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_yup=True)
export('buddha-detail.glb')
def render(name,loc,target,scale):
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;scene.render.filepath=os.path.join(a.preview,name+'.png');bpy.ops.render.render(write_still=True)
for name,loc,target,scale in [('front',(0,-13,3.2),(0,0,2.85),6.6),('face',(0,-9,4.6),(0,0,4.40),2.05),('three-quarter',(7,-12,5.5),(0,0,2.85),6.6),('hands',(-4,-7,3.5),(-.5,-.55,2.7),4.1),('profile',(11,-.1,4.1),(0,0,3.0),6.6)]:render(name,loc,target,scale)
clay=bpy.data.materials.new('Neutral clay');clay.use_nodes=True;bs=clay.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.35,.35,.35,1);bs.inputs['Roughness'].default_value=.75;scene.view_layers[0].material_override=clay;render('clay-front',(0,-13,3.2),(0,0,2.85),6.6);scene.view_layers[0].material_override=None
for o in objects:
 if len(o.data.polygons)>300:
  bpy.context.view_layer.objects.active=o;m=o.modifiers.new('Walking LOD','DECIMATE');m.ratio=.32;m.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=m.name)
export('buddha-walking.glb')
json.dump({'blender':bpy.app.version_string,'revision':107,'construction':root['construction'],'finish':root['finish'],'detail':os.path.getsize(os.path.join(a.out,'buddha-detail.glb')),'walking':os.path.getsize(os.path.join(a.out,'buddha-walking.glb')),'walkingFaces':sum(len(o.data.polygons) for o in objects)},open(os.path.join(a.out,'build-metrics.json'),'w'),indent=2)
print('FINISHED REFINED MASTER',flush=True)
