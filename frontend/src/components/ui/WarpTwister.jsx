'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * WarpTwister - React Bits Pro
 * A twisting tube of haze and drifting dust
 *
 * Props:
 * @param {number} radius - Tube radius (default: 1.5)
 * @param {number} narrow - Tube narrowing factor towards far end (default: 1.8)
 * @param {number} length - Tube length (default: 10)
 * @param {number} hazeSpeed - Speed of haze flow (default: 0.5)
 * @param {number} dustSpeed - Speed of dust particles (default: 1)
 * @param {number} hazeStrength - Intensity of haze effect (default: 0.25)
 * @param {number} hazeFrequency - Frequency of haze pattern (default: 100)
 * @param {number} dustDensity - Density/count of dust particles (default: 300)
 * @param {number} dustSize - Size of dust particles (default: 100)
 * @param {number} dustOpacity - Opacity of dust particles (default: 0.1)
 * @param {number} edgeFade - Edge fade intensity (default: 2)
 * @param {number} spiralTight - Tightness of spiral pattern (default: 0.5)
 * @param {number} rotSpeed - Rotation speed (default: 0.15)
 * @param {number[]} baseColor - Dark mode base color RGB values (0-1) (default: [0.753, 0.518, 0.988])
 * @param {number[]} baseColorLight - Light mode base color RGB values (0-1) (default: [0.227, 0.302, 1.0])
 * @param {number} cameraDistance - Camera distance (default: 8.5)
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles
 */

const NOISE_GLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const HAZE_VERTEX = `
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HAZE_FRAGMENT = `
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vNormal;

uniform float uTime;
uniform float uHazeSpeed;
uniform float uHazeStrength;
uniform float uHazeFrequency;
uniform float uSpiralTight;
uniform float uRotSpeed;
uniform float uEdgeFade;
uniform vec3 uBaseColor;
uniform float uLength;

${NOISE_GLSL}

