## Absolute nodes/edges JSON import

- Import positioned and sized Internet, PE, Switch and CPE nodes through the existing JSON dialog.
- Preserve headers, badges, metadata, endpoint sides, line styles, arrowheads and viewBox through project and template round-trips.
- Add cloud icon support, export arrowheads and focused import regression checks.

## Selected Ragnarok town and interior lighting

- Applied L047 ×32, L026 ×2, L027 ×2 and L013 ×2 outdoors, with supported bases, paired garland posts and clear walking routes.
- Added L241 ×4 in the temple hall, L233 ×2 in Library reception and L238 ×2 in the Datacenter side entrance area; chandeliers remain indoors.
- Added persistent warm night fill across all reachable town routes, with eight nearby point lights and instanced fixtures. Verified source geometry support, garland clearance and GAT coverage/connectivity.
- Removed the unused Library–Datacenter doorway/sign in Ayothaya, finished the wall and retained both lobby return portals and the original rack systems.

## Local Ayothaya live preview, arrival view and town lighting

- Matched the supplied north-facing arrival composition with ship foreground and temple backdrop; retained the whole-area overview.
- Wardrobe selections now preview automatically, with slot clearing, responsive selectors, latest-selection race protection and decoded/disk sprite caches.
- Reduced wearer height by approximately 12% while preserving movement/collision scale. Added wheel zoom in first and third person across all four maps; third-person zoom retains camera wall clearance.
- Expanded to 36 terrain/deck-supported town lanterns and six hall lanterns, with night glow across the map and eight nearby point lights at a time.
- Verified original regression tests, portal traversal, live preview races, actual wheel input, saved outfits, mobile layout and preserved rack behavior.

## Local Ayothaya wardrobe and temple lighting

- Fixed rapid standing head turns by holding the original forward idle pose; walking keeps original ACT timing.
- Added a closer initial town composition and a continuation of the original sea, retaining explicit whole-map overview.
- Added eight standing lanterns along the temple approach and six lanterns suspended in the hall, with warm lights and halos controlled by day/night.
- Added a searchable Human/Doram wardrobe with sex, class/costume, hair, original palettes, head accessories, garment/wings, weapon and shield choices. Preview, rotate, walk, apply, reset and saved cross-map appearance are supported.
- Indexed local SPR/ACT pairs and compatible garment variants; the local server renders only the selected outfit. The game client is read-only, and no hosted deployment was made.

## Local Ayothaya player and laboratory update

- Added an original Ragnarok Novice sprite with eight-direction idle/walk animation and a First Person / Third Person switch across all maps. Follow-camera collision preserves the original player position, navigation, warps and interaction distance.
- Corrected dark painted building and palace gatehouse materials while preserving alpha cutouts and night tint.
- Replaced scattered lab props with scaled metal storage, repair benches, chairs and extinguishers; installed Verus/Werner consoles on supported service benches and kept entrance/rack aisles clear.
- Fixed overview zoom jumping to its target. Verified full portal round trips in both perspectives, original regression checks, camera clearance, rack behavior and desktop/portrait screenshots.

## Local Ayothaya visual update

- Restored richer source-art colors with neutral tone mapping and removal of the duplicate imported sun.
- Added persistent day/night sky switching, clouds, sun/moon, stars and outdoor night lighting.
- Added original Ragnarok animated warp sprites to all six doors, a short transition effect, temple furnishings and source textures, plus laboratory props and scientist sprites in both preserved equipment rooms.
- Calibrated eye height to the town asset scale; retained original controls, overview, rack dimensions and equipment behavior. Furniture has collision and leaves the portal routes clear.
- Verified original regression tests, complete walking round trip, rack/library behavior, asset loading, sky persistence, sprite timing and portrait controls.

## Local Ayothaya campus integration

