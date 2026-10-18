"""Export the original male Novice body/head ACT idle and walking directions."""
import sys,json,math,argparse
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ragx',required=True,help='Path to the ragx source checkout')
parser.add_argument('--client',default=r'C:\Program Files\RagnarokOnline')
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[2]/'web/assets/ayothaya/avatar')
args=parser.parse_args()
sys.path.insert(0,str(Path(args.ragx).resolve()))
from ragx.client import open_stack
from ragx.formats import spr,act
from ragx.commands.sprites_cmd import decode_spr_frames
a=open_stack(args.client)
sources=[r'data\sprite\인간족\몸통\남\초보자_남',r'data\sprite\인간족\머리통\남\1_남']
parts=[]
for name in sources:
 s=spr.parse(a.read(name+'.spr'));parts.append((s,decode_spr_frames(s),act.parse(a.read(name+'.act'))))
frames=[];boxes=[];actions=[]
for ai in range(24):
 body=parts[0][2].actions[ai];head=parts[1][2].actions[ai]
 actions.append({'start':len(frames),'count':len(body.frames),'frameMs':body.delay*25})
 for fi,bf in enumerate(body.frames):
  hf=head.frames[(0 if not 8<=ai<16 else fi)%len(head.frames)];layers=[]
  for pi,f in enumerate([bf,hf]):
   s,pixels,_=parts[pi];ox=oy=0
   if pi and bf.attach_points and hf.attach_points:
    ox=bf.attach_points[0].x-hf.attach_points[0].x;oy=bf.attach_points[0].y-hf.attach_points[0].y
   for l in f.layers:
    if l.sprite_index<0:continue
    index=l.sprite_index+(len(s.indexed_frames) if l.sprite_type else 0)
    im=Image.fromarray((pixels[index].astype(np.float32)*np.array(l.color)/255).clip(0,255).astype(np.uint8))
    if l.mirror:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    im=im.resize((max(1,round(im.width*abs(l.scale_x))),max(1,round(im.height*abs(l.scale_y)))),Image.Resampling.NEAREST)
    if l.angle:im=im.rotate(-l.angle,expand=True)
    x=round(l.x+ox-im.width/2);y=round(l.y+oy-im.height/2);layers.append((im,x,y));boxes.append((x,y,x+im.width,y+im.height))
  frames.append(layers)
minx=min(x[0] for x in boxes)-2;miny=min(x[1] for x in boxes)-2;w=max(x[2] for x in boxes)-minx+2;h=max(x[3] for x in boxes)-miny+2
cols=8;rows=math.ceil(len(frames)/cols);sheet=Image.new('RGBA',(w*cols,h*rows));preview=Image.new('RGB',(8*w,3*h+60),'#34424b');draw=ImageDraw.Draw(preview)
for i,layers in enumerate(frames):
 f=Image.new('RGBA',(w,h))
 for im,x,y in layers:f.alpha_composite(im,(x-minx,y-miny))
 # Normalize each pose to a shared ground contact, without changing body/head alignment.
 bounds=f.getbbox()
 if bounds:
  aligned=Image.new('RGBA',(w,h));aligned.alpha_composite(f,(0,h-2-bounds[3]));f=aligned
 sheet.alpha_composite(f,((i%cols)*w,(i//cols)*h))
 for ai,action in enumerate(actions):
  if i==action['start']:
   px=ai%8*w;py=ai//8*(h+20);preview.paste(f,(px,py+20),f);draw.text((px,py),str(ai),fill='white')
out=args.output;out.mkdir(parents=True,exist_ok=True)
sheet.save(out/'novice.png');(out/'novice.json').write_text(json.dumps({'version':4,'sources':sources,'columns':cols,'rows':rows,'width':w,'height':h,'actions':actions,'frames':len(frames),'origin':[-minx,-miny]},ensure_ascii=False,indent=2),encoding='utf-8')
preview.resize((8*w*2,(3*h+60)*2)).save(out/'preview.png')
print(w,h,len(frames),actions)
