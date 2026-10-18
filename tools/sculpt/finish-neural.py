import bpy,numpy as np,os,json,argparse
from mathutils import Vector
parser=argparse.ArgumentParser(description='Finish an existing neural Buddha mesh; this does not generate 3D from text.')
parser.add_argument('--master',required=True);parser.add_argument('--out',required=True);args=parser.parse_args()
out=os.path.abspath(args.out);os.makedirs(out,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.master))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:
 me=o.data;n=len(me.vertices);co=np.empty(n*3,dtype=np.float32);me.vertices.foreach_get('co',co);co=co.reshape(-1,3);norm=np.empty(n*3,dtype=np.float32);me.vertices.foreach_get('normal',norm);norm=norm.reshape(-1,3)
 edges=np.empty(len(me.edges)*2,dtype=np.int32);me.edges.foreach_get('vertices',edges);edges=edges.reshape(-1,2);summed=np.zeros_like(co);count=np.zeros(n,dtype=np.float32)
 for a,b in [(edges[:,0],edges[:,1]),(edges[:,1],edges[:,0])]:np.add.at(summed,a,co[b]);np.add.at(count,a,1)
 lap=summed/np.maximum(1,count[:,None])-co;curve=(lap*norm).sum(axis=1);cavity=np.clip(curve*85,0,1);edge=np.clip(-curve*65,0,1)
 grain=np.sin(co[:,0]*69+co[:,2]*17)*np.sin(co[:,1]*71-co[:,2]*23)
 shade=1-.26*cavity+.07*edge+.012*grain
 rgba=np.ones((n,4),dtype=np.float32);rgba[:,:3]=np.array([.235,.099,.036])*shade[:,None]
 old=me.color_attributes.get('Bronze finish')
 if old:me.color_attributes.remove(old)
 col=me.color_attributes.new(name='Bronze finish',type='FLOAT_COLOR',domain='POINT');col.data.foreach_set('color',rgba.ravel());me.color_attributes.active_color=col
 mat=bpy.data.materials.new('Warm aged bronze — cavity finish');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=.64;bs.inputs['Roughness'].default_value=.40;v=mat.node_tree.nodes.new('ShaderNodeVertexColor');v.layer_name=col.name;mat.node_tree.links.new(v.outputs['Color'],bs.inputs['Base Color']);me.materials.clear();me.materials.append(mat)
 o.name='Neural Buddha v109';o['revision']=109;o['construction']='Original concept → Hunyuan3D-2 neural mesh → Blender finishing; no v108 geometry';o['status']='AI-generated sculpture';o['provider']='Tencent Hunyuan3D-2';o['license']='Tencent Hunyuan3D 2.0 Community License; regional restrictions apply';o['finish']='Curvature-based subtle bronze cavity shading, single PBR material';o['front']='+Z glTF';
 for p in me.polygons:p.use_smooth=True
metrics={}
for kind,target in [('detail',620000),('walking',140000)]:
 bpy.ops.object.select_all(action='DESELECT')
 for o in meshes:
  bpy.context.view_layer.objects.active=o;o.select_set(True);n=sum(len(p.vertices)-2 for p in o.data.polygons)
  if n>target:
   d=o.modifiers.new(kind+' LOD','DECIMATE');d.ratio=target/n;d.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=d.name)
 bpy.ops.export_scene.gltf(filepath=out+'/buddha-'+kind+'.glb',export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
 if kind=='detail':bpy.ops.wm.save_as_mainfile(filepath=out+'/buddha-master.blend',compress=True)
 metrics[kind]={'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'bytes':os.path.getsize(out+'/buddha-'+kind+'.glb')}
json.dump({'revision':109,'construction':'Image-conditioned neural geometry; original generated concept','finish':'single-material cavity-finished bronze','LOD':metrics},open(out+'/build-metrics.json','w'),indent=2)
print('FINISHED',metrics,flush=True)
