"""Run in a separate Blender background process. Never edits the uploaded GLB."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];out=root/'web/assets/sirin/royal-temple';out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:/Users/benz5/Desktop/Model 3D/Buddha.glb')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
info=[]
for o in meshes:
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 info.append({'name':o.name,'bounds':list(o.dimensions),'polygons':len(o.data.polygons)})
 if len(o.data.polygons)>90000:
  mod=o.modifiers.new('Web silhouette-preserving reduction','DECIMATE');mod.ratio=90000/len(o.data.polygons);bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=True
for im in bpy.data.images:
 if im.size[0]>2048 or im.size[1]>2048:
  scale=2048/max(im.size);im.scale(round(im.size[0]*scale),round(im.size[1]*scale))
for mat in bpy.data.materials:
 if mat.use_nodes:
  for node in mat.node_tree.nodes:
   if node.type=='BSDF_PRINCIPLED':node.inputs['Specular IOR Level'].default_value=.35
bpy.ops.export_scene.gltf(filepath=str(out/'buddha.glb'),export_format='GLB',export_image_format='JPEG',export_jpeg_quality=88,export_materials='EXPORT',export_extras=True)
info.append({'output_bytes':(out/'buddha.glb').stat().st_size,'polygons':sum(len(o.data.polygons)for o in meshes)})
(out/'buddha-build.json').write_text(json.dumps(info,indent=2))
print('BUDDHA_BUILD',json.dumps(info),flush=True)
