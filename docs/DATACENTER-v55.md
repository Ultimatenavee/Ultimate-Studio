# AI Datacenter / first-person exploration — v55

The existing landing is expanded from six racks to a 24-rack, four-row demonstration hall. The Studio business model, license Matrix, port inventory and exports are unchanged.

## Research

Google Data Centers official gallery was used to study scale, aisle depth, consistent cabling colors and utility areas. No Google photographs, identity, facility floorplans or network/customer data are copied into the app. https://www.datacenters.google/discover-more/photo-gallery/

NVIDIA DGX H100/H200 official guide documents 8U / 356mm form factor, eight GPUs, front-to-back airflow and six PSUs with 4+2 redundancy. It also explains reduced performance if three PSUs lose power. The GPU model is an illustrative 8U reference, not NVIDIA CAD. The existing Feed-A failure demo applies to the ASR Edge only; GPU power availability is deliberately not inferred from it. https://docs.nvidia.com/dgx/dgxh100-user-guide/introduction-to-dgxh100.html

Three.js official PointerLockControls and RoomEnvironment informed navigation and material lighting. No new package dependency beyond the existing pinned Three.js 0.186.1.

## Delivered

18m × 20m illustrative hall, 24 × 42U cabinets, two paired cold aisles. Six Network/ISP racks, six GPU racks (24 8U nodes), six Storage racks (48 generic 4U shelves) and six CPU Compute racks (96 generic 2U servers), plus fabric switches. Network artwork retains Huawei, Cisco and adds existing Fortinet/Hitachi entries. Air-handling and UPS/distribution cabinets stand in separate service zones. Overhead cable trays and routing remain.

Neutral epoxy/tile flooring, subtle surface texture and joints, satin metal, black perforated cabinet doors, drive caddies and handles, PSU detail, restrained LEDs, warm-neutral luminaires, environment reflections and soft directional shadows replace the uniformly blue model look. Ceiling/front enclosure becomes visible in walking mode. Pixel ratio and shadow-map size are reduced for smaller screens. Static small details and repeated labels are instanced; catalog textures are reused rather than reloaded per device.

First-person walk: W/A/S/D or arrows, Shift for faster walking, mouse lock for free look, drag-look fallback, E/click to inspect nearby equipment (3m), Esc/exit for overview. Hold on-screen arrows and drag look for touch. A floor-plan marker shows position and heading. Fullscreen is optional and depends on browser support. Perspective remains metre-scaled at 1.65m eye height. Rack/service-cabinet/world-bound collisions slide along obstacles; substeps prevent tunneling. Time-step caps prevent large jumps after a hidden tab. Keyboard controls stop when a text input has focus. Blur, hidden tab, pointer cancellation and exit clear held inputs. Entering Studio uses the existing link and workspace chooser.

## Validation and limits

Node tests: 24 rack inventories, no U overlap, known catalog dimensions and image bounds, paired-aisle orientation; safe spawn/front inspection positions; wall/rack/service collision, no tunneling, normalized diagonal speed and resumed-tab time-step cap. Existing Studio behavior and responsive suites and production build run.

Browser QA unavailable in the managed environment: no control-browser skill. WebGL appearance/FPS, pointer lock, fullscreen and actual touch devices are not runtime-certified. This is a visual demo, not an installation design, CFD, electrical load simulation or a real Google facility. Generic server/storage/fabric models do not advertise undocumented SKU specifications. Cabinets and generic accessories are illustrative; the GPU reference is not calibrated port geometry. The public demo does not read user projects or customer attachments.

Files: `src/datacenter/{data,devices,scene,entry,navigation}`, `web/index.html`, `web/datacenter.css`, poster and generated bundles, `scripts/verify-datacenter.mjs`, this report. Existing build integration is retained.
