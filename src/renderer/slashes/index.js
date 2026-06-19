// Slash renderer registry. Maps each slash id to its pure trail + particle
// renderers and exposes single entry points the game can call. Imports zero
// React. Particle helpers are exposed for whenever a particle pool is wired in.

import { DEFAULT_SLASH_ID, slashForCombo } from '../../data/slashes.js';

import * as wind from './wind.js';
import * as water from './water.js';
import * as thunder from './thunder.js';
import * as flame from './flame.js';

const SLASH_RENDERERS = {
  [wind.id]: wind,
  [water.id]: water,
  [thunder.id]: thunder,
  [flame.id]: flame,
};

const resolve = (id) => SLASH_RENDERERS[id] || SLASH_RENDERERS[DEFAULT_SLASH_ID];

/** Draw the elemental swipe trail for `id` along `points` ([{x,y}, …]). */
export function drawSlashTrail(ctx, id, points, time = 0) {
  resolve(id).drawTrail(ctx, points, time);
}

/** Spawn one elemental particle for `id`. Returns a particle object. */
export function spawnSlashParticle(ctx_unused, id, x, y, angle = 0) {
  return resolve(id).spawnParticle(x, y, angle);
}

/** Advance a particle; returns false when it has expired. */
export function updateSlashParticle(id, p) {
  return resolve(id).updateParticle(p);
}

/** Render a single elemental particle. */
export function drawSlashParticle(ctx, id, p, time = 0) {
  resolve(id).drawParticle(ctx, p, time);
}

export { slashForCombo };
