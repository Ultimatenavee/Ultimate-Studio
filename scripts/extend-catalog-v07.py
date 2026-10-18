"""Add vendor-verified switches and an image-only PE; retain existing profiles."""
from pathlib import Path
from lxml import html
import json
root=Path(__file__).resolve().parents[1]
p=root/'research/vendor-v07'
catalog=json.loads((root/'research/catalog-before-v07.json').read_text())
def port(i,name,c,s,group=None,kind='network',**extra):return dict(id=i,name=name,connector=c,speeds=s,group=group,face='front',kind=kind,**extra)
def group(prefix,count,connector,speeds,start=1,label=None):return [port(prefix+str(i),f'{label or prefix}0/0/{i}',connector,speeds) for i in range(start,start+count)]
def profile(model,brand='Huawei'):
 return dict(id=(brand+'-'+model).lower(),name=brand+' '+model,model=model,brand=brand,category='switch',physicalReady=True,calibrated=False,ports=[],components={'front':[],'rear':[]},images={},photos={},powerSlots=2,powerModes=['AC','DC'],defaultInstalledPowerSupplies=1,removablePSU=True,allowsMixedPower=brand=='Huawei',alarmStates=['normal'],originalSpecs={},verifiedSpecs={},sources=[],summary='Enterprise switch',limitations='ภาพจำลองเป็นภาพประกอบ ไม่ใช่แผนผังพอร์ตที่สอบเทียบ; พอร์ตเลือกจากรายการ; ไม่จำลอง Configuration หรือ Traffic',sourceStatus='vendor-hardware-verified',nodeWidth=244,nodeHeight=88)
def tech(model):
 r=html.parse(str(p/(model.lower()+'.html')));res={}
 for t in r.xpath('//table'):
  rows=t.xpath('.//tr');header=' '.join(rows[0].text_content().split()) if rows else ''
  if header=='Item Description':
   for tr in rows[1:]:
    cells=tr.xpath('./td');
    if len(cells)==2:res[' '.join(cells[0].text_content().split())]=' '.join(cells[1].text_content().split())
 return res
