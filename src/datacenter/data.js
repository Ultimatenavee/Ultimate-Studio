import devices from './devices.json';
export {devices};
const networkRacks=[
 {id:'R01',name:'Core / PE',x:-1.15,z:-1.3,rotation:0,items:[{name:'Fiber distribution',kind:'odf',u:40,size:2},{model:'huawei-ne8000-m8',name:'PE-01',u:28,size:3},{model:'huawei-ne8000-m8',name:'PE-02',u:22,size:3}],note:'PE Chassis ตัวอย่าง M8 ใช้ 3U ตาม Library ภาพอ้างอิงรุ่น DC จาก Huawei; ด้านหลังจริงเป็นแผ่นปิด ส่วน Interface หันออกหน้าตู้'},
 {id:'R02',name:'Internet Edge',x:0,z:-1.3,rotation:0,items:[{name:'Fiber distribution',kind:'odf',u:40,size:2},{model:'cisco-asr-1001-x',name:'EDGE-01',u:32,size:1},{model:'cisco-asr-1001-x',name:'EDGE-02',u:28,size:1}],note:'ASR 1001-X: 1U, 6×1GE SFP และ 2×10GE SFP+; ภาพจำลอง เลือกคู่ AC PSU ต่อ A/B ไม่ผสม AC กับ DC'},
 {id:'R03',name:'Aggregation',x:1.15,z:-1.3,rotation:0,items:[{name:'Fiber distribution',kind:'odf',u:40,size:2},{model:'huawei-s6730-h24x6c',name:'AGG-01',u:32,size:1},{model:'huawei-s6730-h24x6c',name:'AGG-02',u:28,size:1}],note:'S6730-H24X6C ใช้ภาพด้านหน้า/หลังจาก Library; พอร์ต 24×10GE SFP+ และ 6×40/100GE QSFP28 ตามรุ่น ไม่ได้เปิดใช้งานทุกพอร์ตใน ภาพจำลอง'},
 {id:'R04',name:'Optical / ODF',x:-1.15,z:1.3,rotation:Math.PI,items:[{name:'LC patch / ODF 01',kind:'odf',u:38,size:2},{name:'Fiber cable manager',kind:'manager',u:35,size:2},{name:'LC patch / ODF 02',kind:'odf',u:30,size:2},{name:'Fiber cable manager',kind:'manager',u:27,size:2}],note:'Generic ODF พร้อม LC adapters, ช่องจัดสาย และวงโค้ง Fiber เพื่อสื่อเส้นทาง ไม่มีการอ้างว่า bend radius หรือจำนวน core ผ่านการออกแบบหน้างาน'},
 {id:'R05',name:'Services / Access',x:0,z:1.3,rotation:Math.PI,items:[{name:'Copper patch panel',kind:'copper',u:40,size:1},{model:'huawei-s6730-h24x6c',name:'ACCESS-01',u:34,size:1},{model:'cisco-asr-1001-x',name:'SERVICE-01',u:29,size:1}],note:'ตัวอย่าง Service aggregation; สายทองแดงใช้กับแผง Management แยกจาก Fiber uplink ไม่มีการสมมุติว่าทุกช่อง SFP รับ UTP ได้'},
 {id:'R06',name:'Telecom DC',x:1.15,z:1.3,rotation:Math.PI,items:[{name:'−48V DC distribution',kind:'distribution',u:38,size:2},{name:'Rectifier shelf · illustrative',kind:'rectifier',u:31,size:3},{name:'Battery shelf · illustrative',kind:'battery',u:4,size:5}],note:'Generic telecom DC: AC input → Rectifier → −48V DC distribution พร้อม Battery bus แยกจากเส้นทาง AC UPS/PDU ไม่ได้อ้างเป็น SKU ของ Vertiv'}
];
export const room={width:18,depth:20,height:4.2,eyeHeight:1.65,spawn:{x:-5.2,z:8.2},coldAisles:[-4.2,4.2],doorWidth:.375,doorAngle:Math.PI*.95};
const xs=[-4,-2.4,-.8,.8,2.4,4];
export const racks=networkRacks.map((r,i)=>({...r,x:xs[i],z:-6,rotation:0,zone:'network',aisle:-4.2}));
const gpuNote='GPU Server แบบจำลอง 8U อ้างอิงสัดส่วน DGX H100/H200: 8 GPUs, airflow front-to-back และ 6 PSU แบบ 4+2 ตาม NVIDIA รูปร่างเป็นภาพจำลอง ไม่ใช่ CAD ผู้ผลิต การทดลองตัด Feed A ของหน้าเว็บใช้เฉพาะ Edge และไม่รับรองว่าคลัสเตอร์ GPU จะทำงานเต็มกำลังหลังไฟขาด';
for(let row=1;row<4;row++)for(let col=0;col<6;col++){
 const number=row*6+col+1,zone=row===1?'gpu':row===2?'storage':'compute';
 const items=row===1?[{name:'AI Fabric leaf · generic',kind:'fabric',u:41,size:1},...Array.from({length:4},(_,j)=>({name:'GPU-'+String(col*4+j+1).padStart(2,'0')+' · 8U reference',kind:'gpu',u:2+j*9,size:8,source:'https://docs.nvidia.com/dgx/dgxh100-user-guide/introduction-to-dgxh100.html'}))]:row===2?[{name:'Storage fabric leaf · generic',kind:'fabric',u:41,size:1},...Array.from({length:8},(_,j)=>({name:'NVMe/JBOD-'+String(col*8+j+1).padStart(2,'0'),kind:'storage',u:3+j*4,size:4}))]:[{name:'Top-of-rack leaf · generic',kind:'fabric',u:41,size:1},...Array.from({length:16},(_,j)=>({name:'CPU-'+String(col*16+j+1).padStart(3,'0'),kind:'server',u:3+j*2,size:2}))];
 racks.push({id:'R'+String(number).padStart(2,'0'),name:row===1?'GPU Compute':row===2?'Storage Array':'CPU Compute',x:xs[col],z:row===1?-2.4:row===2?2.4:6,rotation:row===1||row===3?Math.PI:0,zone,aisle:row===1?-4.2:4.2,items,note:row===1?gpuNote:'Server/Storage และ Fabric เป็น generic design ตัวอย่าง จำนวน Bay, พอร์ต และ PSU ใช้เพื่อแสดงรูปทรง ไม่ใช่สเปกรุ่นที่รับรอง'});
}
// ภาพจำลองnstration network variety, retaining original engineering catalog entries.
racks[2].items.push({model:'hitachi-apresia15000-32xl-psr2',name:'FABRIC-03',u:24,size:1});
racks[4].items.push({model:'fortinet-fortigate-100f',name:'FIREWALL-01',u:23,size:1});
// Generic passive patch panels make physical tray endpoints explicit in the demo.
for(const [i,r]of racks.entries())if(i!==5&&!r.items.some(it=>it.kind==='odf'))r.items.push({name:'Fiber patch panel · generic',kind:'odf',u:42,size:1});
export const layers={equipment:'Network, GPU Compute, Storage และ CPU Compute เลือก Rack หรือเดินเข้าไปคลิกอุปกรณ์เพื่อดูรายละเอียด',fiber:'Fiber ผ่าน ODF ตัวอย่าง → ตัวจัดสายแนวตั้ง → ราง Fiber → ODF ปลายทาง หัวต่อและเส้นทางเป็นแบบจำลอง ไม่ใช่การสอบเทียบพอร์ตหรือรัศมีโค้งของสายจริง',power:'PDU A/B แนวตั้งภายในด้านข้างตู้ แยก Telecom DC ไม่มีเส้นจ่ายไฟพาดเหนือ Rack การตัด Feed A แสดงสถานะจำลอง ไม่คำนวณโหลดหรือความพร้อมของระบบจริง'};
export function occupied(rack){return rack.items.reduce((n,i)=>n+i.size,0)}
export function routeStatus(feedAOff){return {a:!feedAOff,b:true,edgeAvailable:true,description:feedAOff?'ภาพจำลอง: Feed A ถูกตัด · Edge ยังรับไฟจาก B (สมมุติว่า B รองรับโหลดได้) · ไม่ประเมิน GPU PSU':'ภาพจำลอง: Feed A + B พร้อมจ่ายให้ Edge · ไม่มีค่ากำลังไฟจริง'}}
