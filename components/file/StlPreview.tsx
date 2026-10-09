'use client';

import { useEffect, useRef } from 'react';

/**
 * A small orbiting 3D preview, drawn with raw WebGL.
 *
 * Deliberately not three.js: that is roughly 600 kB for what amounts to one
 * shaded mesh and a turntable, and this project keeps client libraries small
 * enough to load on a phone over a slow connection. What is here is flat
 * shading plus pointer orbit and wheel zoom, which is all a print preview
 * needs — the question it answers is "did my image come out legible", not
 * "is this photoreal".
 */

const VERT = `
attribute vec3 aPos;
attribute vec3 aNormal;
uniform mat4 uProj;
uniform mat4 uView;
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  vec4 viewPos = uView * vec4(aPos, 1.0);
  vViewPos = viewPos.xyz;
  vNormal = mat3(uView) * aNormal;
  gl_Position = uProj * viewPos;
}`;

const FRAG = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vViewPos;
uniform vec3 uColor;
void main() {
  vec3 n = normalize(vNormal);
  // Light rides with the camera so the model is never lit from behind.
  vec3 lightDir = normalize(vec3(0.4, 0.6, 1.0));
  float diffuse = max(dot(n, lightDir), 0.0);
  float rim = pow(1.0 - max(dot(n, normalize(-vViewPos)), 0.0), 2.0) * 0.25;
  vec3 color = uColor * (0.32 + 0.68 * diffuse) + rim;
  gl_FragColor = vec4(color, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create a WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader failed to compile.');
  }
  return shader;
}

function perspective(fovY: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ]);
}

/**
 * A Z-up turntable. Everything this tool makes is modelled the way it prints —
 * bed in XY, Z upward — so azimuth has to swing around Z, not around Y.
 * Orbiting about the wrong axis makes a standing cylinder lean over as you
 * drag, which reads as the model being crooked rather than the camera moving.
 */
function viewMatrix(azimuth: number, elevation: number, distance: number, centre: [number, number, number]): Float32Array {
  const ce = Math.cos(elevation), se = Math.sin(elevation);
  const eye: [number, number, number] = [
    centre[0] + distance * ce * Math.cos(azimuth),
    centre[1] + distance * ce * Math.sin(azimuth),
    centre[2] + distance * se,
  ];

  // Forward, right, up — a standard look-at basis with world +Z as up.
  let fx = centre[0] - eye[0], fy = centre[1] - eye[1], fz = centre[2] - eye[2];
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl; fy /= fl; fz /= fl;

  let sx = fy * 1 - fz * 0, sy = fz * 0 - fx * 1, sz = fx * 0 - fy * 0;
  const sl = Math.hypot(sx, sy, sz) || 1;
  sx /= sl; sy /= sl; sz /= sl;

  const ux = sy * fz - sz * fy;
  const uy = sz * fx - sx * fz;
  const uz = sx * fy - sy * fx;

  return new Float32Array([
    sx, ux, -fx, 0,
    sy, uy, -fy, 0,
    sz, uz, -fz, 0,
    -(sx * eye[0] + sy * eye[1] + sz * eye[2]),
    -(ux * eye[0] + uy * eye[1] + uz * eye[2]),
    fx * eye[0] + fy * eye[1] + fz * eye[2],
    1,
  ]);
}

export interface StlPreviewProps {
  positions: Float32Array;
  normals: Float32Array;
  triangleCount: number;
  className?: string;
}

export function StlPreview({ positions, normals, triangleCount, className }: StlPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const failedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || triangleCount === 0) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) {
      failedRef.current = true;
      return;
    }

    let program: WebGLProgram | null = null;
    let posBuf: WebGLBuffer | null = null;
    let normBuf: WebGLBuffer | null = null;
    let raf = 0;

    try {
      program = gl.createProgram();
      if (!program) throw new Error('Could not create a WebGL program.');
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? 'WebGL program failed to link.');
      }
      gl.useProgram(program);

      posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      normBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
      const aNormal = gl.getAttribLocation(program, 'aNormal');
      gl.enableVertexAttribArray(aNormal);
      gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    } catch {
      failedRef.current = true;
      return;
    }

    // Frame the model from its own bounds, so any shape or size fits.
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < triangleCount * 9; i += 3) {
      const x = positions[i] ?? 0, y = positions[i + 1] ?? 0, z = positions[i + 2] ?? 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const centre: [number, number, number] = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
    const radius = Math.max(1e-3, Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2);

    // Point the camera at whichever face carries the image: high up for a flat
    // panel lying on the bed, low and side-on for a curved panel or cylinder
    // standing up the Z axis. Taking this from the model's own proportions
    // covers both without being told which shape it is, and neither angle is
    // dead-on — a perfectly square view of a plate reads as a flat rectangle
    // and shows nothing.
    const flatness = (maxZ - minZ) / Math.max(1e-6, Math.max(maxX - minX, maxY - minY));
    const lyingFlat = flatness < 0.35;
    // A curved panel is built facing +X, so the camera has to sit on that side
    // or the image is edge-on and invisible. A flat panel faces +Z instead, so
    // there the angle round the compass barely matters.
    let azimuth = lyingFlat ? -Math.PI / 2 - 0.35 : -0.45;
    let elevation = lyingFlat ? 1.1 : 0.25;
    // Just far enough that the bounding sphere clears a 45° vertical field,
    // with a little air around it.
    let distance = (radius / Math.tan(Math.PI / 8)) * 1.05;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const uProj = gl.getUniformLocation(program, 'uProj');
    const uView = gl.getUniformLocation(program, 'uView');
    const uColor = gl.getUniformLocation(program, 'uColor');

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const draw = () => {
      raf = 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.uniformMatrix4fv(uProj, false, perspective(Math.PI / 4, w / h, radius * 0.05, radius * 40));
      gl.uniformMatrix4fv(uView, false, viewMatrix(azimuth, elevation, distance, centre));
      gl.uniform3f(uColor, 0.85, 0.86, 0.88);
      gl.drawArrays(gl.TRIANGLES, 0, triangleCount * 3);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      azimuth -= (e.clientX - lastX) * 0.01;
      elevation += (e.clientY - lastY) * 0.01;
      // Stop short of the poles, where the up vector collapses.
      elevation = Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, elevation));
      lastX = e.clientX;
      lastY = e.clientY;
      schedule();
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance = Math.max(radius * 1.2, Math.min(radius * 12, distance * (1 + Math.sign(e.deltaY) * 0.12)));
      schedule();
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);
    schedule();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(normBuf);
      gl.deleteProgram(program);
    };
  }, [positions, normals, triangleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: 'none', cursor: 'grab' }}
      aria-label="3D preview of the model — drag to rotate, scroll to zoom"
    />
  );
}
