// ─────────────────────────────────────────────────────────────────────────────
// BIOME SCHEDULE — the authored run timeline. This is the file you edit to design
// the journey. Rainforest ALWAYS opens the run (first entry, atSec 0). After that,
// each entry says "at this many seconds into the run, change to this biome." A CAVE
// transition leg is auto-inserted at every change — you never list the cave here;
// it's the connective tunnel between whatever two biomes you schedule.
//
//   { atSec, biome }   biome ∈ keys of VISUAL_BIOMES (rain | sunset | village |
//                      sakura | snow | volcano | water*)   *water = once V2 is ported
//
// Durations are deliberately uneven — author whatever timestamps feel right; the
// system handles the in-between cave automatically.
// ─────────────────────────────────────────────────────────────────────────────
export const BIOME_SCHEDULE = [
  { atSec: 0,   biome: 'rain' },     // rainforest — always first
  { atSec: 10,  biome: 'water' },
  { atSec: 105, biome: 'sakura' },
  { atSec: 160, biome: 'water' },    // ground→cave→water: the lane lifts to the swim surface
  { atSec: 215, biome: 'snow' },     // water→cave→ground: the lane drops back down
  { atSec: 270, biome: 'sunset' },
  { atSec: 325, biome: 'volcano' },
];

// Transition tunables.
//   The cave is a FIXED object in the world: it scrolls past at exactly the game's
//   run speed (1:1 with distance) — you run INTO it, it never rushes toward you. So
//   there is no speed knob; the cave's LENGTH is whatever its own journey constants
//   add up to (preludeLen…exitRiseLen in createCaveBackground, ~14,400px). Shorten
//   the cave there if the leg feels too long — never by scaling its scroll speed.
//
//   WATER ENTRY/EXIT is NOT done inside the dark cave — it plays out just OUTSIDE it,
//   over the global floor, using the water biome's OWN skin. The water biome is a
//   single surface line (h*WATER_SURFACE_FRAC: sky above, water below, monk swims at
//   it). We animate that line between the floor and its resting height so the world
//   floods UP on entry (AFTER the cave) and drains DOWN on exit (BEFORE the cave),
//   while the monk rides the surface from a run into a swim. As the surface rises the
//   global floor band stays put as the SEABED — it reads like the camera dipping
//   under. settleLen = the run-distance (px) over which that rise/fall plays out.
export const BIOME_TRANSITION = {
  settleLen: 1100,
};
