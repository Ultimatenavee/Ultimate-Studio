"""Refined v107 sculpt. Old seed is used ONLY for closed anatomical hand
surfaces; head, hair, torso, arms, knees, robes, lotus and aureole are rebuilt.
Blender 4.5.3 LTS; photograph-referenced artistic interpretation, not a scan.
"""
import bpy,bmesh,math,json,argparse,os
from mathutils import Vector,Matrix
P=argparse.ArgumentParser();P.add_argument('--hands',required=True);P.add_argument('--out',required=True);P.add_argument('--preview',required=True);P.add_argument('--quick',action='store_true');P.add_argument('--draft-only',action='store_true');A=P.parse_args()
os.makedirs(A.out,exist_ok=True);os.makedirs(A.preview,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
G={};materials={}
def material(k,c,metal=.58,rough=.55):
 m=bpy.data.materials.new(k);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*c,1);b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough;materials[k]=m;return m
material('bronze',(.050,.043,.032),.68,.43);material('hair',(.025,.028,.024),.65,.48);material('crease',(.014,.016,.012),.42,.57);material('eye',(.046,.042,.033),.62,.44);material('gold',(.43,.275,.085),.77,.48);material('field',(.20,.122,.035),.7,.58)
def xyz(v):return (v[0],-v[2],v[1])
def mesh(name,pts,faces,kind='bronze',group=None,close=False):
 me=bpy.data.meshes.new(name);me.from_pydata([xyz(p) for p in pts],[],faces);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000004)
 if close:
  edges=[e for e in bm.edges if e.is_boundary]
  if edges:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(materials[kind]);G.setdefault(group or kind,[]).append(o);return o

def surface(name,fn,nu,nv,kind='bronze',group=None,close=False):
 pts=[fn(i/nu,j/nv) for j in range(nv+1) for i in range(nu+1)];faces=[]
 for j in range(nv):
  for i in range(nu):a=j*(nu+1)+i;faces.append((a,a+1,a+nu+2,a+nu+1))
 return mesh(name,pts,faces,kind,group,close)
def ga(v,c,w):return math.exp(-((v-c)/w)**2)
def sample(rows,t):
 f=max(0,min(1,t))*(len(rows)-1);i=min(len(rows)-2,int(f));u=f-i
 return [rows[i][k]*(1-u)+rows[i+1][k]*u for k in range(len(rows[0]))]
def at_y(rows,y):
 for i in range(len(rows)-1):
  if y<=rows[i+1][0]:
   a,b=rows[i],rows[i+1];dt=b[0]-a[0];t=max(0,min(1,(y-a[0])/dt));prev=rows[max(0,i-1)];nxt=rows[min(len(rows)-1,i+2)];out=[y]
   for k in range(1,len(a)):
    m0=(b[k]-prev[k])/(b[0]-prev[0]);m1=(nxt[k]-a[k])/(nxt[0]-a[0]);out.append((2*t**3-3*t*t+1)*a[k]+(t**3-2*t*t+t)*dt*m0+(-2*t**3+3*t*t)*b[k]+(t**3-t*t)*dt*m1)
   return out
 return rows[-1]
def loft(name,rows,deform=None,nu=96,nv=120,kind='bronze',group=None):
 def fn(u,v):
  y=rows[0][0]+(rows[-1][0]-rows[0][0])*v;_,rx,rz,zc=at_y(rows,y);a=u*math.tau;x=rx*math.sin(a);z=zc+rz*math.cos(a)
  return deform(x,y,z,a) if deform else [x,y,z]
 return surface(name,fn,nu,nv,kind,group,True)
def ell(name,center,radii,kind='bronze',group=None,segments=32,rings=20):
 x,y,z=center;rx,ry,rz=radii
 return surface(name,lambda u,v:(x+rx*math.sin(math.pi*v)*math.cos(u*math.tau),y+ry*math.cos(math.pi*v),z+rz*math.sin(math.pi*v)*math.sin(u*math.tau)),segments,rings,kind,group,True)
