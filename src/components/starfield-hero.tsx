"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

import { Button } from "@/components/ui/button";

// ---- Scheduling / tuning constants -------------------------------------
const STAR_COUNT = 2000;
const METEOR_MIN_INTERVAL_MS = 2500;
const METEOR_MAX_INTERVAL_MS = 7000;
const METEOR_MIN_GAP_MS = 800; // never two meteors within this window
const MAX_CONCURRENT_METEORS = 2;
const METEOR_MIN_DURATION = 0.9;
const METEOR_MAX_DURATION = 1.6;
const METEOR_TRAIL_SEGMENTS = 24;
const METEOR_TRAIL_LENGTH_MIN = 8;
const METEOR_TRAIL_LENGTH_MAX = 12;
const METEOR_OFFSCREEN_MARGIN_MIN = 2;
const METEOR_OFFSCREEN_MARGIN_MAX = 4;
const METEOR_FADE_FRACTION = 0.1;
const METEOR_TRAIL_FALLOFF = 1.5;
const CAMERA_Z = 30;
const CAMERA_FOV = 60;

// ---- Theme palettes -----------------------------------------------------
const DARK_BG = "#050510";
const LIGHT_BG = "#85a9eb";

const DARK_STAR_PALETTE = [
  "#fff8e7",
  "#fffdf5",
  "#ffd9a0",
  "#ffc97a",
  "#e8ecff",
];
const LIGHT_STAR_PALETTE = [
  "#fff8e7",
  "#fffdf5",
  "#ffd9a0",
  "#ffc97a",
  "#e8ecff",
];

const DARK_STAR_OPACITY = 1.0;
const DARK_STAR_SIZE_SCALE = 1.0;
const LIGHT_STAR_OPACITY = 1.15;
const LIGHT_STAR_SIZE_SCALE = 1.4;

const DARK_METEOR_HEAD = "#fff3d6";
const DARK_METEOR_TRAIL = "#ffd9a0";
const LIGHT_METEOR_HEAD = "#fff3d6";
const LIGHT_METEOR_TRAIL = "#ffd9a0";

// ---- Original GLSL ------------------------------------------------------
const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 color;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uStarSizeScale;
  varying vec3 vColor;
  void main() {
    vColor = color;
    float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
    gl_PointSize = aSize * uPixelRatio * (0.6 + 0.8 * twinkle) * uStarSizeScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STAR_FRAGMENT = /* glsl */ `
  uniform float uStarOpacity;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, alpha * uStarOpacity);
  }
`;

const TRAIL_VERTEX = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TRAIL_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha);
  }
