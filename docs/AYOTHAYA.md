# Ayothaya campus integration — local build

The exterior is now the extracted Ayothaya town. The large northern temple leads to a separate central hall: left to the existing Device Library, right to the existing Datacenter. Walking through an exit returns to the central hall; its south exit returns to the temple steps in town. Portal transitions show the original animated Ragnarok portal, briefly fade and clear held movement to avoid crossing twice.

## Color, sky and Ragnarok decorations

Use **☀ กลางวัน / ☾ กลางคืน** at the top right of the scene to switch the outdoor sky. Day has drifting clouds and sunlight; night has stars, a moon and blue ambient light. The choice persists in `uts-ayothaya-sky` and across room/rack changes; interior task lighting stays usable. Animation off freezes the clouds and warp frames; the warp overlay respects reduced-motion preferences.

The town uses neutral tone mapping and a single sun/hemisphere setup. The GLB's embedded directional light is disabled to avoid illuminating terrain twice and washing out its colors. Buildings and palace gatehouses use their painted texture colors without applying PBR shading a second time; outdoor night tint still applies. Alpha cutouts remain intact. Town eye height is 1.05 at the imported map's 0.05 scale; the hall and existing equipment rooms use 1.50. Rack dimensions and U placement remain unchanged.

`ayothaya-atmosphere.js` owns the sky. `ayothaya-decor.js` loads source artwork and applies the 20-frame, 100-ms ACT portal animation; `ayothaya-decor-layout.js` defines bounded furniture placements used by collision. The hall has nine props plus original Ayothaya wood, rug and mural textures. The two equipment rooms have fifteen laboratory props and two scientist sprites. Metal storage lockers, repair benches with vises, chairs and extinguishers line the room edges. Verus/Werner control panels rest on supported shelves above service benches; mats, drawers and cable ducts complete each workspace. Main walkways, entrances and rack working space remain clear. Rotated furniture footprints follow their placement. Scientist sprites are decorative, with no new dialog or equipment behavior.

`web/assets/ayothaya/decor/manifest.json` records exact local archive paths for the SPR, texture and RSM sources, including Ayothaya, Lighthalzen/Einbroch, Werner and Verus props. SPR layers are composited with palette transparency, ACT offsets, scale, rotation and original timing. RSM props ship as self-contained GLB files. The client archive is only read; no game files are modified.

## Player wardrobe, opening view and lanterns

The standing sprite holds the first idle pose. Original idle ACT frames 1/2 encode deliberate head-look states and must not be cycled as a breathing animation. Walking still follows the original ACT frame timing. The character and costume share the body's foot anchor, so adding large headgear or wings does not shrink the wearer.

The initial page uses `openingView()` with a north-facing view from the south, matching the supplied arrival screenshot: ship in the foreground and large temple at the top. Its heading, pitch and 36-degree lens stay consistent across screen sizes; narrower screens pull back to retain the landmarks. The original water texture continues outside the rectangular map on a separate sea surface with a hole over the original terrain. The explicit whole-area overview and drag controls remain available.

The user-selected lighting replaces the Payon/Taiwan fixtures: 32 L047 stone lanterns, two L026 warm garlands, two L027 colored garlands and two L013 Dewata braziers outdoors. The garlands have paired timber supports and more than 2.7 m of clearance, along the village, temple promenade and harbor. Braziers sit on noncombustible paving in the temple courtyard, with wider collision clearances. All 42 support locations are checked against the source terrain/decks; raycasts also check the garlands against existing geometry.

Four L241 Ayothaya chandeliers hang from the temple hall beams. Two L233 chandeliers decorate the Library reception hall; two L238 chandeliers hang in the Datacenter side entrance area, away from rack rows. Interior hanging fixtures have at least 2.85 m of head clearance. The Library's unused east connecting door/sign is replaced by a finished wall; the separate lobby return portals remain functional. The legacy non-Ayothaya campus retains its working door.

The night switch controls 54 outdoor emitters and four temple chandeliers. A 256×256 warm fill field lights streets and lower facades even from the overview; eight nearby point lights add local form, and repeated fixture meshes are instanced. The fill is stylized, not an occlusion or photometric simulation. All 14,576 reachable walking cells lie within 7.34 world units of a light source, inside the 10-unit fill radius; unreachable water/hills retain moonlight. No previously connected route is stranded by the new footprints. Library/Datacenter retain their existing task lighting, with two active chandelier lights only in the visible room.

