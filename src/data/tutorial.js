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
    // The climax teaches the game's one inverted rule — DON'T slice the sealed quiver.
    // The player gets a real window to leave it alone; if they cut it anyway that's
    // their own seal-break, and if they show restraint the driver demonstrates the
    // consequence (clearly framed, never as the player's fault). Either way the real
    // SamuraiSystem escalation plays out to a winnable mercy duel — no execution, no
    // death. See TutorialSystem.tickSamurai.
    id: 'samurai',
    kind: 'samurai',
    slowmo: 0.18,
    prompts: {
      quiver: 'THE GLOWING SEAL — NEVER SLICE IT',
      demo: 'BUT WHEN A SEAL BREAKS…',
      break: 'ARROWS FLY — THE MONK STUMBLES',
      watch: 'THE RONIN WAKES — HE DRAWS HIS BLADE',
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
  restraintHold: 160, // window the sealed quiver hangs while the player chooses to leave it
  demoHold: 100,      // hold the "when a seal breaks…" line before the framed demonstration
  breakHold: 90,     // min time the "arrows fly / monk stumbles" line shows before the Ronin wakes
  watchHold: 100,    // pause on the "watching" beat (also clears the stumble grace)
  yieldHold: 90,     // hold the victory line before handing off to the live run
};
