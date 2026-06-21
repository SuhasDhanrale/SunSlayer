import { GROUND_HEIGHT, DEMON_CONFIG, STUMBLE } from '../config/constants.js';
import { randomYokaiFrom } from '../data/yokai.js';

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

    if (route === 'side') {
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
