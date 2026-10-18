# Local Ragnarok lighting selection catalog

Open `http://127.0.0.1:8080/lantern-catalog.html` with the existing local server running.

This separate page does not change the town or temple lighting. It lets the user inspect original local artwork, filter by region/type, rotate and zoom individual GLBs, save a shortlist in `uts-light-catalog-selection`, and copy IDs back into chat before placement is changed. No selection is applied to the map automatically.

The archive filename inventory covers 290,063 entries, including all 9,761 RSM/RSM2 models found in the installed archive stack. English/Korean lighting and utility-pole name searches found 294 candidates. All have rendered thumbnail previews. Visual inspection and embedded-material checks identify 275 selectable candidates, 13 with missing-texture materials, and six non-light/building parts included by the name search. Name-based discovery cannot prove that every model with an opaque filename has been found. Items are not deduplicated: source variants remain individually selectable. Original artwork belongs to Gravity and associated rights holders.

`catalog.json` records original archive paths, GLB filenames, thumbnail paths, source bounds, region/category labels, missing texture names, and IDs. Thumbnails normalize each model separately for shape comparison, not shared physical scale. The 3D viewer shows source textures, without adding the map's night glow. Final size, support, collision and light emission are configured only after the user chooses.

Reproduction, from the project root:

```powershell
$env:PYTHONIOENCODING='utf-8'
uv run --python 3.12 --with numpy --with pillow --with psutil python assets-source/ayothaya/catalog_lights.py --export
node scripts/render-light-catalog.cjs
node scripts/prepare-light-catalog.mjs
node node_modules/esbuild/bin/esbuild assets-source/ayothaya/light-catalog-ui.js --bundle --format=esm --minify --outfile=web/lantern-catalog.js
node scripts/contact-light-catalog.cjs
```

Keep the same client archive version when regenerating IDs, which follow sorted source filenames. User choices should be resolved against the current `catalog.json` and its source path before rebuilding against a different client.

The catalog itself does not mutate the map. The subsequently approved L047/L026/L027/L013/L241/L233/L238 selection is now installed and marked current; see AYOTHAYA.md for placement and validation. Browser validation covered all counts, all 294 thumbnail loads, category/search filters, missing-texture disabling, actual GLB inspection, selection persistence and mobile layout. Proof images and seven contact sheets are in `artifacts/light-catalog/`.
