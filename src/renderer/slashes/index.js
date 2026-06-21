// Slash renderer registry. Maps each slash id to its pure trail + particle
// renderers and exposes single entry points the game can call. Imports zero
// React. Particle helpers are exposed for whenever a particle pool is wired in.

import { DEFAULT_SLASH_ID, getSlash } from '../../data/slashes.js';

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
export function drawSlashTrail(ctx, id, points, time = 0, comboTier = 0) {
  const tier = Math.max(0, Math.min(4, comboTier));
  if (tier > 0 && points.length > 1) {
    const accent = getSlash(id).accentColor;
    ctx.save();
    ctx.globalAlpha = 0.08 + tier * 0.045;
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = tier * 8;
    ctx.lineWidth = 12 + tier * 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    if (tier >= 2) {
      ctx.globalAlpha = 0.35 + tier * 0.08;
      ctx.fillStyle = tier >= 4 ? '#ffffff' : accent;
      const stride = Math.max(1, 5 - tier);
      for (let i = tier; i < points.length; i += stride) {
        const p = points[i];
        const pulse = 2 + tier + Math.sin(time * 0.02 + i) * 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, pulse), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
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
