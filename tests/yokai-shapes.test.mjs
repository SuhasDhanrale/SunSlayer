import test from 'node:test';
import assert from 'node:assert/strict';
import { DemonSystem } from '../src/systems/DemonSystem.js';
import { getYokaiShape } from '../src/data/yokaiShapes.js';
import { countActiveYokai } from '../src/data/yokai.js';
import { DEMON_CONFIG, GROUND_HEIGHT, YOKAI_WOVEN } from '../src/config/constants.js';

// Phase 2 + 3: the explicit-launch spawn path and the shape spawner. The ballistic
// algebra itself is checked in yokai-launch.test.mjs — here we verify the WIRING:
// that an explicit launch lands verbatim, and that spawnShape resolves each member's
// target against the slice zone so the cluster converges into the authored geometry.

const W = 1280;
const H = 720;
const MARGIN = DEMON_CONFIG.radius + 10;

function makeState() {
  return {
    demons: [],
    monk: { x: 150, y: 600 },
    stumble: { count: 0, slowTimer: 0 },
    boss: { active: false },
    arrowTrap: null,
    arrowBurst: null,
    debris: [],
    yokaiTrack: {
      recentTypes: [],
      unlockedTypes: ['oni', 'kitsune', 'noface'],
      stats: { spawned: 0, contacts: 0, escaped: 0, routes: {}, sources: {}, types: {} },
    },
  };
}

