"""Author three original SIRIN buildings from the approved A/B/C concept boards.

Run in Blender: exec(compile(open(path,encoding='utf-8').read(),path,'exec')).
New scene only; preserves any existing scene. Batched by material per building.
Axes: Blender Z up, front -Y; exported GLB is Three.js Y up, front +Z.
"""
import bpy, math, json, random
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'assets-source/sirin-labs'
OUT=ROOT/'web/assets/sirin/labs'
OUT.mkdir(parents=True,exist_ok=True)
random.seed(419)
for previous in list(bpy.data.scenes):
    if previous.get('sirin_labs_authoring'):
        for obj in list(previous.objects):bpy.data.objects.remove(obj,do_unlink=True)
        bpy.data.scenes.remove(previous)
for mesh in list(bpy.data.meshes):
    if mesh.name.startswith(('A_Naga_Courtyard','B_Lotus_Nexus','C_Monsoon_Terraces')) and not mesh.users:bpy.data.meshes.remove(mesh)
for m in list(bpy.data.materials):
    if m.name.startswith('SIRIN_') and not m.users:bpy.data.materials.remove(m)
scene=bpy.data.scenes.new('SIRIN Original Labs')
scene['sirin_labs_authoring']=True
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
materials={}
def material(name,color,texture=None,emission=0):
    m=bpy.data.materials.new('SIRIN_'+name);m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=.82
    if texture:
        im=bpy.data.images.load(str(SOURCE/'textures'/texture),check_existing=False);im.pack()
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=im
        m.node_tree.links.new(node.outputs['Color'],p.inputs['Base Color'])
    if emission:
        p.inputs['Emission Color'].default_value=(*color,1)
        p.inputs['Emission Strength'].default_value=emission
    m.diffuse_color=(*color,1);materials[name]=m
    return m
for key in ['limestone','jade_tiles','indigo_tiles','clay_tiles','teak','bronze','plaster','pavers']:
    material(key,(1,1,1),key+'.png')
for key,c,e in [('shadow',(.035,.065,.071),0),('steel',(.12,.24,.26),0),('glass',(.10,.34,.37),.14),('warm',(.72,.42,.13),.25),('cyan',(.12,.77,.83),.8),('leaf',(.10,.19,.04),0),('leaf_light',(.23,.32,.07),0),('soil',(.12,.085,.045),0)]:material(key,c,texture=key+'.png',emission=e)
for c in 'ABC':material('sign_'+c,(1,1,1),'sign_'+c+'.png')

