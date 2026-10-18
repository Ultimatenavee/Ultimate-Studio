# Ultimate Topology Studio · Control Center v53

## Local Ayothaya campus

เวอร์ชันออนไลน์ใช้งานเมือง Hall และระบบแต่งตัวได้โดยไม่ต้องติดตั้ง Ragnarok หรือ Python ที่เครื่องผู้เข้าชม สไปรต์และท่าทางที่เตรียมไว้จะโหลดจากเว็บเฉพาะชิ้นที่เลือก แล้วประกอบชุดในเบราว์เซอร์ พร้อมท่าเดิน/นั่ง 8 ทิศทางและบันทึกชุดใน browser เดิม การเปิดผ่าน `npm run local` ก็ใช้ตัวประกอบชุดในเบราว์เซอร์เป็นค่าเริ่มต้น จึงไม่ต้องติดตั้งเกมเช่นกัน ตัวสร้างชุดจาก client เดิมยังเก็บไว้สำหรับผู้พัฒนาที่ตั้ง `window.UTS_PORTABLE_WARDROBE=false` โดยตั้งใจ

ตรวจเวอร์ชันออนไลน์ด้วย static server ที่ไม่มี backend: เปิด `python -m http.server 8081 --bind 127.0.0.1 --directory web` แล้วรัน `node scripts/verify-online-wardrobe-data.mjs` และ `node scripts/verify-online-wardrobe.cjs` ตัวส่งออก assets สำหรับผู้พัฒนาอยู่ที่ `assets-source/ayothaya/export_online_wardrobe.py`; ผู้เข้าชมไม่ต้องเรียกใช้งานไฟล์นี้

พื้นที่ภายนอกเปลี่ยนเป็นเมืองอโยธยา เดินเข้าวัดใหญ่เพื่อวาร์ปสู่โถงกลาง: ซ้าย Device Library ขวา Datacenter พร้อมทางออกกลับเมือง ระบบเดินและภาพรวมยังใช้งานได้ ดู [วิธีเปิดและรายละเอียดการเปลี่ยนแปลง](docs/AYOTHAYA.md)

โปรแกรมออกแบบ Network Topology ด้วยภาพอุปกรณ์หลาย Brand โดยไม่มี CLI, Configuration หรือการจำลอง Routing Protocol

## Control Center v53

- Navy/Cyan enterprise UI, floating controls and on-demand Overview / Visual Lab panels; Day/Night preferences retained.
- Session-only visual traffic, load scenarios, temporary failures, utilization and license-capacity warnings; clearly marked simulation.
- Optional Auto Layout / Snap with Undo and unchanged interface mapping.
- Specs → matched Matrix license → add device to Topology.
- Node.js 24+: `npm ci`, `npm test`, `npm run build`, `npm run local`.
- [Architecture, calculation boundaries, validation and remaining limits](docs/CONTROL-CENTER-v53.md).

## ฟังก์ชันใหม่ 1.6.1

- เส้นประแนะนำแนวนอน/แนวตั้งเมื่ออุปกรณ์เข้าใกล้ขอบหรือกึ่งกลางของอุปกรณ์อื่นระหว่างลาก รวมลากจาก Library และลากกลุ่ม
- ระยะตรวจจับ 6px บนหน้าจอ ปรับตาม Zoom; ตรงแนวแล้วเส้นชัดขึ้น ปล่อยหรือยกเลิกแล้วหาย ตำแหน่งยังลากได้อิสระ

## ฟังก์ชันใหม่ 1.6.0

- Landing ใช้ความกว้างจอแบบ fluid ตั้งแต่มือถือถึง ultrawide; ภาพ Network, ตัวอักษร และการ์ดปรับสัดส่วนตาม viewport
- Workspace ใช้พื้นที่ที่เหลือใต้ชื่อ Project โดยไม่บังคับความสูงขั้นต่ำเดิม; Device Specs ขยายจำนวนคอลัมน์ตามพื้นที่
- จอไม่เกิน 1180px หรือจอสัมผัสไม่เกิน 1440px ใช้ Library / Inspector / Spec filters แบบ modal panel พร้อมเมนู Project และ Export ที่ปุ่ม •••
- แตะ Library เพื่อเพิ่มอุปกรณ์กลางมุมมองปัจจุบัน; ใน Bayface เปิดแบบฟอร์มเพิ่มลง Rack พร้อมค่ารุ่นเดิม และจัดพอดีหลังบันทึก
- บีบสองนิ้วเพื่อซูมและเลื่อน Topology / Bayface; ยกเลิกการลากอุปกรณ์ก่อนเริ่ม pinch ป้องกันแก้ไขตำแหน่งโดยไม่ตั้งใจ
- แถบเครื่องมือเลื่อนแนวนอนได้, touch targets, safe-area, แนวตั้ง/แนวนอน และความสูง dialog ตามแป้นพิมพ์บนหน้าจอ
- กลับสู่ desktop แล้วคืนแผงและเก็บความกว้าง Library / Inspector เดิม ไม่เขียนทับ preferences
- ตรวจ 82 กลุ่มการทำงานเดิมและ 6 กลุ่ม responsive/event contracts; CSS parse และ canvas render หลายขนาดผ่าน ยังไม่ได้ตรวจ layout ใน browser หรือบน iPhone/iPad จริง

## ฟังก์ชันใหม่ 1.5.0

