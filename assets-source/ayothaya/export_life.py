"""Export original RO NPC/monster ACT poses, directions and timing for the browser.

Sprites retain one common ACT origin and ground anchor across every frame.
Only identical composed frames are deduplicated; animation clips keep all timing.
"""
import hashlib,json,math,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
cfg=json.loads((ROOT/'scripts/ayothaya-local.json').read_text(encoding='utf8'))
sys.path.insert(0,cfg['ragx'])
from ragx.client import open_stack
from ragx.formats import spr,act
archive=open_stack(cfg['client']);names=set(archive.namelist())
out=ROOT/'web/assets/ragnarok-life';out.mkdir(parents=True,exist_ok=True)
sources={p['id']:p['source_spr'] for p in json.loads((ROOT/'web/assets/sirin/life-provenance.json').read_text(encoding='utf8'))['sprites']}
sources['Researcher']=r'data\sprite\npc\4_f_science.spr'
for key in ['Poring','Lunatic']:
    source='data\\sprite\\몬스터\\'+key.lower()+'.spr'
    if source in names:sources[key]=source
assets={}
for key,source in sources.items():
    raw=archive.read(source);action_raw=archive.read(source[:-4]+'.act')
    sprite=spr.parse(raw);actions=act.parse(action_raw).actions;images=[]
    for f in sprite.indexed_frames:
        im=Image.frombytes('P',(f.width,f.height),f.pixels);im.putpalette([v for i in range(256) for v in sprite.palette[i*4:i*4+3]])
        im.info['transparency']=0;images.append(im.convert('RGBA'))
    for f in sprite.rgba_frames:images.append(Image.frombytes('RGBA',(f.width,f.height),f.pixels,'raw','ABGR').transpose(Image.Transpose.FLIP_TOP_BOTTOM))
    frames=[];clips={};boxes=[];idle_boxes=[]
    kinds={'idle':0}
    if key in ['Poring','Lunatic'] and len(actions)>=16:kinds['walk']=8
    for kind,start in kinds.items():
        clips[kind]=[]
        for direction in range(8):
            ai=min(start+direction,len(actions)-1);a=actions[ai];indices=[]
            for frame in a.frames:
                layers=[]
                for l in frame.layers:
                    ix=l.sprite_index+(len(sprite.indexed_frames) if l.sprite_type else 0)
                    if l.sprite_index<0 or ix>=len(images):continue
                    im=images[ix].copy()
                    if tuple(l.color)!=(255,255,255,255):
                        im=Image.merge('RGBA',[channel.point([round(v*l.color[i]/255) for v in range(256)]) for i,channel in enumerate(im.split())])
                    if bool(l.mirror)!=(l.scale_x<0):im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                    if l.scale_y<0:im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
                    im=im.resize((max(1,round(im.width*abs(l.scale_x))),max(1,round(im.height*abs(l.scale_y)))),Image.Resampling.NEAREST)
                    if l.angle:im=im.rotate(-l.angle,expand=True,resample=Image.Resampling.NEAREST)
                    x,y=round(l.x-im.width/2),round(l.y-im.height/2);box=im.getbbox()
                    if box:
                        b=(x+box[0],y+box[1],x+box[2],y+box[3]);boxes.append(b)
                        if kind=='idle':idle_boxes.append(b)
                        layers.append((im,x,y))
                if not layers:raise ValueError('Empty '+key+'/'+kind+'/'+str(direction))
                indices.append(len(frames));frames.append(layers)
            clips[kind].append({'sourceAction':ai,'frames':indices,'frameMs':max(25,a.delay*25)})
    x0=min(b[0] for b in boxes)-2;y0=min(b[1] for b in boxes)-2
    x1=max(b[2] for b in boxes)+2;y1=max(b[3] for b in boxes)+2
    width=x1-x0;height=y1-y0;foot=max(b[3] for b in idle_boxes)
    unique=[];lookup={};remap=[]
    for layers in frames:
        image=Image.new('RGBA',(width,height))
        for im,x,y in layers:image.alpha_composite(im,(x-x0,y-y0))
        digest=hashlib.sha256(image.tobytes()).hexdigest()
        if digest not in lookup:lookup[digest]=len(unique);unique.append(image)
        remap.append(lookup[digest])
    columns=min(8,len(unique));rows=math.ceil(len(unique)/columns)
    sheet=Image.new('RGBA',(width*columns,height*rows))
    for i,im in enumerate(unique):sheet.alpha_composite(im,(i%columns*width,i//columns*height))
    sheet.save(out/(key+'.png'))
    for group in clips.values():
        for clip in group:clip['frames']=[remap[i] for i in clip['frames']]
    assets[key]={'source':source,'sourceAct':source[:-4]+'.act','sourceSHA256':hashlib.sha256(raw).hexdigest(),'actSHA256':hashlib.sha256(action_raw).hexdigest(),'image':key+'.png','width':width,'height':height,'bodyHeight':foot-min(b[1] for b in idle_boxes),'columns':columns,'rows':rows,'frames':len(unique),'anchor':[-x0/width,(y1-foot)/height],'actions':clips,'kind':'monster' if key in ['Poring','Lunatic'] else 'npc'}
    print(key,len(unique),'unique poses;',[(k,len(v[0]['frames'])) for k,v in clips.items()])
capital=json.loads((ROOT/'web/assets/sirin/capital-manifest.json').read_text(encoding='utf8'))
terrain=json.loads((ROOT/'web/assets/sirin/terrain-triangles.json').read_text(encoding='utf8'))
placements=[]
for i,p in enumerate(capital['characters']):
    x,y,z=p['position'];entry={'name':p['object'],'id':p['sprite'],'x':x,'y':z,'z':-y,'height':p['height_m'],'role':p['role'],'surface':p['surface'],'heading':(i%8)*math.pi/4,'phase':i*.731}
    if assets[p['sprite']]['kind']=='monster':
        # Candidate habitat triangles are local and retain the source surface.
        entry['habitat']=[[[a,-b] for a,b in t['xy']] for t in terrain if ('grass' if t['mat']=='RO_Grass_surface' else 'paved')==p['surface'] and min(v[0] for v in t['xy'])<x+3 and max(v[0] for v in t['xy'])>x-3 and min(v[1] for v in t['xy'])<y+3 and max(v[1] for v in t['xy'])>y-3]
    placements.append(entry)
(out/'manifest.json').write_text(json.dumps({'version':1,'assets':assets,'capital':placements,'aliases':{'scientist':'Scientist','researcher':'Researcher'},'artwork':'Ragnarok Online / Gravity; original SPR pixels and ACT transforms'},ensure_ascii=False,separators=(',',':')),encoding='utf8')
print('Exported',len(assets),'types and',len(placements),'city occupants; bytes',sum(p.stat().st_size for p in out.iterdir()))
