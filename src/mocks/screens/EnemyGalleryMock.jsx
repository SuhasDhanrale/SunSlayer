import { useEffect, useRef, useState } from 'react';
import { Sword, Sliders, Info, Plus, Sparkles } from 'lucide-react';

const TRADITIONAL_COLORS = [
  { name: 'Shu (Vermilion)', hex: '#dc2626', desc: 'Warding off evil' },
  { name: 'Kachi-iro (Indigo)', hex: '#1e3a8a', desc: 'Victory & strength' },
  { name: 'Tetsu-kon (Teal Ink)', hex: '#0f766e', desc: 'Nature spirits' },
  { name: 'Sumi (Charcoal)', hex: '#1e293b', desc: 'Ink brush shadow' },
  { name: 'Gofun (Bone White)', hex: '#f8fafc', desc: 'Spiritual purity' },
  { name: 'Yamabuki (Gold)', hex: '#d97706', desc: 'Divine energy' },
  { name: 'Kokushoku (Pure Black)', hex: '#020617', desc: 'Void & shadow' },
  { name: 'Murasaki (Royal Purple)', hex: '#701a75', desc: 'Mystical power' }
];

const INITIAL_DEMONS = [
  {
    id: 'oni',
    name: 'Oni Mask (鬼)',
    desc: 'Classic horned ogre representing wrath and raw power. Broad crimson face, golden horns, protruding fangs.',
    color: '#dc2626',
    radius: 35,
    rotationSpeed: 0.015,
    drawShape: (ctx, r) => {
      // Oni Mask (Horned Ogre)
      ctx.beginPath();
      ctx.arc(0, 5, r * 0.9, 0, Math.PI, false); // bottom jaw
      ctx.lineTo(-r * 0.9, -r * 0.2);
      ctx.quadraticCurveTo(-r * 0.6, -r * 0.95, 0, -r * 0.95); // forehead
      ctx.quadraticCurveTo(r * 0.6, -r * 0.95, r * 0.9, -r * 0.2);
      ctx.closePath();
      ctx.fill();

      // Spiked Horns
      ctx.fillStyle = '#facc15'; // Yellow horns
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.85);
      ctx.quadraticCurveTo(-r * 0.9, -r * 1.1, -r * 0.95, -r * 1.5);
      ctx.quadraticCurveTo(-r * 0.5, -r * 1.1, -r * 0.2, -r * 0.85);
      ctx.moveTo(r * 0.5, -r * 0.85);
      ctx.quadraticCurveTo(r * 0.9, -r * 1.1, r * 0.95, -r * 1.5);
      ctx.quadraticCurveTo(r * 0.5, -r * 1.1, r * 0.2, -r * 0.85);
      ctx.closePath();
      ctx.fill();

      // Glaring Yellow Eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.25, r * 0.18, r * 0.08, 0.25, 0, Math.PI * 2);
      ctx.ellipse(r * 0.3, -r * 0.25, r * 0.18, r * 0.08, -0.25, 0, Math.PI * 2);
      ctx.fill();

      // Sharp White Fangs
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, r * 0.45);
      ctx.lineTo(-r * 0.55, r * 0.75);
      ctx.lineTo(-r * 0.3, r * 0.45);
      ctx.moveTo(r * 0.45, r * 0.45);
      ctx.lineTo(r * 0.55, r * 0.75);
      ctx.lineTo(r * 0.3, r * 0.45);
      ctx.closePath();
      ctx.fill();
    }
  },
  {
    id: 'tengu',
    name: 'Tengu Mask (天狗)',
    desc: 'Feral bird spirit representing pride and martial prowess. Long, hooked beak-nose and a golden forehead Tokin cap.',
    color: '#7f1d1d',
    radius: 32,
    rotationSpeed: -0.01,
    drawShape: (ctx, r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Long menacing beak/nose
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.15);
      ctx.quadraticCurveTo(-r * 1.2, -r * 0.1, -r * 1.6, r * 0.5);
      ctx.quadraticCurveTo(-r * 0.8, r * 0.6, 0, r * 0.45);
      ctx.closePath();
      ctx.fill();

      // Glaring White Eyes with black slit pupils
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.25, r * 0.16, 0, Math.PI * 2);
      ctx.arc(r * 0.35, -r * 0.25, r * 0.16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.25, r * 0.06, 0, Math.PI * 2);
      ctx.arc(r * 0.35, -r * 0.25, r * 0.06, 0, Math.PI * 2);
      ctx.fill();

      // Golden tokin cap
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-r * 0.3, -r * 1.05, r * 0.6, r * 0.25);
    }
  },
  {
    id: 'kitsune',
    name: 'Kitsune Mask (狐)',
    desc: 'Cunning white fox messenger spirit of Inari. Pale bone-white, glowing cyan eyes, and fiery red cheek stripes.',
    color: '#f8fafc',
    radius: 30,
    rotationSpeed: 0.02,
    drawShape: (ctx, r) => {
      ctx.beginPath();
      ctx.moveTo(0, r * 1.2);
      ctx.lineTo(-r * 0.85, 0);
      ctx.lineTo(-r * 0.85, -r * 0.45);
      ctx.lineTo(0, -r * 0.85);
      ctx.lineTo(r * 0.85, -r * 0.45);
      ctx.lineTo(r * 0.85, 0);
      ctx.closePath();
      ctx.fill();

      // Spirit eyes
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.22, r * 0.16, r * 0.06, 0.2, 0, Math.PI * 2);
      ctx.ellipse(r * 0.3, -r * 0.22, r * 0.16, r * 0.06, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Red cheek stripe markings
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.15);
      ctx.lineTo(-r * 0.4, r * 0.05);
      ctx.lineTo(-r * 0.8, r * 0.1);
      ctx.moveTo(r * 0.8, -r * 0.15);
      ctx.lineTo(r * 0.4, r * 0.05);
      ctx.lineTo(r * 0.8, r * 0.1);
      ctx.fill();

      // Fox ears
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.35);
      ctx.lineTo(-r * 0.95, -r * 1.15);
      ctx.lineTo(-r * 0.3, -r * 0.65);
      ctx.moveTo(r * 0.7, -r * 0.35);
      ctx.lineTo(r * 0.95, -r * 1.15);
      ctx.lineTo(r * 0.3, -r * 0.65);
      ctx.closePath();
      ctx.fill();
    }
  },
  {
    id: 'hannya',
    name: 'Hannya Mask (般若)',
    desc: 'Fierce metal-horned demon of jealousy from Noh theater. Bronze skin, wide grinning fanged mouth, and gold horns.',
    color: '#7c2d12',
    radius: 34,
    rotationSpeed: -0.015,
    drawShape: (ctx, r) => {
      // Broad jaw and forehead
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.5);
      ctx.lineTo(-r * 0.9, r * 0.3);
      ctx.quadraticCurveTo(-r * 0.6, r * 1.1, 0, r * 1.1); // huge chin
      ctx.quadraticCurveTo(r * 0.6, r * 1.1, r * 0.9, r * 0.3);
      ctx.lineTo(r * 0.8, -r * 0.5);
      ctx.quadraticCurveTo(r * 0.4, -r * 0.9, 0, -r * 0.9);
      ctx.quadraticCurveTo(-r * 0.4, -r * 0.9, -r * 0.8, -r * 0.5);
      ctx.closePath();
      ctx.fill();

      // Long Curved Horns
      ctx.fillStyle = '#ca8a04'; // Gold
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.7);
      ctx.quadraticCurveTo(-r * 1.2, -r * 1.0, -r * 1.3, -r * 1.5);
      ctx.quadraticCurveTo(-r * 0.8, -r * 1.1, -r * 0.3, -r * 0.75);
      ctx.moveTo(r * 0.6, -r * 0.7);
      ctx.quadraticCurveTo(r * 1.2, -r * 1.0, r * 1.3, -r * 1.5);
      ctx.quadraticCurveTo(r * 0.8, -r * 1.1, r * 0.3, -r * 0.75);
      ctx.closePath();
      ctx.fill();

      // Angry Gold Eyes
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.25, r * 0.14, 0, Math.PI * 2);
      ctx.arc(r * 0.32, -r * 0.25, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.25, r * 0.05, 0, Math.PI * 2);
      ctx.arc(r * 0.32, -r * 0.25, r * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Menacing Grinning Mouth (gold fangs inside dark mouth)
      ctx.fillStyle = '#1e1b4b'; // Dark blue-black
      ctx.beginPath();
      ctx.arc(0, r * 0.45, r * 0.5, 0, Math.PI);
      ctx.closePath();
      ctx.fill();

      // Sharp Gold teeth/fangs
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, r * 0.45);
      ctx.lineTo(-r * 0.42, r * 0.75);
      ctx.lineTo(-r * 0.25, r * 0.45);
      ctx.moveTo(r * 0.35, r * 0.45);
      ctx.lineTo(r * 0.42, r * 0.75);
      ctx.lineTo(r * 0.25, r * 0.45);
      ctx.closePath();
      ctx.fill();
    }
  },
  {
    id: 'kappa',
    name: 'Kappa Mask (河童)',
    desc: 'Mischievous aquatic yokai. Teal body, yellow bird-like beak, and a hollow water-retaining dish on its skull.',
    color: '#0f766e',
    radius: 32,
    rotationSpeed: 0.005,
    drawShape: (ctx, r) => {
      // Round face
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // Water Dish (flat bowl on top of head)
      ctx.fillStyle = '#115e59';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.8, r * 0.6, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Water in the dish
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.82, r * 0.5, r * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp beak
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, r * 0.2);
      ctx.lineTo(0, r * 0.85);
      ctx.lineTo(r * 0.35, r * 0.2);
      ctx.quadraticCurveTo(0, r * 0.1, -r * 0.35, r * 0.2);
      ctx.closePath();
      ctx.fill();

      // Big round black eyes with white rims
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(-r * 0.38, -r * 0.15, r * 0.18, 0, Math.PI * 2);
      ctx.arc(r * 0.38, -r * 0.15, r * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-r * 0.38, -r * 0.15, r * 0.08, 0, Math.PI * 2);
      ctx.arc(r * 0.38, -r * 0.15, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: 'yuki-onna',
    name: 'Yuki-Onna (雪女)',
    desc: 'Hauntingly beautiful spirit of snowstorms. Pale ice-blue skin, freezing purple lips, and flowing blue hair outlines.',
    color: '#e0f2fe',
    radius: 31,
    rotationSpeed: -0.005,
    drawShape: (ctx, r) => {
      // Oval face
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.78, r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flowing icy hair framing the face
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, -r * 0.5);
      ctx.quadraticCurveTo(-r * 0.8, -r * 1.2, 0, -r * 1.15);
      ctx.quadraticCurveTo(-r * 0.3, -r * 1.0, -r * 0.2, -r * 0.6);
      ctx.quadraticCurveTo(-r * 0.5, -r * 0.4, -r * 0.75, -r * 0.5);
      ctx.moveTo(r * 0.75, -r * 0.5);
      ctx.quadraticCurveTo(r * 0.8, -r * 1.2, 0, -r * 1.15);
      ctx.quadraticCurveTo(r * 0.3, -r * 1.0, r * 0.2, -r * 0.6);
      ctx.quadraticCurveTo(r * 0.5, -r * 0.4, r * 0.75, -r * 0.5);
      ctx.closePath();
      ctx.fill();

      // Slender cold purple forehead crystal
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(r * 0.12, -r * 0.65);
      ctx.lineTo(0, -r * 0.45);
      ctx.lineTo(-r * 0.12, -r * 0.65);
      ctx.closePath();
      ctx.fill();

      // Eerie Closed Eyes
      ctx.strokeStyle = '#312e81';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.15, r * 0.15, Math.PI, Math.PI * 2, false);
      ctx.arc(r * 0.3, -r * 0.15, r * 0.15, Math.PI, Math.PI * 2, false);
      ctx.stroke();

      // Cold purple lips
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.42, r * 0.15, r * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: 'noface',
    name: 'No-Face Mask (野箆坊)',
    desc: 'Eerie faceless yokai mimicking human presence. A completely blank slate-white oval with minimal calligraphy markings.',
    color: '#fafaf9',
    radius: 30,
    rotationSpeed: 0.008,
    drawShape: (ctx, r) => {
      // Eerie smooth egg-shaped head
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.85, r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Traditional purple diamond forehead mark
      ctx.fillStyle = '#86198f';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(r * 0.1, -r * 0.45);
      ctx.lineTo(0, -r * 0.3);
      ctx.lineTo(-r * 0.1, -r * 0.45);
      ctx.closePath();
      ctx.fill();

      // Vermilion chin mark
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, r * 0.5, r * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrow slits
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.1, r * 0.1, r * 0.03, 0.1, 0, Math.PI * 2);
      ctx.ellipse(r * 0.3, -r * 0.1, r * 0.1, r * 0.03, -0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
];

// Helper to draw a tiny preview inside the cards
const MiniMaskPreview = ({ demon }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    let rot = 0;
    let animFrame;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rot);

      ctx.fillStyle = demon.color;
      demon.drawShape(ctx, demon.radius * 0.8);

      // Calligraphy outline
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();

      rot += 0.015;
      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, [demon]);

  return (
    <canvas
      ref={canvasRef}
      width={100}
      height={100}
      className="bg-slate-950/40 border border-slate-800 rounded-lg shadow-inner w-[80px] h-[80px]"
    />
  );
};

