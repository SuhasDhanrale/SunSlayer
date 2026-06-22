# `config.json` — field reference

Annotated guide to every knob in [config.json](config.json). `config.json` is **strict
JSON and cannot hold comments** (Vite imports it with a strict parser), so the docs live
here. Values shown are the current ones in the file; treat them as the live defaults.

Most blocks are also surfaced as named constants in
[../config/constants.js](../config/constants.js) (`SPEED`, `SAMURAI`, `PACING`, …), each
with a fallback literal used if the key is missing — keep the two in sync when you retune.

> Frame units: many timers are in **unscaled 60 fps frames** (e.g. `90` ≈ 1.5 s), not
> seconds. Fields named `*Sec`/`*Seconds`/`*Duration` are seconds unless noted.

> **⚠️ DEAD fields** (defined but **no system reads them** — editing has no effect; safe to
> ignore or delete): `segmentLength`, `coins.spawnRate`, `demons.spawnRate`,
> `demons.minSpeedX`, `demons.maxSpeedX`, `demons.comboWindow`, `gate.tntLeadPxStart`,
> `gate.tntLeadPxMin`, `gate.tntLeadShrinkPerSpeed`,
> `bosses.ronin.triggerDistance`, `bosses.ronin.respawnGap`. They're marked **DEAD** inline
> below.

---

## Top-level (global run feel)

| Field | Value | What it does |
|---|---|---|
| `baseSpeed` | `6.0` | Monk auto-run speed in logical px/frame **before** the `speed` tier multiplier is applied. The master pace dial. |
| `maxFocus` | `100` | Cap of the focus meter. |
| `slashThreshold` | `15` | Minimum pointer drag distance (px) for a gesture to register as a slice. Lower = twitchier. |
| `groundHeight` | `100` | Height (px) of the ground band; land biomes run their lane at `canvasHeight − groundHeight`. |
| `waterSurfaceFrac` | `0.40` | Water biome's surface line as a fraction of canvas height. The monk and all water hazards re-base to this lane instead of the ground. |
| `monkTargetX` | `250` | The monk's fixed horizontal screen position (px from left); the world scrolls past it. |
| `biomeLength` | `2500` | Legacy distance (px) per biome for the old distance-based biome lookup. Live biomes now advance by segment index, so this is mostly dormant. |
| `segmentLength` | `5200` | **Dead/unused** — exported as `SEGMENT_LENGTH` but no system reads it (leftover from when segments were distance-based). Editing it does nothing. |

---

## `speed` — staircase speed ramp

Speed climbs in **tiers**, not one smooth curve. At each tier's `atSec` the multiplier
ramps over `rampSec` from the previous plateau up to this tier's `factor`, then **holds**
until the next tier. Final tier = max factor, held forever. (`getSpeedFactor()` in
constants.js.)

| Field | Value | What it does |
|---|---|---|
| `rampSec` | `30` | Seconds to ramp into each tier's new factor. |
| `tiers[]` | see below | `{ atSec, factor }` pairs: at `atSec` seconds elapsed, target multiplier on `baseSpeed` becomes `factor`. |

Current tiers: `1.0×` at 0 s → `1.6×` at 60 s → `2.0×` at 240 s → `2.5×` at 360 s.

---

## `stumble` — collision recovery (StumbleSystem)

A non-fatal stumble slows the monk briefly with a grace window before the next incident
can compound.

| Field | Value | What it does |
|---|---|---|
| `slowFactor` | `0.45` | Speed multiplier while stumbling (45% of normal). |
| `slowDuration` | `70` | Frames the slow lasts. |
| `incidentGrace` | `90` | Frames of immunity after an incident before another can register. |

---

## `samurai` — recoverable Samurai duel episode (SamuraiSystem)

One episode flows watching → mercy → post-mercy → execution. Reset windows / runways are in
**60 fps frame units**.

| Field | Value | What it does |
|---|---|---|
| `watchResetWindow` | `720` | Frames of clean play that reset the "watching" pressure. |
| `postMercyResetWindow` | `1080` | Frames after a granted mercy before the episode fully resets. |
| `postMercyGrace` | `180` | Grace frames right after mercy where the monk can't be re-engaged. |
| `watchOffset` | `1200` | Horizontal spawn offset (px) where the samurai begins watching. |
| `drawOffset` | `600` | Offset (px) at which the samurai draws (commits to the duel). |
| `edgeMargin` | `60` | Screen-edge margin (px) for samurai placement. |
| `approachLerp` | `0.04` | Per-frame lerp factor for the samurai easing toward its target X. |
| `biomeCool.bamboo` | `1` | Samurai cooldown/timer rate in bamboo (baseline). |
| `biomeCool.cave` | `0` | In cave the timer is frozen (no samurai pressure). |
| `biomeCool.water` | `2` | In water it cools twice as fast. |

---