class Builder:
    def __init__(self,name,position):
        self.name=name;self.position=position;self.parts={};self.walls=[];self.lamps=[]
    def face(self,pts,mat,uv=None):
        v,f,u=self.parts.setdefault(mat,([],[],[]));n=len(v)
        v.extend(pts);f.append(tuple(range(n,n+len(pts))))
        if uv is None:
            normal=(Vector(pts[1])-Vector(pts[0])).cross(Vector(pts[2])-Vector(pts[0]))
            axis=max(range(3),key=lambda i:abs(normal[i]));axes=[i for i in range(3) if i!=axis]
            uv=[(p[axes[0]]/3,p[axes[1]]/3) for p in pts]
            if mat in ['glass','warm']:
                lows=[min(p[a] for p in pts) for a in axes];spans=[max(p[a] for p in pts)-lows[i] for i,a in enumerate(axes)]
                uv=[tuple((p[a]-lows[i])/max(.001,spans[i]) for i,a in enumerate(axes)) for p in pts]
        u.extend(uv)
    def box(self,c,size,mat,angle=0):
        x,y,z=c;w,d,h=[a/2 for a in size];cs,sn=math.cos(angle),math.sin(angle)
        pts=[(x+a*cs-b*sn,y+a*sn+b*cs,z+e) for a,b,e in [(-w,-d,-h),(w,-d,-h),(w,d,-h),(-w,d,-h),(-w,-d,h),(w,-d,h),(w,d,h),(-w,d,h)]]
        for inds in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]:self.face([pts[i] for i in inds],mat)
    def beam(self,a,b,r,mat,sides=6,r2=None):
        a,b=Vector(a),Vector(b);direction=(b-a).normalized();u=direction.cross(Vector((0,0,1)))
        if u.length<.01:u=direction.cross(Vector((0,1,0)))
        u.normalize();v=direction.cross(u);r2=r if r2 is None else r2
        rings=[[tuple(c+(u*math.cos(i*2*math.pi/sides)+v*math.sin(i*2*math.pi/sides))*rad) for i in range(sides)] for c,rad in [(a,r),(b,r2)]]
        for i in range(sides):self.face([rings[0][i],rings[0][(i+1)%sides],rings[1][(i+1)%sides],rings[1][i]],mat)
        self.face(list(reversed(rings[0])),mat);self.face(rings[1],mat)
    def line(self,points,r,mat):
        for a,b in zip(points,points[1:]):self.beam(a,b,r,mat)
    def diamond(self,x,y,z,s,angle=0):
        cs,sn=math.cos(angle),math.sin(angle)
        points=[(x+a*cs,y+a*sn,z+b) for a,b in [(0,s),(.55*s,0),(0,-s),(-.55*s,0),(0,s)]]
        self.line(points,.045,'bronze')
    def window(self,x,y,z,w,h,angle=0,warm=False):
        cs,sn=math.cos(angle),math.sin(angle)
        def box(dx,dy,dz,ww,dd,hh,mat):self.box((x+dx*cs-dy*sn,y+dx*sn+dy*cs,z+dz),(ww,dd,hh),mat,angle)
        box(0,0,0,w+.28,.18,h+.25,'shadow');box(0,-.12,0,w,.055,h,'warm' if warm else 'glass')
        for a in [-w/2,0,w/2]:box(a,-.19,0,.075,.13,h+.1,'bronze')
        for b in [-h/2,0,h/2]:box(0,-.19,b,w+.14,.15,.075,'bronze')
        box(0,-.25,-h/2-.12,w+.4,.45,.16,'limestone')
        box(0,-.3,h/2+.14,w+.45,.55,.17,'teak')
        # Recessed timber shutter panels and fine slats on each side.
        for side in [-1,1]:
            box(side*(w/2+.17),-.15,0,.23,.1,h,'teak')
            for i in range(6):box(side*(w/2+.17),-.23,-h*.4+i*h*.16,.23,.12,.045,'bronze')
    def block(self,x,y,w,d,h,floors=2,roofterrace=False):
        self.box((x,y,h/2+.12),(w,d,h),'plaster');self.walls.append([x-w/2,x+w/2,-y-d/2,-y+d/2])
        for z,t in [(.35,.5),(h,.28)]+[(h*i/floors,.22) for i in range(1,floors)]:
            self.box((x,y,z),(w+.28,d+.28,t),'limestone')
        for xx in [-w/2+.25,w/2-.25]:
            for yy in [-d/2+.25,d/2-.25]:
                self.box((x+xx,y+yy,h/2),(.56,.56,h),'limestone')
                self.box((x+xx,y+yy,h-.4),(.68,.68,.25),'bronze')
        for angle,length,cx,cy in [(0,w,x,y-d/2-.04),(math.pi,w,x,y+d/2+.04),(-math.pi/2,d,x-w/2-.04,y),(math.pi/2,d,x+w/2+.04,y)]:
            count=max(1,round(length/3.5))
            for i in range(count):
                offset=(i-(count-1)/2)*length/count
                for level in range(floors):
                    self.window(cx+offset*math.cos(angle),cy+offset*math.sin(angle),(level+.5)*h/floors+.15,min(2.0,length/count-.7),h/floors-1.1,angle,(i+level)%4==1)
        if roofterrace:
            self.box((x,y,h+.18),(w,d,.2),'pavers')
            for yy in [y-d/2,y+d/2]:self.railing(x-w/2,yy,x+w/2,yy,h+.3)
            for xx in [x-w/2,x+w/2]:self.railing(xx,y-d/2,xx,y+d/2,h+.3)
    def railing(self,x0,y0,x1,y1,z):
        dist=math.hypot(x1-x0,y1-y0);n=max(1,math.ceil(dist/1.5))
        for i in range(n+1):
            t=i/n;x=x0+(x1-x0)*t;y=y0+(y1-y0)*t
            self.beam((x,y,z),(x,y,z+1),.05,'bronze')
        for h in [.35,1]:self.beam((x0,y0,z+h),(x1,y1,z+h),.055,'bronze')
    def roof(self,x,y,z,w,d,rise,mat='jade_tiles',angle=0):
        cs,sn=math.cos(angle),math.sin(angle)
        def pt(a,b,c):return (x+a*cs-b*sn,y+a*sn+b*cs,z+c)
        # Curved roof slope: raised lip -> valley -> high ridge.
        profile=[(-w*.5,.55),(-w*.40,.12),(-w*.26,rise*.27),(-w*.12,rise*.68),(0,rise),(w*.12,rise*.68),(w*.26,rise*.27),(w*.40,.12),(w*.5,.55)]
        for (a,h),(b,k) in zip(profile,profile[1:]):
            self.face([pt(a,-d/2,h),pt(b,-d/2,k),pt(b,d/2,k),pt(a,d/2,h)],mat,[(a/3,0),(b/3,0),(b/3,d/3),(a/3,d/3)])
        # Timber gable is closed; gold edges read from distant cameras.
        for yy in [-d/2+.15,d/2-.15]:
            self.face([pt(a,yy,h-.12) for a,h in profile]+[pt(w/2,yy,-.18),pt(-w/2,yy,-.18)],'teak')
        ornament=min(1,w/6)
        for yy in [-d/2,d/2]:
            self.line([pt(a,yy,h) for a,h in profile],.13,'bronze')
            self.line([pt(a,yy,h-.35) for a,h in profile],.07,'bronze')
            for side in [-1,1]:
                self.line([pt(side*w*.43,yy,.2),pt(side*w*.51,yy,.85*ornament),pt(side*w*.54,yy,1.7*ornament),pt(side*w*.53,yy,2.3*ornament)],.11*ornament,'bronze')
            self.line([pt(0,yy,rise),pt(0,yy-.35*ornament*(1 if yy<0 else -1),rise+.7*ornament),pt(0,yy-.55*ornament*(1 if yy<0 else -1),rise+1.5*ornament)],.12*ornament,'bronze')
            if w>6:
                # Nested triangular fretwork and central lozenge in the gable.
                front=yy+(-.035 if yy<0 else .035)
                self.line([pt(-w*.27,front,.5),pt(0,front,rise*.8),pt(w*.27,front,.5)],.07,'bronze')
                self.line([pt(0,front,.65),pt(-w*.06,front,rise*.42),pt(0,front,rise*.68),pt(w*.06,front,rise*.42),pt(0,front,.65)],.06,'bronze')
                for side in [-1,1]:self.line([pt(side*w*.24,front,.35),pt(side*w*.11,front,rise*.35)],.045,'bronze')
        self.beam(pt(0,-d/2,rise),pt(0,d/2,rise),.17,'bronze')
        self.beam(pt(0,-d*.39,rise+.18),pt(0,d*.39,rise+.18),.045,'cyan')
        for a in [-w/2,w/2]:self.beam(pt(a,-d/2,.5),pt(a,d/2,.5),.11,'bronze')
    def hvac(self,x,y,z):
        self.box((x,y,z+.65),(1.7,1.3,1.3),'steel')
        self.box((x,y-.67,z+.65),(1.4,.08,1.0),'shadow')
        for h in range(6):self.box((x,y-.73,z+.25+h*.15),(1.4,.12,.035),'bronze')
        self.beam((x,y,z+1.31),(x,y,z+1.4),.47,'shadow',12)
        for a in [0,math.pi/2]:self.box((x,y,z+1.42),(.85,.08,.045),'steel',a)
        self.line([(x+.8,y,z+.6),(x+1.3,y,z+.6),(x+1.3,y,z+.05)],.095,'bronze')
    def planter(self,x,y,z,w=2):
        self.box((x,y,z+.3),(w,1,.6),'limestone');self.box((x,y,z+.62),(w-.15,.85,.05),'soil')
        for i in range(max(2,round(w*2))):
            xx=x+random.uniform(-w*.4,w*.4);yy=y+random.uniform(-.3,.3)
            radius=random.uniform(.28,.45);cz=z+.87
            for k in range(3):
                z0,z1=[-.5,0,.65,1][k:k+2];r0,r1=[.6,1,.7,.03][k:k+2]
                for j in range(6):
                    a,b=j*math.pi/3,(j+1)*math.pi/3
                    self.face([(xx+radius*r0*math.cos(a),yy+radius*r0*math.sin(a),cz+radius*z0),(xx+radius*r0*math.cos(b),yy+radius*r0*math.sin(b),cz+radius*z0),(xx+radius*r1*math.cos(b),yy+radius*r1*math.sin(b),cz+radius*z1),(xx+radius*r1*math.cos(a),yy+radius*r1*math.sin(a),cz+radius*z1)],'leaf' if (j+i)%3 else 'leaf_light')
    def entry(self,x,y,width=4,code='A'):
        self.window(x,y,1.7,width,3.2)
        for xx in [-width/2-.55,width/2+.55]:
            self.box((x+xx,y-.3,2),(.48,.6,4),'limestone');self.box((x+xx,y-.65,2.7),(.14,.05,.8),'cyan')
        self.box((x,y-.8,3.9),(width+2,1.8,.22),'bronze')
        self.box((x,y-1,.08),(width+2,2,.16),'limestone')
        self.face([(x-3.6,y-.91,4.15),(x+3.6,y-.91,4.15),(x+3.6,y-.91,5.95),(x-3.6,y-.91,5.95)],'sign_'+code,[(0,0),(1,0),(1,1),(0,1)])
    def lamp(self,x,y,style):
        self.box((x,y,.16),(.7,.7,.32),'limestone');self.beam((x,y,.25),(x,y,3.2),.09,'bronze')
        self.box((x,y,3),(.45,.45,.8),'warm')
        for a in [-.25,.25]:
            for b in [-.25,.25]:self.beam((x+a,y+b,2.55),(x+a,y+b,3.45),.035,'bronze')
        if style=='B':
            for i in range(4):
                a=i*math.pi/2;self.line([(x,y,2.6),(x+.55*math.cos(a),y+.55*math.sin(a),3.1),(x+.35*math.cos(a),y+.35*math.sin(a),3.7),(x,y,3.3)],.06,'bronze')
        else:self.roof(x,y,3.4,.9,.9,.35,'jade_tiles' if style=='A' else 'clay_tiles')
        self.lamps.append([x,3,-y])
    def bench(self,x,y):
        for a in [-.9,.9]:self.box((x+a,y,.3),(.3,.7,.6),'limestone')
        for b in [-.24,0,.24]:self.box((x,y+b,.62),(2.4,.2,.12),'teak')
        for h in [.95,1.2]:self.box((x,y+.3,h),(2.4,.12,.18),'teak')
        for a in [-1,1]:self.beam((x+a,y+.3,.5),(x+a,y+.3,1.35),.05,'bronze')
    def finish(self,parcel):
        root=bpy.data.objects.new(self.name,None);scene.collection.objects.link(root)
        root.location=(self.position[0],self.position[1],0)
        root['original_design']=True;root['concept']=self.name;root['source']='Original Blender geometry; Ragnarok Online surface textures'
        objects=[]
        for key,(verts,faces,uvs) in self.parts.items():
            me=bpy.data.meshes.new(self.name+'_'+key);me.from_pydata(verts,[],faces);me.update()
            uv=me.uv_layers.new(name='PaintedSurface')
            for poly in me.polygons:
                for li in poly.loop_indices:uv.data[li].uv=uvs[me.loops[li].vertex_index]
            o=bpy.data.objects.new(me.name,me);scene.collection.objects.link(o);o.data.materials.append(materials[key]);o.parent=root;objects.append(o)
        x,y=self.position
        return {'id':self.name,'position':[x,0,-y],'parcel':parcel,'colliders':[[a+x,b+x,c-y,d-y] for a,b,c,d in self.walls],'lamps':[[a+x,b,c-y] for a,b,c in self.lamps]}