- หน้าแรก `/` มี Animation โครงข่าย Backbone / Metro Ring / Dual PE พร้อมหยุดเล่นและรองรับ Reduce Motion
- พื้นที่ทำงาน `/studio.html` มีแท็บ Topology / Bayface / Device Specs; เข้า Bayface หรือ Specs ตรงได้ด้วย `?view=bayface` หรือ `?view=specs`
- ชื่อ Project ใช้เต็มแถบ ขึ้นบรรทัดตามความกว้างอัตโนมัติ และยกเลิกข้อจำกัดเดิม 150 ตัวอักษรทั้ง editor / JSON / Shared Project
- Liquid Glass สำหรับแถบนำทางและเครื่องมือ พร้อมขอบสะท้อนแสงและตัวเลือกระดับระบบ Reduce Motion / Transparency / Increase Contrast
- Device Specs รวมอุปกรณ์ 34 รุ่น และ ODF / AC / DC อีก 6 แบบ; รองรับตัวกรอง ดูรายละเอียด และเปรียบเทียบ 2–3 รุ่น
- นำเข้าข้อมูล Matrix 18 รุ่นจากไฟล์ที่ผู้ใช้ให้; แสดงข้อมูล Matrix แยกจากข้อมูล Library ที่มีเอกสารอ้างอิง รุ่น PE แสดงเฉพาะข้อมูล Chassis ที่มีอยู่
- Bayface ขยับข้อความข้างอุปกรณ์ออกอีก 22px ทั้ง canvas และ export

## ฟังก์ชันใหม่ 1.4.2

- คลิกพื้นที่ว่างใน Bayface เพื่อยกเลิกเลือกอุปกรณ์
- ODF / AC / DC อยู่ใน Library ฝั่งซ้ายพร้อมภาพ ลากลง Rack ได้โดยตรง

## ฟังก์ชันใหม่ 1.4.1

- Bayface มีปุ่มมือสำหรับลากเลื่อนมุมมองเหนือ Rack และอุปกรณ์; กลับปุ่มเลือกเพื่อจัดอุปกรณ์
- ในโหมดเลือก ลากพื้นที่ว่างเพื่อเลื่อนมุมมองได้

## ฟังก์ชันใหม่ 1.4.0

- Bayface → ODF / AC / DC: CommScope LC/SC 1U, APC AP9565 PDU 1U, APC SMT1500RMI2U UPS 2U, Vertiv NetSure 211 19-inch 1U/2U
- มีภาพหน้าตรง ขนาด U และ Use case พร้อมลิงก์ผู้ผลิตใน Inspector; ภาพจำลองระบุแยกจากภาพผู้ผลิต
- ลากลง Rack ผ่าน Smart U, ย้าย/แก้ไข/Undo และบันทึก JSON/Shared Templates/Export ได้

## ฟังก์ชันใหม่ 1.3.0

- Smart U หา U ว่างต่อเนื่องใกล้จุดวาง ปิดเพื่อเลือกตำแหน่งตรงได้
- เลือกอุปกรณ์แล้ว ↑ / ↓ ย้ายทีละ 1U ลากพร้อมภาพโปร่งใสระบุช่วง U รองรับ Undo
- Inspector หุบส่วน Rack/รายการ ปิดเปิดและลากปรับความกว้างได้
- นำเสนอ Bayface และ Export JPEG/PNG/SVG/PDF/PowerPoint; PowerPoint เป็นภาพรวมในสไลด์

## ฟังก์ชันใหม่ 1.2.1

- ตรวจขนาด Rack ครบ 34 รุ่น พร้อมลิงก์เอกสารใน Inspector แยก U ที่ Vendor ระบุ กับจำนวนช่องที่คำนวณจากความสูง
- PE ใช้ขนาดเริ่มต้นที่ตรวจแล้ว: F1A 1U, M8 3U, M14 5U, X4 จอง 10U สำหรับ chassis 9.8U และ NE40E-X8A 21U
- FortiGate อ้างอิง Datasheet ของผู้ผลิตจากเว็บไซต์ตัวแทน โดยแสดงที่มาอย่างชัดเจน
- แบบเดิมคงความสูงที่ผู้ใช้ตั้งไว้ ใช้ปุ่มขนาดอ้างอิงเพื่อปรับผ่านการตรวจ overlap
- เลือกอุปกรณ์แล้ว Delete ทำงานตามแท็บที่เปิด สีพื้นที่เปลี่ยนทันทีทั้งอุปกรณ์/พื้นที่จอง และอยู่ใน Export

## ฟังก์ชันใหม่ 1.1.0

