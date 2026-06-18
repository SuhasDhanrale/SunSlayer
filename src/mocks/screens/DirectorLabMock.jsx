// DIRECTOR LAB — shape the run's INTENSITY CURVE and see the whole 20-minute plan
// at a glance. Dry-runs the real conductor (RunDirector.simulate) over N minutes
// without playing, plotting the intensity it generates + which pattern/category
// fills each slot. Drag the knobs → the plan redraws instantly. Reseed to see how
// much variety the jitter + decks give for the SAME knobs.
//
// These knobs are the live `pacing` block in data/config.json — when a shape feels
// right here, copy the values there and the real run uses them.
import { useEffect, useMemo, useRef, useState } from 'react';
import { RunDirector } from '../../systems/RunDirector.js';
import { PACING } from '../../config/constants.js';

const COLORS = { teach: '#60a5fa', obstacle: '#f87171', combo: '#c084fc', rest: '#34d399', food: '#fbbf24' };

const KNOBS = [
  { key: 'rampSeconds', label: 'Ramp (sec to full)', min: 60, max: 1200, step: 30 },
  { key: 'baseStart', label: 'Baseline start', min: 0, max: 0.5, step: 0.05 },
  { key: 'baseEnd', label: 'Baseline end', min: 0.3, max: 1, step: 0.05 },
  { key: 'restDepth', label: 'Rest depth (×base)', min: 0, max: 1, step: 0.05 },
  { key: 'peakHeight', label: 'Peak height (+base)', min: 0, max: 0.6, step: 0.05 },
  { key: 'restPatterns', label: 'Rest length (patterns)', min: 1, max: 3, step: 1 },
  { key: 'peakPatterns', label: 'Peak length (patterns)', min: 1, max: 6, step: 1 },
  { key: 'patternGap', label: 'Gap between patterns', min: 0, max: 600, step: 20 },
  { key: 'jitter', label: 'Jitter (anti-robotic)', min: 0, max: 0.6, step: 0.05 },
];

export const DirectorLabMock = () => {
  const graphRef = useRef(null);
  const [minutes, setMinutes] = useState(12);
  const [seed, setSeed] = useState(0);
  const [vals, setVals] = useState(() => {
    const v = {};
    for (const k of KNOBS) v[k.key] = PACING[k.key];
    return v;
  });

  const params = useMemo(() => ({ ...PACING, ...vals }), [vals]);
  const events = useMemo(() => RunDirector.simulate(params, minutes), [params, minutes, seed]);

  // Count per category for the readout.
  const counts = useMemo(() => {
    const c = {};
    for (const e of events) c[e.category] = (c[e.category] || 0) + 1;
    return c;
  }, [events]);

  useEffect(() => {
    const canvas = graphRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const draw = () => {
      canvas.width = Math.max(1, canvas.clientWidth) * dpr;
      canvas.height = Math.max(1, canvas.clientHeight) * dpr;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#161b29'; ctx.fillRect(0, 0, W, H);

      const padL = 40 * dpr, padR = 12 * dpr, padT = 14 * dpr, padB = 52 * dpr;
      const gx = padL, gy = padT, gw = W - padL - padR, gh = H - padT - padB;
      const totalSec = minutes * 60;
      const X = (t) => gx + (t / totalSec) * gw;
      const Y = (v) => gy + (1 - v) * gh;

      // Horizontal intensity grid.
      ctx.font = `${10 * dpr}px sans-serif`;
      for (let v = 0; v <= 1.001; v += 0.25) {
        const y = Y(v);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(v.toFixed(2), 6 * dpr, y + 3 * dpr);
      }
      // Vertical minute grid.
      for (let m = 0; m <= minutes; m++) {
        const x = X(m * 60);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy + gh); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(`${m}m`, x - 4 * dpr, gy + gh + 14 * dpr);
      }

      // Baseline curve (dashed) — the slow whole-run climb.
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.beginPath();
      for (let t = 0; t <= totalSec; t += totalSec / 160) {
        const x = X(t), y = Y(RunDirector.baselineAt(params, t));
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.setLineDash([]);

      // Each generated pattern: an intensity step + a category bar beneath.
      const barY = gy + gh + 20 * dpr, barH = 9 * dpr;
      for (const e of events) {
        const x0 = X(e.t), x1 = X(Math.min(totalSec, e.t + e.dur));
        const col = COLORS[e.category] || '#888';
        ctx.fillStyle = col;
        ctx.fillRect(x0, barY, Math.max(1 * dpr, x1 - x0 - 0.5 * dpr), barH);
        ctx.strokeStyle = col; ctx.lineWidth = 2 * dpr;
        const y = Y(e.intensity);
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [events, minutes, params]);

  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex h-full w-full flex-col bg-[#202636] text-white">
      {/* Graph */}
      <div className="relative min-h-0 flex-1 p-2">
        <canvas ref={graphRef} className="h-full w-full rounded-md" />
      </div>

      {/* Legend + reseed + minutes */}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 px-3 py-1.5 text-[10px] font-bold">
        {Object.entries(COLORS).map(([cat, col]) => (
          <span key={cat} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: col }} />
            {cat} <span className="opacity-50">{counts[cat] || 0}</span>
          </span>
        ))}
        <span className="ml-auto flex items-center gap-2">
          <label>span {minutes}m</label>
          <input type="range" min="2" max="20" step="1" value={minutes} onChange={(e) => setMinutes(+e.target.value)} className="accent-[#54a0ff]" />
          <button onClick={() => setSeed((s) => s + 1)} className="rounded bg-[#54a0ff] px-2 py-1 font-black tracking-widest">RESEED</button>
        </span>
      </div>

      {/* Knobs */}
      <div className="grid max-h-[210px] grid-cols-2 gap-x-5 gap-y-1 overflow-y-auto border-t border-white/10 px-3 py-2 md:grid-cols-3">
        {KNOBS.map((k) => (
          <label key={k.key} className="flex items-center gap-2 text-[10px] font-bold">
            <span className="w-[120px] shrink-0 text-white/70">{k.label}</span>
            <input
              type="range" min={k.min} max={k.max} step={k.step} value={vals[k.key]}
              onChange={(e) => set(k.key, +e.target.value)}
              className="min-w-0 flex-1 accent-[#1dd1a1]"
            />
            <span className="w-9 shrink-0 text-right tabular-nums text-white/90">{vals[k.key]}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