const close = (actual, expected, eps = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected} (±${eps})`);

const sliceCenter = () => ({
  x: W * DEMON_CONFIG.sliceZone.xFrac,
  y: (H - GROUND_HEIGHT) * DEMON_CONFIG.sliceZone.yFrac,
});

test('Phase 2 — explicit launch places a yokai at exact pos + vel, skipping random math', () => {
  const s = makeState();
  const launch = { x: 900, y: 300, vx: -8, vy: -4, gravity: 0.4 };
  const e = DemonSystem.spawn(s, W, H, { launch, route: 'side', source: 'shape', random: () => 0.5 });

  assert.equal(e.x, 900);
  assert.equal(e.y, 300);
  assert.equal(e.vx, -8);
  assert.equal(e.vy, -4);
  assert.equal(e.gravity, 0.4);
  assert.equal(e.route, 'side');
  assert.equal(e.source, 'shape');
  assert.ok(e.type, 'still picks a yokai type');
  assert.ok(e.radius > 0, 'still sized');

  // recordSpawn still fires on the explicit path.
  assert.equal(s.yokaiTrack.stats.spawned, 1);
  assert.equal(s.yokaiTrack.stats.routes.side, 1);
  assert.equal(s.yokaiTrack.stats.sources.shape, 1);
  assert.equal(s.demons.length, 1);
});

test('Phase 3 — side Train members converge into a horizontal line at the slice zone', () => {
  const s = makeState();
  const spawned = DemonSystem.spawnShape(s, W, H, 'train');
  const shape = getYokaiShape('train');
  const center = sliceCenter();
  const T = DEMON_CONFIG.defaultT.side;

  assert.equal(spawned.length, shape.members.length);

  spawned.forEach((e, i) => {
    const target = { x: center.x + shape.members[i].dx, y: center.y + shape.members[i].dy };
    // All side members enter from just off the right edge at their target height.
    close(e.x, W + MARGIN);
    assert.equal(e.source, 'shape');
    assert.equal(e.route, 'side');
    // Continuous trajectory at T (the solver's model) lands on the member's target.
    close(e.x + e.vx * T, target.x, 1e-4);
    close(e.y + e.vy * T + 0.5 * e.gravity * T * T, target.y, 1e-4);
  });

  // dy is uniform (0) → every member shares the arrival height: a flat sweep.
  const ys = spawned.map((e) => e.y + e.vy * T + 0.5 * e.gravity * T * T);
  ys.forEach((y) => close(y, ys[0], 1e-6));

  assert.deepEqual(s.activeShape, { id: 'train', route: 'side', tier: 'RISE', members: 4 });
});

test('Phase 3 — bottom Pop arcs up so its apex lands on the slice zone', () => {
  const s = makeState();
  const [e] = DemonSystem.spawnShape(s, W, H, 'pop');
  const center = sliceCenter();

  assert.equal(e.route, 'bottom');
  close(e.y, H + MARGIN); // launched from below the screen
  assert.ok(e.vy < 0, 'thrown upward');
  assert.equal(e.gravity, DEMON_CONFIG.gravity); // global arc gravity

  // Apex (vy crosses 0) lands on the target — the "catch it at the top" beat.
  const tApex = -e.vy / e.gravity;
  close(e.x + e.vx * tApex, center.x, 1e-4);
  close(e.y + e.vy * tApex + 0.5 * e.gravity * tApex * tApex, center.y, 1e-4);
});

test('Phase 3 — Geyser launches every member from one column (fanned vx)', () => {
  const s = makeState();
  const spawned = DemonSystem.spawnShape(s, W, H, 'geyser');
  const center = sliceCenter();

  // `from: 'center'` ⇒ a single launch column; the spread comes entirely from vx.
  spawned.forEach((e) => close(e.x, center.x, 1e-6));
  const vxs = new Set(spawned.map((e) => e.vx.toFixed(3)));
  assert.ok(vxs.size > 1, 'horizontal velocities fan out');
});

test('Phase 3 — spawnShape honours the live woven cap', () => {
  const s = makeState();
  // Fill the roster so exactly one slot remains under the cap.
  for (let i = 0; i < YOKAI_WOVEN.cap - 1; i++) s.demons.push({ sliced: false });

  const spawned = DemonSystem.spawnShape(s, W, H, 'train'); // 4 members want in
  assert.equal(spawned.length, 1, 'only the remaining slot is filled');
  assert.ok(countActiveYokai(s.demons) <= YOKAI_WOVEN.cap, 'never exceeds the cap');
});

test('sealed-train keeps its authored quiver member and does not charge it to the Yokai cap', () => {
  const s = makeState();
  const spawned = DemonSystem.spawnShape(s, W, H, 'sealed-train');

  assert.equal(spawned.length, 2);
  assert.equal(countActiveYokai(s.demons), 2);
  assert.ok(s.arrowTrap, 'the complete formation includes its sealed quiver');
  assert.equal(s.arrowTrap.tier, 'RISE');
  assert.deepEqual(s.activeShape, { id: 'sealed-train', route: 'side', tier: 'RISE', members: 2, trap: true });
});

test('sealed formations defer whole when every required Yokai slot is not available', () => {
  const s = makeState();
  for (let i = 0; i < YOKAI_WOVEN.cap - 1; i++) s.demons.push({ sliced: false });

  const before = s.demons.length;
  assert.deepEqual(DemonSystem.spawnShape(s, W, H, 'sealed-train'), []);
  assert.equal(s.demons.length, before, 'no partial Yokai formation is emitted');
  assert.equal(s.arrowTrap, null, 'the quiver is deferred with the formation');
});

test('Phase 3 — unknown shape id spawns nothing', () => {
  const s = makeState();
  assert.deepEqual(DemonSystem.spawnShape(s, W, H, 'nope'), []);
  assert.equal(s.demons.length, 0);
});

test('rhythm — delayed members queue at spawn and release on the dt clock', () => {
  const s = makeState();
  // Cascade staggers its three arcs at delays 0 / 9 / 18 frames.
  const spawned = DemonSystem.spawnShape(s, W, H, 'cascade');

  // Only the delay-0 member spawns immediately; the other two wait in the queue.
  assert.equal(spawned.length, 1, 'just the delay-0 member lands now');
  assert.equal(s.demons.length, 1);
  assert.equal(s.yokaiQueue.length, 2, 'the two delayed arcs are queued');

  // 10 frames in: the delay-9 member is due and emits; the delay-18 one still waits.
  DemonSystem.tick(s, 10, 10, W, H);
  assert.equal(s.yokaiQueue.length, 1);

  // 10 more frames: the last member's delay elapses and it joins the roster.
  DemonSystem.tick(s, 10, 10, W, H);
  assert.equal(s.yokaiQueue.length, 0, 'the whole shape has now arrived');
});