- แท็บ **Topology / Bayface** แยกพื้นที่ออกแบบใน Project เดียว เริ่มต้น Bayface ว่าง เพิ่ม Rack ได้สูงสุด 20 ตู้ ปรับชื่อ Site/Phase และ 1–60 U ต่อตู้ U1 อยู่ล่างสุด
- ลากอุปกรณ์จาก Library ลง Rack หรือกดเลือกแล้วกรอกใน Rack Inspector; ใช้ภาพชุดเดียวกับ Topology และขนาด Rack Unit ที่มีใน Library ถ้าไม่มีข้อมูลเริ่ม 1U ให้ปรับด้วยผู้ใช้
- วาง/แก้ไข/ย้ายรายการตาม U รวมข้ามตู้ ตรวจ overlap และความสูงเกิน Rack ก่อนบันทึก รองรับ Undo/Redo และชื่อด้านข้าง
- อุปกรณ์, พื้นที่จอง (เช่น CAT/TRUE), Blank panel, Patch panel และ PDU/Power; บันทึกใน JSON, Local project และ Shared Templates รวมแบบ Bayface อย่างเดียว
- Export Bayface เป็น SVG / PNG จากปุ่มในแท็บ Bayface มีภาพ embedded และ font ไทย การ Export ของ Topology เดิมยังแยกตามพื้นที่เดิม
- Day/Night ใช้สี semantic สำหรับข้อความหลัก/รอง ปุ่ม Input/placeholder สเปกและสถานะ ลดความโปร่งใสของพื้นผิวเพื่อรักษา Contrast; คู่สีหลักตรวจอย่างน้อย 4.5:1 ทั้งสองโหมด สี Label ที่ผู้ใช้ตั้งเองยังเป็นข้อมูลของแบบ
- พื้นที่จองเลือกสีแล้วปรับข้อความขาว/ดำตามความสว่างอัตโนมัติ ไม่ต้องใช้รูปตู้จากเว็บหรือรูปถ่ายใหม่

## ฟังก์ชันใหม่ 1.0.1

- แถบด้านบน **วาง JSON** เปิดกล่องรับ NOAH/ACM JSON โดยตรง กด **วางจาก Clipboard** หรือ Ctrl+V / ⌘V แล้วตรวจสอบ/สร้าง Topology ได้ พร้อมตัวเลือกไฟล์เดิม
- Design tools → เทียบเวอร์ชัน: วาง NOAH Project JSON ในกล่อง กด **เปรียบเทียบ JSON** หรือเลือกไฟล์เดิมได้
- Clipboard อ่านเมื่อกดปุ่มเท่านั้น ถ้าไม่รองรับ/ปฏิเสธ/ว่าง จะเก็บข้อความเดิมและให้วางด้วยแป้นพิมพ์; อ่านข้อความไม่ได้ทำให้ Canvas เปลี่ยนอัตโนมัติ

## ฟังก์ชันใหม่ 1.0.0

- **Design tools → ตรวจแบบ:** ตรวจ Interface/Combo/shared socket ซ้ำ, ความเร็วตามแบบเทียบพอร์ตที่ยืนยัน, UTP/Fiber, Uplink ต่ำกว่า Access และ Main/Backup ที่ใช้อุปกรณ์หรือ Cable route ร่วมกัน กดรายการเพื่อไปยังอุปกรณ์หรือ Link
- Uplink ใช้เลข HOP สำหรับ ACM; แบบที่วาดเองใช้ระยะ Hop จาก PE (Role PE หรือโปรไฟล์ PE) เป็นลำดับโดยไม่แก้ความเร็วให้อัตโนมัติ กรณีไม่มีทิศทางจะให้ระบุ PE/HOP ก่อน; ตรวจความเร็วฮาร์ดแวร์ไม่ได้สำหรับ Diagram-only
- **CID selector:** ไฮไลต์เส้นทางของ CID และลดความเด่นของสายอื่น รองรับหลาย CID ใน Canvas เดียว แต่แต่ละ Link เก็บ CID เดียว
- **จำลอง Down:** ปิด Link/Device ชั่วคราว ตรวจการเชื่อมถึงกันของคู่ปลายทางแต่ละ CID และแยกเส้นทางที่ขาดอยู่ก่อน ผลไม่เขียนทับ Project และไม่จำลอง BGP/VRRP/STP หรือเวลาสลับเส้นทาง กราฟวงแหวนที่ไม่มี PE/CPE/ใบปลายทางจะแสดงว่าไม่มีคู่ปลายทางให้ตรวจ
- **Redundancy:** แสดงจุดร่วมของ Main/Backup เป็นข้อให้ตรวจสอบ ไม่สรุปว่าออกแบบผิดทุกกรณี; ระบุ Cable route ใน Link Inspector เพื่อวิเคราะห์เส้นทางร่วม ถ้าไม่ระบุจะยืนยัน diversity ไม่ได้
- **เทียบเวอร์ชัน:** เปิดไฟล์ NOAH เวอร์ชันก่อนหน้าแล้วดูสิ่งที่เพิ่ม/ลบ/เปลี่ยนพร้อมรายชื่อฟิลด์ อ้างอิง ID เดิม จึงเหมาะกับเวอร์ชันจาก Project เดียวกัน
- **Site / Branch / Rack:** ใส่ชื่อ Site ให้อุปกรณ์ สร้างกรอบ Group, เปลี่ยนชื่อ, เลือกย้ายทั้งกลุ่ม และยุบ/ขยายสมาชิกบน Canvas; เก็บ Site/collapsed ใน JSON/Template การ Export ส่งออกแบบครบทุกอุปกรณ์
- **รายงาน:** Devices CSV และ Link inventory CSV (CID, endpoints, speed, media, MTU, role, VLAN, Cable route) พร้อมปุ่มไป Export Diagram; UTF-8 BOM และป้องกัน spreadsheet formulas
- **Templates:** ค้นหาชื่อ/Tags, Favorite ที่ทุกคนเห็นร่วมกัน, Preview, ใช้สำเนา, แก้ไขต้นฉบับ และลบพร้อมข้อความยืนยัน ทุกการแก้ไข/ลบตรวจ revision เพื่อไม่เขียนทับการแก้ของคนอื่น เมื่อติด conflict สามารถบันทึก Canvas เป็นรายการใหม่ได้
- แก้ไข Template: กด **แก้ไข** → ปรับ Canvas → กด **Templates** → **บันทึกทับ**; **ใช้เป็นสำเนา** จะไม่เปลี่ยนต้นฉบับ
- **นำเสนอ:** เต็มจอเมื่อ browser อนุญาต และไฮไลต์ Main ทีละ Link ตามเลข HOP พร้อมเลือก CID
- **แชร์ / Review:** สร้างสำเนาถาวรใน D1 แล้วคัดลอกลิงก์ `#review=<id>`; ผู้มีลิงก์เปิดสำเนา ปัก Comment ที่อุปกรณ์/Link/ทั้ง Project ระบุชื่อผู้ตรวจและสถานะ รอตรวจ/ต้องแก้/ผ่านแล้วได้ มีจำนวน Comments บน Canvas ทุกคนที่เข้าถึงเว็บไซต์แก้ไขข้อมูลร่วมได้ ชื่อผู้ตรวจเป็นชื่อที่กรอก ไม่ใช่บัญชีที่ยืนยันตัวตน
- Review เป็น snapshot การแก้ Canvas ภายหลังไม่เปลี่ยนสำเนาที่แชร์; ลิงก์ไม่ได้ถูกส่งให้ใครอัตโนมัติ
- schema เพิ่ม `metadata_json`/`revision` ในตาราง Templates และตาราง Reviews/Comments ผ่าน migration ใหม่ เก็บ Templates เดิมไว้

