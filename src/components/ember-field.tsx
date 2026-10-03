"use client";

import { useEffect, useRef } from "react";

/**
 * Embers riding a slowly shifting flow field.
 * The field is reseeded every load, so no two visits look the same.
 * Move the pointer to stir them and leave a spark trail. Random flares pop
 * on their own, and a wall of fire burns along the bottom of the screen,
 * bending away from the pointer and feeding sparks into the field.
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
const MAX_SPARKS = 280;
const MAX_TAIL = 36;
const FIRE_STEP = 6;

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
    const particles: Particle[] = [];

    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
    const fire = { base: 0, h: 0, shear: 0, heat: 0, heatX: 0 };

    // 0..1 height of the fire surface at x. Rows of sharp-crested ridges
    // drift in opposite directions at different speeds; where they line up a
    // flame shoots up, then splits and dies away, so the line never repeats.
    function ridge(u: number) {
      return 1 - Math.abs(Math.sin(u));
    }
    function profile(x: number, t: number, offset: number) {
      const spikes =
        Math.pow(ridge(x * 0.021 + t * 1.1 + seed[0] + offset), 3) * 0.55 +
        Math.pow(ridge(x * 0.047 - t * 1.9 + seed[1] + offset * 1.7), 3) * 0.45 +
        Math.pow(ridge(x * 0.11 + t * 3.4 + seed[2] + offset * 2.3), 2) * 0.22;
      const swell = 0.75 + 0.25 * Math.sin(x * 0.0055 - t * 0.45 + seed[0]);
      const flicker = 1 + 0.12 * Math.sin(t * 9.7 + x * 0.06 + offset * 3);
      const dx = (x - fire.heatX) / 110;
      const heat = fire.heat * 0.5 * Math.exp(-dx * dx);
      return 0.22 + spikes * swell * flicker + heat;
    }
    // Horizontal push away from the pointer, strongest at the flame tips.
    function bend(x: number) {
      if (fire.heat < 0.01) return 0;
      const dx = (x - fire.heatX) / 120;
      return Math.sign(dx) * fire.heat * 26 * Math.exp(-dx * dx);
    }
    // Little licks of fire that break off the tips and burn out as they rise.
    const licks: { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number }[] = [];
    let lickBudget = 0;
    let sparkBudget = 0;

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
      fire.h = Math.min(80, Math.max(48, Math.min(width, height) * 0.085));
      fire.base = height + 2;
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

      // The whole fire leans with the breeze; a nearby pointer heats the
      // flames under it and pushes them aside.
      fire.shear += (gust * 18 - fire.shear) * Math.min(dt * 2, 1);
      let heatTarget = 0;
      if (pointer.active) {
        const above = fire.base - fire.h - pointer.y;
        heatTarget = Math.max(0, 1 - Math.max(above, 0) / 260);
        fire.heatX += (pointer.x - fire.heatX) * Math.min(dt * 6, 1);
      }
      fire.heat += (heatTarget - fire.heat) * Math.min(dt * 3, 1);

      // Licks break off the tallest peaks; sparks rise all along the line.
      lickBudget += dt * (width / 60);
      while (lickBudget >= 1) {
        lickBudget--;
        let x = Math.random() * width;
        let f = profile(x, elapsed, 0);
        for (let k = 0; k < 2; k++) {
          const cx = x + (Math.random() - 0.5) * 60;
          const cf = profile(cx, elapsed, 0);
          if (cf > f) {
            x = cx;
            f = cf;
          }
        }
        licks.push({
          x: x + fire.shear * f + bend(x) * f,
          y: fire.base - fire.h * f * 0.9,
          vx: fire.shear * 1.5 + (Math.random() - 0.5) * 14,
          vy: -(70 + Math.random() * 50),
          r: fire.h * (0.025 + Math.random() * 0.035),
          life: 0,
          max: 0.22 + Math.random() * 0.22,
        });
      }
      for (let i = licks.length - 1; i >= 0; i--) {
        const l = licks[i];
        l.life += dt;
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        if (l.life > l.max) licks.splice(i, 1);
      }

      sparkBudget += dt * (width / 220);
      while (sparkBudget >= 1) {
        sparkBudget--;
        const x = Math.random() * width;
        addSpark({
          x,
          y: fire.base - fire.h * profile(x, elapsed, 0) * 0.9,
          vx: gust * 30 + (Math.random() - 0.5) * 30,
          vy: -(50 + Math.random() * 80),
          maxLife: 1.8 + Math.random() * 2,
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

    // Sample the fire surface every few pixels and fill under it with a
    // vertical gradient. Each layer is offset in time and space so the
    // outer, mid and core flames move independently.
    function fireLayer(scale: number, offset: number, rgb: string) {
      const { base, h } = fire;
      const top = base - h * scale * 1.15;
      const grad = g.createLinearGradient(0, base, 0, top);
      grad.addColorStop(0, `rgba(${rgb}, 1)`);
      grad.addColorStop(0.45, `rgba(${rgb}, 0.92)`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(-20, height);
      let prevX = -20;
      let prevY = base;
      for (let x = -20; x <= width + 26; x += FIRE_STEP) {
        const f = profile(x, elapsed, offset);
        const px = x + fire.shear * f + bend(x) * f;
        const py = base - h * scale * f;
        // Curve through midpoints so the surface stays smooth and liquid.
        g.quadraticCurveTo(prevX, prevY, (prevX + px) / 2, (prevY + py) / 2);
        prevX = px;
        prevY = py;
      }
      g.lineTo(prevX, prevY);
      g.lineTo(width + 20, height);
      g.closePath();
      g.fill();
    }

    function drawFire() {
      const t = elapsed;
      const { base, h } = fire;
      const colors = palette.flame;

      // Heat glow rising off the whole fire line.
      g.globalCompositeOperation = palette.glow ? "lighter" : "source-over";
      g.globalAlpha = 0.9 + Math.sin(t * 9) * 0.1;
      const glowTop = base - h * 3;
      const halo = g.createLinearGradient(0, height, 0, glowTop);
      halo.addColorStop(0, colors.halo);
      halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      g.fillStyle = halo;
      g.fillRect(0, glowTop, width, height - glowTop);

      g.globalCompositeOperation = "source-over";
      for (const l of licks) {
        const k = l.life / l.max;
        g.globalAlpha = (1 - k) * 0.85;
        g.fillStyle = `rgb(${k < 0.35 ? colors.mid : colors.outer})`;
        g.beginPath();
        g.arc(l.x, l.y, Math.max(l.r * (1 - k), 0.1), 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;

      // Inner layers use nearly the same surface so they stay nested inside.
      fireLayer(1, 0, colors.outer);
      fireLayer(0.66, 0.35, colors.mid);
      fireLayer(0.38, 0.7, colors.core);
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
      drawFire();
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