- Replaced the active outdoor campus with the locally supplied Ayothaya town, preserving texture cutouts and using its GAT walkable grid and elevations.
- Added the main-temple portal, separate central hall, left Device Library / right Datacenter portals and return routes with fade, input clearing and cooldown.
- Preserved the existing museum, rack editor, physical U placement, power calculations, storage and Studio workflows behind separate indoor maps.
- Added per-map navigation, full-scene camera fitting, suspended inactive renderers, regression checks and desktop/portrait browser round-trip tests.
- This is a local source/build update; no hosted deployment was made.

## v111 — Restore stable public sculpture; retain new mesh privately

- Restored the tested v108 public sculpture and original loader/UI. The new Hunyuan3D mesh remains in private authoring files and is not shipped in the hosted client.
- A production HTTP check showed that Sites serves existing static assets before the Worker despite the supplied Worker-first setting. The attempted regional guard did not protect the model files. v110 removed those files from public static assets; v111 restores the prior public visual quality.
- Added a build-time guard against putting the restricted candidate back in the public asset tree. Removed the ineffective runtime regional guard.
- TRELLIS and InstantMesh generation were rejected by the public GPU quota. The requested Meshy-level replacement is not completed. No customer PowerPoint files are included.

## v109 — New neural Buddha in the temple

- Replaced the v108 procedural sculpture at runtime with a newly generated image-conditioned 3D mesh, finished in Blender with subtle bronze cavity shading.
- Shipped one-draw-call 620k/detail and 140k/walking LODs. Existing near-altar lazy loading, quality selection, fallback and disposal remain intact.
- Added trusted-edge regional delivery for the generated assets, a fail-closed availability check, license/provenance page and an AI-generated notice at the temple action. Excluded/unknown regions retain the original native sculpture; the rest of Studio stays available.
- Routed assets through the Worker before serving so regional checks and the existing customer PowerPoint privacy block cannot be bypassed by static-file delivery.
- Checked actual GLBs, loader/access lifecycle, temple navigation, UI and rack regressions; Blender renders reviewed. Browser/GPU QA was not available. Fine face/finger detail remains less defined than the Meshy reference.

## v108 — Original carved robe and lotus model

- Authored original 3D robe tension folds, hanging fabric, bent sleeve pleats and thick lotus petals with recessed veins on the v107 anatomical master.
- Combined the sculpt surfaces and closed the pedestal seat; removed intersecting draft knee panels before export.
- Kept the v107 face, anatomical hands, hall placement and original bronze maps. No Meshy model or texture download is used.
- Retopologized the combined body, reduced draw calls and exported independent detail/walking assets. Runtime asset keys now use revision 108.
- Added the Blender authoring recipe and provenance. Actual model/LOD/material bounds and loading lifecycle are verified. This is an original artistic prototype, not a claim of matching the referenced artist's quality; browser/GPU verification remains unavailable.

## v107 — Buddha geometry refinement

- Re-sculpted the central statue's jaw/cheeks, eyelids, nose, mouth, ears, neck, shoulder/sleeve transitions, robe folds, covered knees and scalp proportions for a more graceful temple sculpture.
- Added a packed, original procedural bronze normal texture that survives glTF export. Kept both outward/upward hand frames and existing hall placement.
- Added a reproducible Blender finishing pass and matched neutral-clay v105/v107 comparison; bumped runtime asset cache keys to 107.
- Kept lazy loading, detail/walking LODs and all Rack/Studio/network data. This is an artistic interpretation, not an exact historical reconstruction or a scanned statue.
- Validated the actual GLB geometry/materials/budgets, hand orientation, asset lifecycle, temple/rack navigation and production build. Blender renders reviewed; browser/GPU validation is unavailable.

## v106 — Rack navigation and editing controls

- Moved the Rack camera popup outside the scrolling toolbar so front/rear/elevation controls remain accessible.
- Selecting a Rack opens Device Library automatically; L toggles the list with repeat/typing/modifier protection.
- Rack views release campus framing, preserve a return pose, and consume Escape to leave Rack editing before other scene actions. Placement/drag cancellation takes priority.
- Fullscreen requests Escape-only Keyboard Lock where available. Unsupported/denied browsers retain their own Escape behavior; the explicit exit button remains available.
- Validated entry wiring, actual L handler, real Three camera navigation with a mocked renderer, Rack/Bayface data preservation and production build. Browser/GPU fullscreen verification remains unavailable.

