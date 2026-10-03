"use client";

import { useEffect, useRef } from "react";

/**
 * Drifting embers that ride a slowly shifting flow field.
 * The field is reseeded every load, so no two visits look the same.
 * Move the pointer to stir them; click or tap empty space for a spark burst.
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

const BURST = 16;
const POINTER_RADIUS = 150;

function readPalette() {
  const style = getComputedStyle(document.documentElement);
  const dark = document.documentElement.classList.contains("dark");
  const ring = style.getPropertyValue("--ring").trim() || "#ffb25e";
  const primary = style.getPropertyValue("--primary").trim() || "#8c2312";
  const foreground = style.getPropertyValue("--foreground").trim() || "#f5ede4";

  return dark
    ? { colors: [ring, ring, foreground, "#c97b4a"], alpha: 0.75 }
    : { colors: [primary, primary, "#c97b4a", "#a0522d"], alpha: 0.6 };
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
    const particles: Particle[] = [];

    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };

    function spawn(p: Partial<Particle> = {}): Particle {
      const x = p.x ?? Math.random() * width;
      const y = p.y ?? Math.random() * height;
      const maxLife = p.maxLife ?? 6 + Math.random() * 10;
      return {
        x,
        y,
        px: x,
        py: y,
        vx: p.vx ?? 0,
        vy: p.vy ?? 0,
        life: p.life ?? 0,
        maxLife,
        size: p.size ?? 0.6 + Math.random() * Math.random() * 1.8,
        tint: Math.floor(Math.random() * palette.colors.length),
        twinkle: Math.random() * Math.PI * 2,
        spark: p.spark ?? false,
      };
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
      target = Math.round(Math.min(220, Math.max(60, (width * height) / 7000)));
      while (particles.length < target) {
        particles.push(spawn({ life: Math.random() * 8 }));
      }
      if (particles.length > target) particles.length = target;
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

    let elapsed = 0;

    function step(dt: number) {
      elapsed += dt;
      // A slow global "breeze" that wanders so the field never settles.
      const gust = Math.sin(elapsed * 0.11) * 0.25;
      const speed = 22;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.px = p.x;
        p.py = p.y;
        p.life += dt;

        const angle = flow(p.x, p.y, elapsed) + gust;
        const lift = p.spark ? 0 : -6;
        const ax = Math.cos(angle) * speed - p.vx;
        const ay = Math.sin(angle) * speed + lift - p.vy;
        const steer = p.spark ? 0.6 : 1.4;
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
            const swirl = 160 * falloff;
            p.vx += ((-dy / d) * swirl + (dx / d) * 40 * falloff) * dt;
            p.vy += ((dx / d) * swirl + (dy / d) * 40 * falloff) * dt;
            p.vx += pointer.vx * falloff * 0.04;
            p.vy += pointer.vy * falloff * 0.04;
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
          if (p.spark || particles.length > target) particles.splice(i, 1);
          else particles[i] = spawn();
        }
      }
      pointer.vx *= 0.85;
      pointer.vy *= 0.85;
    }

    function draw() {
      g.clearRect(0, 0, width, height);
      g.lineCap = "round";
      for (const p of particles) {
        const fadeIn = Math.min(p.life / 1.5, 1);
        const fadeOut = Math.min((p.maxLife - p.life) / 2, 1);
        const flicker = 0.7 + Math.sin(elapsed * 2.4 + p.twinkle) * 0.3;
        const alpha = Math.max(0, fadeIn * fadeOut * flicker * palette.alpha);
        if (alpha < 0.01) continue;

        g.globalAlpha = alpha;
        g.strokeStyle = palette.colors[p.tint % palette.colors.length];
        g.lineWidth = p.size * (p.spark ? 1.2 : 1);
        // Stretch each ember along its motion for a soft comet tail.
        const tail = p.spark ? 5 : 3.5;
        g.beginPath();
        g.moveTo(p.x - (p.x - p.px) * tail, p.y - (p.y - p.py) * tail);
        g.lineTo(p.x, p.y);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    function burst(x: number, y: number) {
      for (let i = 0; i < BURST; i++) {
        const a = (i / BURST) * Math.PI * 2 + Math.random() * 0.4;
        const v = 70 + Math.random() * 110;
        particles.push(
          spawn({
            x,
            y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            maxLife: 1.6 + Math.random() * 1.6,
            size: 0.8 + Math.random() * 1.4,
            spark: true,
          }),
        );
      }
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
      if (!motionQuery.matches) burst(x, y);
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
    // Give reduced-motion visitors a still scatter instead of streaks.
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
