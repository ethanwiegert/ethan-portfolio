"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

import { GitHubIcon } from "@/components/brand-icons";
import { BookCallButton, SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { links } from "@/lib/links";

const RADIUS = 6.4;
const FIT_RADIUS = 7.6;

function buildPoints(THREE: typeof import("three"), count: number) {
  const points: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const jitter = 0.84 + ((i * 47) % 17) / 17 * 0.32;
    const radius = RADIUS * jitter;
    points.push(
      new THREE.Vector3(
        Math.cos(theta) * ring * radius,
        y * radius,
        Math.sin(theta) * ring * radius,
      ),
    );
  }

  return points;
}

function buildEdges(points: THREE.Vector3[]) {
  const edges: { a: number; b: number }[] = [];
  const seen = new Set<string>();

  const add = (a: number, b: number) => {
    if (a === b) return;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ a, b });
  };

  for (let i = 0; i < points.length; i++) {
    const nearest: { j: number; d: number }[] = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      nearest.push({ j, d: points[i].distanceTo(points[j]) });
    }
    nearest.sort((a, b) => a.d - b.d);
    for (let k = 0; k < 2 && k < nearest.length; k++) {
      add(i, nearest[k].j);
    }
  }

  return edges;
}

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const primary = style.getPropertyValue("--primary").trim() || "#8c2312";
  const ring = style.getPropertyValue("--ring").trim() || "#ffb25e";
  const foreground = style.getPropertyValue("--foreground").trim() || "#f5ede4";
  const dark = document.documentElement.classList.contains("dark");

  return dark
    ? { node: ring, line: ring, signal: foreground, lineOpacity: 0.62 }
    : { node: primary, line: primary, signal: primary, lineOpacity: 0.55 };
}