## Topology canvas density · 2026-10-13

- Compact desktop Topology header/navigation/toolbars and use narrower default resizable sidebars.
- Keep primary design tools visible; move secondary tools into More, and reveal CID/Hop controls on demand.
- Reduce phone/iPad chrome while retaining touch-sized targets, Library/Inspector panels, all exports and gesture controls.

## Bayface workspace density · 2026-10-13

- Share one Library scroll viewport for ODF/AC/DC and device sections.
- Compact Bayface header/navigation/tools, cap desktop Library width at 320px, and consolidate export actions without removing formats.
- Preserve responsive panels, resize controls, drag/U mapping and presentation behavior.

## Bayface hardware cards · 2026-10-13

- Render ODF/AC/DC Library cards with the same brand, artwork, model and metadata hierarchy as device cards.
- Use a shared hardware surface for device and accessory Rack items; retain vendor U, colors, selection, drag preview and exports.

## Board and Windows offline update · 2026-10-13

- Add explicit Copy device on context menu/Inspector; retain existing keyboard copy shortcuts.
- Anchor every link to the displayed artwork bounds for all sizes, Internal/External styles and iStack; fan parallel links while retaining their requested spacing.
- Add equal device sizing for selected devices or the full Board, preserving centers and Undo.
- Add a standalone Windows x64 per-user installer with embedded runtime assets, loopback-only local server and browser-local Templates. No source PPTX or cloud upload is included.
- Verify 106 behavior groups, API/responsive contracts, native exports, local HTTP serving and Windows PE structure. Native Windows installation and browser interactions remain unverified.

## Workspace update · 2026-10-13

- Preserve original PE dimensions in External projections, preventing render/preview/export size changes.
- Add explicit Smart X/Y center alignment for nearby devices with selection scope and Undo.
- Open workspace chooser on every load; use supplied Ultimate Topology Studio branding.
- Add five generated transparent Glass 3D External icons with per-device choice, JSON/shared-template persistence and exports.
- Validate 103 application behavior groups, 11 SQLite API groups, responsive contracts and native export structure. Browser interaction remains unverified.

## 1.6.1 · 2026-10-10

- Add live dashed horizontal/vertical alignment suggestions for dragged equipment, selected groups and Library placement.
- Compare edges and centers against stationary visible equipment with a six-screen-pixel tolerance at every zoom level; emphasize exact alignment.
- Keep drag coordinates free, and clear guides on drop, release, cancellation and project rendering. Guides are transient and excluded from saved/exported projects.

## 1.6.0 · 2026-10-10

- Remove fixed landing/content width caps; scale network artwork, typography and entry cards from phone through ultrawide viewports.
- Make the workbench fill remaining viewport height; use compact Library, Inspector and Spec filter modal panels for narrow/touch screens without overwriting desktop preferences.
- Keep all project/export tools accessible in a compact actions menu; use tap-to-add at the visible topology center and preserve Rack drafts across panel transitions.
- Add anchored two-finger zoom/pan to both canvases, cancelling one-pointer edits first and suppressing residual clicks.
- Add touch-sized controls, horizontally scrollable tools, safe-area padding, phone landscape layout and keyboard-aware dialogs.
- Validate 82 existing behavior groups, six responsive/event contracts, stylesheet parsing and actual landing canvas renders at multiple sizes. Native browser layout and physical iPhone/iPad acceptance remain unverified.

## 1.5.0 · 2026-10-09

- Add a landing route with interactive provider-network canvas scenes, motion pause/reduced-motion support and direct workspace entries.
- Keep the editor at studio.html and retain previous root Review links through a redirect.
- Add a separate Device Specs tab, 40 existing hardware/accessory entries, detailed grouped specifications, filters and 2–3 model comparisons. Preserve all meaningful uploaded Matrix values with provenance.
- Expand project title across the header with automatic wrapping; preserve long names through JSON, duplicates, shared templates and Reviews.
- Refine Regular-style glass control surfaces with readable content, accessibility fallbacks and greater Bayface caption spacing.

