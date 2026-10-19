"""City occupants: road-facing staff and surface/prop-aware monster habitats.

Authoring dependency: shapely. Runtime only ships the resulting manifest.
"""
import json,math
from shapely.geometry import Polygon,Point,box
from shapely.ops import unary_union

MONSTERS={
 'Poring':('poring','normal'), 'Lunatic':('lunatic','normal'),
 'Drops':('drops','normal'),'Poporing':('poporing','normal'),'Fabre':('fabre','normal'),
 'Picky':('picky','normal'),'Yoyo':('yoyo','normal'),'Smokie':('smokie','normal'),
 'Spore':('spore','normal'),'Rocker':('rocker','normal'),
 'Metaling':('metaling','normal'),'Venatu':('venatu','normal'),'Dimik':('dimik','normal'),
 'Angeling':('angeling','mini'),'Deviling':('deviling','mini'),'Ghostring':('ghostring','mini'),
 'Mastering':('mastering','mini'),'Eclipse':('eclipse','mini'),'Vocal':('vocal','mini'),
 'Eddga':('eddga','mvp'),'Vesper':('apocalips_h','mvp'),'Moonlight':('moonlight','mvp'),
 'GoldenThiefBug':('golden_bug','mvp'),'Pharaoh':('pharaoh','mvp'),
 'Baphomet':('baphomet','mvp'),'Maya':('maya','mvp'),'Mistress':('mistress','mvp'),
}
# Centers describe a neighborhood, not an unvalidated exact spawn point.
ZONES=[
 ('northwest-woodland',(-142,-130),[('Eddga',2.3),('Yoyo',.72),('Smokie',.7),('Fabre',.42),('Lunatic',.55)]),
 ('northeast-engineering',(142,-130),[('Vesper',2.7),('Metaling',.65),('Dimik',1.25),('Venatu',1.4),('Drops',.52)]),
 ('northern-temple',(0,-130),[('Moonlight',2.05),('Angeling',1.0),('Poring',.6),('Lunatic',.55),('Picky',.45)]),
 ('western-market',(-73,-130),[('GoldenThiefBug',1.8),('Mastering',.95),('Drops',.55),('Picky',.45),('Poporing',.65)]),
 ('eastern-archive',(73,-130),[('Pharaoh',2.25),('Ghostring',1.05),('Metaling',.65),('Venatu',1.25),('Poring',.6)]),
 ('library-gardens',(-73,-48),[('Angeling',1.0),('Mastering',.9),('Poring',.6),('Poporing',.65),('Lunatic',.55)]),
 ('datacenter-gardens',(73,-48),[('Dimik',1.35),('Venatu',1.4),('Metaling',.65),('Mastering',.9),('Drops',.52)]),
 ('western-research',(-38,0),[('Ghostring',1.05),('Metaling',.65),('Poporing',.65),('Poring',.6),('Picky',.48)]),
 ('eastern-research',(38,0),[('Deviling',1.1),('Metaling',.65),('Smokie',.7),('Yoyo',.72),('Poring',.6)]),
 ('southwest-community',(-73,130),[('Eclipse',1.0),('Rocker',1.05),('Smokie',.7),('Spore',.65),('Lunatic',.55)]),
 ('southeast-community',(73,130),[('Vocal',1.3),('Rocker',1.0),('Picky',.48),('Yoyo',.72),('Fabre',.42)]),
 ('southern-gateway',(0,149),[('Baphomet',2.8),('Drops',.55),('Poporing',.65),('Spore',.72),('Lunatic',.55)]),
 ('southwest-botanical',(-142,125),[('Maya',2.2),('Fabre',.48),('Rocker',1.05),('Smokie',.7),('Poring',.6)]),
 ('southeast-botanical',(142,125),[('Mistress',1.7),('Eclipse',1.0),('Yoyo',.72),('Spore',.65),('Lunatic',.55)]),
]