`;

// ---- Small helpers ------------------------------------------------------
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickColor(THREE: typeof import("three"), palette: string[]) {
  const base = palette[Math.floor(Math.random() * palette.length)];
  const c = new THREE.Color(base);
  // gentle per-star jitter
  c.offsetHSL(0, rand(-0.05, 0.05), rand(-0.06, 0.06));
  return c;
}

function makeGlowTexture(THREE: typeof import("three")) {
  const size = 16;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function StarfieldHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      // ---- Renderer / scene / camera ------------------------------------
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

      const scene = new THREE.Scene();
      const bgColor = new THREE.Color(DARK_BG);
      scene.background = bgColor;

      const camera = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        200,
      );
      camera.position.set(0, 0, CAMERA_Z);
      camera.lookAt(0, 0, 0);

      // ---- Star field ----------------------------------------------------
      const starGeo = new THREE.BufferGeometry();
      const starPositions = new Float32Array(STAR_COUNT * 3);
      const starColors = new Float32Array(STAR_COUNT * 3);
      const starSizes = new Float32Array(STAR_COUNT);
      const starPhases = new Float32Array(STAR_COUNT);
      const starSpeeds = new Float32Array(STAR_COUNT);

      for (let i = 0; i < STAR_COUNT; i++) {
        starPositions[i * 3] = rand(-40, 40);
        starPositions[i * 3 + 1] = rand(-25, 25);
        starPositions[i * 3 + 2] = rand(-5, 15);
        starSizes[i] = rand(0.5, 2.5);
        starPhases[i] = rand(0, Math.PI * 2);
        starSpeeds[i] = rand(0.5, 2.0);
      }
      starGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(starPositions, 3),
      );
      starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
      starGeo.setAttribute("aSize", new THREE.BufferAttribute(starSizes, 1));
      starGeo.setAttribute("aPhase", new THREE.BufferAttribute(starPhases, 1));
      starGeo.setAttribute("aSpeed", new THREE.BufferAttribute(starSpeeds, 1));

      const starMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uStarOpacity: { value: DARK_STAR_OPACITY },
          uStarSizeScale: { value: DARK_STAR_SIZE_SCALE },
        },
        vertexShader: STAR_VERTEX,
        fragmentShader: STAR_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      // ---- Shared glow texture for meteor heads --------------------------
      const glowTexture = makeGlowTexture(THREE);

      // ---- Theme handling ------------------------------------------------
      let currentTheme: "dark" | "light" = "dark";

      function fillStarColors(isDark: boolean) {
        const palette = isDark ? DARK_STAR_PALETTE : LIGHT_STAR_PALETTE;
        for (let i = 0; i < STAR_COUNT; i++) {
          const c = pickColor(THREE, palette);
          starColors[i * 3] = c.r;
          starColors[i * 3 + 1] = c.g;
          starColors[i * 3 + 2] = c.b;
        }
        starGeo.attributes.color.needsUpdate = true;
      }

      function applyTheme() {
        const isDark =
          document.documentElement.classList.contains("dark");
        currentTheme = isDark ? "dark" : "light";
        bgColor.set(isDark ? DARK_BG : LIGHT_BG);
        fillStarColors(isDark);
        starMat.uniforms.uStarOpacity.value = isDark
          ? DARK_STAR_OPACITY
          : LIGHT_STAR_OPACITY;
        starMat.uniforms.uStarSizeScale.value = isDark
          ? DARK_STAR_SIZE_SCALE
          : LIGHT_STAR_SIZE_SCALE;
        // Additive in dark (glow), normal in light (darker points on pale sky).
        starMat.blending = isDark
          ? THREE.AdditiveBlending
          : THREE.NormalBlending;
        starMat.needsUpdate = true;
        if (!rafId) render();
      }

      // ---- Meteor management ---------------------------------------------
      type Meteor = {
        start: THREE.Vector3;
        end: THREE.Vector3;
        dir: THREE.Vector3;
        duration: number;
        elapsed: number;
        trailLength: number;
        line: THREE.Line;
        lineGeo: THREE.BufferGeometry;
        lineMat: THREE.ShaderMaterial;
        head: THREE.Sprite;
        headMat: THREE.SpriteMaterial;
      };

      const meteors: Meteor[] = [];
      let nextMeteorAt = performance.now() + rand(METEOR_MIN_INTERVAL_MS, METEOR_MAX_INTERVAL_MS);
      let lastMeteorSpawnAt = -Infinity;

      function spawnMeteor() {
        if (meteors.length >= MAX_CONCURRENT_METEORS) return;
        const now = performance.now();
        if (now - lastMeteorSpawnAt < METEOR_MIN_GAP_MS) return;

        const z = rand(-5, 5);
        const dist = CAMERA_Z - z;
        const halfH = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2)) * dist;
        const halfW = halfH * camera.aspect;
        const margin = rand(
          METEOR_OFFSCREEN_MARGIN_MIN,
          METEOR_OFFSCREEN_MARGIN_MAX,
        );

        // Start and end both OUTSIDE the visible rect (margin 2-4 units) on
        // opposite edges, so the full path crosses the interior on a diagonal.
        let start = new THREE.Vector3();
        let end = new THREE.Vector3();
        for (let attempt = 0; attempt < 8; attempt++) {
          const entry = Math.floor(Math.random() * 3); // 0 top, 1 left, 2 right
          const exit = Math.floor(Math.random() * 3); // 0 bottom, 1 left, 2 right
          if (entry === exit) continue;

          if (entry === 0) {
            start.set(rand(-halfW, halfW), halfH + margin, z);
          } else if (entry === 1) {
            start.set(-halfW - margin, rand(0, halfH), z);
          } else {
            start.set(halfW + margin, rand(0, halfH), z);
          }
          if (exit === 0) {
            end.set(rand(-halfW, halfW), -halfH - margin, z + rand(-2, 2));
          } else if (exit === 1) {
            end.set(-halfW - margin, rand(-halfH, 0), z + rand(-2, 2));
          } else {
            end.set(halfW + margin, rand(-halfH, 0), z + rand(-2, 2));
          }

          // Ensure a clear diagonal (both x and y change meaningfully).
          if (
            Math.abs(end.x - start.x) > 0.2 * halfW &&
            Math.abs(end.y - start.y) > 0.2 * halfH
          ) {
            break;
          }
        }
        const dir = end.clone().sub(start).normalize();
        const duration = rand(METEOR_MIN_DURATION, METEOR_MAX_DURATION);
        const trailLength = rand(METEOR_TRAIL_LENGTH_MIN, METEOR_TRAIL_LENGTH_MAX);

        const isDark = currentTheme === "dark";
        const headColor = isDark ? DARK_METEOR_HEAD : LIGHT_METEOR_HEAD;
        const trailColor = isDark ? DARK_METEOR_TRAIL : LIGHT_METEOR_TRAIL;

        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array((METEOR_TRAIL_SEGMENTS + 1) * 3), 3),
        );
        lineGeo.setAttribute(
          "aAlpha",
          new THREE.BufferAttribute(new Float32Array(METEOR_TRAIL_SEGMENTS + 1), 1),
        );
        const lineMat = new THREE.ShaderMaterial({
          uniforms: { uColor: { value: new THREE.Color(trailColor) } },
          vertexShader: TRAIL_VERTEX,
          fragmentShader: TRAIL_FRAGMENT,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const line = new THREE.Line(lineGeo, lineMat);

        const headMat = new THREE.SpriteMaterial({
          map: glowTexture,
          color: new THREE.Color(headColor),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const head = new THREE.Sprite(headMat);
        head.scale.setScalar(2.5);

        scene.add(line, head);
        meteors.push({
          start,
          end,
          dir,
          duration,
          elapsed: 0,
          trailLength,
          line,
          lineGeo,
          lineMat,
          head,
          headMat,
        });
        lastMeteorSpawnAt = now;
      }

      function updateMeteor(m: Meteor, delta: number): boolean {
        m.elapsed += delta;
        const t = Math.min(m.elapsed / m.duration, 1);
        const headPos = m.start.clone().lerp(m.end, t);
        m.head.position.copy(headPos);

        // Fade overall opacity in over the first ~10% and out over the last
        // ~10% of flight so the meteor never pops at the screen edges.
        const fadeIn = Math.min(t / METEOR_FADE_FRACTION, 1);
        const fadeOut = Math.min((1 - t) / METEOR_FADE_FRACTION, 1);
        const fade = Math.min(fadeIn, fadeOut);
        m.headMat.opacity = fade;

        const posAttr = m.lineGeo.attributes.position as THREE.BufferAttribute;
        const alphaAttr = m.lineGeo.attributes.aAlpha as THREE.BufferAttribute;
        for (let i = 0; i <= METEOR_TRAIL_SEGMENTS; i++) {
          const f = i / METEOR_TRAIL_SEGMENTS;
          const p = headPos
            .clone()
            .sub(m.dir.clone().multiplyScalar(f * m.trailLength));
          posAttr.setXYZ(i, p.x, p.y, p.z);
          alphaAttr.setX(i, Math.pow(1 - f, METEOR_TRAIL_FALLOFF) * fade);
        }
        posAttr.needsUpdate = true;
        alphaAttr.needsUpdate = true;
        return t >= 1;
      }

      function removeMeteor(m: Meteor) {
        scene.remove(m.line, m.head);
        m.lineGeo.dispose();
        m.lineMat.dispose();
        m.headMat.dispose();
      }

      // ---- Animation loop ------------------------------------------------
      let rafId = 0;
      let lastTime = performance.now();
      let reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      function render() {
        renderer.render(scene, camera);
      }

      function frame(now: number) {
        rafId = requestAnimationFrame(frame);
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // twinkle
        starMat.uniforms.uTime.value += delta;

        // meteors
        if (now >= nextMeteorAt) {
          spawnMeteor();
          nextMeteorAt = now + rand(METEOR_MIN_INTERVAL_MS, METEOR_MAX_INTERVAL_MS);
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          if (updateMeteor(meteors[i], delta)) {
            removeMeteor(meteors[i]);
            meteors.splice(i, 1);
          }
        }

        render();
      }

      function startLoop() {
        if (rafId) return;
        lastTime = performance.now();
        rafId = requestAnimationFrame(frame);
      }

      function stopLoop() {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      }

      function updatePauseState() {
        const shouldRun = !document.hidden && isVisible && !reducedMotion;
        if (shouldRun) startLoop();
        else stopLoop();
      }

      // ---- Visibility / intersection / motion listeners ------------------
      let isVisible = true;

      const onVisibility = () => updatePauseState();
      document.addEventListener("visibilitychange", onVisibility);

      const io = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
          updatePauseState();
        },
        { threshold: 0 },
      );
      io.observe(section);

      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onMotionChange = (e: MediaQueryListEvent) => {
        reducedMotion = e.matches;
        updatePauseState();
      };
      motionQuery.addEventListener("change", onMotionChange);

      // ---- Theme observer -------------------------------------------------
      const themeObserver = new MutationObserver(applyTheme);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      // ---- Resize ---------------------------------------------------------
      const onResize = () => {
        const w = canvas.clientWidth || 1;
        const h = canvas.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        starMat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
        if (!rafId) render();
      };
      window.addEventListener("resize", onResize);

      // ---- Init -----------------------------------------------------------
      applyTheme();
      updatePauseState();
      if (reducedMotion) render();

      cleanup = () => {
        stopLoop();
        document.removeEventListener("visibilitychange", onVisibility);
        io.disconnect();
        motionQuery.removeEventListener("change", onMotionChange);
        themeObserver.disconnect();
        window.removeEventListener("resize", onResize);
        for (const m of meteors) removeMeteor(m);
        meteors.length = 0;
        starGeo.dispose();
        starMat.dispose();
        glowTexture.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/70 sm:text-sm">
          Hi, I&apos;m
        </p>
        <h1 className="mt-3 text-6xl font-bold tracking-tight sm:text-8xl">
          Ethan
        </h1>
        <p className="mt-5 max-w-md text-balance text-lg text-foreground/80 sm:text-xl">
          Making what users <i>wish</i> for a reality
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="h-11 px-6 text-base"
            nativeButton={false}
            render={<a href="#projects" />}
          >
            View projects
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 px-6 text-base"
            nativeButton={false}
            render={<a href="mailto:ewiegert99@gmail.com" />}
          >
            Get in touch
          </Button>
        </div>
      </div>
    </section>
  );
}