## `demons` — yokai / demon launch + slice (DemonSystem, yokaiLaunch)

Ballistic fruit-style targets. `side` = launched in from screen sides; `bottom` = lobbed up
from below. `defaultT` is the flight-time solver target per route.

| Field | Value | What it does |
|---|---|---|
| `spawnRate` | `62` | **DEAD** — spawn cadence comes from the RunDirector/ElementDirector beat, not a fixed rate. |
| `minSpeedX` / `maxSpeedX` | `6` / `11` | **DEAD** — horizontal velocity is derived by the launch solver, not sampled from this range. |
| `minSpeedY` / `maxSpeedY` | `15` / `22` | Vertical launch speed range for the **bottom** route. |
| `gravity` | `0.5` | Downward accel applied to demons per frame. |
| `radius` | `40` | Demon hit/draw radius (px). |
| `comboWindow` | `100` | **DEAD** — not read by any system; combo timing lives elsewhere. |
| `sideWeight` | `0.65` | Probability a demon uses the **side** route vs the bottom route. |
| `sideMinYFrac` / `sideMaxYFrac` | `0.15` / `0.65` | Vertical band (fraction of height) for side-route spawns. |
| `sideMinSpeedX` / `sideMaxSpeedX` | `11` / `13` | Horizontal speed range for the side route. |
| `sideDriftY` | `1` | Vertical drift for side-route demons. |
| `sideGravity` | `0.9` | Gravity for side-route arcs. |
| `bottomMinXFrac` / `bottomMaxXFrac` | `0.25` / `0.75` | Horizontal band (fraction of width) for bottom-route launches. |
| `bottomDriftX` | `3` | Horizontal drift for bottom-route launches. |
| `sliceZone.xFrac` / `.yFrac` | `0.34` / `0.5` | Target point (fraction of screen) the launch solver aims demons to cross — the natural slice sweet spot. |
| `defaultT.side` / `.bottom` | `78` / `78` | Default flight time (frames) the solver targets per route. |

---

## `coins` — pickups (CoinSystem)

| Field | Value | What it does |
|---|---|---|
| `spawnRate` | `210` | **DEAD** — generic random coin clusters are disabled; coins now come from authored `o` cells + one marker coin per spike. |
| `radius` | `14` | Coin radius (px). The only live coin field. |

---

## `pacing` — macro conductor (RunDirector)

Run tension is an **intensity curve**: a rising baseline (`baseStart`→`baseEnd` over
`rampSeconds`) with a REST↔PEAK oscillation on top (`restDepth` dips below, `peakHeight`
rises above), jittered so it never feels metronomic. The conductor pulls authored patterns
from per-category decks to match where the curve sits.

| Field | Value | What it does |
|---|---|---|
| `rampSeconds` | `480` | Seconds over which the baseline rises from `baseStart` to `baseEnd`. |
| `baseStart` | `0.15` | Baseline intensity at run start (0–1). |
| `baseEnd` | `0.7` | Baseline intensity at the top of the ramp (0–1). |
| `restDepth` | `0.4` | How far a REST beat dips below the baseline. |
| `restCeil` | `0.35` | Hard ceiling on a REST target, so the rising baseline can't drown the late valleys. |
| `peakHeight` | `0.35` | How far a PEAK beat rises above the baseline. |
| `peakCap` | `0.85` | Hard cap on a PEAK target (below 1.0), so peaks never pin at max late. |
| `restPatterns` | `1` | Patterns drawn per REST beat. |
| `peakPatterns` | `2` | Patterns drawn per PEAK beat. |
| `teachDwell` | `8` | Dwell (beats/seconds) on a newly-taught element before moving on. |
| `dwellBase` | `6` | Base dwell time on a pattern. |
| `dwellPerDiff` | `2.5` | Extra dwell added per difficulty step. |
| `gapSeconds` | `0.5` | Gap between patterns. |
| `jitter` | `0.25` | Randomization applied to the curve so it isn't metronomic. |
| `introTeach` | `true` | Whether the run opens with the teaching intro sequence. |

---

## `yokaiWoven` — persistent land-only yokai layer (RunDirector tickShapes)

A LULL → RISE → PEAK → FALL oscillation that injects yokai bursts into safe blank slots,
onboards new yokai over time, and shares a live cap. Active time **pauses in water** and
resumes at LULL without losing roster progress. `[a, b]` fields are ranges (random pick).

