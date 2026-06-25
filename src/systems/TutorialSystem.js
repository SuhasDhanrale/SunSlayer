import { TUTORIAL_BEATS, TUTORIAL_TIMING } from '../data/tutorial.js';
import { placeObstacle, placeSetpiece } from './ElementDirector.js';
import { DemonSystem } from './DemonSystem.js';
import { ArrowSystem } from './ArrowSystem.js';
import { StumbleSystem } from './StumbleSystem.js';
import { Persistence } from '../core/Persistence.js';

// The coached first run (FTUE). The driver replaces RunDirector/PatternRunner/
// SpawnSystem while `s.tutorial.active`; every other system (Combat, Demon, Physics,
// Boss, Samurai, Segment) keeps ticking, so slices, scrolling, and the mercy duel all
// resolve through the REAL game code — the tutorial only authors WHAT appears and WHEN
// to advance. See src/data/tutorial.js for the beat script and CLAUDE.md for the plan.
//
// Per-beat lifecycle (generic spawn+gate beats):
//   INTRO → show the prompt (slow-mo) → SPAWN the target → WAIT until it's sliced →
//   CLEAR (brief beat, restore time) → next beat.
// The climax beat (kind:'samurai') is its own sub-machine (tickSamurai).

const X_FRAC = 0.82; // where obstacles enter; they crawl in toward the monk under slow-mo

export function createTutorialState() {
  return {
    active: false,
    beatIndex: 0,
    phase: 'INTRO',     // INTRO | SPAWN-implicit | WAIT | CLEAR (generic beats)
    sub: 'quiver',      // quiver | demo | break | watch | duel | yield (samurai beat)
    timer: 0,           // counts unscaledDt (real frames) so slow-mo doesn't stretch it
    targets: [],        // { kind, type?, ref, cut } per spawned target this beat
    prompt: '',         // coach line (read by the overlay)
    slowmo: null,       // requested time-scale (read by the loop's time-ramp; null = normal)
    quiverPlaced: false,
    brokeBy: null,      // who broke the seal: 'player' (their slice) | 'demo' (framed)
    done: false,
  };
}

