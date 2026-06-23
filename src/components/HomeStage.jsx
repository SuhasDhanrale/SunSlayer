import React, { useEffect, useRef } from 'react';
import { createRainBackground } from '../renderer/BiomeBackgrounds.js';
import { drawCharacter } from '../renderer/characters/index.js';
import { getCharacter } from '../data/characters.js';
import { Persistence } from '../core/Persistence.js';
import { bus } from '../core/bus.js';

// Interactive home-screen stage, ported from the "Start Screen" mock
// (StartScreenMock.jsx). Replaces the plain MenuBackground on the home screen:
// the same live `rain` backdrop, plus the equipped monk standing on the ground
// and a floating paper "PLAY" lantern. Slicing (or tapping) the lantern starts
// the run — the monk breaks into a sprint and we hand off to PLAYING.
//
// Pure-ish menu chrome: it owns its own canvas + pointer input and reuses the
// pure renderers (createRainBackground, drawCharacter). The rAF loop reads
// everything through refs so it never restarts on re-render. onStart fires once.
export function HomeStage({ onStart }) {
  const canvasRef = useRef(null);
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  const stateRef = useRef({
    time: 0,
    started: false,      // lamp sliced — the monk is sprinting toward the run
    handedOff: false,    // onStart already fired
    isSlashing: false,
    slashTrail: [],
    charX: null,         // smoothed monk x (logical px)
    lamp: { x: 0, y: 0, w: 0, h: 0, sliced: false, vy: 0, rot: 0, vRot: 0 },
    fireflies: [],
  });

  // Slice the lamp: spawn fireflies, send the monk running, then hand off.
  const triggerStart = (direction) => {
    const s = stateRef.current;
    if (s.started || s.lamp.sliced) return;
    const lamp = s.lamp;
    lamp.sliced = true;
    lamp.vy = -4;
    lamp.vRot = direction * 0.05;
    s.started = true;

    // Slicing the PLAY lantern plays the real sword-slash recording — the
    // SoundSystem (attached app-wide) renders Slash.mp3 off this event.
    bus.emit('combo:hit', { source: 'slice' });

    for (let i = 0; i < 30; i++) {
      s.fireflies.push({
        x: lamp.x,
        y: lamp.y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        size: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.01 + 0.005,
      });
    }

    // Watch the monk break into a sprint, then enter the run.
    setTimeout(() => {
      if (s.handedOff) return;
      s.handedOff = true;
      onStartRef.current?.();
    }, 900);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width || window.innerWidth));
      canvas.height = Math.max(1, Math.round(rect.height || window.innerHeight));
      // Re-anchor the lantern on resize (top-right third, mid-height).
      const lamp = stateRef.current.lamp;
      lamp.w = Math.min(canvas.width, canvas.height) * 0.2;
      lamp.h = lamp.w * 1.28;
      lamp.x = canvas.width * 0.7;
      lamp.y = canvas.height * 0.5;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const backdrop = createRainBackground();
    const charId = Persistence.data.equippedCharacterId;
    const accent = getCharacter(charId).accentColor;

    const drawLampBody = (isSliced) => {
      const { w, h } = stateRef.current.lamp;
      if (!isSliced) {
        const aura = ctx.createRadialGradient(0, 0, w * 0.2, 0, 0, w * 1.5);
        aura.addColorStop(0, 'rgba(251, 146, 60, 0.6)');
        aura.addColorStop(0.4, 'rgba(234, 88, 12, 0.2)');
        aura.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = aura;
        ctx.fillRect(-w * 2, -w * 2, w * 4, w * 4);
      }

      const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
      bodyGrad.addColorStop(0, '#fdba74');
      bodyGrad.addColorStop(0.5, '#ea580c');
      bodyGrad.addColorStop(1, '#9a3412');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.abs(i) * w * 0.16 + 5, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-w * 0.3, -h / 2 - 6, w * 0.6, 12);
      ctx.fillRect(-w * 0.3, h / 2 - 6, w * 0.6, 12);

      ctx.fillStyle = '#7f1d1d';
      ctx.font = `${Math.round(w * 0.3)}px "Shojumaru", cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(253, 186, 116, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText('PLAY', 0, h * 0.02);
      ctx.shadowBlur = 0;
    };

    let raf;
    const frame = () => {
      const s = stateRef.current;
      s.time++;
      const time = s.time;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // 1. Live rain backdrop (same painter the run opens on).
      backdrop.render(ctx, w, h);

      // 2. The monk — idle on the ground until the lamp is sliced, then sprinting.
      const targetX = s.started ? w * 1.15 : w * 0.34;
      if (s.charX === null) s.charX = targetX;
      else s.charX += (targetX - s.charX) * (s.started ? 0.06 : 0.1);

      drawCharacter(ctx, {
        id: charId,
        x: s.charX,
        y: groundY,
        scale: Math.min(w, h) * 0.006,
        pose: s.started ? 'running' : 'idle',
        time,
      });

      // 3. Floating PLAY lantern (only while waiting to begin).
      const lamp = s.lamp;
      if (lamp.sliced) {
        lamp.vy += 0.4;
        lamp.rot += lamp.vRot;
        lamp.y += lamp.vy;
      } else {
        lamp.rot = Math.sin(time * 0.02) * 0.05;
      }

      if (lamp.y < h + lamp.h) {
        ctx.save();
        ctx.translate(lamp.x, lamp.y);
        ctx.rotate(lamp.rot);

        if (!lamp.sliced) {
          ctx.strokeStyle = '#1c1917';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, -lamp.h / 2);
          ctx.lineTo(0, -lamp.y * 1.5);
          ctx.stroke();
        }

        if (lamp.sliced) {
          ctx.save();
          ctx.translate(0, -10);
          ctx.beginPath();
          ctx.rect(-lamp.w * 2, -lamp.h * 2, lamp.w * 4, lamp.h * 2);
          ctx.clip();
          drawLampBody(true);
          ctx.restore();

          ctx.save();
          ctx.translate(0, 10);
          ctx.beginPath();
          ctx.rect(-lamp.w * 2, 0, lamp.w * 4, lamp.h * 2);
          ctx.clip();
          drawLampBody(true);
          ctx.restore();
        } else {
          drawLampBody(false);
        }
        ctx.restore();

        // Pulsing hint beneath the lantern.
        if (!lamp.sliced) {
          ctx.save();
          ctx.globalAlpha = 0.55 + Math.sin(time * 0.06) * 0.35;
          ctx.fillStyle = '#fcd34d';
          ctx.font = `${Math.round(lamp.w * 0.13)}px "Shojumaru", cursive`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('SLICE TO BEGIN', lamp.x, lamp.y + lamp.h * 0.72);
          ctx.restore();
        }
      }

      // 4. Fireflies from the cut lantern.
      for (let i = s.fireflies.length - 1; i >= 0; i--) {
        const f = s.fireflies[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.1;
        f.vx += (Math.random() - 0.5) * 2;
        f.life -= f.decay;
        if (f.life <= 0) {
          s.fireflies.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(253, 224, 71, ${f.life})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(250, 204, 21, ${f.life * 0.3})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Sword slash trail.
      if (s.isSlashing && s.slashTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.slashTrail[0].x, s.slashTrail[0].y);
        for (let i = 1; i < s.slashTrail.length; i++) {
          ctx.lineTo(s.slashTrail[i].x, s.slashTrail[i].y);
        }
        ctx.strokeStyle = accent;
        ctx.lineWidth = 7;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const toLogical = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const hitsLamp = (p) => {
    const { x, y, w, h, sliced } = stateRef.current.lamp;
    if (sliced) return false;
    return Math.abs(p.x - x) < w / 2 && Math.abs(p.y - y) < h / 2;
  };

  const handlePointerDown = (e) => {
    const s = stateRef.current;
    const p = toLogical(e);
    s.isSlashing = true;
    s.slashTrail = [p];
    if (hitsLamp(p)) triggerStart(1); // tap to begin
  };

  const handlePointerMove = (e) => {
    const s = stateRef.current;
    if (!s.isSlashing) return;
    const p = toLogical(e);
    const trail = s.slashTrail;
    trail.push(p);
    if (trail.length > 8) trail.shift();

    const prev = trail[trail.length - 2];
    if (prev && (hitsLamp(prev) || hitsLamp(p))) {
      triggerStart((p.x - prev.x) > 0 ? 1 : -1);
    }
  };

  const handlePointerUp = () => {
    stateRef.current.isSlashing = false;
    stateRef.current.slashTrail = [];
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="absolute inset-0 w-full h-full block cursor-crosshair touch-none"
    />
  );
}
