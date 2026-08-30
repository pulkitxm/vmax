"use client";

import { useEffect, useRef } from "react";

const vertexSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec2 pointer;

  float line(vec2 p, float width) {
    return smoothstep(width, 0.0, abs(p.y));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    vec2 mouse = pointer * 0.18;
    uv -= mouse;
    float t = time * 0.22;
    float curve = sin(uv.x * 2.7 + t) * 0.2 + sin(uv.x * 5.1 - t * 1.4) * 0.055;
    float energy = line(vec2(uv.x, uv.y - curve), 0.018);
    float halo = line(vec2(uv.x, uv.y - curve), 0.16) * 0.2;
    float pulse = 0.55 + 0.45 * sin(uv.x * 7.0 - time * 1.1);
    vec3 cyan = vec3(0.224, 0.906, 0.949);
    vec3 red = vec3(1.0, 0.188, 0.271);
    vec3 color = mix(cyan, red, smoothstep(-0.65, 0.72, uv.x));
    float vignette = 1.0 - smoothstep(0.25, 1.25, length(uv * vec2(0.72, 1.0)));
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    vec3 finalColor = color * (energy * (1.0 + pulse) + halo) * vignette;
    finalColor += color * max(0.0, 0.018 - abs(uv.y - curve)) * 3.0;
    finalColor += (grain - 0.5) * 0.018;
    gl_FragColor = vec4(finalColor, clamp(energy + halo + 0.04, 0.0, 0.95));
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "position");
    const resolution = gl.getUniformLocation(program, "resolution");
    const time = gl.getUniformLocation(program, "time");
    const pointer = gl.getUniformLocation(program, "pointer");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    let visible = true;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio, 1.5);
      const width = Math.round(canvas.clientWidth * ratio);
      const height = Math.round(canvas.clientHeight * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const move = (event: PointerEvent) => {
      target.x = event.clientX / window.innerWidth - 0.5;
      target.y = 0.5 - event.clientY / window.innerHeight;
    };

    const render = (now: number) => {
      resize();
      current.x += (target.x - current.x) * 0.035;
      current.y += (target.y - current.y) * 0.035;
      gl.useProgram(program);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, reduceMotion ? 4 : now * 0.001);
      gl.uniform2f(pointer, current.x, current.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reduceMotion && visible) frame = requestAnimationFrame(render);
    };

    const onVisibility = () => {
      const nextVisible = document.visibilityState === "visible";
      if (nextVisible && !visible && !reduceMotion) {
        visible = true;
        frame = requestAnimationFrame(render);
      } else {
        visible = nextVisible;
        if (!visible) cancelAnimationFrame(frame);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-shader" aria-hidden="true" />;
}
