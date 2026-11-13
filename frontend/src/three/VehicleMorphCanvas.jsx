import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useVehicle } from '../context/VehicleContext';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const VEHICLES = [
  { code: 'cab', label: 'Cab Sedan', color: '#3A4DFF', img: '/vehicles/cab.png', tag: 'COMFORT' },
  { code: 'xl', label: 'SUV / XL', color: '#8B5CF6', img: '/vehicles/xl.png', tag: 'PREMIUM' },
  { code: 'auto', label: 'Auto Rickshaw', color: '#F59E0B', img: '/vehicles/auto.png', tag: 'POPULAR' },
  { code: 'bike', label: 'Bike Taxi', color: '#FFC21A', img: '/vehicles/bike.png', tag: 'FASTEST' }
];

export default function VehicleMorphCanvas({ compact = false }) {
  const mountRef = useRef(null);
  const { selectedVehicle, selectVehicleByCode } = useVehicle();

  // Find index from selected vehicle
  const getIndexFromCode = (code) => {
    const idx = VEHICLES.findIndex((v) => v.code === code);
    return idx >= 0 ? idx : 0;
  };

  const [currentIndex, setCurrentIndex] = useState(() => getIndexFromCode(selectedVehicle?.code));
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Sync external selection
  useEffect(() => {
    const idx = getIndexFromCode(selectedVehicle?.code);
    if (idx !== currentIndexRef.current) {
      setCurrentIndex(idx);
    }
  }, [selectedVehicle]);

  // Handle slide programmatically
  const slideTo = useCallback((newIdx) => {
    const clamped = Math.max(0, Math.min(VEHICLES.length - 1, newIdx));
    setCurrentIndex(clamped);
    selectVehicleByCode(VEHICLES[clamped].code);
  }, [selectVehicleByCode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || (compact ? 340 : 540);

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.35, compact ? 5.8 : 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x3a4dff, 0.5);
    fillLight.position.set(-4, -1, 2);
    scene.add(fillLight);

    // 3. Procedural Radial Soft Floor Shadow Texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(256, 256, 10, 256, 256, 250);
    grad.addColorStop(0, 'rgba(10, 10, 20, 0.65)');
    grad.addColorStop(0.35, 'rgba(15, 18, 35, 0.4)');
    grad.addColorStop(0.7, 'rgba(20, 25, 45, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 512);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.6, 1.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });

    // 4. Vehicle Planes Setup
    const spacing = 4.4;
    const textureLoader = new THREE.TextureLoader();
    const planeGeo = new THREE.PlaneGeometry(compact ? 3.0 : 3.6, compact ? 3.0 : 3.6);

    const vehicleGroups = [];

    VEHICLES.forEach((item, i) => {
      const group = new THREE.Group();
      group.position.x = (i - currentIndexRef.current) * spacing;
      group.position.y = 0.05;

      // Primary Vehicle Plane
      const texture = textureLoader.load(item.img, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
      });

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.01,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(planeGeo, material);
      group.add(mesh);

      // Floor Shadow under vehicle
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -1.25, 0);
      group.add(shadowMesh);

      // Floor Inverted Reflection Plane
      const reflMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const reflMesh = new THREE.Mesh(planeGeo, reflMat);
      reflMesh.scale.y = -0.55;
      reflMesh.position.set(0, -1.85, -0.05);
      group.add(reflMesh);

      scene.add(group);
      vehicleGroups.push({ group, mesh, shadowMesh, reflMesh, index: i });
    });

    // 5. Interactive Animation State
    let targetProgress = currentIndexRef.current;
    let currentProgress = currentIndexRef.current;
    let isDragging = false;
    let pointerStartX = 0;
    let dragProgressStart = 0;
    let dragVelocity = 0;
    let lastDragX = 0;
    let lastDragTime = performance.now();

    // Mouse tilt tracking
    let mouseNormX = 0;
    let mouseNormY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    // Pointer events for drag/swipe
    const onPointerDown = (e) => {
      isDragging = true;
      pointerStartX = e.clientX;
      dragProgressStart = currentProgress;
      lastDragX = e.clientX;
      lastDragTime = performance.now();
      dragVelocity = 0;
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseNormX = x;
      mouseNormY = y;

      if (!isDragging) return;

      const deltaX = (e.clientX - pointerStartX) / (width * 0.45);
      const now = performance.now();
      const dt = Math.max(1, now - lastDragTime);
      dragVelocity = (e.clientX - lastDragX) / dt;
      lastDragX = e.clientX;
      lastDragTime = now;

      targetProgress = Math.max(-0.2, Math.min(VEHICLES.length - 0.8, dragProgressStart - deltaX));
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = 'grab';

      // Snap with momentum / velocity
      let snapIndex = Math.round(targetProgress - dragVelocity * 6);
      snapIndex = Math.max(0, Math.min(VEHICLES.length - 1, snapIndex));
      targetProgress = snapIndex;
      setCurrentIndex(snapIndex);
      selectVehicleByCode(VEHICLES[snapIndex].code);
    };

    // Wheel scroll support
    const onWheel = (e) => {
      e.preventDefault();
      const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.0025;
      targetProgress = Math.max(0, Math.min(VEHICLES.length - 1, targetProgress + delta));
      const nearest = Math.round(targetProgress);
      if (nearest !== currentIndexRef.current) {
        setCurrentIndex(nearest);
        selectVehicleByCode(VEHICLES[nearest].code);
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Resize handler
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight || (compact ? 340 : 540);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 6. Animation Loop
    let animId;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaSec = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Sync targetProgress with external index when not dragging
      if (!isDragging) {
        targetProgress = currentIndexRef.current;
      }

      // Smooth lerp progress towards target
      const lerpSpeed = isDragging ? 14 : 7;
      const progressDiff = targetProgress - currentProgress;
      currentProgress += progressDiff * Math.min(1, deltaSec * lerpSpeed);

      // Swing rotation velocity while sliding
      const currentVel = (progressDiff) * 3.5;
      const swingYaw = THREE.MathUtils.clamp(-currentVel * 0.35, -0.45, 0.45);
      const swingRoll = THREE.MathUtils.clamp(-currentVel * 0.15, -0.2, 0.2);

      // Mouse tilt smooth lerp
      currentTiltX += (mouseNormY * 0.12 - currentTiltX) * 0.08;
      currentTiltY += (mouseNormX * 0.18 - currentTiltY) * 0.08;

      // Update vehicle positions and rotations
      vehicleGroups.forEach(({ group, mesh, shadowMesh, index }) => {
        const offset = index - currentProgress;
        group.position.x = offset * spacing;

        // Depth and scale based on distance from center
        const absOffset = Math.abs(offset);
        const scale = THREE.MathUtils.lerp(1.0, 0.72, Math.min(1, absOffset));
        group.scale.set(scale, scale, scale);

        // Subtle parabolic curve in Z axis
        group.position.z = -Math.pow(absOffset, 1.4) * 1.8;

        // Mesh rotations: tilt + swing + resting angle
        mesh.rotation.y = swingYaw + (absOffset < 0.6 ? currentTiltY : 0);
        mesh.rotation.x = currentTiltX * (1 - Math.min(1, absOffset));
        mesh.rotation.z = swingRoll;

        // Shadow follows opacity & scale
        const shadowOpacity = THREE.MathUtils.lerp(0.75, 0.25, Math.min(1, absOffset));
        shadowMesh.material.opacity = shadowOpacity;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [compact, selectVehicleByCode]);

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-[320px] sm:h-[400px] md:h-[480px] cursor-grab active:cursor-grabbing touch-pan-y relative"
      />

      {/* Slider Controls & Vehicle Switcher Pills */}
      <div className="flex items-center gap-3 z-10 -mt-2">
        <button
          onClick={() => slideTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="p-2 rounded-full bg-white/80 backdrop-blur-md border border-[#DCDAF0] hover:bg-white text-[#0A0A14] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          aria-label="Previous Vehicle"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 4 Vehicle Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/80 backdrop-blur-md border border-[#DCDAF0] shadow-sm">
          {VEHICLES.map((v, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={v.code}
                onClick={() => slideTo(idx)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0A0A14] text-white shadow-sm'
                    : 'text-[#5B5B73] hover:text-[#0A0A14] hover:bg-white/60'
                }`}
              >
                <span>{v.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: v.color }} />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => slideTo(currentIndex + 1)}
          disabled={currentIndex === VEHICLES.length - 1}
          className="p-2 rounded-full bg-white/80 backdrop-blur-md border border-[#DCDAF0] hover:bg-white text-[#0A0A14] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          aria-label="Next Vehicle"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="hud text-[10px] text-[#8E96A6] mt-2 font-medium">
        SWIPE / DRAG / SCROLL TO CHANGE VEHICLE
      </div>
    </div>
  );
}