def foundation(b,w,d):
    b.box((0,0,.035),(w,d,.07),'pavers')
    for x in [-w/2+.13,w/2-.13]:b.box((x,0,.08),(.25,d,.16),'limestone')
    for y in [-d/2+.13,d/2-.13]:b.box((0,y,.08),(w,.25,.16),'limestone')
    # Ground-level continuous entrance strip, not a raised collision platform.

records=[]
a=Builder('A_Naga_Courtyard',(-71,0));foundation(a,52,24)
a.block(0,4.1,39,8,8.2);a.roof(0,4.1,8.4,11,42,4.6,angle=math.pi/2)
for x in [-15,15]:
    a.block(x,-3.1,9,9,6.4);a.roof(x,-3.1,6.6,11,11,3.8)
    a.roof(x,-3.1,9.05,7.2,8.8,2.4)
    a.planter(x,-9.4,0,3.6)
    a.hvac(x,10,0)
a.block(0,1,9,10,9.2);a.roof(0,1,9.4,11,12,5.2)
a.entry(0,-4.05,4.3,'A')
for x in [-8,8]:
    for y in [-4,0]:a.box((x,y,2.8),(.35,.35,5.6),'teak')
    a.roof(x,-1,5.5,5,8,1.4)
for x in [-23,23]:a.lamp(x,-9,'A');a.bench(x,4);a.planter(x,8,0,3)
records.append(a.finish([-97,-45,-12,12]))

