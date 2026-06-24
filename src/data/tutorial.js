// FTUE beat script — the coached first run (see CLAUDE.md / the FTUE plan).
//
// This file is DECLARATIVE: each beat names what to place and how to detect success,
// but the actual spawning + gate-checking is done imperatively by TutorialSystem
// (the driver). Keeping the script as plain data means the order and prompt copy can
// be retuned here without touching the driver.
//
// Beat shape:
//   id        — stable key (debug/telemetry)
//   prompt    — the coach line drawn on-screen while the player must act
//   slowmo    — time-scale the driver requests while the beat waits (lower = slower).
//               Read by the game loop's time-ramp; the duel overrides it.
//   spawn     — what the driver places when the beat begins. Each entry:
//                 { kind: 'yokai' }                       → DemonSystem.spawn (side route)
//                 { kind: 'obstacle', type: 'basic'|'spike' } → ElementDirector.placeObstacle
//                 { kind: 'setpiece', type: 'bridge' }    → ElementDirector.placeSetpiece
//   gate      — completion rule the driver evaluates:
//                 'targets-cut' → every spawned target has been sliced
//   kind:'samurai' — the climax beat is a driver-run sub-machine (quiver → watch →
//               duel → yield), not a spawn+gate. Its copy lives in `prompts`.

export const TUTORIAL_BEATS = [
  {
    id: 'slice',
    prompt: 'SLICE',
    slowmo: 0.16,
    spawn: [{ kind: 'yokai' }, { kind: 'obstacle', type: 'basic' }],
    gate: 'targets-cut',
  },
  {
    id: 'spikes',
    prompt: 'STAY LOW — SLICE THE SPIKES',
    slowmo: 0.16,
    spawn: [{ kind: 'obstacle', type: 'spike' }],
    gate: 'targets-cut',
  },
  {
    id: 'bridge',
    prompt: 'CUT THE ROPE — OR YOU FALL',
    slowmo: 0.12,
    spawn: [{ kind: 'setpiece', type: 'bridge' }],
    gate: 'targets-cut',
  },
  {
    // The climax: the sealed quiver is the deliberate trigger. The driver detonates
    // it (the player never has to make the mistake), arrows stumble the monk, and the
    // real SamuraiSystem escalation plays out to a winnable mercy duel — no execution,
    // no death. See TutorialSystem.tickSamurai.
    id: 'samurai',
    kind: 'samurai',
    slowmo: 0.18,
    prompts: {
      quiver: 'A SEALED QUIVER — NEVER SLICE THESE',
      watch: 'YOU STUMBLED — THE RONIN STIRS',
      duel: 'SLICE HIM BACK!',
      yield: 'HE YIELDS — YOUR JOURNEY BEGINS',
    },
  },
];

// Tunables for the driver's pacing, in 60fps frame units (real time — counted on
// unscaledDt, so slow-mo doesn't stretch them). Kept here beside the script.
export const TUTORIAL_TIMING = {
  introHold: 48,     // beat prompt shows this long before the target spawns
  clearHold: 30,     // brief beat after a gate clears before the next beat
  quiverHold: 60,    // quiver hangs (readable) before the driver auto-detonates it
  watchHold: 100,    // pause on the "watching" beat (also clears the stumble grace)
  yieldHold: 90,     // hold the victory line before handing off to the live run
};