## ฟังก์ชันใหม่ 0.9.0

- **Smart Uplink** สำหรับ ACM JSON: เรียง HOP ตามเลข แล้วไล่ย้อนจากปลายทาง ความเร็ว Main/Backup ของ HOP ก่อนหน้าจะไม่น้อยกว่าค่าสูงสุดใน HOP ถัดไป คง Uplink ที่เร็วกว่าไว้ Interconnect เป็นสายแนวข้างจึงไม่ใช้กำหนดความเร็ว Uplink
- JSON ตัวอย่างที่ HOP1 ชื่อ GE ↔ XGE และ HOP2/HOP3 เป็น 10G จะได้ HOP1 ทั้ง Main และ Backup เป็น 10G พร้อมคำเตือนว่าค่านี้เป็นความเร็วตามเกณฑ์ของแบบ ไม่มีการอ่านสถานะพอร์ตจริง; Bandwidth บริการไม่ได้ใช้แทนความเร็วสาย
- ใช้เกณฑ์เมื่อสร้างจาก ACM JSON ใหม่เท่านั้น ไฟล์ NOAH / งานเดิม / Template ที่ระบุความเร็วอยู่แล้วคงค่าที่บันทึกไว้
- ปรับ Elements ด้วย SVG จาก Lucide พร้อมสีไล่ระดับ มุมโค้งและ Palette แบบใหม่ ต้นฉบับและ LICENSE อยู่ใน `web/vendor/lucide/` แหล่งที่มาใน `research/element-icons-v09.json`
- เลือก Element แล้วลากมุม 4 จุดเพื่อปรับกว้าง/สูงอย่างอิสระ รองรับซูม ยกเลิกการลาก Undo/Redo และบันทึก Project/Template; ขนาดต่ำสุด 32×32 px
- ถอด Snap และ Auto Layout รวมการตั้งค่า Snap เดิม การลากอุปกรณ์ สาย Label และ Element ไม่ดึงเข้าจุด Grid; จัดแนว/Group แบบกดสั่งเองยังใช้ได้

## ฟังก์ชันใหม่ 0.8.0

- **☆ Templates** บน Canvas Toolbar เปิดรายการ Topology ที่บันทึกในเว็บไซต์ ตั้งชื่อแล้วกด **บันทึก Topology นี้ไว้บนเว็บไซต์** ทุกคนที่เปิดลิงก์เดียวกันเห็นรายการเดียวกัน ข้อมูลเก็บใน D1 และคงอยู่หลังปิด browser; กดใช้แล้วได้สำเนาสำหรับแก้ไข
- **＋ New Project** เริ่ม Canvas ว่างทันที เก็บงานก่อนหน้าไว้ใน Project ในเครื่อง และ Undo กลับได้
- **Project** เปิดเป็น dialog บน browser top layer จึงไม่ถูกแผง Liquid Glass บัง ใช้ทำสำเนา เปิดงานในเครื่อง หรือสร้างจาก JSON / ACM
- **ดาวน์โหลด JSON** บนแถบหลักบันทึกไฟล์ลงเครื่อง แยกจาก Templates ที่เก็บในเว็บไซต์
- เอา Port Mapping และ Command Palette / Ctrl+K ออก
- **Elements** มี Cloud / Internet, Rectangle, Rounded Rectangle, Ellipse, Diamond, Hexagon, Arrow และ Database เลือกรูปทรงแล้วคลิก Canvas; ลากย้าย แก้ข้อความ สี ขนาด เส้นขอบ และความทึบใน Inspector / dialog ได้ Copy/Paste, Group, Undo และ Save/Template รองรับเหมือน Labels
- Elements อยู่หลังอุปกรณ์และสาย Export ทั้ง SVG/PNG/JPEG/PDF/PPTX; ใน PowerPoint เป็นรูปทรงและข้อความ native ที่แก้ไขได้
- **S6730-H24** ปรากฏใน Device Library และ resolve JSON เป็น **S6730-H24X6C** พร้อมชื่อ SKU เต็ม ต้องตรวจชื่อรุ่นเต็มของอุปกรณ์จริงก่อนใช้โปรไฟล์พอร์ตนี้

