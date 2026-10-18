"""Export local class emblems and wearable thumbnails, plus readable UI metadata."""
import sys,json,re,io,math
from pathlib import Path
import numpy as np
from PIL import Image
from lua_tables import read_tables
root=Path(__file__).resolve().parents[2];cfg=json.loads((root/'scripts/ayothaya-local.json').read_text(encoding='utf8'));sys.path.insert(0,cfg['ragx'])
from ragx.client import open_stack
from ragx.formats import spr,act
a=open_stack(cfg['client']);names=set(a.namelist());db=json.loads((root/'assets-source/ayothaya/wardrobe-index.json').read_text(encoding='utf8'))
out=root/'web/assets/ayothaya/wardrobe';(out/'icons').mkdir(parents=True,exist_ok=True)
env={}
for name in ['jobidentity','jobname','accessoryid','accname']:
    if name=='jobname':env[b'jobtbl']=env[b'JTtbl']
    try:env,_=read_tables(a.read('data\\luafiles514\\lua files\\datainfo\\'+name+'.lub'),env)
    except (KeyError,ValueError,TypeError) as e:print(name,str(e),flush=True)
print('TABLES',[(str(k),len(v) if isinstance(v,dict) else 0) for k,v in env.items()],flush=True)
items={}
for name in ['itemInfo.lub','itemInfo_new.lub']:
    e,r=read_tables((Path(cfg['client'])/'System'/name).read_bytes());tables=[v for v in list(e.values())+list(r.values()) if isinstance(v,dict)];t=max(tables,key=len);items.update({int(k):v for k,v in t.items() if isinstance(k,(int,float)) and isinstance(v,dict)})
print('ITEMS',len(items),flush=True)
def decode(v,enc='cp949'):
    if not isinstance(v,bytes):return str(v)
    try:return v.decode('utf8')
    except UnicodeDecodeError:return v.decode(enc,'replace')
acc=next((v for k,v in env.items() if k==b'AccNameTable'),{})
if not acc:acc=next((v for v in env.values() if isinstance(v,dict) and len(v)>1000 and all(isinstance(k,(int,float)) for k in v)),{})
by_source={}
for iid,item in items.items():
    view=item.get(b'ClassNum',0);source=acc.get(view)
    if not isinstance(source,bytes):continue
    key=decode(source).lstrip('_').lower();label=decode(item.get(b'identifiedDisplayName',b''),'cp874');description=' '.join(decode(v,'cp874') for v in item.get(b'identifiedDescriptionName',{}).values())
    # The Thai client's item descriptions specify Upper/Middle/Lower or บน/กลาง/ล่าง.
    slots=[]
    for slot,words in [('upper',r'Upper|ส่วนบน|ศีรษะบน|หัวบน'),('middle',r'Middle|ส่วนกลาง|ศีรษะกลาง|หัวกลาง'),('lower',r'Lower|ส่วนล่าง|ศีรษะล่าง|หัวล่าง')]:
        if re.search(words,description,re.I):slots.append(slot)
    by_source.setdefault(key,[]).append({'itemId':iid,'label':label,'slots':slots,'resource':decode(item.get(b'identifiedResourceName',b''))})
