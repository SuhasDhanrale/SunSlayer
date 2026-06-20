import { useEffect, useRef, useState } from 'react';
import { YOKAI } from '../../data/yokai.js';
import { drawYokaiMask } from '../../renderer/YokaiRenderer.js';

const FINAL_DEMON_TYPES = YOKAI.map((yokai) => ({
  type: yokai.id,
  color: yokai.color,
  radius: yokai.galleryRadius,
  drawShape: (ctx, r) => {
    drawYokaiMask(ctx, yokai.id, r);
    ctx.beginPath(); // the shared renderer already owns its outline
  },
}));

export const FruitNinjaDemonsMock = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 800) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 500) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Game state variables
    let scoreCount = 0;
    let swipePoints = []; // [{x, y, time}]
    let demons = [];
    let splatters = []; // ink splatters and sparks
    let isMouseDown = false;
    let time = 0;
    let shakeAmt = 0;    // Screen shake intensity
    let slashFlash = 0;  // Flash white frame count

    const DEMON_TYPES = FINAL_DEMON_TYPES;

    // Spawn a demon
    const spawnDemon = () => {
      const w = canvas.width;
      const h = canvas.height;
      const typeData = DEMON_TYPES[Math.floor(Math.random() * DEMON_TYPES.length)];

      // 80% Side Rushing Spawns (easier to slash), 20% Bottom Launches
      const spawnFromBottom = Math.random() > 0.8;

      let x, y, vx, vy, gravity;
      
      if (spawnFromBottom) {
        // Launch up from bottom
        x = Math.random() * (w * 0.5) + w * 0.25;
        y = h + 50;
        vx = (Math.random() - 0.5) * 3;
        vy = -(Math.random() * 7 + 12); // fly up
        gravity = 0.4;
      } else {
        // Rush in horizontally from right to left
        x = w + 50;
        y = Math.random() * (h * 0.5) + h * 0.15; // spawn in upper 65% area
        vx = -(Math.random() * 5 + 7); // speed rushing left
        vy = (Math.random() - 0.5) * 2;
        gravity = 0.02; // slow fall, maintains side scroll
      }

      demons.push({
        id: Math.random(),
        x,
        y,
        vx,
        vy,
        gravity,
        ...typeData,
        isSliced: false,
        sliceAngle: 0,
        sliceX: 0,
        sliceY: 0,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        leftHalf: null,
        rightHalf: null
      });
    };

    // Spawn splatters (Calligraphy ink + demon blood sparks)
    const spawnSplatters = (x, y, color, count = 22) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 5;
        splatters.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 6 + 2.5,
          color: Math.random() > 0.3 ? '#020617' : color, // 70% dark calligraphy ink, 30% demon color
          opacity: 1,
          decay: Math.random() * 0.02 + 0.012,
          isInk: Math.random() > 0.4
        });
      }
    };

    // Check intersection between swipe path and a circular demon
    const checkSwipeSlice = (demon) => {
      if (demon.isSliced || swipePoints.length < 2) return false;

      const r = demon.radius;
      const p1 = swipePoints[swipePoints.length - 2];
      const p2 = swipePoints[swipePoints.length - 1];

      // Distance from demon center to segment p1-p2
      const A = p2.x - p1.x;
      const B = p2.y - p1.y;
      const C = p1.x - demon.x;
      const D = p1.y - demon.y;

      const dot = A * C + B * D;
      const lenSq = A * A + B * B;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;
      if (param < 0) {
        xx = p1.x;
        yy = p1.y;
      } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
      } else {
        xx = p1.x - param * A;
        yy = p1.y - param * B;
      }

      const dx = demon.x - xx;
      const dy = demon.y - yy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < r) {
        demon.isSliced = true;
        demon.sliceX = xx;
        demon.sliceY = yy;
        
        const angle = Math.atan2(B, A);
        demon.sliceAngle = angle;

        // Push two halves away perpendicular to slice angle
        demon.leftHalf = {
          x: 0,
          y: 0,
          vx: -Math.sin(angle) * 4.5 + demon.vx * 0.5,
          vy: Math.cos(angle) * 4.5 + demon.vy * 0.5,
          rotation: 0,
          rotSpeed: -0.09
        };
        demon.rightHalf = {
          x: 0,
          y: 0,
          vx: Math.sin(angle) * 4.5 + demon.vx * 0.5,
          vy: -Math.cos(angle) * 4.5 + demon.vy * 0.5,
          rotation: 0,
          rotSpeed: 0.09
        };

        // Trigger high impact visual feedback
        shakeAmt = 15;   // Screen shake
        slashFlash = 3;  // White screen flash (100% white scaling down)

        return true;
      }
      return false;
    };

    // Canvas coordinates helper
    const getCanvasCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * dpr,
        y: (clientY - rect.top) * dpr
      };
    };

    const handleStart = (e) => {
      isMouseDown = true;
      swipePoints = [];
      const coords = getCanvasCoords(e);
      swipePoints.push({ ...coords, time: Date.now() });
    };

    const handleMove = (e) => {
      if (!isMouseDown) return;
      const coords = getCanvasCoords(e);
      swipePoints.push({ ...coords, time: Date.now() });

      if (swipePoints.length > 15) {
        swipePoints.shift();
      }

      let hits = 0;
      demons.forEach(d => {
        if (checkSwipeSlice(d)) {
          hits++;
          scoreCount++;
          setScore(scoreCount);
          spawnSplatters(d.sliceX, d.sliceY, d.color);
        }
      });

      if (hits > 0) {
        setCombo(prev => prev + hits);
        setComboTimer(60);
      }
    };

    const handleEnd = () => {
      isMouseDown = false;
      swipePoints = [];
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    let active = true;

    // Draw Loop
    const frame = () => {
      if (!active) return;
      time++;

      const w = canvas.width;
      const h = canvas.height;

      // Wrap rendering loop in save/restore for screen shake translation
      ctx.save();
      if (shakeAmt > 0) {
        const dx = (Math.random() - 0.5) * shakeAmt;
        const dy = (Math.random() - 0.5) * shakeAmt;
        ctx.translate(dx, dy);
        shakeAmt *= 0.85; // Decay shake rapidly
        if (shakeAmt < 0.5) shakeAmt = 0;
      }

      // 1. Draw Japanese ink-wash backdrop
      ctx.fillStyle = '#0f172a'; // Dark slate
      ctx.fillRect(0, 0, w, h);

      // Grid/Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);

      // Spawn manager
      if (time % 70 === 0) {
        const spawnCount = Math.floor(Math.random() * 2) + 1;
        for (let s = 0; s < spawnCount; s++) spawnDemon();
      }

      // Spawn dark purple shadow smoke particles behind active demons for warning/danger
      demons.forEach(d => {
        if (!d.isSliced && Math.random() < 0.35) {
          splatters.push({
            x: d.x + (Math.random() - 0.5) * 15,
            y: d.y + (Math.random() - 0.5) * 15,
            vx: d.vx * 0.1 + (Math.random() - 0.5) * 1.5,
            vy: d.vy * 0.1 + (Math.random() - 0.5) * 1.5,
            radius: Math.random() * 10 + 6,
            color: 'rgba(24, 12, 38, 0.45)', // dark purple demonic curse aura
            opacity: 0.75,
            decay: 0.025,
            isInk: true // ink splat shape
          });
        }
      });

      // Update and Draw Debris Splatters
      splatters.forEach((s, idx) => {
        s.x += s.vx;
        s.y += s.vy;
        s.opacity -= s.decay;

        if (s.opacity <= 0) {
          splatters.splice(idx, 1);
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

      // Update and Draw Demons
      demons.forEach((d, idx) => {
        d.x += d.vx;
        d.y += d.vy;
        d.vy += d.gravity;
        d.rotation += d.rotationSpeed;

        if (d.y > h + 120 || d.x < -120 || d.x > w + 120) {
          demons.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.translate(d.x, d.y);

        if (!d.isSliced) {
          ctx.rotate(d.rotation);
          ctx.fillStyle = d.color;
          
          // Draw mask shape
          d.drawShape(ctx, d.radius);

          // Calligraphy mask outline
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        } else {
          // Draw sliced halves
          d.leftHalf.x += d.leftHalf.vx;
          d.leftHalf.y += d.leftHalf.vy;
          d.leftHalf.vy += d.gravity;
          d.leftHalf.rotation += d.leftHalf.rotSpeed;

          d.rightHalf.x += d.rightHalf.vx;
          d.rightHalf.y += d.rightHalf.vy;
          d.rightHalf.vy += d.gravity;
          d.rightHalf.rotation += d.rightHalf.rotSpeed;

          ctx.save();
          ctx.rotate(d.sliceAngle);

          // Left half
          ctx.save();
          ctx.translate(d.leftHalf.x, d.leftHalf.y);
          ctx.rotate(d.leftHalf.rotation);
          ctx.beginPath();
          ctx.rect(-100, -100, 100, 200);
          ctx.clip();
          ctx.fillStyle = d.color;
          d.drawShape(ctx, d.radius);
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();

          // Right half
          ctx.save();
          ctx.translate(d.rightHalf.x, d.rightHalf.y);
          ctx.rotate(d.rightHalf.rotation);
          ctx.beginPath();
          ctx.rect(0, -100, 100, 200);
          ctx.clip();
          ctx.fillStyle = d.color;
          d.drawShape(ctx, d.radius);
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();

          ctx.restore();
        }

        ctx.restore();
      });

      // Draw Swipe Trail (Katana slash line as tapering calligraphy brush stroke)
      if (swipePoints.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#f8fafc'; // solid off-white Sumi-e brush color

        for (let i = 1; i < swipePoints.length; i++) {
          const p1 = swipePoints[i - 1];
          const p2 = swipePoints[i];
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          // Width grows from tail to head
          const progress = i / swipePoints.length;
          ctx.lineWidth = progress * 10 + 2.5;
          ctx.stroke();
        }

        ctx.restore();
      }

      // Restore screen shake context
      ctx.restore();

      // Render screen slash white-flash overlay
      if (slashFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${slashFlash * 0.22})`; // bright flash
        ctx.fillRect(0, 0, w, h);
        slashFlash--;
      }

      // Reset combo timer
      setComboTimer(prev => {
        if (prev > 0) return prev - 1;
        else {
          setCombo(0);
          return 0;
        }
      });

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    return () => {
      active = false;
      ro.disconnect();
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 font-sans select-none">
      {/* HUD Info */}
      <div className="flex justify-between items-center bg-slate-900 px-6 py-3 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
            Tameshigiri Challenge
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-wide">
            👹 YOKAI SLASH LAB
          </h2>
        </div>
        <div className="flex items-center gap-6">
          {/* Combo Alert */}
          {combo > 1 && comboTimer > 0 && (
            <div className="animate-bounce bg-red-650 text-white px-3.5 py-1 rounded-full font-bold text-sm tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.7)] border border-red-500">
              🔥 {combo}x Combo!
            </div>
          )}
          
          <div className="text-right">
            <span className="text-xs font-mono text-slate-500 block">SLAIN</span>
            <span className="text-2xl font-black text-red-500">{score}</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-4">
        <canvas ref={canvasRef} className="block w-full h-full bg-slate-900 border border-slate-800 shadow-2xl rounded-lg cursor-crosshair max-w-5xl max-h-[600px]" />
        
        {/* Instruction overlay */}
        <div className="absolute bottom-8 text-center pointer-events-none">
          <p className="text-xs text-slate-400 font-mono bg-slate-950/80 px-4 py-2 rounded-full border border-slate-800">
            🖱️ Click and drag fast to slash the appearing Yokai masks
          </p>
        </div>
      </div>
    </div>
  );
};
