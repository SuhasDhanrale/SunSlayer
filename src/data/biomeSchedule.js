// ─────────────────────────────────────────────────────────────────────────────
// BIOME SCHEDULE — the authored run timeline. This is the file you edit to design
// the journey. Rainforest ALWAYS opens the run (first entry, atSec 0). After that,
// each entry says "at this many seconds into the run, change to this biome." A
// transition TUNNEL is auto-inserted at every change — you never list the tunnel as
// its own row; it's the connective leg between whatever two biomes you schedule.
//
//   { atSec, biome, via?, payload? }
//     biome    ∈ keys of VISUAL_BIOMES (rain | sunset | village | sakura | snow |
//              volcano | water) — the destination you arrive at.
//     via      which TUNNEL connects INTO this biome:
//                'cave'  (default) the long blue-lily cave.
//                'grove' the short bonus tunnel (clean vector pillars + waterfalls).
//     payload  (grove only) what fills the short grove tunnel as you run it:
//                'coins'    a tight river of coins (reward fantasy)
//                'gauntlet' a corridor of TNT-rigged boulder pillars (blast through)
//                'swarm'    a free-flying yokai swarm from the edges/below (not rafts)
//
// Pick `via:'grove'` on the legs where you want the short bonus tunnel instead of the
// long cave — so not every transition is the big cave. Durations are deliberately
// uneven; author whatever timestamps feel right and rearrange freely.
// ─────────────────────────────────────────────────────────────────────────────
export const BIOME_SCHEDULE = [
  { atSec: 0,   biome: 'rain' },                                     // rainforest — always first
  { atSec: 20,   biome: 'rain',  via: 'grove', payload: 'gauntlet' },  // early grove (quick test)
  { atSec: 60,  biome: 'sakura' },                                  // via cave (default)
  { atSec: 110, biome: 'water' },                                    // via cave → water settle
  { atSec: 175, biome: 'village',  via: 'grove', payload: 'coins' },  // short grove: yokai swarm
  { atSec: 230, biome: 'sakura' },  
  { atSec: 250, biome: 'sakura',    via: 'grove', payload: 'swarm'  },  
  { atSec: 300, biome: 'snow' },
  { atSec: 380,  biome: 'sunset' },
  { atSec: 430,   biome: 'rain',   via: 'grove', payload: 'gauntlet' },
  { atSec: 480, biome: 'water' },  
  { atSec: 530, biome: 'village',  via: 'grove', payload: 'coins' },
  { atSec: 580, biome: 'snow' },
  { atSec: 600, biome: 'snow',  via: 'grove', payload: 'coins' }, 
  { atSec: 660,  biome: 'sunset' },
  { atSec: 710,   biome: 'rain' },                                     // rainforest — always first
  { atSec: 730,   biome: 'rain',  via: 'grove', payload: 'gauntlet' },  // early grove (quick test)
  { atSec: 790,  biome: 'sakura' },                                  // via cave (default)
  { atSec: 840, biome: 'water' },                                    // via cave → water settle
  { atSec: 890, biome: 'village',  via: 'grove', payload: 'coins' },  // short grove: yokai swarm
  { atSec: 950, biome: 'snow' },
  // via cave
  { atSec: 1000, biome: 'volcano'}, // short grove: TNT gauntlet
  { atSec: 1020, biome: 'volcano',  via: 'grove', payload: 'coins' },
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
