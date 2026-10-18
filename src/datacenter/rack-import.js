export function importRackIntoStudio(data,{app,bayfaceModel,bayface,specs,editor}){
 const known=new Set(app.getCatalog().map(m=>m.id)),incoming=bayfaceModel.validate(data,known);if(incoming.racks.length!==1)throw Error('ส่งออกครั้งละ 1 Rack');
 const project=app.getProject(),current=project.bayface||{title:incoming.title,racks:[],items:[]},id=app.uid('rack'),x=current.racks.length?Math.max(...current.racks.map((r,i)=>(r.x??i*500)+500)):0;
 const merged=bayfaceModel.validate({title:current.racks.length?current.title:incoming.title,racks:[...current.racks,{...incoming.racks[0],id,x}],items:[...current.items,...incoming.items.map(i=>({...i,id:app.uid('rackitem'),rackId:id}))]},known);
 app.transaction(p=>{p.bayface=merged;});const saved=editor?.saveLocal();specs?.show('bayface');bayface?.switchTab(true);bayface?.focusRack(id);if(saved===false)app.toast?.('สร้าง Bayface แล้ว แต่บันทึกในเครื่องไม่ได้ กรุณาดาวน์โหลด Project');return id;
}