print('ACCESSORY mappings',len(acc),len(by_source),flush=True)
# An explicit class catalogue prevents NPCs, mounts, costumes and raw filenames
# from becoming selectable professions. Names remain English for both sexes.
groups=[('Novice Job','Novice'),('First Class','Swordman|Mage|Archer|Acolyte|Merchant|Thief'),('Second Class','Knight|Crusader|Wizard|Sage|Hunter|Bard|Dancer|Priest|Monk|Blacksmith|Alchemist|Assassin|Rogue'),('Transcendent','Lord Knight|Paladin|High Wizard|Professor|Sniper|Clown|Gypsy|High Priest|Champion|Whitesmith|Creator|Assassin Cross|Stalker'),('Third Class','Rune Knight|Royal Guard|Warlock|Sorcerer|Ranger|Minstrel|Wanderer|Arch Bishop|Sura|Mechanic|Genetic|Guillotine Cross|Shadow Chaser'),('Fourth Class','Dragon Knight|Imperial Guard|Arch Mage|Elemental Master|Windhawk|Troubadour|Trouvere|Cardinal|Inquisitor|Meister|Biolo|Shadow Cross|Abyss Chaser'),('Expanded Class','Super Novice|Hyper Novice|Taekwon|Star Gladiator|Star Emperor|Sky Emperor|Soul Linker|Soul Reaper|Soul Ascetic|Ninja|Kagerou|Oboro|Shinkiro|Shiranui|Gunslinger|Rebellion|Night Watch|Summoner|Spirit Handler')]
fix={'하이프리':'High Priest','가드':'Royal Guard','성제':'Star Emperor','소울리퍼':'Soul Reaper','elemetal_master':'Elemental Master','trouvere':'Trouvere','shiranui':'Shiranui'}
known={label:(group,i,j) for i,(group,ls) in enumerate(groups) for j,label in enumerate(ls.split('|'))}
job_names=env.get(b'JobNameTable',{});job_sources={}
for jid,name in job_names.items():
    if isinstance(name,bytes) and isinstance(jid,(int,float)):job_sources.setdefault(decode(name).lower(),int(jid))
icon_ids={'Novice':0,'Swordman':1,'Mage':2,'Archer':3,'Acolyte':4,'Merchant':5,'Thief':6,'Knight':7,'Priest':8,'Wizard':9,'Blacksmith':10,'Hunter':11,'Assassin':12,'Crusader':14,'Monk':15,'Sage':16,'Rogue':17,'Alchemist':18,'Bard':19,'Dancer':20,'Super Novice':23,'Gunslinger':24,'Ninja':25,'Taekwon':4046,'Star Gladiator':4047,'Soul Linker':4049,'Summoner':4218}
aliases={'Lord Knight':'KNIGHT_H','Paladin':'CRUSADER_H','High Wizard':'WIZARD_H','Professor':'SAGE_H','Sniper':'HUNTER_H','Clown':'BARD_H','Gypsy':'DANCER_H','High Priest':'PRIEST_H','Champion':'MONK_H','Whitesmith':'BLACKSMITH_H','Creator':'ALCHEMIST_H','Assassin Cross':'ASSASSIN_H','Stalker':'ROGUE_H','Arch Bishop':'ARCHBISHOP','Summoner':'DO_SUMMONER'}
for label in known:
    value=env[b'JTtbl'].get(('JT_'+aliases.get(label,label.upper().replace(' ','_'))).encode())
    if value is not None:icon_ids[label]=int(value)
