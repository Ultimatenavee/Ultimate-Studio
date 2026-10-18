# Ultimate Topology Studio — Windows Offline

เวอร์ชัน Board update 2026-10-13 / Windows x64

## ติดตั้ง
1. แตก ZIP แล้วเปิด UltimateTopologyStudio-Setup-x64.exe
2. กด Yes เพื่อติดตั้งสำหรับ Windows user ปัจจุบัน ไม่ต้องใช้ Administrator
3. ใช้ Shortcut Ultimate Topology Studio บน Desktop หรือ Start Menu
4. โปรแกรมเปิดใน Browser ของเครื่องที่ http://127.0.0.1:18765/studio.html

ไฟล์โปรแกรมอยู่ที่ %LOCALAPPDATA%\UltimateTopologyStudio
ไม่ต้องติดตั้ง Node.js, Python หรือ Go และไม่ต้องใช้อินเทอร์เน็ตสำหรับงานออกแบบหลัก

## การใช้งาน
- Topology / Bayface / Device Specs / JSON / JPEG / PDF / PowerPoint ใช้ไฟล์ที่รวมไว้ในโปรแกรม
- Copy device: คลิกขวาที่อุปกรณ์ > Copy device หรือใช้ Ctrl+D / Ctrl+C แล้ว Ctrl+V
- ขนาดเท่ากัน: เมนูจัดแนว / Group > ทำขนาดอุปกรณ์เท่ากัน เลือก 2 ตัวขึ้นไปเพื่อทำเฉพาะที่เลือก ไม่เลือกเพื่อทำทั้ง Board
- Templates เก็บใน Browser ของเครื่องนี้ ไม่แชร์กับเว็บหรือผู้อื่น ไม่ดึง Cloudflare API
- Shared Review ใช้ไม่ได้ใน Offline mode
- ดาวน์โหลด Project เป็น JSON สำหรับสำรอง/ย้ายเครื่อง Browser storage ไม่ใช่ไฟล์สำรอง
- เอกสาร Vendor ที่เป็นลิงก์ภายนอกต้องมี Internet หากต้องการเปิด
- ก่อนปิดให้บันทึกงาน แล้วกด ปิดโปรแกรม Desktop ด้านบนเพื่อหยุด Local Server การปิดแค่ Browser ไม่หยุด Server
- ก่อนติดตั้งอัปเดตให้ปิดโปรแกรม Desktop ที่กำลังรันอยู่

## ถอนการติดตั้ง
ปิดโปรแกรม Desktop แล้วลบโฟลเดอร์ %LOCALAPPDATA%\UltimateTopologyStudio และลบ Shortcut บน Desktop/Start Menu
ข้อมูล Browser ไม่ถูกลบอัตโนมัติ ดาวน์โหลด JSON ก่อนล้างข้อมูล Browser

## ข้อจำกัดการตรวจสอบ
เป็นไฟล์ EXE จริงแบบ Windows x64 GUI ที่สร้างด้วย Go ไม่มี Digital Signature
ตรวจโครงสร้าง EXE, embedded assets, Local HTTP Server และการ Export แล้ว
ยังไม่ได้ทดสอบ Installer/Shortcut บน Windows จริง หรือทดสอบ UI ใน Browser จริง
ไม่มี PowerPoint ต้นฉบับที่มีข้อมูลลูกค้าในแพ็กเกจ มีเฉพาะโค้ด Export Template สะอาด

## Build จาก source
ต้องมี Go 1.25+ และ Python 3 สำหรับสร้าง bundle เท่านั้น (ผู้ใช้งาน EXE ไม่ต้องมี)
python desktop/build.py
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -C desktop -trimpath -ldflags "-s -w -H windowsgui" -o UltimateTopologyStudio-Setup-x64.exe .
