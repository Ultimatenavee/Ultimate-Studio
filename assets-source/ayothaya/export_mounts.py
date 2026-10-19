"""Add paired class mount SPR/ACT assets to the portable wardrobe.

Run after export_online_wardrobe.py. Reads the local archive, never executes game code.
The class list remains unchanged: mounts are a separate compatible appearance slot.
"""
import hashlib,json,sys,zlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
settings=json.loads((ROOT/'scripts/ayothaya-local.json').read_text(encoding='utf8'))
sys.path.insert(0,settings['ragx'])
from ragx.client import open_stack
from ragx.formats import act
archive=open_stack(settings['client'])
out=ROOT/'web/assets/ayothaya/wardrobe'
db=json.loads(zlib.decompress((out/'catalog.jsonz').read_bytes()))
index=json.loads((ROOT/'assets-source/ayothaya/wardrobe-index.json').read_text(encoding='utf8'))
# Explicit source families prevent costumes/NPC bodies from becoming mounts.
families={}
def family(label,pairs):
    for job,source in pairs.items():families.setdefault(job,[]).append((source,label))
family('Poring',{'Novice':'노비스포링','Super Novice':'슈퍼노비스포링','Taekwon':'태권소년포링','Star Gladiator':'권성포링'})
family('Peco Peco',{'Swordman':'페코검사','Knight':'페코페코_기사','Lord Knight':'로드페코','Crusader':'신페코크루세이더','Paladin':'페코팔라딘','Gunslinger':'페코건너','Rebellion':'peco_rebellion','Dragon Knight':'dragon_knight_chicken','Imperial Guard':'imperial_guard_chicken'})
family('Fox',{'Mage':'여우마법사','Wizard':'여우위저드','Sage':'여우세이지','High Wizard':'여우하이위저드','Professor':'여우프로페서','Warlock':'여우워록','Sorcerer':'여우소서러'})
family('Ostrich',{'Archer':'타조궁수','Hunter':'타조헌터','Bard':'타조바드','Dancer':'타조무희','Sniper':'타조스나이퍼','Clown':'타조크라운','Gypsy':'타조짚시','Ranger':'타조레인져','Minstrel':'타조민스트럴','Wanderer':'타조원더러'})
family('Alpaca',{'Acolyte':'복사알파카','Priest':'프리스트알파카','Monk':'몽크알파카','High Priest':'하이프리스트알파카','Champion':'챔피온알파카','Arch Bishop':'아크비숍알파카','Sura':'슈라알파카'})
family('Boar',{'Merchant':'상인멧돼지','Blacksmith':'제철공멧돼지','Alchemist':'연금술사멧돼지','Whitesmith':'화이트스미스멧돼지','Creator':'크리에이터멧돼지','Mechanic':'미케닉멧돼지','Genetic':'제네릭멧돼지'})
family('Cerberus',{'Thief':'켈베로스도둑','Assassin':'켈베로스어쎄신','Rogue':'켈베로스로그','Assassin Cross':'켈베로스어쎄신크로스','Stalker':'켈베로스스토커','Guillotine Cross':'켈베로스길로틴크로스','Shadow Chaser':'켈베로스쉐도우체이서'})
family('Lion',{'Knight':'사자기사','Lord Knight':'사자로드나이트','Crusader':'사자크루세이더','Paladin':'사자팔라딘','Rune Knight':'사자룬나이트','Royal Guard':'사자로얄가드'})
family('Frog',{'Ninja':'두꺼비닌자','Soul Linker':'두꺼비소울링커','Kagerou':'frog_kagerou','Oboro':'frog_oboro'})
family('Haetae',{'Star Emperor':'해태성제','Soul Reaper':'해태소울리퍼'})
family('Warg',{'Ranger':'레인져늑대','Windhawk':'wolf_windhawk'})
family('Gryphon',{'Royal Guard':'그리폰가드'})
family('Cart',{'Summoner':'cart_summoner'})
for n in range(1,6):family('Dragon '+str(n),{'Rune Knight':'룬나이트쁘띠'+(str(n) if n>1 else '')})
family('Mado Gear',{'Mechanic':'마도기어','Meister':'meister_madogear1'})
family('Mado Armor',{'Mechanic':'마도아머','Meister':'meister_madogear2'})
family('Peco Peco · classic',{'Crusader':'구페코크루세이더'})
family('Peco Peco · alternate',{'Rebellion':'페코rebellion'})
for c in db['classes']:
    source=c['name'].rsplit('_',1)[0]+'_riding'
    if any(b['name']==source+'_'+('남' if c['sex']=='male' else '여') for b in index['bodies']):
        pair=(source,'สัตว์ขี่ประจำอาชีพ')
        if pair not in families.setdefault(c['label'],[]):families[c['label']].append(pair)
