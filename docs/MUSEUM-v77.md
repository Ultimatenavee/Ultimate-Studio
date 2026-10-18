# Museum v77 — readable walk invitation and supported DAC/AOC assemblies

## Walk invitation

The opening Drone Presentation callout previously inherited the global dark `aside` background while its text had a light-card dark color. Scope its complete surface, typography and colors beneath `.drone-panel .walk-suggestion`. Use 17px bold heading, 14px description, 12px instructions and a 52px primary action on desktop. Compact screens preserve the heading and 48px action. An inline SVG pointing hand sits inside the existing working Walk button. It is decorative, ignores pointer events and adds no scene render loop. Both the Animation switch and OS reduced-motion preference stop its animation.

## Cable assembly presentation

All six DAC/AOC catalog entries use a single continuous tube between the two captive cable heads. The heads face electrical contacts forward; molded strain reliefs join their cable exits to smooth leads. A spaced spiral sits on a common support plane. The lead portions descend from the raised cable exits to that plane rather than forming the old rigid V shape. Normalize the complete assembly bounds before Museum placement so the heads and jacket rest on the tray. Cable exhibits retain proximity selection, lighting and 360 inspection, while disabling their floating/spinning proximity animation and oversized cyan focus ring.

This is a static, gravity-settled display arrangement, not a dynamic flexible-body physics engine or a scale model of the entire published cable length. Do not infer cable length or installation bend compliance from the display coil. Existing manufacturer dimensions, published cable diameters, physical references, catalog IDs, engineering ports and connectivity logic are unchanged.

References reviewed before the presentation change:

- Cisco 10GBASE SFP+ Modules Data Sheet, Figure 4 twinax and Figure 5 AOC: https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-455693.html
- Cisco 40GBASE QSFP Modules Data Sheet, QSFP-to-QSFP AOC section and Figure 4: https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-660083.html
- Existing per-model physical evidence is retained in `optics-catalog.json` (see `OPTICS-v75.md`).

## Verification

- Existing complete `npm test` regression suite passed.
- Expanded `verify-optics.mjs`: every DAC/AOC has two heads and strain reliefs, one connected tube, exact jacket-to-boot endpoint alignment, centered assembly bounds, supported coil points, full compartment fit, no hover lift/rotation or focus ring, and the lowest model surface at the actual tray height.
- Inspected native software projections from actual Three geometry for all six assemblies; these are geometry QA, not WebGL screenshots.
- Build and diff checks required before publication. Browser/GPU visual rendering remains unverified in this environment.
