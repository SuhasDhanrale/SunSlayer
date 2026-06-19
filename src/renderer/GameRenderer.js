import { PALETTE, GROUND_HEIGHT, MONK_TARGET_X, BIOME_LENGTH, MAX_FOCUS } from '../config/constants.js';
import { drawCharacter } from './characters/index.js';
import { drawSlashTrail } from './slashes/index.js';
import { drawObstacle } from '../obstacles/index.js';

// Cosmetic monk figure sizing. The character renderer draws around a hip origin;
// FOOT_OFFSET is roughly how far below that origin the feet sit at scale 1, used
// to keep the feet planted on the same ground line as the old silhouette.
const MONK_SCALE = 1.35;
const MONK_FOOT_OFFSET = 16;

export const GameRenderer = {
  render(ctx, s, canvas, time, gameState, biomeName, biomeBackdrop = null) {
    // A gameplay-biome backdrop (cave/water playtest skin) replaces the default
    // paper/sun/scenery/ground environment entirely; entities still draw on top.
    const customBg = !!biomeBackdrop;
    let paperColor = PALETTE.paper;
    let sunColor = s.focus.active ? '#7f1d1d' : 'rgba(185, 28, 28, 0.85)';
    let inkColor = PALETTE.ink;
    let groundColor = PALETTE.ground;
    let distantInkColor = PALETTE.distantInk;

    if (biomeName === 'volcano') {
      paperColor = '#2b1b1a'; // Ashy dark red
      sunColor = s.focus.active ? '#fb923c' : 'rgba(234, 88, 12, 0.85)'; // Orange sun
      inkColor = '#fca5a5'; // Light ash for ink
      distantInkColor = '#7f1d1d';
      groundColor = '#1c0b0a';
    } else if (biomeName === 'rain') {
      paperColor = '#1e293b'; // Slate blue
      sunColor = s.focus.active ? '#94a3b8' : 'rgba(148, 163, 184, 0.4)'; // Pale sun
      inkColor = '#e2e8f0'; // Light slate for ink
      distantInkColor = '#334155';
      groundColor = '#0f172a';
    }

    if (customBg) {
      // Playtest biome environment (own sky/water + parallax + ceiling/floor).
      biomeBackdrop.render(ctx, canvas.width, canvas.height, s.distance);
    } else {
      ctx.fillStyle = paperColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(canvas.width * 0.75, canvas.height * 0.45, Math.min(canvas.width, canvas.height) * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = sunColor;
      ctx.fill();
    }

    // Boss Warning Lightning Effects
    if (s.boss.active && s.boss.phase === 'warning' && gameState === 'PLAYING') {
      if (s.boss.warningTimer % 15 < 3) {
          ctx.beginPath();
          let lx = canvas.width * (0.6 + Math.random() * 0.3);
          let ly = 0;
          ctx.moveTo(lx, ly);
          while (ly < canvas.height) {
              lx += (Math.random() - 0.5) * 100;
              ly += 50 + Math.random() * 50;
              ctx.lineTo(lx, ly);
          }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 4 + Math.random() * 6;
          ctx.stroke();
      }
    }

    // Single switch for the dark "focus" visual (dim + silhouette scenery).
    // Excludes the boss 'defeated' phase so the dark mode "goes" the instant the
    // boss dies — no lingering dim/silhouette during the Ronin's fly-away. Same
    // clean on-arrival / off-on-kill feel for both bosses.
    const inDarkMode = s.focus.active || (s.boss.active && s.boss.phase !== 'defeated');

    // Dim background for Iaijutsu or Boss.
    if (inDarkMode && gameState === 'PLAYING') {
      const darkenAlpha = s.boss.phase === 'warning' ? Math.min(0.8, (s.boss.warningTimer / 60)) : 0.8;
      ctx.fillStyle = `rgba(28, 25, 23, ${darkenAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    if (s.shake > 0) {
      // The state mutation for s.shake happens in the main engine loop now
      ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    }

    // Boss Phase Vignette and Text
    if (s.boss.active && s.boss.phase === 'active') {
      const grad = ctx.createRadialGradient(s.monk.x, s.monk.y - 20, 50, s.monk.x, s.monk.y - 20, canvas.width * 0.8);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(28, 25, 23, 0.9)'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = `rgba(185, 28, 28, ${0.6 + Math.sin(time*0.005)*0.3})`;
      ctx.font = 'italic 70px serif';
      ctx.textAlign = 'center';
      if (s.boss.type === 'archer') ctx.fillText("STRIKE TRUE", canvas.width / 2, canvas.height / 2 + 180);
      else if (s.boss.type === 'ronin') ctx.fillText("CLASH!", canvas.width / 2, canvas.height / 2 + 180);
    } else if (s.boss.active && s.boss.phase === 'warning') {
      ctx.fillStyle = `rgba(185, 28, 28, ${Math.sin(time*0.02) * 0.5 + 0.5})`;
      ctx.font = 'italic 50px serif';
      ctx.textAlign = 'center';
      if (s.boss.type === 'archer') ctx.fillText("KILLER INTENT", canvas.width / 2, canvas.height / 2 - 100);
      else if (s.boss.type === 'ronin') ctx.fillText("SHADOW RONIN", canvas.width / 2, canvas.height / 2 - 100);
    }

    // Scenery helper & drawing
    const drawSceneryElement = (m, color) => {
      ctx.fillStyle = color;
      const isFocus = inDarkMode;
      const glowFill = isFocus ? 'transparent' : (m.isDistant ? PALETTE.mutedGlow : PALETTE.warmGlow);

      if (m.type === 'mountain') {
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.quadraticCurveTo(m.x + m.width/2, m.y - m.height * 1.5, m.x + m.width, m.y); ctx.fill();
      } else if (m.type === 'house') {
        const hHeight = m.height * 0.6; ctx.fillRect(m.x + 20, m.y - hHeight, m.width - 40, hHeight); 
        if (!isFocus) {
          ctx.fillStyle = glowFill; const winW = (m.width - 80) / 2;
          if (winW > 0) {
             ctx.fillRect(m.x + 30, m.y - hHeight + 20, winW, hHeight - 40); ctx.fillRect(m.x + m.width - 30 - winW, m.y - hHeight + 20, winW, hHeight - 40);
             ctx.fillStyle = color;
             ctx.fillRect(m.x + 30 + winW/2 - 1, m.y - hHeight + 20, 2, hHeight - 40); ctx.fillRect(m.x + m.width - 30 - winW/2 - 1, m.y - hHeight + 20, 2, hHeight - 40);
             ctx.fillRect(m.x + 30, m.y - hHeight + 20 + (hHeight-40)/2, winW, 2); ctx.fillRect(m.x + m.width - 30 - winW, m.y - hHeight + 20 + (hHeight-40)/2, winW, 2);
          }
        }
        ctx.fillStyle = color; 
        ctx.beginPath(); ctx.moveTo(m.x - 30, m.y - hHeight + 20); ctx.quadraticCurveTo(m.x + 10, m.y - hHeight, m.x + m.width/2, m.y - m.height); 
        ctx.quadraticCurveTo(m.x + m.width - 10, m.y - hHeight, m.x + m.width + 30, m.y - hHeight + 20); ctx.lineTo(m.x + m.width - 10, m.y - hHeight); ctx.lineTo(m.x + 10, m.y - hHeight); ctx.fill();
      } else if (m.type === 'pagoda') {
        const tiers = 5; const tHeight = m.height / tiers; ctx.fillRect(m.x + m.width/2 - 6, m.y - m.height - 40, 12, m.height + 40); 
        for(let i=0; i<tiers; i++) {
          const tw = m.width * (1 - (i * 0.15)); const tx = m.x + (m.width - tw)/2; const ty = m.y - (i * tHeight);
          ctx.fillRect(tx + 15, ty - tHeight, tw - 30, tHeight); 
          if (!isFocus && i > 0) {
             ctx.fillStyle = glowFill; ctx.fillRect(tx + 25, ty - tHeight + 10, tw - 50, tHeight - 20);
             ctx.fillStyle = color; ctx.fillRect(tx + tw/2 - 2, ty - tHeight + 10, 4, tHeight - 20); 
          }
          ctx.beginPath(); ctx.moveTo(tx - 25, ty - tHeight + 15); ctx.quadraticCurveTo(tx + 5, ty - tHeight - 5, tx + tw/2, ty - tHeight - 25);
          ctx.quadraticCurveTo(tx + tw - 5, ty - tHeight - 5, tx + tw + 25, ty - tHeight + 15); ctx.lineTo(tx + tw - 5, ty - tHeight); ctx.lineTo(tx + 5, ty - tHeight); ctx.fill();
        }
      } else if (m.type === 'torii') {
        ctx.fillRect(m.x + 20, m.y - m.height, 16, m.height); ctx.fillRect(m.x + m.width - 36, m.y - m.height, 16, m.height); ctx.fillRect(m.x + 10, m.y - m.height + 30, m.width - 20, 12); 
        ctx.beginPath(); ctx.moveTo(m.x - 10, m.y - m.height + 10); ctx.quadraticCurveTo(m.x + m.width/2, m.y - m.height - 10, m.x + m.width + 10, m.y - m.height + 10);
        ctx.lineTo(m.x + m.width + 10, m.y - m.height + 25); ctx.quadraticCurveTo(m.x + m.width/2, m.y - m.height + 5, m.x - 10, m.y - m.height + 25); ctx.fill();
      }
    };

    // Scenery, fog and ground belong to the default environment; the biome
    // backdrop draws its own, so skip them when one is active.
    if (!customBg) {
      s.scenery.filter(m => m.isDistant).forEach(m => drawSceneryElement(m, inDarkMode ? inkColor : distantInkColor));
      s.scenery.filter(m => !m.isDistant).forEach(m => drawSceneryElement(m, inDarkMode ? inkColor : inkColor));

      const fogGrd = ctx.createLinearGradient(0, canvas.height - GROUND_HEIGHT - 120, 0, canvas.height - GROUND_HEIGHT);
      fogGrd.addColorStop(0, 'rgba(244, 241, 234, 0)'); fogGrd.addColorStop(1, inDarkMode ? 'rgba(28, 25, 23, 1)' : PALETTE.paper);
      ctx.fillStyle = fogGrd; ctx.fillRect(0, canvas.height - GROUND_HEIGHT - 120, canvas.width, 120);

      ctx.fillStyle = groundColor; ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
      ctx.beginPath(); ctx.moveTo(0, canvas.height - GROUND_HEIGHT);
      for(let i=0; i<=canvas.width; i+=20) {
        const worldX = i + s.distance; const bump = Math.sin(worldX * 0.02) * 5 + Math.sin(worldX * 0.05) * 3;
        ctx.lineTo(i, canvas.height - GROUND_HEIGHT - 4 + bump);
      }
      ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.fill();
    }

    // Boss Entity Drawing
    if (s.boss.active && s.boss.type === 'archer') {
      s.boss.arrows.forEach(arr => {
        if (arr.sliced) return;
        ctx.save(); ctx.translate(arr.x, arr.y); ctx.rotate(arr.angle);
        if (arr.scale) ctx.scale(arr.scale, arr.scale); // depth: back arrows smaller
        if (arr.isCrimson) {
          ctx.strokeStyle = PALETTE.crimson; ctx.fillStyle = PALETTE.crimson; ctx.shadowColor = PALETTE.crimson; ctx.shadowBlur = 15;
        } else {
          ctx.strokeStyle = PALETTE.paper; ctx.fillStyle = PALETTE.paper;
        }
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(15, 0); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(10, -6); ctx.lineTo(10, 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(-45, -8); ctx.lineTo(-20, 0); ctx.lineTo(-45, 8); ctx.fill();
        ctx.restore();
      });
    }

    if (s.boss.active && s.boss.type === 'ronin') {
      const rx = s.boss.x; const ry = s.boss.y;
      const scale = s.boss.scale || 1;
      
      ctx.save();
      ctx.translate(rx, ry);
      ctx.scale(-scale, scale); 
      
      ctx.fillStyle = `rgba(185, 28, 28, ${Math.random() * 0.4 + 0.1})`;
      ctx.beginPath(); ctx.arc(0, -30, 40 + Math.random()*15, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = inkColor;
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.lineTo(12, -35); ctx.lineTo(-12, -35); ctx.fill();
      
      ctx.beginPath(); ctx.moveTo(-25, -40); ctx.lineTo(25, -40); ctx.lineTo(0, -55); ctx.fill();

      ctx.fillStyle = PALETTE.crimson;
      ctx.shadowColor = PALETTE.crimson; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(-8, -32, 4, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

      const rScarfWave = Math.sin(time*0.02) * 15;
      ctx.lineWidth = 4; ctx.strokeStyle = PALETTE.crimson;
      ctx.beginPath(); ctx.moveTo(-6, -38); ctx.quadraticCurveTo(-35, -25 + rScarfWave, -55, -35 - Math.random()*15); ctx.stroke();

      ctx.lineWidth = 5; ctx.strokeStyle = inkColor;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, 15); ctx.stroke();
      ctx.restore();

      if (s.boss.phase === 'active') {
        const hpW = 120;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(rx - hpW/2, ry - 80 * scale, hpW, 8);
        ctx.fillStyle = PALETTE.crimson; ctx.fillRect(rx - hpW/2, ry - 80 * scale, hpW * (s.boss.hp / s.boss.maxHp), 8);
        
        if (s.boss.hitCooldown > 0) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(rx - 40*scale + Math.random()*80*scale, ry - 60*scale + Math.random()*60*scale); ctx.lineTo(rx - 40*scale + Math.random()*80*scale, ry - 60*scale + Math.random()*60*scale); ctx.stroke();
        }
      }
    }

    // Entities — obstacles (all live in s.bamboo). PLACEHOLDER art.
    const groundLine = canvas.height - GROUND_HEIGHT;
    s.bamboo.forEach(b => {
      ctx.save();

      if (b.specId) {
        ctx.restore();
        drawObstacle(ctx, b, time);
        return;
      }

      if (b.type === 'bridge') {
        // A gap in the ground; a plank hangs on a rope. Cut the rope (crimson
        // marker, high) → the plank drops to bridge the gap. SPRITE-READY
        ctx.fillStyle = '#05070d';
        ctx.fillRect(b.x - b.width / 2, groundLine, b.width, GROUND_HEIGHT);
        const cutY = groundLine - b.ropeOffY;                  // armed hang height = the cut height (varies per piece)
        const drop = b.state === 'resolved' ? Math.min(1, b.reactT / 12) : 0;
        const plankY = cutY + drop * (groundLine - cutY);      // drops from its hang height to bridge the gap
        ctx.fillStyle = inkColor;
        ctx.fillRect(b.x - b.width / 2, plankY, b.width, 16);
        if (b.state === 'armed') {
          ctx.strokeStyle = PALETTE.fadedInk; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(b.x, 0); ctx.lineTo(b.x, plankY); ctx.stroke();
          ctx.strokeStyle = PALETTE.crimson; ctx.lineWidth = 3;  // prominent cut marker AT the varied height
          ctx.beginPath(); ctx.arc(b.x, cutY, 13, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = PALETTE.crimson;
          ctx.beginPath(); ctx.arc(b.x, cutY, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        return;
      }

      if (b.type === 'boulder') {
        // A boulder blocking the path; cut the rope → it rolls away. SPRITE-READY
        ctx.save();
        ctx.translate(b.x, groundLine - 40);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = inkColor;
        ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = PALETTE.fadedInk; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-22, -10); ctx.lineTo(6, 4); ctx.lineTo(-8, 22); ctx.stroke();
        ctx.restore();
        if (b.state === 'armed') {
          const cutY = groundLine - b.ropeOffY;                // varied cut height
          ctx.strokeStyle = PALETTE.fadedInk; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(b.x, 0); ctx.lineTo(b.x, groundLine - 78); ctx.stroke();
          ctx.strokeStyle = PALETTE.crimson; ctx.lineWidth = 3;  // prominent cut marker AT the varied height
          ctx.beginPath(); ctx.arc(b.x, cutY, 13, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = PALETTE.crimson;
          ctx.beginPath(); ctx.arc(b.x, cutY, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        return;
      }

      if (b.type === 'spike') {
        // Low band: a row of ground spikes (slash LOW to clear). SPRITE-READY
        ctx.fillStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor;
        const baseY = b.y + b.height;
        const n = Math.max(3, Math.round(b.width / 16));
        const sw = b.width / n;
        for (let k = 0; k < n; k++) {
          const sx = b.x - b.width / 2 + k * sw;
          ctx.beginPath();
          ctx.moveTo(sx, baseY); ctx.lineTo(sx + sw / 2, b.y); ctx.lineTo(sx + sw, baseY);
          ctx.closePath(); ctx.fill();
        }
      } else if (b.type === 'vine') {
        // High band: strands hanging from the top (slash HIGH to clear). SPRITE-READY
        ctx.strokeStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor;
        ctx.lineWidth = 5; ctx.lineCap = 'round';
        const n = 4;
        for (let k = 0; k < n; k++) {
          const vx = b.x - b.width / 2 + k * (b.width / (n - 1));
          ctx.beginPath();
          ctx.moveTo(vx, b.y);
          ctx.lineTo(vx + Math.sin(time * 0.002 + k) * 8, b.y + b.height);
          ctx.stroke();
        }
        ctx.fillStyle = PALETTE.emerald;
        for (let k = 0; k < 5; k++) {
          const ly = b.y + b.height * (0.3 + k * 0.14);
          ctx.beginPath(); ctx.ellipse(b.x + Math.sin(k) * 14, ly, 9, 4, Math.sin(k), 0, Math.PI * 2); ctx.fill();
        }
      } else if (b.type === 'stalactite') {
        // CAVE mover: a rock spike that drops from the ceiling — slash it HIGH. SPRITE-READY
        ctx.fillStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor;
        ctx.beginPath();
        ctx.moveTo(b.x - b.width / 2, b.y);
        ctx.lineTo(b.x + b.width / 2, b.y);
        ctx.lineTo(b.x, b.y + b.height);
        ctx.closePath();
        ctx.fill();
        if (b.state === 'idle') {                 // faint tether to the ceiling while it still hangs
          ctx.strokeStyle = PALETTE.fadedInk; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(b.x, 0); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      } else if (b.type === 'mine') {
        // WATER mover: a spiked mine that rises from below — slash before it surfaces. SPRITE-READY
        const cy = b.y + b.height / 2, r = b.width / 2;
        ctx.fillStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor;
        ctx.beginPath(); ctx.arc(b.x, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor; ctx.lineWidth = 4;
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.lineTo(b.x + Math.cos(a) * (r + 12), cy + Math.sin(a) * (r + 12));
          ctx.stroke();
        }
      } else if (b.type === 'net') {
        // WATER: a mesh net strung across the mid lane — slash to cut through. SPRITE-READY
        ctx.strokeStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor;
        ctx.lineWidth = 3;
        const x0 = b.x - b.width / 2, y0 = b.y, x1 = b.x + b.width / 2, y1 = b.y + b.height;
        for (let gx = x0; gx <= x1 + 0.1; gx += 18) { ctx.beginPath(); ctx.moveTo(gx, y0); ctx.lineTo(gx, y1); ctx.stroke(); }
        for (let gy = y0; gy <= y1 + 0.1; gy += 18) { ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); ctx.stroke(); }
      } else if (b.type === 'raft') {
        // WATER: a bamboo raft ferrying a yokai wave in — pure dressing. SPRITE-READY
        ctx.fillStyle = PALETTE.fadedInk;
        ctx.fillRect(b.x - b.width / 2, b.y, b.width, b.height);
        ctx.fillStyle = inkColor;
        for (let px = b.x - b.width / 2 + 4; px < b.x + b.width / 2; px += 14) ctx.fillRect(px, b.y, 3, b.height);
      } else if (b.type === 'tnt') {
        // CAVE: an explosive crate — slash to detonate (chain-clears). SPRITE-READY
        const x0 = b.x - b.width / 2, y0 = b.y;
        ctx.fillStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor;
        ctx.fillRect(x0, y0, b.width, b.height);
        ctx.fillStyle = PALETTE.paper;                         // light bands
        ctx.fillRect(x0, y0 + b.height * 0.30, b.width, 7);
        ctx.fillRect(x0, y0 + b.height * 0.60, b.width, 7);
        ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('TNT', b.x, b.y + b.height / 2);
        ctx.textBaseline = 'alphabetic';
        ctx.strokeStyle = inkColor; ctx.lineWidth = 2;        // fuse
        ctx.beginPath(); ctx.moveTo(b.x, y0); ctx.quadraticCurveTo(b.x + 12, y0 - 14, b.x + 4, y0 - 24); ctx.stroke();
      } else if (b.type === 'barrel') {
        // WATER: a rising spiked explosive barrel — slash before it surfaces. SPRITE-READY
        const cy = b.y + b.height / 2, r = b.width / 2;
        if (b.y + b.height < canvas.height) {                  // tether down into the deep
          ctx.strokeStyle = PALETTE.fadedInk; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(b.x, cy + r); ctx.lineTo(b.x, canvas.height); ctx.stroke();
        }
        ctx.fillStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor;
        ctx.beginPath(); ctx.arc(b.x, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = PALETTE.paper; ctx.lineWidth = 2;    // staves
        ctx.beginPath(); ctx.arc(b.x, cy, r * 0.6, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(b.x - r, cy); ctx.lineTo(b.x + r, cy); ctx.stroke();
        ctx.strokeStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor; ctx.lineWidth = 4;
        for (let k = 0; k < 8; k++) {                          // spikes
          const a = k * Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.lineTo(b.x + Math.cos(a) * (r + 12), cy + Math.sin(a) * (r + 12));
          ctx.stroke();
        }
      } else {
        // Mid band: bamboo stalk (slash anywhere).
        const sway = Math.sin(time * 0.002 + b.swayOffset) * 0.05;
        ctx.translate(b.x, canvas.height - GROUND_HEIGHT); ctx.rotate(sway); ctx.translate(-b.x, -(canvas.height - GROUND_HEIGHT));

        ctx.fillStyle = b.hitCooldown > 0 ? PALETTE.fadedInk : inkColor;
        ctx.fillRect(b.x - b.width/2, b.y, b.width, b.height);

        ctx.fillStyle = PALETTE.paper;
        for(let n = b.y + 40; n < b.y + b.height; n += 60) ctx.fillRect(b.x - b.width/2 - 2, n, b.width + 4, 2);

        if (b.type === 'thick') {
          ctx.fillStyle = PALETTE.paper;
          if (b.hp <= 2) { ctx.beginPath(); ctx.moveTo(b.x - b.width/2, b.y + 60); ctx.lineTo(b.x + 5, b.y + 70); ctx.lineTo(b.x - b.width/2, b.y + 75); ctx.fill(); }
          if (b.hp <= 1) { ctx.beginPath(); ctx.moveTo(b.x + b.width/2, b.y + 120); ctx.lineTo(b.x - 5, b.y + 130); ctx.lineTo(b.x + b.width/2, b.y + 135); ctx.fill(); }
        }
      }
      ctx.restore();
    });

    // Coins (bamboo phase) — PLACEHOLDER gold pickups. SPRITE-READY
    s.coins.forEach(c => {
      const bobY = Math.sin(time * 0.005 + c.bob) * 3;
      ctx.save();
      ctx.translate(c.x, c.y + bobY);
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.arc(0, 0, c.r * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Demons (Fruit-Ninja yokai) — PLACEHOLDER art (red mask + horns + eyes).
    // SPRITE-READY
    s.demons.forEach(d => {
      if (d.sliced) return;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);

      ctx.fillStyle = PALETTE.crimson;
      ctx.beginPath();
      ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.moveTo(-d.radius * 0.5, -d.radius * 0.6); ctx.lineTo(-d.radius * 0.85, -d.radius * 1.2); ctx.lineTo(-d.radius * 0.2, -d.radius * 0.7);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(d.radius * 0.5, -d.radius * 0.6); ctx.lineTo(d.radius * 0.85, -d.radius * 1.2); ctx.lineTo(d.radius * 0.2, -d.radius * 0.7);
      ctx.closePath(); ctx.fill();

      // Glaring eyes
      ctx.fillStyle = PALETTE.warmGlow;
      ctx.beginPath();
      ctx.arc(-d.radius * 0.35, -d.radius * 0.1, d.radius * 0.16, 0, Math.PI * 2);
      ctx.arc(d.radius * 0.35, -d.radius * 0.1, d.radius * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Fanged grin
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, d.radius * 0.1, d.radius * 0.45, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      ctx.restore();
    });

    // Punishers (cave spider / water carp) — B&W placeholder chasers spawned by a
    // stumble; slash to dispel. Tiny crimson eye is the one accent. SPRITE-READY
    s.punishers.forEach(pu => {
      ctx.save();
      ctx.translate(pu.x, pu.y);
      if (pu.cut) ctx.globalAlpha = 0.7;
      if (pu.kind === 'spider') {
        ctx.strokeStyle = inkColor; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let k = 0; k < 8; k++) {
          const side = k < 4 ? -1 : 1;
          const a = Math.sin(pu.legTimer + k) * 0.5;
          ctx.beginPath(); ctx.moveTo(side * 10, 0);
          ctx.quadraticCurveTo(side * 28, -14 + a * 16, side * 38, 14 + a * 8);
          ctx.stroke();
        }
        ctx.fillStyle = inkColor;
        ctx.beginPath(); ctx.arc(0, 0, pu.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = PALETTE.crimson;
        ctx.beginPath(); ctx.arc(-6, -5, 3, 0, Math.PI * 2); ctx.arc(6, -5, 3, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = inkColor;
        ctx.beginPath(); ctx.ellipse(0, 0, pu.radius, pu.radius * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pu.radius * 0.9, 0); ctx.lineTo(pu.radius * 1.5, -pu.radius * 0.55); ctx.lineTo(pu.radius * 1.5, pu.radius * 0.55);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PALETTE.crimson;
        ctx.beginPath(); ctx.arc(-pu.radius * 0.5, -pu.radius * 0.15, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });

    // Arrow-cluster archer trigger — a packed bundle with a pulsing crimson
    // "cut me" ring (deliberately NOT bomb language). PLACEHOLDER. SPRITE-READY
    if (s.arrowCluster) {
      const c = s.arrowCluster;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.strokeStyle = inkColor; ctx.fillStyle = inkColor; ctx.lineWidth = 3;
      for (let k = 0; k < 10; k++) {
        ctx.save();
        ctx.rotate((k / 10) * Math.PI * 2);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(c.r * 0.95, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c.r * 0.95, 0); ctx.lineTo(c.r * 0.78, -5); ctx.lineTo(c.r * 0.78, 5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      const pulse = 0.5 + Math.sin(time * 0.012) * 0.4;
      ctx.strokeStyle = PALETTE.crimson; ctx.lineWidth = 3 + pulse * 4;
      ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.35 + pulse * 0.4;
      ctx.fillStyle = PALETTE.crimson;
      ctx.beginPath(); ctx.arc(0, 0, c.r * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Debris
    s.debris.forEach(d => {
      ctx.globalAlpha = (d.type === 'ink' || d.type === 'ember') ? Math.min(1, Math.max(0, d.life)) : 1;
      if (d.type === 'blast') {
         // Explosion shockwave — an expanding ring + soft core. SPRITE-READY
         const a = Math.max(0, Math.min(1, d.life));
         ctx.globalAlpha = a;
         ctx.strokeStyle = PALETTE.paper; ctx.lineWidth = 4;
         ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.stroke();
         ctx.fillStyle = `rgba(255, 255, 255, ${0.25 * a})`;
         ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.6, 0, Math.PI * 2); ctx.fill();
      } else if (d.type === 'ink') {
         ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(d.x, d.y, 2 + Math.random()*4, 0, Math.PI*2); ctx.fill();
      } else if (d.type === 'leaf') {
         ctx.fillStyle = PALETTE.fadedInk; ctx.beginPath(); ctx.ellipse(d.x, d.y, 6, 2, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
      } else if (d.type === 'stalk') {
         ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.fillStyle = inkColor; ctx.fillRect(-d.width/2, -d.height/2, d.width, d.height); ctx.restore();
      } else if (d.type === 'ember') {
         if (!inDarkMode) {
            ctx.fillStyle = PALETTE.warmGlow; ctx.shadowColor = PALETTE.warmGlow; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; 
         }
      }
      ctx.globalAlpha = 1;
    });

    // Monk
    if (gameState === 'PLAYING' && (s.playerBiome || s.biome) === 'water') {
      // SWIM pose: angled at the surface, paddling kicks (no ground stride). SPRITE-READY
      const mx = s.monk.x, my = s.monk.y;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(0.12);
      ctx.fillStyle = inkColor;
      ctx.beginPath(); ctx.moveTo(-15, 2); ctx.lineTo(14, 5); ctx.lineTo(18, -18); ctx.lineTo(-12, -18); ctx.fill();
      ctx.beginPath(); ctx.arc(10, -26, 10, 0, Math.PI * 2); ctx.fill();
      const sw = Math.sin(s.monk.runCycle * 1.5) * 8;
      ctx.strokeStyle = PALETTE.emerald; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-2, -22); ctx.quadraticCurveTo(-28, -14 + sw, -52, -18 - sw); ctx.stroke();
      const kick = Math.sin(s.monk.runCycle) * 0.5;
      ctx.strokeStyle = inkColor; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(-34, -2 + kick * 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, -1); ctx.lineTo(-34, 6 - kick * 18); ctx.stroke();
      ctx.restore();
    } else if (gameState === 'PLAYING') {
      // Cosmetic character (defaults to the starter, sunslayer). The run
      // animation stays tied to game speed by feeding monk.runCycle through the
      // renderer's internal time→runCycle mapping (time * 0.22). The feet are
      // anchored to the old ground line via FOOT_OFFSET so the figure stays
      // planted regardless of MONK_SCALE.
      drawCharacter(ctx, {
        id: s.cosmetics?.characterId,
        x: s.monk.x,
        y: s.monk.y + 15 - MONK_FOOT_OFFSET * MONK_SCALE,
        scale: MONK_SCALE,
        pose: 'running',
        time: s.monk.runCycle / 0.22,
      });
    }

    // Foreground Parallax 
    s.foreground.forEach(fg => {
      ctx.fillStyle = '#050404'; 
      if (fg.type === 'tree') {
        ctx.fillRect(fg.x, -50, 80, canvas.height + 100);
        ctx.fillStyle = '#1c1917';
        for(let n=0; n<canvas.height; n+=120) ctx.fillRect(fg.x-5, n, 90, 8); 
      } else if (fg.type === 'lantern') {
        ctx.fillRect(fg.x, -50, 40, canvas.height + 100); 
        ctx.fillRect(fg.x - 60, 100, 160, 30); ctx.fillRect(fg.x - 50, 130, 60, 80);
        if (!inDarkMode) {
          ctx.fillStyle = PALETTE.warmGlow; ctx.shadowColor = PALETTE.warmGlow; ctx.shadowBlur = 30;
          ctx.fillRect(fg.x - 40, 140, 40, 60); ctx.shadowBlur = 0; 
        }
      } else if (fg.type === 'torii_fg') {
         ctx.fillRect(fg.x, -50, 150, canvas.height + 100); 
      }
    });

    // Brush/Sword Trail (now shown during the archer volley too — arrows are
    // sliced with a normal blade sweep).
    if (!s.focus.active && s.sword.trail.length > 1) {
      if (s.sword.isSlashing) {
        // Active swipe → draw the equipped elemental slash. The trail is stored
        // newest-first (unshift); the slash renderers expect oldest→newest with
        // the blade tip at the end, so feed a reversed copy.
        drawSlashTrail(ctx, s.cosmetics?.slashId, s.sword.trail.slice().reverse(), time);
      } else {
        // Idle tracking → thin ink line so the blade position stays visible.
        ctx.beginPath(); ctx.moveTo(s.sword.trail[0].x, s.sword.trail[0].y);
        for (let i = 1; i < s.sword.trail.length; i++) ctx.lineTo(s.sword.trail[i].x, s.sword.trail[i].y);
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      }
    }

    // Focus Path
    if (s.focus.active && s.focus.path.length > 0) {
      ctx.beginPath(); ctx.moveTo(s.focus.path[0].x, s.focus.path[0].y);
      for (let i = 1; i < s.focus.path.length; i++) ctx.lineTo(s.focus.path[i].x, s.focus.path[i].y);
      ctx.strokeStyle = PALETTE.crimson; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash([15, 10]); ctx.stroke(); ctx.setLineDash([]);
      
      ctx.beginPath(); ctx.arc(s.mouse.x, s.mouse.y, 12 + Math.sin(time*0.01)*6, 0, Math.PI * 2);
      ctx.strokeStyle = PALETTE.crimson; ctx.lineWidth = 2; ctx.stroke();
    }

    // Screen Flash 
    if (s.flashHit > 0) {
      ctx.fillStyle = `rgba(${s.flashColor}, ${s.flashHit})`; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore(); 

    // UI Overlays
    if (gameState === 'PLAYING') {
      const biomeAlpha = Math.max(0, 1 - ((s.distance % BIOME_LENGTH) / 300)); 
      const getBiomeText = () => {
        switch(biomeName) {
          case 'village': return "NINJA VILLAGE";
          case 'volcano': return "MT. DOOM";
          case 'rain': return "WEEPING VALLEY";
          case 'bamboo':
          default: return "BAMBOO FOREST";
        }
      };
      
      if (s.distance % BIOME_LENGTH < 300) {
        ctx.fillStyle = `rgba(120, 113, 108, ${Math.max(0, 1 - (s.distance % BIOME_LENGTH)/300)})`;
        ctx.font = 'italic 40px serif';
        ctx.textAlign = 'center';
        ctx.fillText(getBiomeText(), canvas.width / 2, 80);
      }

      const barWidth = 200;
      const barX = canvas.width / 2 - barWidth / 2;
      const barY = canvas.height - 40;
      ctx.strokeStyle = inkColor; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barWidth, 12);
      
      if (s.boss.active && s.boss.type === 'archer') {
        ctx.fillStyle = PALETTE.crimson; ctx.fillRect(barX + 2, barY + 2, barWidth - 4, 8);
        ctx.fillStyle = inkColor; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center';
        ctx.fillText("INFINITE FOCUS", canvas.width / 2, barY - 10);
      } else {
        ctx.fillStyle = s.focus.energy >= 30 ? PALETTE.crimson : PALETTE.fadedInk;
        ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * (s.focus.energy / MAX_FOCUS), 8);
        ctx.fillStyle = inkColor; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center';
        ctx.fillText("HOLD CLICK: IAIJUTSU", canvas.width / 2, barY - 10);
      }

      if (s.boss.active && s.boss.type === 'ronin' && s.boss.phase === 'active') {
        const maxDist = 360; 
        const currentDist = Math.max(0, s.boss.x - (s.monk.x + 40));
        ctx.fillStyle = PALETTE.crimson;
        ctx.fillRect(canvas.width/2 - 150, 100, 300 * (currentDist/maxDist), 10);
        ctx.strokeStyle = '#fff'; ctx.lineWidth=2; ctx.strokeRect(canvas.width/2 - 150, 100, 300, 10);
      }
    }

    if (gameState === 'PLAYING' && s.monk.x < MONK_TARGET_X - 20) {
      const danger = 1 - (s.monk.x / MONK_TARGET_X);
      ctx.fillStyle = `rgba(28, 25, 23, ${danger * 0.4})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
};
