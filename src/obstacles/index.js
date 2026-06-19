import OBSTACLE_SPECS from './specs/index.js';
import { drawGalleryParticles } from './helpers.js';

export const OBSTACLE_LOCAL_WIDTH = 300;
export const OBSTACLE_LOCAL_HEIGHT = 200;

const SPEC_BY_ID = Object.fromEntries(OBSTACLE_SPECS.map((spec) => [spec.id, spec]));

export function getObstacleSpec(specId) {
  return SPEC_BY_ID[specId] || null;
}

export function createObstacleSim(specId) {
  const spec = getObstacleSpec(specId);
  if (!spec) throw new Error(`Unknown obstacle spec: ${specId}`);
  return {
    isCut: false,
    cutAngle: 0,
    cutX: 0,
    cutY: 0,
    particles: [],
    pieces: [],
    swipePoints: [],
    timeSinceCut: 0,
    time: 0,
    extra: spec.init(),
  };
}

export function attachObstacleSim(entity, specId, worldBox) {
  return {
    ...entity,
    specId,
    sim: createObstacleSim(specId),
    worldBox,
    cutLifetime: 0,
  };
}

function pointToLocal(obstacle, point) {
  const box = obstacle.worldBox;
  return {
    x: ((point.x - box.x) / box.width) * OBSTACLE_LOCAL_WIDTH,
    y: ((point.y - box.y) / box.height) * OBSTACLE_LOCAL_HEIGHT,
  };
}

function pointToWorld(obstacle, point) {
  const box = obstacle.worldBox;
  return {
    x: box.x + (point.x / OBSTACLE_LOCAL_WIDTH) * box.width,
    y: box.y + (point.y / OBSTACLE_LOCAL_HEIGHT) * box.height,
  };
}

export function trySliceObstacle(obstacle, worldP1, worldP2) {
  const spec = getObstacleSpec(obstacle.specId);
  if (!spec || !obstacle.sim || obstacle.sim.isCut) return { hit: false };

  const p1 = pointToLocal(obstacle, worldP1);
  const p2 = pointToLocal(obstacle, worldP2);
  const hit = spec.checkCut(p1, p2, obstacle.sim);
  if (!hit) return { hit: false };

  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  obstacle.sim.isCut = true;
  obstacle.sim.cutX = hit.x;
  obstacle.sim.cutY = hit.y;
  obstacle.sim.cutAngle = angle;
  obstacle.sim.timeSinceCut = 0;
  obstacle.resolved = true;
  obstacle.state = obstacle.state === 'armed' ? 'resolved' : obstacle.state;
  spec.onCut(obstacle.sim, hit.x, hit.y, angle);

  return { hit: true, local: hit, world: pointToWorld(obstacle, hit), angle };
}

export function tickObstacleSim(obstacle, frameDt) {
  if (!obstacle.sim) return;
  const sim = obstacle.sim;
  const step = Math.max(0, frameDt || 0);
  sim.time += step / 60;
  if (sim.isCut) {
    sim.timeSinceCut += step / 60;
    obstacle.cutLifetime = (obstacle.cutLifetime || 0) + step / 60;
  }

  sim.particles.forEach((p) => {
    p.x += p.vx * step;
    p.y += p.vy * step;
    if (p.gravity) p.vy += p.gravity * step;
    if (p.rotation !== undefined && p.rotSpeed !== undefined) {
      p.rotation += p.rotSpeed * step;
    }
    p.opacity -= p.decay * step;
  });
  sim.particles = sim.particles.filter((p) => p.opacity > 0);
}

function makeGameplayContext(ctx) {
  return new Proxy(ctx, {
    get(target, prop) {
      if (prop === 'fillRect') {
        return (x, y, width, height) => {
          const isGalleryBackdrop =
            Math.abs(x) < 0.001 &&
            Math.abs(y) < 0.001 &&
            Math.abs(width - OBSTACLE_LOCAL_WIDTH) < 0.001 &&
            Math.abs(height - OBSTACLE_LOCAL_HEIGHT) < 0.001;
          if (!isGalleryBackdrop) target.fillRect(x, y, width, height);
        };
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

export function drawObstacle(ctx, obstacle) {
  const spec = getObstacleSpec(obstacle.specId);
  if (!spec || !obstacle.sim || !obstacle.worldBox) return false;

  const box = obstacle.worldBox;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  ctx.translate(box.x, box.y);
  ctx.scale(box.width / OBSTACLE_LOCAL_WIDTH, box.height / OBSTACLE_LOCAL_HEIGHT);
  const gameplayCtx = makeGameplayContext(ctx);
  spec.draw(gameplayCtx, obstacle.sim, obstacle.sim.time);
  drawGalleryParticles(gameplayCtx, obstacle.sim.particles);
  ctx.restore();
  return true;
}

export function shouldCullObstacle(obstacle) {
  return obstacle.sim?.isCut && obstacle.cutLifetime > 4 && obstacle.sim.particles.length === 0;
}
