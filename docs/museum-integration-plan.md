# Museum integration audit / v67

Reference: user-supplied floor plan image(20261015-055634).png, 2026-10-15.

Existing system: Three.js0.186.1 ESM + demand-loaded chunks; single native WebGL renderer, Orbit/PointerLock camera, metre-based pure navigation, shared40-item device/accessory catalog generated from Studio Library. Bayface project bridge, serial, watts/card configurations and PDF remain separate from exhibition state.

Plan: Museum west of existing18×20m Datacenter. West reception spine, central three-column gallery court, Core/Switch/Access north, Fiber/Directory/Power center, Tools/Learning/Lounge south; doorway to existing east Datacenter. Shared camera/renderer and pedestrian collision regions. Geometry is lazy loaded; category layout derives from current catalog. Exhibition does not mutate rack contents.

Models: existing front/rear imagery and verified dimensions reused through createDeviceModel. All current records lack calibrated3D connector anchors; surface imagery is illustration/reference, not licensed manufacturer CAD. Side and connector details cannot be truthfully upgraded to calibrated CAD by fabrication. Show accuracy status and sources. No Nokia/AP/ONT/QSFP-DD invented when absent from catalog. Optical entries derive from existing app OPTICS constant rather than a separately maintained database.

Visual system: bevelled podiums, curved walls, cove lights, ceiling coffers, glass framing, floor joints and floor guidance, metallic trims, contact-shadow decals, warm gallery lighting, plants, glazing, reception and interactive directory. Same device-model factory at higher detail in near LOD.

Integration: in-place west/east navigation; proximity/E inspection uses current viewer/spec data; add-to-rack delegates original placement editor; add-to-topology delegates Studio action with same-origin bridge or validated session handoff. Search/compare/tour/minimap use catalog IDs. UI state never becomes rack/project data.

QA: math/collision/catalog tests and renderer doubles; preserve all regression suites. Real browser/GPU/FPS/photorealistic visual acceptance must be verified separately if browser skill unavailable. Do not claim60FPS from Node timings or claim image-based CAD is manufacturer-calibrated.
