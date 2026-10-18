# Liquid Glass application notes · 2026-10-09

Primary references:
- https://developer.apple.com/videos/play/wwdc2025/219/ — Meet Liquid Glass, WWDC25
- https://developer.apple.com/design/human-interface-guidelines/materials

Implementation decisions:
- Use a Regular-style glass treatment for navigation, sidebars, menus and control bars, with a readable tint behind labels.
- Keep specification tables and diagram content on steady, readable surfaces.
- Build a rounded shared tab container; use simple overlays for its inner controls to avoid layered blur.
- Add edge lighting, broad soft shadows and restrained pointer-responsive highlights.
- Respect reduced motion, reduced transparency and increased contrast preferences where browser media queries support them.
- The web implementation approximates the material with CSS blur, gradients and highlights. It is not Apple's native Liquid Glass renderer or a physically accurate refraction implementation.

Matrix content: all 18 source profiles were imported as data only from the supplied HTML. External scripts, inline event handlers and placeholder image URLs were not imported. Existing vendor-linked Library records remain available alongside the source Matrix fields. PE records retain their documented chassis footprint without invented port or throughput specifications.
