# Bamboo Slicer — Run Design & System Findings

> Working design doc from the obstacle/pacing review. Captures the decisions we
> converged on and a **critical analysis of whether the current pacing system fits
> them**. The high-level locked decisions here should be mirrored back into the
> Design Notes mock ([src/mocks/screens/DesignNotesMock.jsx](src/mocks/screens/DesignNotesMock.jsx)),
> which CLAUDE.md still treats as the canonical design surface — this doc is the
> detailed findings layer underneath it, not a competing source of truth.

Phase: **PROTOTYPE — mechanics first.** No art/juice/meta work implied by anything below.

---

## 1. The core principle this whole review turned on

In a one-verb game, **the unit to budget is not the obstacle — it's the player's
RESPONSE.** Variety in art is free; variety in *required reads* is expensive and
the thing that breaks at speed. We had **16 obstacle specs** feeding a player who
only ever does one thing (slice, high/low). That's content bloat, not depth.

So the roster collapses to a small set of **responses**, each re-skinned per biome.

---

## 2. Obstacle roster — organized by RESPONSE

| Response | What the player does | Ground (bamboo) | Cave | Water |
|---|---|---|---|---|
| **Slice — tempo** | rhythmic filler, sustains the combo (the calm) | bamboo (thin + thick=multi-hit) | — | **water-vine** (grows *toward* you) |
| **Slice — adrenaline** | reactive bursts, blade roams screen (the spike) | yokai | yokai | yokai (incl. **raft** waves) |
| **Slice — low** | duck-slice a low hazard | spikes | — | — |
| **Slice — timing** (overhead) | time the falling ceiling drop | — | stalactites | — |
| **Solve** (cut a release point) | one aimed slice, world reacts | **bridge** (over a gap) | **TNT** (clears the boulder wall) | — |
| **Don't-slice** (avoid) | withhold the reflex | **arrows** | arrows | — |
| **Pressure** (executioner) | the forgiveness/death engine, not a tile | **samurai** | samurai | samurai |

**Net vocabulary: 5 slice-shaped reads + 1 inhibit read + 1 pressure enemy** — and one of the
five (stalactite timing) is **cave-only**, so any single biome shows fewer. Everything else is a
*re-skin*, not a new read.

### Roles locked
- **Bamboo = tempo. Yokai = adrenaline.** Same verb (slice), opposite emotional register
  — that's the tension/release rhythm, for free.
- **Water-vine is bamboo's water twin** — a tempo slicer that grows toward the monk.
- **TNT is a SOLVE obstacle, not a "don't-slice."** It's the same family as the bridge:
  one slice → the world reacts. Its job is the **cave entrance** — the mouth is walled
  with boulders ("no way in"); power-slice the TNT → the wall blows → you're in.
  - **"Power slice" must stay a normal slice.** Pillar #1 forbids special/charged gestures.
    The *TNT* reacts big; the swipe is the same forgiving swipe.
- **Boulders survive only as set-dressing** — the wall TNT clears. Never a dodge read.
- **Arrows are the don't-slice avoidable**, and **no longer the biome transition.** The
  transition is now baked into each biome's *entrance set-piece* (cave = TNT/boulder gate).
- **Raft (water) is the yokai delivery vehicle.** Water has no ground to fling yokai from, so
  in this biome yokai ride in on rafts. **Raft size telegraphs the threat — big raft = many
  yokai, small raft = few** (readable at a glance). **Slice the raft → the yokai aboard leap at
  you at once** (a fruit-ninja burst). The raft is the carrier; the yokai are the encounter.

---

## 3. Death & forgiveness — the readability model

The axis is **not** omission vs. commission (that was too clever; the bridge breaks it —
*not* cutting is an omission but you fall and die). The real axis is:

> **A death is fair if and only if the danger was READABLE in time to act.**

That single rule resolves everything:

