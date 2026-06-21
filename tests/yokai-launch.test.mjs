import test from 'node:test';
import assert from 'node:assert/strict';
import { solveLaunch } from '../src/systems/yokaiLaunch.js';

// Self-check for the ballistic solver: reproduce the two worked examples in
// YOKAI_FRUIT_DESIGN §4.6. If these drift, the algebra is wrong — fix the solver
// before anything (shapes, director) depends on it.

const close = (actual, expected, eps = 1e-4) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);

test('side Train member crosses flat: vx ≈ -12.3, vy = 0 (DESIGN §4.6)', () => {
  // spawn just off the right edge, target in the slice zone at the same height,
  // screen-anchored (scroll 0), flat (gs 0).
  const { vx, vy, gravity, T } = solveLaunch({
    spawn: { x: 1320, y: 300 },
    target: { x: 360, y: 300 },
    route: 'side',
    T: 78,
    scroll: 0,
    sideGravity: 0,
  });

  close(vx, -960 / 78); // = -12.3076…
  close(vx, -12.3, 0.01); // matches the doc's rounded value
  assert.equal(vy, 0); // flat cross
  assert.equal(gravity, 0);
  assert.equal(T, 78);
});

test('bottom Fountain member apex on target: T ≈ 50.5, vy ≈ -20.2 (DESIGN §4.6)', () => {
  // launched from below; fixing g = 0.40 DERIVES the airtime to the apex.
  const { vx, vy, gravity, T } = solveLaunch({
    spawn: { x: 700, y: 760 },
    target: { x: 360, y: 250 },
    route: 'bottom',
    scroll: 0,
    gravity: 0.4,
  });

  const Tapex = Math.sqrt(2550); // 2·rise/g = 2·510/0.40
  close(T, Tapex); // = 50.4975…
  close(T, 50.5, 0.01);
  close(vy, -0.4 * Tapex); // = -20.199…
  close(vy, -20.2, 0.01);
  close(vx, -340 / Tapex); // = -6.733…
  close(vx, -6.7, 0.05); // doc rounds -6.733 → "≈ -6.7"
  assert.equal(gravity, 0.4);
});

test('world-anchored shapes subtract scroll from vx exactly once (DESIGN §4.4)', () => {
  const base = solveLaunch({
    spawn: { x: 1320, y: 300 },
    target: { x: 360, y: 300 },
    route: 'side',
    T: 78,
    scroll: 0,
    sideGravity: 0,
  });
  const moving = solveLaunch({
    spawn: { x: 1320, y: 300 },
    target: { x: 360, y: 300 },
    route: 'side',
    T: 78,
    scroll: 5,
    sideGravity: 0,
  });
  close(moving.vx, base.vx - 5);
  assert.equal(moving.vy, base.vy); // scroll never touches vertical
});
