// Yokai shape library — the arrangement vocabulary (YOKAI_FRUIT_DESIGN §5).
//
// Pure data, the yokai analogue of patterns.js. Each shape is a set of TARGET
// OFFSETS from the slice-zone center; the ballistic solver (yokaiLaunch.js) turns
// every member into a launch so the cluster CONVERGES into this geometry in the
// slice zone, sliceable together. Tuning member spacing + `T` until one stroke
// catches the cluster is the make-or-break work (DESIGN §5 warning) — that lives
// in the Phase 4 debug rig, not here.
//
// Field reference:
//   id      — stable key, also the overlay/debug label (uppercased).
//   route   — 'side' (right-edge cross) | 'bottom' (arc from below). DESIGN §3.
//   tier    — intensity phase this shape belongs to: LULL | RISE | PEAK | FALL.
//             Phase 6 (director) selects shapes by tier; unused until then.
//   anchor  — 'screen' (stays put on screen, speed-invariant) | 'world' (scrolls
//             with the lane; the solver compensates with -scroll on vx). DESIGN §4.4.
//   T       — arrival time in 60fps FRAMES (the reaction window). Omit to fall back
//             to config.demons.defaultT[route]. Ignored for bottom members, whose
//             airtime is DERIVED from the fixed gravity + rise (DESIGN §4.3).
//   from    — bottom-route launch origin: 'center' fires every member from the
//             slice-zone column so their vx fans out (Geyser); omitted/'target'
//             launches each below its own apex (Fountain). DESIGN §5.
//   members — { dx, dy, route? } offsets (dx right-positive, dy down-positive).
//             A member may override `route` so one shape spans both edges (Pincer).
//
// dx/dy are in px, relative to the slice-zone center the spawner resolves from
// config.demons.sliceZone. No literals here duplicate a config value (CLAUDE.md
// data-vs-config rule): geometry is data, the anchor/T defaults are config.
export const YOKAI_SHAPES = [
  // ── Single band: the teaching filler. One yokai, dead center. (LULL)
  {
    id: 'single',
    route: 'side',
    tier: 'LULL',
    anchor: 'screen',
    members: [{ dx: 0, dy: 0 }],
  },

  // ── Train: same dy, spread dx → a horizontal line at arrival. One flat sweep. (RISE)
  {
    id: 'train',
    route: 'side',
    tier: 'RISE',
    anchor: 'screen',
    members: [
      { dx: -165, dy: 0 },
      { dx: -55, dy: 0 },
      { dx: 55, dy: 0 },
      { dx: 165, dy: 0 },
    ],
  },

  // ── Stair: stepped dx & dy → a diagonal line. One diagonal arc. (RISE)
  {
    id: 'stair',
    route: 'side',
    tier: 'RISE',
    anchor: 'screen',
    members: [
      { dx: -150, dy: -120 },
      { dx: -50, dy: -40 },
      { dx: 50, dy: 40 },
      { dx: 150, dy: 120 },
    ],
  },

  // ── Fan: shared arrival, dy spread across bands → vertical column. One long
  //    stroke (the FN fan-of-5). DESIGN §5 / Phase 3 worked example. (PEAK)
  {
    id: 'fan',
    route: 'side',
    tier: 'PEAK',
    anchor: 'screen',
    members: [
      { dx: 0, dy: -180 },
      { dx: 0, dy: -60 },
      { dx: 0, dy: 60 },
      { dx: 0, dy: 180 },
    ],
  },

  // ── High–Low: one HIGH + one LOW, same arrival. You CAN'T take both in one
  //    short stroke — a deliberate decision, not a combo. DESIGN §5. (RISE)
  {
    id: 'highlow',
    route: 'side',
    tier: 'RISE',
    anchor: 'screen',
    members: [
      { dx: 0, dy: -150 },
      { dx: 0, dy: 150 },
    ],
  },

  // ── Pop: a single bottom arc, apex in the slice band. A breather. (LULL)
  {
    id: 'pop',
    route: 'bottom',
    tier: 'LULL',
    anchor: 'screen',
    members: [{ dx: 0, dy: 0 }],
  },

  // ── Fountain: each member rises below its own apex; apexes spread across the
  //    band → multi-cut at the top. DESIGN §5. (PEAK)
  {
    id: 'fountain',
    route: 'bottom',
    tier: 'PEAK',
    anchor: 'screen',
    members: [
      { dx: -180, dy: 20 },
      { dx: -60, dy: -40 },
      { dx: 60, dy: -40 },
      { dx: 180, dy: 20 },
    ],
  },

  // ── Geyser: one launch column, fanned vx → apexes spread across the top. One
  //    sweep across the top catches them. DESIGN §5. (RISE/PEAK)
  {
    id: 'geyser',
    route: 'bottom',
    tier: 'RISE',
    anchor: 'screen',
    from: 'center',
    members: [
      { dx: -170, dy: 0 },
      { dx: -55, dy: -60 },
      { dx: 55, dy: -60 },
      { dx: 170, dy: 0 },
    ],
  },

  // ── Pincer: both edges at once — the "swarm from both sides" burst. Per-member
  //    `route` overrides the shape route so it spans side + bottom. DESIGN §5. (PEAK)
  {
    id: 'pincer',
    route: 'side',
    tier: 'PEAK',
    anchor: 'screen',
    members: [
      { dx: 40, dy: -130, route: 'side' },
      { dx: 40, dy: 130, route: 'side' },
      { dx: -120, dy: 30, route: 'bottom' },
      { dx: 120, dy: 30, route: 'bottom' },
    ],
  },
];

export const YOKAI_SHAPES_BY_ID = Object.fromEntries(YOKAI_SHAPES.map((shape) => [shape.id, shape]));

export function getYokaiShape(id) {
  return YOKAI_SHAPES_BY_ID[id] || null;
}

// Phase 6 — which shapes are eligible at each yokai intensity phase. The director
// (RunDirector.tickShapes) reads this so shapes ESCALATE with the curve: LULL
// fires gentle singles, RISE the readable lines/sweeps, PEAK the dense climax
// clusters; FALL eases back to LULL-tier shapes. The mapping is by the shape's
// own `tier` field (the data), never a hardcoded id list — add a shape with a
// tier and it joins the right phase automatically.
const PHASE_TIERS = {
  LULL: ['LULL'],
  RISE: ['RISE'],
  PEAK: ['PEAK'],
  FALL: ['LULL'],
};

export function shapesForPhase(phase) {
  const tiers = PHASE_TIERS[phase] || ['LULL'];
  const pool = YOKAI_SHAPES.filter((shape) => tiers.includes(shape.tier));
  return pool.length ? pool : YOKAI_SHAPES.filter((shape) => shape.tier === 'LULL');
}

// Pick one shape for the phase, avoiding an immediate repeat of `excludeId` when
// the pool allows it (so a phase with >1 shape doesn't fire the same one twice).
export function pickShapeForPhase(phase, random = Math.random, excludeId = null) {
  const pool = shapesForPhase(phase);
  if (!pool.length) return null;
  let choices = excludeId && pool.length > 1 ? pool.filter((shape) => shape.id !== excludeId) : pool;
  if (!choices.length) choices = pool;
  return choices[Math.floor(random() * choices.length)] || null;
}
