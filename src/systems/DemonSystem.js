import { GROUND_HEIGHT, DEMON_CONFIG, STUMBLE, YOKAI_WOVEN } from '../config/constants.js';
import { randomYokaiFrom, countActiveYokai } from '../data/yokai.js';
import { getYokaiShape } from '../data/yokaiShapes.js';
import { solveLaunch } from './yokaiLaunch.js';

const distSq = (ax, ay, bx, by) => (bx - ax) ** 2 + (by - ay) ** 2;
const randomBetween = (rangeMin, rangeMax, random) => rangeMin + (rangeMax - rangeMin) * random();

const YOKAI_BAND_FRAC = { H: 0.15, A: 0.32, M: 0.49, L: 0.65 };

function chooseYokai(s, typeIds, random, waveTypes = []) {
  const recent = s.yokaiTrack?.recentTypes || [];
  let candidates = Array.isArray(typeIds) && typeIds.length ? [...typeIds] : ['oni'];

  if (recent.length >= 2 && recent.at(-1) === recent.at(-2) && candidates.length > 1) {
    candidates = candidates.filter((id) => id !== recent.at(-1));
  }
  if (waveTypes.length >= 2 && waveTypes.every((id) => id === waveTypes[0]) && candidates.length > 1) {
    candidates = candidates.filter((id) => id !== waveTypes[0]);
  }

  const yokai = randomYokaiFrom(candidates, random);
  if (s.yokaiTrack) {
    s.yokaiTrack.recentTypes ||= [];
    s.yokaiTrack.recentTypes.push(yokai.id);
    if (s.yokaiTrack.recentTypes.length > 3) s.yokaiTrack.recentTypes.shift();
  }
  return yokai;
}

function recordSpawn(s, route, source, type) {
  const stats = s.yokaiTrack?.stats;
  if (!stats) return;
  stats.spawned += 1;
  stats.routes[route] = (stats.routes[route] || 0) + 1;
  stats.sources[source] = (stats.sources[source] || 0) + 1;
  stats.types[type] = (stats.types[type] || 0) + 1;
}

