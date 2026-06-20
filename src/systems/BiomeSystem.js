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
// inside the enclosed dark.
//
// WATER ENTRY/EXIT (the settle phases). The ground↔water surface change does NOT
// happen inside the cave — the monk runs on the floor the whole way through it.
// Instead it plays out just OUTSIDE the cave, over the global floor, using the water
// biome's own skin (one animated surface line):
//   • ground→water: STEADY → TRANSITION(cave) → SETTLE_IN  — emerge onto the floor,
//     then the water floods UP from the floor line to its resting height, lifting the
//     monk from a run into a swim ("camera dipping under").
//   • water→ground: STEADY → SETTLE_OUT → TRANSITION(cave) — the surface first drains
//     DOWN to the floor (swim → run), then he runs into the cave.
// laneFrac (0 = floor, 1 = swim surface) drives BOTH the monk's lane Y and the water
// skin's surface line, so they stay locked together.
// ─────────────────────────────────────────────────────────────────────────────
import { VISUAL_BIOMES } from '../renderer/BiomeBackgrounds.js';
import { BIOME_SCHEDULE, BIOME_TRANSITION } from '../data/biomeSchedule.js';
import { GROUND_HEIGHT, WATER_SURFACE_FRAC } from '../config/constants.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

// laneFrac target for a biome: 0 = run on the ground, 1 = swim at the water surface.
const laneOf = (id) => (VISUAL_BIOMES[id]?.laneType === 'water' ? 1 : 0);
const isWater = (id) => VISUAL_BIOMES[id]?.laneType === 'water';
// The water biome's surface line for a given laneFrac: the floor line at 0, its
// resting swim height at 1. Animating laneFrac floods/drains the world (and is the
// exact same line the monk's lane Y rides, so he sits on the surface).
const waterSurfaceY = (h, laneFrac) => lerp(h - GROUND_HEIGHT, h * WATER_SURFACE_FRAC, laneFrac);
const caveEdges = (seq, caveJourney) => {
  const caveDist = seq.into * caveJourney.totalCaveLen;
  return {
    caveDist,
    entranceX: caveJourney.preludeLen - caveDist,
    exitX: caveJourney.totalCaveLen - caveDist,
  };
};

