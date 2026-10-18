"""Extract only selected local RO decorations; preserve ACT layer transforms and alpha."""
import sys,json,math,io,argparse
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ragx',required=True,help='Path to the ragx source checkout')
parser.add_argument('--client',default=r'C:\Program Files\RagnarokOnline')
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[2]/'web/assets/ayothaya/decor')
args=parser.parse_args()
sys.path.insert(0,str(Path(args.ragx).resolve()))
from ragx.client import open_stack
from ragx.formats import spr,act
from ragx.commands.sprites_cmd import decode_spr_frames
from ragx.map_builder import MapBuilder,AssetSource
from ragx.textures import convert_texture
out=args.output
out.mkdir(exist_ok=True,parents=True)
a=open_stack(args.client)
manifest={'source':'Local RagnarokOnline client archive stack','sprites':{},'models':{}}
previews=[]
for key,source in {'portal':'portal','purple-portal':'4_purple_warp','scientist':'4_m_science','researcher':'4_f_science'}.items():
 name='data\\sprite\\npc\\'+source
 s=spr.parse(a.read(name+'.spr'));frames=decode_spr_frames(s)
 action=act.parse(a.read(name+'.act')).actions[0]
 rendered=[];boxes=[]
 for f in action.frames:
  layers=[]
  for l in f.layers:
   if l.sprite_index<0:continue
   index=l.sprite_index+(len(s.indexed_frames) if l.sprite_type==1 else 0)
   if index>=len(frames):continue
   pixels=(frames[index].astype(np.float32)*np.asarray(l.color,dtype=np.float32)/255).clip(0,255).astype(np.uint8)
   im=Image.fromarray(pixels)
   if l.mirror:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   if l.scale_x<0:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   if l.scale_y<0:im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
   im=im.resize((max(1,round(im.width*abs(l.scale_x))),max(1,round(im.height*abs(l.scale_y)))),Image.Resampling.BICUBIC)
   if l.angle:im=im.rotate(-l.angle,expand=True,resample=Image.Resampling.BICUBIC)
   x,y=round(l.x-im.width/2),round(l.y-im.height/2)
   layers.append((im,x,y));boxes.append((x,y,x+im.width,y+im.height))
  rendered.append(layers)
 minx=min(b[0] for b in boxes)-2;miny=min(b[1] for b in boxes)-2
 w=max(b[2] for b in boxes)-minx+2;h=max(b[3] for b in boxes)-miny+2
 cols=min(8,len(rendered));rows=math.ceil(len(rendered)/cols)
 sheet=Image.new('RGBA',(w*cols,h*rows))
 for i,layers in enumerate(rendered):
  frame=Image.new('RGBA',(w,h))
  for im,x,y in layers:frame.alpha_composite(im,(x-minx,y-miny))
  sheet.alpha_composite(frame,((i%cols)*w,(i//cols)*h))
  if i==0:previews.append((key,frame))
 sheet.save(out/(key+'.png'))
 manifest['sprites'][key]={'source':name+'.spr','action':0,'frames':len(rendered),'columns':cols,'rows':rows,'width':w,'height':h,'frameMs':action.delay*25}
 print(key,manifest['sprites'][key])
class EmbeddedBuilder(MapBuilder):
 def _material_factory(self,builder,sampler,stats,external_textures=False,uri_base=None):
  return super()._material_factory(builder,sampler,stats,False,uri_base)
 def _write_output(self,builder,out_path,external_textures):
  return super()._write_output(builder,out_path,False)
builder=EmbeddedBuilder(AssetSource(a),world_scale=.05)
models={'buddha':r'아요타야\불상01.rsm','urn':r'아요타야\항아리01.rsm','plant':r'아요타야\화분.rsm','brazier':r'아요타야\화로.rsm','temple-cabinet':r'아요타야\장식장.rsm','lab-console':r'아인브로크\조정판.rsm','lab-tank':r'아인브로크\실험관.rsm','lab-cabinet':r'리히타르젠\약장.rsm','werner-monitor':r'tera\monitor_h_01.rsm','verus-monitor':r'verus\monitor_01.rsm','lab-desk':r'tera\desk.rsm','lab-chair':r'tera\chair_h_01.rsm','lab-storage':r'tera\cabi_01.rsm','lab-extinguisher':r'tera\extingu.rsm','temple-lantern':r'일본\일본_등불.rsm','payon-lantern':r'페이욘\등.rsm','taiwan-lantern':r'대만\대만_등.rsm','town-lantern':r'외부소품\가로등01.rsm'}
for key,name in models.items():
 stats=builder.build_model_gltf(name,out/(key+'.glb'),str(out))
 if stats is None:raise RuntimeError(name)
 manifest['models'][key]={'source':'data\\model\\'+name,'scale':.05}
 print(key,stats)
for key,name in {'warp-ring':r'data\texture\내부소품\warp1.bmp','warp-light':r'data\texture\effect\new_fatal_menace\new_fatal_menace\warp_light_blue.tga'}.items():
 tex=convert_texture(a.read(name),name);(out/(key+'.png')).write_bytes(tex.png)
 manifest['sprites'][key]={'source':name,'frames':1,'columns':1,'rows':1,'width':tex.width,'height':tex.height,'frameMs':100}
 previews.append((key,Image.open(io.BytesIO(tex.png)).convert('RGBA')))
manifest['textures']={}
for key,name in {'temple-wood':r'data\texture\기타마을내부\T_tile004.bmp','temple-mural':r'data\texture\기타마을내부\T_sa002.bmp','temple-carpet':r'data\texture\기타마을내부\T_inca001.bmp'}.items():
 tex=convert_texture(a.read(name),name);(out/(key+'.png')).write_bytes(tex.png)
 manifest['textures'][key]={'source':name,'width':tex.width,'height':tex.height}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
contact=Image.new('RGB',(900,math.ceil(len(previews)/3)*340),'#29343d');d=ImageDraw.Draw(contact)
for i,(name,im) in enumerate(previews):
 im.thumbnail((280,300));x=(i%3)*300;y=(i//3)*340
 contact.paste(im,(x+(300-im.width)//2,y+25),im);d.text((x+10,y+5),name,fill='white')
contact.save(Path(__file__).with_name('decor-sprites.jpg'))