## Device Library 0.7.0

เพิ่ม 11 โปรไฟล์ รวม 34 รุ่น พร้อมภาพหน้าตรงโปร่งใสและข้อมูลอ้างอิงผู้ผลิต:

| กลุ่ม | รุ่นใหม่ |
| --- | --- |
| Huawei Switch | S5720-12TP-LI-AC, S5720-36C-EI-28S-AC, S5720-52X-SI-AC, S5732-H24S6Q, S6720-30C-EI-24S-AC, S6730-H24X6C, S5335-S32ST4X |
| Hitachi / APRESIA Switch | APRESIA13200-48X-PSR3, APRESIA13200-52GT-PSR2, APRESIA15000-32XL-PSR2 |
| Huawei PE | NE40E-X8A — ภาพและชื่อรุ่น ไม่มีสเปกหรือโปรไฟล์พอร์ต |

S5732-H ใช้รุ่นย่อย H24S6Q ตามชุดพอร์ตที่ขอ APRESIA13200 มีทั้ง 48X (4×10GE) และ 52GT (4×GE) ข้อมูล Switch รวมพอร์ต ความเร็ว PSU ขนาด สภาพแวดล้อมและข้อจำกัดที่ยืนยันจากเอกสารผู้ผลิต เปิดดูจาก Inspector / Physical View / Sources ได้

พอร์ต Combo ของ S5720 และ S5335 แชร์ RJ45/SFP; APRESIA15000 พอร์ต 40GE25/29 แชร์กับกลุ่ม SFP25–28/29–32 โปรแกรมกันการใช้พร้อมกัน เพิ่ม QSFP+ 40GE และ QSFP28 100GE พร้อมตรวจชนิด Optics/Fiber; 100GE ของ S6730 ขึ้นกับ SKU/license ตามเอกสาร S5335 ใช้ชื่อ Combo 1–8 เป็นตัวระบุในแบบ เพราะ brochure ไม่ยืนยันหมายเลข CLI

ภาพสร้างใหม่เป็นภาพประกอบ อาจมีรายละเอียดช่องเสียบหรือตัวอักษรต่างจากเครื่องจริง ใช้รายการพอร์ตและภาพอ้างอิงผู้ผลิตเป็นข้อมูลฮาร์ดแวร์ รุ่นใหม่ยังไม่มี Hotspot ที่สอบเทียบ เก็บต้นฉบับ PNG และ prompt ใน `research/generated-originals-v07/` และ `research/generated-device-art-v07.json`; ไฟล์แสดงผล WebP เป็น lossless ตรวจ RGBA และ alpha ตรงต้นฉบับ

## ฟังก์ชันใหม่ 0.6.0

- ชื่ออุปกรณ์ที่เพิ่มจะใช้ชื่อรุ่นโดยไม่เติมเลขต่อท้าย; สายใหม่มี MTU 9216 (ค่าที่ระบุในไฟล์นำเข้าจะคงเดิม)
- ลากแถบระหว่าง Library กับ Canvas เพื่อปรับความกว้าง ใช้ลูกศรซ้าย/ขวาได้ และดับเบิลคลิกคืนขนาด
- ลากเส้นหรือจุดวงกลมของ Link เพื่อจัดตำแหน่ง เพิ่มจุดหักมุม / คืนตำแหน่งได้จาก Link Inspector
- ลากข้อความ Link Label ได้เอง เส้นคู่เริ่มห่างกัน 2 Grid; Main อยู่ด้านบน/ซ้าย ส่วน Backup อยู่ด้านล่าง/ขวา ไม่มีข้อความ MAIN/BACKUP ต่อหน้าป้าย
- **Project → สร้างจาก JSON / ACM** วาง JSON แล้วตรวจสอบหรือสร้าง Topology ได้ **เปิด Project** รองรับ `.json` และ `.txt`
- ACM รองรับ `hops.HOP1.start/end`, `backup.start/end`, `Redundant Node`, `Int. Redundant 1/2` และ `Redundant Int. 1/2`; รวม Node ซ้ำและรักษาชื่อ Interface
- รุ่นตรง Library ใช้ภาพเดิม; รุ่นที่ไม่รู้จักแสดงชื่อรุ่นจาก source เป็น placeholder ไม่มีภาพ/สเปกแทนรุ่น ทุกอุปกรณ์จาก ACM เป็น diagram interface ที่ไม่ตรวจพอร์ตจริง ชนิดสาย/ความเร็วที่อนุมานจะรายงานให้ตรวจสอบก่อนสร้าง
- **☆ Templates** บันทึก Topology ปัจจุบัน ทุกคนที่เข้าเว็บเห็นรายการเดียวกัน กดใช้ Template เพื่อสร้างสำเนาแก้ไขได้ ต้นฉบับคงเดิม ข้อมูลใน Template จะเผยแพร่ให้ทุกคนที่เปิดเว็บไซต์เห็นตามข้อความในเมนู
- URL, Token, BGP Password และข้อมูล source ที่ไม่ใช่ข้อมูล Topology จะไม่ถูกนำเข้าหรือบันทึกลง Template

