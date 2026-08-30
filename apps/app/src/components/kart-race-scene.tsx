"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  createKartModel,
  type KartPalette,
} from "@/components/kart-model";

type KartLayout = {
  palette: KartPalette;
  position: [number, number, number];
  rotation: number;
  scale: number;
  phase: number;
};

const kartLayouts: KartLayout[] = [
  {
    palette: {
      paint: 0x147df5,
      accent: 0xff3648,
      suit: 0xf7f2e8,
      helmet: 0xf1354a,
      visor: 0x14242b,
    },
    position: [1.34, -0.06, 0.82],
    rotation: -0.44,
    scale: 0.7,
    phase: 0.2,
  },
  {
    palette: {
      paint: 0x147df5,
      accent: 0xff3648,
      suit: 0x203845,
      helmet: 0xf7f2e8,
      visor: 0x0e2e37,
    },
    position: [-0.48, 0.05, -0.88],
    rotation: -0.18,
    scale: 0.56,
    phase: 1.8,
  },
  {
    palette: {
      paint: 0x147df5,
      accent: 0xff3648,
      suit: 0x2c2530,
      helmet: 0xf4b942,
      visor: 0x241a26,
    },
    position: [2.86, 0.08, -1.05],
    rotation: -0.66,
    scale: 0.56,
    phase: 3.4,
  },
  {
    palette: {
      paint: 0x147df5,
      accent: 0xff3648,
      suit: 0x29203f,
      helmet: 0xa991ff,
      visor: 0x171225,
    },
    position: [1.38, 0.15, -2.5],
    rotation: -0.39,
    scale: 0.49,
    phase: 5,
  },
];

const groundVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const groundFragmentShader = `
  precision highp float;
  uniform float uTime;
  uniform float uProgress;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float edgeA = 1.0 - smoothstep(0.002, 0.009, abs(p.x - 0.14));
    float edgeB = 1.0 - smoothstep(0.002, 0.009, abs(p.x + 0.14));
    float center = 1.0 - smoothstep(0.002, 0.006, abs(p.x));
    float dash = step(0.55, fract((p.y + uTime * 0.16 + uProgress) * 18.0));
    float pulsePosition = fract(uTime * 0.12 + uProgress * 0.8) - 0.5;
    float pulse = exp(-abs(p.y - pulsePosition) * 36.0);
    float fade = smoothstep(0.5, 0.08, length(p * vec2(0.7, 1.0)));
    vec3 cyan = vec3(0.224, 0.906, 0.949);
    vec3 red = vec3(1.0, 0.188, 0.271);
    vec3 color = mix(cyan, red, smoothstep(-0.3, 0.35, p.y));
    float alpha = ((edgeA + edgeB) * 0.14 + center * dash * 0.08 + pulse * (edgeA + edgeB) * 0.82) * fade;
    gl_FragColor = vec4(color, alpha);
  }
`;

const shadowVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shadowFragmentShader = `
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * vec2(1.0, 1.8);
    float alpha = (1.0 - smoothstep(0.05, 0.52, length(p))) * 0.58;
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }
`;

function disposeObject(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const meshMaterials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    meshMaterials.forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });
  });

  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
}

