import json,base64,math
from pathlib import Path
import numpy as np
from shapely.geometry import MultiPoint,Point
base=Path('web/assets/ayothaya');g=json.loads((base/'ayothaya.gltf').read_text());buffers=[(base/b['uri']).read_bytes() for b in g['buffers']]
counts={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16};types={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dtype=np.dtype(types[a['componentType']]);return np.ndarray((a['count'],counts[a['type']]),dtype,buffer=buffers[v['buffer']],offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',dtype.itemsize*counts[a['type']]),dtype.itemsize))
def matrix(n):
 if 'matrix' in n:return np.array(n['matrix']).reshape(4,4).T
 x,y,z,w=n.get('rotation',[0,0,0,1]);m=np.eye(4);m[:3,:3]=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0]);return m
def meshes(i,parent=np.eye(4)):
 n=g['nodes'][i];m=parent@matrix(n)
 if 'mesh' in n:
  for p in g['meshes'][n['mesh']]['primitives']:
   a=acc(p['attributes']['POSITION']);a=(np.column_stack((a,np.ones(len(a))))@m.T)[:,:3]*.05;idx=acc(p['indices']).reshape(-1) if 'indices' in p else np.arange(len(a));yield a,idx.reshape(-1,3)
 for c in n.get('children',[]):yield from meshes(c,m)
nav=json.loads((base/'navigation.json').read_text());old=np.frombuffer(base64.b64decode(nav['types']),dtype='u1').reshape(320,320);heights=np.frombuffer(base64.b64decode(nav['heights']),dtype='<f4').copy().reshape(320,320,4)
height=np.full((321,321),-np.inf);building=[];obstacles=[];fixture_avoid=[]
for i in g['scenes'][0]['nodes']:
 n=g['nodes'][i];name=n.get('name','');solid=any(k in name for k in ['주점.rsm','도구점.rsm','무기점.rsm','여관.rsm','사원.rsm','민가01.rsm','민가02.rsm','탑.rsm']);ground=name=='terrain' or any(k in name for k in ['다리.rsm','나무받침대'])
 parts=list(meshes(i))
 if parts and name not in ['terrain','water','sun']:
  vv=np.concatenate([p[0] for p in parts]);fixture_avoid.append([float(vv[:,0].min()),float(vv[:,0].max()),float(vv[:,2].min()),float(vv[:,2].max())])
 if not (solid or ground):continue
 if solid:
  verts=np.concatenate([p[0] for p in parts]);hull=MultiPoint(verts[:,[0,2]]).convex_hull;building.append(hull);obstacles.append({'source':name,'polygon':list(hull.exterior.coords)})
 if not ground:continue
 for vertices,indices in parts:
  for tri in vertices[indices]:
   normal=np.cross(tri[1]-tri[0],tri[2]-tri[0]);length=np.linalg.norm(normal)
   if length<1e-8 or abs(normal[1])/length<.45:continue
   x=tri[:,0];z=tri[:,2];c0=max(0,math.ceil((min(x)+40)/.25-1e-5));c1=min(320,math.floor((max(x)+40)/.25+1e-5));r0=max(0,math.ceil((40-max(z))/.25-1e-5));r1=min(320,math.floor((40-min(z))/.25+1e-5))
   if c0>c1 or r0>r1:continue
   xx,zz=np.meshgrid(np.arange(c0,c1+1)*.25-40,40-np.arange(r0,r1+1)*.25);den=(z[1]-z[2])*(x[0]-x[2])+(x[2]-x[1])*(z[0]-z[2]);a=((z[1]-z[2])*(xx-x[2])+(x[2]-x[1])*(zz-z[2]))/den;b=((z[2]-z[0])*(xx-x[2])+(x[0]-x[2])*(zz-z[2]))/den;c=1-a-b;inside=(a>=-1e-5)&(b>=-1e-5)&(c>=-1e-5);hh=a*tri[0,1]+b*tri[1,1]+c*tri[2,1];region=height[r0:r1+1,c0:c1+1];np.maximum(region,np.where(inside,hh,-np.inf),out=region)
# The GAT interpolation order is north-west/north-east/south-west/south-east.
corners=np.stack([height[:-1,:-1],height[:-1,1:],height[1:,:-1],height[1:,1:]],axis=2)
land=np.isfinite(corners).all(axis=2)&(corners.min(axis=2)>-1.005)
from shapely.ops import unary_union
from shapely.prepared import prep
solid=prep(unary_union(building));blocked=np.array([[solid.contains(Point((c+.5)*.25-40,40-(r+.5)*.25)) for c in range(320)]for r in range(320)])
# Retain the narrow existing temple doorway route while the rest of the footprint stays solid.
for r in range(320):
 for c in range(320):
  x=(c+.5)*.25-40;z=40-(r+.5)*.25
  if abs(x-12)<1.2 and -29.9<z<-24 and old[r,c]==0:blocked[r,c]=False
allowed=((old==0)|land)&~blocked;new=(old!=0)&allowed;heights[new]=corners[new];nav['types']=base64.b64encode(np.where(allowed,0,1).astype('u1').tobytes()).decode();nav['heights']=base64.b64encode(heights.astype('<f4').tobytes()).decode();nav['surfacePolicy']='All physical land/decks; solid building footprints and water excluded';nav['buildings']=obstacles;nav['fixtureAvoid']=fixture_avoid
(base/'ground-navigation.json').write_text(json.dumps(nav,separators=(',',':'),ensure_ascii=False),encoding='utf8');print(json.dumps({'old_walkable':int((old==0).sum()),'new_walkable':int(allowed.sum()),'new_cells':int(new.sum()),'buildings':len(building),'height_range':[float(height[np.isfinite(height)].min()),float(height[np.isfinite(height)].max())]}))
# Keep only buildings, towers and structural gate sections solid in SIRIN.
sirin=Path('web/assets/sirin');sn=json.loads((sirin/'navigation.json').read_text());manifest=json.loads((sirin/'capital-manifest.json').read_text());sn['colliders']=[]
for p in manifest['placements']:
 if p['kind'] not in ['building','landmark','gate']:continue
 a,b,c,d=p['envelope'];sn['colliders'].append([a,c,-d,-b])
sn['surfacePolicy']='All terrain, excluding buildings, towers and structural gate sections';(sirin/'ground-navigation.json').write_text(json.dumps(sn,separators=(',',':')),encoding='utf8');print('SIRIN structural blockers',len(sn['colliders']))