## 1.4.2 · 2026-10-09

- Clear equipment selection on blank Bayface clicks and select reliably on pointer release.
- Move ODF/AC/DC into a visible, illustrated Bayface Library section with drag-and-drop landing previews.

## 1.4.1 · 2026-10-09

- Bayface hand/select tools; drag empty space or use Hand over racks to pan the viewport without modifying project data.
- Pointer capture, drag click suppression and cancellation keep panning separate from equipment/rack moves.

## 1.4.0 · 2026-10-09

- Add six manufacturer-grounded ODF/AC/DC Bayface profiles, frontal artwork and source links.
- Preserve accessory identity across Smart U placement, editing, Undo, JSON and shared templates.
- Embed all accessory artwork in Bayface exports; retain legacy generic power items.

## 1.3.0 · 2026-10-09

- Smart U finds the nearest contiguous empty range for multi-U equipment; disable it for exact placement.
- Arrow Up/Down moves selected equipment one U with collision/overflow guards and Undo. Pointer drag shows translucent artwork and the actual landing U, with cancellation and cross-rack movement.
- Rack/item Inspector sections collapse independently; close/reopen and pointer/keyboard resize.
- Bayface presentation fits all racks and hides editing controls; Escape exits.
- JPEG/PNG/SVG/PDF/PowerPoint exports follow the active tab. Bayface PowerPoint is a flattened image on a slide; Export Center supports scale, background, viewport and captions.
- 73 application/event groups pass; actual JPEG/PDF/PPTX generated and inspected. Native browser gesture/layout acceptance remains unverified.

## 1.2.1 · 2026-10-09

- Audited rack dimensions for all 34 visible models; source links distinguish vendor U, derived occupancy, and the FortiGate manufacturer datasheet mirror.
- PE defaults: F1A 1U, M8 3U, M14 5U, X4 10 occupied slots for a 9.8U chassis, NE40E-X8A 21U. Existing custom heights remain editable with a validated reference-size action.
- Delete routes to the active Topology/Bayface selection and ignores text editing.
- Area color updates device and reserved surfaces immediately and persists into exports.

## 1.2.0

- Bayface hardware uses neutral dark rack/shelf surfaces with original device proportions.
- Zoom controls and selected/all-rack fit; Ctrl/Command + wheel zoom.
- Drag rack handles freely along a shared base; dashed ground and edge guides during movement.
- Rack positions persist in JSON/templates and export with aligned bases; movement supports Undo and cancellation.

# Changelog

## 1.1.0 · 2026-10-09

- เพิ่มแท็บ Bayface: Rack elevation หลายตู้ พร้อม U, ภาพอุปกรณ์เดิม, ชื่อด้านข้าง, พื้นที่จองและอุปกรณ์ประกอบ.
- ตรวจ U ซ้อน/เกินตู้, ลากข้ามตู้, แก้ชื่อ/Phase/ความสูง, Undo และเก็บ Bayface ใน Project/Templates โดยไม่เปลี่ยน Topology.
- Export SVG/PNG พร้อมภาพ embedded และ font ไทย.
- ปรับ semantic foreground/background ทั้ง Day/Night; คู่สีหลัก/รอง/ปุ่ม/error ผ่าน 4.5:1 และข้อความบน reserved blocks เลือกขาว/ดำอัตโนมัติ.
- 62 app/event + 9 API groups รวม Bayface-only Templates, JSON round-trip และ overlap rejection; Bayface SVG/PNG สามตู้ render/inspect แล้ว.

## 1.0.1 · 2026-10-09