export const BiomeSystem = {
  visualToGameplay(visualId) {
    return VISUAL_BIOMES[visualId]?.laneType === 'water' ? 'water' : 'bamboo';
  },

  gameplayAtScreenX(seq, caveJourney, screenX) {
    if (!seq) return 'bamboo';
    if (seq.phase !== 'TRANSITION') return this.visualToGameplay(seq.current);

    const { entranceX, exitX } = caveEdges(seq, caveJourney);
    if (screenX < entranceX) return this.visualToGameplay(seq.from);
    if (screenX > exitX) return this.visualToGameplay(seq.to);
    return 'cave';
  },

  // While ENTERING (SETTLE_IN) or LEAVING (SETTLE_OUT) water the surface is mid
  // rise/fall — hold obstacle/coin spawns so the player gets a clear stretch and is
  // never blocked by something that appears before the water has settled. Existing
  // entities keep scrolling (Physics runs regardless); only NEW spawns pause.
  spawnPaused(seq) {
    return !!seq && (seq.phase === 'SETTLE_IN' || seq.phase === 'SETTLE_OUT');
  },

  visualLabel(seq) {
    if (!seq) return 'bamboo';
    if (seq.phase === 'TRANSITION') return seq.from || seq.current || 'bamboo';
    return seq.current || 'bamboo';
  },

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
        legStart: 0, into: 0, settleStart: 0, laneFrac: laneOf(first),
        manual: false, caveReset: false,
      };
    }
    const seq = s.biomeSeq;
    // The cave scrolls 1:1 with run distance — it's a fixed stretch of world you run
    // through at the game's actual speed, not something that rushes at you. So the
    // leg spans exactly the cave's own length in run-distance.
    const legLen = caveJourney.totalCaveLen;
    const L = BIOME_TRANSITION.settleLen;

    if (seq.phase === 'STEADY') {
      seq.laneFrac = laneOf(seq.current);
      // In manual (debug) mode the schedule is ignored — only the debug key changes it.
      const target = seq.manual ? seq.current : this.scheduledAt(elapsedSec);
      if (target !== seq.current) this._begin(s, seq.current, target);
    }

    // SETTLE_OUT — leaving water: drain the surface back down to the floor BEFORE the
    // cave, so the monk drops from a swim to a run, then runs into the dark.
    else if (seq.phase === 'SETTLE_OUT') {
      const p = clamp01((s.distance - seq.settleStart) / L);
      seq.laneFrac = lerp(1, 0, smooth(p));
      if (p >= 1) {
        seq.phase = 'TRANSITION';
        seq.legStart = s.distance;
        seq.into = 0;
        seq.laneFrac = 0;
        seq.caveReset = true; // GameScreen consumes this to reseed the cave instance
      }
    }

    // TRANSITION — the cave tunnel (spatial wipe). The monk runs on the floor the
    // whole way through; any water rise/fall happens OUTSIDE the cave (the settles).
    else if (seq.phase === 'TRANSITION') {
      seq.into = clamp01((s.distance - seq.legStart) / legLen);
      seq.laneFrac = 0;
      if (seq.into >= 1) {
        if (isWater(seq.to)) {
          // Entering water: emerge onto the floor, THEN flood the surface up.
          seq.current = seq.to;
          seq.phase = 'SETTLE_IN';
          seq.settleStart = s.distance;
          seq.laneFrac = 0;
        } else {
          seq.current = seq.to;
          seq.from = seq.to = null;
          seq.phase = 'STEADY';
          seq.laneFrac = laneOf(seq.current);
        }
      }
    }

    // SETTLE_IN — entering water: out of the cave, flood the surface up from the floor
    // to its resting height; the monk rides it up from a run into a swim.
    else if (seq.phase === 'SETTLE_IN') {
      const p = clamp01((s.distance - seq.settleStart) / L);
      seq.laneFrac = lerp(0, 1, smooth(p));
      if (p >= 1) {
        seq.from = seq.to = null;
        seq.phase = 'STEADY';
        seq.laneFrac = 1;
      }
    }
    return seq;
  },

  _begin(s, from, to) {
    const seq = s.biomeSeq;
    seq.from = from;
    seq.to = to;
    seq.into = 0;
    if (isWater(from)) {
      // Leaving water: drain the surface down to the floor first, then run the cave.
      seq.phase = 'SETTLE_OUT';
      seq.settleStart = s.distance;
      seq.caveReset = false;
    } else {
      // On the ground already: straight into the cave; the water rise (if the
      // destination is water) plays out after, in SETTLE_IN.
      seq.phase = 'TRANSITION';
      seq.legStart = s.distance;
      seq.caveReset = true; // GameScreen consumes this to reseed the cave instance
    }
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

    // Water biomes get their surface line fed in so it floods/drains with laneFrac;
    // every other biome ignores the extra arg.
    const surfFor = (id) => (isWater(id) ? waterSurfaceY(h, seq.laneFrac) : undefined);

    // STEADY and the two water settles all draw a single full-screen biome — the only
    // difference is the water surface line, which surfFor() supplies from laneFrac.
    if (seq.phase !== 'TRANSITION') {
      const id = seq.current;
      inst[id]?.render(ctx, w, h, surfFor(id)); // self-scrolls on its own counter
      return;
    }

    // TRANSITION — the spatial wipe. The neighbouring biomes are clipped against the
    // cave's ORGANIC rock-mouth edges (not vertical lines), so the old/new biome meets
    // the tapered rock from both sides — no straight seam. A/B are the nominal vertical
    // edges, used only as cheap on-screen guards (the rock edge wobbles ±~520px of them).
    const cave = inst.cave;
    const { caveDist, entranceX: A, exitX: B } = caveEdges(seq, cave.journey);
    const entAt = (y) => cave.edgeScreenX('entrance', y, h, caveDist);
    const exitAt = (y) => cave.edgeScreenX('exit', y, h, caveDist);

    // OLD biome — everything LEFT of the entrance rock mouth.
    if (A > -600) this._clipSide(ctx, w, h, entAt, 'left', () => inst[seq.from]?.render(ctx, w, h, surfFor(seq.from)));
    // NEW biome — everything RIGHT of the exit rock mouth.
    if (B < w + 600) this._clipSide(ctx, w, h, exitAt, 'right', () => inst[seq.to]?.render(ctx, w, h, surfFor(seq.to)));
    // The cave — the rock region BETWEEN the two mouths, driven by run distance.
    this._clipBetween(ctx, w, h, entAt, exitAt, () => cave.render(ctx, w, h, caveDist));
  },

  // Clip to one side of an organic edge: 'left' = x < edge(y), 'right' = x > edge(y).
  _clipSide(ctx, w, h, edgeAt, side, draw) {
    const steps = 24;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(side === 'left' ? 0 : w, 0);
    for (let i = 0; i <= steps; i++) { const y = (h * i) / steps; ctx.lineTo(edgeAt(y), y); }
    ctx.lineTo(side === 'left' ? 0 : w, h);
    ctx.closePath();
    ctx.clip();
    draw();
    ctx.restore();
  },

  // Clip to the band between the entrance (left) and exit (right) rock edges.
  _clipBetween(ctx, w, h, leftAt, rightAt, draw) {
    const steps = 24;
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) { const y = (h * i) / steps; const x = leftAt(y); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    for (let i = steps; i >= 0; i--) { const y = (h * i) / steps; ctx.lineTo(rightAt(y), y); }
    ctx.closePath();
    ctx.clip();
    draw();
    ctx.restore();
  },
};