## ใช้งาน

UI แนว Liquid Glass: แผงโปร่งแสง ขอบสะท้อน แถบเครื่องมือโค้งมน และการเคลื่อนไหวนุ่มนวล รองรับ Dark/Light, ลดการเคลื่อนไหว และพื้นหลังทึบเมื่อ browser ไม่รองรับ blur

กด **Enter** หลังแก้ไขค่าเพื่อบันทึกทันที ใช้ **Shift+Enter** สำหรับขึ้นบรรทัดใหม่ในช่องข้อความหลายบรรทัด โดยยังตรวจสอบค่าก่อนบันทึกตามเดิม

เมื่อเปิดโปรแกรมจะเริ่มด้วย Topology ว่างทุกครั้ง ไม่มีอุปกรณ์ สาย หรือ Label งานเดิมยังบันทึกไว้และเลือกเปิดได้จาก **Project ในเครื่อง** หรือเปิดไฟล์ JSON ด้วย **เปิด Project**

1. ค้นหาและกรอง **Router / Switch / PE / Firewall**, Brand หรือรุ่นใน Device Library กด **+** หรือลากลง Canvas ใช้ ★ เก็บรายการโปรด และแท็บล่าสุดเพื่อเรียกอุปกรณ์ที่เพิ่งใช้
2. กดอุปกรณ์หนึ่งครั้งเพื่อเปิด **Inspector**: รูป, Hostname, Management IP, Role, Notes, พอร์ต และสเปกที่ตรวจยืนยัน ดับเบิลคลิกเปิด **Physical View** พร้อมภาพขนาดใหญ่ สเปกเต็ม และ Label ลากขอบซ้ายของ Inspector เพื่อปรับความกว้าง ขนาดบันทึกไว้ในเครื่อง; ลูกศรซ้าย/ขวาปรับทีละ 20 px, Shift ปรับทีละ 40 px, Home/End ปรับต่ำสุด/สูงสุด และดับเบิลคลิกคืนขนาดเริ่มต้น
3. เลือก **UTP** หรือ **Fiber** แล้วเลือกอุปกรณ์และ Interface ทั้งสองฝั่ง ระบุความเร็ว, Single-mode / Multimode, Optics, CID, VLAN และบทบาท **Main / Backup** ก่อนบันทึก
4. **Backup** เป็นเส้นประสีอำพันเคลื่อนไหวช้า ๆ Main ใช้สีตามสาย: UTP เขียว, Fiber ฟ้า เลือกสายเพื่อเปลี่ยนบทบาท หรือแก้ไขสี, รูปแบบเส้น, VLAN mode, MTU และการแสดง Label สาย Down ใช้เส้นประแดง สายที่ปิดใช้สีเทา Link Label ของ **Main อยู่เหนือเส้น Main** และของ **Backup อยู่ใต้เส้น Backup** ไม่มีกรอบคั่นกลาง แสดง Interface ต้นทาง ↔ ปลายทาง พร้อม CID/ความเร็ว/VLAN สายแนวตั้งขยับข้อความไว้ด้านข้าง โดย Main อยู่เหนือและ Backup อยู่ใต้จุดกึ่งกลางเพื่อไม่ทับสาย สถานะทั้งหมดมาจากแบบจำลอง
5. **PE Router** มี Huawei NetEngine 8000 **F1A / M8 / M14 / X4 / NE40E-X8A** พร้อมภาพ ไม่มีข้อมูลสเปกหรือโปรไฟล์พอร์ต ใช้ชื่อ Interface ที่ระบุเองในแบบ ตรวจความเข้ากันได้เฉพาะฝั่งที่มีข้อมูลพอร์ต
6. Shift/Ctrl/Cmd + คลิก เพื่อเลือกหลายรายการ หรือ **Shift + ลากพื้นที่ว่าง** เพื่อเลือกเป็นกรอบ ใช้ **จัดแนว / Group**, Duplicate, Copy/Paste และ Mini Map ในโหมดเลือก **ลากพื้นที่ว่างเพื่อเลื่อนมุมมอง** โดยเก็บสิ่งที่เลือกและตำแหน่งอุปกรณ์ไว้ คลิกพื้นที่ว่างโดยไม่ลากเพื่อล้างสิ่งที่เลือก ใช้ **Space + ลาก** หรือเมาส์ปุ่มกลางเพื่อเลื่อนจากตำแหน่งใดก็ได้ ซูมด้วยล้อเมาส์
7. เลือก **Text** เพื่อวางข้อความ หรือ **กรอบพื้นที่** แล้วลากเพื่อวาง Region แก้ไขตำแหน่ง สี ขนาดตัวอักษร ตัวหนา แนวข้อความ พื้นหลังและความทึบใน Inspector ดับเบิลคลิก Label เพื่อแก้ไขข้อความบน Canvas; Ctrl/Cmd+Enter บันทึก, Esc ยกเลิก
8. **Export Center** รองรับ **PNG / JPEG / SVG / PDF / PowerPoint** เลือกทั้ง Topology หรือพื้นที่ที่เห็น, 1–4×, พื้นหลัง, Grid, Link Labels, Hostnames และแนวหน้ากระดาษ PDF ภาพ Raster จำกัดด้านยาว 6,000 px / 16 MP เพื่อควบคุมหน่วยความจำ
9. PDF/JPEG/PNG เป็นภาพ; SVG มีภาพอุปกรณ์ฝังในไฟล์พร้อมข้อความและเส้น; PPTX แยกรูปแต่ละอุปกรณ์ และใช้ข้อความ กรอบพื้นที่ และเส้นที่แก้ไขได้ Link Label ทุก Export ใช้ข้อความไม่มีกรอบตาม Canvas เส้นโค้งใน PPTX ใช้เส้นหลายช่วง Animation ส่งออกเป็นเส้นประคงที่ พื้นหลังโปร่งใสใช้กับ PNG/SVG
10. งานบันทึกอัตโนมัติใน browser เครื่องนี้ มี Project ล่าสุดสูงสุด 8 งาน เปิดจากเมนู **Project ในเครื่อง** ได้ **ดาวน์โหลด JSON** ดาวน์โหลด `.noah.json` สำหรับย้ายเครื่อง รองรับไฟล์ v1/v2/v3

