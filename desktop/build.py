from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
with zipfile.ZipFile(root/'desktop/web.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted((root/'web').rglob('*')):
  if not p.is_file():continue
  if p.suffix.lower()=='.pptx':raise RuntimeError('Never package source PPTX')
  data=p.read_bytes();name=str(p.relative_to(root/'web'))
  if name=='studio.html':data=data.replace(b'<head>',b'<head><script src="offline.js"></script>')
  if name=='templates.js':
   data=data.replace('ทุกคนเห็นรายการเดียวกัน'.encode(),'เก็บเฉพาะใน Browser ของเครื่องนี้'.encode()).replace('บนเว็บไซต์แล้ว'.encode(),'ในเครื่องแล้ว'.encode()).replace('ออกจากเว็บไซต์สำหรับทุกคน?'.encode(),'ออกจากเครื่องนี้?'.encode())
  z.writestr(name,data)
 z.write(root/'desktop/offline.js','offline.js')
print('Built offline web.zip from current runtime only')