def tube(name,points,radii,kind='bronze',group=None,sides=12,steps=60):
 def curve(t):
  f=t*(len(points)-1);i=min(len(points)-2,int(f));u=f-i;p0=Vector(points[max(0,i-1)]);p1=Vector(points[i]);p2=Vector(points[i+1]);p3=Vector(points[min(len(points)-1,i+2)])
  return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)
 def fn(u,v):
  p=curve(v);t=(curve(min(1,v+.001))-curve(max(0,v-.001))).normalized();n=Vector((0,0,1));n=(n-t*n.dot(t)).normalized();b=t.cross(n).normalized();r=sample([[r] if isinstance(r,(float,int)) else r for r in radii],v);cap=math.sin(math.pi/2*min(1,min(v,1-v)/.025));return p+n*(math.cos(u*math.tau)*r[0]*cap)+b*(math.sin(u*math.tau)*(r[-1])*cap)
 return surface(name,fn,sides,steps,kind,group,True)
def line(name,points,r=.006,kind='bronze',group=None):return tube(name,points,[r,r],kind,group,8,max(20,len(points)*2))
# Rebuilt broad face: a closed surface with integrated eyelids, nose wings,
# philtrum, full lips and a broad chin. No legacy head vertices are imported.
F=[[3.62,.035,.085,.018],[3.69,.18,.20,.022],[3.80,.335,.29,.015],[3.98,.456,.342,0],[4.20,.529,.354,-.008],[4.43,.530,.338,-.015],[4.64,.512,.316,-.022],[4.84,.453,.290,-.03],[5.02,.29,.21,-.035],[5.12,.025,.055,-.035]]
def eye_line(x):
 u=max(0,min(1,(abs(x)-.105)/.30));return 4.455+.017*math.sin(math.pi*u)+.008*u
def face_delta(x,y):
 e=abs(x);ey=eye_line(x);brow=4.575+.042*max(0,1-((e-.245)/.195)**2)
 # Broad anatomical planes, then modest local sculpting. No detached eyeball plates.
 d=.032*ga(e,.32,.145)*ga(y,4.23,.17)+.033*ga(x,0,.23)*ga(y,3.81,.10)
 d-=.026*ga(e,.253,.165)*ga(y,4.46,.080)
 almond=math.exp(-((e-.255)/.158)**6)
 d+=almond*(.012*ga(y,ey+.017,.022)+.008*ga(y,ey-.020,.020)-.006*ga(y,ey-.002,.007))
 d+=.011*ga(e,.245,.19)*ga(y,brow,.038)
 # Tapered bridge blends into glabella and has a small columella, alae and nostrils.
 d+=.070*ga(x,0,.058)*ga(y,4.365,.165)+.089*ga(x,0,.083)*ga(y,4.247,.064)
 d+=.038*ga(e,.078,.040)*ga(y,4.216,.035)+.009*ga(x,0,.030)*ga(y,4.187,.029)
 d-=.021*ga(e,.071,.021)*ga(y,4.192,.009)
 d+=.003*ga(e,.028,.021)*ga(y,4.115,.038)
 # Closed, faintly upturned mouth with separate vermilion, chin and lower-lip break.
 smile=4.031+.019*(min(e,.19)/.19)**2
 d+=.022*ga(x,0,.155)*ga(y,smile+.017+.004*ga(e,.047,.022),.024)
 d+=.033*ga(x,0,.148)*ga(y,smile-.021,.023)
 d-=.011*ga(x,0,.174)*ga(y,smile,.007)+.009*ga(x,0,.127)*ga(y,3.964,.015)
 d-=.005*ga(e,.17,.025)*ga(y,4.052,.022)
 return d
def front_z(x,y):
 _,rx,rz,zc=at_y(F,y);c=math.sqrt(max(.00001,1-(x/rx)**2));return zc+rz*c+c**3*face_delta(x,y)