คีย์บอร์ด **F** จัดพอดี, **Ctrl/Cmd+D** ทำสำเนา, **Ctrl/Cmd+A** เลือกอุปกรณ์และ Labels, **Ctrl/Cmd+C/V** คัดลอก/วาง, **Ctrl/Cmd+Z** ย้อนกลับ, **Ctrl/Cmd+Shift+Z** ทำซ้ำ, **Delete** ลบ, **Ctrl/Cmd+S** ดาวน์โหลด Project

**Dark / Light**, การแสดง Hostname/รายละเอียด และ Animation บันทึกเป็นการตั้งค่าในเครื่อง มีปุ่มหยุด Animation และเคารพ `prefers-reduced-motion` การล้างข้อมูล browser จะล้างงานที่บันทึกในเครื่อง จึงใช้ไฟล์ JSON เมื่อต้องการเก็บงานนอก browser

## ภาพและข้อมูลอุปกรณ์

ภาพบน Library, Canvas และ Export เป็นภาพจำลองมุมหน้าตรง พื้นหลังโปร่งใสจำนวน **34 รุ่น** สร้างด้วย **built-in imagegen** โดยอ้างอิงภาพตรงรุ่น ไฟล์ PNG ที่เลือกถูกคัดลอกโดยไม่แก้ pixels หรือ alpha; ใช้ SVG viewBox และ native PowerPoint crop metadata จัดกรอบภาพ

ภาพอ้างอิงเดิมและข้อมูลพอร์ตของ **19 รุ่น** ยังคงอยู่ ใน Physical View ใช้ **ภาพอ้างอิง** เพื่อดูรูปเดิม และ **พอร์ต / LED** สำหรับ 7 รุ่นที่มีภาพพร้อม Hotspot ภาพที่สร้างใหม่ไม่ใช้เป็นแผนที่พอร์ตที่สอบเทียบ บาง Cisco ใช้ด้านที่มีพอร์ตเป็นแผงหันตรงตามรูปอ้างอิง ไม่สังเคราะห์แผงอีกด้านที่ไม่ได้เห็น

| Brand | รุ่น |
| --- | --- |
| Cisco | C1121-8PLTEP, 1941, 2911/K9, 3925E, 3945E, ASR1001, ASR1001-X, ISR4331, ISR4431 |
| Huawei | AR5710-S8T2X, AR5710-S8T2X-LTE4EA, S5735-L8T4X-A1, S5735-L8T4X-QA-V2, S5731-S48T4X |
| Huawei PE | NetEngine 8000 F1A, M8, M14, X4 — ภาพและชื่อรุ่นเท่านั้น |
| ALE | OmniSwitch OS6450-10 non-PoE |
| Telco Systems | T-Marc 280, 340, 380 |
| Fortinet | FortiGate 100F |

ภาพ F1A อ้างอิงรุ่นย่อย F1A-8H20Q ตามภาพในเอกสาร Huawei ส่วน M8/M14/X4 รักษาสัดส่วน Chassis ตามรูปอ้างอิง จำนวนและชนิดพอร์ตที่ปรากฏในภาพจำลองไม่ใช้เป็นข้อมูลฮาร์ดแวร์

โปรไฟล์ Hotspot: ASR1001-X, S5735-L8T4X-QA-V2, OS6450-10, T-Marc 280/340/380, FortiGate 100F ช่อง Combo แชร์การใช้งาน Generic LX/SX/LR/SR ตรวจความเร็ว Form factor และชนิด Fiber ข้อมูล PSU/พอร์ตเดิมและความต่างตาม Ordering SKU เก็บไว้ใน Catalog และเอกสารอ้างอิง VLAN, MTU, CID และ Management IP เป็นข้อมูลของแบบ ไม่มีการ Configuration หรือรับ Live Telemetry

## โครงสร้างและการเปิดโค้ด

หน้าจอและ Assets ต้นฉบับอยู่ใน `web/` ส่วน `npm run build` สร้าง `dist/client` และ Worker `dist/server/index.js` สำหรับ Shared Templates ที่เก็บใน D1 Schema อยู่ใน `db/schema.ts` และ migration อยู่ใน `drizzle/`

