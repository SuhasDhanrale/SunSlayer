import { useEffect, useRef } from 'react';
import { PALETTE, GROUND_HEIGHT, BASE_SPEED, MONK_TARGET_X, getSpeedFactor } from '../../config/constants.js';

export const CaveBiomeMock = () => {
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
    let speed = BASE_SPEED;
    let distance = 0;
    let elapsedSec = 0;
    let isGameOver = false;
    let stumbleTimer = 0;
    
    const monk = {
      x: MONK_TARGET_X,
      y: 0,
      runCycle: 0
    };

    let boulders = [];
    let tnts = [];
    let explosions = [];
    
    // New Obstacles
    let yokais = [];
    let stalactites = [];
    let bridges = [];
    let spiders = [];
    
    // Floor/Ceiling in world coordinates
    let floorPoints = [];
    let ceilingPoints = [];
    
    const triggerStumble = () => {
       if (stumbleTimer === 0 && !isGameOver) {
          stumbleTimer = 60; // 1 second
          // Spawn spider punisher chasing from behind
          spiders.push({
             worldX: distance + monk.x - 500, // spawn way offscreen left
             y: monk.y,
             vx: BASE_SPEED * 1.8, // catches up fast
             isCut: false,
             legTimer: 0
          });
       }
    };

    const generateSegment = (worldX, h) => {
       const baseX = worldX;
       const floorBaseY = h - GROUND_HEIGHT;
       
       let isGap = false;
       if (worldX > 2000 && Math.random() < 0.08) {
          const lastFloor = floorPoints[floorPoints.length - 1];
          if (lastFloor && !lastFloor.isGap) {
             isGap = true;
          }
       }

       if (isGap) {
          floorPoints.push({ x: baseX, y: h + 150, isGap: true });
          const prevPoint = floorPoints[floorPoints.length - 2];
          const startY = prevPoint ? prevPoint.y : floorBaseY;
          bridges.push({
             pivotX: baseX,
             pivotY: startY,
             width: 160, 
             angle: -Math.PI / 4, 
             angularVelocity: 0,
             isCut: false
          });
       } else {
          const undulation = Math.sin(baseX * 0.003) * 25 + Math.sin(baseX * 0.015) * 10;
          floorPoints.push({
             x: baseX,
             y: floorBaseY + undulation,
             isGap: false
          });

          // Spawn random obstacles
          if (worldX > 1500 && Math.random() < 0.05) {
             const rand = Math.random();
             if (rand < 0.3) {
                // Yokai pops from below
                yokais.push({ 
                   worldX: baseX, 
                   y: floorBaseY + undulation + 60, // hidden below ground
                   targetY: floorBaseY + undulation - 20, 
                   radius: 25, 
                   isCut: false,
                   state: 'hidden',
                   vy: 0
                });
             } else if (rand < 0.6) {
                // Stalactite Batch
                const batchSize = [3, 6, 12][Math.floor(Math.random() * 3)];
                for (let i = 0; i < batchSize; i++) {
                   stalactites.push({ 
                      worldX: baseX + i * 45, 
                      y: Math.random() * 20 + 10, // ceiling
                      vy: 0, 
                      isFalling: false, 
                      isCut: false,
                      size: 25 + Math.random() * 15 // massive
                   });
                }
             } else {
                // Mini TNT Blockade
                for(let i=0; i<3; i++) {
                   boulders.push({
                      worldX: baseX + Math.random()*40,
                      y: floorBaseY + undulation - 10 - Math.random()*20,
                      radius: 20 + Math.random()*15,
                      color: '#374151', rotation: 0
                   });
                }
                tnts.push({worldX: baseX + 20, y: floorBaseY + undulation - 15, size: 30, isCut: false});
             }
          }
       }

       ceilingPoints.push({
          x: baseX,
          y: Math.random() * 80 + 20
       });
    };

    const initW = canvas.width || 800;
    const initH = canvas.height || 600;
    for (let i = 0; i < initW + 200; i += 50) {
       generateSegment(i, initH);
    }

    const generateEntryWall = (w, h) => {
      const startX = 1000;
      for (let x = startX; x < startX + 400; x += 45) {
        for (let y = h - GROUND_HEIGHT + 30; y > h * 0.1; y -= 45) {
          if (Math.random() < 0.8) {
            boulders.push({
              worldX: x + Math.random() * 20 - 10,
              y: y + Math.random() * 20 - 10,
              radius: 25 + Math.random() * 20,
              color: ['#374151', '#1f2937', '#111827'][Math.floor(Math.random()*3)],
              rotation: Math.random() * Math.PI * 2
            });
          }
        }
      }
      tnts.push({worldX: startX + 50, y: h - GROUND_HEIGHT - 20, size: 40, isCut: false});
      tnts.push({worldX: startX + 150, y: h * 0.4, size: 40, isCut: false});
      tnts.push({worldX: startX + 100, y: h * 0.25, size: 40, isCut: false});
      tnts.push({worldX: startX + 250, y: h - GROUND_HEIGHT + 10, size: 40, isCut: false});
    };
    generateEntryWall(initW, initH);

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

    const onEnd = () => { pointer.active = false; };

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    let lastTs = 0;

    const frame = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      time++;
      const w = canvas.width;
      const h = canvas.height;
      
      if (!isGameOver) {
         elapsedSec += dt;
         speed = BASE_SPEED * getSpeedFactor(elapsedSec); 
         
         if (stumbleTimer > 0) {
            stumbleTimer--;
            speed *= 0.4; // drastic slow down
         }
         
         distance += speed;
         monk.runCycle += speed * 0.04;
      } else {
         speed = 0;
      }

      // Generate / Cleanup geometry
      const lastFloorX = floorPoints[floorPoints.length - 1].x;
      if (lastFloorX < distance + w + 100) generateSegment(lastFloorX + 50, h);
      if (floorPoints.length > 0 && floorPoints[0].x < distance - 100) {
         floorPoints.shift();
         ceilingPoints.shift();
      }

      // Interpolate Monk Y based on floor
      const monkWorldX = distance + monk.x;
      let floorY = h - GROUND_HEIGHT;
      for (let i = 0; i < floorPoints.length - 1; i++) {
         if (floorPoints[i].x <= monkWorldX && floorPoints[i+1].x >= monkWorldX) {
            if (floorPoints[i+1].isGap && !floorPoints[i].isGap) {
               // Cliff edge: keep floor flat at current point's Y until we cross the edge
               floorY = floorPoints[i].y;
            } else if (floorPoints[i].isGap && !floorPoints[i+1].isGap) {
               // Exit of gap: keep floor flat at next point's Y
               floorY = floorPoints[i+1].y;
            } else {
               const t = (monkWorldX - floorPoints[i].x) / (floorPoints[i+1].x - floorPoints[i].x);
               floorY = floorPoints[i].y + t * (floorPoints[i+1].y - floorPoints[i].y);
            }
            break;
         }
      }
      
      let onBridge = false;
      bridges.forEach(br => {
         if (br.angle >= 0 && monkWorldX >= br.pivotX && monkWorldX <= br.pivotX + br.width) {
            floorY = br.pivotY;
            onBridge = true;
         }
      });

      monk.y = floorY - 10;
      if (monk.y > h - 30) isGameOver = true;

      // Explosions logic
      explosions.forEach(exp => {
        exp.radius += 18; 
        if (exp.radius > exp.maxRadius) exp.dead = true;
        boulders = boulders.filter(b => Math.hypot(b.worldX - exp.worldX, b.y - exp.y) > exp.radius + b.radius - 10);
        tnts.forEach(t => {
          if (!t.isCut && Math.hypot(t.worldX - exp.worldX, t.y - exp.y) < exp.radius + t.size) {
            t.isCut = true;
            explosions.push({ worldX: t.worldX, y: t.y, radius: 10, maxRadius: 280, dead: false });
          }
        });
      });
      explosions = explosions.filter(exp => !exp.dead);

      // Bridges
      bridges.forEach(br => {
         if (br.isCut && br.angle < 0) {
            br.angularVelocity += 0.008;
            br.angle += br.angularVelocity;
            if (br.angle >= 0) {
               br.angle = 0;
               br.angularVelocity = 0;
            }
         }
      });

      // Stalactites
      stalactites.forEach(s => {
         if (!s.isCut) {
            const screenX = s.worldX - distance;
            if (!s.isFalling && screenX < monk.x + 350) {
               s.isFalling = true;
            }
            if (s.isFalling) {
               s.vy += 0.5;
               s.y += s.vy;
            }
            if (Math.abs(screenX - monk.x) < s.size && s.y > monk.y - 30 && s.y < monk.y + 10) {
               triggerStumble();
            }
         } else {
            s.vy += 0.5;
            s.y += s.vy;
            s.worldX += speed; 
         }
      });

      // Yokais (Popping)
      yokais.forEach(y => {
         if (!y.isCut) {
            const screenX = y.worldX - distance;
            
            if (y.state === 'hidden' && screenX < w) {
               y.state = 'popping';
               y.vy = -14 - Math.random() * 4; // pop up high
               y.y += y.vy; // un-hide slightly immediately
            }
            if (y.state === 'popping') {
               y.vy += 0.6; // gravity
               y.y += y.vy;
               y.worldX -= speed * 0.8; // jump forward at player
               if (y.y > y.targetY && y.vy > 0) {
                  y.y = y.targetY;
                  y.vy = 0;
                  y.state = 'landed';
               }
            }
            
            if (Math.abs(screenX - monk.x) < 30 && Math.abs(y.y - monk.y) < 40) {
               triggerStumble();
            }
         } else {
            y.y += 10;
         }
      });

      // Spiders
      spiders.forEach(sp => {
         if (!sp.isCut) {
            sp.worldX += sp.vx; // spider moves fast
            sp.legTimer += 0.2;
            const screenX = sp.worldX - distance;
            // update spider y to stick to floor smoothly
            sp.y += (monk.y - sp.y) * 0.1;
            
            if (Math.abs(screenX - monk.x) < 30) {
               isGameOver = true; // Spider catches monk = death
            }
         } else {
            sp.y += 10;
         }
      });

      // Boulders collision
      if (!isGameOver) {
         boulders.forEach(b => {
            const screenX = b.worldX - distance;
            if (screenX > monk.x - b.radius && screenX < monk.x + 10) {
               if (b.y > monk.y - 40 && b.y < monk.y + 20) {
                  triggerStumble(); 
               }
            }
         });
      }

      // Cleanup
      boulders = boulders.filter(b => b.worldX > distance - 100);
      tnts = tnts.filter(t => t.worldX > distance - 100);
      bridges = bridges.filter(br => br.pivotX > distance - 200);
      stalactites = stalactites.filter(s => s.worldX > distance - 100 && s.y < h + 100);
      yokais = yokais.filter(y => y.worldX > distance - 100 && y.y < h + 100);
      spiders = spiders.filter(sp => sp.worldX > distance - 100 && sp.y < h + 100);

      // Slashing
      if (!pointer.active && trail.length > 0) trail.shift();
      if (trail.length >= 2 && !isGameOver) {
        const p1 = trail[trail.length - 2];
        const p2 = trail[trail.length - 1];
        
        tnts.forEach(t => {
          if (!t.isCut) {
            const screenX = t.worldX - distance;
            const dist = Math.min(Math.hypot(p1.x - screenX, p1.y - t.y), Math.hypot(p2.x - screenX, p2.y - t.y));
            if (dist < t.size + 20) {
              t.isCut = true;
              explosions.push({ worldX: t.worldX, y: t.y, radius: 10, maxRadius: 280, dead: false });
            }
          }
        });

        yokais.forEach(y => {
           if (!y.isCut) {
              const screenX = y.worldX - distance;
              const dist = Math.min(Math.hypot(p1.x - screenX, p1.y - y.y), Math.hypot(p2.x - screenX, p2.y - y.y));
              if (dist < y.radius + 30) y.isCut = true;
           }
        });
        
        stalactites.forEach(s => {
           if (!s.isCut) {
              const screenX = s.worldX - distance;
              // Check hit against the massive spike area
              const hitCenterY = s.y + s.size;
              const dist = Math.min(Math.hypot(p1.x - screenX, p1.y - hitCenterY), Math.hypot(p2.x - screenX, p2.y - hitCenterY));
              if (dist < s.size * 2) {
                 s.isCut = true;
                 s.vy = -5; // bounce up slightly
              }
           }
        });
                bridges.forEach(br => {
            if (!br.isCut) {
               const tipWorldX = br.pivotX + br.width * Math.cos(br.angle);
               const tipY = br.pivotY + br.width * Math.sin(br.angle);
               const screenCutX = tipWorldX - distance;
               const screenCutY = tipY - 60;
               
               const dist = Math.min(
                  Math.hypot(p1.x - screenCutX, p1.y - screenCutY),
                  Math.hypot(p2.x - screenCutX, p2.y - screenCutY)
               );
               if (dist < 40) br.isCut = true;
            }
         });

        spiders.forEach(sp => {
           if (!sp.isCut) {
              const screenX = sp.worldX - distance;
              const dist = Math.min(Math.hypot(p1.x - screenX, p1.y - sp.y), Math.hypot(p2.x - screenX, p2.y - sp.y));
              if (dist < 40) sp.isCut = true;
           }
        });
      }

      // RENDER
      ctx.fillStyle = '#030712'; 
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      for(let i=0; i<w; i+=100) ctx.rect((i - distance*0.2) % (w+100), h*0.2, 80, h*0.6);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, h - GROUND_HEIGHT + 20, w, h);

      ctx.fillStyle = '#1f2937'; 
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ceilingPoints.forEach(p => ctx.lineTo(p.x - distance, p.y));
      ctx.lineTo(w, 0);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, h);
      let drawingFloor = true;
      let prevFloorY = h - GROUND_HEIGHT;
      floorPoints.forEach(p => {
         if (p.isGap && drawingFloor) {
            ctx.lineTo(p.x - distance, prevFloorY); 
            ctx.lineTo(p.x - distance, h); 
            drawingFloor = false;
         } else if (!p.isGap && !drawingFloor) {
            ctx.lineTo(p.x - distance, h); 
            ctx.lineTo(p.x - distance, p.y);
            drawingFloor = true;
         } else if (!p.isGap) {
            ctx.lineTo(p.x - distance, p.y);
         }
         prevFloorY = p.y;
      });
      ctx.lineTo(w, h);
      ctx.fill();

      // Bridges
      bridges.forEach(br => {
         const screenPivotX = br.pivotX - distance;
         const screenPivotY = br.pivotY;
         
         const tipX = screenPivotX + br.width * Math.cos(br.angle);
         const tipY = screenPivotY + br.width * Math.sin(br.angle);
         
         ctx.save();
         if (!br.isCut) {
            // Draw a single rope from the tip of the bridge up to the ceiling
            const ceilingY = 60;
            ctx.strokeStyle = '#d4d4d8'; 
            ctx.lineWidth = 3;
            ctx.beginPath(); 
            ctx.moveTo(tipX, tipY); 
            ctx.lineTo(tipX, ceilingY); 
            ctx.stroke();
            
            // Draw a red cut target on the rope, 60px above the tip
            const cutX = tipX;
            const cutY = tipY - 60;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); 
            ctx.arc(cutX, cutY, 15, 0, Math.PI*2); 
            ctx.fill();
            
            // Premium shine on the target
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath(); 
            ctx.arc(cutX - 4, cutY - 4, 5, 0, Math.PI*2); 
            ctx.fill();
         }
         
         // Draw the bridge board pivoting from the floor
         ctx.translate(screenPivotX, screenPivotY);
         ctx.rotate(br.angle);
         
         // Board starts at 0 and goes to width
         ctx.fillStyle = '#78350f'; 
         ctx.fillRect(0, 0, br.width, 15);
         ctx.strokeStyle = '#451a03';
         ctx.lineWidth = 2;
         ctx.strokeRect(0, 0, br.width, 15);
         
         // Wooden planks details
         ctx.fillStyle = '#92400e';
         for (let offset = 20; offset < br.width; offset += 30) {
            ctx.fillRect(offset, 0, 4, 15);
         }
         ctx.restore();
      });

      // Boulders
      boulders.forEach(b => {
        ctx.save();
        ctx.translate(b.worldX - distance, b.y);
        ctx.rotate(b.rotation);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        for(let i=0; i<6; i++) {
           const angle = i * Math.PI / 3;
           const r = b.radius * (0.8 + Math.sin(i*123)*0.2);
           if(i===0) ctx.moveTo(Math.cos(angle)*r, Math.sin(angle)*r);
           else ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });

      // TNTs
      tnts.forEach(t => {
        if (!t.isCut) {
          ctx.save();
          ctx.translate(t.worldX - distance, t.y);
          ctx.fillStyle = '#b91c1c'; 
          ctx.fillRect(-t.size/2, -t.size/2, t.size, t.size);
          ctx.fillStyle = '#7f1d1d'; 
          ctx.fillRect(-t.size/2, -t.size/4, t.size, 8);
          ctx.fillRect(-t.size/2, t.size/4 - 8, t.size, 8);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('TNT', 0, 0);
          ctx.restore();
        }
      });

      // Spiders
      spiders.forEach(sp => {
         if (!sp.isCut) {
            const screenX = sp.worldX - distance;
            ctx.save();
            ctx.translate(screenX, sp.y);
            // Black fuzzy body
            ctx.fillStyle = '#0a0a0a';
            ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
            // Red eyes
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(5, -5, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI*2); ctx.fill();
            // Scuttling legs
            ctx.strokeStyle = '#0a0a0a';
            ctx.lineWidth = 4;
            for(let i=0; i<8; i++) {
               const offset = i < 4 ? -1 : 1;
               const angle = Math.sin(sp.legTimer + i) * 0.5;
               ctx.beginPath();
               ctx.moveTo(offset * 15, 0);
               ctx.quadraticCurveTo(offset * 30, -20 + angle * 20, offset * 40, 15 + angle * 10);
               ctx.stroke();
            }
            ctx.restore();
         }
      });

      // Yokais
      yokais.forEach(y => {
         const screenX = y.worldX - distance;
         ctx.fillStyle = '#991b1b'; 
         ctx.beginPath(); ctx.arc(screenX, y.y, y.radius, 0, Math.PI*2); ctx.fill();
         ctx.fillStyle = '#fca5a5';
         ctx.beginPath(); ctx.moveTo(screenX - 10, y.y - y.radius + 5); ctx.lineTo(screenX - 15, y.y - y.radius - 15); ctx.lineTo(screenX - 5, y.y - y.radius + 5); ctx.fill();
         ctx.beginPath(); ctx.moveTo(screenX + 10, y.y - y.radius + 5); ctx.lineTo(screenX + 15, y.y - y.radius - 15); ctx.lineTo(screenX + 5, y.y - y.radius + 5); ctx.fill();
      });

      // Stalactites
      stalactites.forEach(s => {
         const screenX = s.worldX - distance;
         ctx.fillStyle = '#4b5563'; 
         ctx.beginPath();
         // Triangle pointing down using new size
         ctx.moveTo(screenX - s.size, s.y);
         ctx.lineTo(screenX + s.size, s.y);
         ctx.lineTo(screenX, s.y + s.size * 2.5);
         ctx.fill();
      });

      // Explosions
      explosions.forEach(exp => {
        const alpha = Math.max(0, 1 - exp.radius / exp.maxRadius);
        ctx.save();
        ctx.translate(exp.worldX - distance, exp.y);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fbbf24'; 
        ctx.beginPath(); ctx.arc(0, 0, exp.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ea580c'; 
        ctx.beginPath(); ctx.arc(0, 0, exp.radius * 0.7, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffffff'; 
        ctx.beginPath(); ctx.arc(0, 0, exp.radius * 0.3, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // Monk
      ctx.save();
      const mx = monk.x;
      const my = monk.y;
      
      ctx.translate(mx, my);
      ctx.scale(1.2, 1.2);

      ctx.fillStyle = PALETTE.ink;
      
      if (!isGameOver) {
         // Stumble tint & shake
         if (stumbleTimer > 0) {
            ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
            ctx.fillStyle = '#ef4444'; // turn red while stumbling
         }

         const bob = Math.sin(monk.runCycle * 2) * 4;
         ctx.beginPath(); 
         ctx.moveTo(-10, bob); ctx.lineTo(15, bob); ctx.lineTo(20, -25 + bob); ctx.lineTo(-5, -25 + bob); ctx.fill();
         ctx.beginPath(); ctx.arc(10, -35 + bob, 12, 0, Math.PI*2); ctx.fill();
         const scarfWave = Math.sin(monk.runCycle * 1.5) * 15;
         ctx.beginPath(); ctx.moveTo(0, -30 + bob); ctx.quadraticCurveTo(-30, -20 + scarfWave, -60, -30 - scarfWave);
         ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.emerald; ctx.stroke();

         ctx.lineWidth = 4; ctx.strokeStyle = (stumbleTimer > 0) ? '#ef4444' : PALETTE.ink;
         const leg1Angle = Math.sin(monk.runCycle) * 0.8;
         const leg2Angle = Math.sin(monk.runCycle + Math.PI) * 0.8;
         ctx.beginPath(); ctx.moveTo(0, bob); ctx.lineTo(Math.sin(leg2Angle)*15, 15 + Math.cos(leg2Angle)*15); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(5, bob); ctx.lineTo(5 + Math.sin(leg1Angle)*15, 15 + Math.cos(leg1Angle)*15); ctx.stroke();
      } else {
         ctx.beginPath(); ctx.arc(0, -10, 12, 0, Math.PI*2); ctx.fill();
         ctx.fillRect(-20, 0, 30, 15);
      }

      ctx.restore();

      // Slash Trail
      if (trail.length > 1) {
        ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = '#fbbf24'; 
        ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
      }

      // HUD
      ctx.fillStyle = 'white'; ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`SPEED: ${speed.toFixed(1)}x`, 20, 40);
      
      if (isGameOver) {
         ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
         ctx.fillRect(0, 0, w, h);
         ctx.fillStyle = '#fbbf24';
         ctx.textAlign = 'center';
         ctx.fillText(`CRASHED!`, w/2, h/2);
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
        <h3 className="font-bold mb-1 text-[#fbbf24]">🪨 Cave Biome Mock</h3>
        <ul className="list-disc pl-4 text-xs space-y-1 opacity-80">
          <li>Endless scrolling (Official Speed Curve)</li>
          <li>Massive Stalactite batches (slice on ceiling!)</li>
          <li>Jumping/Popping Yokais</li>
          <li>Stumble spawns the Spider Punisher!</li>
        </ul>
      </div>
    </div>
  );
};
