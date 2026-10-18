"""Derive concave walking blockers from the shipped GLB, below roof height.

Placement envelopes are suitable for urban layout, not character collision.
Keep their broad phase, but clip actual building triangles to the walking body
height and preserve the resulting concave perimeter for the narrow phase.
"""
import json
import struct
from pathlib import Path

import numpy as np
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union

base = Path('web/assets/sirin')
data = (base / 'capital.glb').read_bytes()
length = struct.unpack_from('<I', data, 12)[0]
g = json.loads(data[20:20 + length])
binary = data[28 + length:]
types = {5121: 'u1', 5123: '<u2', 5125: '<u4', 5126: '<f4'}
counts = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def accessor(i):
    a = g['accessors'][i]
    v = g['bufferViews'][a['bufferView']]
    dtype = np.dtype(types[a['componentType']])
    return np.ndarray((a['count'], counts[a['type']]), dtype, buffer=binary,
                      offset=v.get('byteOffset', 0) + a.get('byteOffset', 0),
                      strides=(v.get('byteStride', dtype.itemsize * counts[a['type']]), dtype.itemsize))


def matrix(n):
    if 'matrix' in n:
        return np.array(n['matrix']).reshape(4, 4).T
    x, y, z, w = n.get('rotation', [0, 0, 0, 1])
    m = np.eye(4)
    m[:3, :3] = np.array([
        [1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
        [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
        [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]]) @ np.diag(n.get('scale', [1, 1, 1]))
    m[:3, 3] = n.get('translation', [0, 0, 0])
    return m


placements = [p for p in json.loads((base / 'capital-manifest.json').read_text())['placements']
              if p['kind'] in ['building', 'landmark', 'gate']]
parts = [[] for p in placements]
sources = [p['source'].replace('data\\model\\', '') for p in placements]


def visit(i, parent=np.eye(4)):
    n = g['nodes'][i]
    world = parent @ matrix(n)
    if 'mesh' in n:
        mesh = g['meshes'][n['mesh']]
        candidates = [j for j, source in enumerate(sources) if mesh.get('name', '').startswith(source + '/')]
        if candidates:
            inst = n.get('extensions', {}).get('EXT_mesh_gpu_instancing', {}).get('attributes')
            matrices = [world]
            if inst:
                attrs = {k.lower(): accessor(v) for k, v in inst.items()}
                matrices = [world @ matrix({k: v[j] for k, v in attrs.items()})
                            for j in range(len(next(iter(attrs.values()))))]
            for transform in matrices:
                triangles = []
                for p in mesh['primitives']:
                    a = accessor(p['attributes']['POSITION'])
                    a = (np.column_stack((a, np.ones(len(a)))) @ transform.T)[:, :3]
                    idx = accessor(p['indices']).reshape(-1) if 'indices' in p else np.arange(len(a))
                    triangles.append(a[idx.reshape(-1, 3)])
                triangles = np.concatenate(triangles)
                center = (triangles.min(axis=(0, 1)) + triangles.max(axis=(0, 1))) / 2
                j = min(candidates, key=lambda j: (center[0]-placements[j]['position'][0])**2 +
                        (center[2]+placements[j]['position'][1])**2)
                parts[j].append(triangles)
    for child in n.get('children', []):
        visit(child, world)


for root in g['scenes'][g.get('scene', 0)]['nodes']:
    visit(root)


def clip(poly, height, above):
    out = []
    for a, b in zip(poly, poly[1:] + poly[:1]):
        ia, ib = (a[1] >= height, b[1] >= height) if above else (a[1] <= height, b[1] <= height)
        if ia:
            out.append(a)
        if ia != ib:
            out.append(a + (b-a) * ((height-a[1]) / (b[1]-a[1])))
    return out


nav = json.loads((base / 'ground-navigation.json').read_text())
nav['footprints'] = []
released = 0
for p, meshes in zip(placements, parts):
    assert meshes, p['object']
    triangles = np.concatenate(meshes)
    a, b, c, d = p['envelope']
    expected = np.array([a, -d, c, -b])
    actual = np.array([triangles[:, :, 0].min(), triangles[:, :, 2].min(),
                       triangles[:, :, 0].max(), triangles[:, :, 2].max()])
    assert np.all(actual[:2] >= expected[:2]-.02) and np.all(actual[2:] <= expected[2:]+.02), (p['object'], actual, expected)
    # Raised floors are still part of the building. Include its lower body,
    # while omitting the roof/eaves which inflated the old full-height bounds.
    body_top = max(1.65, float(triangles[:, :, 1].max()) * .35)
    polys = []
    for triangle in triangles:
        poly = clip(clip(list(triangle), .35, True), body_top, False)
        if len(poly) < 3:
            continue
        shape = Polygon([(v[0], v[2]) for v in poly])
        if shape.area > 1e-8:
            polys.append(shape)
        else:
            # Vertical walls project to lines, but must still form solid shells.
            polys.append(LineString([(v[0], v[2]) for v in poly]).buffer(.01))
    assert polys, p['object']
    # Close sub-centimetre export seams without spanning courtyards/corners.
    shape = unary_union(polys).buffer(.015, join_style=2).buffer(-.015, join_style=2)
    pieces = list(shape.geoms) if shape.geom_type == 'MultiPolygon' else [shape]
    # Closed wall shells enclose solid rooms; do not allow minimap entry inside.
    shape = unary_union([Polygon(s.exterior) for s in pieces]).simplify(.015, preserve_topology=True)
    pieces = list(shape.geoms) if shape.geom_type == 'MultiPolygon' else [shape]
    nav['footprints'].append({'object': p['object'], 'polygons': [
        [[round(x, 4), round(z, 4)] for x, z in s.exterior.coords[:-1]] for s in pieces]})
    released += (c-a)*(d-b) - shape.area
nav['surfacePolicy'] = 'All terrain; concave building geometry at character height, excluding overhead roofs'
nav['footprintVersion'] = 1
(base / 'ground-navigation.json').write_text(json.dumps(nav, separators=(',', ':')), encoding='utf8')
print(json.dumps({'buildings': len(parts), 'released_square_metres': round(released, 2),
                  'vertices': sum(len(p) for f in nav['footprints'] for p in f['polygons'])}))
