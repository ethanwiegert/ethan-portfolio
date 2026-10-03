"use client";

import { useEffect, useRef } from "react";

/**
 * Embers riding a slowly shifting flow field.
 * The field is reseeded every load, so no two visits look the same.
 * Move the pointer to stir them and leave a spark trail; click or tap empty
 * space for a burst and shockwave. Random flares pop on their own too.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  px: number;
  py: number;
  life: number;
  maxLife: number;
  size: number;
  tint: number;
  twinkle: number;
  spark: boolean;
};

type Ring = { x: number; y: number; age: number; max: number; strength: number };

const BURST = 30;
const FLARE = 14;
const POINTER_RADIUS = 190;
const SHOCK_RADIUS = 240;
const MAX_SPARKS = 280;
const MAX_TAIL = 36;

type Palette = {
  colors: string[];
  alpha: number;
  glow: boolean;
};

function readPalette(): Palette {
  const dark = document.documentElement.classList.contains("dark");
  // Light mode uses deep, saturated inks so embers read against the cream;
  // dark mode uses hot ambers drawn additively so overlaps glow.
  return dark
    ? { colors: ["#ffb25e", "#ffc98a", "#ff8a3d", "#fff1dc"], alpha: 1, glow: true }
    : { colors: ["#8c2312", "#6e1a0c", "#b8431e", "#3a1a10"], alpha: 0.95, glow: false };
}

export function EmberField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const host = canvas?.parentElement;
    if (!canvas || !ctx || !host) return;
    const cvs = canvas;
    const g = ctx;

    const seed = [Math.random() * 100, Math.random() * 100, Math.random() * 100];
    const freq = 0.0016 + Math.random() * 0.0012;
    let palette = readPalette();
    let width = 0;
    let height = 0;
    let target = 0;
    let sparkCount = 0;
    let nextFlare = 1.5 + Math.random() * 2;
    const particles: Particle[] = [];
    const rings: Ring[] = [];

    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false, glow: 0 };

    function spawn(p: Partial<Particle> = {}): Particle {
      const x = p.x ?? Math.random() * width;
      const y = p.y ?? Math.random() * height;
      const maxLife = p.maxLife ?? 7 + Math.random() * 10;
      return {
        x,
        y,
        px: x,
        py: y,
        vx: p.vx ?? 0,
        vy: p.vy ?? 0,
        life: p.life ?? 0,
        maxLife,
        size: p.size ?? 0.9 + Math.random() * Math.random() * 2.6,
        tint: Math.floor(Math.random() * 4),
        twinkle: Math.random() * Math.PI * 2,
        spark: p.spark ?? false,
      };
    }

    function addSpark(p: Partial<Particle>) {
      if (sparkCount >= MAX_SPARKS) return;
      sparkCount++;
      particles.push(spawn({ ...p, spark: true }));
    }

    function resize() {
      const rect = host!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = Math.round(width * dpr);
      cvs.height = Math.round(height * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Scale density to area so phones stay light and big screens stay full.
      target = Math.round(Math.min(340, Math.max(120, (width * height) / 4200)));
      const embers = particles.filter((p) => !p.spark).length;
      for (let i = embers; i < target; i++) {
        particles.push(spawn({ life: Math.random() * 8 }));
      }
    }

    function flow(x: number, y: number, t: number) {
      return (
        (Math.sin(x * freq + seed[0] + t * 0.07) +
          Math.cos(y * freq * 1.3 + seed[1] - t * 0.05) +
          Math.sin((x - y) * freq * 0.6 + seed[2] + t * 0.03)) *
        Math.PI *
        0.7
      );
    }

    function burst(x: number, y: number, count: number, power: number, ring: boolean) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const v = (60 + Math.random() * 160) * power;
        addSpark({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          maxLife: 1.4 + Math.random() * 1.8,
          size: 1 + Math.random() * 1.8,
        });
      }
      if (!ring) return;
      rings.push({ x, y, age: 0, max: 0.9, strength: power });
      // Shove the nearby embers outward so the whole field reacts.
      for (const p of particles) {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy);
        if (d > 1 && d < SHOCK_RADIUS) {
          const kick = (1 - d / SHOCK_RADIUS) * 260 * power;
          p.vx += (dx / d) * kick;
          p.vy += (dy / d) * kick;
        }
      }
    }

    let elapsed = 0;

    function step(dt: number) {
      elapsed += dt;
      // A slow global "breeze" that wanders so the field never settles.
      const gust = Math.sin(elapsed * 0.11) * 0.35;
      const speed = 26;

      nextFlare -= dt;
      if (nextFlare <= 0) {
        nextFlare = 2.5 + Math.random() * 4;
        burst(
          width * (0.1 + Math.random() * 0.8),
          height * (0.1 + Math.random() * 0.8),
          FLARE,
          0.55,
          false,
        );
      }

      pointer.glow += ((pointer.active ? 1 : 0) - pointer.glow) * Math.min(dt * 5, 1);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.px = p.x;
        p.py = p.y;
        p.life += dt;

        const angle = flow(p.x, p.y, elapsed) + gust;
        const lift = p.spark ? 4 : -8;
        const ax = Math.cos(angle) * speed - p.vx;
        const ay = Math.sin(angle) * speed + lift - p.vy;
        const steer = p.spark ? 0.9 : 1.3;
        p.vx += ax * steer * dt;
        p.vy += ay * steer * dt;

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_RADIUS * POINTER_RADIUS && d2 > 1) {
            const d = Math.sqrt(d2);
            const falloff = 1 - d / POINTER_RADIUS;
            // Swirl around the pointer, nudged along by how fast it moves.
            const swirl = 280 * falloff;
            p.vx += ((-dy / d) * swirl + (dx / d) * 60 * falloff) * dt;
            p.vy += ((dx / d) * swirl + (dy / d) * 60 * falloff) * dt;
            p.vx += pointer.vx * falloff * 0.06;
            p.vy += pointer.vy * falloff * 0.06;
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const margin = 40;
        const gone =
          p.life > p.maxLife ||
          p.x < -margin ||
          p.x > width + margin ||
          p.y < -margin ||
          p.y > height + margin;
        if (gone) {
          if (p.spark) {
            particles.splice(i, 1);
            sparkCount--;
          } else if (particles.length - sparkCount > target) {
            particles.splice(i, 1);
          } else {
            particles[i] = spawn();
          }
        }
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].age += dt;
        if (rings[i].age > rings[i].max) rings.splice(i, 1);
      }

      pointer.vx *= 0.85;
      pointer.vy *= 0.85;
    }

    function draw() {
      g.clearRect(0, 0, width, height);
      g.globalCompositeOperation = palette.glow ? "lighter" : "source-over";

      if (pointer.glow > 0.01) {
        const r = 150;
        const grad = g.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, r);
        grad.addColorStop(0, palette.colors[0]);
        grad.addColorStop(1, "transparent");
        g.globalAlpha = pointer.glow * (palette.glow ? 0.16 : 0.1);
        g.fillStyle = grad;
        g.fillRect(pointer.x - r, pointer.y - r, r * 2, r * 2);
      }

      for (const ring of rings) {
        const t = ring.age / ring.max;
        const eased = 1 - (1 - t) * (1 - t);
        g.globalAlpha = (1 - t) * 0.6 * palette.alpha;
        g.strokeStyle = palette.colors[0];
        g.lineWidth = 2 * (1 - t) + 0.5;
        g.beginPath();
        g.arc(ring.x, ring.y, eased * 170 * ring.strength, 0, Math.PI * 2);
        g.stroke();
      }

      g.lineCap = "round";
      for (const p of particles) {
        const fadeIn = Math.min(p.life / 1.2, 1);
        const fadeOut = Math.min((p.maxLife - p.life) / 1.5, 1);
        const flicker = 0.6 + Math.sin(elapsed * 2.6 + p.twinkle) * 0.4;
        const alpha = Math.max(0, fadeIn * fadeOut * flicker * palette.alpha);
        if (alpha < 0.02) continue;

        const color = palette.colors[p.tint];
        // Stretch each ember along its motion for a comet tail.
        const tail = p.spark ? 6 : 5;
        let tx = (p.x - p.px) * tail;
        let ty = (p.y - p.py) * tail;
        const len = Math.hypot(tx, ty);
        if (len > MAX_TAIL) {
          tx = (tx / len) * MAX_TAIL;
          ty = (ty / len) * MAX_TAIL;
        }
        g.globalAlpha = alpha * 0.85;
        g.strokeStyle = color;
        g.lineWidth = p.size;
        g.beginPath();
        g.moveTo(p.x - tx, p.y - ty);
        g.lineTo(p.x, p.y);
        g.stroke();

        // A bright head, plus a soft halo on the bigger embers.
        g.globalAlpha = alpha;
        g.fillStyle = color;
        g.beginPath();
        g.arc(p.x, p.y, p.size * 0.75, 0, Math.PI * 2);
        g.fill();
        // Halos only read as glow on dark; on cream they look like smudges.
        if (palette.glow && p.size > 2) {
          g.globalAlpha = alpha * 0.12;
          g.beginPath();
          g.arc(p.x, p.y, p.size * 2.6, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }

    let rafId = 0;
    let last = 0;
    function frame(now: number) {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      step(dt);
      draw();
    }

    let visible = true;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      const run = visible && !document.hidden && !motionQuery.matches;
      if (run && !rafId) {
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      } else if (!run && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (!run) draw();
    }

    function toLocal(e: PointerEvent) {
      const rect = cvs.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    const onMove = (e: PointerEvent) => {
      const { x, y } = toLocal(e);
      if (pointer.active) {
        pointer.vx = x - pointer.x;
        pointer.vy = y - pointer.y;
        // Fast strokes shed a trail of sparks. Huge jumps are the pointer
        // re-entering somewhere else, not a real stroke, so skip those.
        const speed = Math.hypot(pointer.vx, pointer.vy);
        if (speed > 120) {
          pointer.vx = 0;
          pointer.vy = 0;
        } else if (speed > 6 && !motionQuery.matches) {
          const n = Math.min(3, Math.floor(speed / 12) + 1);
          for (let i = 0; i < n; i++) {
            addSpark({
              x: x + (Math.random() - 0.5) * 8,
              y: y + (Math.random() - 0.5) * 8,
              vx: -pointer.vx * 2 + (Math.random() - 0.5) * 80,
              vy: -pointer.vy * 2 + (Math.random() - 0.5) * 80,
              maxLife: 0.8 + Math.random() * 1.2,
              size: 0.8 + Math.random() * 1.4,
            });
          }
        }
      }
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el?.closest("a, button, input, [data-no-burst]")) return;
      const { x, y } = toLocal(e);
      onMove(e);
      if (!motionQuery.matches) burst(x, y, BURST, 1, true);
    };
    const onUp = (e: PointerEvent) => {
      // Touch has no hover, so let the swirl go when the finger lifts.
      if (e.pointerType !== "mouse") pointer.active = false;
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onLeave);
    host.addEventListener("pointerleave", onLeave);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!rafId) draw();
    });
    resizeObserver.observe(host);

    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      sync();
    });
    intersection.observe(host);

    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
      if (!rafId) draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    document.addEventListener("visibilitychange", sync);
    motionQuery.addEventListener("change", sync);

    resize();
    // Give reduced-motion visitors a still scatter instead of a blank field.
    if (motionQuery.matches) {
      for (const p of particles) p.life = Math.max(p.life, 1.5);
    }
    sync();

    return () => {
      cancelAnimationFrame(rafId);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onLeave);
      host.removeEventListener("pointerleave", onLeave);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motionQuery.removeEventListener("change", sync);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
