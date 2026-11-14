import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useVehicle } from '../context/VehicleContext';
import { ChevronLeft, ChevronRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const VEHICLES = [
  { code: 'cab', label: 'Cab Sedan', color: '#3A4DFF', img: '/vehicles/cab.png', tag: 'ALL-ELECTRIC', baseFare: '₹50', specs: '4 Seats · AC' },
  { code: 'comfort', label: 'Comfort Sedan', color: '#EAB308', img: '/vehicles/comfort.png', tag: 'PREMIUM LUXURY', baseFare: '₹65', specs: 'Top Rated · Extra Legroom' },
  { code: 'xl', label: 'SUV / XL', color: '#8B5CF6', img: '/vehicles/xl.png', tag: 'SPACIOUS 6-SEATER', baseFare: '₹75', specs: '6 Seats · Big Luggage' },
  { code: 'auto', label: 'Auto Rickshaw', color: '#F59E0B', img: '/vehicles/auto.png', tag: 'FASTEST PICKUP', baseFare: '₹30', specs: '3 Seats · Metered' },
  { code: 'bike', label: 'Bike Taxi', color: '#10B981', img: '/vehicles/bike.png', tag: 'POCKET FRIENDLY', baseFare: '₹20', specs: '1 Helmet · Zero Traffic' }
];

export default function VehicleMorphCanvas({ compact = false }) {
  const mountRef = useRef(null);
  const { selectedVehicle, selectVehicleByCode } = useVehicle();

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
    let height = container.clientHeight || (compact ? 340 : 500);

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.22, compact ? 5.2 : 4.6);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. High-End Showroom Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3a4dff, 0.9);
    rimLight.position.set(-5, 1, 4);
    scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight(0xfff3d6, 0.6);
    warmFill.position.set(0, -3, 3);
    scene.add(warmFill);

    // 3. Procedural Contact Shadow Texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(256, 256, 15, 256, 256, 240);
    grad.addColorStop(0, 'rgba(10, 10, 22, 0.85)');
    grad.addColorStop(0.35, 'rgba(15, 18, 38, 0.52)');
    grad.addColorStop(0.7, 'rgba(20, 25, 48, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 512);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(4.8, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    // 4. Procedural Glowing Stage Ring (Pedestal)
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 512;
    ringCanvas.height = 512;
    const rCtx = ringCanvas.getContext('2d');
    const rGrad = rCtx.createRadialGradient(256, 256, 120, 256, 256, 250);
    rGrad.addColorStop(0, 'rgba(58, 77, 255, 0)');
    rGrad.addColorStop(0.5, 'rgba(58, 77, 255, 0.18)');
    rGrad.addColorStop(0.85, 'rgba(58, 77, 255, 0.45)');
    rGrad.addColorStop(0.95, 'rgba(255, 255, 255, 0.85)');
    rGrad.addColorStop(1, 'rgba(58, 77, 255, 0)');
    rCtx.fillStyle = rGrad;
    rCtx.fillRect(0, 0, 512, 512);

    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    const ringGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const stageRing = new THREE.Mesh(ringGeo, ringMat);
    stageRing.rotation.x = -Math.PI / 2;
    stageRing.position.set(0, -1.18, 0);
    scene.add(stageRing);

    // 5. 3D Floating Dust / Sparkle Particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 6.5;
      particlePositions[p * 3 + 1] = (Math.random() - 0.5) * 2.8;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 3.5;
      particleVelocities.push({
        y: 0.003 + Math.random() * 0.006,
        x: (Math.random() - 0.5) * 0.003,
        rot: Math.random() * 0.02
      });
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x9fb4ff,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. Vehicle Planes Setup (16:10 aspect ratio 1280x800)
    const spacing = 5.2;
    const textureLoader = new THREE.TextureLoader();
    const planeWidth = compact ? 4.0 : 4.8;
    const planeHeight = planeWidth / 1.6; // Exactly 1.6 aspect ratio
    const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);

    const vehicleGroups = [];

    VEHICLES.forEach((item, i) => {
      const group = new THREE.Group();
      group.position.x = (i - currentIndexRef.current) * spacing;
      group.position.y = 0.08;

      // Primary Vehicle Plane
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
        alphaTest: 0.002,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(planeGeo, material);
      mesh.userData = { vehicleIndex: i };
      group.add(mesh);

      // Floor Shadow
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -planeHeight * 0.44, 0);
      group.add(shadowMesh);

      // Floor Inverted Reflection Plane
      const reflMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const reflMesh = new THREE.Mesh(planeGeo, reflMat);
      reflMesh.scale.y = -0.42;
      reflMesh.position.set(0, -planeHeight * 0.72, -0.05);
      group.add(reflMesh);

      scene.add(group);
      vehicleGroups.push({ group, mesh, shadowMesh, reflMesh, index: i, item });
    });

    // 7. Interactive Physics & Animation State
    let targetProgress = currentIndexRef.current;
    let currentProgress = currentIndexRef.current;
    let isDragging = false;
    let pointerStartX = 0;
    let dragProgressStart = 0;
    let dragVelocity = 0;
    let lastDragX = 0;
    let lastDragTime = performance.now();
    let totalDragDistance = 0;

    let mouseNormX = 0;
    let mouseNormY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

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

      let newTarget = dragProgressStart - deltaX;
      if (newTarget < 0) newTarget = newTarget * 0.28;
      if (newTarget > VEHICLES.length - 1) {
        newTarget = (VEHICLES.length - 1) + (newTarget - (VEHICLES.length - 1)) * 0.28;
      }
      targetProgress = newTarget;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = 'grab';

      // Tap-to-select clicked vehicle if user barely dragged
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

      // Smooth inertia snap
      let snapIndex = Math.round(targetProgress - dragVelocity * 6.0);
      snapIndex = Math.max(0, Math.min(VEHICLES.length - 1, snapIndex));
      targetProgress = snapIndex;
      setCurrentIndex(snapIndex);
      selectVehicleByCode(VEHICLES[snapIndex].code);
    };

    // Wheel gesture support
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
      }, 140);
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight || (compact ? 340 : 500);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 8. 3D Animation Loop
    let animId;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaSec = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsedTime = now * 0.001;

      if (!isDragging && Math.abs(targetProgress - currentIndexRef.current) > 0.01 && totalDragDistance === 0) {
        targetProgress = currentIndexRef.current;
      }

      // Smooth spring lerp
      const lerpSpeed = isDragging ? 18 : 9.5;
      const progressDiff = targetProgress - currentProgress;
      currentProgress += progressDiff * Math.min(1, deltaSec * lerpSpeed);

      // Swing dynamics
      const currentVel = progressDiff * 4.5;
      const swingYaw = THREE.MathUtils.clamp(-currentVel * 0.35, -0.45, 0.45);
      const swingRoll = THREE.MathUtils.clamp(-currentVel * 0.14, -0.18, 0.18);

      // Mouse tilt with spring inertia
      currentTiltX += (mouseNormY * 0.12 - currentTiltX) * 0.09;
      currentTiltY += (mouseNormX * 0.18 - currentTiltY) * 0.09;

      // Rotate stage ring
      stageRing.rotation.z = elapsedTime * 0.15;
      const ringPulse = 0.65 + Math.sin(elapsedTime * 2.5) * 0.12;
      stageRing.material.opacity = ringPulse;

      // Animate floating dust particles
      const posAttr = particleGeo.attributes.position;
      for (let p = 0; p < particleCount; p++) {
        let py = posAttr.getY(p) + particleVelocities[p].y;
        if (py > 2.2) py = -1.2;
        posAttr.setY(p, py);
        posAttr.setX(p, posAttr.getX(p) + particleVelocities[p].x);
      }
      posAttr.needsUpdate = true;

      // Update vehicle groups
      vehicleGroups.forEach(({ group, mesh, shadowMesh, index }) => {
        const offset = index - currentProgress;
        group.position.x = offset * spacing;

        const absOffset = Math.abs(offset);
        const scale = THREE.MathUtils.lerp(1.0, 0.68, Math.min(1, absOffset));
        group.scale.set(scale, scale, scale);

        // Parabolic 3D stage depth curve
        group.position.z = -Math.pow(absOffset, 1.35) * 2.1;

        // Subtle 3D levitation breathing on active vehicle
        const hoverFloat = absOffset < 0.8 ? Math.sin(elapsedTime * 2.2 + index) * 0.035 : 0;
        group.position.y = 0.08 + hoverFloat;

        // 3D Rotations
        mesh.rotation.y = swingYaw + (absOffset < 0.6 ? currentTiltY : 0);
        mesh.rotation.x = currentTiltX * (1 - Math.min(1, absOffset));
        mesh.rotation.z = swingRoll;

        // Shadow follows vehicle depth
        const shadowOpacity = THREE.MathUtils.lerp(0.85, 0.18, Math.min(1, absOffset));
        shadowMesh.material.opacity = shadowOpacity;
        shadowMesh.scale.set(
          THREE.MathUtils.lerp(1.0, 0.7, absOffset),
          THREE.MathUtils.lerp(1.0, 0.7, absOffset),
          1.0
        );
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
      {/* 3D WebGL Canvas Container with Left/Right Nav Arrows */}
      <div className="w-full relative flex items-center justify-center">
        {/* Left Arrow */}
        <button
          onClick={() => slideTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="absolute left-2 sm:left-6 z-20 w-12 h-12 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-[#DCDAF0] shadow-lg flex items-center justify-center text-[#0A0A14] disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Previous Vehicle"
        >
          <ChevronLeft className="w-6 h-6 text-[#3A4DFF] transition-transform group-hover:-translate-x-0.5" />
        </button>

        {/* 3D WebGL Canvas */}
        <div 
          ref={mountRef} 
          className="w-full h-[340px] sm:h-[420px] md:h-[500px] cursor-grab active:cursor-grabbing touch-pan-y relative"
        />

        {/* Right Arrow */}
        <button
          onClick={() => slideTo(currentIndex + 1)}
          disabled={currentIndex === VEHICLES.length - 1}
          className="absolute right-2 sm:right-6 z-20 w-12 h-12 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-[#DCDAF0] shadow-lg flex items-center justify-center text-[#0A0A14] disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Next Vehicle"
        >
          <ChevronRight className="w-6 h-6 text-[#3A4DFF] transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Futuristic Vehicle HUD & Navigation Bar */}
      <div className="flex flex-col items-center gap-2.5 z-10 -mt-2">
        {/* Sleek Vehicle Position Indicator Dots */}
        <div className="flex items-center gap-2 p-1.5 px-3.5 rounded-full bg-white/85 backdrop-blur-md border border-[#DCDAF0] shadow-sm">
          {VEHICLES.map((v, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={v.code}
                onClick={() => slideTo(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-7 h-2 bg-[#0A0A14]'
                    : 'w-2 h-2 bg-[#DCDAF0] hover:bg-[#8E96A6]'
                }`}
                title={v.label}
              />
            );
          })}
        </div>

        {/* Active Selected Vehicle Floating Pill Banner */}
        <div className="flex items-center gap-2.5 px-5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#DCDAF0] shadow-md animate-fade-in">
          <span 
            className="w-2.5 h-2.5 rounded-full animate-pulse" 
            style={{ backgroundColor: activeVeh.color }} 
          />
          <span className="font-bold text-xs sm:text-sm text-[#0A0A14] tracking-tight">
            {activeVeh.label.toUpperCase()}
          </span>
          <span className="hud text-[9px] px-2 py-0.5 rounded-full bg-[#F1F0FA] text-[#5B5B73] font-semibold">
            {activeVeh.tag}
          </span>
          <span className="text-xs font-mono font-bold text-[#3A4DFF]">
            {activeVeh.baseFare} BASE
          </span>
          <span className="hidden sm:inline text-[11px] text-[#8E96A6] border-l border-[#DCDAF0] pl-2 font-medium">
            {activeVeh.specs}
          </span>
        </div>

        {/* 3D Interaction Hint */}
        <div className="hud text-[10px] text-[#8E96A6] font-semibold tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3A4DFF] animate-ping" />
          <span>DRAG OR SWIPE TO ROTATE & EXPLORE 3D FLEET</span>
        </div>
      </div>
    </div>
  );
}