def plan(root,assets,original,terrain):
    layout=json.loads((root/'web/assets/sirin/labs/layout.json').read_text())
    surfaces={s:unary_union([Polygon([[x,-y] for x,y in t['xy']]) for t in terrain if ('grass' if t['mat']=='RO_Grass_surface' else 'paved')==s]) for s in ['grass','paved']}
    parcels=[box(*[b['parcel'][0],b['parcel'][2],b['parcel'][1],b['parcel'][3]]) for b in layout['buildings']]
    obstacles=[]
    for p in original['placements']:
        if p['object'] in layout['replaces']:continue
        a,b,c,d=p['envelope'];bounds=(a,-d,c,-b);shape=box(*bounds)
        if any(shape.intersects(parcel) for parcel in parcels):continue
        obstacles.append(bounds)
    obstacles.extend((p.bounds[0],p.bounds[1],p.bounds[2],p.bounds[3]) for p in parcels)
    occupied=unary_union([box(*b) for b in obstacles])
    # Keep avenue centers, entrance lanes, and all existing warp approaches open.
    reserved=unary_union([box(x-7,-178,x+7,178) for x in [-108,0,108]]+[box(-178,z-4.5,178,z+4.5) for z in [-108,-35,35,108]]+[box(-178,-4,-157,4),box(-77,-60,-69,-36),box(69,-47,77,-32)])
    placements=[];territories=[]
    for i,p in enumerate(original['characters']):
        x,y,z=p['position'];z_world=-y
        entry={'name':p['object'],'id':p['sprite'],'x':x,'y':z,'z':z_world,'height':p['height_m'],'role':p['role'],'surface':p['surface'],'phase':i*.731}
        if assets[p['sprite']]['kind']=='npc':
            if (-97<x<-48 and -62<z_world<-40) or (50<x<96 and -52<z_world<-36):target=[x,z_world+12]
            else:target=min([[rx,z_world] for rx in [-108,0,108]]+[[x,rz] for rz in [-108,-35,35,108]],key=lambda q:math.dist(q,[x,z_world]))
            entry['facingTarget']=target;entry['heading']=math.atan2(target[0]-x,target[1]-z_world)
        else:entry.update(heading=0,rank='normal',zone='original-parks')
        placements.append(entry);territories.append(Point(x,z_world).buffer(2.2 if p['sprite'] in MONSTERS else 1.25))
    for zone,(cx,cz),members in ZONES:
        for j,(identifier,height) in enumerate(members):
            meta=assets[identifier];rank=MONSTERS[identifier][1];roam=rank!='mvp';radius=height*.28
            # Include all visible poses and the entire roaming territory in clearance.
            visual=max(radius,height*meta['width']/meta['bodyHeight']*.5)
            clearance=visual+.35+(1.3 if roam else 0)
            candidates=[]
            for ox in range(-36,37,2):
                for oz in range(-36,37,2):
                    x,z=cx+ox,cz+oz
                    if abs(x)>166 or abs(z)>164:continue
                    candidates.append((math.hypot(ox,oz)+abs(math.sin(x*3+z*7))*.2,x,z))
            selected=None
            for _,x,z in sorted(candidates):
                footprint=box(x-clearance,z-clearance,x+clearance,z+clearance)
                if footprint.intersects(occupied) or footprint.intersects(reserved) or any(footprint.intersects(t) for t in territories):continue
                # Engineered creatures/bosses may occupy a paved side plaza;
                # wildlife prefers grass. Each complete territory stays on one surface.
                prefer=['paved','grass'] if identifier in ['Vesper','Venatu','Dimik','Metaling','Pharaoh','Baphomet','GoldenThiefBug'] else ['grass','paved']
                surface=next((s for s in prefer if surfaces[s].covers(footprint)),None)
                if surface:selected=(x,z,surface,footprint);break
            if not selected:raise ValueError('No clear habitat for '+zone+'/'+identifier)
            x,z,surface,territory=selected;territories.append(territory)
            placements.append({'name':'CITY_MONSTER_'+zone+'_'+identifier,'id':identifier,'x':x,'y':0,'z':z,'height':height,'radius':radius,'heading':0,'phase':len(placements)*.731,'surface':surface,'rank':rank,'zone':zone,'role':'neighborhood creature' if roam else 'landmark guardian','roam':roam,'clearance':clearance})
    for p in placements:
        if assets[p['id']]['kind']!='monster':continue
        x,z=p['x'],p['z'];reach=3+max(1,p['height']*.28)
        p['habitat']=[[[a,-b] for a,b in t['xy']] for t in terrain if ('grass' if t['mat']=='RO_Grass_surface' else 'paved')==p['surface'] and min(v[0] for v in t['xy'])<x+reach and max(v[0] for v in t['xy'])>x-reach and min(v[1] for v in t['xy'])<-z+reach and max(v[1] for v in t['xy'])>-z-reach]
        p['obstacles']=[b for b in obstacles if b[0]<x+reach and b[2]>x-reach and b[1]<z+reach and b[3]>z-reach]
    return placements