- เพิ่มปุ่มวาง JSON โดยตรงบนแถบหลัก และปุ่มอ่าน Clipboard ในหน้าสร้าง Topology.
- หน้าเทียบเวอร์ชันรองรับกล่องวาง JSON, ปุ่ม Clipboard และปุ่มเปรียบเทียบ โดยยังเลือกไฟล์ได้.
- เมื่อ Clipboard ว่าง/ไม่อนุญาต/ไม่รองรับ จะเก็บข้อความเดิมและแนะนำ Ctrl+V / ⌘V; อ่านเฉพาะเมื่อกดปุ่ม และไม่แก้ Canvas จนสั่งนำเข้า.
- ผ่าน 55 app/event groups รวม Clipboard สำเร็จ/ปฏิเสธ/ว่าง และ JSON comparison error.

## 1.0.0 · 2026-10-09

- เพิ่ม Design tools: ตรวจแบบ/Redundancy, CID เส้นทาง, จำลอง Down ตาม connectivity, เทียบเวอร์ชัน, Site Groups, CSV inventory และ Review snapshots/comments/status.
- เพิ่มเต็มจอและไฮไลต์ Main ทีละ Hop ในโหมดนำเสนอ.
- Templates แก้ไข/ลบ, Tags, shared Favorite, Preview และ revision conflict protection.
- เพิ่ม Site/Cable route/collapsed ลงการบันทึกโดยคงข้อมูลเดิม; migration ใหม่เก็บ Templates เดิมไว้.
- ตรวจสอบ 53 app/event + 9 design logic + 8 API groups และ actual exports; native browser acceptance ยังไม่รับรอง.

## 0.9.0 · 2026-10-09

- เพิ่ม Smart Uplink เมื่อสร้างจาก ACM JSON: ยกความเร็ว HOP ก่อนหน้าให้ไม่น้อยกว่า Access ถัดไป ทั้ง Main/Backup และไม่นับ Interconnect
- คง Uplink ที่มีความเร็วสูงกว่า พร้อมแจ้งว่าเป็นเกณฑ์ของแบบ ไม่มี Live port verification
- ปรับ Element geometry/Palette ด้วย Lucide SVGs และเก็บ LICENSE ต้นฉบับ
- เพิ่มลากมุม 4 จุดเพื่อ resize Elements อย่างอิสระ รองรับ zoom, cancel, Undo/Redo และ persistence; ขั้นต่ำ 32×32px
- ถอด Snap และ Auto Layout จาก UI/settings/handlers รวม automatic alignment snapping ระหว่างลาก
- ผ่าน 47 กลุ่มทดสอบแอป, 6 กลุ่ม API/SQLite และ Export ทั้งห้ารูปแบบ

## 0.8.0 · 2026-10-09

- แยก Templates ที่เก็บบนเว็บไซต์ออกเป็นปุ่มหลัก และเปลี่ยน Save file เป็นดาวน์โหลด JSON
- Project menu ใช้ native dialog top layer เพื่อแก้การถูกแผง Liquid Glass บัง
- เพิ่ม New Project บน Canvas Toolbar พร้อมเก็บงานก่อนหน้าในเครื่องและ Undo
- ลบ Port Mapping และ Command Palette / Ctrl+K
- เพิ่ม Elements 8 รูปทรง รองรับสี ขนาด ข้อความ เส้นขอบ การย้าย Copy/Paste/Group และ persistence ใน Project/Shared Templates
- Export Elements ครบทั้ง 5 รูปแบบ พร้อม native editable PowerPoint shapes
- เพิ่ม S6730-H24 เป็นชื่อย่อของโปรไฟล์ H24X6C และแสดง SKU เต็ม
- ผ่าน 45 กลุ่มทดสอบแอปและ 6 กลุ่ม API/SQLite; native browser acceptance ยังไม่ครบ

## 0.7.0 · 2026-10-09