classes=[];ui={'classes':classes,'items':{},'sources':{'client':cfg['client'],'tables':['System/itemInfo.lub','System/itemInfo_new.lub','datainfo/accname.lub','datainfo/jobname.lub']}}
def save_image(im,key):
    im=im.convert('RGBA');p=np.array(im);p[(p[:,:,0]>240)&(p[:,:,1]<20)&(p[:,:,2]>240),3]=0;im=Image.fromarray(p);bbox=im.getbbox()
    if not bbox:raise ValueError('Empty icon')
    im=im.crop(bbox);im=im.resize((max(1,round(im.width*60/max(im.size))),max(1,round(im.height*60/max(im.size)))),Image.Resampling.NEAREST);tile=Image.new('RGBA',(64,64));tile.alpha_composite(im,((64-im.width)//2,(64-im.height)//2));tile.save(out/'icons'/(key+'.png'));return 'assets/ayothaya/wardrobe/icons/'+key+'.png'
def sprite_thumb(source,key):
    s=spr.parse(a.read(source));ac=act.parse(a.read(source[:-4]+'.act'));layers=[]
    # Garments can have no front layers; find the first visible standing direction.
    for action in ac.actions[:8]:
        if not action.frames:continue
        for l in action.frames[0].layers:
            if l.sprite_index<0:continue
            if l.sprite_type:
                f=s.rgba_frames[l.sprite_index];p=np.frombuffer(f.pixels,dtype=np.uint8).reshape(f.height,f.width,4)[::-1,:,[3,2,1,0]]
            else:
                f=s.indexed_frames[l.sprite_index];lut=np.frombuffer(s.palette,dtype=np.uint8).reshape(256,4).copy();lut[:,3]=255;lut[0,3]=0;p=lut[np.frombuffer(f.pixels,dtype=np.uint8)].reshape(f.height,f.width,4)
            im=Image.fromarray((p.astype(np.float32)*np.array(l.color)/255).clip(0,255).astype(np.uint8))
            if l.mirror:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            im=im.resize((max(1,round(im.width*abs(l.scale_x))),max(1,round(im.height*abs(l.scale_y)))),Image.Resampling.NEAREST)
            if l.angle:im=im.rotate(-l.angle,expand=True)
            if im.getbbox():layers.append((im,round(l.x-im.width/2),round(l.y-im.height/2)))
        if layers:break
    if not layers:raise ValueError('No visible idle pose')
    x0=min(x for im,x,y in layers);y0=min(y for im,x,y in layers);x1=max(x+im.width for im,x,y in layers);y1=max(y+im.height for im,x,y in layers)
    im=Image.new('RGBA',(x1-x0,y1-y0))
    for layer,x,y in layers:im.alpha_composite(layer,(x-x0,y-y0))
    return save_image(im,key)
for b in db['bodies']:
    label=fix.get(b['job'],b['label'])
    if b['variant'] or label not in known:continue
    group,order,rank=known[label];jid=job_sources.get(b['job'].lower(),icon_ids.get(label,0));source=f'data\\texture\\유저인터페이스\\renewalparty\\icon_jobs_{jid}.bmp'
    if source not in names:source='data\\texture\\유저인터페이스\\renewalparty\\icon_jobs_0.bmp'
    icon=save_image(Image.open(io.BytesIO(a.read(source))),'job-'+str(jid))
    classes.append({**{k:b[k] for k in ['id','sex','race']},'label':label,'group':group,'order':order*100+rank,'icon':icon,'job':b['job'],'name':b['name']})
classes.sort(key=lambda c:(c['order'],c['sex']));errors=[];metadata=0
for group in ['heads','headgear','robes']:
    for i,item in enumerate(db[group]):
        key=item['id'];source=item.get('source') or next(iter(item['variants'].values()));label=item['label'];slots=[];record={}
        if group=='headgear':
            clean=re.sub(r'^(남|여)_|_(남|여)$','',item['name']).lower();matches=by_source.get(clean,[])
            if matches:
                record=next((r for r in matches if r['slots']),matches[0]);label=record['label'];slots=record['slots'];metadata+=1
        if re.search(r'[\uac00-\ud7af\ufffd]',label):label=('Accessory ' if group=='headgear' else 'Garment ')+str(i+1).zfill(4)
        try:
            file=out/'icons'/(key+'.png')
            icon='assets/ayothaya/wardrobe/icons/'+key+'.png' if file.exists() else sprite_thumb(source,key)
            ui['items'][key]={'label':label,'icon':icon,'slots':slots,**({'itemId':record['itemId']} if record else {})}
        except Exception as e:errors.append({'id':key,'error':str(e)})
        if i%500==0:print(group,i,flush=True)
(root/'assets-source/ayothaya/wardrobe-ui.json').write_text(json.dumps(ui,ensure_ascii=False),encoding='utf8');(root/'artifacts/wardrobe-ui-export.json').write_text(json.dumps({'classes':len(classes),'icons':len(ui['items']),'mapped':metadata,'classified':sum(bool(v['slots']) for v in ui['items'].values()),'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
print('DONE',len(classes),len(ui['items']),metadata,'errors',len(errors),flush=True)
