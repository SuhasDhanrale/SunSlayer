// Live pacing instrument for PLAYTESTING the real run. Draws (on the game canvas)
// the conductor's current intensity as a scrolling curve, plus the active pattern
// + category, so you can FEEL a run and SEE the rhythm at the same time and tune
// the `pacing` knobs accordingly. Debug-only — kept out of GameRenderer so it
// never leaks into shipping draw. Toggle with the `i` key (see GameScreen).
import { YOKAI_SHAPES } from '../data/yokaiShapes.js';

const CAT_COL = { teach: '#60a5fa', obstacle: '#f87171', combo: '#c084fc', rest: '#34d399', food: '#fbbf24' };
const HIST = 600; // samples kept (~10s at 60fps)

export const PacingOverlay = {
  draw(ctx, s, canvas, elapsedSec) {
    const d = s.director;
    if (!d) return;

    if (!s.pacingHist) s.pacingHist = [];
    s.pacingHist.push(d.intensity || 0);
    if (s.pacingHist.length > HIST) s.pacingHist.shift();

    const cat = (s.pattern && s.pattern.category) || '-';
    const id = (s.pattern && s.pattern.id) || '-';
    const col = CAT_COL[cat] || '#fbbf24';

    const track = s.yokaiTrack;
    const W = 330, H = 146, x = 16, y = canvas.height - H - 16;
    const gx = x + 8, gy = y + 8, gw = W - 16, gh = 46;

    ctx.save();
    ctx.fillStyle = 'rgba(12,10,9,0.72)';
    ctx.fillRect(x, y, W, H);

    // intensity curve
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke(); // 0.5 line
    const n = s.pacingHist.length;
    if (n > 1) {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const px = gx + (i / (HIST - 1)) * gw;
        const py = gy + gh - Math.max(0, Math.min(1, s.pacingHist[i])) * gh;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }

    // readout
    ctx.fillStyle = '#f4f1ea';
    ctx.font = '11px monospace';
    ctx.fillText(`intensity ${Math.round((d.intensity || 0) * 100)}%    t ${Math.floor(elapsedSec)}s`, gx, gy + gh + 16);
    ctx.fillStyle = col;
    ctx.fillText(`[${s.spawnBiome || s.biome || 'bamboo'}] ${cat}: ${id}`, gx, gy + gh + 30);
    if (track) {
      const chance = Math.min(0.3, 0.3 * (track.intensity || 0));
      ctx.fillStyle = '#fb7185';
      ctx.fillText(`yokai ${track.phase}  I ${Math.round(track.intensity * 100)}%  roll ${Math.round(chance * 100)}%`, gx, gy + gh + 44);
      ctx.fillStyle = '#f4f1ea';
      ctx.fillText(`active ${s.demons?.filter((enemy) => !enemy.sliced).length || 0}/7  types ${track.unlockedTypes.join('/')}  swarm ${track.swarmInProgress ? 'LIVE' : track.swarmPending ? 'QUEUED' : 'off'}`, gx, gy + gh + 58);
    }

    // Yokai shape tuning rig (Phase 4 / DESIGN §8): the SELECTED shape — what `u`
    // spawns — as `FAN · side · PEAK · 4`. When that shape was just fired,
    // s.activeShape carries the count that actually spawned (after the woven cap
    // clamp), so a Fan that's secretly 4 singles is visible. Debug-only label.
    const sel = YOKAI_SHAPES[s.debugShapeIdx ?? 0];
    if (sel) {
      const live = s.activeShape && s.activeShape.id === sel.id ? ` ▸ spawned ${s.activeShape.members}` : '';
      ctx.fillStyle = '#c4b5fd';
      ctx.fillText(`shape ${sel.id.toUpperCase()} · ${sel.route} · ${sel.tier} · ${sel.members.length}${live}   [y]next [u]spawn`, gx, gy + gh + 72);
    }
    ctx.restore();
  }
};
