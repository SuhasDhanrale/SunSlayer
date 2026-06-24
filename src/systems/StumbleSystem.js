import { STUMBLE } from '../config/constants.js';
import { FloatingTextSystem } from './FloatingTextSystem.js';

// One physical collision can involve several overlapping entities. Centralizing
// registration keeps that contact from spending multiple Samurai pressure steps.
export const StumbleSystem = {
  register(state, { source = 'unknown', slowDuration = STUMBLE.slowDuration } = {}) {
    const s = state;
    s.stumble ||= { count: 0, slowTimer: 0, incidentGraceTimer: 0 };

    // Overlapping contacts from one physical hit still debounce. The post-mercy
    // runway no longer eats stumbles: the two-stage forgiveness (watching ->
    // mercy duel) IS the mercy, so once it's spent a fresh hit must charge the
    // Samurai directly. The old silent grace read as an unresponsive bug — the
    // third stumble would "wait a few seconds, then come". The post-mercy
    // graceTimer still earns its keep by pausing new spawns (see GameScreen).
    if ((s.stumble.incidentGraceTimer || 0) > 0) return false;

    s.stumble.count = (s.stumble.count || 0) + 1;
    s.stumble.slowTimer = Math.max(s.stumble.slowTimer || 0, slowDuration);
    s.stumble.incidentGraceTimer = STUMBLE.incidentGrace || 90;
    s.stumble.lastSource = source;
    // "MISS!" pops above the monk's head on every accepted stumble (he took the hit).
    if (s.monk) FloatingTextSystem.miss(s, s.monk.x, s.monk.y - 120);
    return true;
  },

  tick(state, unscaledDt) {
    const stumble = state.stumble;
    if (!stumble) return;
    stumble.incidentGraceTimer = Math.max(0, (stumble.incidentGraceTimer || 0) - unscaledDt);
    stumble.slowTimer = Math.max(0, (stumble.slowTimer || 0) - unscaledDt);
  },
};