export const EnemyGalleryMock = () => {
  const [demons, setDemons] = useState(INITIAL_DEMONS);
  const [selectedId, setSelectedId] = useState('oni');
  const activeDemon = demons.find(d => d.id === selectedId) || demons[0];

  // Editor states (overrides for active demon in preview)
  const [color, setColor] = useState(activeDemon.color);
  const [radius, setRadius] = useState(activeDemon.radius);
  const [rotationSpeed, setRotationSpeed] = useState(activeDemon.rotationSpeed);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customBaseTemplate, setCustomBaseTemplate] = useState('oni');

  // Preview & Physics Ref states
  const previewCanvasRef = useRef(null);
  const sandboxCanvasRef = useRef(null);
  
  // Slice simulation trigger
  const [isSliced, setIsSliced] = useState(false);
  const [sliceAngle, setSliceAngle] = useState(Math.PI / 6);
  const slicePhysicsRef = useRef(null);

  // Synchronize editor controls with active demon when selection changes
  useEffect(() => {
    setColor(activeDemon.color);
    setRadius(activeDemon.radius);
    setRotationSpeed(activeDemon.rotationSpeed);
    setIsSliced(false);
    slicePhysicsRef.current = null;
  }, [selectedId, activeDemon]);

  // Main interactive preview loop (renders large rotating or sliced mask with physics)
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    let time = 0;
    let rotation = 0;
    let particles = [];
    let active = true;

    const frame = () => {
      if (!active) return;
      time++;
      ctx.clearRect(0, 0, w, h);

      // Background Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }

      ctx.save();
      ctx.translate(w / 2, h / 2);

      if (!isSliced) {
        rotation += rotationSpeed;
        ctx.rotate(rotation);
        
        ctx.fillStyle = color;
        activeDemon.drawShape(ctx, radius);

        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      } else {
        // Draw slice halves with basic gravity physics
        if (!slicePhysicsRef.current) {
          slicePhysicsRef.current = {
            left: { x: 0, y: 0, vx: -Math.sin(sliceAngle) * 3, vy: Math.cos(sliceAngle) * 3 - 2, rot: 0, rotSpeed: -0.06 },
            right: { x: 0, y: 0, vx: Math.sin(sliceAngle) * 3, vy: -Math.cos(sliceAngle) * 3 - 2, rot: 0, rotSpeed: 0.06 },
            gravity: 0.25
          };

          // Generate spark/ink particles once
          for (let i = 0; i < 20; i++) {
            const pAngle = sliceAngle + (Math.random() - 0.5) * Math.PI;
            const speed = Math.random() * 6 + 3;
            particles.push({
              x: 0,
              y: 0,
              vx: Math.cos(pAngle) * speed,
              vy: Math.sin(pAngle) * speed,
              radius: Math.random() * 5 + 2,
              color: Math.random() > 0.4 ? '#020617' : color,
              opacity: 1,
              decay: Math.random() * 0.02 + 0.015,
              isInk: Math.random() > 0.3
            });
          }
        }

        const phys = slicePhysicsRef.current;
        phys.left.x += phys.left.vx;
        phys.left.y += phys.left.vy;
        phys.left.vy += phys.gravity;
        phys.left.rot += phys.left.rotSpeed;

        phys.right.x += phys.right.vx;
        phys.right.y += phys.right.vy;
        phys.right.vy += phys.gravity;
        phys.right.rot += phys.right.rotSpeed;

        ctx.save();
        ctx.rotate(sliceAngle);

        // Left Half clip/draw
        ctx.save();
        ctx.translate(phys.left.x, phys.left.y);
        ctx.rotate(phys.left.rot);
        ctx.beginPath();
        ctx.rect(-200, -200, 200, 400);
        ctx.clip();
        ctx.fillStyle = color;
        activeDemon.drawShape(ctx, radius);
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();

        // Right Half clip/draw
        ctx.save();
        ctx.translate(phys.right.x, phys.right.y);
        ctx.rotate(phys.right.rot);
        ctx.beginPath();
        ctx.rect(0, -200, 200, 400);
        ctx.clip();
        ctx.fillStyle = color;
        activeDemon.drawShape(ctx, radius);
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();

        ctx.restore();

        // Draw Slash Cut Line
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const startX = -120 * Math.cos(sliceAngle);
        const startY = -120 * Math.sin(sliceAngle);
        const endX = 120 * Math.cos(sliceAngle);
        const endY = 120 * Math.sin(sliceAngle);
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Render Cut particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= p.decay;
        if (p.opacity <= 0) {
          particles.splice(idx, 1);
          return;
        }
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.isInk) {
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.8, 0, Math.PI * 2);
        } else {
          ctx.arc(p.x, p.y, p.radius * 0.6, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
    return () => { active = false; };
  }, [activeDemon, isSliced, sliceAngle, color, radius, rotationSpeed]);

  // Click handler to trigger preview slice
  const triggerPreviewSlice = () => {
    if (isSliced) {
      setIsSliced(false);
      slicePhysicsRef.current = null;
    } else {
      setSliceAngle((Math.random() - 0.5) * Math.PI / 1.5);
      setIsSliced(true);
    }
  };

  // Click drag slashing sandbox loop
  useEffect(() => {
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    let points = []; // [{x, y}]
    let sandboxDemons = [];
    let sandboxSplatters = [];
    let isDrawing = false;
    let time = 0;
    let active = true;

    // Spawn regular testing items
    const spawnSandboxDemon = () => {
      sandboxDemons.push({
        id: Math.random(),
        x: Math.random() * (w - 100) + 50,
        y: h + 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -(Math.random() * 5 + 10),
        gravity: 0.35,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        isSliced: false,
        sliceAngle: 0,
        leftHalf: null,
        rightHalf: null
      });
    };

    const handleStart = (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      points = [{ x, y }];
    };

    const handleMove = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      points.push({ x, y });
      if (points.length > 12) points.shift();

      // Slice check
      if (points.length >= 2) {
        const p1 = points[points.length - 2];
        const p2 = points[points.length - 1];

        sandboxDemons.forEach(d => {
          if (d.isSliced) return;
          // circular distance check
          const dist = Math.hypot(d.x - p2.x, d.y - p2.y);
          if (dist < radius + 15) {
            d.isSliced = true;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            d.sliceAngle = angle;
            d.leftHalf = { x: 0, y: 0, vx: -Math.sin(angle) * 3.5, vy: Math.cos(angle) * 3.5 - 1, rot: 0, rotSpeed: -0.08 };
            d.rightHalf = { x: 0, y: 0, vx: Math.sin(angle) * 3.5, vy: -Math.cos(angle) * 3.5 - 1, rot: 0, rotSpeed: 0.08 };
            
            // Add splatters
            for (let i = 0; i < 15; i++) {
              const pAngle = angle + (Math.random() - 0.5) * Math.PI;
              const spd = Math.random() * 5 + 3;
              sandboxSplatters.push({
                x: d.x,
                y: d.y,
                vx: Math.cos(pAngle) * spd,
                vy: Math.sin(pAngle) * spd,
                radius: Math.random() * 4 + 1.5,
                color: Math.random() > 0.4 ? '#020617' : color,
                opacity: 1,
                decay: Math.random() * 0.03 + 0.02,
                isInk: Math.random() > 0.3
              });
            }
          }
        });
      }
    };

    const handleEnd = () => {
      isDrawing = false;
      points = [];
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    const frame = () => {
      if (!active) return;
      time++;
      ctx.clearRect(0, 0, w, h);

      // Periodic spawn
      if (time % 80 === 0) spawnSandboxDemon();

      // Draw active sandbox demons
      sandboxDemons.forEach((d, idx) => {
        d.x += d.vx;
        d.y += d.vy;
        d.vy += d.gravity;
        d.rotation += d.rotationSpeed;

        if (d.y > h + 100) {
          sandboxDemons.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.translate(d.x, d.y);

        if (!d.isSliced) {
          ctx.rotate(d.rotation);
          ctx.fillStyle = color;
          activeDemon.drawShape(ctx, radius * 0.85);
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          d.leftHalf.x += d.leftHalf.vx;
          d.leftHalf.y += d.leftHalf.vy;
          d.leftHalf.vy += d.gravity;
          d.leftHalf.rot += d.leftHalf.rotSpeed;

          d.rightHalf.x += d.rightHalf.vx;
          d.rightHalf.y += d.rightHalf.vy;
          d.rightHalf.vy += d.gravity;
          d.rightHalf.rot += d.rightHalf.rotSpeed;

          ctx.save();
          ctx.rotate(d.sliceAngle);

          // Left
          ctx.save();
          ctx.translate(d.leftHalf.x, d.leftHalf.y);
          ctx.rotate(d.leftHalf.rot);
          ctx.beginPath();
          ctx.rect(-100, -100, 100, 200);
          ctx.clip();
          ctx.fillStyle = color;
          activeDemon.drawShape(ctx, radius * 0.85);
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();

          // Right
          ctx.save();
          ctx.translate(d.rightHalf.x, d.rightHalf.y);
          ctx.rotate(d.rightHalf.rot);
          ctx.beginPath();
          ctx.rect(0, -100, 100, 200);
          ctx.clip();
          ctx.fillStyle = color;
          activeDemon.drawShape(ctx, radius * 0.85);
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();

          ctx.restore();
        }
        ctx.restore();
      });

      // Update and Draw Debris splatters
      sandboxSplatters.forEach((s, idx) => {
        s.x += s.vx;
        s.y += s.vy;
        s.opacity -= s.decay;
        if (s.opacity <= 0) {
          sandboxSplatters.splice(idx, 1);
          return;
        }
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        if (s.isInk) {
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.arc(s.x - s.radius * 0.3, s.y - s.radius * 0.3, s.radius * 0.8, 0, Math.PI * 2);
        } else {
          ctx.arc(s.x, s.y, s.radius * 0.7, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      });

      // Tapering calligraphy brush stroke swipe trail
      if (points.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#f8fafc'; // solid off-white brush color

        for (let i = 1; i < points.length; i++) {
          const p1 = points[i - 1];
          const p2 = points[i];
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          const progress = i / points.length;
          ctx.lineWidth = progress * 7 + 2; // taper trail
          ctx.stroke();
        }
        ctx.restore();
      }

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
    return () => {
      active = false;
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [activeDemon, radius, color]);

  // Handle creating a new custom demon visual template
  const handleCreateCustomDemon = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    // Pick draw shape based on baseline template selected
    const template = demons.find(d => d.id === customBaseTemplate) || demons[0];
    const newId = `custom_${Date.now()}`;
    const newDemon = {
      id: newId,
      name: `${customName} (Custom)`,
      desc: customDesc || `A custom Yokai created with size ${radius} and matching Sumi pigment.`,
      color: color,
      radius: radius,
      rotationSpeed: rotationSpeed,
      drawShape: template.drawShape
    };

    setDemons([...demons, newDemon]);
    setSelectedId(newId);
    setCustomName('');
    setCustomDesc('');
  };

  return (
    <div className="flex flex-col xl:flex-row h-full w-full bg-slate-950 font-sans select-none overflow-hidden">
      
      {/* LEFT COLUMN: Yokai Asset Gallery Selection */}
      <div className="w-full xl:w-[460px] flex flex-col border-r border-slate-900 bg-slate-900/40 p-5 overflow-y-auto shrink-0 max-h-screen xl:max-h-none">
        <div className="mb-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
            Dev Asset Studio
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 mt-2.5 tracking-wide">
            👺 YOKAI DEMON LIBRARY
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse, customize, and prototype the hand-drawn Kabuki-style mask assets for the game.
          </p>
        </div>

        {/* Preset Cards List */}
        <div className="flex flex-col gap-3 mb-6">
          {demons.map(demon => {
            const isSelected = demon.id === selectedId;
            return (
              <div
                key={demon.id}
                onClick={() => setSelectedId(demon.id)}
                className={`flex gap-4 p-3.5 rounded-xl border cursor-pointer transition-all duration-300 items-center hover:bg-slate-900/60 ${
                  isSelected
                    ? 'border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                    : 'border-slate-800 bg-slate-950/40'
                }`}
              >
                <MiniMaskPreview demon={demon} />
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm tracking-wide ${isSelected ? 'text-red-400' : 'text-slate-200'}`}>
                    {demon.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {demon.desc}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800/80">
                      R: {demon.radius}px
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800/80">
                      Color: {demon.color}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CREATE CUSTOM ENEMY WORKBENCH */}
        <form onSubmit={handleCreateCustomDemon} className="border border-slate-800/80 bg-slate-950/60 rounded-xl p-4 mt-auto">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-900">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
              Forge Custom Visual Variant
            </h4>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Variant Name</label>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="e.g. Golden Gaki, Poison Oni"
                className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Base Draw Template</label>
              <select
                value={customBaseTemplate}
                onChange={e => setCustomBaseTemplate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-300 focus:outline-none focus:border-red-500"
              >
                {demons.filter(d => !d.id.startsWith('custom_')).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-semibold">Short Lore / Description</label>
              <textarea
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                placeholder="Variant specific characteristics..."
                className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 h-12 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!customName.trim()}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Register Variant into Studio
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: Studio Editor Panel */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto max-h-screen">
        
        {/* Active Mask Detail Panel */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          
          {/* Main Visualizer Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/30 border border-slate-900 rounded-2xl p-6 relative min-h-[360px]">
            <div className="absolute top-4 left-4 flex gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Studio View
              </span>
              {isSliced && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/60 animate-pulse">
                  Sliced Half
                </span>
              )}
            </div>

            <button
              onClick={triggerPreviewSlice}
              className="absolute top-4 right-4 bg-slate-850 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sword className="w-3.5 h-3.5 text-red-500" />
              {isSliced ? 'Reset / Weld Mask' : 'Trigger Slash Cut'}
            </button>

            <canvas
              ref={previewCanvasRef}
              width={300}
              height={300}
              className="bg-slate-950/20 border border-slate-800 rounded-2xl shadow-xl w-[260px] h-[260px]"
            />

            <p className="text-[10px] text-slate-500 font-mono mt-4 text-center select-text">
              Anchor: Center (0,0) • Outline Width: 3.5px • Style: Sumi-e Woodblock Flat Print
            </p>
          </div>

          {/* Editor Customizer Panel */}
          <div className="w-full lg:w-[360px] flex flex-col border border-slate-900 bg-slate-900/40 rounded-2xl p-5 shrink-0">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-red-400" />
              <h3 className="font-black text-xs uppercase text-slate-200 tracking-wider">
                Variant Customization
              </h3>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              
              {/* Radius customizer */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400">Scale Radius</label>
                  <span className="text-[11px] font-mono text-slate-200 font-bold">{radius}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={radius}
                  onChange={e => setRadius(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Rotation speed customizer */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400">Spin Motion Speed</label>
                  <span className="text-[11px] font-mono text-slate-200 font-bold">
                    {rotationSpeed === 0 ? 'Paused' : `${(rotationSpeed * 60).toFixed(1)}°/s`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.04"
                  max="0.04"
                  step="0.002"
                  value={rotationSpeed}
                  onChange={e => setRotationSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-1">
                  <span>◀ CCW Spin</span>
                  <span onClick={() => setRotationSpeed(0)} className="cursor-pointer hover:text-slate-400">Stop</span>
                  <span>CW Spin ▶</span>
                </div>
              </div>

              {/* Ink Pigment Picker */}
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-2">
                  Japanese Ink Pigment
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {TRADITIONAL_COLORS.map(col => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setColor(col.hex)}
                      title={`${col.name} (${col.desc})`}
                      className={`h-8 w-full rounded border flex items-center justify-center transition-all cursor-pointer ${
                        color.toLowerCase() === col.hex.toLowerCase()
                          ? 'border-red-500 scale-105 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {color.toLowerCase() === col.hex.toLowerCase() && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white mix-blend-difference" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 bg-slate-950/50 border border-slate-900 p-2.5 rounded-lg">
                  <div className="w-3.5 h-3.5 rounded border border-slate-800" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex-1">
                    Hex Code: {color}
                  </span>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-5 h-5 bg-transparent border-0 cursor-pointer accent-red-500 outline-none"
                  />
                </div>
              </div>

              {/* Mini Lore Box */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 mt-auto flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-black uppercase text-slate-300 tracking-wider">
                    Sumi-e Outline Rule
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Visuals are structured using a dual drawing layout: the inner components fill using stylized colors, while a thick 3.5px charcoal-black outline frames the outer edge. No glowing dropshadows.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* SPWNING PLAYGROUND: Interactive Slash Sandbox */}
        <div className="flex flex-col border border-slate-900 bg-slate-900/40 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-emerald-400" />
              <h3 className="font-black text-xs uppercase text-slate-200 tracking-wider">
                Yokai Slashing Sandbox
              </h3>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
              Interactive Test Chamber
            </span>
          </div>

          <div className="relative w-full h-[240px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
            <canvas
              ref={sandboxCanvasRef}
              width={750}
              height={240}
              className="absolute top-0 left-0 w-full h-full block cursor-crosshair"
            />
            
            <p className="absolute bottom-3 text-[10px] text-slate-500 font-mono pointer-events-none select-none bg-slate-950/80 border border-slate-800 px-3.5 py-1 rounded-full">
              🖱️ Drag mouse quickly across floating masks to slice them with the calligraphy brush trail
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