mounts=[];groups={};added=0;skipped=[]
for c in db['classes']:
    suffix='남' if c['sex']=='male' else '여'
    for prefix,label in families.get(c['label'],[]):
        for b in index['bodies']:
            if b['sex']!=c['sex'] or b['name']!=prefix+'_'+suffix or b.get('variant'):continue
            actions=act.parse(archive.read(b['source'][:-4]+'.act')).actions
            if len(actions)<16 or any(not a.frames or not any(l.sprite_index>=0 for f in a.frames for l in f.layers) for a in actions[:16]):
                skipped.append({'class':c['label'],'sex':c['sex'],'source':b['source'],'reason':'incomplete idle/walk'});continue
            clips=[]
            for ai in range(24):
                a=actions[ai] if ai<len(actions) and actions[ai].frames else actions[ai%8]
                # Mounted sit uses the mounted idle pose, as mounts have no seated pose.
                if ai>=16:a=actions[ai%8]
                frames=[]
                for f in (a.frames if 8<=ai<16 else a.frames[:1]):
                    frames.append({'layers':[[l.sprite_index,l.sprite_type,l.x,l.y,l.mirror,list(l.color),l.scale_x,l.scale_y,l.angle] for l in f.layers],'attach':[[v.x,v.y] for v in f.attach_points]})
                clips.append({'delay':max(25,a.delay*25),'frames':frames})
            packed=zlib.compress(archive.read(b['source']),9);sk=hashlib.sha256(packed).hexdigest()[:24]+'.sprz'
            (out/sk).write_bytes(packed)
            raw=json.dumps(clips,separators=(',',':')).encode();ak=hashlib.sha256(raw).hexdigest()[:24]+'.json';bucket=ak[:2]
            if bucket not in groups:groups[bucket]=json.loads(zlib.decompress((out/'actions'/(bucket+'.jsonz')).read_bytes())) if (out/'actions'/(bucket+'.jsonz')).exists() else {}
            groups[bucket][ak]=clips;db['assets'][b['source']]=[sk,ak]
            mount={**b,'classId':c['id'],'label':label}
            if not any(m['id']==mount['id'] and m['classId']==c['id'] for m in mounts):mounts.append(mount);added+=len(packed)
for bucket,values in groups.items():(out/'actions'/(bucket+'.jsonz')).write_bytes(zlib.compress(json.dumps(values,separators=(',',':')).encode(),9))
db['mounts']=mounts
(out/'catalog.jsonz').write_bytes(zlib.compress(json.dumps(db,ensure_ascii=False,separators=(',',':')).encode(),9))
audit={'mounts':[{'id':m['id'],'classId':m['classId'],'label':m['label'],'sex':m['sex'],'source':m['source']} for m in mounts],'unavailable':[{'label':c['label'],'sex':c['sex']} for c in db['classes'] if not any(m['classId']==c['id'] for m in mounts)],'skipped':skipped}
(ROOT/'assets-source/ayothaya/mount-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf8')
print('Exported',len(mounts),'mount/class options;',round(added/1048576,1),'MB; unavailable:',audit['unavailable'],'skipped:',len(skipped))
