"""Extract Ragnarok surface swatches for original SIRIN A/B/C geometry.

Run with a local client and ragx configured in scripts/ayothaya-local.json.
Crops preserve source pixels: no recoloring, repainting or AI replacement.
The runtime ships embedded PNG/WebP and never reads the player's game install.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, sys, io, hashlib
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets-source/sirin-labs/textures'
OUT.mkdir(parents=True,exist_ok=True)
settings=json.loads((ROOT/'scripts/ayothaya-local.json').read_text(encoding='utf-8'))
sys.path.insert(0,settings['ragx'])
from ragx.client import open_stack
archive=open_stack(settings['client'])
# Crop rectangles are pixel coordinates in the original texture atlas.
rows=[
 ('jade_tiles',r'기타마을\tl_inn02.bmp',(166,83,246,189),'Ayothaya'),
 ('indigo_tiles',r'기타마을\busi_comroof.bmp',(0,87,256,244),'Lighthalzen'),
 ('clay_tiles',r'기타마을\t_002.bmp',(75,147,181,201),'Ayothaya'),
 ('limestone',r'dewata\ind_house00.bmp',(9,39,246,164),'Dewata'),
 ('plaster',r'dewata\ind_hotel02.bmp',(82,29,252,153),'Dewata'),
 ('teak',r'dewata\ind_hotel06.bmp',(100,110,246,152),'Dewata'),
 ('bronze',r'verus\ver_j_04.bmp',(8,97,237,142),'Verus'),
 ('steel',r'기타마을\busi_compill.bmp',(23,4,82,247),'Lighthalzen'),
 ('glass',r'verus\ver_j_32.bmp',(51,101,90,155),'Verus'),
 ('warm',r'기타마을\t_wall002.bmp',(112,139,155,228),'Ayothaya'),
 ('cyan',r'verus\ver_j_08.bmp',(171,3,211,43),'Verus'),
 ('shadow',r'기타마을\te_muroof.bmp',(198,88,232,163),'Ayothaya'),
 ('pavers',r'필드바닥\태국풀바닥20.bmp',None,'Ayothaya'),
 ('leaf',r'프론테라\weed.bmp',None,'Prontera'),
 ('leaf_light',r'프론테라\weed.bmp',None,'Prontera'),
 ('soil',r'verus\ver_j_45.bmp',None,'Verus'),
]
records=[]
for slot,path,crop,city in rows:
    source='data\\texture\\'+path
    raw=archive.read(source);im=Image.open(io.BytesIO(raw)).convert('RGB')
    original=im.size
    if crop:im=im.crop(crop)
    output=OUT/(slot+'.png');im.save(output)
    records.append({'material':slot,'source':source,'origin':city,'crop':crop,'originalSize':original,'size':im.size,'sourceSHA256':hashlib.sha256(raw).hexdigest(),'pngSHA256':hashlib.sha256(output.read_bytes()).hexdigest(),'processing':'lossless atlas crop; original RGB colors'})
# Project-specific signage is authored separately from the borrowed materials.
for code,title in [('A','NAGA COURTYARD'),('B','LOTUS NEXUS'),('C','MONSOON TERRACES')]:
    im=Image.new('RGB',(1024,256),(17,37,43));d=ImageDraw.Draw(im)
    d.rectangle((8,8,1015,247),outline=(181,143,73),width=5)
    for text,y,size in [(title,50,59),('NETWORK RESEARCH LAB',147,34)]:
        d.text((512,y),text,font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',size),anchor='mt',fill=(235,222,177))
    im.save(OUT/('sign_'+code+'.png'))
provenance={'geometry':'Original Blender meshes based on approved A/B/C concepts','surfaceArtwork':'Ragnarok Online / Gravity; extracted from local client data.grf','signage':'Original project labels','materials':records}
(OUT.parent/'texture-provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'web/assets/sirin/labs/texture-provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2),encoding='utf-8')
print('Extracted',len(records),'Ragnarok material swatches; original pixels and provenance saved.')
