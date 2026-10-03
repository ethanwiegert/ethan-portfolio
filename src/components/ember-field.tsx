"use client";

import { useEffect, useRef } from "react";

/**
 * Embers riding a slowly shifting flow field.
 * The field is reseeded every load, so no two visits look the same.
 * Move the pointer to stir them and leave a spark trail. Random flares pop
 * on their own, and a small flame burns at the bottom of the screen, leaning
 * away from the pointer and feeding sparks into the field.
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

const FLARE = 14;
const POINTER_RADIUS = 190;
const FLAME_BOTTOM = 26;
const MAX_SPARKS = 280;
const MAX_TAIL = 36;

type Palette = {
  colors: string[];
  alpha: number;
  glow: boolean;
  flame: { outer: string; mid: string; core: string; halo: string };
};

function readPalette(): Palette {
  const dark = document.documentElement.classList.contains("dark");
  // Light mode uses deep, saturated inks so embers read against the cream;
  // dark mode uses hot ambers drawn additively so overlaps glow.
  return dark
    ? {
        colors: ["#ffb25e", "#ffc98a", "#ff8a3d", "#fff1dc"],
        alpha: 1,
        glow: true,
        flame: {
          outer: "255, 86, 24",
          mid: "255, 170, 64",
          core: "255, 244, 214",
          halo: "rgba(255, 120, 40, 0.32)",
        },
      }
    : {
        colors: ["#8c2312", "#6e1a0c", "#b8431e", "#3a1a10"],
        alpha: 0.95,
        glow: false,
        flame: {
          outer: "176, 44, 12",
          mid: "234, 110, 24",
          core: "252, 206, 80",
          halo: "rgba(234, 88, 12, 0.16)",
        },
      };
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
    let nextFlameSpark = 0.4;
    const particles: Particle[] = [];

    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
    const flame = { x: 0, base: 0, w: 0, h: 0, lean: 0, sway: 0 };
    // Little licks of fire that break off the tip and burn out as they rise.
    const licks: { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number }[] = [];
    let nextLick = 0;

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
        tint: p.tint ?? Math.floor(Math.random() * 4),
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
      const rect = cvs.getBoundingClientRect();
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
      flame.h = Math.min(54, Math.max(36, Math.min(width, height) * 0.06));
      flame.w = flame.h * 0.34;
      flame.x = width / 2;
      flame.base = height - FLAME_BOTTOM;
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

    function burst(x: number, y: number, count: number, power: number) {
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
        );
      }

      // The flame sways in the breeze and leans away from a nearby pointer.
      let leanTarget = gust * flame.w;
      if (pointer.active) {
        const dx = pointer.x - flame.x;
        const dy = pointer.y - (flame.base - flame.h / 2);
        const d = Math.hypot(dx, dy);
        if (d < 260 && d > 1) leanTarget -= (dx / d) * (1 - d / 260) * flame.w * 1.6;
      }
      flame.lean += (leanTarget - flame.lean) * Math.min(dt * 4, 1);
      flame.sway =
        (Math.sin(elapsed * 2.3) * 0.5 + Math.sin(elapsed * 6.7 + 1) * 0.25) *
          flame.w *
          0.5 +
        flame.lean;

      nextLick -= dt;
      if (nextLick <= 0) {
        nextLick = 0.05 + Math.random() * 0.08;
        licks.push({
          x: flame.x + flame.sway * 0.7 + (Math.random() - 0.5) * flame.w * 0.7,
          y: flame.base - flame.h * (0.35 + Math.random() * 0.2),
          vx: flame.lean * 1.2 + (Math.random() - 0.5) * 12,
          vy: -(60 + Math.random() * 40),
          r: flame.w * (0.18 + Math.random() * 0.14),
          life: 0,
          max: 0.2 + Math.random() * 0.18,
        });
      }
      for (let i = licks.length - 1; i >= 0; i--) {
        const l = licks[i];
        l.life += dt;
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        if (l.life > l.max) licks.splice(i, 1);
      }

      nextFlameSpark -= dt;
      if (nextFlameSpark <= 0) {
        nextFlameSpark = 0.15 + Math.random() * 0.45;
        addSpark({
          x: flame.x + flame.sway * 0.8 + (Math.random() - 0.5) * flame.w * 0.6,
          y: flame.base - flame.h * 0.75,
          vx: flame.lean * 1.5 + (Math.random() - 0.5) * 30,
          vy: -(50 + Math.random() * 70),
          maxLife: 1.8 + Math.random() * 1.8,
          size: 0.8 + Math.random() * 1.2,
          tint: Math.random() < 0.5 ? 0 : 2,
        });
      }

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

      pointer.vx *= 0.85;
      pointer.vy *= 0.85;
    }

    // One teardrop "tongue" of the flame: round at the base, pointed at the tip.
    function tongue(w: number, h: number, tipX: number, wobble: number, rgb: string) {
      const { x, base } = flame;
      const grad = g.createLinearGradient(0, base, 0, base - h);
      grad.addColorStop(0, `rgba(${rgb}, 1)`);
      grad.addColorStop(0.55, `rgba(${rgb}, 0.9)`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(x, base);
      g.bezierCurveTo(
        x - w * 1.1,
        base - h * 0.04,
        x - w * (0.95 + wobble),
        base - h * 0.55,
        x + tipX,
        base - h,
      );
      g.bezierCurveTo(
        x + w * (0.95 - wobble),
        base - h * 0.55,
        x + w * 1.1,
        base - h * 0.04,
        x,
        base,
      );
      g.fill();
    }

    function drawFlame() {
      const t = elapsed;
      const { x, base, w, h, sway } = flame;
      const colors = palette.flame;
      const flick =
        1 + Math.sin(t * 11) * 0.06 + Math.sin(t * 17.3 + 2) * 0.04 + Math.sin(t * 5.1) * 0.05;
      const wob = Math.sin(t * 9.1) * 0.12;

      // Warm glow pooled around the flame.
      g.globalCompositeOperation = palette.glow ? "lighter" : "source-over";
      g.globalAlpha = 0.85 + Math.sin(t * 13) * 0.15;
      const r = h * 1.9;
      const halo = g.createRadialGradient(x, base - h * 0.35, 0, x, base - h * 0.35, r);
      halo.addColorStop(0, colors.halo);
      halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      g.fillStyle = halo;
      g.fillRect(x - r, base - h * 0.35 - r, r * 2, r * 2);

      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;

      for (const l of licks) {
        const k = l.life / l.max;
        g.globalAlpha = (1 - k) * 0.85;
        g.fillStyle = `rgb(${colors.outer})`;
        g.beginPath();
        g.arc(l.x, l.y, Math.max(l.r * (1 - k), 0.1), 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      tongue(w, h * flick, sway, wob, colors.outer);
      tongue(w * 0.66, h * 0.74 * (2 - flick), sway * 0.75, -wob, colors.mid);
      tongue(w * 0.36, h * 0.42 * flick, sway * 0.45, wob * 0.5, colors.core);
    }

    function draw() {
      g.clearRect(0, 0, width, height);
      g.globalCompositeOperation = palette.glow ? "lighter" : "source-over";

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
      drawFlame();
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
    const onUp = (e: PointerEvent) => {
      // Touch has no hover, so let the swirl go when the finger lifts.
      if (e.pointerType !== "mouse") pointer.active = false;
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onLeave);
    host.addEventListener("pointerleave", onLeave);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!rafId) draw();
    });
    resizeObserver.observe(cvs);

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
      host.removeEventListener("pointerdown", onMove);
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