refs={'S5720-12TP-LI-AC':('EDOC1000013597','b4dabfc4','j016'),'S5720-36C-EI-28S-AC':('EDOC1000013597','3b47a44f','j03d'),'S5720-52X-SI-AC':('EDOC1000013597','ea3f2e19','j02f'),'S5732-H24S6Q':('EDOC1000013597','9b370196','j08i'),'S6720-30C-EI-24S-AC':('EDOC1000013621','fb0c31cc','j00q'),'S6730-H24X6C':('EDOC1000013621','bf1cfe43','j014')}
new=[]
for model,(doc,topic,part) in refs.items():
 m=profile(model);m['verifiedSpecs']=tech(model)
 m['sources']=[{'title':'Huawei hardware reference · '+model,'url':f'https://support.huawei.com/enterprise/en/doc/{doc}/{topic}/{model.lower()}'},{'title':'Huawei hardware reference · direct chapter','url':f'https://support.huawei.cn/supportgateway/view/v1/enterprise/doc/main-content?nid={doc}&partNo={part}'}]
 m['aliases']=[model.replace('-AC','')]
 if model=='S5720-12TP-LI-AC':
  m.update(powerSlots=1,powerModes=['AC'],removablePSU=False,allowsMixedPower=False)
  m['ports']=group('ge',8,'RJ45',[10,100,1000],label='GigabitEthernet')
  for i in [9,10]:
   for c,s,suffix in [('RJ45',[10,100,1000],'c'),('SFP',[100,1000],'f')]:m['ports'].append(port('ge'+str(i)+suffix,f'GigabitEthernet0/0/{i}',c,s,'combo'+str(i)))
  m['ports']+=group('ge',2,'SFP',[1000],11,'GigabitEthernet');m['verifiedSpecs'].update({'Fixed network ports':'8 RJ45 + 2 RJ45/SFP Combo + 2 GE SFP','Power':'Fixed internal AC','Cooling':'Fanless'})
 elif model=='S5720-36C-EI-28S-AC':
  m['ports']=group('ge',24,'SFP',[100,1000],label='GigabitEthernet')
  for i in range(25,29):
   for c,s,suffix in [('RJ45',[10,100,1000],'c'),('SFP',[100,1000],'f')]:m['ports'].append(port('ge'+str(i)+suffix,f'GigabitEthernet0/0/{i}',c,s,'combo'+str(i)))
  m['ports']+=group('x',4,'SFP+',[1000,10000],label='XGigabitEthernet')
  m['verifiedSpecs'].update({'Fixed network ports':'28 GE SFP (4 Combo RJ45/SFP) + 4 10GE SFP+','Expansion':'1 rear slot: optional 2-port 10GE SFP+, 2-port 10GE RJ45 or dedicated QSFP+ stack card; not installed in this profile','Power':'2 removable 150W AC/DC PSU slots; 1+1 redundancy','Cooling':'FAN-028A-B removable fan'})
 elif model=='S5720-52X-SI-AC':
  m['ports']=group('ge',48,'RJ45',[10,100,1000],label='GigabitEthernet')+group('x',4,'SFP+',[1000,10000],label='XGigabitEthernet')
  m['verifiedSpecs'].update({'Fixed network ports':'48 RJ45 + 4 10GE SFP+','Power':'2 removable AC/DC PSU slots; 1+1 redundancy'})
 elif model=='S5732-H24S6Q':
  m['aliases']+=['S5732-H'];m['ports']=group('ge',20,'SFP',[1000],label='GigabitEthernet')+group('x',4,'SFP+',[1000,10000],1,'XGigabitEthernet')+group('q',6,'QSFP+',[40000],1,'40GE')
  m['verifiedSpecs'].update({'Fixed network ports':'20 GE SFP + 4 10GE SFP+ + 6 40GE QSFP+','Switching capacity':'600 Gbps device / 2.4 Tbps system','Forwarding performance':'450 Mpps','Power':'2 removable AC/DC PSU slots; 1+1 redundancy','Cooling':'4 FAN-031A-B modules','100GE option':'Requires V200R020C00 or later and port-speed license; base profile uses 40GE, no breakout'})
  m['sources'].append({'title':'Huawei S5732-H product specifications','url':'https://e.huawei.com/th/products/switches/campus-switches/s5732-h'})
 elif model=='S6720-30C-EI-24S-AC':
  m['aliases']+=['S6720-30C-EI'];m['ports']=group('x',24,'SFP+',[1000,10000],label='XGigabitEthernet')+group('q',2,'QSFP+',[40000],1,'40GE')
  m['verifiedSpecs'].update({'Fixed network ports':'24 10GE SFP+ + 2 40GE QSFP+','Expansion':'1 rear slot: optional 4x40GE, 8x10GE or 4x10GE cards (version dependent); not installed','Power':'2 PSU slots: 600W AC / 350W DC; 1+1 redundancy','Cooling':'FAN-060B-B module','Breakout':'40GE to 4x10GE supported by hardware; not modeled'})
 elif model=='S6730-H24X6C':
  m['ports']=group('x',24,'SFP+',[1000,10000],label='XGigabitEthernet')+group('q',6,'QSFP28',[40000,100000],1,'40GE / 100GE')
  m['verifiedSpecs'].update({'Fixed network ports':'24 10GE SFP+ + 6 40GE/100GE QSFP28','Power':'2 removable AC/DC PSU slots; 1+1 redundancy','Cooling':'4 FAN-031A-B modules','100GE license':'02352FSG variants require license in V200R019C00 and later; 02353GFC variants include activated 100GE license. Profile represents licensed 100GE capability; no breakout'})
  # S6730-H24 is incomplete; retain imported raw name and do not silently match a SKU.
 m['ports'].append(port('console','Console','RJ45',[],kind='console'))
 if model!='S5720-12TP-LI-AC':m['ports']+=[port('management','ETH management','RJ45',[10,100,1000],kind='management'),port('usb','USB','USB',[],kind='usb')]
 new.append(m)
# S5335 is not S5735: own vendor brochure, including the eight shared copper sockets.
m=profile('S5335-S32ST4X');m['ports']=group('ge',24,'SFP',[1000],label='GigabitEthernet')
for x in m['ports']:
 if int(x['id'][2:])>=17:x['group']='combo'+x['id'][2:]
for i in range(17,25):m['ports'].append(port('ge'+str(i)+'c',f'GigabitEthernet0/0/{i}','RJ45',[10,100,1000],'combo'+str(i)))
for pp in m['ports']:
 if pp['group']:pp['name']='Combo '+str(int(pp['group'][5:])-16)
 elif pp['connector']=='SFP':pp['name']='GE SFP '+pp['id'][2:]
