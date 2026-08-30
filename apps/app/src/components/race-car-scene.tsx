"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { createF1CarModel } from "@/components/f1-car-model";

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

export function RaceCarScene() {
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
    const carRig = new THREE.Group();
    const wheelMeshes: THREE.Group[] = [];
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
    let modelScale = 0.72;
    let viewportWidth = window.innerWidth;
    let previousTime = performance.now();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);

    scene.add(carRig);
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

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 3.6),
      new THREE.ShaderMaterial({
        vertexShader: shadowVertexShader,
        fragmentShader: shadowFragmentShader,
        transparent: true,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.6;
    carRig.add(shadow);

    const { root: model, wheels } = createF1CarModel();
    wheelMeshes.push(...wheels);
    carRig.add(model);
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
      modelScale = compact
        ? 0.5
        : viewportWidth < 900
          ? 0.56
          : viewportWidth < 1200
            ? 0.64
            : 0.72;
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
        ? 0.26
        : viewportWidth < 900
          ? 0.7
          : viewportWidth < 1200
            ? 0.8
            : 1.78;
      const endX = compact
        ? -0.34
        : viewportWidth < 900
          ? -0.35
          : viewportWidth < 1200
            ? -0.3
            : 0.78;
      const footprintScale = THREE.MathUtils.lerp(
        1,
        compact ? 0.92 : 0.84,
        Math.sin(progress * Math.PI),
      );
      model.scale.setScalar(modelScale * footprintScale);

      carRig.position.set(
        THREE.MathUtils.lerp(startX, endX, progress) + pointer.x * 0.16,
        -0.02 + Math.sin(elapsed * 1.2) * 0.018,
        THREE.MathUtils.lerp(0.1, 0.5, progress),
      );
      carRig.rotation.set(
        THREE.MathUtils.lerp(0.03, 0.18, progress) + pointer.y * 0.035,
        THREE.MathUtils.lerp(-0.62, 0.88, progress) + pointer.x * 0.09,
        -Math.sin(progress * Math.PI) * 0.07,
      );

      wheelMeshes.forEach((wheel) => {
        wheel.rotation.x = -progress * 19 - elapsed * 0.22;
      });

      camera.position.set(
        THREE.MathUtils.lerp(3.9, -3.15, progress),
        THREE.MathUtils.lerp(2.45, 1.55, progress),
        THREE.MathUtils.lerp(5.35, 4.45, progress),
      );
      lookTarget.set(
        THREE.MathUtils.lerp(0.2, -0.1, progress),
        THREE.MathUtils.lerp(0.05, 0.12, progress),
        0,
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
    <div className="race-car-scene" ref={hostRef} data-status={status}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="race-car-loader" aria-live="polite">
        {status === "loading" && <span>Loading race model</span>}
        {status === "failed" && <span>3D preview unavailable</span>}
      </div>
    </div>
  );
}
