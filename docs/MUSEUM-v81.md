# Museum / Datacenter v81 — circular joystick and Shift ×3

Replace the four directional buttons in the shared walking HUD with one circular glass-style analog joystick. Pointer capture supports mouse, touch and pen. The knob clamps to a circle, with a 12% center dead zone, proportional walking speed and unrestricted diagonal direction. Input resets on pointer release/cancel/lost capture, window blur, document hiding, leaving walk mode and disposal. A second finger cannot steal the movement pointer; scene Drag Look remains independently usable.

Navigation keeps the 1.8 m/s base speed and changes Shift from 2× to exactly 3× (5.4 m/s), before the existing Museum speed setting. Vectors shorter than one now preserve analog strength; full keyboard diagonals and combined inputs clamp to full speed. Existing collision substeps and suspended-tab delta limits remain active.

The joystick is shared by Datacenter and Museum, responsive at 128px / 112px, focusable for existing WASD/arrow keyboard control, and respects reduced motion when returning its knob. Move the walking Museum minimap above it to prevent overlap. Update walking help and Shift hints.

Validation: new joystick tests exercise circular travel, partial throw, jitter suppression, two-pointer isolation, capture/release/cancel/blur/hidden/reset/dispose, exact 3× speed in multiple directions and collision safety. The complete regression suite passed. Build required before publication. Browser/GPU visual QA remains unavailable in this environment.
