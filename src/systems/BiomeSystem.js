// ─────────────────────────────────────────────────────────────────────────────
// BiomeSystem — drives the VISUAL biome timeline and the cave transitions between
// biomes. Pure canvas, no React, no refs (it's handed the stateful renderer
// instances; GameScreen owns their lifetime, like backdropsRef).
//
// THE TRANSITION (no crossfade). The cave is a finite tunnel that sits AHEAD in the
// world and scrolls in from the right over the current biome. Driving the cave's
// journey off run distance gives one formula that places, every frame:
//   • the OLD biome to the LEFT of the cave's entrance rock-edge (screen X = A)
//   • the NEW biome to the RIGHT of the cave's exit rock-edge   (screen X = B)
//   • the cave itself filling the rock region [A, B] between them
// Because the cave's rock span (totalCaveLen − preludeLen) is far wider than the
// screen, A and B are NEVER both on screen — so the old and new biomes are never
// visible at once. That's what makes it read as "run into the cave, run out the
// other side into somewhere new" instead of a dissolve. The biome swap is hidden
// inside the enclosed dark; the monk's lane glides across it (ground↔water).
// ─────────────────────────────────────────────────────────────────────────────
import { VISUAL_BIOMES } from '../renderer/BiomeBackgrounds.js';
import { BIOME_SCHEDULE, BIOME_TRANSITION } from '../data/biomeSchedule.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

// laneFrac target for a biome: 0 = run on the ground, 1 = swim at the water surface.
const laneOf = (id) => (VISUAL_BIOMES[id]?.laneType === 'water' ? 1 : 0);

export const BiomeSystem = {
  // The scheduled biome id for a given elapsed run time (last entry that has fired).
  scheduledAt(elapsedSec) {
    let id = BIOME_SCHEDULE[0].biome;
    for (const e of BIOME_SCHEDULE) if (elapsedSec >= e.atSec) id = e.biome;
    return id;
  },

  // Advance the timeline state machine. `caveJourney` = the cave instance's .journey
  // (so we know the leg length). Returns the seq for convenience. Sets seq.caveReset
  // when a transition just began — GameScreen reset()s the cave instance on that.
  tick(s, elapsedSec, caveJourney) {
    if (!s.biomeSeq) {
      const first = BIOME_SCHEDULE[0].biome;
      s.biomeSeq = {
        current: first, phase: 'STEADY', from: null, to: null,
        legStart: 0, into: 0, laneFrac: laneOf(first),
        manual: false, caveReset: false,
      };
    }
    const seq = s.biomeSeq;
    // The cave scrolls 1:1 with run distance — it's a fixed stretch of world you run
    // through at the game's actual speed, not something that rushes at you. So the
    // leg spans exactly the cave's own length in run-distance.
    const legLen = caveJourney.totalCaveLen;

    if (seq.phase === 'STEADY') {
      seq.laneFrac = laneOf(seq.current);
      // In manual (debug) mode the schedule is ignored — only the debug key changes it.
      const target = seq.manual ? seq.current : this.scheduledAt(elapsedSec);
      if (target !== seq.current) this._begin(s, seq.current, target);
    }

    if (seq.phase === 'TRANSITION') {
      seq.into = clamp01((s.distance - seq.legStart) / legLen);
      const r0 = BIOME_TRANSITION.laneRampStart, r1 = BIOME_TRANSITION.laneRampEnd;
      seq.laneFrac = lerp(laneOf(seq.from), laneOf(seq.to), smooth((seq.into - r0) / (r1 - r0)));
      if (seq.into >= 1) {
        seq.current = seq.to;
        seq.from = seq.to = null;
        seq.phase = 'STEADY';
        seq.laneFrac = laneOf(seq.current);
      }
    }
    return seq;
  },

  _begin(s, from, to) {
    const seq = s.biomeSeq;
    seq.phase = 'TRANSITION';
    seq.from = from;
    seq.to = to;
    seq.legStart = s.distance;
    seq.into = 0;
    seq.caveReset = true; // GameScreen consumes this to reseed the cave instance
  },

  // DEBUG: jump straight into a transition to the next registered biome (key 'n'),
  // so transitions can be felt without waiting on the schedule. Latches manual mode.
  debugNext(s) {
    if (!s.biomeSeq || s.biomeSeq.phase === 'TRANSITION') return;
    const ids = Object.keys(VISUAL_BIOMES);
    const cur = s.biomeSeq.current;
    const next = ids[(ids.indexOf(cur) + 1) % ids.length];
    s.biomeSeq.manual = true;
    this._begin(s, cur, next);
  },

  // Composite the environment for this frame. `inst` = { rain, village, …, cave } of
  // stateful renderer instances (created once by GameScreen). Drawn as the biome
  // backdrop, so GameRenderer skips its own paper/sun/scenery/ground.
  draw(ctx, s, inst, w, h) {
    const seq = s.biomeSeq;
    if (!seq) return;

    if (seq.phase === 'STEADY') {
      inst[seq.current]?.render(ctx, w, h); // self-scrolls on its own counter
      return;
    }

    // TRANSITION — the single-formula spatial wipe (see header).
    const J = inst.cave.journey;
    const caveDist = seq.into * J.totalCaveLen;
    const A = J.preludeLen - caveDist;     // entrance rock-edge, screen X
    const B = J.totalCaveLen - caveDist;   // exit rock-edge, screen X

    // OLD biome, left of the cave entrance.
    if (A > 0) this._clip(ctx, 0, Math.min(w, A), h, () => inst[seq.from]?.render(ctx, w, h));
    // NEW biome, right of the cave exit.
    if (B < w) { const x = Math.max(0, B); this._clip(ctx, x, w - x, h, () => inst[seq.to]?.render(ctx, w, h)); }
    // The cave itself, filling the rock region [A, B], driven by run distance.
    const cl = Math.max(0, A), cr = Math.min(w, B);
    if (cr > cl) this._clip(ctx, cl, cr - cl, h, () => inst.cave.render(ctx, w, h, caveDist));
  },

  _clip(ctx, x, width, h, draw) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, width, h);
    ctx.clip();
    draw();
    ctx.restore();
  },
};
