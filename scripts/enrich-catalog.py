"""Apply verified port profiles and exact-model color assets to the base catalog."""
from pathlib import Path
import copy
import json
import re
import shutil

root = Path(__file__).resolve().parents[1]
downloads = Path('/workspace/scratch/7360d1d45af5/upgrade-assets')
catalog_file = root / 'web/catalog.js'
catalog = json.loads(catalog_file.read_text().removeprefix('window.NOAH_CATALOG=').strip().removesuffix(';'))
models = {m['id']: m for m in catalog}

def read_manifest(folder, name, committed):
    dest = root / 'research' / committed
    source = downloads / folder / name
    if source.exists(): shutil.copy2(source, dest)
    return json.loads(dest.read_text())

hw = read_manifest('huawei-ale', 'huawei-ale-assets-manifest.json', 'color-assets-huawei-ale.json')
ci = read_manifest('cisco', 'cisco-image-manifest.json', 'color-assets-cisco.json')
cp = read_manifest('cisco', 'cisco-port-manifest.json', 'cisco-port-profiles.json')
tf = read_manifest('telco-fortinet', 'manifest.json', 'color-assets-telco-fortinet.json')

def copy_asset(local_path, mid, role='color'):
    src = Path(local_path)
    dest = root / 'web/assets' / (mid + '-' + role + src.suffix.lower())
    if src.exists(): shutil.copy2(src, dest)
    if not dest.exists(): raise ValueError('Missing selected asset: ' + str(dest))
    return 'assets/' + dest.name

def refs(model, urls):
    found = {s['url'] for s in model['sources']}
    for url in urls:
        if url not in found:
            model['sources'].append({'title':'Hardware reference · '+model['model'], 'url':url})
            found.add(url)

def photo(model, asset, path=None):
    assert asset['exactModel'], model['id']
    src = copy_asset(path or asset.get('localImagePath') or asset['localPath'], model['id'])
    face = 'rear' if asset.get('face','front').startswith('rear') else 'front'
    model['thumbnail'] = src
    model['thumbnailFace'] = face
    dimensions=asset.get('dimensions',{'width':asset.get('width'),'height':asset.get('height')})
    model['thumbnailDimensions']=dimensions
    bounds=asset.get('subjectBoundsApproxPx')
    model['thumbnailFrame']=[bounds['left'],bounds['top'],bounds['right']-bounds['left'],bounds['bottom']-bounds['top']] if bounds else [0,0,dimensions['width'],dimensions['height']]
    model['photos'] = {face:src}
    model['photoSource'] = {'pageUrl':asset.get('sourcePageUrl'), 'imageUrl':asset.get('sourceImageUrl',asset.get('directImageUrl')), 'exactModel':True, 'face':face, 'rights':asset.get('reuse',asset.get('reuseCopyright',asset.get('rights')))}
    if not model.get('images'): model['images'] = {}
    model['images'][face] = src if not model.get('calibrated') else model['images'].get(face,src)
    model['physicalReady'] = True

def p(pid,name,connector,speeds,group=None,face='front',kind='network',box=None):
    obj = {'id':pid,'name':name,'connector':connector,'speeds':speeds,'group':group,'face':face,'kind':kind}
    if box: obj['box'] = box
    return obj

def finish(model):
    ports = [q for q in model['ports'] if q['kind']=='network']
    model['sourceStatus'] = 'physical-verified' if model['calibrated'] else 'photo-and-ports-verified'
    model['verifiedSpecs'].update({'Model':model['name'], 'Logical network interfaces':len({q['group'] or q['id'] for q in ports}), 'Physical network sockets':len(ports), 'Copper sockets':sum(q['connector']=='RJ45' for q in ports), 'SFP sockets':sum(q['connector']=='SFP' for q in ports), 'SFP+ sockets':sum(q['connector']=='SFP+' for q in ports)})
    assert model['thumbnail'] and model['sources'] and ports
    assert len({q['id'] for q in model['ports']})==len(model['ports']),model['id']

