import { GROUND_HEIGHT, DEMON_CONFIG, YOKAI_WOVEN, GOLDEN } from '../config/constants.js';
import { randomYokaiFrom, getYokai, countActiveYokai } from '../data/yokai.js';
import { getYokaiShape } from '../data/yokaiShapes.js';
import { solveLaunch } from './yokaiLaunch.js';
import { StumbleSystem } from './StumbleSystem.js';
import { ArrowSystem } from './ArrowSystem.js';
import { CombatSystem } from './CombatSystem.js';

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
    const yokaiMembers = shape.members.filter((member) => member.kind !== 'arrowTrap');
    if (shape.trap && (room < yokaiMembers.length || !ArrowSystem.canSpawnTrap(s))) return [];
    const members = shape.trap ? shape.members : yokaiMembers.slice(0, room);

    s.activeShape = { id: shape.id, route: shape.route, tier: shape.tier, members: members.filter((member) => member.kind !== 'arrowTrap').length };
    if (shape.trap) s.activeShape.trap = true;

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
      if (m.kind === 'arrowTrap') {
        ArrowSystem.spawnTrap(s, {
          launch: { x: spawn.x, y: spawn.y, vx: launch.vx, vy: launch.vy, gravity: launch.gravity },
          tier: shape.tier,
          source: `shape:${shape.id}`,
        });
        continue;
      }
      const spawnArgs = {
        ...options,
        route,
        source: options.source || 'shape',
        launch: { x: spawn.x, y: spawn.y, vx: launch.vx, vy: launch.vy, gravity: launch.gravity },
      };
      // Staggered arrival (YOKAI_FRUIT_DESIGN §5 rhythm): a member may carry a
      // `delay` in 60fps frames. The trajectory is self-contained, so holding its
      // launch by `delay` simply shifts its whole arc later — its apex still lands
      // on the slice zone, just `delay` frames after the delay-0 members. tick()
      // releases the queue on the same `dt` clock. delay 0 ⇒ spawn now (the cap
      // clamp above already reserved this slot), so shapes without delays are
      // byte-for-byte unchanged.
      if ((m.delay || 0) > 0) {
        (s.yokaiQueue ||= []).push({ spawnArgs, delay: m.delay });
        continue;
      }
      const entity = this.spawn(s, canvasWidth, canvasHeight, spawnArgs);
      if (entity) spawned.push(entity);
    }
    return spawned;
  },

  // Spawn the golden treat (FN pomegranate). One at a time. Unlike before, it now
  // FLIES BY in a ballistic arc like any other yokai — launched from below so its
  // apex lands in the slice zone (solveLaunch). Miss the first cut and it falls back
  // off-screen, gone, no penalty. The arm→frenzy→burst lifecycle is driven by
  // tickGolden once a slash arms it; until then it's a plain projectile.
  spawnGolden(s, canvasWidth, canvasHeight, options = {}) {
    if (s.demons.some((d) => d.golden)) return null;
    const yokai = getYokai('golden');
    const radius = DEMON_CONFIG.radius * (yokai.galleryRadius / 35) * GOLDEN.radiusMult;
    const spawnX = canvasWidth * (DEMON_CONFIG.bottomMinXFrac ?? 0.3);
    const apex = {
      x: canvasWidth * (GOLDEN.arcXFrac ?? 0.62),
      y: (canvasHeight - GROUND_HEIGHT) * (DEMON_CONFIG.sliceZone?.yFrac ?? 0.42),
    };
    const launch = solveLaunch({
      spawn: { x: spawnX, y: canvasHeight + radius + 40 },
      target: apex, route: 'bottom',
    });
    const entity = {
      id: Math.random(),
      x: spawnX, y: canvasHeight + radius + 40,
      vx: launch.vx, vy: launch.vy, gravity: launch.gravity,
      route: 'golden', source: options.source || 'golden', radius,
      type: 'golden', golden: true, rot: 0, rv: yokai.rotationSpeed,
      bob: Math.random() * Math.PI * 2,
      armed: false, bursting: false, hits: 0, frenzyT: 0, hitCd: 0,
      stumbled: false, sliced: false, cut: null,
    };
    s.demons.push(entity);
    recordSpawn(s, 'golden', entity.source, yokai.id);
    return entity;
  },

  // Drive one golden treat for a frame. Returns true when the entity should be
  // removed (it burst, or it flew off-screen un-armed). Phases:
  //   un-armed → integrate the ballistic arc; cull once it has left the screen
  //     (a missed treat, no penalty), like any other fly-by yokai.
  //   armed → frozen in place (CombatSystem.tryHitGolden zeroed its velocity) so the
  //     player scrubs it under the frenzy slow-mo. Run the real-time frenzy
  //     countdown (on unscaledDt, so ~zero time-scale doesn't stall it); on expiry or
  //     hit-cap, BURST.
  tickGolden(s, d, dt, unscaledDt, canvasWidth, canvasHeight) {
    // Armed scrub runs in ~zero time-scale, so the hit-repeat gate counts wall-clock
    // (unscaledDt) — otherwise you'd only land a couple of hits in the whole window.
    if (d.hitCd > 0) d.hitCd -= d.armed ? unscaledDt : dt;
    d.rot += d.rv * dt;
    if (!d.armed) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += d.gravity * dt;
      const off = d.y - d.radius > canvasHeight + 80 || d.x + d.radius < -80 || d.x - d.radius > canvasWidth + 80;
      return off;
    }
    d.bob += 0.08 * dt;
    d.y += Math.sin(d.bob) * 0.6 * dt;
    d.frenzyT -= unscaledDt;
    if (d.frenzyT <= 0 || (d.hits || 0) >= GOLDEN.hitCap) {
      CombatSystem.burstGolden(s, d, canvasWidth, canvasHeight);
      return true;
    }
    return false;
  },

  tick(state, dt, unscaledDt, canvasWidth, canvasHeight) {
    const s = state;

    // Release staggered shape members whose delay has elapsed (rhythm). Counts down
    // on the same `dt` as live yokai, so the beat slows with slow-motion. Each member
    // still honours the woven cap at emit time; if the roster is full when it comes
    // due, it's dropped (consistent with spawnShape's cap clamp). Spliced from the end.
    if (s.yokaiQueue && s.yokaiQueue.length) {
      for (let i = s.yokaiQueue.length - 1; i >= 0; i--) {
        const q = s.yokaiQueue[i];
        q.delay -= dt;
        if (q.delay > 0) continue;
        if (countActiveYokai(s.demons) < YOKAI_WOVEN.cap) {
          this.spawn(s, canvasWidth, canvasHeight, q.spawnArgs);
        }
        s.yokaiQueue.splice(i, 1);
      }
    }

    for (let i = s.demons.length - 1; i >= 0; i--) {
      const d = s.demons[i];

      // The golden treat runs its own lifecycle (rise/hover/frenzy/burst) and never
      // touches the monk or the generic ballistic/cull paths.
      if (d.golden) {
        if (this.tickGolden(s, d, dt, unscaledDt, canvasWidth, canvasHeight)) s.demons.splice(i, 1);
        continue;
      }

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
        StumbleSystem.register(s, { source: 'yokai' });
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
