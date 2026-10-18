"""Integrate unchanged imagegen PNGs; framing metadata never edits pixels."""
import json, pathlib, shutil, hashlib, sys
from PIL import Image

root = pathlib.Path(__file__).resolve().parents[1]
source = pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else None
manifest_file = root/'research/generated-device-art-v03.json'
if source:
    assets=[]
    for p in sorted(source.glob('*/manifest.json')):
        data=json.loads(p.read_text())
        assets.extend(data.get('assets',data.get('models',[])))
    assert len(assets)==23
    for a in assets:
        original=pathlib.Path(a['outputPath'])
        target=root/'web/assets'/f"{a['modelId']}-illustration-v03.png"
        shutil.copyfile(original,target)
        a['assetPath']=str(target.relative_to(root/'web'))
        a['sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
        assert a['sha256']==hashlib.sha256(original.read_bytes()).hexdigest()
    manifest_file.write_text(json.dumps({'version':3,'purpose':'Uniform illustrative display assets, not calibrated port maps','assets':assets},ensure_ascii=False,indent=2)+'\n')
assets=json.loads(manifest_file.read_text())['assets']
file=root/'web/catalog.js'
catalog=json.loads(file.read_text().removeprefix('window.NOAH_CATALOG=').strip().removesuffix(';'))
models={m['id']:m for m in catalog}
for a in assets:
    mid=a['modelId']
    if mid not in models:
        short=mid.rsplit('-',1)[-1].upper()
        ref=a['reference']
        m=dict(id=mid,name=f'Huawei NetEngine 8000 {short}',model=f'NetEngine 8000 {short}',brand='Huawei',category='router',deviceRole='PE',topologyOnly=True,physicalReady=True,calibrated=False,ports=[],components={},images={},photos={},powerSlots=0,powerModes=[],originalSpecs={},verifiedSpecs={},summary='PE Router · ภาพอุปกรณ์',confirmedSummary='PE Router สำหรับวาง Topology ใช้ชื่อ Interface ที่ระบุเอง',limitations='ภาพจำลองตามรุ่นอ้างอิง ไม่มีข้อมูลสเปกหรือพอร์ตของรุ่นนี้',sources=[dict(title='ภาพอ้างอิง Huawei · '+ref.get('exactReferenceModel',short),url=ref.get('sourcePageURL') or ref['sourceURL'])])
        catalog.append(m);models[mid]=m
    m=models[mid]
    path=a['assetPath']
    image=Image.open(root/'web'/path)
    assert image.mode=='RGBA' and image.getchannel('A').getextrema()[0]==0 and image.getchannel('A').getextrema()[1]>=250
    bounds=image.getchannel('A').point(lambda p:255 if p>=128 else 0).getbbox()
    assert bounds
    x,y,right,bottom=bounds
    pad=4
    x=max(0,x-pad);y=max(0,y-pad);right=min(image.width,right+pad);bottom=min(image.height,bottom+pad)
    m.update(displayImage=path,displayDimensions=dict(width=image.width,height=image.height),displayFrame=[x,y,right-x,bottom-y],displayIllustrative=True,nodeWidth=244,nodeHeight=88)
    if m.get('topologyOnly'):
        m.update(thumbnail=path,thumbnailDimensions=m['displayDimensions'],thumbnailFrame=m['displayFrame'])
        m['nodeHeight']=max(88,min(300,round(220*(bottom-y)/(right-x)+12)))
file.write_text('window.NOAH_CATALOG='+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
print(f'Integrated {len(assets)} unchanged transparent images; {sum(bool(m.get("topologyOnly")) for m in catalog)} PE image-only profiles')
