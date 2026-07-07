/* ============================================================
   MAIN — orchestrates the cinematic scroll experience.
   Classes own one responsibility each; App composes them.
   Everything degrades: no video → designed backdrops,
   no JS libs → native scroll + readable content,
   reduced motion → static, accessible page.
   ============================================================ */

import CONFIG from "./config.js?v=20260707-2";
import { createScrubber } from "./scrub.js?v=20260707-2";

/** Build tag — check DevTools console to confirm which build is running. */
const BUILD = "v2 — restyled clips (open collar / watch / ring), 2026-07-07";
console.info("[jarvis-portfolio] build:", BUILD);

const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 768px)").matches;
const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

if (hasGSAP) window.gsap.registerPlugin(window.ScrollTrigger);

/* ---------- Smooth scroll (Lenis) ---------- */
class SmoothScroll {
  constructor() {
    if (prefersReducedMotion || typeof window.Lenis === "undefined") return;
    this.lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGSAP) {
      this.lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => this.lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { this.lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
}

/* ---------- Letter-by-letter kinetic type ---------- */
class KineticType {
  constructor() {
    document.querySelectorAll("[data-split]").forEach((el) => this.split(el));
  }
  split(el) {
    const text = el.textContent;
    el.textContent = "";
    [...text].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "ch";
      span.textContent = ch === " " ? "\u00A0" : ch;
      el.appendChild(span);
    });
  }
  /** Track letters in: wide spacing + blur resolve into set type. */
  animateIn(selector, { stagger = 0.05, delay = 0 } = {}) {
    const letters = document.querySelectorAll(`${selector} .ch`);
    if (!letters.length) return;
    if (prefersReducedMotion || !hasGSAP) {
      letters.forEach((l) => l.parentElement.classList.add("is-set"));
      return;
    }
    window.gsap.to(letters, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      letterSpacing: "0em",
      duration: 1.1,
      ease: "power4.out",
      stagger,
      delay,
    });
  }
  scrollIn(selector, trigger, opts = {}) {
    if (prefersReducedMotion || !hasGSAP) {
      document.querySelectorAll(`${selector} .ch`)
        .forEach((l) => l.parentElement.classList.add("is-set"));
      return;
    }
    window.ScrollTrigger.create({
      trigger,
      start: "top 78%",
      once: true,
      onEnter: () => this.animateIn(selector, opts),
    });
  }
}

/* ---------- Hero: pinned canvas + scroll-scrubbed orbit ---------- */
class HeroOrbit {
  constructor(kinetic) {
    this.section = document.querySelector(".hero");
    this.stage = document.querySelector(".hero__stage");
    this.canvas = document.querySelector(".hero__canvas");
    this.loader = document.querySelector(".hero__loader");
    this.loaderFill = document.querySelector(".hero__loader-fill");
    this.loaderPct = document.querySelector(".hero__loader-pct");
    this.kinetic = kinetic;
    this.scrubber = null;
  }

  async init() {
    // Name + subtitle perform immediately — never gated on the video.
    this.kinetic.animateIn(".hero__name", { stagger: 0.045, delay: 0.15 });
    document.querySelector(".hero__sub").classList.add("is-in");

    const url = CONFIG.videos.heroOrbit;
    if (!url || prefersReducedMotion) {
      this.loader.classList.add("is-done");
      return; // Tier C: designed gradient hero, type still kinetic.
    }

    try {
      this.scrubber = await createScrubber(this.canvas, url, {
        frames: isMobile ? CONFIG.scrub.framesMobile : CONFIG.scrub.framesDesktop,
        maxEdge: isMobile ? CONFIG.scrub.maxEdgeMobile : CONFIG.scrub.maxEdgeDesktop,
        jpegQuality: CONFIG.scrub.jpegQuality,
        decodeWindow: CONFIG.scrub.decodeWindow,
        dprCap: CONFIG.scrub.dprCap,
        onProgress: (p) => this.updateLoader(p),
      });
      this.loader.classList.add("is-done");
      this.bindScroll();
    } catch (e) {
      // Tier C — video unreachable. Keep the designed hero.
      console.warn("[hero] orbit unavailable:", e.message);
      this.loader.classList.add("is-done");
    }
  }

  updateLoader(p) {
    const pct = Math.round(p * 100);
    this.loaderFill.style.width = pct + "%";
    this.loaderPct.textContent = pct + "%";
  }

  bindScroll() {
    if (hasGSAP) {
      window.ScrollTrigger.create({
        trigger: this.section,
        start: "top top",
        end: "+=170%",
        pin: this.stage,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (st) => this.scrubber.render(st.progress),
      });
      // Type drifts subtly upward through the orbit — parallax depth.
      window.gsap.to(".hero__content", {
        yPercent: -14,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: {
          trigger: this.section,
          start: "top top",
          end: "+=170%",
          scrub: true,
        },
      });
    } else {
      // No GSAP: unpinned fallback, scrub across the hero's own height.
      const onScroll = () => {
        const r = this.section.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight || 1)));
        this.scrubber.render(p);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }
}