def face_shape(x,y,z,a):return [x,y,z+max(0,math.cos(a))**3*face_delta(x,y)]
loft('New head | jaw-cheek-eyelid-nose-lips',F,face_shape,256,250,group='head')
loft('Neck | softened continuous three lines',[[3.34,.30,.245,-.025],[3.46,.285,.25,-.015],[3.58,.265,.24,0],[3.72,.238,.22,.015]],lambda x,y,z,a:[x,y,z-(.0035*sum(ga(y,h,.010) for h in [3.46,3.52,3.58]))*max(0,math.cos(a))],64,64,group='head')
for s in [-1,1]:
 # The ear is a single sculpted surface; helix rim is part of it rather than wire loops.
 ell('Ear attachment',[s*.518,4.30,-.018],[.078,.235,.10],group='head')
 ER=[[3.77,.007,.013,.581],[3.80,.035,.047,.587],[3.89,.044,.055,.600],[4.10,.050,.051,.614],[4.32,.058,.057,.623],[4.49,.062,.056,.599],[4.57,.027,.031,.566],[4.59,.002,.008,.552]]
 def ear(u,v):
  y=3.77+.82*v;_,rx,rz,xc=at_y(ER,y);a=u*math.tau;x=s*(xc+rx*math.sin(a));c=max(0,math.cos(a));q=math.sin(a)
  # Concha cavity, thick helix, antihelix and pendant lobe, all fused.
  z=.016+rz*math.cos(a)+c*(.010*ga(abs(q),.78,.17)-.027*ga(q,0,.48)*ga(y,4.27,.20)+.014*ga(q,-.25,.15)*ga(y,4.25,.21))
  return [x,y,z]
 surface('Attached sculpted ear',ear,64,100,group='head',close=True)
 # A curved dark aperture under the upper lid, inset inside sculpted eyelid folds.
 def eye(u,v):
  x=s*(.112+.286*u);mid=eye_line(x)-.002;h=.011*math.sin(math.pi*u);y=mid-h+h*v
  return [x,y,front_z(x,y)+.001]
 surface('Recessed half-closed eye',eye,52,8,'eye')
# A shallow urna inset; no ornamental finial.
ell('Urna', [0,4.743,front_z(0,4.743)+.004],[.017,.020,.007],'eye',segments=24,rings=12)
# Continuous robe torso: fuller shoulders, no muscular deltoid balls or bare-chest panel.
T=[[1.03,.38,.32,-.04],[1.22,.84,.48,-.04],[1.58,.97,.53,-.04],[1.96,1.01,.54,-.045],[2.35,1.045,.525,-.045],[2.73,1.07,.50,-.045],[3.03,1.075,.45,-.04],[3.20,1.03,.38,-.035],[3.32,.85,.31,-.03],[3.40,.57,.26,-.02],[3.45,.30,.23,-.02]]
def cloth(x,y,z,a):
 c=max(0,math.cos(a));e=abs(x);folds=0
 # A robe crossing the chest: asymmetric tension paths, broadened and faded at ends.
 for h,curve,amp,width in [(1.30,.38,.018,.048),(1.48,.53,.022,.052),(1.72,.61,.024,.060),(2.02,.58,.020,.065),(2.34,.46,.014,.062)]:
  path=h+curve*x*x+.065*x;fade=math.exp(-(e/1.08)**8)
  folds+=fade*(amp*ga(y,path+.035,width)-amp*.65*ga(y,path,.023))
 # Natural, sparse vertical compression at the lower side of the robe.
 folds+=.008*ga(e,.87,.16)*ga(y,1.5,.44)*math.sin(y*17+x*9)
 hem=2.94+.27*x+.045*(1-x*x)
 folds+=.010*ga(y,hem+.012,.022)-.005*ga(y,hem-.012,.018)
 return [x,y,z+c*c*folds]
