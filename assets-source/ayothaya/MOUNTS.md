# Class mounts

`export_mounts.py` reads paired body SPR/ACT files from the local Ragnarok client and adds them to the portable wardrobe. It also runs after `export_online_wardrobe.py`. It never changes the curated class list: mounts are a separate selection, matched by class, sex and race.

The source family mappings are explicit. `mount-audit.json` lists 186 mount/class choices across the 146 currently selectable class/sex combinations, with their original archive paths. This includes class animals, alternate dragons and mechanical riding gear when present in the source. The public catalogue contains all corresponding compressed sprites and ACT clips, so website visitors need no client installation.

The browser uses the mounted body's attachment points for hair/headgear and lists equipment/palettes compatible with that body. Equipment without an exported matching mounted variant is cleared when mounting. Choosing “ไม่ขี่” restores the normal body. Sitting displays the original class's seated pose; standing returns to the selected mount. Mount selection is saved with the outfit and shared by the city and existing interiors.

`node scripts/verify-class-mounts.cjs` validates every published mount's 24 idle/walk/seated direction clips, rejects incompatible selections, and checks UI preview, Apply/reload, sitting, interior transfers and phone/tablet viewport layouts. `UTS_TEST_URL` selects a deployment; `UTS_MOUNTS_UI_ONLY=1` reuses the prior local render report when repeating only UI checks.
