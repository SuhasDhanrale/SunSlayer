// Live pacing instrument for PLAYTESTING the real run. Draws (on the game canvas)
// the conductor's current intensity as a scrolling curve, plus the active pattern
// + category, so you can FEEL a run and SEE the rhythm at the same time and tune
// the `pacing` knobs accordingly. Debug-only — kept out of GameRenderer so it
// never leaks into shipping draw. Toggle with the `i` key (see GameScreen).
import { YOKAI_SHAPES } from '../data/yokaiShapes.js';
import { yokaiEnvelope } from '../systems/RunDirector.js';

const CAT_COL = { teach: '#60a5fa', obstacle: '#f87171', combo: '#c084fc', rest: '#34d399' };
const HIST = 600; // samples kept (~10s at 60fps)
const YOKAI_COL = '#fb7185'; // the yokai-track curve + its phase readout

export const PacingOverlay = {
  draw(ctx, s, canvas, elapsedSec, selectedShapeIdx = 0) {
    const d = s.director;
    if (!d) return;

    if (!s.pacingHist) s.pacingHist = [];
    s.pacingHist.push(d.intensity || 0);
    if (s.pacingHist.length > HIST) s.pacingHist.shift();

    const track = s.yokaiTrack;
    if (!s.yokaiHist) s.yokaiHist = [];
    s.yokaiHist.push(track?.intensity || 0);
    if (s.yokaiHist.length > HIST) s.yokaiHist.shift();

    const cat = (s.pattern && s.pattern.category) || '-';
    const id = (s.pattern && s.pattern.id) || '-';
    const col = CAT_COL[cat] || '#fbbf24';

    const W = 330, H = 176, x = 16, y = canvas.height - H - 16;
    const gx = x + 8, gy = y + 8, gw = W - 16, gh = 46;
    const yOf = (v) => gy + gh - Math.max(0, Math.min(1, v)) * gh;

    ctx.save();
    ctx.fillStyle = 'rgba(12,10,9,0.72)';
    ctx.fillRect(x, y, W, H);

    // intensity curve
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke(); // 0.5 line

    // Phase 0/1 — the macro-envelope band (floor↔ceiling for the CURRENT run time).
    // Dashed amber rails show where the enveloped LULL trough and PEAK crest sit now,
    // so you can see the yokai pulse rising inside a slowly-climbing band (never 1.0).
    const env = track ? yokaiEnvelope(track.activeSec) : null;
    if (env) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(251,191,36,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, yOf(env.ceil)); ctx.lineTo(gx + gw, yOf(env.ceil)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx, yOf(env.floor)); ctx.lineTo(gx + gw, yOf(env.floor)); ctx.stroke();
      ctx.setLineDash([]);
    }

    const n = s.pacingHist.length;
    if (n > 1) {
      // yokai-track intensity (the master pulse) under the obstacle curve
      ctx.strokeStyle = YOKAI_COL; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const px = gx + (i / (HIST - 1)) * gw;
        i ? ctx.lineTo(px, yOf(s.yokaiHist[i])) : ctx.moveTo(px, yOf(s.yokaiHist[i]));
      }
      ctx.stroke();
      // obstacle conductor intensity (coloured by the active category)
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const px = gx + (i / (HIST - 1)) * gw;
        i ? ctx.lineTo(px, yOf(s.pacingHist[i])) : ctx.moveTo(px, yOf(s.pacingHist[i]));
      }
      ctx.stroke();
    }

    // readout
    ctx.fillStyle = '#f4f1ea';
    ctx.font = '11px monospace';
    // Phase 3 — the obstacle density is now LOCKED to the yokai master phase; show it
    // beside the intensity so the unified wave is legible (both curves ride one phase).
    const masterPhase = track?.phase || '-';
    ctx.fillText(`obstacle ${Math.round((d.intensity || 0) * 100)}%  [${masterPhase}]    t ${Math.floor(elapsedSec)}s`, gx, gy + gh + 16);
    ctx.fillStyle = col;
    ctx.fillText(`[${s.spawnBiome || s.biome || 'bamboo'}] ${cat}: ${id}`, gx, gy + gh + 30);
    if (track) {
      // Phase 6: the woven shape cadence — what the director last fired and the
      // countdown to the next beat (shorter as intensity climbs).
      const nextShp = track.shapeTimer > 0 ? `${track.shapeTimer.toFixed(1)}s` : '•';
      ctx.fillStyle = YOKAI_COL;
      const trap = track.trapUsedThisCycle ? 'used' : (track.trapTargetPhase || '-');
      ctx.fillText(`yokai ${track.phase}  I ${Math.round(track.intensity * 100)}%  shp ${track.lastShapeId || '-'} ${nextShp}  trap ${trap}`, gx, gy + gh + 44);
      // Phase 1 — the live envelope band: floor↔ceiling at this run time (env t%).
      ctx.fillStyle = '#fbbf24';
      const band = env
        ? `env ${Math.round(env.floor * 100)}↔${Math.round(env.ceil * 100)}%  t ${Math.round(env.t * 100)}%`
        : 'env -';
      ctx.fillText(`${band}  burst ${track.phase === 'PEAK' ? 'ON' : '-'}`, gx, gy + gh + 58);
      ctx.fillStyle = '#f4f1ea';
      ctx.fillText(`active ${s.demons?.filter((enemy) => !enemy.sliced).length || 0}/7  types ${track.unlockedTypes.join('/')}`, gx, gy + gh + 72);
    }

    // Yokai shape tuning rig (Phase 4 / DESIGN §8): the SELECTED shape — what `u`
    // spawns — as `FAN · side · PEAK · 4`. When that shape was just fired,
    // s.activeShape carries the count that actually spawned (after the woven cap
    // clamp), so a Fan that's secretly 4 singles is visible. Debug-only label.
    const sel = YOKAI_SHAPES[selectedShapeIdx] || YOKAI_SHAPES[0];
    if (sel) {
      const live = s.activeShape && s.activeShape.id === sel.id ? ` ▸ spawned ${s.activeShape.members}` : '';
      ctx.fillStyle = '#c4b5fd';
      ctx.fillText(`shape ${sel.id.toUpperCase()} · ${sel.route} · ${sel.tier} · ${sel.members.length}${live}   [y]next [u]spawn`, gx, gy + gh + 86);
    }
    ctx.restore();
  }
};