loft('New body | continuous draped robe',T,cloth,200,220,group='body')
# Shoulder roots overlap the chest by a broad area so there are no circular sleeve caps.
tube('Raised shoulder and sleeve',[[-.66,3.10,-.04],[-.99,2.99,-.01],[-1.23,2.78,.03],[-1.40,2.46,.12],[-1.45,2.22,.25]],[[.19,.23],[.29,.27],[.29,.25],[.26,.24],[.22,.21]],group='body',sides=52,steps=100)
tube('Raised forearm',[[-1.45,2.22,.25],[-1.56,2.34,.48],[-1.57,2.63,.70],[-1.50,2.93,.86]],[[.22,.21],[.225,.20],[.18,.16],[.125,.11]],group='body',sides=52,steps=90)
tube('Lowered shoulder and sleeve',[[.66,3.10,-.04],[1.00,2.99,-.01],[1.25,2.78,.06],[1.40,2.48,.18],[1.39,2.15,.42],[1.30,1.83,.72]],[[.19,.23],[.29,.27],[.29,.25],[.25,.22],[.19,.17],[.125,.11]],group='body',sides=52,steps=120)
# Broad folded legs with variable folds sculpted into the cover, not laid-on ropes.
def knee(s):
 def fn(u,v):
  theta=u*math.tau;phi=v*math.pi;x=s*.88+1.07*math.sin(phi)*math.cos(theta);y=1.16+.32*math.cos(phi);z=.035+.70*math.sin(phi)*math.sin(theta)
  front=max(0,math.sin(theta))*math.sin(phi);fold=0
  for k in range(5):
   path=1.15+.058*k+.07*(abs(x)-1.25)**2
   fold+=.010*ga(y,path,.013)*ga(abs(x),1.25,.56)
  return [x,y,z+front*fold]
 return surface('Covered knee sculpt',fn,100,56,group='body',close=True)
knee(-1);knee(1)
tube('Lower crossed shin',[[-1.61,1.13,.31],[-1.0,1.30,.61],[-.25,1.39,.67],[.48,1.47,.43],[1.01,1.38,.16]],[[.16,.19],[.18,.17],[.17,.15],[.14,.13],[.065,.10]],group='body',sides=52,steps=130)
tube('Upper crossed shin',[[1.61,1.13,.32],[1.02,1.29,.63],[.30,1.44,.64],[-.42,1.49,.42],[-1.0,1.32,.12]],[[.16,.19],[.18,.17],[.17,.15],[.14,.13],[.06,.10]],group='body',sides=52,steps=130)
# Reuse only the existing connected hand surface, scaled at the wrist; geometry
# here is explicitly distinct from the newly authored head/body/lotus surfaces.
rows=json.load(open(A.hands))
for row in rows:
 if not row.get('hand'):continue
 h=row['hand'];pose=h['handPose'];left=pose=='cupped';g=h['localPosition'];pts=[];wristlocal=[0,-.21,0]
 # Recover the canonical wrist from the original transform and anchored wrist.
 mat=h['matrix'];wi=h['wrist'];R=Matrix([[mat[0],mat[4],mat[8]],[mat[1],mat[5],mat[9]],[mat[2],mat[6],mat[10]]]);origin=Vector((mat[12],mat[13],mat[14]));wristlocal=R.inverted()@(Vector(wi)-origin)
 wrist=Vector((1.30,1.83,.72) if left else (-1.50,2.93,.86));scale=1.18
 for j in range(0,len(g),3):
  p=Vector(g[j:j+3]);front=max(0,min(1,(p.z-.005)/.035));life=.075+.042*math.sin((p.y+.12)*8);cut=.006*ga(p.x,life,.009)*ga(p.y,0,.13)+.0045*ga(p.y,.06+.15*p.x,.007)*ga(p.x,-.025,.13);p.z-=front*cut;p=wrist+R@((p-wristlocal)*scale);pts.append(p)
 faces=[row['index'][j:j+3] for j in range(0,len(row['index']),3)];o=mesh('New scale hand-'+pose,pts,faces,group='hand-'+pose,close=True);o['pose']=pose;o['palm_normal']=h['palmNormal'];o['finger_direction']=h['fingersDirection'];o['wrist']=list(wrist)
# Curls: staggered surface distribution and spiral grooves instead of rows of beads.
surface('New hemispherical scalp',lambda u,v:[.507*math.cos(v*math.pi/2)*math.sin(u*math.tau),4.80+.59*math.sin(v*math.pi/2),-.04+.385*math.cos(v*math.pi/2)*math.cos(u*math.tau)],64,32,'hair',close=True)
rings=[]
for j in range(14):
 phi=.035+j*1.49/13;rings.append([phi,math.cos(phi),0])
