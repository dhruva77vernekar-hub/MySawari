import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useVehicle } from '../context/VehicleContext';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const VEHICLES = [
  { code: 'cab', label: 'Cab Sedan', color: '#3A4DFF', img: '/vehicles/cab.png', tag: 'POPULAR', baseFare: '₹50' },
  { code: 'comfort', label: 'Comfort Sedan', color: '#EAB308', img: '/vehicles/comfort.png', tag: 'PREMIUM', baseFare: '₹65' },
  { code: 'xl', label: 'SUV / XL', color: '#8B5CF6', img: '/vehicles/xl.png', tag: 'EXTRA ROOM', baseFare: '₹75' },
  { code: 'auto', label: 'Auto Rickshaw', color: '#F59E0B', img: '/vehicles/auto.png', tag: 'FASTEST PICKUP', baseFare: '₹30' },
  { code: 'bike', label: 'Bike Taxi', color: '#10B981', img: '/vehicles/bike.png', tag: 'POCKET FRIENDLY', baseFare: '₹20' }
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
    let height = container.clientHeight || (compact ? 340 : 520);

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.18, compact ? 5.0 : 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. High-End Studio Lighting for Vivid Contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x3a4dff, 0.5);
    fillLight.position.set(-4, -1, 3);
    scene.add(fillLight);

    // 3. Procedural Radial Soft Floor Shadow Texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(256, 256, 10, 256, 256, 250);
    grad.addColorStop(0, 'rgba(10, 10, 20, 0.72)');
    grad.addColorStop(0.35, 'rgba(15, 18, 35, 0.42)');
    grad.addColorStop(0.7, 'rgba(20, 25, 45, 0.14)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 512);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(4.6, 1.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    // 4. Vehicle Planes Setup with 16:10 Widescreen Aspect (1280x800)
    const spacing = 5.2;
    const textureLoader = new THREE.TextureLoader();
    const planeWidth = compact ? 3.8 : 4.6;
    const planeHeight = planeWidth / 1.6; // Matches 1280x800 texture aspect ratio perfectly
    const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);

    const vehicleGroups = [];

    VEHICLES.forEach((item, i) => {
      const group = new THREE.Group();
      group.position.x = (i - currentIndexRef.current) * spacing;
      group.position.y = 0.05;

      // Primary Vehicle Plane with crystal-clear mipmap filtering & anisotropy
      const texture = textureLoader.load(item.img, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        if (renderer.capabilities?.getMaxAnisotropy) {
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        }
      });

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.005,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(planeGeo, material);
      mesh.userData = { vehicleIndex: i };
      group.add(mesh);

      // Floor Shadow under vehicle tires
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -planeHeight * 0.44, 0);
      group.add(shadowMesh);

      // Floor Inverted Reflection Plane
      const reflMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const reflMesh = new THREE.Mesh(planeGeo, reflMat);
      reflMesh.scale.y = -0.45;
      reflMesh.position.set(0, -planeHeight * 0.72, -0.05);
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
    let totalDragDistance = 0;

    // Mouse tilt tracking
    let mouseNormX = 0;
    let mouseNormY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    // Raycaster for clicking side vehicles to slide to them
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    // Pointer events for ultra-smooth drag/swipe
    const onPointerDown = (e) => {
      isDragging = true;
      pointerStartX = e.clientX;
      dragProgressStart = currentProgress;
      lastDragX = e.clientX;
      lastDragTime = performance.now();
      dragVelocity = 0;
      totalDragDistance = 0;
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseNormX = x;
      mouseNormY = y;
      mouseVector.x = x;
      mouseVector.y = y;

      if (!isDragging) return;

      const deltaX = (e.clientX - pointerStartX) / (width * 0.42);
      totalDragDistance += Math.abs(e.clientX - lastDragX);

      const now = performance.now();
      const dt = Math.max(1, now - lastDragTime);
      dragVelocity = (e.clientX - lastDragX) / dt;
      lastDragX = e.clientX;
      lastDragTime = now;

      // Smooth resistance at boundaries
      let newTarget = dragProgressStart - deltaX;
      if (newTarget < 0) newTarget = newTarget * 0.3;
      if (newTarget > VEHICLES.length - 1) {
        newTarget = (VEHICLES.length - 1) + (newTarget - (VEHICLES.length - 1)) * 0.3;
      }
      targetProgress = newTarget;
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = 'grab';

      // If user barely moved cursor, treat as a tap/click to select clicked vehicle
      if (totalDragDistance < 8) {
        raycaster.setFromCamera(mouseVector, camera);
        const meshes = vehicleGroups.map(v => v.mesh);
        const intersects = raycaster.intersectObjects(meshes);
        if (intersects.length > 0) {
          const clickedIdx = intersects[0].object.userData.vehicleIndex;
          if (typeof clickedIdx === 'number') {
            targetProgress = clickedIdx;
            setCurrentIndex(clickedIdx);
            selectVehicleByCode(VEHICLES[clickedIdx].code);
            return;
          }
        }
      }

      // Snap with momentum / velocity
      let snapIndex = Math.round(targetProgress - dragVelocity * 5.5);
      snapIndex = Math.max(0, Math.min(VEHICLES.length - 1, snapIndex));
      targetProgress = snapIndex;
      setCurrentIndex(snapIndex);
      selectVehicleByCode(VEHICLES[snapIndex].code);
    };

    // Wheel scroll support (horizontal and vertical gestures)
    let wheelTimeout;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.0022;
      targetProgress = Math.max(0, Math.min(VEHICLES.length - 1, targetProgress + delta));
      
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        const snap = Math.round(targetProgress);
        targetProgress = snap;
        if (snap !== currentIndexRef.current) {
          setCurrentIndex(snap);
          selectVehicleByCode(VEHICLES[snap].code);
        }
      }, 150);
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Resize handler
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight || (compact ? 340 : 520);
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
      if (!isDragging && Math.abs(targetProgress - currentIndexRef.current) > 0.01 && totalDragDistance === 0) {
        targetProgress = currentIndexRef.current;
      }

      // Smooth lerp progress towards target (spring physics)
      const lerpSpeed = isDragging ? 16 : 8.5;
      const progressDiff = targetProgress - currentProgress;
      currentProgress += progressDiff * Math.min(1, deltaSec * lerpSpeed);

      // Swing rotation velocity while sliding
      const currentVel = progressDiff * 4.0;
      const swingYaw = THREE.MathUtils.clamp(-currentVel * 0.32, -0.42, 0.42);
      const swingRoll = THREE.MathUtils.clamp(-currentVel * 0.12, -0.16, 0.16);

      // Mouse tilt smooth lerp
      currentTiltX += (mouseNormY * 0.10 - currentTiltX) * 0.08;
      currentTiltY += (mouseNormX * 0.16 - currentTiltY) * 0.08;

      // Update vehicle positions and rotations
      vehicleGroups.forEach(({ group, mesh, shadowMesh, index }) => {
        const offset = index - currentProgress;
        group.position.x = offset * spacing;

        // Depth and scale based on distance from center
        const absOffset = Math.abs(offset);
        const scale = THREE.MathUtils.lerp(1.0, 0.70, Math.min(1, absOffset));
        group.scale.set(scale, scale, scale);

        // Parabolic curve in Z axis for 3D stage depth
        group.position.z = -Math.pow(absOffset, 1.35) * 1.9;

        // Mesh rotations: tilt + swing + resting angle
        mesh.rotation.y = swingYaw + (absOffset < 0.6 ? currentTiltY : 0);
        mesh.rotation.x = currentTiltX * (1 - Math.min(1, absOffset));
        mesh.rotation.z = swingRoll;

        // Shadow follows opacity & scale
        const shadowOpacity = THREE.MathUtils.lerp(0.8, 0.2, Math.min(1, absOffset));
        shadowMesh.material.opacity = shadowOpacity;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(wheelTimeout);
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

  const activeVeh = VEHICLES[currentIndex] || VEHICLES[0];

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* 3D WebGL Canvas Container with Left/Right Click Nav Hints */}
      <div className="w-full relative flex items-center justify-center">
        {/* Left Click Slider Arrow */}
        <button
          onClick={() => slideTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="absolute left-2 sm:left-6 z-20 w-11 h-11 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-[#DCDAF0] shadow-md flex items-center justify-center text-[#0A0A14] disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Previous Vehicle"
        >
          <ChevronLeft className="w-5 h-5 text-[#3A4DFF]" />
        </button>

        {/* The 3D Slider Canvas */}
        <div 
          ref={mountRef} 
          className="w-full h-[320px] sm:h-[400px] md:h-[480px] cursor-grab active:cursor-grabbing touch-pan-y relative"
        />

        {/* Right Click Slider Arrow */}
        <button
          onClick={() => slideTo(currentIndex + 1)}
          disabled={currentIndex === VEHICLES.length - 1}
          className="absolute right-2 sm:right-6 z-20 w-11 h-11 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-[#DCDAF0] shadow-md flex items-center justify-center text-[#0A0A14] disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Next Vehicle"
        >
          <ChevronRight className="w-5 h-5 text-[#3A4DFF]" />
        </button>
      </div>

      {/* Sleek Floating Slide Indicator (No button bar: Slide smoothly to select) */}
      <div className="flex flex-col items-center gap-2 z-10 -mt-3">
        {/* 5 Minimalist Slide Position Dots */}
        <div className="flex items-center gap-2 p-1.5 px-3 rounded-full bg-white/80 backdrop-blur-md border border-[#DCDAF0] shadow-xs">
          {VEHICLES.map((v, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={v.code}
                onClick={() => slideTo(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  isActive
                    ? 'w-6 h-2 bg-[#0A0A14]'
                    : 'w-2 h-2 bg-[#DCDAF0] hover:bg-[#8E96A6]'
                }`}
                title={v.label}
              />
            );
          })}
        </div>

        {/* Active Selected Vehicle Pill Banner */}
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#DCDAF0] shadow-xs animate-fade-in">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeVeh.color }} />
          <span className="font-bold text-xs text-[#0A0A14]">{activeVeh.label.toUpperCase()}</span>
          <span className="hud text-[9px] px-1.5 py-0.5 rounded bg-[#F1F0FA] text-[#5B5B73]">
            {activeVeh.tag}
          </span>
          <span className="text-xs font-mono font-bold text-[#3A4DFF]">{activeVeh.baseFare} BASE</span>
        </div>

        <div className="hud text-[10px] text-[#8E96A6] font-medium tracking-wider flex items-center gap-1.5 mt-0.5">
          <span>← SLIDE / SWIPE ANYWHERE TO SELECT RIDE →</span>
        </div>
      </div>
    </div>
  );
}