Run `node scripts/verify-selected-light-layout.mjs` for coverage/asset/headroom checks, `node scripts/inspect-ayothaya-framing.cjs` for base/garland geometry checks, and `node scripts/verify-selected-lights.cjs` for day/night rendering, all seven models, room light isolation and the sealed doorway. Reports/screenshots are in `artifacts/selected-lights/`.

Click **แต่งตัวละคร** beneath the perspective switch. Choose Human/Doram, sex, body/class/costume, hairstyle, original hair/clothes palettes, up to three head accessories, a garment/wings, weapon and shield. Search filters the source item labels. Selection updates the preview automatically, inspired by the interaction at https://costume.irowiki.org/; there is no separate preview button. The arrows rotate it, **ทดลองเดิน** checks movement, slot **ล้าง** buttons remove individual selections, and **ใช้ชุดนี้** applies it in all four maps. Uncached outfits briefly show a loading status while local source sprites are composed. Selectors remain interactive, requests are serialized with only the latest selection queued, stale responses are ignored, and the last 24 decoded previews are cached. Existing exported atlases are also reused after server restarts. Closing without applying leaves the worn outfit intact. **คืนชุด Novice** resets the appearance; saved outfits survive reloads under `uts-ayothaya-appearance`. This is an appearance editor using source artwork and animation data; it does not import the game's executable, combat or equipment statistics.

The wearer is approximately 12% smaller (1.04 times eye height instead of 1.18), preserving its foot anchor, player collision and eye height. Mouse wheel zoom now works in all four walking maps: third person adjusts follow distance within 0.4–3 times its default while retaining wall clearance, and first person keeps bounded lens zoom. Overview retains OrbitControls zoom; buttons and keyboard shortcuts use the same zoom behavior.

The local client index contains **528 bodies, 104 heads, 4,133 paired head accessories, 235 garment families with 68,149 body-specific variants, 5,274 weapon variants, 1,442 shield variants and 5,356 palette files**. Counts include both sexes, alternate bodies and mount/costume variants; they are not counts of unique in-game item IDs. Choices are filtered against the selected body/race/sex. Some original source names remain untranslated. Single-action accessories repeat their one source pose; no incompatible animations are invented. Some weapon graphics have empty idle/walk layers in the original ACT and only show in combat, which this editor does not add.

The wardrobe is served by the **local Node server**, reading the user's installed client on demand. Only the requested outfit is composited and cached as a PNG/JSON atlas. Opening the town never downloads the full wardrobe or all GRF files. Client files are read-only. The existing static/hosted backend does not have access to this computer's client archives; this local wardrobe endpoint has not been deployed.

Rebuild the index after updating the local client:

```powershell
uv run --python 3.12 --with numpy --with pillow --with psutil python assets-source/ayothaya/wardrobe.py index --ragx <path-to-ragx-checkout> --client 'C:\Program Files\RagnarokOnline'
```

`scripts/ayothaya-local.json` stores the local `ragx` checkout and `client` paths. Restart `npm run local` after rebuilding the index. The endpoint accepts catalog IDs rather than filesystem paths and checks compatible selections before rendering. Generated outfits are under `web/assets/ayothaya/avatar/outfits/`. Lua bytecode is never executed; the index only reads its string constants for labels.

`verify-ayothaya-wardrobe-data.mjs` validates choice compatibility for every indexed body, lantern collision and opening landmark framing. `verify-ayothaya-wardrobe.cjs` checks stable idle frames over multiple original idle cycles, walking progression, day/night lamps, real preview/apply, cross-map persistence, reload and portrait layout. Browser screenshots are under `artifacts/ayothaya-wardrobe/`. Representative composite exports were also checked for female Knight, male Arch Mage, and female Doram with garments, weapon/shield and available palettes. Not every possible combination has been visually inspected.

`verify-ayothaya-live-preview.cjs` exercises real wheel events in both perspectives across all four maps, smaller wearer height, a deliberately delayed outfit response followed by rapid selections, cached preview, slot clearing and cancellation, the point-light budget, and reference/laptop/mobile opening screenshots. `inspect-ayothaya-framing.cjs` produces the annotated top view and checks lamp support against source triangle geometry. Artifacts are under `artifacts/ayothaya-live-preview/`.

## Run locally

```sh
npm ci
npm run build
npm run local
```

Open http://127.0.0.1:8080. The server is local to this computer. This change does not deploy the application or replace an installed Windows executable.

