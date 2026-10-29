# สร้าง Topology จาก Absolute JSON

เปิด Studio → Project → สร้าง Topology จาก JSON แล้ววาง JSON หรือเลือกไฟล์ .json / .txt กด **ตรวจสอบ JSON** แล้ว **สร้าง Topology** ย้อนกลับด้วย Undo ได้

ตัวอย่างพร้อมใช้: `scripts/fixtures/absolute-topology.json` (4 nodes, 2 edges)

- กำหนด `layout: "absolute"`, `viewBox: {width, height}`, `nodes: []` และ `edges: []`
- Node: `id`, `type`, `title`, `position: {x,y}`, `size: {width,height}` พร้อม `header`, `badge`, `metadata: [{k,v}]` ชื่อแสดงเป็น hostname ส่วน header / badge / metadata แสดงเป็น Text Label ที่แก้ไขได้ และเก็บใน Notes; ค่า IP ใช้เป็น Management IP ด้วย
- ประเภท: `internet` / `cloud`, `pe`, `sw` / `switch`, `cpe` / `router`, `ap`, `firewall` ใช้ไอคอนกลางสำหรับแผนภาพ
- Edge: `id`, `source`, `target`, `sourceSide`, `targetSide` (left/right/top/bottom), `lineStyle` (solid/dashed/dotted), `arrowStyle` (none/forward/backward/both), `color` (#RRGGBB)
- เส้นจากรูปแบบนี้เป็นข้อมูลของแผนภาพ ไม่มีข้อมูลพอร์ต ความเร็ว หรือชนิดสายจริง; ไม่ใช้แทนการยืนยันสเปกฮาร์ดแวร์
- ID ใช้ตัวอักษรอังกฤษ ตัวเลข _ หรือ - ไม่เกิน 64 ตัว และต้องไม่ซ้ำ; รองรับ 200 nodes และ 400 edges; ขนาดอุปกรณ์ 32–10000; title ไม่เกิน 80 ตัว; ข้อมูลเสริมรวมไม่เกิน 1000 ตัวต่อ node
- สี `#ffffff` แสดงเป็นเส้นสีขาวตามไฟล์ ควรใช้พื้นหลัง Dark เมื่อต้องการเห็นเส้นชัดเจน

Project JSON และ Shared Templates เก็บ viewBox และรูปแบบเส้นไว้ การส่งออก SVG / ภาพ / PDF ใช้ลูกศรชุดเดียวกับ Canvas; PowerPoint กำหนดหัวลูกศรของเส้นด้วย

ตรวจสอบด้วย `npm run test:absolute` ครอบคลุม JSON ตัวอย่าง, dialog preview/import/Undo, save/reopen, geometry, SVG, template validation, input ผิด และรูปแบบ ACM / Project เดิม การทดสอบใช้ DOM จำลอง ไม่ใช่การทดสอบหน้าตาบน browser จริง