void main() {
  float angle = atan(vPosition.y, vPosition.x);
  float z = vPosition.z;
  
  // Twisting spiral angle along cylinder length
  float spiral = angle * 2.0 + (z / uLength) * 12.0 * uSpiralTight + uTime * uRotSpeed;
  
  // 3D coordinate for procedural haze
  vec3 coord = vec3(
    cos(spiral) * 1.8,
    sin(spiral) * 1.8,
    z * (uHazeFrequency * 0.012) - uTime * uHazeSpeed
  );
  
  float n1 = snoise(coord);
  float n2 = snoise(coord * 2.1 + vec3(2.3, 1.7, 0.8)) * 0.5;
  float haze = smoothstep(-0.35, 0.85, n1 + n2);
  
  // Depth fade near camera & far tunnel end
  float depthFade = smoothstep(2.0, -1.0, z) * smoothstep(-uLength, -uLength * 0.45, z);
  
  // Edge silhouette softening
  float rim = pow(clamp(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 0.0, 1.0), uEdgeFade);
  
  float alpha = haze * uHazeStrength * depthFade * (0.3 + 0.7 * rim);
  
  // Subtle gradient: highlight core
  vec3 color = mix(uBaseColor, vec3(0.9, 0.95, 1.0), haze * 0.4);
  
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

const DUST_VERTEX = `
attribute float aSize;
attribute float aPhase;
varying float vPhase;

uniform float uDustSize;
uniform float uTime;

void main() {
  vPhase = aPhase;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float dist = max(0.5, -mvPosition.z);
  gl_PointSize = aSize * (uDustSize / 100.0) * (240.0 / dist);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const DUST_FRAGMENT = `
varying float vPhase;
uniform vec3 uBaseColor;
uniform float uDustOpacity;
uniform float uTime;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  // Soft glowing circle with slight flicker
  float glow = smoothstep(0.5, 0.02, dist);
  float flicker = 0.7 + 0.3 * sin(uTime * 3.0 + vPhase);
  
  gl_FragColor = vec4(uBaseColor, glow * flicker * uDustOpacity);
}
`;

export default function WarpTwister({
  radius = 1.5,
  narrow = 1.8,
  length = 10,
  hazeSpeed = 0.5,
  dustSpeed = 1,
  hazeStrength = 0.25,
  hazeFrequency = 100,
  dustDensity = 300,
  dustSize = 100,
  dustOpacity = 0.1,
  edgeFade = 2,
  spiralTight = 0.5,
  rotSpeed = 0.15,
  baseColor = [0.753, 0.518, 0.988],
  baseColorLight = [0.227, 0.302, 1.0],
  cameraDistance = 8.5,
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Detect dark or light mode
    const isDark = document.documentElement.classList.contains('dark');
    const activeColorRGB = isDark ? baseColor : baseColorLight;
    const colorVec = new THREE.Color(
      activeColorRGB[0],
      activeColorRGB[1],
      activeColorRGB[2]
    );

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(0, 0, 0);

    // 1. Twisting Tube with Volumetric Haze Shader
    const tubeRadiusTop = radius;
    const tubeRadiusBottom = radius / Math.max(0.1, narrow);
    const tubeGeometry = new THREE.CylinderGeometry(
      tubeRadiusTop,
      tubeRadiusBottom,
      length,
      64,
      128,
      true
    );
    // Orient cylinder along Z axis so camera looks through opening
    tubeGeometry.rotateX(Math.PI / 2);
    // Center tube along Z
    tubeGeometry.translate(0, 0, -length * 0.35);

    const hazeMaterial = new THREE.ShaderMaterial({
      vertexShader: HAZE_VERTEX,
      fragmentShader: HAZE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uHazeSpeed: { value: hazeSpeed },
        uHazeStrength: { value: hazeStrength },
        uHazeFrequency: { value: hazeFrequency },
        uSpiralTight: { value: spiralTight },
        uRotSpeed: { value: rotSpeed },
        uEdgeFade: { value: edgeFade },
        uBaseColor: { value: colorVec },
        uLength: { value: length }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending
    });

    const tubeMesh = new THREE.Mesh(tubeGeometry, hazeMaterial);
    scene.add(tubeMesh);

    // 2. Drifting Dust Particles System
    const particleCount = Math.max(20, Math.floor(dustDensity));
    const dustPositions = new Float32Array(particleCount * 3);
    const dustSizes = new Float32Array(particleCount);
    const dustPhases = new Float32Array(particleCount);
    const dustRadii = new Float32Array(particleCount);
    const dustAngles = new Float32Array(particleCount);
    const dustSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const r = 0.1 + Math.random() * (radius * 0.95);
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() * length * 1.2) - (length * 0.9);

      dustRadii[i] = r;
      dustAngles[i] = angle;
      dustSpeeds[i] = 0.5 + Math.random() * 1.2;

      dustPositions[i * 3 + 0] = Math.cos(angle) * r;
      dustPositions[i * 3 + 1] = Math.sin(angle) * r;
      dustPositions[i * 3 + 2] = z;

      dustSizes[i] = 2.0 + Math.random() * 4.5;
      dustPhases[i] = Math.random() * Math.PI * 2;
    }

    const dustGeometry = new THREE.BufferGeometry();
    const posAttribute = new THREE.BufferAttribute(dustPositions, 3);
    dustGeometry.setAttribute('position', posAttribute);
    dustGeometry.setAttribute('aSize', new THREE.BufferAttribute(dustSizes, 1));
    dustGeometry.setAttribute('aPhase', new THREE.BufferAttribute(dustPhases, 1));

    const dustMaterial = new THREE.ShaderMaterial({
      vertexShader: DUST_VERTEX,
      fragmentShader: DUST_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: colorVec },
        uDustSize: { value: dustSize },
        uDustOpacity: { value: dustOpacity }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);

    // Resize handler
    const updateSize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    updateSize();

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateSize());
      resizeObserver.observe(container);
    }
    window.addEventListener('resize', updateSize);

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;

      const normX = ((clientX - rect.left) / (rect.width || 1)) - 0.5;
      const normY = ((clientY - rect.top) / (rect.height || 1)) - 0.5;

      targetRotY = normX * 0.22;
      targetRotX = normY * 0.18;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Animation Loop
    let animId = null;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Update shader uniforms
      hazeMaterial.uniforms.uTime.value = elapsedTime;
      dustMaterial.uniforms.uTime.value = elapsedTime;

      // Mouse Parallax damping
      mouseX += (targetRotX - mouseX) * 0.04;
      mouseY += (targetRotY - mouseY) * 0.04;
      scene.rotation.x = mouseX;
      scene.rotation.y = mouseY;

      // Subtle scene breathing
      tubeMesh.rotation.z += delta * (rotSpeed * 0.4);

      // Animate dust particles forward and spiral
      const posArr = posAttribute.array;
      const zLimitFar = -length * 0.9;
      const zLimitNear = cameraDistance - 1.2;

      for (let i = 0; i < particleCount; i++) {
        // Advance Z forward
        let z = posArr[i * 3 + 2] + delta * dustSpeed * dustSpeeds[i] * 1.6;
        if (z > zLimitNear) {
          z = zLimitFar;
        }

        // Swirl around tube axis
        let ang = dustAngles[i] + delta * (rotSpeed + 0.15) * 0.7;
        dustAngles[i] = ang;

        const r = dustRadii[i];
        posArr[i * 3 + 0] = Math.cos(ang) * r;
        posArr[i * 3 + 1] = Math.sin(ang) * r;
        posArr[i * 3 + 2] = z;
      }
      posAttribute.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('pointermove', handlePointerMove);

      tubeGeometry.dispose();
      hazeMaterial.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      renderer.dispose();
    };
  }, [
    radius,
    narrow,
    length,
    hazeSpeed,
    dustSpeed,
    hazeStrength,
    hazeFrequency,
    dustDensity,
    dustSize,
    dustOpacity,
    edgeFade,
    spiralTight,
    rotSpeed,
    baseColor,
    baseColorLight,
    cameraDistance
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
      />
    </div>
  );
}