Choose **เดินชม · First Person** to start in front of the temple approach. Use WASD / arrow keys and drag to look; Shift runs, Ctrl crouches, Space jumps, and the existing touch joystick remains available. Walk into the main temple entrance to warp automatically. **สำรวจพื้นที่** offers overview/walking shortcuts to town, hall and both rooms. **ออก** leaves walking mode for an overview of the current map.

Use the **First Person / บุคคลที่สาม** button beneath the sky switch to change perspective in any map. Third person shows the original Ragnarok male Novice, with eight idle and eight walking directions (88 composed SPR/ACT frames). Its feet share a common ground anchor and its height follows each map's scale. First person hides the avatar. The follow camera retracts when it encounters walls or scenery; movement, collision, warps and interaction reach use the original player position. Perspective is retained across portals and rack snapshots. In overview, clicking the button enters walking mode. The original overview remains available.

`ayothaya-avatar.js` owns the visual avatar and follow camera; `ayothaya-materials.js` corrects painted building materials before instancing. `assets-source/ayothaya/export_avatar.py` and `export_decor.py` reproduce the selected artwork from a local client using `--ragx <checkout>` and optional `--client` / `--output`. The avatar JSON records its original body/head archive paths, action timing and atlas dimensions. Body/head attachment points and layer transforms are composited before normalizing foot contact.

## Implementation

- `ayothaya-scene.js` coordinates the exterior and preserved interior renderer, portal fade, active input, room routing and snapshots used when rebuilding racks. Only the visible renderer accepts input and renders.
- `ayothaya-world.js` loads the GLB, instances repeated static props and builds the temple hall. Cutout materials retain alpha testing, including temple gables, ship rigging and fences. Town props are displayed in their static exported pose.
- `ayothaya-navigation.js` contains pure movement/portal rules. `navigation.json` preserves the actual 320×320 GAT grid, terrain types and four corner heights per cell, at 0.05 world scale. It is a game navigation grid, not triangle-mesh physics. Lobby columns and room bounds also block movement.
- `ayothaya-camera.js` fits the full map/room to the viewport. `ayothaya-map.js` supplies a map per location rather than showing old garden coordinates.
- `scene.js` retains the rack editor, device picking, physical U placement, power data, snapshots and museum integration. Its optional `indoorOnly` mode omits the old campus exterior, separates the two rooms and exposes suspend/resume.

## Assets and original data

`web/assets/ayothaya/ayothaya.glb`, `navigation.json`, `minimap.png` and the selected decorations were derived from the user's local Ragnarok Online client using ragx (https://github.com/joaopedrosgs/ragx). Original game artwork is by Gravity and its associated rights holders. The hall layout is authored in this project. Other full Ragnarok maps are not added as destinations.

Existing catalog, interface mapping, license matrix, rack/business calculations and browser storage keys remain in place. Source copies of the initially edited scene/entry/menu/HTML/CSS are under `assets-source/ayothaya/before-integration/`.

## Validation

```sh
npm test
# With npm run local running and Microsoft Edge installed:
npm run test:ayothaya:browser
```

The browser tests use an explicit `?debug=ayothaya` URL that exposes the scene API for assertions. Normal URLs do not expose it. Tests walk the full round trip through all six portal directions with keyboard/drag-look input, verify no immediate reentry, check overview, focus/layout, the 89-item museum and unchanged rack count, and capture desktop/390px portrait screenshots. Screenshots are saved under `artifacts/ayothaya-qa/`. The portrait browser test is viewport coverage, not a test on physical phone hardware.

`verify-ayothaya-visuals.cjs` checks day/night toggling, preference persistence, unchanged camera/rack state, eye heights, decoration loading, ACT progression and animation-off behavior. It captures all rooms plus day/night town views under `artifacts/ayothaya-visuals/`. The pure navigation checks also verify furniture collision and unobstructed hall portals. No original catalog, interface, license or power records are altered by this visual update.

`verify-ayothaya-avatar.cjs` checks actual keyboard walking/idle direction changes, first/third switching without moving the player, camera wall clearance, all four maps, rack layout, mobile button bounds, asset errors and overview zoom. Screenshots of the player, corrected buildings and both service benches are under `artifacts/ayothaya-avatar/`. The complete keyboard portal test also supports `UTS_THIRD_PERSON=1` and was run in both perspectives. These are real browser/WebGL checks; mobile coverage uses a portrait viewport.

`verify-ayothaya.mjs` checks actual GAT traversal from the town spawn to the gate, height, blocked cells, portal cooldown and safe arrivals, full camera framing at multiple aspects and GLB alpha material integrity. PowerPoint verification now uses a declared development dependency instead of a machine-specific Linux runtime path.