export const TutorialSystem = {
  // Begin the coached run if the player hasn't finished it before. Called once at run
  // start (GameScreen). Idempotent.
  begin(s) {
    if (!s.tutorial) s.tutorial = createTutorialState();
    s.tutorial.active = !Persistence.data.tutorialDone;
  },

  tick(s, dt, unscaledDt, w, h) {
    const tut = s.tutorial;
    if (!tut || !tut.active || !w || !h) return;
    const beat = TUTORIAL_BEATS[tut.beatIndex];
    if (!beat) { this.finish(s); return; }

    if (beat.kind === 'samurai') { this.tickSamurai(s, unscaledDt, w, h, beat); return; }

    switch (tut.phase) {
      case 'INTRO':
        tut.prompt = beat.prompt;
        tut.slowmo = beat.slowmo;
        tut.timer += unscaledDt;
        if (tut.timer >= TUTORIAL_TIMING.introHold) {
          this.spawnTargets(s, beat, w, h);
          tut.phase = 'WAIT';
          tut.timer = 0;
        }
        break;

      case 'WAIT':
        tut.slowmo = beat.slowmo;
        this.refreshTargets(s, w, h);
        if (tut.targets.length && tut.targets.every((t) => t.cut)) {
          tut.phase = 'CLEAR';
          tut.timer = 0;
        }
        break;

      case 'CLEAR':
        tut.prompt = '';
        tut.slowmo = null; // let the world run at speed between lessons
        tut.timer += unscaledDt;
        if (tut.timer >= TUTORIAL_TIMING.clearHold) this.advanceBeat(s);
        break;
    }
  },

  spawnTargets(s, beat, w, h) {
    const tut = s.tutorial;
    tut.targets = beat.spawn.map((spec) => this.spawnOne(s, spec, w, h));
  },

  spawnOne(s, spec, w, h) {
    if (spec.kind === 'yokai') {
      const row = spec.row || 'M';
      const ref = DemonSystem.spawn(s, w, h, { route: 'side', row, xFrac: spec.xFrac, source: 'tutorial', typeIds: ['oni'] });
      return { kind: 'yokai', ref, cut: false, row, xFrac: spec.xFrac };
    }
    // obstacle / setpiece: both push the new entity onto s.bamboo; grab the tail.
    if (spec.kind === 'setpiece') placeSetpiece(s, spec.type, w * X_FRAC, h);
    else placeObstacle(s, spec.type, w * X_FRAC, h);
    return { kind: spec.kind, type: spec.type, ref: s.bamboo[s.bamboo.length - 1], cut: false };
  },

  // Mark targets cut, and respawn any that slipped past un-sliced so a beat can never
  // soft-lock. Detection mirrors how each system retires a sliced entity:
  //   yokai          → d.sliced flips, then it's removed from s.demons
  //   spec obstacle  → b.sim.isCut (spike / bridge stay in the array, flagged)
  //   plain bamboo   → spliced out of s.bamboo on slice (a missed one sets `stumbled`)
  refreshTargets(s, w, h) {
    for (const t of s.tutorial.targets) {
      if (t.cut) continue;

      if (t.kind === 'yokai') {
        if (t.ref.sliced) { t.cut = true; continue; }
        if (!s.demons.includes(t.ref)) {
          t.ref = DemonSystem.spawn(s, w, h, { route: 'side', row: t.row || 'M', xFrac: t.xFrac, source: 'tutorial', typeIds: ['oni'] });
        }
        continue;
      }

      const present = s.bamboo.includes(t.ref);
      if (t.ref.specId) {                 // spike / bridge
        if (t.ref.sim?.isCut) { t.cut = true; continue; }
        if (!present) this.respawnObstacle(s, t, w, h);
      } else {                            // plain bamboo
        if (!present && !t.ref.stumbled) { t.cut = true; continue; }
        if (!present && t.ref.stumbled) this.respawnObstacle(s, t, w, h);
      }
    }
  },

  respawnObstacle(s, t, w, h) {
    if (t.kind === 'setpiece') placeSetpiece(s, t.type, w * X_FRAC, h);
    else placeObstacle(s, t.type, w * X_FRAC, h);
    t.ref = s.bamboo[s.bamboo.length - 1];
  },

  // The climax teaches the game's one inverted rule — DON'T slice the sealed quiver —
  // then drives the REAL samurai escalation to a forgivable mercy duel:
  //   quiver → place a sealed quiver and give a real window to LEAVE IT ALONE. If the
  //            player cuts it, that is their own seal-break (brokeBy='player').
  //   demo   → they showed restraint: frame a clear demonstration, then break it
  //            ourselves (brokeBy='demo') so the consequence still gets taught.
  //   break  → arrows fly (real ArrowSystem burst); the first to land stumbles the monk
  //            → SamuraiSystem ABSENT→WATCHING. A safety stumble covers the case where
  //            every arrow misses, so the lesson always reaches the duel.
  //   watch  → after the grace clears, a second stumble → WATCHING→mercy duel.
  //   duel   → the BossSystem mercy duel runs in the loop; the player swipes to win →
  //            SegmentSystem.onMercyWon → samurai.stage 'postMercy'.
  //   yield  → hold the victory line, then hand off to the live run.
  // Never reaches execution, so the FTUE never kills the player.
  tickSamurai(s, unscaledDt, w, h, beat) {
    const tut = s.tutorial;
    const P = TUTORIAL_TIMING;
    // The duel owns its own dramatic time-scale (BossSystem); don't fight it.
    tut.slowmo = s.boss.active ? null : beat.slowmo;

    switch (tut.sub) {
      case 'quiver': {
        tut.prompt = beat.prompts.quiver;
        if (!tut.quiverPlaced) {
          ArrowSystem.spawnTrap(s, {
            x: w * 0.62, y: h * 0.42, worldAnchored: true,
            tier: 'TUTORIAL', source: 'tutorial', tutorial: true,
          });
          tut.quiverPlaced = true;
          tut.brokeBy = null;
          tut.timer = 0;
        }
        tut.timer += unscaledDt;
        // The player cut the seal themselves — their choice, clearly their doing.
        if (s.arrowBurst) { tut.brokeBy = 'player'; tut.sub = 'break'; tut.timer = 0; break; }
        // They held off long enough to show restraint: demonstrate the consequence.
        if (tut.timer >= P.restraintHold) { tut.sub = 'demo'; tut.timer = 0; }
        break;
      }

      case 'demo': {
        tut.prompt = beat.prompts.demo;
        tut.timer += unscaledDt;
        // A late slice still counts as the player's own break — credit it.
        if (s.arrowBurst) { tut.brokeBy = 'player'; tut.sub = 'break'; tut.timer = 0; break; }
        // Let the framing line read, then break the seal as a clear demonstration.
        // Proceed even if the trap somehow vanished (drifted off): break's safety
        // stumble keeps the lesson from soft-locking.
        if (tut.timer >= P.demoHold) {
          if (s.arrowTrap && !s.arrowBurst) {
            tut.brokeBy = 'demo';
            ArrowSystem.triggerBurst(s, s.arrowTrap, w, h);
          }
          tut.sub = 'break';
          tut.timer = 0;
        }
        break;
      }

      case 'break': {
        tut.prompt = beat.prompts.break;
        tut.timer += unscaledDt;
        // The burst's first hit on the monk is the stumble that wakes the Ronin. If
        // every arrow missed (all deflected/expired), the burst clears with no stumble
        // — force one so the lesson always reaches the duel. register() is debounced by
        // incidentGraceTimer, so this can't double-count a hit that already landed.
        if (!s.arrowTrap && !s.arrowBurst
          && s.samurai?.stage !== 'watching' && !s.samurai?.pendingDuel) {
          StumbleSystem.register(s, { source: 'tutorial' });
        }
        // Hold the line long enough to read before the Ronin wakes, even when the
        // stumble lands fast.
        if (s.samurai?.stage === 'watching' && tut.timer >= P.breakHold) { tut.sub = 'watch'; tut.timer = 0; }
        break;
      }

      case 'watch': {
        tut.prompt = beat.prompts.watch;
        if (s.coins?.length) s.coins.length = 0; // a non-empty lane would defer the duel
        tut.timer += unscaledDt;
        // Second stumble once the grace windows clear → WATCHING escalates to the duel.
        if (tut.timer >= P.watchHold
          && (s.stumble?.incidentGraceTimer || 0) <= 0
          && (s.samurai?.graceTimer || 0) <= 0) {
          StumbleSystem.register(s, { source: 'tutorial' });
        }
        if (s.boss?.active || s.pendingBoss || s.samurai?.pendingDuel) { tut.sub = 'duel'; tut.timer = 0; }
        break;
      }

      case 'duel': {
        tut.prompt = beat.prompts.duel;
        if (s.samurai?.stage === 'postMercy') { tut.sub = 'yield'; tut.timer = 0; }
        break;
      }

      case 'yield': {
        tut.prompt = beat.prompts.yield;
        tut.slowmo = null;
        tut.timer += unscaledDt;
        if (tut.timer >= P.yieldHold) this.finish(s);
        break;
      }
    }
  },

  advanceBeat(s) {
    const tut = s.tutorial;
    tut.beatIndex += 1;
    tut.phase = 'INTRO';
    tut.sub = 'quiver';
    tut.quiverPlaced = false;
    tut.brokeBy = null;
    tut.timer = 0;
    tut.targets = [];
    if (tut.beatIndex >= TUTORIAL_BEATS.length) this.finish(s);
  },

  finish(s) {
    const tut = s.tutorial;
    tut.active = false;
    tut.done = true;
    tut.prompt = '';
    tut.slowmo = null;
    Persistence.completeTutorial(); // later runs skip the prologue
  },
};