- **Solid blockers — gap, boulder wall → solve-or-die, ALWAYS.** A visible chasm is the *fairest*
  death in the genre (Temple Run / Subway Surfers): you saw the hole, you didn't act, you
  fall. The blocker *is* its own telegraph. Surviving a bonk off a solid wall is the
  *unreadable* part — so missing the TNT gate kills too. Both are taught slow & isolated first.
  - **A wall ALWAYS kills — never sometimes.** Making only *some* gates lethal reintroduces the
    exact "is this the dangerous one?" ambiguity the readability rule exists to kill. Since the
    cave-gate recurs every leg, the lever is the **slice window, not the lethality**: keep it
    always lethal, but make recurring gates **generous early and tighten the window as the run
    ramps.** Effect: deaths still *cluster* on the samurai + the spaced, genuinely-hard
    bridge-gaps even though "walls kill" is universal. Generosity manages frequency, not mercy.
- **Soft hazards — bamboo, spikes, yokai, water-vine, stalactites → miss = survive.** Critically:
  **do not split these into "safe miss" vs "deadly miss."** Uniform rule = readable. Every
  miss feeds **one** thing.
- **Arrows (don't-slice) — mis-slicing one = a BIG stumble**, not instant death. A heavy feed
  that injures you and shoves you hard toward the samurai. It's a commission error so it bites
  more than a normal miss, but death still stays concentrated in the samurai + blockers.
- That one thing is **the samurai — and there is NO UI meter.** This was the key correction:
  a danger bar is a *second thing to watch*, which fights the low-mental-load pillar, and the
  genre doesn't use one. **The samurai IS the meter, diegetically** (Temple Run's monkeys).
  He is **appear-only-on-miss** — absent = genuinely safe = zero load:
  - Clean run → he's not on screen. Nothing to watch.
  - **1st slip → he appears but only WATCHES** (sheathed, stalking) — a forgiving warning.
  - **2nd–3rd → he draws and comes to kill** (closes the distance; the duel → death).
  - **Escalation must READ at a glance:** the watching pose and the drawn-sword kill pose have
    to look unmistakably different (posture / sword / music sting), or the player can't tell a
    warning from a death. **Clean play cools him a tier** (re-sheathes / falls back) so safety
    is always re-earnable — forgiveness has to be recoverable.

**The price of no meter:** the samurai's own states (far / closing / about to strike / cut-off-
and-safe) must read at a glance — he now carries the entire forgiveness system. The design
effort moves *onto his proximity legibility*. Mistakes are **felt in the moment** (trip,
slow-mo hitch, audio sting), never *monitored*. Felt ≠ tracked.

**Two death sources total, both maximally readable:** solid blockers + the samurai.

---

## 4. Biome envelopes (skins of the same reads)

