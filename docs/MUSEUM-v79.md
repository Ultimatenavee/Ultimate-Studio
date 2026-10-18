# Museum v79 — remove backboard photos and restore cable approach animation

- Remove the four vendor photo planes and their texture loading from the SFP backboard. Keep its family headings, speed/connector information, click actions and the actual 3D specimens.
- Restore the common proximity animation for DAC/AOC assemblies: rise 20 cm, rotate 360 degrees once per approach, remain raised while nearby, settle to the original position when leaving. Applies to the four page-zero specimens shown in the user's reference and the two additional variants reached by paging.
- Retain the v77 cable geometry, strain reliefs and resting position, the hidden cable focus ring, and v78's non-overlapping tray surfaces.
- Retain Animation off / OS reduced-motion handling. No new render loop, image generation or changes to catalog/network data.

Validation: optics geometry and behavior tests cover all six cable assemblies, one lap, pause, no repeat while nearby and return to the tray. Family filters remain clickable and no photo mesh remains. Museum layout (including 126 no-z-fighting samples) and experience regressions pass. Build required before publication. Browser/GPU rendering remains unverified in this environment.