b=Builder('B_Lotus_Nexus',(73,51));foundation(b,32,30)
for x in [-10.7,10.7]:
    b.block(x,1,8.3,14,8,2,True)
    for y in [-2,4]:b.hvac(x,y,8.4)
    b.roof(x,-5.8,4.7,4,8.5,1.0,'indigo_tiles',math.pi/2)
    b.planter(x,-9,0,5)
# Octagonal central atrium, with eight independent glass and stone facets.
r=7.1;h=11
poly=[(r*math.cos(math.pi/8+i*math.pi/4),r*math.sin(math.pi/8+i*math.pi/4)) for i in range(8)]
b.walls.append([-r,r,-r,r])
for i in range(8):
    p,q=poly[i],poly[(i+1)%8]
    b.face([(p[0],p[1],.1),(q[0],q[1],.1),(q[0],q[1],h),(p[0],p[1],h)],'glass')
    b.box((p[0],p[1],h/2),(.48,.48,h),'limestone')
    for zz in [.4,5.1,10.9]:b.beam((*p,zz),(*q,zz),.15,'bronze')
    b.beam((*p,2.1),(*p,4.2),.07,'cyan')
    for t in [.33,.67]:b.beam((p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,.4),(p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,h),.06,'bronze')
b.face([(x,y,h) for x,y in poly],'indigo_tiles')
# Eight lotus petals: each has a raised pointed outer edge and a shallow bowl.
for i in range(8):
    angle=i*math.pi/4
    rows=[]
    for rad,z,width in [(2.1,13.9,.32),(4.5,12.4,.38),(7.2,11.4,.37),(9,12.5,.25),(9.7,14.8,.015)]:
        rows.append([(rad*math.cos(angle+side*width),rad*math.sin(angle+side*width),z+(0 if side==0 else .2)) for side in [-1,0,1]])
    for u,v in zip(rows,rows[1:]):
        for j in range(2):b.face([u[j],v[j],v[j+1],u[j+1]],'indigo_tiles',[(j,0),(j,1),(j+1,1),(j+1,0)])
    for side in [0,2]:b.line([row[side] for row in rows],.13,'bronze')
    b.line([row[1] for row in rows],.055,'bronze')
