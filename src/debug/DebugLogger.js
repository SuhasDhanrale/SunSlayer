// Dev-only state-transition logger.
//
// Diffs a handful of watched fields once per frame and logs ONLY when one of
// them changes, so the console is not flooded at 60fps. This is the single
// place debug logging lives — gameplay systems stay clean (no debug
// conditionals leak into them). Flip DEBUG to false to silence everything.

const DEBUG = true;

const prev = {};
let frame = 0;
let dimmedSince = null;   // frame the dark overlay last turned on
let lastHeartbeat = 0;    // frame we last emitted a "still dimmed" line
let prevFlashHit = 0;     // last frame's flash intensity (to detect new flashes)
const HEARTBEAT = 60;     // log roughly once per second while dimmed

// Maps the raw flashColor string to a readable name for the log.
const flashName = (c) => {
  if (c === '185, 28, 28') return 'RED';
  if (c === '255, 255, 255') return 'WHITE';
  return c;
};

const fmt = (v) => {
  if (v === undefined) return '∅';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(1);
  return String(v);
};

export const DebugLogger = {
  // Call once when a run starts so frame counter / prev snapshot reset.
  reset() {
    frame = 0;
    dimmedSince = null;
    lastHeartbeat = 0;
    prevFlashHit = 0;
    for (const k in prev) delete prev[k];
    if (DEBUG) console.log('%c=== RUN START ===', 'color:#059669;font-weight:bold');
  },

  // Call once per frame in the loop, AFTER systems have mutated state.
  tick(s) {
    if (!DEBUG) return;
    frame++;

    const watch = {
      'visualBiome': s.visualBiome,
      'playerBiome': s.playerBiome,
      'spawnBiome': s.spawnBiome,
      'focus.active': s.focus.active,
      'boss.active': s.boss.active,
      'boss.type': s.boss.type,
      'boss.phase': s.boss.phase,
      'boss.hp': s.boss.hp,
    };

    const changes = [];
    for (const key in watch) {
      if (prev[key] !== watch[key]) {
        changes.push(`${key}: ${fmt(prev[key])} → ${fmt(watch[key])}`);
        prev[key] = watch[key];
      }
    }

    if (changes.length) {
      console.log(
        `%c[F${frame} d=${Math.round(s.distance)}] ${changes.join('   |   ')}` +
          `   (energy=${Math.round(s.focus.energy)}, nextTrigger=${Math.round(s.boss.nextTrigger)}, ` +
          `arrows=${s.boss.arrows.length}, timeScale=${s.currentTimeScale.toFixed(2)})`,
        'color:#b91c1c;font-weight:bold'
      );
    }

    // Full-screen flash detector. flashHit decays every frame, so a JUMP upward
    // means a new flash just fired — log its colour (RED/WHITE) and intensity.
    if (s.flashHit > prevFlashHit + 0.01) {
      const red = s.flashColor === '185, 28, 28';
      console.log(
        `%c[F${frame}] ✦ ${flashName(s.flashColor)} FLASH (${s.flashHit.toFixed(2)}) ` +
          `[boss.active=${s.boss.active}, boss.phase=${s.boss.phase}]`,
        `color:${red ? '#dc2626' : '#a16207'};font-weight:bold`
      );
    }
    prevFlashHit = s.flashHit;

    // Heartbeat: mirror the RENDERER's dim rule exactly (GameRenderer inDarkMode)
    // so this never claims "dimmed" when the screen is actually bright. The dark
    // overlay is on for Iaijutsu (focus.active) or a boss that is NOT yet in its
    // 'defeated' fly-away. A stuck state would otherwise be SILENT.
    const dimmed = s.focus.active || (s.boss.active && s.boss.phase !== 'defeated');
    if (dimmed) {
      if (dimmedSince === null) dimmedSince = frame;
      if (frame - lastHeartbeat >= HEARTBEAT) {
        lastHeartbeat = frame;
        console.log(
          `%c[F${frame}] … STILL DIMMED for ${frame - dimmedSince}f ` +
            `(focus.active=${s.focus.active}, boss.active=${s.boss.active}, ` +
            `boss.phase=${s.boss.phase}, boss.type=${s.boss.type}, energy=${Math.round(s.focus.energy)})`,
          'color:#9333ea'
        );
      }
    } else {
      dimmedSince = null;
    }
  },

  // Discrete events (input, forced clears) that a frame-diff can't attribute.
  event(label, data) {
    if (!DEBUG) return;
    console.log(`%c[F${frame}] ⚡ ${label}`, 'color:#2563eb;font-weight:bold', data ?? '');
  },
};
