"""Export only indexed wardrobe components; deduplicate identical sprite/action content.
The published app composes requested outfits in the browser, without a game client/server.
"""
import argparse,base64,hashlib,json,sys,zlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--ragx',required=True);p.add_argument('--client',required=True);a=p.parse_args()
sys.path.insert(0,a.ragx)
from ragx.client import open_stack
from ragx.formats import act
root=Path(__file__).resolve().parents[2];db=json.loads((root/'assets-source/ayothaya/wardrobe-index.json').read_text(encoding='utf8'));ui=json.loads((root/'assets-source/ayothaya/wardrobe-ui.json').read_text(encoding='utf8'))
out=root/'web/assets/ayothaya/wardrobe';out.mkdir(parents=True,exist_ok=True);archive=open_stack(a.client)
ids={b['id'] for b in ui['classes']};db['bodies']=[b for b in db['bodies'] if b['id'] in ids];names={b['name'] for b in db['bodies']};jobs={b['job'] for b in db['bodies']}
for k in ['weapons','shields']:db[k]=[x for x in db[k] if x['job'] in jobs]
for r in db['robes']:r['variants']={k:v for k,v in r['variants'].items() if k in names}
sources=sorted({x['source'] for k in ['bodies','heads','headgear','weapons','shields'] for x in db[k]}|{v for r in db['robes'] for v in r['variants'].values()});checkpoint=root/'artifacts/hybrid-lab/online-components.json';assets=json.loads(checkpoint.read_text(encoding='utf8')) if checkpoint.exists() else {};written={f for pair in assets.values() for f in pair}
def save(data,ext):
    key=hashlib.sha256(data).hexdigest()[:24]+ext
    if key not in written:
        file=out/key
        if not file.exists():file.write_bytes(data)
        written.add(key)
    return key
for i,source in enumerate(sources):
    if source in assets:continue
    try:
        sprite=archive.read(source);actions=act.parse(archive.read(source[:-4]+'.act')).actions[:24]
        clips=[]
        for ai,action in enumerate(actions):
            frames=[]
            for f in (action.frames if 8<=ai<16 else action.frames[:1]):
                layers=[[l.sprite_index,l.sprite_type,l.x,l.y,l.mirror,list(l.color),l.scale_x,l.scale_y,l.angle] for l in f.layers]
                frames.append({'layers':layers,'attach':[[v.x,v.y] for v in f.attach_points]})
            clips.append({'delay':max(25,action.delay*25),'frames':frames})
        packed=zlib.compress(sprite,9);sprite_key=save(packed,'.sprz');action_key=save(json.dumps(clips,separators=(',',':')).encode(),'.json');assets[source]=[sprite_key,action_key]
    except (ValueError,KeyError) as e:print('SKIP',source,str(e),file=sys.stderr)
    if i%1000==0:
        checkpoint.write_text(json.dumps(assets,ensure_ascii=False),encoding='utf8');print('EXPORTED',i,'/',len(sources),'unique files',len(written),flush=True)
checkpoint.write_text(json.dumps(assets,ensure_ascii=False),encoding='utf8')
# Group tiny animation files so static hosting does not need tens of thousands
# of assets. Existing groups also make repeated offline exports resumable.
action_dir=out/'actions';action_dir.mkdir(exist_ok=True);groups={};prior={}
for key in sorted({pair[1] for pair in assets.values()}):
    bucket=key[:2];file=out/key
    if file.exists():value=json.loads(file.read_text(encoding='utf8'))
    else:
        if bucket not in prior:prior[bucket]=json.loads(zlib.decompress((action_dir/(bucket+'.jsonz')).read_bytes()))
        value=prior[bucket][key]
    groups.setdefault(bucket,{})[key]=value
for bucket,values in groups.items():(action_dir/(bucket+'.jsonz')).write_bytes(zlib.compress(json.dumps(values,separators=(',',':')).encode(),9))
for key in {pair[1] for pair in assets.values()}:(out/key).unlink(missing_ok=True)
palettes={}
for x in db['palettes']:
    try:palettes[x['id']]=base64.b64encode(archive.read(x['source'])).decode('ascii')
    except KeyError:pass
for k in ['bodies','heads','headgear','weapons','shields','palettes']:
    for i,x in enumerate(db[k]):
        x.update(ui['items'].get(x['id'],{}))
        x.setdefault('label',x['name'])
        if any('\uac00'<=c<='\ud7af' or c=='\ufffd' for c in x['label']):x['label']='Item '+str(i+1).zfill(4)
db['classes']=ui['classes'];db['assets']=assets;db['paletteData']=palettes
(out/'catalog.jsonz').write_bytes(zlib.compress(json.dumps(db,ensure_ascii=False,separators=(',',':')).encode('utf8'),9))
(out/'catalog.json').unlink(missing_ok=True)
shipped=[*out.glob('*.sprz'),*out.glob('*.jsonz'),*action_dir.glob('*.jsonz')]
print('DONE',len(assets),'components',len(shipped),'files',round(sum(f.stat().st_size for f in shipped)/1048576,1),'MB',flush=True)
