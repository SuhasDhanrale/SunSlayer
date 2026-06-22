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
//   members — { dx, dy, route?, delay? } offsets (dx right-positive, dy down-positive).
//             A member may override `route` so one shape spans both edges (Pincer).
//             `delay` (60fps frames, default 0) holds that member's launch so its
//             whole arc/cross arrives LATER — the shape lands in a rhythm instead of
//             all at once (DemonSystem queues it). Use it to turn a static cluster
//             into a "cut now or wait for the next beat" read; omit it for the
//             deliberate single-sweep shapes (Volley, Fan) where one stroke is the point.
//
// Shape members may set `kind:'arrowTrap'` to reserve a sealed quiver in the
// formation. Omitted kind means a normal Yokai, preserving existing shape data.
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

  // Authored inhibit read: stop the horizontal sweep at the sealed quiver.
  {
    id: 'sealed-train',
    route: 'side',
    tier: 'RISE',
    anchor: 'screen',
    trap: true,
    members: [
      { dx: -135, dy: 0 },
      { dx: 0, dy: 0, kind: 'arrowTrap' },
      { dx: 135, dy: 0 },
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

  // Peak inhibit read: split the tempting vertical multi-cut around the seal.
  {
    id: 'sealed-fan',
    route: 'side',
    tier: 'PEAK',
    anchor: 'screen',
    trap: true,
    members: [
      { dx: 0, dy: -220 },
      { dx: 0, dy: -110 },
      { dx: 0, dy: 0, kind: 'arrowTrap' },
      { dx: 0, dy: 110 },
      { dx: 0, dy: 220 },
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

  // ── Lob: a single arc whose apex lands off to one side — Pop with a lean, so the
  //    calm beat still asks for a small reach instead of a dead-center tap. (LULL)
  {
    id: 'lob',
    route: 'bottom',
    tier: 'LULL',
    anchor: 'screen',
    members: [{ dx: 110, dy: -10 }],
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

  // ── Volley: three arcs sharing one low arrival height → a flat line at the bottom
  //    of the band. One level sweep across the apexes catches all three. (RISE)
  {
    id: 'volley',
    route: 'bottom',
    tier: 'RISE',
    anchor: 'screen',
    members: [
      { dx: -130, dy: 40 },
      { dx: 0, dy: 40 },
      { dx: 130, dy: 40 },
    ],
  },

  // ── Cascade: stepped apexes that POP IN SEQUENCE left→right — a rolling diagonal you
  //    chase across the band, not a static line. The staggered `delay` is what makes it
  //    read differently from Volley's flat simultaneous sweep. (RISE)
  {
    id: 'cascade',
    route: 'bottom',
    tier: 'RISE',
    anchor: 'screen',
    members: [
      { dx: -150, dy: 70, delay: 0 },
      { dx: 0, dy: 0, delay: 9 },
      { dx: 150, dy: -70, delay: 18 },
    ],
  },

  // ── Surge: a HIGH-then-LOW two-beat — the high arc pops first, the low one a moment
  //    later, so the hand drops between them. The bottom-route take on High–Low, but as
  //    a rhythm you ride rather than a pair you can't take together. (RISE)
  {
    id: 'surge',
    route: 'bottom',
    tier: 'RISE',
    anchor: 'screen',
    members: [
      { dx: -50, dy: -90, delay: 0 },
      { dx: 50, dy: 90, delay: 12 },
    ],
  },

  // ── Crossfire: two arcs rise from below while one Yokai CROSSES IN from the side a
  //    beat later — mixed directions in one shape, so it isn't all floaty arcs. Read the
  //    pair going up, then catch the crosser sweeping through. (RISE)
  {
    id: 'crossfire',
    route: 'bottom',
    tier: 'RISE',
    anchor: 'screen',
    members: [
      { dx: -120, dy: 0, delay: 0 },
      { dx: 120, dy: 0, delay: 0 },
      { dx: 0, dy: -20, route: 'side', delay: 14 },
    ],
  },

  // ── Eruption: a volcano that ERUPTS OUTWARD — the center bursts first, the flanks a
  //    beat later, so it blooms across the band instead of arriving as one wall. The
  //    dense PEAK climax that still asks for a second read at the edges. (PEAK)
  {
    id: 'eruption',
    route: 'bottom',
    tier: 'PEAK',
    anchor: 'screen',
    members: [
      { dx: 0, dy: -80, delay: 0 },
      { dx: -100, dy: -30, delay: 8 },
      { dx: 100, dy: -30, delay: 8 },
      { dx: -200, dy: 40, delay: 16 },
      { dx: 200, dy: 40, delay: 16 },
    ],
  },

  // ── Spray: one column fanned into four tight high apexes — a fast, narrow Fountain
  //    that bunches the cut window at the top. (PEAK)
  {
    id: 'spray',
    route: 'bottom',
    tier: 'PEAK',
    anchor: 'screen',
    from: 'center',
    members: [
      { dx: -110, dy: -40 },
      { dx: -40, dy: -80 },
      { dx: 40, dy: -80 },
      { dx: 110, dy: -40 },
    ],
  },

  // ── Cluster: a tight diamond of apexes (high / low / two flanks) — the busiest
  //    bottom shape, asking for two reads rather than one clean sweep. (PEAK)
  {
    id: 'cluster',
    route: 'bottom',
    tier: 'PEAK',
    anchor: 'screen',
    members: [
      { dx: 0, dy: -90 },
      { dx: -120, dy: 0 },
      { dx: 120, dy: 0 },
      { dx: 0, dy: 90 },
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
  // FALL keeps the RISE vocabulary (lines/sweeps) so the comedown still shows
  // readable shapes decaying, instead of dropping back to LULL singles. The
  // intensity ramp-down already eases the cadence — the variety stays.
  FALL: ['RISE'],
};

export function shapesForPhase(phase) {
  const tiers = PHASE_TIERS[phase] || ['LULL'];
  const pool = YOKAI_SHAPES.filter((shape) => !shape.trap && tiers.includes(shape.tier));
  return pool.length ? pool : YOKAI_SHAPES.filter((shape) => !shape.trap && shape.tier === 'LULL');
}

export function trapShapeForPhase(phase) {
  return YOKAI_SHAPES.find((shape) => shape.trap && shape.tier === phase) || null;
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