weight=sum(r[1] for r in rings);assigned=0
for j,row in enumerate(rings):row[2]=483-assigned if j==len(rings)-1 else round(483*row[1]/weight);assigned+=row[2]
for j,(phi,weight,count) in enumerate(rings):
 for i in range(count):
  a=(i+.5*(j%2))*math.tau/count;r=math.cos(phi);p=Vector((.525*r*math.sin(a),4.80+.59*math.sin(phi),-.04+.397*r*math.cos(a)));n=Vector((p.x/.525**2,(p.y-4.80)/.59**2,(p.z+.04)/.397**2)).normalized();axis=n.to_track_quat('Z','Y').to_matrix()
  def curl(u,v):
   a=u*math.tau;phi=v*math.pi;rad=.031*math.sin(phi);height=.024*math.cos(phi);groove=.0038*ga(math.sin(a+rad/.031*10),0,.24)*max(0,math.cos(phi));q=axis@Vector((rad*math.cos(a),rad*math.sin(a),height-groove));return p+q
  surface('Spiral curl',curl,16,10,'hair',close=True)
# New pointed cupped lotus leaves and etched veins, not inflated overlapping beads.
loft('Pedestal plinth',[[0,1.76,1.27,0],[.08,1.98,1.43,0],[.15,1.98,1.43,0],[.21,1.79,1.30,0],[.27,1.81,1.31,0]],nu=96,nv=24)
loft('Lotus bowl',[[.22,1.52,1.14,0],[.38,1.66,1.23,0],[.61,1.90,1.38,0],[.83,1.88,1.36,0],[.96,1.72,1.25,0]],nu=96,nv=32)
for row in range(2):
 for i in range(24):
  a=(i+row*.5)*math.tau/24;s,c=math.sin(a),math.cos(a)
  def leaf(u,v):
   q=u*2-1;w=.30*max(.00001,math.sin(math.pi*v))**.8;radius=1.64+.29*math.sin(math.pi*v)+.05*v;yy=.25+row*.25+.44*v+.11*(1-q*q)*math.sin(math.pi*v);xx=q*w;zz=radius+.06*(1-q*q)*math.sin(math.pi*v);return [xx*c+zz*s,yy,zz*c-xx*s]
  surface('Pointed bronze lotus leaf',leaf,16,20,close=False)
  pts=[]
  for j in range(25):
   v=j/24;r=1.64+.29*math.sin(math.pi*v)+.05*v+.064*math.sin(math.pi*v);pts.append([r*s,.255+row*.25+.44*v+.11*math.sin(math.pi*v),r*c])
  line('Lotus etched midrib',pts,.004)
# Flat gilt backing and relief bands: a clean plane replaces the old radial fan
# shading. Decorative ornament is interpreted, not claimed as a surveyed copy.
zback=-.88;rx,ry,cy=2.04,2.63,3.00
mesh('New aureole flat field',[[0,cy,zback]]+[[rx*math.sin(i*math.tau/192),cy+ry*math.cos(i*math.tau/192),zback] for i in range(192)],[(0,1+(i+1)%192,1+i) for i in range(192)],'field')
for inset in [0,.07,.28]:line('Aureole border',[[math.sin(i*math.tau/192)*(rx-inset),cy+math.cos(i*math.tau/192)*(ry-inset),zback+.02] for i in range(193)],.017,'gold')
for s in [-1,1]:
 for i in range(9):
  a=s*(.21+i*.31);x=math.sin(a)*1.64;y=cy+math.cos(a)*2.22
  ell('Relief seated robe',[x,y,zback+.045],[.10,.15,.035],'gold',segments=16,rings=12);ell('Relief head',[x,y+.20,zback+.05],[.06,.073,.035],'gold',segments=16,rings=12);ell('Relief crossed knees',[x,y-.12,zback+.06],[.17,.055,.043],'gold',segments=20,rings=10)
  line('Relief mandorla',[[x-.14,y-.11,zback+.01],[x-.15,y+.12,zback+.01],[x,y+.31,zback+.01],[x+.15,y+.12,zback+.01],[x+.14,y-.11,zback+.01]],.009,'gold')
  b=a+.14;r=.12;xx=math.sin(b)*1.35;yy=cy+math.cos(b)*2.08;line('Gilt scroll',[[xx+math.cos(t/28*math.pi*4)*r*(1-t/35),yy+math.sin(t/28*math.pi*4)*r*(1-t/35),zback+.016] for t in range(29)],.007,'gold')
