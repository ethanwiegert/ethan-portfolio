# Spec 03 — Meteor + light-mode star refinements

User feedback after visual review. All changes in `src/components/starfield-hero.tsx` only. Keep all existing behavior unless changed below (theme-awareness, cleanup, pausing, reduced-motion, build green).

## Changes

### 1. Meteors travel fully off-screen
Replace the current spawn logic (start inside the view, end inside the view) with off-screen start AND end points:
- Compute the visible rectangle at the meteor's depth (you already do this with halfH/halfW at `CAMERA_Z - start.z`).
- The start point must be OUTSIDE the visible rect with a margin of 2–4 world units (meteor enters from beyond the top or a side edge).
- The end point must also be outside the visible rect (margin 2–4 units) on the opposite side (bottom or opposite side edge), such that the full path crosses the sky: the segment between the two points must pass through the interior of the visible rect. Direction remains a clear diagonal (not axis-aligned).
- Keep duration 0.9–1.6s. Because the path is longer now, you may raise speeds accordingly (duration constant is per-flight, not per-pixel — keep as is or tune slightly for a natural look).
- Keep MAX_CONCURRENT_METEORS = 2 and the 800ms min spawn gap.
- Fade the meteor's overall opacity in over the first ~10% of flight and out over the last ~10% (multiply into existing per-vertex alpha + head sprite opacity), so it doesn't pop in/out at the screen edges — it slides in/out already off-screen, this is just insurance for partially-visible starts.

### 2. Dimmer meteor tail
The user finds the tail too bright. Reduce tail brightness noticeably (roughly half the current visual intensity) while keeping the head bright:
- Trail color (both themes): darken the trail colors (e.g. dark theme from `#ffd9a0` toward something like `#b3862e`–`#c9973d`; light theme proportionally). Exact hex is your call — aim for the tail to read as a warm streak, clearly dimmer than the head.
- Keep additive blending for the trail, but you may additionally scale the per-vertex alpha curve (currently `Math.pow(1 - f, 1.5)`) toward a faster falloff (e.g. `Math.pow(1 - f, 2.2)`–`2.5`) so the tail is brightest near the head and fades quickly.
- The head keeps its current brightness/scale.

### 3. Light-mode stars stand out more
Current baseline: ~0.088% of pixels at luminance > 235 against the ~227-luminance sky. Target: at least triple that (≥ 0.26% of pixels > 235, or stars clearly visible to the eye at a glance).
- Darken/saturate the light-mode star palette (current muted slate/soft gold reads washed out). Aim for deeper slate-blue and warmer amber-gold stars, e.g. shift toward `#52606f`-range slates and `#8a6d2f`-range golds — exact values your call, but they must be distinctly darker than the sky while still looking "star-like" not "dirt spots".
- Increase per-star size/opacity so more pixels are affected: you may bump `aSize` range (e.g. from 0.5–2.5 to 0.8–3.5 for light mode), raise the fragment shader alpha for light mode (add a `uStarOpacity` uniform, higher for light), or both.
- Light-mode meteors (head/trail colors) may stay as-is or be brightened slightly to stay visible against the now-more-visible stars.
- Do NOT change dark mode's look beyond the meteor tail change in (2).

## Verify (all must pass)
- `npm run build` and `npx tsc --noEmit`
- Dev server 200 at `/`
- Stop the dev server afterward.

## Report back
- New constants/values chosen (spawn margins, trail color hexes, falloff exponent, light palette hexes, size/opacity changes)
- Verify results
- Deviations and why