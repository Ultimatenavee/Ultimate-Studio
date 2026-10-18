# Ultimate Topology Studio — Source Code v111

Site release: v111
Source commit: f86c588e99ef8b34291b3c401ab7b387a84af74f
The npm package version is independently recorded as 1.7.0 in package.json.

## เริ่มใช้งานในเครื่อง

ติดตั้ง Node.js และ npm แล้วเปิด Terminal ในโฟลเดอร์นี้:

```sh
npm ci
npm run build
npm run local
```

เปิด http://127.0.0.1:8080 ใน Browser และหยุด Server ด้วย Ctrl+C
เปิดโฟลเดอร์นี้ใน Codex เพื่อพัฒนาต่อได้ หรืออัปโหลดเข้า GitHub Private Repository

## สิ่งที่รวมมา

- src/ — Source ของ Datacenter, Device Library, Garden, Temple และ 3D viewer
- web/ — หน้าเว็บ Studio, ข้อมูลอุปกรณ์, Interface, ภาพ, โมเดล และ assets ที่ใช้งาน
- server/ — API ของ Shared Templates / Reviews และ validation
- db/, drizzle/ — schema และ migrations ของฐานข้อมูล
- scripts/ — build, local server และชุดทดสอบ
- tools/, assets-source/, research/ — เครื่องมือสร้างโมเดล, งานต้นฉบับ และข้อมูลอ้างอิง
- desktop/ — Source และขั้นตอน Build โปรแกรม Windows; ไม่ใช่ไฟล์ EXE สำเร็จรูป
- package.json, package-lock.json, README.md, CHANGELOG.md และเอกสารเดิม

## ขอบเขตของชุด Source

เป็นไฟล์ที่ติดตามใน Source Repository ณ commit ข้างต้น พร้อมเอกสารส่งมอบนี้
ไม่รวมประวัติ Git, node_modules, ผล Build ที่สร้างใหม่ได้, credentials หรือฐานข้อมูลบน Server
Shared Templates และ Reviews ที่บันทึกอยู่บนเว็บไซต์ไม่ได้ถูกส่งออกมาพร้อม Source
Local mode ใช้ Template ใน Browser ของเครื่องนั้น; การแชร์ข้ามผู้ใช้ต้องใช้ Backend / DB
การเปิด index.html ตรง ๆ ด้วย file:// ไม่ใช่วิธีเปิดแอปเต็มรูปแบบ ให้ใช้ local server

## สถานะโมเดลพระพุทธรูป

โมเดลที่แสดงบนเว็บเป็นชุดเสถียร v108
โมเดลทดลอง Hunyuan3D อยู่ใน assets-source/sculpt/neural-v109/ และยังไม่ใช่ตัวแทนที่เผยแพร่จริง
โมเดลทดลองยังไม่ถึงคุณภาพ Meshy และมีเงื่อนไขเรื่องพื้นที่เผยแพร่ โปรดอ่าน web/HUNYUAN-LICENSE.txt
ห้ามย้ายโมเดลทดลองเข้า web/ โดยไม่ตรวจสิทธิ์ก่อน

## ข้อมูลลูกค้า

ไม่มีไฟล์ PowerPoint ต้นฉบับของลูกค้าอยู่ในชุดส่งมอบนี้
รักษาการบล็อกไฟล์ .pptx และอย่านำไฟล์ต้นฉบับที่มีข้อมูลลูกค้าไปเผยแพร่เป็น public assets
