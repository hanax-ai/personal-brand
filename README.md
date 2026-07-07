# Jarvis Richardson — Cinematic Scroll Portfolio

Award-style scroll-driven personal portfolio. Ink black, emerald light, cream type.
The signature element: an 8-second Seedance 2.0 orbit of Jarvis, scroll-scrubbed
frame-by-frame on a pinned canvas.

## Run it

Any static server from this folder:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Open http://localhost:8000. A server is required (ES modules + video CORS);
opening index.html via file:// will not work.

## Configuration — one file

Everything that changes lives in `js/config.js`:

- `videos.heroOrbit / builder / closer` — the three Seedance 2.0 clip URLs.
- `links.linkedin / hanax / email` — **TODO: replace placeholders with your real URLs.**
- `scrub.*` — frame count, stored resolution, decode window, DPR cap.

## Architecture (OO, single responsibility per class)

| Class | Responsibility |
|---|---|
| `FrameScrubber` (scrub.js) | Tier A: extracts frames → JPEG blobs, sliding ImageBitmap window, buttery canvas scrub |
| `LiveVideoScrubber` (scrub.js) | Tier B: CORS-blocked fallback — lerped `currentTime` seek painted per rAF |
| `HeroOrbit` | Pins the hero, maps scroll progress → scrubber, loader UI |
| `KineticType` | Letter splitting + track-in animations (load and scroll triggered) |
| `StatsStrip` / `StatCounter` | Count-up numbers on scroll entry |
| `PillarsSequence` | Pinned section, reveals the three offers one at a time |
| `CardTilt` | Pointer-tracked 3D depth + glow on work cards |
| `BackdropVideos` | Lazy-loads clips 2 & 3 as looping section backdrops |
| `SmoothScroll` | Lenis, synced to GSAP ScrollTrigger |
| `App` | Composition root |

## Degradation ladder (lowest common denominator by design)

1. Full experience: Lenis + GSAP + frame-sequence scrub.
2. CDN without CORS headers → live-seek video scrub (still smooth).
3. Video unreachable → designed gradient hero; all type/motion intact.
4. GSAP/Lenis blocked → native scroll, IntersectionObserver reveals.
5. `prefers-reduced-motion` → static, fully readable, no pinning.
6. No JS at all → semantic HTML, every word reachable.

## Accessibility

Semantic landmarks, visible focus rings, keyboard-focusable cards,
`aria-live` loader, reduced-motion support, decorative media `aria-hidden`.