- **Bamboo / ground** — the full vocabulary, where everything is taught: bamboo (tempo), spikes
  (low), yokai (adrenaline), bridge (solve), arrows (don't-slice).
- **Cave — the high-tension biome.** *Entrance gate*: boulder wall + TNT (solve). Inside:
  **stalactites (timing — drop from the ceiling)**, yokai, arrows. No floor spikes.
- **Water — the BREATHER biome.** Deliberately thin: water-vines (tempo) + raft→yokai
  (adrenaline). **No spikes, no arrows, no blockers** — so the *only* way to die in water is the
  samurai. It's the relief stretch.

**Biomes are a macro tension curve.** Don't flatten them to equal difficulty. The **cave is the
recurring tension spike** (the connective tunnel), **water is the deep release**, and the surface
biomes ramp from gentle (rain) to the run's **climax (volcano)**. So biome *rotation itself* is a
tension/release beat on top of the per-run one — and it pairs perfectly with the samurai: **cave
ratchets him up, clean water play cools him back down.** The biome you're in IS the difficulty dial.

### Macro structure — destinations, tunnels, breathers (grounded in `biomeSchedule.js`)
The engine already implements this; you only author `BIOME_SCHEDULE`:
- **Surface visual biomes** (rain, sunset, sakura, snow, volcano, village…) are all the **same
  GROUND/bamboo gameplay, reskinned** (`BiomeSystem.visualToGameplay → 'bamboo'`). They're the
  *destinations* / main stretches, ramping in intensity over the run (rain gentle → volcano climax).
- **Cave is AUTO-INSERTED between every destination** — never scheduled. It's the
  gameplay-distinct **tense connective tunnel** (TNT gate and stalactites): a
  fixed-*distance* leg (~14.4k px) scrolling 1:1 with run speed, so it gets **shorter in time as
  the run speeds up** — recurring punchy spikes between calmer surface stretches.
- **Water is a scheduled destination** with its own gameplay (vines + raft-yokai), entered via a
  cave whose lane ramps up to the swim surface. It's the **breather** — drop it in periodically as
  the samurai-discharge beat.

Authored sequence (this review): **rain → sunset → water → sakura → snow → water → sakura →
volcano**, cave auto-between each. Water recurring = recurring resets; volcano = the finale.

### Run length — the real answer is TWO clocks (you asked "ideal time")
Don't pick one number — separate them:
- **Difficulty ramp (the clock that matters most):** must reach *real* challenge within the
  **median run (~2–4 min)** and keep climbing via density after — this is the conductor's
  `rampSeconds`, independent of the biome schedule. Gate difficulty to a 20-min arc and the first
  10 min are a snooze.
- **Visual biome arc:** can run longer (it's the journey/aspiration). 8 biomes at ~2 min each ≈
  **12–15 min is my lean** — 20 works but stretches content almost no one survives to see. After
  volcano, **loop with continued escalation**, don't stop (it's an endless runner).
- **Front-load identity** regardless: the first ~3 min (rain → first cave → sunset/water) is the
  median player's *entire* experience. Put your most distinct feels there, not at minute 18.

### Resolved: cave-gate cadence
**Every** cave opens with the TNT-boulder gate — its signature "you're entering a cave" ritual
(vary the boulder arrangement so it never feels copy-pasted). And it is **genuinely lethal every
time**: a wall is a wall — making only *some* gates lethal would reintroduce the ambiguity the
readability rule exists to kill. The frequency problem is solved by **generosity, not by removing
lethality** — wide forgiving slice window, tightening as the run ramps, so the recurring gate
rarely actually executes you. The genuinely-*hard* lethal tests live on the spaced bridge-gaps. See §3.

---

## 5. Pacing — the "highs and lows"

Desired feel (from this review): yokai and bamboo come in **density waves** — sometimes a
lot, then a lull — each with its own rhythm. Bridges and TNT are **spaced set-pieces**,
occasional, never dense.

**This is exactly what the conductor already produces** (see §6): a rising baseline + a
REST↔PEAK oscillation. Troughs = filler/coins, crests = obstacle/combo/swarm.

**LOCKED: yokai are WOVEN** (resolves the design notes' open question "enemies: phase vs
woven"). Yokai have *their own* ebb/flow layered over the ground run, not only separate beats.
Give the conductor a light, independent `yokaiIntensity` track that waxes/wanes on its own and
sprinkles flurries during ground patterns — "fruit-ninja chaos woven in," matching "yokai have
their own highs and lows." In water, that track is expressed through **raft size & frequency**.

---

## 6. CRITICAL ANALYSIS — do we need the current system?

**Verdict: Yes. Keep the engine. The bloat is in the CONTENT, not the architecture.**
Do **not** rebuild the conductor — it already implements the exact "highs and lows" being
asked for, and replacing it with a dumb weighted spawner would *contradict* the locked design
("Arrangement = patterns … THIS is the main difficulty engine").

### What the engine does well — and maps 1:1 to a stated design goal
- **`RunDirector` tension curve** (rising baseline + REST↔PEAK + jitter) → *is* the highs/lows
  and the tension/release pacing. **Keep as-is.**
- **`PatternRunner` grid vs field** → grids author the *spaced, readable set-pieces & combos*;
  fields produce the *procedural density waves* for filler. Both are load-bearing. **Keep.**
- **Biome-tagged pattern pools** → literally "biomes = obstacle envelopes." **Keep.**
- **Dwell** (replay a beat long enough to read) → the teaching curve. **Keep.**
- **`OPENINGS`** scripted teach curriculum → introduce → isolate → reinforce. **Keep, re-author.**

### Where it's mismatched to the new design (the real work)
The engine is sound; the **library and placers are built for the dead 16-obstacle roster.**

- `patterns.js` is ~70% patterns on cut elements: `obs-boulders-*`, `obs-stalactites`,
  `obs-mines`, `obs-nets`, `obs-barrels`, `combo-mine-vine`, `combo-net-mine`,
  `combo-net-barrel`, etc. → **rewrite the library to the new roster.**
- `PatternRunner.emitCell` has symbols for cut elements (`O` boulder-as-dodge, `T` stalactite,
  `m` mine, `n` net, `B` barrel) → **prune the symbol map.**
- `ElementDirector` placers `placeMover` (mine/barrel/stalactite), `placeNet`,
  the 3-way `BRIDGE_VARIANTS` (drawbridge/smallbridges) → **delete cut placers, collapse bridge to one.**
- `PACING` tunables and difficulty caps were balanced against 16 types → **re-tune for 5.**

### Three things the conductor legitimately does NOT cover — must be BUILT
These are orthogonal to spawning and have no home in the current pacing code:

1. **Samurai / pursuit + forgiveness system.** The conductor spawns tiles; it has no model of
   "miss → chaser approaches → duel → death." Needs its own system (new, or extend the existing
   Demon/Boss systems) that reads misses and drives the diegetic chaser. **This is the spine of
   the whole death model and it does not exist yet.**
2. **Arrows (don't-slice).** No arrow element/symbol exists. New spec + symbol + the
   "mis-slice is punished" rule.
3. **TNT cave-gate + readable-blocker death.** Today TNT is just an explosive field tile
   (`obs-tnt`). The *gate* (boulder wall across the entrance, miss = crash = death) is new
   design. Bridge-fall-death appears partially wired already (ElementDirector notes "un-cut →
   monk falls in the pit") — verify it actually kills, and unify both blockers under one
   "fail a visible blocker = death" rule.

---

## 7. Cut / Keep / Build (actionable)

**Keep (engine):** `RunDirector`, `PatternRunner`, the grid/field DSL, biome pools, dwell, openings.

**Keep (elements):** bamboo (thin/thick), ground-only spikes, **stalactites (cave timing)**,
yokai, bridge (one spec), TNT, water-vine (`sea_vine`), raft (as yokai platform), boulder
(set-dressing only — the TNT wall).

**Cut (delete specs + their patterns + symbols):** `spikedboulder` (mine), `spikebarrel`
(barrel), `net`, `fish`, `drawbridge`, `smallbridges`, `caveboulder`, boulder-as-dodge usage.

**Build (new):** samurai pursuit/forgiveness system · arrows element (don't-slice) · TNT
cave-gate set-piece + unified blocker-death · woven `yokaiIntensity` track.

**Re-author:** `patterns.js` (5-family library), `OPENINGS` (teach the new set), `PACING` re-tune.

---

## 8. Decisions — RESOLVED

1. **Stalactites → KEEP, as the cave TIMING read** (drop from the ceiling; slice them in their
   fall window). Cave-exclusive, so it deepens cave's identity without bloating the core.
2. **Arrow mis-slice → BIG stumble**, not lethal — a heavy feed toward the samurai. Death stays
   in the samurai + blockers only.
3. **Yokai → WOVEN.** Independent `yokaiIntensity` track over the ground run.
4. **Samurai → appear-only-on-miss, escalating.** 1st slip = he watches (warning); 2nd–3rd = he
   kills. Clean play de-escalates. Escalation tiers must read at a glance.
5. **Water → BREATHER biome.** No spikes, no arrows, no blockers — just vines + raft-yokai. The
   only death in water is the samurai. Biomes carry their own intensity (cave peak / water rest).
6. **Raft when NOT sliced → it RAMS you** — a stumble that triggers/charges the samurai. Decisive
   either way: slice it → release the yokai as one combo-able burst; ignore it → eat the ram and
   feed the pursuit. Never free to skip.
7. **After volcano → loop with continued escalation** (endless tail, never stops). *(per §4)*
8. **Recurring cave-gate → genuinely LETHAL every time** (a wall always kills — one consistent,
   readable rule). Manage frequency via **generosity, not lethality**: wide slice window
   tightening with the ramp; the *hard* lethal tests stay on the spaced bridge-gaps. *(per §3/§4)*

### Still open
- **Samurai de-escalation rate** — how much clean play re-sheathes him a tier. (Tuning, but it
  decides how punishing one bad patch feels.)