| Field | Value | What it does |
|---|---|---|
| `cap` | `7` | Max simultaneous live Yokai entities; sealed quivers do not consume a slot. |
| `maxChance` | `0.3` | Ceiling on per-slot injection probability. |
| `introEndSec` | `28` | When the onboarding intro phase ends (s). |
| `kitsuneSec` | `35` | When kitsune yokai are introduced (s). |
| `nofaceSec` | `65` | When No-Face yokai are introduced (s). |
| `envelopeSeconds` | `360` | Macro-envelope climb time (s): how long the band takes to rise from its early to its late shape. |
| `floorBand` | `[0.08, 0.22]` | LULL trough early→late. Never zero, so there is always a yokai floor on land. |
| `ceilBand` | `[0.55, 0.92]` | PEAK crest early→late. `hiEnd < 1.0` so the pulse never strobes to max. |
| `envJitter` | `0.12` | Symmetric jitter on each enveloped band edge so LULL/PEAK aren't metronomic. |
| `lullDuration` | `[6, 10]` | LULL phase length range (s). |
| `riseDuration` | `[6, 9]` | RISE phase length range (s). |
| `fallDuration` | `[5, 8]` | FALL phase length range (s). |
| `peakDuration` | `[4, 6]` | PEAK phase length range (s). |
| `shapeInterval` | `[5.5, 2]` | Seconds between shape injections, interpolated by intensity (slow → fast). |
| `shapeJitter` | `0.25` | Randomization on the injection interval. |
| `backoffStrength` | `0.7` | How much the obstacle (bamboo) layer ducks as a yokai burst rises, so layers take turns (DESIGN #97). |
| `backoffFloor` | `0.15` | Minimum the obstacle layer is allowed to duck to. |
| `replaySkipAbove` | `0.5` | Skip replaying a just-used pattern when intensity is above this. |

---

## `arrowTrap` — sealed-quiver punishment (ArrowSystem)

The intact quiver is safe. Cutting its seal breaks the current combo and starts a short,
recoverable arrow burst. Timing fields are real-time 60 fps frames unless noted.

| Field | Value | What it does |
|---|---|---|
| `radius` | `54` | Intact quiver draw and cut radius in px. |
| `hitPauseFrames` | `8` | Slice hit-stop applied when the seal breaks. |
| `telegraphFrames` | `22` | Real-time frames used to stage and aim the burst. |
| `telegraphTimeScale` | `0.65` | World time scale during the telegraph only. |
| `stagingRadius` | `100` | Distance arrows ease away from the cut origin before launch. |
| `stagingSpreadDeg` | `110` | Width of the staging fan. |
| `launchGapFrames` | `5` | Real-time frames between sequential launches. |
| `speed` | `11` | Arrow flight speed in px/frame. |
| `cutRadius` | `36` | Swipe/Focus collision radius for deflecting an arrow. |
| `monkHitRadius` | `28` | Monk collision radius for arrow impacts. |
| `tutorialArrows` / `riseArrows` | `3` / `3` | Burst size for the isolated lesson and Rise formation. |
| `peakArrows` | `5` | Burst size for the Peak formation. |
| `maxIncidentsPerBurst` | `1` | Maximum Samurai stumble incidents a single burst can register. |
| `peakPhaseChance` | `0.5` | Chance the cycle's one mixed trap targets Peak instead of Rise. |
| `maxPerCycle` | `1` | Maximum mixed traps scheduled in one Rise→Peak→Fall cycle. |

---

## `gate` — arrow/TNT gate hazards (gate system)

| Field | Value | What it does |
|---|---|---|
| `spawnOffset` | `900` | Horizontal offset (px) ahead of the monk where a gate spawns. |
| `tntLeadPxStart` | `540` | **DEAD** — `placeGate()` doesn't read it (intended TNT lead distance). |
| `tntLeadPxMin` | `320` | **DEAD** — `placeGate()` doesn't read it (intended floor on lead distance). |
| `tntLeadShrinkPerSpeed` | `150` | **DEAD** — `placeGate()` doesn't read it (intended lead shrink per speed). |
| `lethalContactBand` | `46` | Contact band (px) within which a gate is lethal. |
| `blastRadius` | `145` | TNT explosion radius (px). |

---

## `bosses` — Samurai/Ronin encounters (BossSystem)

`BossSystem` owns only the Samurai/Ronin duel. Sealed quivers and arrow bursts are owned by
`ArrowSystem` and use the separate `arrowTrap` block above.

### `ronin` (mercy/execution duel)
The duel timing fields are live (used by [BossSystem.js](../systems/BossSystem.js)); the two
distance fields are dead because the duel is triggered via SamuraiSystem, not by distance.

| Field | Value | What it does |
|---|---|---|
| `triggerDistance` | `5000` | **DEAD** — duel is triggered by SamuraiSystem, not distance. |
| `mercyHp` | `8` | Hits needed to drive the ronin to the mercy state. |
| `hitCooldown` | `6` | Frames between registered hits. |
| `mercyWarning` | `60` | Warning frames before the mercy window. |
| `mercyCharge` | `180` | Frames to charge/resolve the mercy outcome. |
| `executionWarning` | `90` | Warning frames before the execution strike. |
| `executionCharge` | `90` | Frames to charge the execution strike. |
| `respawnGap` | `7500` | **DEAD** — intended distance gap before respawn. |
