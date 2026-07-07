/* ============================================================
   CONFIG — single source of truth for content that changes.
   Everything the site needs to be re-pointed lives here.
   ============================================================ */

const CONFIG = {
  // Seedance 2.0 clips (Higgsfield CDN). Injected at build time.
  videos: {
    // Clip 1 — 360° orbit, scroll-scrubbed on canvas (v2: open collar, watch, ring)
    heroOrbit: "https://d8j0ntlcm91z4.cloudfront.net/user_3G9UYU0hnj5QKuSVKlBrSIhxNC0/hf_20260707_015317_4fe6bb86-7953-4ea2-963e-b29311c7d6b1.mp4",
    // Clip 2 — Three Pillars backdrop, loops (v2)
    builder:   "https://d8j0ntlcm91z4.cloudfront.net/user_3G9UYU0hnj5QKuSVKlBrSIhxNC0/hf_20260707_015327_a98f0a58-8b12-4d14-a241-1486c7d7efa3.mp4",
    // Clip 3 — Work section backdrop, loops (v2)
    closer:    "https://d8j0ntlcm91z4.cloudfront.net/user_3G9UYU0hnj5QKuSVKlBrSIhxNC0/hf_20260707_015339_377e759d-8d06-4f5a-ba0d-87aa443a7830.mp4",
  },

  // Footer + CTA destinations.
  links: {
    linkedin: "https://www.linkedin.com/in/jarvis-r-038030218/",
    hanax:    "https://www.hana-x.ai",
    email:    "mailto:jarvisr@hana-x.ai",
  },

  // Hero orbit scrubber tuning.
  scrub: {
    framesDesktop: 96,     // extracted frame count (desktop)
    framesMobile:  56,     // extracted frame count (mobile)
    maxEdgeDesktop: 1440,  // longest edge of stored frames (px)
    maxEdgeMobile:  960,
    jpegQuality: 0.85,     // stored-frame compression
    decodeWindow: 16,      // ImageBitmaps kept decoded around playhead
    dprCap: 1.5,           // device-pixel-ratio cap for the display canvas
  },
};

export default CONFIG;