for model in catalog:
    model['calibrated'] = model.get('calibrated', model.get('physicalReady',False))
    if model['calibrated'] and not model.get('diagramImages'): model['diagramImages'] = copy.deepcopy(model['images'])
    model.setdefault('photos',{})
    model.setdefault('images',{})
    model.setdefault('components',{'front':[],'rear':[]})
    model['verifiedSpecs'] = {}
    model['powerModes'] = ['AC']
    model['removablePSU'] = model['id']=='cisco-asr-1001-x'
    model.setdefault('alarmStates',['normal'])

for asset in hw['models']:
    model = models[asset['modelId']]
    photo(model,asset)
    f=asset['portFacts'];refs(model,f['sources'])
    model['verifiedSpecs']['Power'] = f['power']
    model['verifiedSpecs']['Management / Utility'] = ', '.join(f['managementAndUtility'])
    model['verifiedSpecs']['PoE'] = 'No'
    model['powerSlots'] = 2 if model['id']=='huawei-s5731-s48t4x' else 1
    model['defaultInstalledPowerSupplies'] = 1
    model['removablePSU'] = model['id']=='huawei-s5731-s48t4x'
    if asset.get('rearDetail') and asset['rearDetail']['exactModel']:
        # This is a documented close-up, not a substitute for a full rear panel.
        model['photoRearDetail'] = copy_asset(asset['rearDetail']['localImagePath'],model['id'],'rear-detail')
    if not model['calibrated']:
        ports=[]
        for group in f['networkPortGroups']:
            typ=group['type'];combo='combo' in typ
            for index in range(group['count']):
                copper_name=(group.get('cliIdentifiersElectrical') or group.get('cliIdentifiers') or [])[index] if group.get('cliIdentifiersElectrical') or group.get('cliIdentifiers') else ''
                optical_name=(group.get('cliIdentifiersOptical') or group.get('cliIdentifiers') or [])[index] if group.get('cliIdentifiersOptical') or group.get('cliIdentifiers') else copper_name
                base='wan'+str(index) if '2.5GE' in typ else 'ge'+str(index) if combo else 'ge'+str(index+1) if 'RJ45' in typ else 'x'+str(index+1)
                combo_group=base if combo else None
                speeds=group['speedsMbps']
                if combo:
                    ports.append(p(base+'-r',copper_name,'RJ45',speeds['copper'],combo_group))
                    ports.append(p(base+'-s',optical_name,'SFP+' if '10GE' in typ else 'SFP',speeds['fiber'],combo_group))
                else:
                    # AR dedicated copper names begin at GE4; avoid colliding with its combo GE0-3.
                    if model['category']=='router' and typ=='GE RJ45':base='ge'+str(index+4)
                    ports.append(p(base,copper_name or optical_name,'SFP+' if typ=='SFP+' else 'RJ45',speeds.get('copper',[]) if isinstance(speeds,dict) else speeds))
        ports.append(p('console','Console','RJ45',[],kind='console'))
        ports.append(p('usb','USB','USB',[],kind='usb'))
        if f.get('ethManagementPort') or f.get('managementPortSeparateFromDataPorts'):ports.append(p('mgmt','ETH Management','RJ45',[10,100],kind='management'))
        model['ports']=ports
    model['confirmedSummary']=f"{f['logicalNetworkPortCount']} Network interfaces / {f['physicalNetworkSocketCount']} sockets · Combo ใช้ Copper หรือ Fiber ได้ทีละช่อง"
    model['limitations']='พอร์ตคงที่ตาม Hardware reference; ไม่จำลองการสลับ LAN/WAN หรือ Protocol; ภาพและชุดไฟอาจต่างตาม SKU/Hardware revision'
    if f.get('cellular'):
        model['verifiedSpecs']['Cellular']=f['cellular']['module']
        model['verifiedSpecs']['SIM']=str(f['cellular']['simSlots'])+' × '+f['cellular']['simType']
    if f.get('fanDesign'):model['verifiedSpecs']['Fan']=f['fanDesign']
    if model['id']=='huawei-s5735-l8t4x-qa-v2':model['limitations']+='; ชื่อ GE1/0/x และ 10GE1/0/x ใช้ Convention จาก Catalog ที่คุณส่งมา'
    if model['id']=='alcatel-os6450-10':model['limitations']+='; ไม่จำลอง Stacking และไม่เปิดพอร์ตเสริมจาก Transceiver ที่ติดอยู่ในภาพตัวอย่าง'
    finish(model)

