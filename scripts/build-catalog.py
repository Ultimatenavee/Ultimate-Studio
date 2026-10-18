from pathlib import Path
import json, re, shutil

base = Path(__file__).resolve().parents[1]
catalog_path = base / 'web/catalog.js'
original_path = base / 'research/original-catalog.json'
if not original_path.exists():
    original_path.write_text(catalog_path.read_text().removeprefix('window.NOAH_CATALOG=').strip().removesuffix(';'))
data = json.loads(original_path.read_text())
models = {m['id']: m for m in data}
asset_root = Path('/workspace/scratch/7360d1d45af5/research-assets')
manifest_path = base / 'research/device-assets-manifest.json'
if (asset_root / 'device-assets-manifest.json').exists():
    shutil.copy2(asset_root / 'device-assets-manifest.json', manifest_path)
manifest = json.loads(manifest_path.read_text())

def ref(title, url): return {'title': title, 'url': url}
cisco_hig = 'https://www.cisco.com/c/en/us/td/docs/routers/access/2900/hardware/installation/guide/Hardware_Installation_Guide/Overview.html'
cisco_isr4 = 'https://www.cisco.com/c/en/us/products/collateral/routers/4000-series-integrated-services-routers-isr/data_sheet-c78-732542.html'
huawei_ar = 'https://e.huawei.com/en/products/routers/ar5710-s'
telco3 = 'https://www.telco.com/wp-content/uploads/2021/03/T-Marc300_datasheet_A4.pdf'
references = {
    'cisco-c1121-8pltep': [ref('Cisco ISR 1000 Datasheet · C1121-8PLTEP', 'https://www.cisco.com/c/en/us/products/collateral/routers/1000-series-integrated-services-routers-isr/datasheet-c78-739512.html')],
    'cisco-1941': [ref('Cisco 1900 Hardware Installation Guide · Cisco 1941', 'https://www.cisco.com/c/en/us/td/docs/routers/access/1900/hardware/installation/guide/1900_HIG/19over.html')],
    'cisco-2911-k9': [ref('Cisco 2900/3900 Hardware Guide · Cisco 2911', cisco_hig)],
    'cisco-3925e': [ref('Cisco 2900/3900 Hardware Guide · Cisco 3925E', cisco_hig)],
    'cisco-3945e': [ref('Cisco 2900/3900 Hardware Guide · Cisco 3945E', cisco_hig)],
    'cisco-asr-1001': [ref('Cisco ASR 1000 Hardware Installation Guide · ASR1001', 'https://www.cisco.com/c/en/us/td/docs/routers/asr1000/install/guide/asr1routers/asr-1000-series-hig.pdf')],
    'cisco-isr-4331': [ref('Cisco ISR 4000 Datasheet · ISR4331', cisco_isr4)],
    'cisco-isr-4431': [ref('Cisco ISR 4000 Datasheet · ISR4431', cisco_isr4)],
    'huawei-ar5710-s8t2x': [ref('Huawei NetEngine AR5710-S · S8T2X specifications', huawei_ar)],
    'huawei-ar5710-s8t2x-lte4ea': [ref('Huawei NetEngine AR5710-S · LTE4EA specifications', huawei_ar)],
    'huawei-s5735-l8t4x-a1': [ref('Huawei CloudEngine S5735-L Datasheet · L8T4X-A1', 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/a7d76a8a16614cefb9943336bb224d69/M2T1A590N889230686196621601/Huawei%20CloudEngine%20S5735-L%20Series%20Switches%20Datasheet.pdf')],
    'huawei-s5731-s48t4x': [ref('Huawei CloudEngine S5731-S · S48T4X specifications', 'https://e.huawei.com/en/products/switches/campus-switches/s5731-s')],
    'telco-t-marc-280': [ref('Telco Systems T-Marc 280 Datasheet', 'https://www.telco.com/wp-content/uploads/2021/03/T-Marc-280-A4.pdf')],
    'telco-t-marc-340': [ref('Telco Systems T-Marc 300 Datasheet · T-Marc 340', telco3)],
    'telco-t-marc-380': [ref('Telco Systems T-Marc 300 Datasheet · T-Marc 380', telco3)],
}
summaries = {
    'huawei-s5735-l8t4x-a1': 'L8T4X-A1: 8 พอร์ต RJ45 และ 4 พอร์ต 10GE SFP+ พร้อมไฟ AC; เป็นคนละรุ่นกับ QA-V2',
    'huawei-s5731-s48t4x': 'S5731-S48T4X: 48 พอร์ต RJ45 และ 4 พอร์ต 10GE SFP+; รอระบุ PSU และ Hardware revision',
    'telco-t-marc-280': 'T-Marc 280: 2 พอร์ต RJ45, 1 พอร์ต Combo และ 1 พอร์ต SFP Uplink พร้อม External PSU; จึงยังไม่ใช้ข้อมูลเดิมที่ระบุทุกพอร์ตเป็น Combo',
    'telco-t-marc-340': 'T-Marc 340: 6 พอร์ต Combo ตาม Datasheet; ชนิด PSU ขึ้นกับ Ordering code',
    'telco-t-marc-380': 'T-Marc 380: 10 พอร์ต Combo ตาม Datasheet; ชนิด PSU ขึ้นกับ Ordering code',
    'huawei-ar5710-s8t2x': 'LAN: 4 GE Copper + 4 GE Combo; WAN: 2 Combo 10GE SFP+ / 2.5GE Copper; รอรายละเอียดชื่อพอร์ตและตัวเครื่อง',
    'huawei-ar5710-s8t2x-lte4ea': 'พอร์ต LAN/WAN ตามรุ่น S8T2X พร้อม LTE4EA และ SIM 2 ช่อง; รอภาพและรายละเอียดรุ่นย่อย',
    'cisco-c1121-8pltep': 'C1121(X)-8PLTEP: 2 GE WAN และ 8 GE LAN; รอระบุโมดูล Cellular และ SKU ก่อนทำ Physical view',
}
for model in data:
    model['sources'] = references.get(model['id'], [])
    model['sourceStatus'] = 'reference-located' if model['sources'] else 'catalog'
    model['confirmedSummary'] = summaries.get(model['id'], 'พบคู่มือผู้ผลิตที่มีรุ่นนี้ รอรายละเอียดพอร์ตและพิกัดตัวเครื่องสำหรับ Physical view')
    model['limitations'] = 'Original Catalog เป็นข้อมูลตั้งต้น ยังไม่ได้ยืนยันทุกช่องและยังไม่ใช้เป็นกฎการเชื่อมต่อ'

def box(values, width, height):
    return [round(values[0]/width*100,4),round(values[1]/height*100,4),round(values[2]/width*100,4),round(values[3]/height*100,4)]

for source, model_id in zip(manifest['models'], ['huawei-s5735-l8t4x-qa-v2','alcatel-os6450-10','cisco-asr-1001-x']):
    model = models[model_id]
    model.update(physicalReady=True, sourceStatus='physical-verified', powerSlots=2 if model_id.startswith('cisco') else 1, powerModes=['AC'], alarmStates=['normal','minor','major','critical'] if model_id.startswith('cisco') else ['normal'], images={}, components={'front':[],'rear':[]})
    model['sources'] = [ref('Hardware / Product reference · '+model['model'], url) for url in source['primarySources'][:2]]
    if source.get('manufacturerManualMirror'):
        model['sources'].append(ref('Manufacturer Hardware Guide · mirror', source['manufacturerManualMirror']))
    ports=[]
    for face in ['front','rear']:
        view=source[face]
        src=Path(view['localPath'])
        dest=base/'web/assets'/src.name
        if src.exists(): shutil.copy2(src,dest)
        assert dest.exists(), str(dest)
        model['images'][face]='assets/'+src.name
        for index, port in enumerate(view['ports']):
            kind,label=port['kind'],port['label']
            bounds=box(port['box'],view['width'],view['height'])
            if face=='rear':
                component={'id':'rear'+str(index),'name':label,'type':'power' if 'power' in kind else 'info','box':bounds}
                if component['type']=='power': component['slot']=index if model_id.startswith('cisco') else 0
                model['components'][face].append(component)
                continue
            if 'RJ45 GE' in kind or 'SFP' in kind:
                connector='RJ45' if 'RJ45' in kind else 'SFP+' if 'SFP+' in kind else 'SFP'
                group=None
                if model_id.startswith('huawei'):
                    number=int(label.split()[-1]);pid=('ge' if label.startswith('GE ') else 'x')+str(number);name=port['catalogIdentifier'];speeds=[1000] if connector=='RJ45' else [1000,10000]
                elif model_id.startswith('alcatel'):
                    number=int(port['logicalPort']);pid=('r' if connector=='RJ45' else 's')+str(number);name='1/'+str(number);speeds=[1000];group='combo'+str(number) if number in [9,10] else None
                else:
                    pid=label.lower();name=port['logicalPort'];speeds=[10000] if connector=='SFP+' else [1000]
                ports.append({'id':pid,'name':name,'faceLabel':label,'kind':'network','connector':connector,'speeds':speeds,'group':group,'face':'front','box':bounds})
            else:
                pkind='management' if 'management' in kind else 'console' if 'console' in kind or 'auxiliary' in kind else 'usb'
                ports.append({'id':re.sub('[^a-z0-9]+','-',label.lower()).strip('-'),'name':label,'kind':pkind,'connector':'RJ45' if 'RJ45' in kind else 'USB','speeds':[1000] if pkind=='management' else [],'face':'front','box':bounds})
    if model_id.startswith('huawei'):
        ports.sort(key=lambda port: (0 if port['id'].startswith('ge') else 1 if port['id'].startswith('x') else 2,int(re.search(r'\d+',port['id']).group()) if re.search(r'\d+',port['id']) else 99))
        for cid,name,bounds in [('pwr','PWR',[22,26,6,6]),('sys','SYS',[22,33,6,6])]: model['components']['front'].append({'id':cid,'name':name,'type':'led','box':box(bounds,531,93)})
        model['confirmedSummary']='8 พอร์ต GE RJ45 และ 4 พอร์ต SFP+ รองรับ 1G/10G พร้อม Console และไฟ AC ภายใน; ภาพตรงรุ่น 98012073 จาก Hardware Description'
        model['limitations']='ชื่อ Interface เต็มใช้รูปแบบจาก Catalog ที่คุณส่งมา; ภาพอ้างอิง 98012073 ต้องตรวจ Hardware revision ของเครื่องจริง ส่วน Transceiver ในโปรแกรมเป็นประเภททั่วไป'
    elif model_id.startswith('alcatel'):
        for cid,name,bounds in [('pwr','PWR',[313,13,21,12]),('ok','OK',[123,13,21,12])]: model['components']['front'].append({'id':cid,'name':name,'type':'led','box':box(bounds,1464,252)})
        model['confirmedSummary']='RJ45 1–8, Combo Copper/SFP 9/10 และ SFP Uplink/Stack 11/12 รวม 12 Interfaces และ 14 ช่อง Network; Internal AC'
        model['limitations']='ไม่มีการจำลอง Stack; ภาพคู่มือพิมพ์ STK B ซ้ำที่ 11/12 และภาพด้านหลังไม่มี Production compliance label; รุ่น PoE และ 10L เป็นคนละ Variant'
    else:
        for index,region in enumerate(source['front']['optionalModuleRegions']): model['components']['front'].append({'id':'bay'+str(index),'name':'NIM · Reference' if index==0 else 'SPA · Reference','type':'bay','description':'ภาพแสดงโมดูลเสริมตัวอย่าง รอบนี้ยังไม่กำหนดการ์ดและพอร์ตใน Slot นี้','box':box(region['box'],1640,128)})
        led_locations=[('pwr','PWR',[522.41,79.17,11.18,9.59],None),('stat','STAT',[522.41,93.93,11.18,9.59],None),('crit','CRIT',[548.22,64.41,11.18,9.60],'critical'),('maj','MAJ',[548.22,79.17,11.18,9.59],'major'),('min','MIN',[548.22,93.93,11.18,9.59],'minor')]
        for cid,name,bounds,alarm in led_locations: model['components']['front'].append({'id':cid,'name':name,'type':'led','alarm':alarm,'box':box(bounds,1640,128)})
        model['confirmedSummary']='6 พอร์ต 1GE SFP และ 2 พอร์ต 10GE SFP+ ที่ใช้ได้เฉพาะ 10G; แยก MGMT/Console/USB พร้อม PSU 2 ช่อง'
        model['limitations']='รอบนี้ใช้ PSU ชนิด AC; เครื่องจริงรองรับ AC คู่หรือ DC คู่แต่ห้ามผสมกัน ภาพ NIM/SPA เป็นโมดูลตัวอย่าง จึงไม่เปิดใช้พอร์ตเสริมในรอบนี้'
    model['ports']=ports
catalog_path.write_text('window.NOAH_CATALOG='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
output=[{'model':m['name'],'status':m['sourceStatus'],'sources':m['sources'],'confirmedSummary':m['confirmedSummary'],'limitations':m['limitations']} for m in data]
(base/'research/catalog-sources.json').write_text(json.dumps(output,ensure_ascii=False,indent=2))
if (asset_root/'huawei-s5735-l8t4x-98012073-hardware.html').exists(): shutil.copy2(asset_root/'huawei-s5735-l8t4x-98012073-hardware.html',base/'research/huawei-hardware-reference.html')
print(json.dumps({'catalog':len(data),'references':sum(bool(m['sources']) for m in data),'physical':[(m['model'],len([p for p in m['ports'] if p['kind']=='network']),m['powerSlots']) for m in data if m['physicalReady']]},ensure_ascii=False))
