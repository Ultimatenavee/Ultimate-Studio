# Network Device Museum & Experience Center — v67

## เปิดใช้งาน

เปิด Datacenter Simulator แล้วกด **Device Museum** ด้านบน พื้นที่ Museum อยู่ทางตะวันตกของห้องเดิม ตาม Floor Plan ที่ผู้ใช้แนบวันที่2026-10-15 สามารถเดินผ่านประตูเชื่อมด้วยกล้องและ Renderer เดิม

- **Directory:** ค้นหาชื่อรุ่น Vendor หรือ Interface, เลือกหมวด และพาไปจุดจัดแสดง
- **Inspection:** คลิกอุปกรณ์หรือกดEเมื่ออยู่ใกล้ เปิดโมเดลหมุน360°,หน้า/หลัง/ด้านข้าง,Zoom,Specs,Interface list และลิงก์เอกสาร
- **Add to Rack:** ใช้ตัววางเดิม พาไปหน้าตู้ที่เลือกก่อนแสดง Landing U; ถ้าไม่มีRackจะเพิ่มตู้ว่างก่อนวาง ยังตรวจUทับซ้อนด้วยLogicเดิม
- **Add to Topology:** ในStudio iframe ส่งเฉพาะCatalog IDกลับโปรเจกต์ปัจจุบัน; standalone ใช้handoffครั้งเดียวที่หมดอายุ ไม่คัดลอกข้อมูลลูกค้าลงURL
- **Compare:** เลือก2รุ่นจากLibraryเดียวกัน
- **Navigation:** WASD,Shift,Ctrl,DragLook/MouseLook,TouchPad,Teleport,แผนที่ขยายได้,AutoTourตามเส้นทางที่ตรวจCollision
- **Graphics:** Low/Medium/High/Ultra,Animation toggle,ปรับความเร็วเดิน,ลดคุณภาพเมื่อRender FPSต่ำต่อเนื่อง;ค่าที่แสดงวัดจากรอบRenderจริง ไม่ใช่เป้าหมาย60FPSที่ตั้งไว้

## Phase outputs

| Phase | ผลลัพธ์ |
|---|---|
| Audit | Three.js0.186.1 / ESM, shared catalog, metre-scale collision, Bayface bridge, image-backed model limitations documented in integration plan |
| Architecture | Lobby west, Core/Switch/Access north, Fiber/Directory/Power center, Tools/Learning/Lounge south, Datacenter east, Exit12; glass walls/mullions,curved panels,bevels,cove/recessed lights,plants,reception,document shelves,directory map |
| Materials / lighting | PBR metal/satin/concrete/glass,procedural grain/joints,environment lighting,rectangular area lights,directional shadows,contact-shadow decals,ACES; no claim of path-traced output |
| Model pipeline | Same factory inMuseum/Datacenter/Inspector,real Library dimensions and front/rear imagery;high-detail mode adds image-derived shallow surface relief,not fabricated connector CAD;generic optics explicitly approximate |
| Exhibition | 40device/accessory records +9derived optical profiles;55display stations because accessories also appear inTools;gallery pages bound physical capacity asLibrarygrows;no second maintained device database |
| Walkthrough | Shared renderer/camera,continuous doorway,wall/column/podium/furniture collision,speed controls,acceleration/deceleration,collision-aware AutoTour |
| Interactions | Proximity prompt,360viewer,actualSpecs/Interfaces,Compare,Datasheet,Add toRack/Topology |
| Integration | Existing Rack metadata/U/serial/power/card configs/fiber/airflow/saved projects unchanged;async restoration settles before subsequentplacementfocus |
| Performance | Lazy museum chunk,near-distance model loading,shared cropped/downsampled face textures(max1536px),architecture instancing,culling,physical gallery paging,resource cleanup,adaptive graphics |
| Validation | Full npmtest and Workerbuild; new layout/nav/bridge tests;real Three math/renderer doubles;55full models constructed with80face image loads in offline geometry QA;image-relief groups checkedfinite. No real browser/GPU benchmark in this environment |

## Accuracy / remaining acceptance limits

- Current models are **Approximate / Reference-based**, withUnverified status wheredimensions are unverified. They are not vendor CAD. Image-based relief is a visualization; itsdepth is not measured port/PSU/fan geometry. Unreferenced side surfaces stay neutral rather than inventing vents/modules.
- No licensed manufacturer GLB assets exist in the current Library. Shared procedural components are used;GLB/KTX2/Draco are not claimed to have been implemented where no such assets exist.
- Only existing catalog items are shown. Nokia/AP/ONT/QSFP-DD not present in the source catalog were not invented.
- GPU PBR appearance, browserconsole,mobilegesturebehavior,and60FPS target require actual browser/hardware verification. Offline image-backed geometry checks do not reproduce WebGL PBR, depth-buffering, reflections or final lighting. No CPU-rendered image is shipped as a Museum screenshot.
- No full ray tracing,SSR or postprocess bloom is claimed. Lighting uses real-time direct/environment and contact approximations.
- This release provides the working integratedMuseum. The **photorealistic visual acceptance remains open** until reviewed on actual GPU/browser; do not call it certified final photorealistic output solely from the automated checks.

## Main changed source

- `src/datacenter/museum-layout.js`, `museum-world.js`, `museum-navigation.js`, `museum-ui.js`, `museum-optics.json`, `optical-model.js`, `texture-assets.js`
- Shared integration: `scene.js`, `entry.js`, `navigation.js`, `device-model.js`, `viewer-scene.js`, `viewer-ui.js`, `simulator-editor.js`, `studio-viewer.js`
- UI/build: `web/index.html`, `web/museum.css`, generatedESMchunks, `scripts/sync-datacenter-catalog.mjs`
- Checks: `scripts/verify-museum.mjs`, `verify-museum-bridge.mjs`, expanded`verify-simulator-scene.mjs`, optional`verify-museum-assets.mjs`
