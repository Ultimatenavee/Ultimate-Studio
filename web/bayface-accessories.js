'use strict';
(() => {
 const profiles=[
  {
    "id": "odf-commscope-760241650",
    "kind": "odf",
    "name": "ODF · CommScope 760241650",
    "brand": "CommScope",
    "model": "760241650",
    "units": 1,
    "connector": "LC/UPC duplex",
    "adapters": 12,
    "fibers": 24,
    "fiberMode": "Singlemode",
    "input": "",
    "output": "",
    "role": "Fiber termination / splice / patch",
    "useCase": "รับสาย Fiber เข้า POP / Access แล้ว patch ไปยังอุปกรณ์ ผ่าน 12 LC duplex adapters สำหรับ 24 เส้นใย",
    "sourceUrl": "https://www.commscope.com/product-type/frames-panels-cassettes-modules/fiber-panels-modules-cassettes/fiber-panels/item760241650/",
    "sourceTitle": "CommScope 760241650 · Specifications",
    "section": "General Specifications / Dimensions",
    "configuration": "รุ่น 760241650",
    "note": "Sliding 19-inch 1U · 12 adapters = 24 เส้นใย · ไม่ใช่ 24 duplex adapters",
    "checkedAt": "2026-10-09",
    "displayImage": "assets/bayface/commscope-760241650-front.jpg",
    "displayDimensions": {
      "width": 774,
      "height": 630
    },
    "displayFrame": [
      99,
      289,
      576,
      52
    ],
    "imageKind": "manufacturer-reference",
    "imageNote": "ภาพอ้างอิงจากผู้ผลิต"
  },
  {
    "id": "odf-commscope-fms1u-sc24",
    "kind": "odf",
    "name": "ODF · CommScope FMS 24 SC",
    "brand": "CommScope",
    "model": "FMS1U · 24 SC simplex configuration",
    "units": 1,
    "connector": "SC simplex",
    "adapters": 24,
    "fibers": 24,
    "fiberMode": "Singlemode",
    "input": "",
    "output": "",
    "role": "Fiber termination / splice / patch",
    "useCase": "จัดจุด splice และ patch สำหรับงาน Service Provider ที่ใช้หัว SC simplex",
    "sourceUrl": "https://www.commscope.com/product-type/frames-panels-cassettes-modules/fiber-panels-modules-cassettes/fiber-panels/fms1u-panels/",
    "sourceTitle": "CommScope FMS1U-PANELS · Product description",
    "section": "Product description / Fiber Management System",
    "configuration": "Configuration ในตระกูล FMS1U ไม่ใช่รหัสสั่งซื้อเฉพาะ",
    "note": "1U · เลือก SC simplex 24 adapters / 24 เส้นใย; ภาพเป็นตัวอย่างตระกูล",
    "checkedAt": "2026-10-09",
    "displayImage": "assets/bayface/commscope-fms1u-frontal-illustration.png",
    "displayDimensions": {
      "width": 2172,
      "height": 724
    },
    "displayFrame": [
      50,
      242,
      2072,
      228
    ],
    "imageKind": "reference-derived-illustration",
    "imageNote": "ภาพจำลองหน้าตรงจากภาพผู้ผลิต"
  },
  {
    "id": "ac-apc-ap9565",
    "kind": "power",
    "name": "AC PDU · APC AP9565",
    "brand": "APC",
    "model": "AP9565",
    "units": 1,
    "connector": "12 × IEC C13",
    "input": "AC 230V · 16A · IEC C20",
    "output": "AC 230V · 12 × IEC C13",
    "role": "AC distribution (PDU)",
    "useCase": "กระจายไฟ AC ไปยัง Switch / Router ใน Rack; ระบุชื่อ Feed A หรือ B ใน Label ได้",
    "sourceUrl": "https://www.se.com/th/th/product/AP9565/",
    "sourceTitle": "Schneider Electric / APC AP9565",
    "section": "Product name / Application",
    "configuration": "Horizontal rackmount 1U",
    "note": "PDU กระจายไฟ ไม่มีระบบสำรองไฟในตัว",
    "checkedAt": "2026-10-09",
    "displayImage": "assets/bayface/apc-ap9565-frontal-illustration.png",
    "displayDimensions": {
      "width": 2172,
      "height": 724
    },
    "displayFrame": [
      60,
      277,
      2054,
      179
    ],
    "imageKind": "reference-derived-illustration",
    "imageNote": "ภาพจำลองหน้าตรงจากภาพผู้ผลิต"
  },
  {
    "id": "ac-apc-smt1500rmi2u",
    "kind": "power",
    "name": "AC UPS · APC SMT1500RMI2U",
    "brand": "APC",
    "model": "SMT1500RMI2U",
    "units": 2,
    "connector": "4 × IEC C13",
    "input": "AC 230V",
    "output": "AC 230V · 1500VA / 1000W · 4 × IEC C13",
    "role": "AC backup (UPS)",
    "useCase": "สำรองไฟสำหรับ Network closet / POP ขนาดเล็ก ตามกำลังโหลดและแบตเตอรี่จริง",
    "sourceUrl": "https://www.se.com/th/en/product/SMT1500RMI2U/",
    "sourceTitle": "Schneider Electric / APC SMT1500RMI2U",
    "section": "Product name / Product highlights",
    "configuration": "Rackmount 2U",
    "note": "ภาพและขนาดสำหรับ Bayface; ไม่คำนวณระยะเวลาสำรองไฟ",
    "checkedAt": "2026-10-09",
    "displayImage": "assets/bayface/apc-smt1500rmi2u-frontal-illustration.png",
    "displayDimensions": {
      "width": 2172,
      "height": 724
    },
    "displayFrame": [
      40,
      163,
      2094,
      390
    ],
    "imageKind": "reference-derived-illustration",
    "imageNote": "ภาพจำลองหน้าตรงจากภาพผู้ผลิต"
  },
  {
    "id": "dc-vertiv-netsure211-1u",
    "kind": "power",
    "name": "DC Rectifier · Vertiv NetSure 211 · 1U",
    "brand": "Vertiv",
    "model": "NetSure 211 · 19-inch 1RU configuration",
    "units": 1,
    "connector": "DC distribution / GMT fuses",
    "input": "AC 120 / 208 / 240V nominal",
    "output": "−48V DC · 19-inch 1RU up to 40A",
    "role": "AC → DC rectifier + integrated distribution",
    "useCase": "แปลง AC เป็น −48V DC สำหรับ Access / FTTx / POP พร้อมกระจายไฟ DC ใน shelf เดียว",
    "sourceUrl": "https://www.vertiv.com/4a57b9/globalassets/products/critical-power/dc-power-systems/netsure-211-brochure.pdf",
    "sourceTitle": "Vertiv NetSure 211 Series DC Power System brochure",
    "section": "pp. 2–7: Application / Basic Configurations / Specifications",
    "configuration": "19-inch 1RU integrated shelf; ไม่ใช่รหัสสั่งซื้อเฉพาะ",
    "note": "เลือกจำนวน rectifier และ distribution ตามระบบจริง; แบตเตอรี่เป็นอุปกรณ์แยก",
    "checkedAt": "2026-10-09",
    "displayImage": "assets/bayface/vertiv-netsure211-1ru.jpg",
    "displayDimensions": {
      "width": 1170,
      "height": 120
    },
    "displayFrame": [
      15,
      10,
      1064,
      88
    ],
    "imageKind": "manufacturer-reference",
    "imageNote": "ภาพตัวอย่างตระกูล NetSure 211; ขนาดในแบบอ้างอิง Configuration 19-inch"
  },
  {
    "id": "dc-vertiv-netsure211-2u",
    "kind": "power",
    "name": "DC Rectifier · Vertiv NetSure 211 · 2U",
    "brand": "Vertiv",
    "model": "NetSure 211 · 19-inch 2RU configuration",
    "units": 2,
    "connector": "DC distribution / breakers / GMT fuses",
    "input": "AC 120 / 208 / 240V nominal",
    "output": "−48V DC · 19-inch 2RU up to 80A",
    "role": "AC → DC rectifier + integrated distribution",
    "useCase": "งาน POP / fixed หรือ wireless access ที่ใช้ −48V DC และต้องการ shelf แบบ 2U",
    "sourceUrl": "https://www.vertiv.com/4a57b9/globalassets/products/critical-power/dc-power-systems/netsure-211-brochure.pdf",
    "sourceTitle": "Vertiv NetSure 211 Series DC Power System brochure",
    "section": "pp. 2–7: Application / Basic Configurations / Specifications",
    "configuration": "19-inch 2RU integrated shelf; ไม่ใช่รหัสสั่งซื้อเฉพาะ",
    "note": "กำลังที่ใช้งานได้ขึ้นกับจำนวนโมดูลและสภาพแวดล้อม; แบตเตอรี่เป็นอุปกรณ์แยก",
    "checkedAt": "2026-10-09",
    "displayImage": "assets/bayface/vertiv-netsure211-2ru.jpg",
    "displayDimensions": {
      "width": 1175,
      "height": 206
    },
    "displayFrame": [
      2,
      7,
      1171,
      192
    ],
    "imageKind": "manufacturer-reference",
    "imageNote": "ภาพตัวอย่างตระกูล NetSure 211; ขนาดในแบบอ้างอิง Configuration 19-inch"
  }
];
 const optical=[];
 for (const size of [12,24]) {
  const small=size===12, model='OptiX OSN 9800 M'+size;
  optical.push({
   id:'huawei-osn9800-m'+size, kind:'dwdm', brand:'Huawei', model, name:'Huawei '+model,
   units:small?8:17, role:'DWDM / OTN subrack', connector:'DWDM',
   configuration:(small?'347.2':'747.2')+' × 442 × 295 mm (H × W × D)',
   useCase:small?'12 service slots (master) / 13 (slave)':'12 ช่องใหญ่หรือ 24 ช่องย่อยในโหมด 1:1',
   note:'ความสูงตาม Datasheet '+(small?'7.8':'16.5')+'U ปัดขึ้นเพื่อจัดวางบนกริด Rack',
   sourceTitle:'Huawei OptiX OSN 9800 M Series Datasheet', section:'Product specifications, p. 3',
   sourceUrl:'https://carrier.huawei.com/~/media/cnbgv2/download/products/networks/optix-osn-9800-m-en.pdf',
   slotSource:'https://messervices.cyber.gouv.fr/visas/ANSSI-CSPN-2025-07-cible.pdf#page='+(small?12:11),
   imageNote:small?'ภาพอ้างอิง Huawei CSPN Security Target รูป 2-3':'ภาพอ้างอิง Huawei OptiX OSN 9800 M24 Brochure',
   displayImage:'assets/bayface/huawei-osn9800-m'+size+'.webp',
   displayDimensions:small?{width:917,height:651}:{width:277,height:387},
   displayFrame:small?[0,0,917,651]:[0,0,277,387], imageKind:'manufacturer-reference',
   slotLayout:small?'M12':'M24',
   referenceCards:small?[
    {name:'AUX · IU73',image:'assets/bayface/huawei-m12-aux.webp'},
    {name:'PIU · IU100',image:'assets/bayface/huawei-m12-piu.webp'}
   ]:[{name:'CXP · IU71 (ตระกูล CXP)',image:'assets/bayface/huawei-m24-cxp.webp'}]
  });
 }
 const app=typeof window==='undefined'?globalThis:window;
 app.NOAH_BAYFACE_ACCESSORIES=profiles;
 app.NOAH_DWDM_CHASSIS=optical;
})();