// Fruit-Ninja style Yokai. The Mock Lab establishes two routes:
// - side: right-edge rush across an authored height band (80% default)
// - bottom: launch from below the screen in a gravity arc (20% default)
// Neither route is secretly aimed at the monk. Only natural physical contact
// stumbles; an intact Yokai leaving the screen is simply removed.
export const DemonSystem = {
  spawn(s, canvasWidth, canvasHeight, options = {}) {
    const random = options.random || Math.random;
    const typeIds = options.typeIds || s.yokaiTrack?.unlockedTypes || ['oni'];
    const yokai = options.yokai || chooseYokai(s, typeIds, random, options.waveTypes || []);
    const radius = DEMON_CONFIG.radius * (yokai.galleryRadius / 35) * (0.85 + random() * 0.4);
    const route = options.route || (random() < DEMON_CONFIG.sideWeight ? 'side' : 'bottom');
    const source = options.source || 'pattern';

    let x;
    let y;
    let vx;
    let vy;
    let gravity;

    if (options.launch) {
      // Explicit ballistic launch (the shape spawner, via solveLaunch): use the
      // solved spawn position + velocity verbatim and SKIP the random
      // route/position math. The caller still passes `route` so stats stay honest
      // and `gravity` carries the solver's per-route value (sideGravity for side,
      // global arc gravity for bottom). DESIGN §4–5, IMPL Phase 2.
      ({ x, y, vx, vy, gravity } = options.launch);
    } else if (route === 'side') {
      const minFrac = DEMON_CONFIG.sideMinYFrac ?? 0.15;
      const maxFrac = DEMON_CONFIG.sideMaxYFrac ?? 0.65;
      const rowFrac = YOKAI_BAND_FRAC[options.row];
      const frac = rowFrac == null ? randomBetween(minFrac, maxFrac, random) : Math.max(minFrac, Math.min(maxFrac, rowFrac));
      x = canvasWidth + radius + 10;
      y = (canvasHeight - GROUND_HEIGHT) * frac;
      vx = -randomBetween(DEMON_CONFIG.sideMinSpeedX ?? 7, DEMON_CONFIG.sideMaxSpeedX ?? 12, random);
      vy = (random() - 0.5) * 2 * (DEMON_CONFIG.sideDriftY ?? 1);
      gravity = DEMON_CONFIG.sideGravity ?? 0.02;
    } else {
      x = canvasWidth * randomBetween(DEMON_CONFIG.bottomMinXFrac ?? 0.25, DEMON_CONFIG.bottomMaxXFrac ?? 0.75, random);
      y = canvasHeight + radius + 10;
      vx = (random() - 0.5) * (DEMON_CONFIG.bottomDriftX ?? 3);
      vy = -randomBetween(DEMON_CONFIG.minSpeedY, DEMON_CONFIG.maxSpeedY, random);
      gravity = DEMON_CONFIG.gravity;
    }

    const entity = {
      id: random(),
      x,
      y,
      vx,
      vy,
      gravity,
      route,
      source,
      radius,
      type: yokai.id,
      rot: 0,
      rv: yokai.rotationSpeed * (0.75 + random() * 0.5),
      stumbled: false,
      sliced: false,
      cut: null,
    };
    s.demons.push(entity);
    recordSpawn(s, route, source, yokai.id);
    return entity;
  },

  spawnWave(s, canvasWidth, canvasHeight, count, options = {}) {
    const spawned = [];
    const waveTypes = [];
    for (let i = 0; i < count; i++) {
      const route = options.routes?.[i] || options.route;
      const entity = this.spawn(s, canvasWidth, canvasHeight, { ...options, route, waveTypes });
      spawned.push(entity);
      waveTypes.push(entity.type);
    }
    return spawned;
  },

  // Spawn an authored Yokai SHAPE (DESIGN §5 / IMPL Phase 3). Resolves the shape's
  // target offsets against the tunable slice-zone center, runs the ballistic solver
  // per member, and spawns each through the explicit-launch path so the cluster
  // converges into the intended geometry where it's cleanly sliceable.
  //
  // Honours the live woven cap: a shape never pushes the active Yokai count past
  // YOKAI_WOVEN.cap — surplus members are dropped from the end. Sets s.activeShape
  // for the debug overlay (Phase 4) to read; gameplay never branches on it.
  spawnShape(s, canvasWidth, canvasHeight, shapeId, options = {}) {
    const shape = getYokaiShape(shapeId);
    if (!shape) return [];

    const center = {
      x: canvasWidth * (DEMON_CONFIG.sliceZone?.xFrac ?? 0.34),
      y: (canvasHeight - GROUND_HEIGHT) * (DEMON_CONFIG.sliceZone?.yFrac ?? 0.5),
    };
    const defaultT = DEMON_CONFIG.defaultT || { side: 78, bottom: 78 };
    const margin = DEMON_CONFIG.radius + 10;

    // Never push the active roster past the woven cap — surplus members drop off
    // the end (slice clamps its own end index, so `room` alone is enough).
    const room = Math.max(0, YOKAI_WOVEN.cap - countActiveYokai(s.demons));
    const members = shape.members.slice(0, room);

    s.activeShape = { id: shape.id, route: shape.route, tier: shape.tier, members: members.length };

    const spawned = [];
    for (const m of members) {
      const route = m.route || shape.route;
      const target = { x: center.x + (m.dx || 0), y: center.y + (m.dy || 0) };
      const scroll = shape.anchor === 'world' ? s.cameraSpeed || 0 : 0;

      // Side members cross from the right edge at the member's own height; bottom
      // members rise from below — either each below its own apex (Fountain) or all
      // from the slice-zone column so their vx fans out (Geyser, `from: 'center'`).
      const spawn =
        route === 'side'
          ? { x: canvasWidth + margin, y: target.y }
          : { x: shape.from === 'center' ? center.x : target.x, y: canvasHeight + margin };

      const T = m.T || shape.T || defaultT[route] || 78;
      const launch = solveLaunch({ spawn, target, route, T, scroll });
      const entity = this.spawn(s, canvasWidth, canvasHeight, {
        ...options,
        route,
        source: options.source || 'shape',
        launch: { x: spawn.x, y: spawn.y, vx: launch.vx, vy: launch.vy, gravity: launch.gravity },
      });
      if (entity) spawned.push(entity);
    }
    return spawned;
  },

  tick(state, dt, unscaledDt, canvasWidth, canvasHeight) {
    const s = state;

    for (let i = s.demons.length - 1; i >= 0; i--) {
      const d = s.demons[i];

      if (d.sliced && d.cut) {
        const cut = d.cut;
        if (cut.phase === 'contact') {
          cut.contactTicks += 1;
          if (cut.contactTicks > 1) cut.phase = 'released';
        }

        if (cut.phase === 'released') {
          cut.age += unscaledDt / 60;
          for (const piece of [cut.negative, cut.positive]) {
            piece.x += piece.vx * unscaledDt;
            piece.y += piece.vy * unscaledDt;
            piece.vy += DEMON_CONFIG.gravity * unscaledDt;
            piece.rot += piece.rv * unscaledDt;
          }
        }

        const belowScreen = d.y + Math.min(cut.negative.y, cut.positive.y) > canvasHeight + 140;
        if (cut.age >= 0.65 || belowScreen) s.demons.splice(i, 1);
        continue;
      }

      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += (d.gravity ?? DEMON_CONFIG.gravity) * dt;
      d.rot += d.rv * dt;

      if (!d.stumbled && distSq(d.x, d.y, s.monk.x, s.monk.y - 20) < (d.radius + 25) ** 2) {
        d.stumbled = true;
        s.stumble.count += 1;
        s.stumble.slowTimer = STUMBLE.slowDuration;
        s.shake = 12;
        if (s.yokaiTrack?.stats) s.yokaiTrack.stats.contacts += 1;
        s.demons.splice(i, 1);
        continue;
      }

      if (d.y > canvasHeight + 120 || d.x < -120 || d.x > canvasWidth + 240) {
        if (s.yokaiTrack?.stats) s.yokaiTrack.stats.escaped += 1;
        s.demons.splice(i, 1);
      }
    }

  },
};