แอปใช้ DOM + SVG เดิม แยกข้อมูลออกจากการแสดงผล ไม่มีขั้นตอน compile หรือ dependency runtime ที่ต้องติดตั้ง

| ไฟล์ | หน้าที่ |
| --- | --- |
| `web/index.html` | โครงหน้าจอและ Dialog |
| `web/style.css`, `web/theme.css` | Layout เดิมและ Design tokens / Dark-Light / Responsive / Motion |
| `web/app.js` | Project, History, Validation, Physical View, Connection editing |
| `web/editor.js` | Selection, Group, Pan/Zoom gestures, Inspector, Commands, Preferences, Autosave |
| `web/geometry.js` | Shared geometry, Main/Backup style, image framing |
| `web/exports.js` | Scene และ Export 5 รูปแบบ |
| `web/catalog.js` | ข้อมูลรุ่นอุปกรณ์และพอร์ต |
| `web/assets/*-illustration-v03.png` | ภาพชุดใหม่ทั้ง 23 รุ่น |
| `research/generated-device-art-v03.json` | Final paths, prompts ทั้งชุด, references, imagegen provenance และ hashes |

เปิดใช้งานในเครื่องด้วย Python 3:

```sh
python -m http.server 8080 --directory web
```

จากนั้นเปิด `http://localhost:8080` ต้อง serve ผ่าน HTTP เพื่อให้ระบบ Export โหลดรูปและฟอนต์ได้ Runtime libraries ที่ใช้ส่งออกมีอยู่ใน `web/vendor` แล้ว: PDF-Lib 1.17.1 และ PptxGenJS 4.0.1 พร้อม license ฟอนต์ Noto Sans Thai อยู่ใน `web/fonts` พร้อม SIL OFL 1.1 และถูกฝังใน SVG Export เครื่องที่เปิด PPTX ใช้ฟอนต์ของโปรแกรมนำเสนอและอาจมีความต่างด้านการตัดบรรทัด

สร้าง Catalog ใหม่จากข้อมูลที่เก็บไว้ (ต้องมี Python/Pillow):

```sh
python -m pip install Pillow
python scripts/build-catalog.py
python scripts/enrich-catalog.py
python scripts/apply-v03-assets.py
```

Builder ใช้ manifests และ assets ที่ commit ไว้เมื่อไม่มี research downloads การสร้างภาพชุดใหม่ใช้ prompt set ใน manifest ผ่าน built-in imagegen ไม่ต้องใช้ API key เพื่อเปิดแอป

## การตรวจสอบและขอบเขต

```sh
node --check web/app.js
node --check web/editor.js
node --check web/geometry.js
node --check web/exports.js
node scripts/verify-project.mjs
node scripts/verify-exports.mjs /tmp/noah-export-qa
```

ชุดทดสอบ Export ต้องมี Sharp, PDF-Lib และ JSZip; ตั้ง `CODEX_PRIMARY_RUNTIME_NODE_MODULES` ให้ชี้ Node modules ที่ติดตั้งไว้ ชุดทดสอบใช้ browser bundles ที่ vendored จริงเพื่อสร้าง PDF/PPTX และใช้ Sharp render SVG สำหรับ QA

ผ่าน **47 กลุ่มพฤติกรรม** ใน Node VM/DOM adapter: พอร์ต/Combo, Cable/Optics, PSU/LED, Main/Backup, Parallel links, PE manual interfaces, Import/migration, History, PE/Brand/Search filters, Frameless link labels, Direct empty-canvas pan, Inspector resize/persistence/cancellation, Text/Region, Multi-selection/Group/copy, Autosave/storage failure, Physical click workflow และ Inline editing ผ่านการสร้างและตรวจไฟล์ Export จริงครบ 5 รูปแบบ รวม native editable PPTX objects/crops, 34 ภาพ, ภาษาไทย, Transparency/Viewport และ PDF orientation ไฟล์ SVG/PNG/PDF และ PowerPoint ถูกตรวจทั้งข้อมูล Export และตัวอย่างภาพ; ชุดใหม่มี Elements native shapes

**ยังไม่ได้ทดสอบ layout และ interaction ใน browser จริง**: native dialog, browser SVG-to-canvas, Downloads, Trackpad/Touch และ WebMCP ระบบ managed preview สำหรับแอป static นี้ไม่รองรับ Browser QA ดูรายการตรวจเพิ่มเติมใน `TESTING.md`

ขอบเขต Project: 200 อุปกรณ์, 400 สาย, 200 Labels ใช้ native content-visibility และ lazy image loading สำหรับ Library ไม่ใช่ DOM virtualization ของ Catalog หลายพันรายการ ไม่มี server-side project storage, collaboration, rack placement หรือ 3D การเชื่อมต่อ PE เป็นข้อมูลของแบบและไม่ได้รับรองพอร์ตจริง

WebMCP ใช้ได้เมื่อ browser รองรับ `get_network_project`, `add_network_devices`, `connect_network_ports` ผ่าน state และ validation ชุดเดียวกับ UI

Bayface 1.2.0: neutral metal rack interiors and shelf backing, 25–300% zoom (Ctrl/⌘ + wheel), selected-rack/all-rack fit, free horizontal rack dragging with a common ground guide. Rack x positions round-trip through JSON/templates and Undo. Equipment drop U calculation compensates for zoom. Native browser drag/layout acceptance remains pending.