export function KartRaceScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hero = host.closest<HTMLElement>(".hero");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 60);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.innerWidth > 720,
      powerPreference: "high-performance",
    });
    const formation = new THREE.Group();
    const kartStates = kartLayouts.map((layout) => {
      const rig = new THREE.Group();
      const model = createKartModel(layout.palette);
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 3.2),
        new THREE.ShaderMaterial({
          vertexShader: shadowVertexShader,
          fragmentShader: shadowFragmentShader,
          transparent: true,
          depthWrite: false,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -0.37;
      rig.add(shadow, model.root);
      rig.position.set(...layout.position);
      rig.rotation.y = layout.rotation;
      rig.scale.setScalar(layout.scale);
      formation.add(rig);
      return { ...layout, rig, ...model };
    });
    const pointerTarget = new THREE.Vector2();
    const pointer = new THREE.Vector2();
    const lookTarget = new THREE.Vector3();
    let frame = 0;
    let visible = true;
    let disposed = false;
    let targetProgress = 0;
    let progress = 0;
    let elapsed = 0;
    let compact = window.innerWidth < 560;
    let formationScale = 1;
    let viewportWidth = window.innerWidth;
    let previousTime = performance.now();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);

    scene.add(formation);
    scene.add(new THREE.HemisphereLight(0xddeeff, 0x08090c, 2.6));

    const keyLight = new THREE.DirectionalLight(0xf7f2e8, 5.2);
    keyLight.position.set(3.5, 5.5, 4.5);
    scene.add(keyLight);

    const cyanLight = new THREE.PointLight(0x39e7f2, 18, 8, 2);
    cyanLight.position.set(-2.8, 0.7, 1.4);
    scene.add(cyanLight);

    const redLight = new THREE.PointLight(0xff3045, 22, 8, 2);
    redLight.position.set(2.5, 0.5, -1.6);
    scene.add(redLight);

    const groundMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
      },
      vertexShader: groundVertexShader,
      fragmentShader: groundFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      groundMaterial,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.63;
    scene.add(ground);

    setStatus("ready");

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      const ratio = Math.min(
        window.devicePixelRatio,
        window.innerWidth < 720 ? 1.15 : 1.5,
      );
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      viewportWidth = window.innerWidth;
      compact = viewportWidth < 560;
      formationScale = compact
        ? 0.52
        : viewportWidth < 900
          ? 0.78
          : viewportWidth < 1200
            ? 0.9
            : 1;
    };

    const updateProgress = () => {
      if (!hero || reduceMotion) return;
      const rect = hero.getBoundingClientRect();
      const distance = Math.max(rect.height - window.innerHeight, 1);
      targetProgress = THREE.MathUtils.clamp(-rect.top / distance, 0, 1);
    };

    const updatePointer = (event: PointerEvent) => {
      pointerTarget.set(
        event.clientX / window.innerWidth - 0.5,
        0.5 - event.clientY / window.innerHeight,
      );
    };

    const render = () => {
      const currentTime = performance.now();
      const delta = Math.min((currentTime - previousTime) / 1000, 0.05);
      previousTime = currentTime;
      elapsed += delta;
      const ease = 1 - Math.exp(-delta * 5.5);
      progress = THREE.MathUtils.lerp(progress, targetProgress, ease);
      pointer.lerp(pointerTarget, ease * 0.72);

      const startX = compact
        ? 0.16
        : viewportWidth < 900
          ? 0.55
          : viewportWidth < 1200
            ? 0.75
            : 1.02;
      const endX = compact
        ? -0.18
        : viewportWidth < 900
          ? 0.2
          : viewportWidth < 1200
            ? 0.35
            : 0.64;
      const footprintScale = THREE.MathUtils.lerp(
        1,
        compact ? 0.94 : 0.88,
        Math.sin(progress * Math.PI),
      );
      formation.scale.setScalar(formationScale * footprintScale);

      formation.position.set(
        THREE.MathUtils.lerp(startX, endX, progress) + pointer.x * 0.16,
        -0.05 + pointer.y * 0.05,
        THREE.MathUtils.lerp(0.08, 0.38, progress),
      );
      formation.rotation.set(
        THREE.MathUtils.lerp(0.02, 0.12, progress) + pointer.y * 0.025,
        THREE.MathUtils.lerp(-0.08, 0.16, progress) + pointer.x * 0.07,
        -Math.sin(progress * Math.PI) * 0.035,
      );

      kartStates.forEach((kart, index) => {
        const float = Math.sin(elapsed * 1.35 + kart.phase) * 0.035;
        kart.rig.position.y = kart.position[1] + float;
        kart.rig.rotation.y =
          kart.rotation + Math.sin(elapsed * 0.5 + kart.phase) * 0.025;
        kart.rig.rotation.z =
          Math.sin(elapsed * 0.9 + kart.phase) * 0.012 - progress * 0.018;
        kart.wheels.forEach((wheel) => {
          wheel.rotation.x = -progress * 23 - elapsed * (0.36 + index * 0.05);
        });
        kart.steering.rotation.y =
          Math.sin(elapsed * 0.72 + kart.phase) * 0.11;
        kart.driver.rotation.y =
          Math.sin(elapsed * 0.34 + kart.phase) * 0.025;
      });

      camera.position.set(
        THREE.MathUtils.lerp(5.4, 4.45, progress),
        THREE.MathUtils.lerp(3.25, 2.5, progress),
        THREE.MathUtils.lerp(7.4, 6.3, progress),
      );
      lookTarget.set(
        THREE.MathUtils.lerp(1.18, 0.95, progress),
        THREE.MathUtils.lerp(0.38, 0.5, progress),
        THREE.MathUtils.lerp(-0.35, -0.58, progress),
      );
      camera.lookAt(lookTarget);

      groundMaterial.uniforms.uTime.value = elapsed;
      groundMaterial.uniforms.uProgress.value = progress;
      cyanLight.intensity = THREE.MathUtils.lerp(12, 24, progress);
      redLight.intensity = THREE.MathUtils.lerp(24, 14, progress);
      renderer.render(scene, camera);

      if (!reduceMotion && visible && !disposed) {
        frame = requestAnimationFrame(render);
      }
    };

    const start = () => {
      if (!frame && !reduceMotion && visible && !disposed) {
        previousTime = performance.now();
        frame = requestAnimationFrame(render);
      }
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible =
          entry.isIntersecting && document.visibilityState === "visible";
        if (visible) start();
        else stop();
      },
      { rootMargin: "15%" },
    );
    const resizeObserver = new ResizeObserver(resize);
    const onVisibilityChange = () => {
      visible =
        document.visibilityState === "visible" &&
        host.getBoundingClientRect().bottom > 0;
      if (visible) start();
      else stop();
    };

    visibilityObserver.observe(host);
    resizeObserver.observe(host);
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    resize();
    updateProgress();

    if (reduceMotion) render();
    else start();

    return () => {
      disposed = true;
      stop();
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("pointermove", updatePointer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      disposeObject(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="kart-race-scene" ref={hostRef} data-status={status}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="kart-race-loader" aria-live="polite">
        {status === "loading" && <span>Loading kart grid</span>}
        {status === "failed" && <span>3D preview unavailable</span>}
      </div>
    </div>
  );
}