cisco_ids={
 'C1121-8PLTEP':'cisco-c1121-8pltep','1941':'cisco-1941','2911/K9':'cisco-2911-k9',
 '3925E':'cisco-3925e','3945E':'cisco-3945e','ASR1001':'cisco-asr-1001',
 'ASR1001-X':'cisco-asr-1001-x','ISR4331':'cisco-isr-4331','ISR4431':'cisco-isr-4431'}
profiles={x['modelId']:x for x in cp['profiles']}
source_index={x['id']:x for x in cp['sources']} if isinstance(cp['sources'],list) else cp['sources']
for asset in ci['assets']:
    model=models[cisco_ids[asset['modelId']]]
    photo(model,asset)
    f=profiles[asset['modelId']]
    urls=[]
    for key in f['sources']:
        source=source_index[key]
        urls.append(source['url'] if isinstance(source,dict) else source)
    refs(model,urls)
    if not model['calibrated']:
        ports=[]
        for interface in f['ports']:
            for connector in interface['connectors']:
                suffix='-r' if connector['type']=='RJ45' else '-s'
                pid=re.sub(r'[^a-z0-9]+','-',interface['name'].lower()).strip('-')+(suffix if len(interface['connectors'])>1 else '')
                ports.append(p(pid,interface['name'],connector['type'],connector['speedsMbps'],interface.get('comboGroup'),face=model['thumbnailFace']))
        for interface in f['managementPorts']:
            ports.append(p('mgmt',interface['name'],'RJ45',[10,100,1000],face=model['thumbnailFace'],kind='management'))
        ports.append(p('console','Console','RJ45',[],face=model['thumbnailFace'],kind='console'))
        model['ports']=ports
    power=f['power'];model['powerSlots']=power['maxPowerInputs'];model['powerModes']=['DC'] if asset['modelId']=='C1121-8PLTEP' else ['AC']
    model['defaultInstalledPowerSupplies']=2 if asset['modelId'] in ['ASR1001','ASR1001-X'] else 1
    model['removablePSU']=model['powerSlots']>1
    model['verifiedSpecs'].update({'Power':power['type'],'PSU / Feed positions':power['maxPowerInputs'],'Management / Utility':', '.join(f['nonNetworkConnectors']),'Optional module slots':json.dumps(f.get('excludedModuleSlots',{}))})
    model['confirmedSummary']=f"{f['counts']['logicalDataInterfaces']} fixed Network interfaces · {f['counts']['RJ45DataSockets']} RJ45 / {f['counts']['SFPDataSockets']} SFP / {f['counts']['SFPPlusDataSockets']} SFP+"
    model['limitations']='แสดงพอร์ต Network คงที่; ไม่เปิดพอร์ตจากโมดูลเสริมในภาพตัวอย่าง; ไม่มีการจำลอง License/Throughput หรือ PoE'
    if model['id']=='cisco-asr-1001-x':model['limitations']+='; SFP+ ใช้ได้เฉพาะ 10G และชุดไฟในต้นแบบเป็น AC คู่'
    finish(model)

