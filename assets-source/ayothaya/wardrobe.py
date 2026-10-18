"""Read local RO appearance assets. Index all paired wearables; compose only requested outfits.
No game code is executed and no client files are modified.
"""
import argparse,hashlib,json,re,struct,sys,math
from pathlib import Path
import numpy as np
from PIL import Image

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('mode',choices=['index','render'])
parser.add_argument('--ragx',required=True)
parser.add_argument('--client',default=r'C:\Program Files\RagnarokOnline')
parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
args=parser.parse_args();sys.path.insert(0,str(Path(args.ragx).resolve()))
from ragx.client import open_stack
from ragx.formats import spr,act
from ragx.commands.sprites_cmd import decode_spr_frames
archive=open_stack(args.client)
index_path=args.root/'assets-source/ayothaya/wardrobe-index.json'
output=args.root/'web/assets/ayothaya/avatar/outfits'

def uid(s):return hashlib.sha256(s.encode('utf8')).hexdigest()[:20]
def stem(s):return s.rsplit('\\',1)[-1].rsplit('.',1)[0]
def job(s):return re.sub(r'_(남|여)$','',s)
def human(s):return s.replace('_',' ').strip().title()
def constants(data):
    # Read only Lua 5.1 string constants, never execute client bytecode.
    if data[:12]!=b'\x1bLuaQ\0\x01\x04\x04\x04\x08\0':return []
    p=12
    def u():
        nonlocal p
        n=struct.unpack_from('<I',data,p)[0];p+=4;return n
    def string():
        nonlocal p
        n=u();v=data[p:p+max(0,n-1)];p+=n;return v.decode('cp949','replace')
    string();p+=12;instructions=u();p+=instructions*4;result=[]
    for _ in range(u()):
        t=data[p];p+=1
        if t==4:result.append(string())
        elif t==3:p+=8
        elif t==1:p+=1
    return result

def build_index():
    names=set(archive.namelist());labels={}
    for table,prefix in [('accname','ACCESSORY_'),('jobname','JT_')]:
        try:
            values=constants(archive.read('data\\luafiles514\\lua files\\datainfo\\'+table+'.lub'))
            for i,v in enumerate(values[:-1]):
                if v.startswith(prefix) and not values[i+1].startswith(prefix):labels.setdefault(values[i+1].lstrip('_'),human(v[len(prefix):]))
        except (ValueError,KeyError,struct.error):pass
    labels.update(dict(zip('초보자 검사 마법사 궁수 상인 도둑 성직자 기사 위저드 헌터 제철공 어세신 프리스트 몽크 세이지 로그 연금술사 크루세이더 바드 무희 슈퍼노비스 로드나이트 하이위저드 스나이퍼 화이트스미스 어쌔신크로스 하이프리스트 챔피온 프로페서 스토커 크리에이터 팔라딘 클라운 집시 룬나이트 워록 레인져 미케닉 길로틴크로스 아크비숍 수라 슈라 소서러 쉐도우체이서 제네릭 로얄가드 민스트럴 원더러 태권소년 권성 소울링커 닌자 건너 카게로 오보로 결혼 여름 한복'.split(),['Novice','Swordman','Mage','Archer','Merchant','Thief','Acolyte','Knight','Wizard','Hunter','Blacksmith','Assassin','Priest','Monk','Sage','Rogue','Alchemist','Crusader','Bard','Dancer','Super Novice','Lord Knight','High Wizard','Sniper','Whitesmith','Assassin Cross','High Priest','Champion','Professor','Stalker','Creator','Paladin','Clown','Gypsy','Rune Knight','Warlock','Ranger','Mechanic','Guillotine Cross','Arch Bishop','Sura','Sura','Sorcerer','Shadow Chaser','Genetic','Royal Guard','Minstrel','Wanderer','Taekwon','Star Gladiator','Soul Linker','Ninja','Gunslinger','Kagerou','Oboro','Wedding','Summer','Hanbok'])))
    result={'version':2,'bodies':[],'heads':[],'headgear':[],'robes':[],'weapons':[],'shields':[],'palettes':[]}
    robes={};skipped=[]
    for source in sorted(names):
        if source.endswith('.pal'):
            result['palettes'].append({'id':uid(source),'name':stem(source),'source':source});continue
        if not source.startswith('data\\sprite\\') or not source.endswith('.spr'):continue
        pair=source[:-4]+'.act'
        if pair not in names:continue
        parts=source.split('\\');name=stem(source);category=parts[2]
        folder_sex=next(('female' if p.startswith('여') else 'male' for p in parts if p in ['여','여_doram','남','남_doram']),None)
        sex=folder_sex or ('female' if '_여' in name else 'male' if '_남' in name else '')
        race='doram' if category=='도람족' or any('_doram' in p for p in parts) else 'human'
        entry={'id':uid(source),'name':name,'label':labels.get(job(name),labels.get(re.sub(r'^(남|여)_','',name),human(job(name)))),'source':source,'sex':sex,'race':race}
        if category in ['인간족','도람족'] and parts[3]=='몸통':
            entry['job']=job(name);entry['variant']='/'.join(parts[5:-1]);entry['label']+=(' / '+entry['variant']) if entry['variant'] else ''
            result['bodies'].append(entry)
        elif category in ['인간족','도람족'] and parts[3]=='머리통':
            entry['label']='ทรงผม '+job(name);result['heads'].append(entry)
        elif category=='악세사리':
            clean=re.sub(r'^(남|여)_','',name);clean=re.sub(r'_(남|여)$','',clean)
            entry['label']=labels.get(clean,human(clean));result['headgear'].append(entry)
        elif category=='로브':
            # Each garment contains a body-specific ACT for correct attachment.
            if len(parts)>=6 and parts[-2] in ['남','여']:
                family='\\'.join(parts[3:-2]);r=robes.setdefault(family,{'id':uid('robe:'+family),'label':human(family.replace('\\',' / ')),'variants':{}})
                r['variants'][name]=source
        elif category=='방패':
            entry['job']=parts[3];entry['label']=human(name.split('_'+('여' if sex=='female' else '남')+'_')[-1]);result['shields'].append(entry)
        elif category in ['인간족','도람족'] and parts[3] not in ['아이템','용병','운영자']:
            entry['job']=parts[3];entry['label']=human(name.split('_'+('여' if sex=='female' else '남')+'_')[-1]);result['weapons'].append(entry)
    result['robes']=list(robes.values());result['counts']={k:len(v) for k,v in result.items() if isinstance(v,list)}
    result['counts']['robeVariants']=sum(len(r['variants']) for r in result['robes'])
    index_path.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8')
    print(json.dumps(result['counts']))

