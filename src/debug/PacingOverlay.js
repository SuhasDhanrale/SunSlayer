// Live pacing instrument for PLAYTESTING the real run. Draws (on the game canvas)
// the conductor's current intensity as a scrolling curve, plus the active pattern
// + category, so you can FEEL a run and SEE the rhythm at the same time and tune
// the `pacing` knobs accordingly. Debug-only — kept out of GameRenderer so it
// never leaks into shipping draw. Toggle with the `i` key (see GameScreen).
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

    const W = 260, H = 96, x = 16, y = canvas.height - H - 16;
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
    ctx.fillText(`${cat}: ${id}`, gx, gy + gh + 30);
    ctx.restore();
  }
};
