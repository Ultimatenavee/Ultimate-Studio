"""Export original laboratory surface textures from the configured local RO client."""
import sys,json,io
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2]
cfg=json.loads((root/'scripts/ayothaya-local.json').read_text(encoding='utf8'))
sys.path.insert(0,cfg['ragx'])
from ragx.client import open_stack
archive=open_stack(cfg['client']);out=root/'web/assets/ayothaya/lab';out.mkdir(parents=True,exist_ok=True)
sources={'floor':r'data\texture\lighthalzen\lhz_dun_b04.bmp','wall':r'data\texture\verus\lab_wall01.bmp','panel':r'data\texture\sch_lab\sch_lab_wall01.bmp'}
for name,source in sources.items():Image.open(io.BytesIO(archive.read(source))).convert('RGB').save(out/(name+'.png'))
(out/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf8')
print('Exported Lighthalzen floor, Verus wall and laboratory service panel')