- เพิ่ม Huawei Switch 7 รุ่น, Hitachi/APRESIA Switch 3 รุ่น และ Huawei NE40E-X8A แบบ PE image-only รวม 34 รุ่น
- เก็บข้อมูลและภาพอ้างอิงจากผู้ผลิต พร้อมระบุรุ่นย่อยและข้อจำกัด SKU/license
- เพิ่ม QSFP+ 40GE / QSFP28 100GE, Optics/Fiber validation และ APRESIA15000 shared-port banks
- เพิ่มภาพจำลองโปร่งใส 11 รุ่นด้วย built-in imagegen; เก็บ PNG ต้นฉบับและส่ง lossless WebP ที่มี RGBA ตรงกัน
- ผ่าน 44 กลุ่มทดสอบแอป, 5 กลุ่ม API/SQLite และ Export จริงพร้อม Gallery 34 ภาพ; Native browser acceptance ยังรอตรวจ

## 0.6.0 · 2026-10-09

- ชื่ออุปกรณ์ใหม่ไม่มีเลข -1/-2 ต่อท้าย และ MTU ใหม่เริ่มที่ 9216
- Device Library ปรับความกว้างด้วยการลาก / keyboard และจำขนาดในเครื่อง
- ลาก Link, จุดหักมุม และ Link Label ได้แยกกัน; ระยะเส้นคู่ 2 Grid และ Label แนวตั้งอยู่ด้านข้าง
- ไม่เติม MAIN / BACKUP ในข้อความ Label; ยังคงสีและเส้นประเพื่อแสดงบทบาท
- วาง JSON หรืออัปโหลด .json/.txt เพื่อสร้าง Topology จาก NOAH หรือ ACM HOP JSON
- ACM parser ซ่อม newline ใน string, รวม Node ซ้ำ, อ่าน Backup/Interconnect, เก็บ Interface และ MTU ที่ระบุในไฟล์
- รุ่นที่ไม่มีใน Library แสดงเป็นชื่อรุ่นจากไฟล์ ไม่มีภาพหรือสเปกของรุ่นอื่นแทน และไม่บันทึก URL/Token/Password จาก source
- Shared Templates เก็บใน D1: ทุกคนเห็นรายการเดียวกัน เปิดเป็นสำเนาใหม่ และ retry ไม่สร้างข้อมูลซ้ำ
- ตำแหน่ง Link/Label/waypoints และ placeholder ของรุ่นที่ไม่รู้จักรองรับ JSON, SVG, JPEG, PNG, PDF และ PowerPoint

## 0.5.0 · 2026-10-08

- ปรับ UI เป็น Liquid Glass: แผงโปร่งแสง ขอบสะท้อน เงา และตัวควบคุมทรง pill
- ปรับ Library, Inspector, toolbar, dialogs และเมนูให้ใช้วัสดุเดียวกันทั้ง Dark/Light
- รักษา Topology, Link labels, Enter save, Inspector resize และ Export ตามเดิม
- รองรับ reduced motion / transparency และ fallback เมื่อไม่รองรับ backdrop blur

## 0.4.4 · 2026-10-08

- Enter บันทึกค่าจาก Project name, Inspector, Physical View และฟอร์มการเชื่อมต่อ / Label / Settings
- Inline Label ใช้ Enter บันทึกและ Shift+Enter ขึ้นบรรทัดใหม่
- ใช้ validation เดิมและบันทึกในเครื่องทันที; ไม่บันทึกระหว่าง IME composition

## 0.4.3 · 2026-10-08

- เปิดโปรแกรมด้วย Topology ว่างทุกครั้ง ไม่มีอุปกรณ์ สาย หรือ Label
- ยกเลิกการเปิดตัวอย่างและกู้คืนงานล่าสุดอัตโนมัติ; งานเดิมเลือกเปิดได้จาก Project ในเครื่อง
- หน้าว่างเริ่มต้นไม่เขียนทับหรือเพิ่มรายการในงานที่บันทึกไว้
- ตรวจสอบ 34 กลุ่มพฤติกรรม รวมการเริ่มว่างและเปิดงานเดิมด้วยตนเอง

## 0.4.2 · 2026-10-08

