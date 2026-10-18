import json, math
from pathlib import Path
from shapely.geometry import Polygon, box, Point
from shapely.ops import unary_union
from shapely.prepared import prep
from shapely.strtree import STRtree
base=Path('web/assets/sirin');nav=json.loads((base/'ground-navigation.json').read_text());manifest=json.loads((base/'capital-manifest.json').read_text());terrain=json.loads((base/'terrain-triangles.json').read_text());cat=json.loads(Path('web/assets/ayothaya/light-catalog/catalog.json').read_text());catalog={p['id']:p for p in cat['items']}
grass=unary_union([Polygon([(x,-y) for x,y in t['xy']]) for t in terrain if t['mat']=='RO_Grass_surface']);paved=box(-178,-178,178,178).difference(grass);grass=prep(grass);paved=prep(paved)
occupied=[]
for p in manifest['placements']+manifest['characters']:
 a,b,c,d=p['envelope'];occupied.append(box(a,-d,c,-b).buffer(.65))
tree=STRtree(occupied);added=[];extra=[]
lamps=[];emitters=[]
for p,anchor in zip([p for p in manifest['placements'] if p['kind']=='lamp'],nav['lights']):
 x,y,z=anchor;h=y/.86;angle=-math.radians(p['rotation_deg']);asset='L107' if p['asset']=='M01_Lamp' else 'L229'
 lamps.append({'x':x,'z':z,'id':asset,'existing':True})
 offsets=[(-.187/2.8*h,2.56/2.8*h,.75),(.303/2.8*h,1.88/2.8*h,.55)] if asset=='L107' else [(.13*h,.73*h,.7)]
 for dx,dy,size in offsets:emitters.append({'x':x+math.cos(angle)*dx,'y':dy,'z':z-math.sin(angle)*dx,'size':size})
# Exclude main travel axes and six-metre landing/entry clearances.
portals=[(-170,0),(-162,0),(-73,-56),(-73,-51),(73,-43),(73,-38)]
def candidate(x,z):
 if abs(x)<4 or abs(z)<4 or any(math.hypot(x-a,z-b)<7 for a,b in portals):return None
 for asset,h,surface,shape in [('L047',2.8,'grass',grass),('L107',4.8,'paved',paved)]:
  dims=catalog[asset]['size'];w=dims[0]/dims[1]*h;d=dims[2]/dims[1]*h;b=box(x-w/2,z-d/2,x+w/2,z+d/2)
  if not shape.covers(b.buffer(.1)) or len(tree.query(b,predicate='intersects')) or any(b.distance(e)<1 for e in extra):continue
  return {'id':asset,'x':x,'y':0,'z':z,'height':h,'surface':surface,'bounds':[x-w/2,x+w/2,z-d/2,z+d/2]}
 return None
solid=prep(unary_union([box(b[0]-.25,b[2]-.25,b[1]+.25,b[3]+.25) for b in nav['colliders']]))
samples=[(x,z) for x in range(-176,178,4) for z in range(-176,178,4) if not solid.contains(Point(x,z))]
for iteration in range(250):
 ranked=sorted([(min(math.hypot(x-p['x'],z-p['z']) for p in lamps),x,z) for x,z in samples],reverse=True)
 if ranked[0][0]<=23:break
 target=ranked[0];found=None
 for r in range(0,31):
  for i in range(max(1,int(2*math.pi*r))):
   a=i*2*math.pi/max(1,int(2*math.pi*r));x=round(target[1]+math.cos(a)*r,2);z=round(target[2]+math.sin(a)*r,2)
   if abs(x)>175 or abs(z)>175 or min(math.hypot(x-p['x'],z-p['z']) for p in lamps)<12:continue
   found=candidate(x,z)
   if found:break
  if found:break
 if not found:raise RuntimeError(('No valid lamp position',target))
 added.append(found);lamps.append(found);b=found['bounds'];extra.append(box(b[0],b[2],b[1],b[3]));x,z,h=found['x'],found['z'],found['height']
 if found['id']=='L047':emitters.append({'x':x,'y':h*.66,'z':z,'size':.8})
 else:
  for dx,dy,size in [(-.187/2.8*h,2.56/2.8*h,.75),(.303/2.8*h,1.88/2.8*h,.55)]:emitters.append({'x':x+dx,'y':dy,'z':z,'size':size})
else:raise RuntimeError('Coverage did not converge')
result={'version':1,'existing_lamps':115,'added':added,'sources':lamps,'emitters':emitters,'field_radius':38,'coverage_grid_m':4,'coverage_samples':len(samples),'max_distance_m':ranked[0][0],'colliders':[[p['x']-.3,p['x']+.3,p['z']-.3,p['z']+.3] for p in added],'source_assets':{k:catalog[k]['source'] for k in ['L047','L107','L229']}}
(base/'lighting-layout.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8');print(json.dumps({'added':len(added),'all_lamps':len(lamps),'glows':len(emitters),'max_distance':ranked[0][0],'samples':len(samples)}))