def render(config):
    index=json.loads(index_path.read_text(encoding='utf8'))
    def get(group,key,required=False):
        value=config.get(key)
        if not value and not required:return None
        item=next((x for x in index[group] if x['id']==value),None)
        if not item:raise ValueError('Unknown '+key)
        return item
    body=get('bodies','body',True);head=get('heads','head',True)
    if (head['sex'],head['race'])!=(body['sex'],body['race']):raise ValueError('Hair does not match body')
    parts=[];sources=[]
    def load(source,kind,palette=None):
        s=spr.parse(archive.read(source));ac=act.parse(archive.read(source[:-4]+'.act'))
        if not ac.actions or kind=='body' and len(ac.actions)<24:raise ValueError('This sprite has no complete idle/walk/sitting directions: '+source)
        if palette:
            pal=archive.read(palette)
            if len(pal)!=1024:raise ValueError('Invalid palette')
            s.palette=pal
        sources.append(source);parts.append({'kind':kind,'frames':decode_spr_frames(s),'spr':s,'act':ac})
    def palette(key,entry,hair=False):
        p=get('palettes',key)
        if not p:return None
        prefix=('머리'+entry['name']) if hair and body['race']=='human' else entry['name']
        if not p['name'].startswith(prefix+'_'):raise ValueError('Palette does not match selected sprite')
        return p['source']
    load(body['source'],'body',palette('bodyPalette',body));load(head['source'],'head',palette('hairPalette',head,True))
    for slot in ['lower','middle','upper']:
        item=get('headgear',slot)
        if item:
            if (item['sex'],item['race'])!=(body['sex'],body['race']):raise ValueError('Accessory does not match body')
            load(item['source'],slot)
    robe=get('robes','robe')
    if robe:
        source=robe['variants'].get(body['name'])
        if not source:raise ValueError('Garment has no matching body animation')
        load(source,'robe')
    for group,slot in [('weapons','weapon'),('shields','shield')]:
        item=get(group,slot)
        if item:
            if item['job']!=body['job'] or item['sex']!=body['sex']:raise ValueError('Equipment does not match selected class')
            load(item['source'],slot)
    rendered=[];actions=[];bounds=[];body_bounds=[]
    def layers(part,ai,fi,bf,head_frame):
        action=part['act'].actions[ai%len(part['act'].actions)]
        if not action.frames:return []
        f=action.frames[(0 if not 8<=ai<16 else fi)%len(action.frames)]
        ox=oy=0;kind=part['kind']
        # Head and headgear use the head attachment; weapons/robes already use body coordinates.
        if kind in ['head','upper','middle','lower'] and bf.attach_points and f.attach_points:
            ox=bf.attach_points[0].x-f.attach_points[0].x;oy=bf.attach_points[0].y-f.attach_points[0].y
        result=[]
        for l in f.layers:
            if l.sprite_index<0:continue
            ix=l.sprite_index+(len(part['spr'].indexed_frames) if l.sprite_type else 0)
            if ix>=len(part['frames']):continue
            im=Image.fromarray((part['frames'][ix].astype(np.float32)*np.asarray(l.color)/255).clip(0,255).astype(np.uint8))
            if l.mirror:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            if l.scale_x<0:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            if l.scale_y<0:im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            im=im.resize((max(1,round(im.width*abs(l.scale_x))),max(1,round(im.height*abs(l.scale_y)))),Image.Resampling.NEAREST)
            if l.angle:im=im.rotate(-l.angle,expand=True)
            result.append((im,round(l.x+ox-im.width/2),round(l.y+oy-im.height/2)))
        return result
    for ai in range(24):
        ba=parts[0]['act'].actions[ai];count=1 if not 8<=ai<16 else len(ba.frames)
        if not count:raise ValueError('Empty body action')
        actions.append({'start':len(rendered),'count':count,'frameMs':max(25,ba.delay*25)})
        for fi in range(count):
            bf=ba.frames[fi];bykind={p['kind']:layers(p,ai,fi,bf,None) for p in parts}
            bb=[(x,y,x+im.width,y+im.height) for im,x,y in bykind['body']]
            if not bb:raise ValueError('Empty body pose')
            foot=max(y+im.getbbox()[3] for im,x,y in bykind['body'] if im.getbbox())
            # Layer order follows view direction; rear accessories stay behind the wearer.
            order=['robe','shield','body','head','lower','middle','upper','weapon'] if ai%8 in [0,1,7] else ['weapon','body','head','lower','middle','upper','shield','robe']
            combined=[]
            for k in order:
                for im,x,y in bykind.get(k,[]):
                    y-=foot;combined.append((im,x,y));bounds.append((x,y,x+im.width,y+im.height))
                    if k in ['body','head']:body_bounds.append((x,y,x+im.width,y+im.height))
            rendered.append(combined)
    minx=min(b[0] for b in bounds)-2;miny=min(b[1] for b in bounds)-2;maxx=max(b[2] for b in bounds)+2;maxy=max(b[3] for b in bounds)+2
    w=maxx-minx;h=maxy-miny;cols=min(8,len(rendered));rows=math.ceil(len(rendered)/cols)
    if w*h*cols*rows>32_000_000:raise ValueError('Outfit exceeds atlas size budget')
    sheet=Image.new('RGBA',(w*cols,h*rows))
    for i,ls in enumerate(rendered):
        frame=Image.new('RGBA',(w,h))
        for im,x,y in ls:frame.alpha_composite(im,(x-minx,y-miny))
        sheet.alpha_composite(frame,((i%cols)*w,(i//cols)*h))
    key=uid('v4:'+json.dumps(config,sort_keys=True));output.mkdir(parents=True,exist_ok=True)
    sheet.save(output/(key+'.png'))
    meta={'version':4,'sources':sources,'columns':cols,'rows':rows,'width':w,'height':h,'frames':len(rendered),'actions':actions,'anchor':[-minx/w,maxy/h],'bodyHeight':max(b[3] for b in body_bounds)-min(b[1] for b in body_bounds),'appearance':config}
    (output/(key+'.json')).write_text(json.dumps(meta,ensure_ascii=False),encoding='utf8')
    print(json.dumps({'base':'assets/ayothaya/avatar/outfits/'+key,'appearance':config}))

if args.mode=='index':build_index()
else:
    try:render(json.loads(sys.stdin.read()))
    except Exception as error:
        print(json.dumps({'error':str(error)},ensure_ascii=False));sys.exit(1)
