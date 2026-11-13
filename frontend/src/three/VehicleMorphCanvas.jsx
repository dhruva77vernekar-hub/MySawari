import React, { useRef, useEffect, useState } from 'react';
import { useVehicle } from '../context/VehicleContext';

/**
 * 3D Particle Morph Canvas
 * Built with procedural particle geometry representing Car, Bike, and Scooter.
 * Features 4-level fallback ladder (Igloo + Lusion aesthetic).
 */
export default function VehicleMorphCanvas({ compact = false }) {
  const canvasRef = useRef(null);
  const { selectedVehicle, activeChapter, selectVehicleByCode } = useVehicle();
  const [animating, setAnimating] = useState(false);

  // Vehicle geometry particle generator
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
    const count = compact ? 450 : 900;
    const particles = [];

    // Target shapes generator
    const getTargetPosition = (type, i, total) => {
      const p = i / total;
      const cx = width / 2;
      const cy = height / 2;
      const scale = compact ? 1.2 : 2.2;

      if (type === 'cab') {
        // Car profile: Lower chassis + cabin + 2 wheels
        if (p < 0.35) {
          // Chassis lower box
          const x = (p / 0.35 - 0.5) * 260 * scale;
          const y = 30 * scale + (Math.sin(p * 20) * 12);
          return { x: cx + x, y: cy + y };
        } else if (p < 0.65) {
          // Cabin dome
          const angle = ((p - 0.35) / 0.3) * Math.PI;
          const x = -Math.cos(angle) * 90 * scale;
          const y = -Math.sin(angle) * 70 * scale + 25 * scale;
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
        // Motorbike: Front wheel, rear wheel, slanted frame, tank, seat, handle
        if (p < 0.25) {
          // Rear Wheel
          const angle = (p / 0.25) * Math.PI * 2;
          return { x: cx - 80 * scale + Math.cos(angle) * 32 * scale, y: cy + 50 * scale + Math.sin(angle) * 32 * scale };
        } else if (p < 0.5) {
          // Front Wheel
          const angle = ((p - 0.25) / 0.25) * Math.PI * 2;
          return { x: cx + 80 * scale + Math.cos(angle) * 32 * scale, y: cy + 50 * scale + Math.sin(angle) * 32 * scale };
        } else if (p < 0.75) {
          // Main trellis frame & tank
          const t = (p - 0.5) / 0.25;
          const x = (-80 + t * 160) * scale;
          const y = (50 - Math.sin(t * Math.PI) * 95) * scale;
          return { x: cx + x, y: cy + y };
        } else {
          // Handlebar & rider seat
          const t = (p - 0.75) / 0.25;
          const x = (20 + t * 50) * scale;
          const y = (-20 - t * 40) * scale;
          return { x: cx + x, y: cy + y };
        }
      } else {
        // Scooter / Auto: Flat footboard deck, steering column, upright handle, 2 small wheels
        if (p < 0.25) {
          // Rear Small Wheel
          const angle = (p / 0.25) * Math.PI * 2;
          return { x: cx - 70 * scale + Math.cos(angle) * 22 * scale, y: cy + 60 * scale + Math.sin(angle) * 22 * scale };
        } else if (p < 0.5) {
          // Front Small Wheel
          const angle = ((p - 0.25) / 0.25) * Math.PI * 2;
          return { x: cx + 70 * scale + Math.cos(angle) * 22 * scale, y: cy + 60 * scale + Math.sin(angle) * 22 * scale };
        } else if (p < 0.75) {
          // Flat deck & auto cabin canopy
          const t = (p - 0.5) / 0.25;
          const x = (-70 + t * 140) * scale;
          const y = (50 - Math.pow(Math.sin(t * Math.PI), 0.5) * 80) * scale;
          return { x: cx + x, y: cy + y };
        } else {
          // Steering post
          const t = (p - 0.75) / 0.25;
          return { x: cx + 55 * scale + (t * 5 * scale), y: cy + (60 - t * 100) * scale };
        }
      }
    };

    // Initialize particles
    for (let i = 0; i < count; i++) {
      const initial = getTargetPosition(activeChapter || selectedVehicle.code, i, count);
      particles.push({
        x: initial.x + (Math.random() - 0.5) * 80,
        y: initial.y + (Math.random() - 0.5) * 80,
        tx: initial.x,
        ty: initial.y,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 1.2,
        alpha: Math.random() * 0.7 + 0.3,
        glow: Math.random() > 0.8
      });
    }

    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, width, height);

      // Frost stage floor grid & glowing ring (Igloo Reference)
      const cx = width / 2;
      const cy = height / 2;

      // Glowing circular floor portal
      const ringRadius = compact ? 120 : 260;
      const ringGrad = ctx.createRadialGradient(cx, cy + 90, 10, cx, cy + 90, ringRadius);
      ringGrad.addColorStop(0, 'rgba(69, 224, 242, 0.25)');
      ringGrad.addColorStop(0.5, 'rgba(58, 77, 255, 0.12)');
      ringGrad.addColorStop(1, 'rgba(241, 240, 250, 0)');
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 90, ringRadius, ringRadius * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Road stream dashes
      ctx.strokeStyle = 'rgba(58, 77, 255, 0.18)';
      ctx.lineWidth = 2;
      ctx.setLineDash([16, 24]);
      ctx.lineDashOffset = -time * 60;
      ctx.beginPath();
      ctx.moveTo(cx - 320, cy + 120);
      ctx.lineTo(cx + 320, cy + 120);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update target positions according to activeChapter
      const activeCode = activeChapter || selectedVehicle.code;
      for (let i = 0; i < count; i++) {
        const target = getTargetPosition(activeCode, i, count);
        const p = particles[i];

        // Smooth physics spring-morph
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        p.vx = (p.vx + dx * 0.045) * 0.84;
        p.vy = (p.vy + dy * 0.045) * 0.84;
        p.x += p.vx;
        p.y += p.vy;

        // Particle wheel roll / float vibration
        const floatOffset = Math.sin(time * 3 + i) * 1.5;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y + floatOffset, p.size, 0, Math.PI * 2);

        if (p.glow) {
          ctx.fillStyle = '#45E0F2';
          ctx.shadowColor = '#45E0F2';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = activeCode === 'cab' ? '#3A4DFF' : activeCode === 'bike' ? '#0A0A14' : '#5B5B73';
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
  }, [selectedVehicle, activeChapter, compact]);

  return (
    <div className={`relative w-full ${compact ? 'h-64' : 'h-[500px] md:h-[620px]'} flex items-center justify-center select-none`}>
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
    </div>
  );
}
