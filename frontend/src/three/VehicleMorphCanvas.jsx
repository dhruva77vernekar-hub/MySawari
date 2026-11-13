import React, { useRef, useEffect, useState } from 'react';
import { useVehicle } from '../context/VehicleContext';

/**
 * Advanced 3D Particle Morph Engine
 * Supports 6 distinct vehicle types:
 * - Sedan Cab, Sport Bike, Auto Rickshaw (Tuk-Tuk), EV Scooter, SUV/XL, Campus Shuttle
 * Dynamic FX Modes:
 * - Smooth Stream, Vortex Tornado, Exploded Blueprint, Cyber Matrix
 * Features full interactive mouse drag rotation (yaw/pitch) and pressure dispersion.
 */
export default function VehicleMorphCanvas({ compact = false }) {
  const canvasRef = useRef(null);
  const { selectedVehicle, activeChapter } = useVehicle();
  
  // Transformation dynamics state
  const [fxMode, setFxMode] = useState('stream'); // 'stream' | 'vortex' | 'explode' | 'matrix'
  const [rotationYaw, setRotationYaw] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement.clientHeight || (compact ? 320 : 600));

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Number of particles
    const count = compact ? 650 : 1300;
    const particles = [];

    // Target shapes coordinates generator
    const getTargetPosition = (type, i, total) => {
      const p = i / total;
      const cx = width / 2;
      const cy = height / 2;
      const scale = compact ? 1.15 : 2.15;

      if (type === 'cab') {
        // Sedan Cab
        if (p < 0.35) {
          // Chassis lower box
          const x = (p / 0.35 - 0.5) * 260 * scale;
          const y = 30 * scale + (Math.sin(p * 20) * 8);
          return { x: cx + x, y: cy + y };
        } else if (p < 0.65) {
          // Aerodynamic Cabin dome
          const angle = ((p - 0.35) / 0.3) * Math.PI;
          const x = -Math.cos(angle) * 95 * scale;
          const y = -Math.sin(angle) * 72 * scale + 26 * scale;
          return { x: cx + x, y: cy + y };
        } else if (p < 0.82) {
          // Front Wheel
          const angle = ((p - 0.65) / 0.17) * Math.PI * 2;
          return { x: cx + 75 * scale + Math.cos(angle) * 28 * scale, y: cy + 55 * scale + Math.sin(angle) * 28 * scale };
        } else {
          // Rear Wheel
          const angle = ((p - 0.82) / 0.18) * Math.PI * 2;
          return { x: cx - 75 * scale + Math.cos(angle) * 28 * scale, y: cy + 55 * scale + Math.sin(angle) * 28 * scale };
        }
      } else if (type === 'bike') {
        // Motorbike Taxi
        if (p < 0.22) {
          // Rear Wheel
          const angle = (p / 0.22) * Math.PI * 2;
          return { x: cx - 85 * scale + Math.cos(angle) * 34 * scale, y: cy + 50 * scale + Math.sin(angle) * 34 * scale };
        } else if (p < 0.44) {
          // Front Wheel
          const angle = ((p - 0.22) / 0.22) * Math.PI * 2;
          return { x: cx + 85 * scale + Math.cos(angle) * 34 * scale, y: cy + 50 * scale + Math.sin(angle) * 34 * scale };
        } else if (p < 0.72) {
          // Trellis Frame & Tank
          const t = (p - 0.44) / 0.28;
          const x = (-85 + t * 170) * scale;
          const y = (50 - Math.sin(t * Math.PI) * 105) * scale;
          return { x: cx + x, y: cy + y };
        } else {
          // Handlebar & Rider Seat
          const t = (p - 0.72) / 0.28;
          const x = (20 + t * 55) * scale;
          const y = (-20 - t * 45) * scale;
          return { x: cx + x, y: cy + y };
        }
      } else if (type === 'auto') {
        // Iconic 3-Wheeler Auto Rickshaw (Tuk-Tuk)
        if (p < 0.18) {
          // Single Front Steering Wheel
          const angle = (p / 0.18) * Math.PI * 2;
          return { x: cx + 75 * scale + Math.cos(angle) * 24 * scale, y: cy + 56 * scale + Math.sin(angle) * 24 * scale };
        } else if (p < 0.38) {
          // Rear Dual Wheel
          const angle = ((p - 0.18) / 0.2) * Math.PI * 2;
          return { x: cx - 65 * scale + Math.cos(angle) * 25 * scale, y: cy + 56 * scale + Math.sin(angle) * 25 * scale };
        } else if (p < 0.72) {
          // Rounded Auto Canopy Hood
          const t = (p - 0.38) / 0.34;
          const x = (-70 + t * 145) * scale;
          const y = (-45 + Math.sin(t * Math.PI) * 20 - (t > 0.7 ? (t - 0.7) * 90 : 0)) * scale;
          return { x: cx + x, y: cy + y };
        } else {
          // Front Windshield Slope & Driver Handlebar
          const t = (p - 0.72) / 0.28;
          const x = (40 + t * 35) * scale;
          const y = (-30 + t * 80) * scale;
          return { x: cx + x, y: cy + y };
        }
      } else if (type === 'scooter') {
        // EV Scooter (Modern Ather/Ola style)
        if (p < 0.2) {
          // Rear Wheel Hub Motor
          const angle = (p / 0.2) * Math.PI * 2;
          return { x: cx - 72 * scale + Math.cos(angle) * 23 * scale, y: cy + 58 * scale + Math.sin(angle) * 23 * scale };
        } else if (p < 0.4) {
          // Front Wheel
          const angle = ((p - 0.2) / 0.2) * Math.PI * 2;
          return { x: cx + 72 * scale + Math.cos(angle) * 23 * scale, y: cy + 58 * scale + Math.sin(angle) * 23 * scale };
        } else if (p < 0.7) {
          // Low Flat Footboard & Battery Skirt
          const t = (p - 0.4) / 0.3;
          const x = (-70 + t * 135) * scale;
          const y = (50 - Math.pow(Math.sin(t * Math.PI), 0.4) * 55) * scale;
          return { x: cx + x, y: cy + y };
        } else {
          // Upright Modern Handle Post & LED Light
          const t = (p - 0.7) / 0.3;
          const x = (58 + t * 8) * scale;
          const y = (50 - t * 105) * scale;
          return { x: cx + x, y: cy + y };
        }
      } else if (type === 'suv') {
        // Bold SUV / XL
        if (p < 0.3) {
          // Chunky High Chassis
          const x = (p / 0.3 - 0.5) * 270 * scale;
          const y = 20 * scale + (Math.sin(p * 24) * 8);
          return { x: cx + x, y: cy + y };
        } else if (p < 0.6) {
          // Tall Boxy Cabin & Roof Rails
          const t = (p - 0.3) / 0.3;
          const x = (-110 + t * 220) * scale;
          const y = (-65 + Math.sin(t * Math.PI) * 12) * scale;
          return { x: cx + x, y: cy + y };
        } else if (p < 0.8) {
          // Front Heavy Off-road Wheel
          const angle = ((p - 0.6) / 0.2) * Math.PI * 2;
          return { x: cx + 80 * scale + Math.cos(angle) * 34 * scale, y: cy + 52 * scale + Math.sin(angle) * 34 * scale };
        } else {
          // Rear Heavy Off-road Wheel + Spare
          const angle = ((p - 0.8) / 0.2) * Math.PI * 2;
          return { x: cx - 80 * scale + Math.cos(angle) * 34 * scale, y: cy + 52 * scale + Math.sin(angle) * 34 * scale };
        }
      } else {
        // Campus Shuttle / Mini-Bus
        if (p < 0.4) {
          // Long Box Body
          const t = p / 0.4;
          const x = (-140 + t * 280) * scale;
          const y = (t < 0.2 || t > 0.8 ? -40 : -55) * scale;
          return { x: cx + x, y: cy + y };
        } else if (p < 0.7) {
          // Window pillars & lower skirt
          const t = (p - 0.4) / 0.3;
          const x = (-135 + t * 270) * scale;
          const y = 30 * scale;
          return { x: cx + x, y: cy + y };
        } else if (p < 0.85) {
          // Front dual wheels
          const angle = ((p - 0.7) / 0.15) * Math.PI * 2;
          return { x: cx + 90 * scale + Math.cos(angle) * 26 * scale, y: cy + 54 * scale + Math.sin(angle) * 26 * scale };
        } else {
          // Rear dual wheels
          const angle = ((p - 0.85) / 0.15) * Math.PI * 2;
          return { x: cx - 90 * scale + Math.cos(angle) * 26 * scale, y: cy + 54 * scale + Math.sin(angle) * 26 * scale };
        }
      }
    };

    // Initialize particles
    for (let i = 0; i < count; i++) {
      const initial = getTargetPosition(activeChapter || selectedVehicle.code, i, count);
      particles.push({
        x: initial.x + (Math.random() - 0.5) * 120,
        y: initial.y + (Math.random() - 0.5) * 120,
        tx: initial.x,
        ty: initial.y,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 1.2,
        alpha: Math.random() * 0.7 + 0.3,
        glow: Math.random() > 0.75,
        rndAngle: Math.random() * Math.PI * 2,
        rndDist: Math.random() * 200 + 40
      });
    }

    let time = 0;

    const render = () => {
      time += 0.035;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Glowing Portal Floor Ring (Igloo Style)
      const ringRadius = compact ? 130 : 280;
      const ringGrad = ctx.createRadialGradient(cx, cy + 95, 10, cx, cy + 95, ringRadius);
      ringGrad.addColorStop(0, 'rgba(69, 224, 242, 0.28)');
      ringGrad.addColorStop(0.5, 'rgba(58, 77, 255, 0.14)');
      ringGrad.addColorStop(1, 'rgba(241, 240, 250, 0)');
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 95, ringRadius, ringRadius * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Road stream speed lines
      ctx.strokeStyle = 'rgba(58, 77, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([18, 26]);
      ctx.lineDashOffset = -time * 70;
      ctx.beginPath();
      ctx.moveTo(cx - 360, cy + 125);
      ctx.lineTo(cx + 360, cy + 125);
      ctx.stroke();
      ctx.setLineDash([]);

      const activeCode = activeChapter || selectedVehicle.code;

      // Update particle positions with selected FX mode
      for (let i = 0; i < count; i++) {
        let target = getTargetPosition(activeCode, i, count);
        const p = particles[i];

        // Apply Transformation FX
        if (fxMode === 'vortex') {
          // Cyclone vortex rotation around center
          const angle = p.rndAngle + time * 3;
          const r = p.rndDist * Math.sin(time + i * 0.01);
          target = {
            x: target.x + Math.cos(angle) * r * 0.4,
            y: target.y + Math.sin(angle) * r * 0.4
          };
        } else if (fxMode === 'explode') {
          // Exploded Blueprint view
          const dxCenter = target.x - cx;
          const dyCenter = target.y - cy;
          target = {
            x: target.x + dxCenter * 0.35 + Math.sin(time * 2 + i) * 15,
            y: target.y + dyCenter * 0.35 + Math.cos(time * 2 + i) * 15
          };
        } else if (fxMode === 'matrix') {
          // Digital rain oscillation
          target = {
            x: target.x + Math.sin(time * 5 + i * 0.5) * 8,
            y: target.y + ((time * 80 + i * 2) % 60) - 30
          };
        }

        // Pressure scatter effect (uPress)
        if (isPressing) {
          const pushX = (Math.random() - 0.5) * 180;
          const pushY = (Math.random() - 0.5) * 180;
          p.x += pushX * 0.1;
          p.y += pushY * 0.1;
        }

        // Smooth spring physics interpolation
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        p.vx = (p.vx + dx * 0.05) * 0.82;
        p.vy = (p.vy + dy * 0.05) * 0.82;
        p.x += p.vx;
        p.y += p.vy;

        // Interactive 3D Yaw Rotation projection
        const relX = p.x - cx;
        const rotatedX = cx + relX * Math.cos(rotationYaw);

        // Gentle vertical levitation
        const levitate = Math.sin(time * 3 + i) * 1.5;

        // Draw Particle
        ctx.beginPath();
        ctx.arc(rotatedX, p.y + levitate, p.size, 0, Math.PI * 2);

        if (p.glow) {
          ctx.fillStyle = activeCode === 'scooter' ? '#10B981' : activeCode === 'auto' ? '#F59E0B' : '#45E0F2';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 9;
        } else {
          ctx.fillStyle = activeCode === 'cab' ? '#3A4DFF' : activeCode === 'bike' ? '#0A0A14' : activeCode === 'suv' ? '#8B5CF6' : '#5B5B73';
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedVehicle, activeChapter, compact, fxMode, rotationYaw, isPressing]);

  // Mouse drag handlers for 3D rotation
  const handleMouseDown = () => setIsPressing(true);
  const handleMouseUp = () => setIsPressing(false);
  const handleMouseMove = (e) => {
    if (e.buttons === 1) {
      const deltaX = e.movementX || 0;
      setRotationYaw((prev) => Math.max(-0.6, Math.min(0.6, prev + deltaX * 0.008)));
    }
  };

  return (
    <div className={`relative w-full ${compact ? 'h-64' : 'h-[500px] md:h-[620px]'} flex flex-col items-center justify-center select-none`}>
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Interactive Helper Hint */}
      {!compact && (
        <div className="absolute bottom-1 z-10 text-[10px] font-mono text-[#8E96A6] tracking-widest bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-[#DCDAF0]">
          DRAG TO ROTATE 3D · CLICK & HOLD TO BURST PARTICLES
        </div>
      )}
    </div>
  );
}