export function WorkflowHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const canvasEl = canvas;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const small = window.matchMedia("(max-width: 640px)").matches;
      const nodeCount = small ? 44 : 56;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: !small,
          alpha: true,
          powerPreference: small ? "low-power" : "default",
        });
      } catch {
        return;
      }
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);

      const graph = new THREE.Group();
      scene.add(graph);

      const points = buildPoints(THREE, nodeCount);
      const edges = buildEdges(points);

      const colors = readColors();
      const nodeGeo = new THREE.SphereGeometry(0.12, small ? 10 : 16, small ? 8 : 12);
      const nodeMat = new THREE.MeshBasicMaterial({ color: colors.node });
      const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, points.length);
      const dummy = new THREE.Object3D();

      points.forEach((point, index) => {
        dummy.position.copy(point);
        dummy.scale.setScalar(index % 8 === 0 ? 2.1 : 1);
        dummy.updateMatrix();
        nodes.setMatrixAt(index, dummy.matrix);
      });
      nodes.instanceMatrix.needsUpdate = true;
      graph.add(nodes);

      const linePositions = new Float32Array(edges.length * 6);
      edges.forEach((edge, index) => {
        const a = points[edge.a];
        const b = points[edge.b];
        const offset = index * 6;
        linePositions[offset] = a.x;
        linePositions[offset + 1] = a.y;
        linePositions[offset + 2] = a.z;
        linePositions[offset + 3] = b.x;
        linePositions[offset + 4] = b.y;
        linePositions[offset + 5] = b.z;
      });
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(linePositions, 3),
      );
      const lineMat = new THREE.LineBasicMaterial({
        color: colors.line,
        transparent: true,
        opacity: colors.lineOpacity,
      });
      graph.add(new THREE.LineSegments(lineGeo, lineMat));

      const adjacency = points.map(() => [] as number[]);
      for (const edge of edges) {
        adjacency[edge.a].push(edge.b);
        adjacency[edge.b].push(edge.a);
      }

      const signalGeo = new THREE.SphereGeometry(0.16, 16, 12);
      const signalMat = new THREE.MeshBasicMaterial({ color: colors.signal });
      const signal = new THREE.Mesh(signalGeo, signalMat);
      graph.add(signal);

      let current = 0;
      let next = adjacency[0]?.[0] ?? 0;
      const from = points[current].clone();
      const to = points[next].clone();
      let travel = 0;

      function hop() {
        const neighbors = (adjacency[next] ?? []).filter((node) => node !== current);
        const destination = neighbors.length
          ? neighbors[Math.floor(Math.random() * neighbors.length)]
          : current;
        current = next;
        next = destination;
        from.copy(points[current] ?? points[0]);
        to.copy(points[next] ?? points[0]);
        travel = 0;
      }

      function applyTheme() {
        const palette = readColors();
        nodeMat.color.set(palette.node);
        lineMat.color.set(palette.line);
        lineMat.opacity = palette.lineOpacity;
        signalMat.color.set(palette.signal);
      }

      function fit() {
        const width = canvasEl.clientWidth || 1;
        const height = canvasEl.clientHeight || 1;
        camera.aspect = width / height;
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const distance = FIT_RADIUS / Math.tan(fov / 2);
        const margin = width < 640 ? 1.22 : 1.08;
        camera.position.set(
          0,
          0.2,
          Math.max(distance, distance / Math.max(camera.aspect, 0.35)) * margin,
        );
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, width < 640 ? 1.5 : 2),
        );
        renderer.setSize(width, height, false);
      }

      let rafId = 0;
      let lastTime = performance.now();
      let elapsed = 0;
      let reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      function render() {
        signal.position.lerpVectors(from, to, travel);
        renderer.render(scene, camera);
      }

      function frame(now: number) {
        rafId = requestAnimationFrame(frame);
        const delta = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        elapsed += delta;

        graph.rotation.y += delta * 0.16;
        graph.rotation.x = Math.sin(elapsed * 0.22) * 0.1;

        travel += delta * 0.42;
        if (travel >= 1) hop();
        signal.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.12);
        render();
      }

      function startLoop() {
        if (rafId) return;
        lastTime = performance.now();
        rafId = requestAnimationFrame(frame);
      }

      function stopLoop() {
        if (!rafId) return;
        cancelAnimationFrame(rafId);
        rafId = 0;
      }

      let isVisible = true;
      function updatePauseState() {
        const shouldRun = !document.hidden && isVisible && !reducedMotion;
        if (shouldRun) startLoop();
        else {
          stopLoop();
          render();
        }
      }

      const onVisibility = () => updatePauseState();
      document.addEventListener("visibilitychange", onVisibility);

      const intersection = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
          updatePauseState();
        },
        { threshold: 0 },
      );
      intersection.observe(section);

      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onMotionChange = (event: MediaQueryListEvent) => {
        reducedMotion = event.matches;
        updatePauseState();
      };
      motionQuery.addEventListener("change", onMotionChange);

      const themeObserver = new MutationObserver(applyTheme);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      const resize = new ResizeObserver(() => {
        fit();
        if (!rafId) render();
      });
      resize.observe(section);

      applyTheme();
      fit();
      graph.rotation.y = 0.45;
      render();
      updatePauseState();

      cleanup = () => {
        stopLoop();
        document.removeEventListener("visibilitychange", onVisibility);
        intersection.disconnect();
        motionQuery.removeEventListener("change", onMotionChange);
        themeObserver.disconnect();
        resize.disconnect();
        nodeGeo.dispose();
        nodeMat.dispose();
        lineGeo.dispose();
        lineMat.dispose();
        signalGeo.dispose();
        signalMat.dispose();
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
      className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,color-mix(in_oklch,var(--primary)_30%,transparent),transparent_68%)]"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-b from-transparent to-background sm:h-32" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-48 w-[min(78%,26rem)] -translate-x-1/2 -translate-y-[42%] rounded-full bg-background/55 blur-2xl sm:h-56" />
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground sm:text-sm">
          Full-stack developer
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl">
          Ethan
        </h1>
        <p className="mt-5 max-w-xl text-balance text-lg text-foreground/85 sm:text-xl">
          Cost-efficient AI workflows that accelerate teams.
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
          <BookCallButton className="w-full sm:w-auto" />
          <Button
            size="lg"
            variant="outline"
            className="h-11 w-full px-6 text-base sm:w-auto"
            nativeButton={false}
            render={
              <a
                href={links.github}
                target="_blank"
                rel="noreferrer noopener"
              />
            }
          >
            <GitHubIcon className="size-4" />
            GitHub
          </Button>
        </div>
        <SocialLinks className="mt-8" />
      </div>
    </section>
  );
}