m['ports']+=group('x',4,'SFP+',[1000,10000],label='XGigabitEthernet')
m['verifiedSpecs']={'Model':'CloudEngine S5335-S32ST4X','Fixed network ports':'24 GE SFP (8 shared RJ45/SFP Combo) + 4 10GE SFP+','Switching capacity':'144 Gbps device / 432 Gbps system','Forwarding performance':'108 Mpps','Dimensions (H x W x D)':'43.6 x 442 x 420 mm','Rack height':'1U','Weight including packaging':'7.47 kg','Power':'2 removable PSU slots; 60W AC / 1000W DC; mixed AC/DC allowed; 1+1 redundancy','Maximum power consumption':'66 W','Rated voltage':'100–240 VAC 50/60Hz; -48 to -60 VDC','Operating temperature':'0 to 50°C at 0–1800m; reduce upper limit 1°C per 220m above 1800m','Short-term temperature':'-5 to 55°C at 0–1800m','Storage temperature':'-40 to 70°C','Relative humidity':'5–95%, non-condensing','Cooling':'Air cooling with intelligent fan speed adjustment','PoE':'No','VLAN':'4094; 802.1Q, QinQ, VLAN mapping','Routing':'OSPF, IS-IS, BGP, VRRP; IPv4/IPv6 dual stack','Reliability':'STP/RSTP/MSTP, SEP, ERPS, Smart Link','OAM':'IEEE 802.3ah / 802.1ag','Management':'SNMPv1/v2c/v3, SSHv2, RMON, sFlow, telemetry','Security':'802.1X, MAC/Portal authentication, DHCP snooping, strict ARP learning','Port convention':'Brochure verifies 8 shared pairs but does not identify CLI numbers; Combo 1–8 are diagram identifiers, not vendor CLI labels'}
m['sources']=[{'title':'Huawei CloudEngine S5335-S vendor brochure','url':'https://carrier.huawei.com/~/media/CNBGV2/download/products/networks/campus-switches/CloudEngine-S5335-S-Series-Switches-Brochure-en.pdf'}];new.append(m)
for model,variant in [('APRESIA13200-48X-PSR3','48x'),('APRESIA13200-52GT-PSR2','52gt'),('APRESIA15000-32XL-PSR2','15000')]:
 m=profile(model,'Hitachi');m['defaultInstalledPowerSupplies']=2;stem=model.lower();table=html.parse(str(p/(stem+'.html'))).xpath('//table')[1];raw={};section=''
 for tr in table.xpath('.//tr'):
  cells=[' '.join(c.text_content().split()) for c in tr.xpath('./td|./th')]
  if len(cells)>=3:section=cells[0];key=section+' · '+cells[1];raw[key]=' | '.join(cells[2:])
  elif len(cells)==2:raw[section+' · '+cells[0]]=cells[1]
 m['verifiedSpecs']={'Manufacturer / family':'Hitachi heritage · APRESIA Systems AEOS8','Power':'2 hot-swappable AC/DC PSU slots; units sold separately','PoE':'No','Layer 3':'Optional L3 license','Rack height':'1U','VLAN':'4094','Management':'Console, dedicated management port, SD-card boot, SNMPv1/v2c/v3, SSH, LLDP, NETCONF (partial)','Security':'802.1X, MAC/Web authentication, DHCP snooping, RADIUS/TACACS+','Reliability':'STP/RSTP/MSTP, LACP, MMRP-Plus, port redundancy','Jumbo Frame':'Supported; topology MTU is documentation only','Operating temperature':'0–45°C; depends on selected PSU','Humidity':'See linked standard specification','Fanless':'No','Source detail':'Complete vendor specification table retained below (Japanese headings)',**raw}
 if variant in ['48x','52gt']:
  m['ports']=[port('p'+str(i),str(i),'RJ45',[10,100,1000]) for i in range(1,49)]+[port('p'+str(i),str(i),'SFP+' if variant=='48x' else 'SFP',[1000,10000] if variant=='48x' else [1000]) for i in range(49,53)]
  m['verifiedSpecs'].update({'Fixed network ports':'48 RJ45 + 4 '+('1G/10G SFP/SFP+' if variant=='48x' else 'GE SFP'),'Dimensions (W x D x H)':'436 x 400 x 43.8 mm','Weight excluding PSU':'≤5.5 kg','Switching capacity':'176 Gbps' if variant=='48x' else '104 Gbps','Forwarding performance':'130.9 Mpps' if variant=='48x' else '77.3 Mpps','MAC table':'32K','Packet buffer':'4 MB'})
 else:
  m['allowsMixedPower']=True;m['maxNetworkInterfaces']=32
  m['ports']=[port('p'+str(i),str(i),'SFP+',[1000,10000]) for i in range(1,33)]
  for start in [25,29]:
   blocked=['p'+str(i) for i in range(start,start+4)];qid='q'+str(start)
   m['ports'].append(port(qid,str(start)+' (40GE)','QSFP+',[40000],conflictPorts=blocked,allowedOptics=['sr4']))
   for pp in m['ports']:
    if pp['id'] in blocked:pp['conflictPorts']=[qid]
  m['verifiedSpecs'].update({'Fixed network ports':'32 1G/10G SFP/SFP+; 2 40G QSFP+ share banks 25–28 and 29–32','Port constraints':'40GE25 disables SFP25–28; 40GE29 disables SFP29–32; remaining independent ports remain usable','40GE optics':'Vendor standard lists 40GBASE-SR4 only; MM Fiber offered','Dimensions (W x D x H)':'436 x 380.4 x 43.8 mm','Weight excluding PSU':'≤6 kg','Switching capacity':'640 Gbps','Forwarding performance':'476.1 Mpps','MAC table':'128K','Packet buffer':'9 MB'})
 m['ports']+=[port('management','Management','RJ45',[10,100,1000],kind='management'),port('console','Console','DB9',[],kind='console'),port('sd','SD card','SD',[],kind='storage')]
 m['sources']=[{'title':'APRESIA manufacturer product and full specification','url':'https://www.apresia.jp/products/ent/'+stem+'.html'},{'title':'APRESIA manufacturer hardware manuals / standard specifications','url':'https://www.apresia.jp/products/ent/support/manual.html'}]
 if variant=='15000':m['sources'].append({'title':'APRESIA15000 standard specification','url':'https://www.apresia.jp/products/ent/support/docs/Specification_for_Apresia15000-32XL-PSR2_SP61-90751A.pdf'})
 new.append(m)