# Geometric lantern skylight, not a temple spire.
for i in range(8):
    t=i*math.pi/4;u=(i+1)*math.pi/4
    pts=[(3*math.cos(t),3*math.sin(t),13.3),(3*math.cos(u),3*math.sin(u),13.3),(1.4*math.cos(u),1.4*math.sin(u),16.4),(1.4*math.cos(t),1.4*math.sin(t),16.4)]
    b.face(pts,'cyan');b.beam(pts[0],pts[3],.1,'bronze')
b.beam((0,0,16.3),(0,0,17.1),1.5,'bronze',8,r2=.75)
b.entry(0,-6.65,4.5,'B')
for x in [-12.5,12.5]:b.lamp(x,-12.3,'B');b.bench(x,11.7);b.planter(x,8.8,0,3)
records.append(b.finish([57,89,-66,-36]))
records[-1]['atriumPolygon']=[[round(x+73,4),round(-y-51,4)] for x,y in poly]

c=Builder('C_Monsoon_Terraces',(71,0));foundation(c,52,24)
c.block(-14,1,12,13,9.2,2);c.block(13,2,14,12,11.4,3)
c.block(7,-5,22,5.5,4,1,True)
c.roof(-14,2,9.5,14,15,3.8,'clay_tiles')
c.roof(13,3,11.7,16,14,4.6,'clay_tiles')
c.roof(-.5,-5,4.6,7,11,2,'clay_tiles',math.pi/2)
# Raised glass bridge keeps the ground-level courtyard open.
c.box((-.5,3,6),(14,3,.35),'steel');c.box((-.5,3,8.9),(14,3.5,.25),'bronze')
for y in [1.5,4.5]:
    c.box((-.5,y,7.4),(14,.08,2.7),'glass')
    for x in [-7,-4,-1,2,5,6]:c.box((x,y,7.4),(.1,.16,2.8),'bronze')
    for x in [-6,-2,2]:c.beam((x,y,6),(x+3,y,8.8),.07,'bronze')
