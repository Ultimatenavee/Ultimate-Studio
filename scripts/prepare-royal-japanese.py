"""Normalize an intact Amatsu keep in a separate background Blender process.

Preserves every roof, wall, stair, material and relative proportion. The only
geometry transformation is a single uniform scale and ground/centre alignment.
"""
import bpy, json
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
source = root / 'artifacts/royal-temple-candidates/japanese-castle1.glb'
author = root / 'assets-source/royal-temple'
author.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
points = [o.matrix_world @ Vector(p) for o in meshes for p in o.bound_box]
low = Vector(tuple(min(p[a] for p in points) for a in range(3)))
high = Vector(tuple(max(p[a] for p in points) for a in range(3)))
centre = (low + high) / 2
scale = 44 / (high.z - low.z)
offset = Vector((centre.x, centre.y, low.z))
for o in meshes:
    world = o.matrix_world.copy()
    o.parent = None
    o.matrix_world.identity()
    o.data.transform(world)
    for v in o.data.vertices:
        v.co = (v.co - offset) * scale
    o.name = 'Amatsu intact keep / ' + o.name
for o in list(bpy.data.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
for image in bpy.data.images:
    if image.source == 'FILE':
        image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(author / 'sirin-japanese-keep.blend'))
bpy.ops.export_scene.gltf(filepath=str(root / 'artifacts/royal-temple-candidates/japanese-keep-raw.glb'), export_format='GLB', export_materials='EXPORT')
metadata = {
    'source': r'data\model\일본\일본_천수각1.rsm',
    'approach': 'Intact Amatsu keep: uniform scale only, no architectural kitbash',
    'sizeXYZ': [(high.x-low.x)*scale, (high.z-low.z)*scale, (high.y-low.y)*scale],
    'triangles': sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),
    'reference': 'https://www.himejicastle.jp/en/guide/history/',
    'note': 'Stylized RO Japanese castle typology; not a measured reconstruction of Himeji or a Buddhist temple exterior.'
}
(root / 'web/assets/sirin/royal-temple/japanese-keep-build.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf8')
print('JAPANESE_KEEP', json.dumps(metadata), flush=True)