- เปิดโปรแกรมด้วย Topology ตัวอย่างเมื่อยังไม่มีงานหรือ Project ล่าสุดใน Autosave ว่าง
- กู้คืนงานเดิมที่มีอุปกรณ์หรือ Label; งานว่างยังเปิดได้จาก Project ในเครื่อง และ Project ใหม่ยังเริ่มว่างได้
- ผ่าน 34 behavior groups รวมการเริ่ม runtime ใหม่เพื่อทดสอบ Autosave recovery และการเก็บ draft

## 0.4.1 · 2026-10-08

- ปรับ Link Label: Main อยู่เหนือเส้น Main, Backup อยู่ใต้เส้น Backup บน Canvas และ Export ทั้ง 5 รูปแบบ
- คำนวณการจัดวางและพื้นที่ Export แยกด้านบน/ด้านล่าง พร้อมระยะห่างจากสายและอุปกรณ์
- ตรวจ role changes, endpoint direction, curved/straight/orthogonal links และไฟล์ Export จริง

## 0.4 · 2026-10-08

- โหมดเลือก: ลากพื้นที่ว่างเพื่อเลื่อน Canvas แบบมือจับ; Shift + ลากเพื่อเลือกเป็นกรอบ โดยคง Space/เมาส์ปุ่มกลางไว้
- Link Label เป็นข้อความเหนือสาย ไม่มีกรอบคั่นกลาง บน Canvas และ Export ทั้ง 5 รูปแบบ; ขยับข้อความของสายแนวตั้งให้อยู่ข้างสาย และคง Main/Backup/Interface/CID/VLAN
- เพิ่ม Filter PE สำหรับ Huawei NetEngine 8000 F1A/M8/M14/X4 ใช้ร่วมกับ Brand/Search ได้
- เพิ่มขอบจับปรับความกว้าง Project Inspector พร้อม keyboard controls, cancel/reset, responsive limits และบันทึกขนาดในเครื่อง
- ผ่าน 33 behavior groups และตรวจไฟล์ Export จริงพร้อม render PDF/PowerPoint; Browser QA ยังมีข้อจำกัดตาม TESTING.md

## 0.3 · 2026-10-08

- เพิ่มภาพมุมหน้าตรง พื้นหลังโปร่งใสด้วย built-in imagegen ครบ 23 รุ่น; เก็บภาพอ้างอิงและ Hotspot เดิม
- เพิ่ม PE Huawei NetEngine 8000 F1A/M8/M14/X4 แบบภาพและชื่อรุ่น ไม่มี specs/ports; รองรับชื่อ Interface ที่ผู้ใช้ระบุเอง
- ปรับ UI เป็น Dark Network Command Center พร้อม Light Mode, Library, Contextual Inspector และ Physical Detail
- เพิ่ม Main/Backup, เส้น Backup อำพันแบบประและ Animation, Parallel-link lanes, Straight/Orthogonal/Curved, Custom color, Enabled state และ Label visibility
- เพิ่ม Multi-selection, Rectangle selection, Group, Alignment/Distribution, Auto Layout, Snap/Guides, Mini Map, Middle mouse/Space pan, Copy/Paste/Duplicate, Context menu และ Command palette
- เพิ่ม Text inline editing และ Region annotations พร้อมสี พื้นหลัง ความทึบ และการจัดข้อความ
- เพิ่ม Local autosave/recovery, Project list/duplicate, Metadata และ schema v3 พร้อม migration จาก v1/v2
- ขยาย Export เป็น PNG/JPEG/SVG/PDF/PPTX พร้อม Viewport, Resolution, Background, Grid, Labels และ PDF orientation; รักษา native editable text/shapes ใน PPTX
- เพิ่มฟอนต์ภาษาไทยและฝังใน SVG Export
- ผ่าน 30 behavior groups และตรวจไฟล์ Export จริง; Browser QA ยังไม่ได้ทำเนื่องจาก preview ไม่รองรับ static app

## 0.2

อุปกรณ์ 19 รุ่นพร้อมรูปสีและพอร์ต, FortiGate 100F, UTP/Fiber endpoint workflow, Text labels, Interface labels, JPEG/PDF/PPTX และ JSON/CSV