for entry in tf['models']:
    mid=entry['modelId']
    if mid not in models:
        model={'id':mid,'name':entry['name'],'model':'FortiGate 100F','brand':'Fortinet','category':'firewall','summary':'FortiGate 100F · 1G RJ45/SFP + 10G SFP+','originalSpecs':{},'images':{},'photos':{},'sources':[],'calibrated':False,'alarmStates':['normal'],'verifiedSpecs':{},'components':{'front':[],'rear':[]}}
        catalog.append(model);models[mid]=model
    model=models[mid]
    selected=next(a for a in entry['assets'] if a['id']==entry['primaryAssetId'])
    photo(model,selected)
    model['sources']=entry['sources']
    model['ports']=[]
    hs={h['socketId']:h for h in entry['hotspots'] if h['assetId']==entry['primaryAssetId']}
    for interface in entry['interfaces']:
        for socket in interface['sockets']:
            box=[round(x*100,4) for x in hs[socket['id']]['boxNormalized']] if socket['id'] in hs else None
            model['ports'].append(p(socket['id'],interface.get('logicalName') or interface['physicalLabel'],socket['connector'],socket['speedsMbps'],interface.get('comboGroup'),box=box))
    for utility in entry['nonNetworkInterfaces']:
        if utility['id'] not in {q['id'] for q in model['ports']}:
            model['ports'].append(p(utility['id'],utility['id'].upper(),utility['connector'],[],kind='console' if 'console' in utility.get('type','') else 'usb'))
    model['calibrated']=bool(hs)
    model['diagramImages']={'front':model['thumbnail']}
    model['images']['front']=model['thumbnail']
    model['components']={'front':[],'rear':[]}
    model['alarmStates']=['normal']
    model['powerSlots']=2 if mid=='fortinet-fortigate-100f' else 1
    model['defaultInstalledPowerSupplies']=model['powerSlots']
    model['powerModes']=['DC'] if mid=='telco-t-marc-280' else ['AC','DC'] if mid.startswith('telco') else ['AC']
    model['removablePSU']=False
    model['verifiedSpecs']['Power']=json.dumps(entry['power'],ensure_ascii=False)
    model['confirmedSummary']=f"{entry['logicalNetworkInterfaceCount']} Network interfaces / {entry['physicalNetworkSocketCount']} sockets · ใช้ Copper/Fiber ของ Combo Port ได้ทีละช่อง"
    model['limitations']='; '.join(entry.get('limitations',entry.get('notes',[])))
    if mid in ['telco-t-marc-340','telco-t-marc-380']:
        model['limitations']+='; ชุดไฟต้นแบบเริ่มที่ Internal AC 1 ชุด เลือก AC/DC ได้และต้องตรวจ Ordering SKU ของเครื่องจริง'
    if mid=='fortinet-fortigate-100f':
        model['verifiedSpecs'].update({'Form factor':'1 RU','Dimensions H × W × D':'44 × 432 × 254 mm','Power':'2 fixed AC supplies, 100–240 V, 50/60 Hz, 1+1; non-hot-swappable','Onboard SSD':'None (100F)','SFP+':'x1 / x2, 1G or 10G fiber'})
        model['limitations']+='; ต้นแบบจำลองสายและไฟเลี้ยง ไม่มี Firewall policy, FortiLink หรือ HA configuration; ยังไม่มีภาพด้านหลังที่ยืนยันตรงรุ่น'
    for asset in entry['assets']:
        if asset['exactModel'] and asset['face']=='rear':model['photos']['rear']=copy_asset(asset['localPath'],mid,'rear')
    finish(model)

assert len(catalog)==19
catalog_file.write_text('window.NOAH_CATALOG='+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'research/catalog-sources.json').write_text(json.dumps([{'model':m['name'],'status':m['sourceStatus'],'sources':m['sources'],'photoSource':m['photoSource'],'confirmedSummary':m['confirmedSummary'],'limitations':m['limitations']} for m in catalog],ensure_ascii=False,indent=2))
print(json.dumps({'models':len(catalog),'colorImages':sum(bool(m.get('thumbnail')) for m in catalog),'calibrated':sum(m['calibrated'] for m in catalog),'logicalInterfaces':sum(m['verifiedSpecs']['Logical network interfaces'] for m in catalog)},ensure_ascii=False))