for i in range(42):
 a=i*math.tau/42;x=rx*math.sin(a);y=cy+ry*math.cos(a)
 for side in [-1,1]:
  pts=[]
  for j in range(14):
   t=j/13;out=.22*t;lat=side*.07*math.sin(math.pi*t)*(1-.3*t);pts.append([x+math.sin(a)*out+math.cos(a)*lat,y+math.cos(a)*out-math.sin(a)*lat,zback+.03])
  line('Gilt flame',pts,.008,'gold')
 for off in [-.018,.018]:line('Aureole rays',[[x+off,y,zback],[x+math.sin(a)*.30+off,y+math.cos(a)*.30,zback]],.008,'gold')
# Fuse only the new solid head/body volumes. Keep the closed hands unchanged.
def mod(o,kind,**kw):
 bpy.context.view_layer.objects.active=o;m=o.modifiers.new(kind,kind)
 for k,v in kw.items():setattr(m,k,v)
 bpy.ops.object.modifier_apply(modifier=m.name)
def join(parts,name):
 if len(parts)==1:o=parts[0]
 else:
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  o=parts[0];bpy.context.view_layer.objects.active=o;bpy.ops.object.join()
 o.name=name;return o
objects=[]
for key,parts in G.items():
 o=join(parts,'New Vairocana / '+key)
 if key=='field' and o.data.polygons[0].normal.y>0:
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update()
 if key in ['head','body']:
  mod(o,'REMESH',mode='VOXEL',voxel_size=.0035 if key=='head' else .009,use_smooth_shade=True);mod(o,'SMOOTH',factor=.20 if key=='head' else .42,iterations=2 if key=='head' else 8);mod(o,'DECIMATE',ratio=.19 if key=='head' else .20,use_collapse_triangulate=True)
 if key.startswith('hand'):mod(o,'SUBSURF',levels=1,render_levels=1)
 if key in ['head','body','hair','bronze','gold']:mod(o,'DECIMATE',ratio=.7 if key in ['head','body','hair'] else .58,use_collapse_triangulate=True)
 for f in o.data.polygons:f.use_smooth=True
 # New vertex patina; both comparison renders will use the same clay override.
 base=tuple(o.data.materials[0].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value[:3]);attr=o.data.color_attributes.new(name='Patina',type='FLOAT_COLOR',domain='POINT')
 for v in o.data.vertices:
  x,z,y=v.co;n=.96+.025*math.sin(x*17+y*12)*math.sin(z*19-y*3)+.015*math.sin(x*3.7+y*5.2+z*9);attr.data[v.index].color=(*(c*n for c in ((.041,.039,.031) if key=='eye' and y<4.6 else base)),1)
 m=o.data.materials[0];nt=m.node_tree
 if not nt.nodes.get('Patina'):
  node=nt.nodes.new('ShaderNodeVertexColor');node.name='Patina';node.layer_name='Patina';nt.links.new(node.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])
 uv=o.data.uv_layers.new(name='Surface')
 for li,l in enumerate(o.data.loops):p=o.data.vertices[l.vertex_index].co;uv.data[li].uv=(math.atan2(p.x,-p.y)/math.tau,p.z/6)
 objects.append(o);print(key,len(o.data.polygons),flush=True)
# Subtle seamless casting grain, shared by all metal materials and embedded in GLB.
import numpy as np
N=512;vv,uu=np.mgrid[0:1:N*1j,0:1:N*1j];du=np.zeros((N,N));dv=np.zeros((N,N));rng=np.random.default_rng(107)
for freq in [7,13,23,41,73,113]:
 for k in range(5):
  fx=int(rng.integers(1,freq));fy=int(rng.integers(1,freq));phase=rng.random()*math.tau;angle=math.tau*(fx*uu+fy*vv)+phase;amp=.018/(freq*math.sqrt(30))
  du+=amp*fx*np.cos(angle);dv+=amp*fy*np.cos(angle)
