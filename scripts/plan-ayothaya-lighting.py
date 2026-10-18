import json,math,base64,subprocess
from pathlib import Path
import numpy as np
from shapely.geometry import box
from shapely.strtree import STRtree
base=Path('web/assets/ayothaya');nav=json.loads((base/'ground-navigation.json').read_text());types=np.frombuffer(base64.b64decode(nav['types']),dtype='u1').reshape(320,320);heights=np.frombuffer(base64.b64decode(nav['heights']),dtype='<f4').reshape(320,320,4)
sources=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {CITY_LIGHT_SOURCES} from './src/datacenter/ayothaya-decor-layout.js';console.log(JSON.stringify(CITY_LIGHT_SOURCES));"],encoding='utf8'));obstacles=STRtree([box(b[0],b[2],b[1],b[3]).buffer(.15) for b in nav['fixtureAvoid']]);added=[]
def sample(x,z):
 c=int(math.floor((x+40)/.25));r=int(math.floor((40-z)/.25));return (r,c) if 0<=r<320 and 0<=c<320 and types[r,c]==0 else None
def fit(x,z):
 points=[sample(x+dx,z+dz) for dx in [-.3,0,.3] for dz in [-.3,0,.3]]
 if any(p is None for p in points):return None
 hs=[float(heights[p].mean()) for p in points]
 if max(hs)-min(hs)>.12 or len(obstacles.query(box(x-.32,z-.32,x+.32,z+.32),predicate='intersects')):return None
 if math.hypot(x-12,z+29.45)<2 or math.hypot(x-28,z+4)<2:return None
 return sum(hs)/len(hs)
samples=[(c*.25-40+.125,40-r*.25-.125) for r in range(0,320,4) for c in range(0,320,4) if types[r,c]==0]
for _ in range(100):
 far=max((min(math.hypot(x-p['x'],z-p['z']) for p in sources),x,z) for x,z in samples)
 if far[0]<10:break
 found=None
 for k in range(21):
  r=k*.5
  for j in range(max(1,k*8)):
   a=j*2*math.pi/max(1,k*8);x=round(far[1]+math.cos(a)*r,3);z=round(far[2]+math.sin(a)*r,3)
   if min(math.hypot(x-p['x'],z-p['z']) for p in sources)<5:continue
   y=fit(x,z)
   if y is not None:found={'id':'L047','x':x,'y':y,'z':z,'height':1.6};break
  if found:break
 if not found:raise RuntimeError(('No lamp fit',far))
 added.append(found);sources.append(found)
else:raise RuntimeError('coverage')
(base/'lighting-extension.json').write_text(json.dumps({'version':1,'added':added,'sources':sources,'max_distance_m':far[0],'field_radius':16,'samples':len(samples)},separators=(',',':')),encoding='utf8');print(json.dumps({'Ayothaya_added':len(added),'max_distance':far[0],'ground_samples':len(samples)}))
