import { useEffect, useRef, useState } from 'react';
import { PALETTE } from '../../config/constants.js';

export const WaterBiomeMock = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 400) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 700) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf;
    let time = 0;
    
    // Game State
    let speed = 4;
    let distance = 0;
    
    const monk = {
      x: canvas.width * 0.25,
      baseY: canvas.height * 0.4,
      y: canvas.height * 0.4,
      bobTimer: 0,
      runCycle: 0
    };

    let vines = [];
    let coins = [];
    let nets = [];
    let barrels = [];
    let rafts = [];
    let carps = [];
    let stumble = { active: false, timer: 0 };
    
    let bubbles = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 2,
      speedY: Math.random() * 1.5 + 0.5,
      wobbleOffset: Math.random() * Math.PI * 2
    }));

    // Slash mechanics
    let pointer = { x: 0, y: 0, active: false };
    let trail = [];
    const MAX_TRAIL = 12;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      return { 
        x: (cx - rect.left) * (canvas.width / rect.width), 
        y: (cy - rect.top) * (canvas.height / rect.height) 
      };
    };

    const onStart = (e) => {
      const p = getPos(e);
      pointer = { x: p.x, y: p.y, active: true };
      trail = [{ x: p.x, y: p.y }];
    };

    const onMove = (e) => {
      if (!pointer.active) return;
      const p = getPos(e);
      pointer.x = p.x;
      pointer.y = p.y;
      trail.push({ x: p.x, y: p.y });
      if (trail.length > MAX_TRAIL) trail.shift();
      if (e.touches) e.preventDefault();
    };

    const onEnd = () => {
      pointer.active = false;
    };

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    // Line intersection helper for slashing
    const doLinesIntersect = (p1, p2, p3, p4) => {
      const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
      return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    };

    let lastSpawnDist = 0;

    const frame = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      
      // Speed ramping mechanic
      speed = 4 + (time / 600); // Speed gradually increases
      
      // Stumble logic
      if (stumble.active) {
        stumble.timer--;
        if (stumble.timer <= 0) stumble.active = false;
        speed *= 0.4; // slowdown during stumble
      }

      distance += speed;

      // Update Monk (Swimming auto-bob)
      monk.bobTimer += 0.05;
      monk.runCycle += 0.1;
      monk.y = monk.baseY + Math.sin(monk.bobTimer) * (h * 0.03); // gentle bob at surface
      
      // Spawning logic
      if (distance - lastSpawnDist > 250) {
        lastSpawnDist = distance;
        
        const rand = Math.random();
        if (rand < 0.2) {
          // Spawn Vine from below
          vines.push({
            x: w + 50,
            width: 35,
            targetHeight: h * 0.4 + Math.random() * (h * 0.3),
            currentHeight: 0,
            isCut: false,
            cutHeight: 0
          });
        } else if (rand < 0.4) {
          // Spawn Net (submerged in water)
          nets.push({
            x: w + 100,
            y: h * 0.4 + 50, 
            width: 120,
            height: 80,
            isCut: false,
            cutPieces: []
          });
        } else if (rand < 0.6) {
          // Spawn Underwater Spiked Barrel
          barrels.push({
            x: w + 50,
            y: h * 0.9, // tethered deep underwater
            radius: 30,
            isCut: false,
            rising: false,
            vy: 0,
            explosionTimer: 0
          });
        } else if (rand < 0.8) {
          // Spawn Raft with 3 Yokais
          rafts.push({
            x: w + 100,
            y: h * 0.4,
            width: 160,
            isCut: false,
            yokais: [
              { id: 1, xOff: -50, y: h * 0.4 - 20, vy: 0, jumped: false, cut: false, cutOffset: 0 },
              { id: 2, xOff: 0, y: h * 0.4 - 20, vy: 0, jumped: false, cut: false, cutOffset: 0 },
              { id: 3, xOff: 50, y: h * 0.4 - 20, vy: 0, jumped: false, cut: false, cutOffset: 0 }
            ]
          });
        } else {
          // Spawn Coin
          coins.push({
            x: w + 50,
            y: h * 0.2 + Math.random() * (h * 0.6),
            radius: 20,
            isCollected: false,
            collectTimer: 0
          });
        }
      }

      // Helper to trigger punisher
      const triggerStumble = () => {
        if (!stumble.active) {
          stumble = { active: true, timer: 90 };
          // Spawn Demon Carp punisher slightly behind and deep
          carps.push({
            x: w + 100,
            y: h * 0.8,
            isCut: false,
            cutOffset: 0
          });
        }
      };

      // Update entities
      vines.forEach(v => {
        v.x -= speed;
        if (!v.isCut && v.currentHeight < v.targetHeight) {
          v.currentHeight += 4;
        }
      });
      
      coins.forEach(c => {
        c.x -= speed;
        if (c.isCollected) {
          c.collectTimer += 0.1;
          c.y -= 3;
        }
      });

      nets.forEach(n => {
        n.x -= speed;
        if (!n.isCut) {
          if (Math.abs(n.x - monk.x) < speed && Math.abs(n.y - monk.y) < 70) {
            triggerStumble();
          }
        } else {
          n.cutPieces.forEach(p => { p.y += 2; p.x -= speed; });
        }
      });

      barrels.forEach(b => {
        b.x -= speed;
        if (!b.isCut) {
          // Release barrel from river bottom when player is near
          if (!b.rising && b.x - monk.x < 250) {
            b.rising = true;
          }
          if (b.rising) {
            b.vy -= 0.8; // Accelerates upward rapidly
            b.y += b.vy;
            // Cap rising at the water surface (bounce slightly)
            if (b.y < h * 0.4 - 10) b.y = h * 0.4 - 10;
          }

          if (Math.abs(b.x - monk.x) < speed * 2 && Math.abs(b.y - monk.y) < 50) {
            triggerStumble();
          }
        } else {
          b.explosionTimer++;
        }
      });

      rafts.forEach(r => {
        r.x -= speed;
        
        r.yokais.forEach(yk => {
          const worldX = r.x + yk.xOff;
          
          if (!yk.jumped && worldX - monk.x < 200 && worldX - monk.x > 0) {
             yk.jumped = true;
             yk.vy = -12 - Math.random() * 4; // Jump up
          }
          
          if (yk.jumped && !yk.cut) {
             yk.vy += 0.4; // gravity
             yk.y += yk.vy;
             yk.xOff -= speed * 1.5; // jump forward relative to raft
             
             if (yk.y > monk.y - 30 && yk.y < monk.y + 30) {
                if (Math.abs((r.x + yk.xOff) - monk.x) < speed * 2) {
                  triggerStumble();
                }
             }
          } else if (yk.cut) {
             yk.cutOffset += 3;
             yk.y += 5;
          }
        });
      });

      carps.forEach(cp => {
        cp.x -= speed * 1.8; // swims very fast
        if (!cp.isCut) {
          // homes in on monk y
          cp.y += (monk.y - cp.y) * 0.05;
          if (Math.abs(cp.x - monk.x) < speed * 2) {
             // Hit by punisher!
             stumble = { active: true, timer: 30 }; // mini stun
          }
        } else {
          cp.cutOffset += 3;
          cp.y += 5;
        }
      });

      // Update background bubbles
      bubbles.forEach(b => {
        b.y -= b.speedY;
        b.x += Math.sin(b.wobbleOffset + time * 0.05) * 1.5;
        b.x -= speed * 0.2; // parallax
        if (b.y < -20 || b.x < -20) {
          b.y = h + 20;
          b.x = Math.random() * w + w * 0.2;
        }
      });

      // Cleanup
      vines = vines.filter(v => v.x > -100);
      coins = coins.filter(c => c.x > -100 && c.collectTimer < 1);
      nets = nets.filter(n => n.x > -100);
      barrels = barrels.filter(b => b.y < h + 100 && b.explosionTimer < 20);
      rafts = rafts.filter(r => r.x > -150);
      carps = carps.filter(cp => cp.x > -100);

      // Slashing logic
      if (!pointer.active && trail.length > 0) {
        trail.shift(); // fade trail
      }
      
      if (trail.length >= 2) {
        const p1 = trail[trail.length - 2];
        const p2 = trail[trail.length - 1];
        
        // 1. Check vine slashes
        vines.forEach(v => {
          if (!v.isCut) {
            const topY = h - v.currentHeight;
            const bottomY = h;
            if (doLinesIntersect(p1, p2, {x: v.x, y: topY}, {x: v.x, y: bottomY})) {
              v.isCut = true;
              v.cutHeight = v.currentHeight - (h - (p1.y + p2.y)/2);
              if (v.cutHeight < 0) v.cutHeight = 0;
            }
          }
        });
        
        // 2. Check coin slashes (collection)
        coins.forEach(c => {
          if (!c.isCollected) {
            const dist = Math.min(Math.hypot(p1.x - c.x, p1.y - c.y), Math.hypot(p2.x - c.x, p2.y - c.y));
            if (dist < c.radius + 15) c.isCollected = true;
          }
        });

        // 3. Check net slashes
        nets.forEach(n => {
          if (!n.isCut) {
            const dist = Math.min(Math.hypot(p1.x - n.x, p1.y - n.y), Math.hypot(p2.x - n.x, p2.y - n.y));
            if (dist < 60) {
              n.isCut = true;
              n.cutPieces = [
                {x: n.x - 30, y: n.y - 20}, {x: n.x + 30, y: n.y - 20},
                {x: n.x - 20, y: n.y + 30}, {x: n.x + 20, y: n.y + 30}
              ];
            }
          }
        });

        // 4. Check barrel slashes
        barrels.forEach(b => {
          if (!b.isCut) {
            const dist = Math.min(Math.hypot(p1.x - b.x, p1.y - b.y), Math.hypot(p2.x - b.x, p2.y - b.y));
            if (dist < b.radius + 20) b.isCut = true;
          }
        });

        // 5. Check raft & yokai slashes
        rafts.forEach(r => {
          if (!r.isCut) {
            const distRaft = Math.min(Math.hypot(p1.x - r.x, p1.y - r.y), Math.hypot(p2.x - r.x, p2.y - r.y));
            if (distRaft < r.width/2) r.isCut = true;
          }
          r.yokais.forEach(yk => {
            if (yk.jumped && !yk.cut) {
              const worldX = r.x + yk.xOff;
              const distYokai = Math.min(Math.hypot(p1.x - worldX, p1.y - yk.y), Math.hypot(p2.x - worldX, p2.y - yk.y));
              if (distYokai < 35) yk.cut = true;
            }
          });
        });

        // 6. Check carp slashes
        carps.forEach(cp => {
          if (!cp.isCut) {
            const dist = Math.min(Math.hypot(p1.x - cp.x, p1.y - cp.y), Math.hypot(p2.x - cp.x, p2.y - cp.y));
            if (dist < 40) cp.isCut = true;
          }
        });
      }

      // RENDER
      // 1. Sky and Water Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
      skyGrad.addColorStop(0, '#bae6fd'); 
      skyGrad.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.4);

      // Flash red if stumbling
      if (stumble.active) {
         ctx.fillStyle = `rgba(220, 38, 38, ${stumble.timer / 90 * 0.3})`;
         ctx.fillRect(0, 0, w, h);
      }

      // Water Surface Line
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, h * 0.4, w, 4);

      // Water Body
      const waterGrad = ctx.createLinearGradient(0, h * 0.4, 0, h);
      waterGrad.addColorStop(0, '#0284c7');
      waterGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, h * 0.4, w, h * 0.6);
      
      // Light rays (caustics effect in water)
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const rayX = (w * 0.2 * i) - (time * 0.5) % (w * 0.4) + w*0.2;
        ctx.moveTo(rayX, h * 0.4);
        ctx.lineTo(rayX + 150, h * 0.4);
        ctx.lineTo(rayX + 50 - i*20, h);
        ctx.lineTo(rayX - 50 - i*20, h);
        ctx.fill();
      }
      ctx.restore();

      // Bubbles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      bubbles.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vines
      vines.forEach(v => {
        const topY = h - (v.isCut ? v.cutHeight : v.currentHeight);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.rect(v.x - v.width/2, topY, v.width, h - topY);
        ctx.fill();
        ctx.fillStyle = '#166534';
        for(let i=0; i<3; i++) {
          ctx.fillRect(v.x - v.width/2 - 4, topY + 20 + i*40, 8, 8);
          ctx.fillRect(v.x + v.width/2 - 2, topY + 40 + i*40, 8, 8);
        }
      });

      // Nets
      nets.forEach(n => {
        if (!n.isCut) {
          ctx.strokeStyle = '#9ca3af'; // gray-400
          ctx.lineWidth = 3;
          ctx.beginPath();
          // Grid pattern
          for(let i=-n.width/2; i<=n.width/2; i+=15) {
             ctx.moveTo(n.x + i, n.y - n.height/2);
             ctx.lineTo(n.x + i, n.y + n.height/2);
          }
          for(let j=-n.height/2; j<=n.height/2; j+=15) {
             ctx.moveTo(n.x - n.width/2, n.y + j);
             ctx.lineTo(n.x + n.width/2, n.y + j);
          }
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 3;
          n.cutPieces.forEach(p => {
             ctx.beginPath(); ctx.moveTo(p.x-15, p.y-15); ctx.lineTo(p.x+15, p.y+15); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x-10, p.y+15); ctx.lineTo(p.x+20, p.y-10); ctx.stroke();
          });
        }
      });

      // Barrels
      barrels.forEach(b => {
        if (!b.isCut) {
          // Draw tether chain to the river bottom
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 2;
          ctx.beginPath(); 
          if (!b.rising) {
             ctx.moveTo(b.x, b.y + b.radius); ctx.lineTo(b.x, h); ctx.stroke();
          }

          ctx.fillStyle = '#451a03'; // dark brown wood
          ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
          // Spikes
          ctx.fillStyle = '#9ca3af';
          for(let i=0; i<8; i++) {
             const angle = i * Math.PI / 4 + time * 0.02;
             ctx.beginPath();
             ctx.moveTo(b.x + Math.cos(angle)*b.radius, b.y + Math.sin(angle)*b.radius);
             ctx.lineTo(b.x + Math.cos(angle+0.2)*b.radius, b.y + Math.sin(angle+0.2)*b.radius);
             ctx.lineTo(b.x + Math.cos(angle+0.1)*(b.radius+12), b.y + Math.sin(angle+0.1)*(b.radius+12));
             ctx.fill();
          }
        } else {
          // Explosion
          ctx.fillStyle = `rgba(220, 38, 38, ${1 - b.explosionTimer/20})`;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * (1 + b.explosionTimer/5), 0, Math.PI*2); ctx.fill();
        }
      });

      // Rafts & Yokai
      rafts.forEach(r => {
        if (!r.isCut) {
          ctx.fillStyle = '#d97706'; // bamboo/wood raft
          ctx.fillRect(r.x - r.width/2, r.y, r.width, 15);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(r.x - r.width/2 + 5, r.y-2, r.width-10, 6);
        } else {
          ctx.fillStyle = '#d97706';
          ctx.fillRect(r.x - r.width/2, r.y + 10, r.width/2 - 2, 15);
          ctx.fillRect(r.x + 2, r.y + 5, r.width/2 - 2, 15);
        }
        
        // Render Yokais
        r.yokais.forEach(yk => {
          const worldX = r.x + yk.xOff;
          ctx.save();
          ctx.translate(worldX, yk.y);
          if (yk.cut) {
            ctx.save(); ctx.translate(-yk.cutOffset, -yk.cutOffset);
            ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(0, 0, 20, Math.PI, 0); ctx.fill();
            ctx.restore();
            ctx.save(); ctx.translate(yk.cutOffset, yk.cutOffset);
            ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI); ctx.fill();
            ctx.restore();
          } else if (!r.isCut || yk.jumped) {
            // Full Yokai
            ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(-6, -5, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(6, -5, 4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'white';
            ctx.fillRect(-10, 5, 4, 6); ctx.fillRect(-2, 5, 4, 6); ctx.fillRect(6, 5, 4, 6);
          }
          ctx.restore();
        });
      });

      // Carps
      carps.forEach(cp => {
         ctx.save();
         ctx.translate(cp.x, cp.y);
         ctx.scale(1.3, 1.3); // Make carps larger
         if (cp.isCut) {
            ctx.save(); ctx.translate(-cp.cutOffset, -cp.cutOffset);
            ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 10, 0, Math.PI, 0); ctx.fill();
            ctx.restore();
            ctx.save(); ctx.translate(cp.cutOffset, cp.cutOffset);
            ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI); ctx.fill();
            ctx.restore();
         } else {
            ctx.fillStyle = '#0284c7'; // dark blue carp
            ctx.beginPath(); ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI*2); ctx.fill();
            // Tail
            ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(40, -15); ctx.lineTo(40, 15); ctx.fill();
            // Eye
            ctx.fillStyle = '#dc2626'; // red angry eye
            ctx.beginPath(); ctx.arc(-12, -4, 4, 0, Math.PI*2); ctx.fill();
         }
         ctx.restore();
      });

      // Coins
      coins.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);
        if (c.isCollected) {
          ctx.scale(1 + c.collectTimer, 1 + c.collectTimer);
          ctx.globalAlpha = 1 - c.collectTimer;
        }
        ctx.fillStyle = '#eab308';
        ctx.beginPath(); ctx.arc(0, 0, c.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(-4, -4, c.radius * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Monk
      ctx.save();
      const mx = monk.x;
      const my = monk.y;
      const inkColor = PALETTE.ink;

      ctx.translate(mx, my);
      ctx.scale(1.2, 1.2); // Scale up monk by 20%

      if (time % 8 === 0) {
        bubbles.push({
          x: mx - 30, y: my + 10, size: Math.random() * 3 + 1, speedY: Math.random() * 1 + 1, wobbleOffset: Math.random() * Math.PI
        });
      }

      ctx.fillStyle = inkColor;
      ctx.beginPath(); ctx.moveTo(-20, 5); ctx.lineTo(20, 5); ctx.lineTo(15, -25); ctx.lineTo(-15, -25); ctx.fill();
      
      const headOffset = Math.sin(monk.runCycle * 2) * 2;
      ctx.beginPath(); ctx.moveTo(-20, -30 + headOffset); ctx.lineTo(20, -30 + headOffset); ctx.lineTo(0, -40 + headOffset); ctx.fill();

      const scarfWave = Math.sin(monk.runCycle * 1.5) * 10;
      ctx.beginPath(); ctx.moveTo(-5, -28 + headOffset); ctx.quadraticCurveTo(-30, -20 + scarfWave, -50, -25 - scarfWave);
      ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.emerald; ctx.stroke();

      const legStride = Math.sin(monk.runCycle) * 12;
      ctx.lineWidth = 4; ctx.strokeStyle = inkColor;
      ctx.beginPath(); ctx.moveTo(-15, 5); ctx.lineTo(-35 + legStride, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, 5); ctx.lineTo(-35 - legStride, 15); ctx.stroke();
      
      ctx.restore();

      // Slash Trail
      if (trail.length > 1) {
        ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = '#0ea5e9'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
      }

      // HUD
      ctx.fillStyle = 'white'; ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`SPEED: ${speed.toFixed(1)}x`, 20, 40);
      if (stumble.active) {
         ctx.fillStyle = '#dc2626';
         ctx.fillText(`STUMBLE!`, 20, 70);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousedown', onStart);
      canvas.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="block h-full w-full touch-none cursor-crosshair" />
      <div className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded backdrop-blur text-sm max-w-xs">
        <h3 className="font-bold mb-1 text-[#0ea5e9]">🌊 Water Biome Mock</h3>
        <ul className="list-disc pl-4 text-xs space-y-1 opacity-80">
          <li>Auto-swimming locomotion</li>
          <li>Slice vines, submerged nets, and falling spiked barrels</li>
          <li>Yokai will jump from large rafts! Slice them mid-air.</li>
          <li>If you miss and stumble, a Demon Carp will attack!</li>
        </ul>
      </div>
    </div>
  );
};
