# Spec 05 — Revert meteor appearance to v1, keep off-screen behavior

User feedback: the shooting stars' APPEARANCE got worse after the recent refinements. Revert the visual parameters to their original (commit 987d17f) values while KEEPING the behavioral changes (off-screen start/end, path-crossing guard) and the light-mode STAR improvements (which are separate and staying).

## In `src/components/starfield-hero.tsx` only — revert these to original values

1. Trail colors (meteor trail, both themes):
   - DARK_METEOR_TRAIL: back to `#ffd9a0` (currently #c9973d)
   - LIGHT_METEOR_TRAIL: back to `#d9c9a0` (currently #a98a4a)
2. Trail alpha falloff: `METEOR_TRAIL_FALLOFF` back to `1.5` (currently 2.3) — gentle long tail again.
3. Trail blending: `THREE.AdditiveBlending` in BOTH themes again for meteor trails (remove the per-theme NormalBlending for trails introduced in the blending fix). Meteor HEADS were already additive in both themes — unchanged.
4. Keep `METEOR_FADE_FRACTION` (0.1) edge fade — it only acts on the off-screen first/last 10% of the path, so it is invisible in practice and prevents pop-in.

## Keep unchanged (do NOT touch)
- Off-screen spawn margins (2–4 units), entry/exit edge selection, diagonal guard, duration 0.9–1.6s, max 2 concurrent, 800ms gap — all the off-screen behavior from the refinement spec.
- Star field: light-mode palette/size/opacity and per-theme star blending (NormalBlending light / additive dark) — the light-mode star visibility fix STAYS.
- Meteor head color/scale — unchanged from v1 anyway.

## Verify (all must pass)
- `npm run build` and `npx tsc --noEmit`
- Dev server 200 at `/`; stop it afterward.

## Report back
- Exact final values of: DARK_METEOR_TRAIL, LIGHT_METEOR_TRAIL, METEOR_TRAIL_FALLOFF, trail blending per theme
- Verify results
- Deviations and why