pe=next(m for m in catalog if m.get('deviceRole')=='PE').copy();pe.update(id='huawei-ne40e-x8a',name='Huawei NE40E-X8A',model='NE40E-X8A',aliases=['NE40E-X8A(V8)'],sources=[{'title':'Huawei NE40E-X8A chassis appearance','url':'https://support.huawei.com/enterprise/en/doc/EDOC1100383693/ee8c26a3/ne40e-x8a'}],nodeWidth=158,nodeHeight=176);new.append(pe)
for m in new:
 if not m.get('topologyOnly'):
  net=[q for q in m['ports'] if q['kind']=='network'];m['verifiedSpecs'].update({'Network interfaces':m.get('maxNetworkInterfaces',len({q['group'] or q['id'] for q in net})),'Physical network sockets':len(net)})
  m['confirmedSummary']=m['verifiedSpecs'].get('Fixed network ports','');m['summary']=m['confirmedSummary']
 # Asset assignment supplied after imagegen QA.
 m['displayImage']='assets/'+m['id']+'-illustration-v07.png';m['thumbnail']=m['displayImage'];m['displayIllustrative']=True
 m['displayDimensions']={'width':1536,'height':1024};m['displayFrame']=[0,0,1536,1024];m['thumbnailDimensions']=m['displayDimensions'];m['thumbnailFrame']=m['displayFrame']
 if not m.get('topologyOnly'):
  ref=p/(m['model'].lower()+'-appearance.png')
  if m['model']=='S5335-S32ST4X':ref=p/'s5335-p2-1.jpeg'
  if ref.exists():
   import shutil
   dest=root/'web/assets'/(m['id']+'-reference'+ref.suffix);shutil.copy2(ref,dest);m['images']={'front':'assets/'+dest.name};m['photos']=m['images'].copy()
existing={m['id'] for m in catalog};assert all(m['id'] not in existing for m in new)
catalog[-1:-1]=new
(root/'web/catalog.js').write_text('window.NOAH_CATALOG='+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'research/catalog-v07-additions.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n')
print('Added',len(new),'profiles; visible',len(catalog)-1)