norm=np.stack((-du,-dv,np.ones_like(du)),axis=-1);norm/=np.linalg.norm(norm,axis=-1,keepdims=True);pixels=np.ones((N,N,4),dtype=np.float32);pixels[:,:,:3]=norm*.5+.5
im=bpy.data.images.new('Cast bronze | original procedural microfinish',width=N,height=N,alpha=False);im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(pixels.ravel());im.filepath_raw=os.path.abspath(os.path.join(A.out,'cast-normal.png'));im.file_format='PNG';im.save();im.pack()
for name in ['bronze','hair','gold','field']:
 nt=materials[name].node_tree;tex=nt.nodes.new('ShaderNodeTexImage');tex.image=im;normal=nt.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.24;nt.links.new(tex.outputs['Color'],normal.inputs['Color']);nt.links.new(normal.outputs['Normal'],nt.nodes.get('Principled BSDF').inputs['Normal'])
root=bpy.data.objects.new('refined-vairocana-v107',None);bpy.context.collection.objects.link(root);root['revision']='107';root['construction']='v107 re-sculpt: tapered oval jaw, inset lids, slender bridge, softly upturned closed lips; integrated ears, neck, shoulder/sleeve roots, asymmetric garment tension paths and folded knees; reference-informed artistic sculpture, not a replica or scan';root['curlCount']=483
for o in objects:o.parent=root
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24 if A.quick else 64;scene.cycles.use_denoising=True;scene.world.color=(.16,.16,.16);scene.view_settings.view_transform='AgX'
def light(name,loc,power,size):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,2.8))-o.location).to_track_quat('-Z','Y').to_euler()
light('Key',(-4,-6,8),1500,5);light('Fill',(5,-3,5),900,4);light('Rim',(1,3,7),1300,3)
d=bpy.data.cameras.new('Review');cam=bpy.data.objects.new('Review',d);bpy.context.collection.objects.link(cam);scene.camera=cam;d.type='ORTHO';scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(A.out,'buddha-master.blend')),compress=True)
def export(name):
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.abspath(os.path.join(A.out,name)),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_yup=True)
export('buddha-detail.glb')
if A.draft_only:raise SystemExit(0)
for name,loc,target,scale in [('front',(0,-13,3.2),(0,0,2.85),6.6),('three-quarter',(7,-12,5.5),(0,0,2.85),6.6),('face',(0,-9,4.6),(0,0,4.40),2.05),('hands',(-4,-7,3.5),(-.5,-.55,2.7),4.1),('profile',(11,-.1,4.1),(0,0,3.0),6.6)]:
 if A.quick and name not in ['front','face']:continue
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();d.ortho_scale=scale;scene.render.filepath=os.path.join(A.preview,name+'.png');bpy.ops.render.render(write_still=True)
# Gray clay frame makes actual geometry review independent of the bronze color.
clay=bpy.data.materials.new('Neutral clay review');clay.diffuse_color=(.45,.45,.45,1);clay.use_nodes=True;bs=clay.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.35,.35,.35,1);bs.inputs['Roughness'].default_value=.75
scene.view_layers[0].material_override=clay;cam.location=(0,-13,3.2);cam.rotation_euler=(Vector((0,0,2.85))-cam.location).to_track_quat('-Z','Y').to_euler();d.ortho_scale=6.6;scene.render.filepath=os.path.join(A.preview,'clay-front.png');bpy.ops.render.render(write_still=True);scene.view_layers[0].material_override=None
for o in objects:
 if len(o.data.polygons)>300:mod(o,'DECIMATE',ratio=.32,use_collapse_triangulate=True)
export('buddha-walking.glb')
json.dump({'blender':bpy.app.version_string,'revision':107,'construction':root['construction'],'detail':os.path.getsize(os.path.join(A.out,'buddha-detail.glb')),'walking':os.path.getsize(os.path.join(A.out,'buddha-walking.glb')),'walkingFaces':sum(len(o.data.polygons) for o in objects)},open(os.path.join(A.out,'build-metrics.json'),'w'),indent=2)
print('FINISHED INDEPENDENT SCULPT',flush=True)
