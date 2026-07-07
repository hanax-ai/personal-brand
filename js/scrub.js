/* ============================================================
   SCRUB ENGINE
   ------------------------------------------------------------
   Tiered strategy (highest fidelity first, graceful degrade):

   Tier A — FrameScrubber
     Extracts N frames from the hero clip into compressed JPEG
     blobs, then keeps a sliding window of decoded ImageBitmaps
     around the scroll playhead. Rendering a pre-decoded bitmap
     per rAF is what makes the scrub buttery — no seek latency.
     Requires CORS-readable video (canvas readback).

   Tier B — LiveVideoScrubber
     If the CDN doesn't send CORS headers, canvas readback is
     blocked — but drawImage(video) still *displays*. We keep a
     hidden <video>, lerp currentTime toward the scroll target,
     and paint each rAF. Smooth-ish, seek-latency dependent.

   Tier C — StaticHero (in main.js)
     If the video can't load at all, the hero falls back to the
     designed gradient + grain and the type still performs.
   ============================================================ */

/** Cover-fit draw: fills the canvas like CSS object-fit: cover. */
function drawCover(ctx, source, sw, sh) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const scale = Math.max(cw / sw, ch / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

/** Base class: shared canvas sizing + progress plumbing (OCP-friendly). */
class ScrubberBase {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.opts = opts;
    this.progress = 0;
    this.ready = false;
    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize, { passive: true });
    this._onResize();
  }
  _onResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.opts.dprCap || 1.5);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    if (this.ready) this.render(this.progress, true);
  }
  render(_progress, _force) { /* implemented by subclasses */ }
  destroy() { window.removeEventListener("resize", this._onResize); }
}

/* ------------------------------------------------------------
   Tier A — pre-extracted frame sequence
   ------------------------------------------------------------ */
export class FrameScrubber extends ScrubberBase {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string} videoUrl
   * @param {object} opts { frames, maxEdge, jpegQuality, decodeWindow, dprCap, onProgress }
   */
  constructor(canvas, videoUrl, opts = {}) {
    super(canvas, opts);
    this.videoUrl = videoUrl;
    this.frames = opts.frames || 96;
    this.blobs = new Array(this.frames).fill(null);
    this.bitmaps = new Map();      // index -> ImageBitmap
    this.lru = [];                 // decode-order for eviction
    this.frameW = 0;
    this.frameH = 0;
    this.lastDrawn = -1;
    this._decodeQueue = Promise.resolve();
  }

  /** Extract frames. Throws "TAINTED" if CORS readback is blocked. */
  async init() {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = this.videoUrl;

    await new Promise((res, rej) => {
      video.addEventListener("loadedmetadata", res, { once: true });
      video.addEventListener("error", () => rej(new Error("VIDEO_LOAD")), { once: true });
    });

    const edge = this.opts.maxEdge || 1440;
    const scale = Math.min(1, edge / Math.max(video.videoWidth, video.videoHeight));
    this.frameW = Math.round(video.videoWidth * scale);
    this.frameH = Math.round(video.videoHeight * scale);

    const off = document.createElement("canvas");
    off.width = this.frameW;
    off.height = this.frameH;
    const octx = off.getContext("2d", { willReadFrequently: false });

    // Trim the extreme tail: last frames of generated clips can stutter.
    const usable = Math.max(0.1, video.duration - 0.1);

    for (let i = 0; i < this.frames; i++) {
      const t = 0.05 + (usable - 0.05) * (i / (this.frames - 1));
      await this._seek(video, t);
      octx.drawImage(video, 0, 0, this.frameW, this.frameH);

      if (i === 0) {
        // CORS taint probe — readback throws on tainted canvases.
        try { octx.getImageData(0, 0, 1, 1); }
        catch (e) { throw new Error("TAINTED"); }
      }

      this.blobs[i] = await new Promise((res) =>
        off.toBlob(res, "image/jpeg", this.opts.jpegQuality || 0.85)
      );

      if (i === 0) {
        // First frame on screen ASAP.
        await this._decode(0);
        this.render(0, true);
      }
      if (this.opts.onProgress) this.opts.onProgress((i + 1) / this.frames);
    }

    this.ready = true;
    return this;
  }

  _seek(video, t) {
    return new Promise((res) => {
      const done = () => res();
      if ("requestVideoFrameCallback" in video) {
        video.requestVideoFrameCallback(done);
      } else {
        video.addEventListener("seeked", done, { once: true });
      }
      video.currentTime = t;
    });
  }

  async _decode(i) {
    if (this.bitmaps.has(i) || !this.blobs[i]) return;
    const bmp = await createImageBitmap(this.blobs[i]);
    this.bitmaps.set(i, bmp);
    this.lru.push(i);
    const cap = (this.opts.decodeWindow || 16) * 2;
    while (this.lru.length > cap) {
      const evict = this.lru.shift();
      if (evict !== this._target) {
        const b = this.bitmaps.get(evict);
        if (b) b.close();
        this.bitmaps.delete(evict);
      }
    }
  }

  /** Decode the target frame first, then fan outward — keeps scrubs ahead of the playhead. */
  _ensureWindow(target) {
    this._target = target;
    const half = Math.floor((this.opts.decodeWindow || 16) / 2);
    this._decodeQueue = this._decodeQueue.then(async () => {
      await this._decode(target);
      for (let d = 1; d <= half; d++) {
        const a = target + d, b = target - d;
        if (a < this.frames) await this._decode(a);
        if (b >= 0) await this._decode(b);
      }
      // Repaint in case the exact frame arrived after we drew a neighbour.
      if (this._target === target) this.render(this.progress, true);
    }).catch(() => {});
  }

  /** Draw the frame nearest to `progress` (0..1). */
  render(progress, force = false) {
    this.progress = progress;
    const target = Math.max(0, Math.min(this.frames - 1,
      Math.round(progress * (this.frames - 1))));

    if (!this.bitmaps.has(target)) this._ensureWindow(target);

    // Nearest decoded frame so the canvas never blanks mid-scroll.
    let best = -1, bestDist = Infinity;
    for (const k of this.bitmaps.keys()) {
      const d = Math.abs(k - target);
      if (d < bestDist) { bestDist = d; best = k; }
    }
    if (best === -1) return;
    if (!force && best === this.lastDrawn) return;

    drawCover(this.ctx, this.bitmaps.get(best), this.frameW, this.frameH);
    this.lastDrawn = best;

    if (bestDist > 0) this._ensureWindow(target);
  }
}