/* ---------- Count-up stats ---------- */
class StatCounter {
  constructor(el) {
    this.el = el;
    this.target = parseInt(el.dataset.count, 10);
    this.suffix = el.dataset.suffix || "";
  }
  run(duration = 1600) {
    if (prefersReducedMotion) {
      this.el.textContent = this.target + this.suffix;
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4); // strong ease-out
      this.el.textContent = Math.round(this.target * eased) + this.suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

class StatsStrip {
  constructor() {
    this.section = document.querySelector(".stats");
    this.counters = [...document.querySelectorAll("[data-count]")].map((el) => new StatCounter(el));
    this.word = document.querySelector("[data-word]");
  }
  init() {
    const fire = () => {
      this.counters.forEach((c, i) => setTimeout(() => c.run(), i * 120));
      if (this.word && hasGSAP && !prefersReducedMotion) {
        window.gsap.from(this.word, {
          opacity: 0, y: 26, duration: 1, ease: "power4.out", delay: 0.5,
        });
      }
    };
    if (hasGSAP) {
      window.ScrollTrigger.create({
        trigger: this.section, start: "top 72%", once: true, onEnter: fire,
      });
    } else {
      new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting) { fire(); obs.disconnect(); }
      }, { threshold: 0.3 }).observe(this.section);
    }
  }
}

/* ---------- Pillars: pinned sequential reveal ---------- */
class PillarsSequence {
  constructor() {
    this.section = document.querySelector(".pillars");
    this.stage = document.querySelector(".pillars__stage");
    this.items = [...document.querySelectorAll("[data-pillar]")];
  }
  init() {
    if (prefersReducedMotion || !hasGSAP) {
      this.items.forEach((p) => p.classList.add("is-active"));
      return;
    }
    window.ScrollTrigger.create({
      trigger: this.section,
      start: "top top",
      end: "+=" + this.items.length * 60 + "%",
      pin: this.stage,
      scrub: true,
      onUpdate: (st) => {
        // One pillar owns the spotlight at a time.
        const idx = Math.min(this.items.length - 1,
          Math.floor(st.progress * this.items.length));
        this.items.forEach((p, i) => p.classList.toggle("is-active", i <= idx));
      },
    });
  }
}

/* ---------- Work cards: pointer-tracked depth ---------- */
class CardTilt {
  constructor(card) {
    this.card = card;
    this.inner = card.querySelector(".card__inner");
    if (prefersReducedMotion || isMobile) return;
    card.addEventListener("pointermove", (e) => this.move(e));
    card.addEventListener("pointerleave", () => this.reset());
  }
  move(e) {
    const r = this.card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    this.inner.style.transform =
      `rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 9}deg) translateZ(8px)`;
    this.inner.style.setProperty("--mx", x * 100 + "%");
    this.inner.style.setProperty("--my", y * 100 + "%");
  }
  reset() {
    this.inner.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
  }
}

/* ---------- Lazy background videos (clips 2 & 3) ---------- */
class BackdropVideos {
  init() {
    document.querySelectorAll("[data-video]").forEach((video) => {
      const url = CONFIG.videos[video.dataset.video];
      if (!url || prefersReducedMotion) return; // designed scrim carries the section
      new IntersectionObserver((entries, obs) => {
        if (!entries[0].isIntersecting) return;
        video.src = url;
        video.load();
        video.addEventListener("canplay", () => {
          video.classList.add("is-live");
          video.play().catch(() => {});
        }, { once: true });
        obs.disconnect();
      }, { rootMargin: "400px" }).observe(video);
    });
  }
}

/* ---------- Link + misc wiring ---------- */
class SiteChrome {
  init() {
    document.querySelectorAll("[data-link]").forEach((a) => {
      const href = CONFIG.links[a.dataset.link];
      if (href) a.href = href;
    });
    const y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }
}

/* ---------- App ---------- */
class App {
  async start() {
    new SmoothScroll();
    new SiteChrome().init();

    const kinetic = new KineticType();
    kinetic.scrollIn(".finale__heading", ".finale", { stagger: 0.03 });

    if (hasGSAP && !prefersReducedMotion) {
      window.gsap.from(".work__heading", {
        opacity: 0, y: 40, duration: 1, ease: "power4.out",
        scrollTrigger: { trigger: ".work", start: "top 70%", once: true },
      });
      window.gsap.from(".card", {
        opacity: 0, y: 60, duration: 0.9, ease: "power4.out", stagger: 0.12,
        scrollTrigger: { trigger: ".work__cards", start: "top 82%", once: true },
      });
    }

    new StatsStrip().init();
    new PillarsSequence().init();
    new BackdropVideos().init();
    document.querySelectorAll("[data-card]").forEach((c) => new CardTilt(c));

    await new HeroOrbit(kinetic).init();

    if (hasGSAP) window.ScrollTrigger.refresh();
  }
}

new App().start();
