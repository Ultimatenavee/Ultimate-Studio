"""Render two actual GLBs in identical neutral clay, with equal cameras/lights."""
import bpy,os,argparse
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--old',required=True);p.add_argument('--new',required=True);p.add_argument('--out',required=True);p.add_argument('--old-label',default='v104');p.add_argument('--new-label',default='NEW GEOMETRY');a=p.parse_args()
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for file,x in [(a.old,-2.8),(a.new,2.8)]:
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=os.path.abspath(file));imported=set(bpy.data.objects)-before
 root=[o for o in imported if o.parent not in imported]
 for o in root:o.location.x+=x
m=bpy.data.materials.new('Identical neutral clay');m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(.33,.33,.33,1);b.inputs['Roughness'].default_value=.75
scene=bpy.context.scene;scene.view_layers[0].material_override=m;scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=True;scene.world.color=(.17,.17,.17);scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
for x in [-2.8,2.8]:
 for name,loc,power,size in [('key',(-4,-6,8),1500,5),('fill',(5,-3,5),900,4),('rim',(1,3,7),1300,3)]:
  d=bpy.data.lights.new(name,'AREA');d.energy=power*.32;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=(loc[0]+x,loc[1],loc[2]);o.rotation_euler=(Vector((x,0,2.8))-o.location).to_track_quat('-Z','Y').to_euler()
for x,label in [(-2.8,a.old_label),(2.8,a.new_label)]:
 font=bpy.data.curves.new(label,'FONT');font.body=label;font.align_x='CENTER';font.size=.20;o=bpy.data.objects.new(label,font);bpy.context.collection.objects.link(o);o.location=(x,-1,-.30);o.rotation_euler=(1.57079632679,0,0)
d=bpy.data.cameras.new('Matched comparison');cam=bpy.data.objects.new('Matched comparison',d);bpy.context.collection.objects.link(cam);scene.camera=cam;d.type='ORTHO';d.ortho_scale=11.6;cam.location=(0,-15,3.2);cam.rotation_euler=(Vector((0,0,2.85))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.abspath(a.out);bpy.ops.render.render(write_still=True)