/* ------------------------------------------------------------
   Tier B — live video seek (no CORS readback required)
   ------------------------------------------------------------ */
export class LiveVideoScrubber extends ScrubberBase {
  constructor(canvas, videoUrl, opts = {}) {
    super(canvas, opts);
    this.videoUrl = videoUrl;
    this.targetT = 0;
    this._raf = null;
  }

  async init() {
    this.video = document.createElement("video");
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = "auto";
    this.video.src = this.videoUrl;

    await new Promise((res, rej) => {
      this.video.addEventListener("loadeddata", res, { once: true });
      this.video.addEventListener("error", () => rej(new Error("VIDEO_LOAD")), { once: true });
    });

    this.duration = Math.max(0.1, this.video.duration - 0.1);
    this.ready = true;
    if (this.opts.onProgress) this.opts.onProgress(1);

    const loop = () => {
      // Lerp toward the scroll target: absorbs seek latency into motion.
      const cur = this.video.currentTime;
      const next = cur + (this.targetT - cur) * 0.35;
      if (Math.abs(next - cur) > 0.005) {
        try { this.video.currentTime = next; } catch (e) { /* seek in flight */ }
      }
      drawCover(this.ctx, this.video, this.video.videoWidth, this.video.videoHeight);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
    return this;
  }

  render(progress) {
    this.progress = progress;
    this.targetT = 0.05 + progress * (this.duration - 0.05);
  }

  destroy() {
    super.destroy();
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}

/**
 * Factory: try Tier A, degrade to Tier B on CORS taint.
 * Rejects only if the video itself can't load (Tier C handled by caller).
 */
export async function createScrubber(canvas, videoUrl, opts) {
  try {
    return await new FrameScrubber(canvas, videoUrl, opts).init();
  } catch (e) {
    if (e && e.message === "TAINTED") {
      return await new LiveVideoScrubber(canvas, videoUrl, opts).init();
    }
    throw e;
  }
}