c.entry(7,-7.8,4.1,'C')
# Service units sit on the rear paved strip, clear of the sloping roofs.
for x,y,z in [(-14,9.5,0),(13,10,0),(-21,-2,0),(22,4,0)]:c.hvac(x,y,z)
for x in [-19,-12,2,9,16]:c.planter(x,-8.9,0,2.8)
for x in [8,12,16]:c.planter(x,-6.7,4.35,2.6)
for x in [-23,23]:c.lamp(x,-9,'C');c.bench(x,7)
# Horizontal tropical sun screens are genuine geometry, visible from the street.
for x,y,z,w in [(-14,-5.6,8.5,11),(13,-4.1,10.6,13)]:
    for k in range(4):c.box((x,y-.2,z-k*.28),(w,.6,.09),'teak')
records.append(c.finish([45,97,-12,12]))

for o in scene.objects:o.select_set(o.type=='MESH' or o.type=='EMPTY')
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.world=bpy.data.worlds.new('SIRIN Studio World');scene.world.use_nodes=True
next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs['Color'].default_value=(.65,.73,.8,1)
next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs['Strength'].default_value=.7
RAW=ROOT/'artifacts/sirin-labs/research-quarter-raw.glb'
RAW.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(RAW),export_format='GLB',use_selection=True,use_active_scene=True,export_extras=True,export_cameras=False,export_lights=False)
json.dump({'version':2,'buildings':records,'design':'Original A/B/C concept geometry with Ragnarok Online surface textures; Lotus Nexus replaces Datacenter; central energy tower preserved','replaces':['V01_Lab_009.002','A05_Weaponshop_078.002','A05_Weaponshop_079.002','Y02_Science_080.002','Y02_Science_081.002']},open(OUT/'layout.json','w'),indent=2)
# Save an editable source with textures packed and a camera for later inspection.
light_data=bpy.data.lights.new('Studio Sun','SUN');light=bpy.data.objects.new('Studio Sun',light_data);scene.collection.objects.link(light);light.rotation_euler=(.5,-.4,-.6);light_data.energy=2
cam_data=bpy.data.cameras.new('Review Camera');cam=bpy.data.objects.new('Review Camera',cam_data);scene.collection.objects.link(cam);scene.camera=cam
cam.location=(35,-55,33);target=Vector((0,1,6));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=49
scene.render.resolution_x=1440;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'sirin-original-research-quarter.blend'))
print('AUTHORED',len(records),'buildings;',sum(len(o.data.polygons) for o in scene.objects if o.type=='MESH'),'faces;',len([o for o in scene.objects if o.type=='MESH']),'material batches')
