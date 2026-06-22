# Flow Conductor — Implementation Plan

> Companion to the **Flow Conductor** section of the design doc
> ([DesignNotesMock.jsx](src/mocks/screens/DesignNotesMock.jsx), reachable in the Mock Lab).
> Sequenced so each phase is **independently testable**, lowest-risk and highest-feel first,
> and the architectural change (unifying the clock) lands only **after** the cheap wins prove
> the model. The biome-schedule extension to ~12 min comes **last** — extending it before the
> curve is fixed makes the run worse, not better.
>
> **The model in one line:** ONE phase clock (the yokai LULL→RISE→PEAK→FALL), two instruments —
> yokai = the always-present *slice* layer (a floor + breath), obstacles = the *threat* layer
> that surges on the build and recedes in the valleys — with a slow **macro-envelope** bounding
> the fast ~30s pulse so the run rises "slowly slowly" and never strobes to max.

---

## Grounding (verified in code, this is the current reality)

- **Two independent clocks today.** Obstacle conductor = `selectNext`/`baselineAt` REST↔PEAK
  ([RunDirector.js:215](src/systems/RunDirector.js#L215), [:193](src/systems/RunDirector.js#L193));
  yokai track = `advanceYokaiTrack` LULL/RISE/PEAK/FALL ([RunDirector.js:135](src/systems/RunDirector.js#L135)).
  They share nothing but the one-way `obstacleBreath` duck.
- **The yokai pulse is full-swing for the WHOLE run** — `lullIntensity [0.05,0.15]`,
  `riseTarget 0.85`, peak = `1.0`, all **fixed constants** ([config.json:85-92](src/data/config.json#L85)).
  `advanceYokaiTrack` never reads run time → no macro-envelope → a ~30s strobe late.
- **`obstacleBreath` ducks fields only, not authored grids** ([RunDirector.js:22](src/systems/RunDirector.js#L22)) —
  it scales `target`/density; spike/bridge **grids** are unaffected (DESIGN #97 gap).
- **Three yokai delivery paths** (the data-level "two conductors"):
  1. shape cadence `tickShapes → spawnShape` ([RunDirector.js:305](src/systems/RunDirector.js#L305)) — *the one we keep*;
  2. `x`-cells authored into grids ([patterns.js:88](src/data/patterns.js#L88) etc.);
  3. woven blank-cell injection via `allowWoven` ([RunDirector.js:255](src/systems/RunDirector.js#L255) → PatternRunner).
- **`food` is a phantom category in bamboo** — only members are `yokaiOnly`/grove, so
  `draw('food')` falls through to **obstacle** ([RunDirector.js:200-206](src/systems/RunDirector.js#L200)).
  The `yokaiOnly` swarm fixtures ([patterns.js:115-121](src/data/patterns.js#L115)) are likely vestigial.
- **`draw()` leaks the difficulty cap** — drops `difficulty <= maxDiff` when the capped pool is
  empty ([RunDirector.js:204](src/systems/RunDirector.js#L204)).
- **Openings rebuild on every gameplay-biome change** ([ensureInit:270](src/systems/RunDirector.js#L270) →
  [createDirector:177](src/systems/RunDirector.js#L177)); only `once` patterns are globally remembered
  ([beginPattern:288](src/systems/RunDirector.js#L288)). `visualToGameplay` collapses 6 of 7 biomes to
  `bamboo` ([BiomeSystem.js:55](src/systems/BiomeSystem.js#L55)) → the bamboo curriculum re-teaches ~6×/run.
- **Curve runway ends mid-run** — obstacle baseline flat after `rampSeconds 480`, peak clamps to
  1.0; speed maxes at 360s ([config.json:16](src/data/config.json#L16)). **Schedule stops at volcano 290s**
  and `BiomeSystem` clamps to the last entry ([BiomeSystem.js:96](src/systems/BiomeSystem.js#L96)).
- **Tuning rig exists** — `PacingOverlay.draw` gated by `s.debugPacing` ([PacingOverlay.js](src/debug/PacingOverlay.js)),
  plus `RunDirector.simulate` ([:398](src/systems/RunDirector.js#L398)) for offline curve checks.

---

## Phase table

| # | Phase | Risk | Depends on | The deliverable |
|---|---|---|---|---|
| 0 | Audit + overlay the phase/envelope | trivial | — | confirm the 3 yokai paths & dead swarms; overlay shows master phase + envelope band |
| 1 | Macro-envelope + yokai floor | low | 0 | the ~30s pulse rides a slow rising band; yokai never zero on land |
| 2 | ✅ Honest difficulty cap + late-envelope reshape | low | 0 | `draw()` respects the cap; peaks capped below max, valleys stay deep late |
| 3 | ✅ **Unify the clock** (obstacle layer reads the shared phase) | med-high | 1, 2 | one wave: RISE=obstacles build, PEAK=duck to floor, LULL=rest |
| 4 | ✅ De-yokai `patterns.js` (one yokai path) | med | 3 | remove `x`-cells + woven injection + `food`; patterns = threat only |
| 5 | ✅ Teach once per run per biome | low | — (parallel) | kill the sawtooth re-teach; short re-entry beat instead |
| 6 | 🟡 Hard set-pieces one-pass + extend schedule to ~12 min | med | 3, 4 | no dwell-replayed walls; authored 12-min timeline |
| 7 | **Playtest gate** — tune the two scales | — | 1–6 | lock envelope shape, peak cadence, valley depth, duck floors |

Phases 0–2 are additive and shippable on the **current** two-clock structure (immediate feel
wins, near-zero risk). Phase 3 is the one real architectural change. Phase 5 is independent and
can run any time. Phase 6 (incl. the 12-min schedule) lands only once the curve holds.

---

## Phase 0 — Audit + overlay (foundation, no behavior change)

- **Verify the three yokai paths** and whether the `yokaiOnly` swarms (`food-yokai-pop`,
  `combo-yokai-swarm`) still fire anywhere now that PEAK is timed. Grep `allowWoven`,
  `yokaiOnly`, `special: 'yokai-swarm`, and the `x` emit path in PatternRunner. Output a short
  "safe to remove" list to confirm before Phase 4 touches anything.
- **Extend [PacingOverlay.draw](src/debug/PacingOverlay.js)** to print, per frame: the master
  `phase`, the live `yokaiTrack.intensity`, **and** the new envelope band (floor↔ceiling for the
  current run time). This is the tuning rig for Phases 1–3 and 7 — you cannot tune a curve you
  can't see. Debug layer only; never read by gameplay systems.
- **Check:** overlay shows phase + intensity + band; audit list reviewed by hand.

---

## Phase 1 — Macro-envelope + yokai floor (the "30s strobe" fix)

- **New tunables → [config.json](src/data/config.json) `yokaiWoven`:** an envelope sized in run
  seconds — e.g. `envelopeSeconds` (how long the band takes to climb), `floorBand:[loStart,loEnd]`
  (LULL floor early→late) and `ceilBand:[hiStart,hiEnd]` (PEAK ceiling early→late, **hiEnd < 1.0**).
  Mirror defaults in [constants.js `YOKAI_WOVEN`](src/config/constants.js#L87).
- **Edit [advanceYokaiTrack](src/systems/RunDirector.js#L135)** to take run elapsed seconds and
  compute the envelope `t = clamp01(activeSec / envelopeSeconds)`. The pulse still runs LULL→PEAK,
  but `startLull`/`startRise`/`startPeak` map their from/to into the **enveloped band**: LULL floor
  = `lerp(floorBand)`, PEAK ceiling = `lerp(ceilBand)`. Early = narrow low band; late = higher
  band capped below max. Keep the existing jitter so it never feels metronomic.
- **Yokai floor:** the LULL floor is now non-zero by construction (the slice layer is always
  present on land); confirm `tickShapes` keeps a minimum cadence at LULL so there's always
  something to slash. Water still pauses the track (the macro-valley) — unchanged.
- **Checks (offline + live):** `RunDirector.simulate` over 12 min shows pulse amplitude rising
  with time and the ceiling never hitting 1.0; overlay band visibly widens/rises across a run;
  early game feel is unchanged.

---

## Phase 2 — Honest difficulty cap + late-envelope reshape  ✅ DONE

> **Landed.** `draw()` enforces a HARD cap: `within()` keeps every fallback at or
> below `maxDiff`, and the last-resort fallback picks the LOWEST-difficulty *fitting*
> pattern rather than an arbitrary hard one above the cap — a set-piece is opt-in by
> phase, never a fallback accident. `obstaclePlan` reshapes the envelope from
> `config.json pacing`: the valley is clamped by `restCeil` (so the rising baseline
> can't drown late LULL/FALL beats) and the RISE crest by `peakCap` (`0.85`, below
> 1.0). Verified offline over 12 min: RISE crest max ≈ `0.88` (never 1.0), LULL valley
> stays ≈ `0.22` (deep even late), and **zero** diff≥3 set-pieces appear under a low
> curve.

- **Fix the cap leak in [draw()](src/systems/RunDirector.js#L200):** when the
  `category + difficulty<=maxDiff` pool is empty, fall back **within** the cap (lower difficulty /
  another category that fits the cap), **never** above it. A hard set-piece is opt-in by phase,
  not a fallback accident.
- **Reshape the obstacle envelope** ([baselineAt](src/systems/RunDirector.js#L193) /
  [selectNext](src/systems/RunDirector.js#L231)): cap the PEAK target below 1.0 and keep REST a
  genuine dip even late (don't let the rising baseline drown the valleys). Pull the relevant
  numbers from `config.json pacing` — no new literals in code.
- **Checks:** `simulate` shows REST beats stay low through minute 12; no diff-3 set-piece appears
  while the curve is low; PEAK never pins at max.

---

## Phase 3 — Unify the clock (the architectural core)  ✅ DONE

> **Landed.** `selectNext` no longer runs its own REST↔PEAK oscillator (the
> `director.phase`/`phaseLeft` state is gone); obstacle density + category are driven
> by the yokai master phase via `obstaclePlan` (flat per-phase targets: LULL/FALL =
> valley, RISE = crest, PEAK = `backoffFloor` duck). `baselineAt` stays the macro-
> envelope. PEAK draws **fields only** (`draw(..., fieldsOnly)`) so no grid wall lands
> under the burst. `obstacleBreath` removed (the PEAK duck is the real law now).
> `simulate()` advances a master track so the offline curve reflects the unified wave.
> Verified: 12-min sim reads LULL≈0.22 → RISE≈0.81 → PEAK≈0.15 → FALL≈0.22. Next: Phase 4.

- **Make the yokai LULL/RISE/PEAK/FALL the single master phase.** Stop running the obstacle
  conductor's independent REST↔PEAK oscillation; instead drive obstacle **category + density**
  from the shared phase in [selectNext](src/systems/RunDirector.js#L215):
  - **LULL** → `rest` (coins) / near-empty: the real valley (yokai trickle still slashable).
  - **RISE** → `obstacle`, density climbing: the threat build leads.
  - **PEAK** → obstacle **ducks to a thin tempo floor** so the yokai burst leads (this replaces
    the `obstacleBreath` band-aid with the actual law — and it must duck **grids** too, e.g. by
    restricting the PEAK deck to sparse field patterns, not authored spike/bridge walls).
  - **FALL** → thinning obstacles, comedown.
- Keep `baselineAt` only as the slow **macro-envelope** on obstacle loudness (one envelope, shared
  intent with Phase 1) — not a second oscillator.
- **Phase-lock guarantee:** one layer leads each phase, the other holds its floor → intensity
  without pile-up; valleys are authored (both quiet), not accidental.
- **Checks:** overlay shows obstacle density and yokai intensity rising/falling **together** on one
  phase; a PEAK reads as a yokai burst over a thin obstacle floor (no spike wall under it); LULL is
  a true breather with a slashable trickle.

---

## Phase 4 — De-yokai `patterns.js` (one yokai path)  ✅ DONE

> **Landed.** Yokai now arrive through ONE path — the shape cadence
> (`RunDirector.tickShapes` → `yokaiShapes.js`). The woven blank-cell injection
> is gone (`injectWovenYokai` deleted from PatternRunner; `compileContext` no
> longer passes `allowWoven`; `maxChance` marked DEAD). The dead yokai-only
> fixtures (`teach-yokai`, `food-yokai-pop`, `combo-yokai-swarm`) are removed and
> the `food` category is dissolved (`bonus-coins` → `rest`; `CATEGORIES` drops
> `food`, killing the food→obstacle fallback). The only authored `x` left is the
> grove-only `bonus-swarm`. The scripted INTRO onboarding (`applyIntroDirective`)
> keeps its own `x` path — that's the onboarding curriculum, not woven density.
> The cave/bamboo `combo-*-yokai` grids that leaned on woven yokai for their second
> read are now thin single-element beats (comments flag them for Phase 6 re-author).
> Verified: `validate:patterns` (27 patterns), `validate:yokai`, and all 50 tests
> pass; lint clean. Next: Phase 5.

- **Remove the `x`-cell yokai** from authored grids and the **woven blank-cell injection**
  (`allowWoven` path) — all yokai now come from the shape cadence. `compileContext` no longer needs
  `allowWoven`; PatternRunner's inject path is deleted/neutered.
- **Dissolve the `food` category:** drop it from `selectNext`, remove the phantom food draws (fixes
  the food→obstacle fallback), and delete the vestigial `yokaiOnly` swarm fixtures confirmed dead in
  Phase 0. Categories settle to `teach / obstacle / rest` (+ `combo` only for *obstacle-on-obstacle*
  set-pieces, e.g. spike+bridge).
- **patterns.js is now purely the threat vocabulary.** Update the file header legend (the `x` symbol
  note) and `CONFIG_REFERENCE.md` if it lists categories.
- **Checks:** grep shows no `x` in normal-pool patterns and no inject call; a run still has yokai
  (from shapes only) and obstacles never spawn a yokai; tests in `tests/` still pass.

---

## Phase 5 — Teach once per run per biome (parallel, kills the sawtooth)  ✅ DONE

> **Landed.** `s.taughtBiomes` (seeded in `GameState` / `GameScreen`, resets per run)
> remembers which gameplay biomes have been taught. `ensureInit` marks the biome and
> passes `firstVisit` to `createDirector`: first entry loads `OPENINGS[biome]`; every
> re-entry plays exactly ONE rest re-acclimation beat (`rest-gold-rush`, a breather —
> not a difficulty:0 tutorial) then drops into the procedural curve at its current
> height. Verified: first bamboo entry runs the full curriculum, a later bamboo entry
> intro is just `[rest-gold-rush]`.

- **Give openings run-level memory** like `once` patterns already have: seed a `s.taughtBiomes` set;
  in [createDirector](src/systems/RunDirector.js#L177)/[ensureInit](src/systems/RunDirector.js#L270),
  load `OPENINGS[biome]` only on the **first** entry to that gameplay biome this run.
- **On re-entry:** skip to procedural, or play **one** short re-acclimation beat — and if you want
  the post-transition breather, make it a `rest` beat, **not** a `difficulty:0` tutorial.
- **Checks:** across a multi-biome run the bamboo curriculum plays once; later biome entries drop
  straight into the procedural curve at its current height (no intensity crash); first-time players
  still get each biome's lesson once.

---

## Phase 6 — Set-pieces one-pass + extend schedule to ~12 min  🟡 IN PROGRESS

> **Done so far:**
> - **One-pass set-pieces** — `RunDirector.tick` skips the dwell-replay for any pattern
>   at/above `pacing.setpieceDiff` (`3`), so a hard wall is an occasional moment, not a
>   curtain repeated 2–3× at late speed. (The fix is by-difficulty, not distance-based;
>   simpler and it directly kills the late-speed replay.)
> - **Runway sized to ~12 min** so the curve doesn't flatten mid-run: speed tiers extend
>   to `2.75×@540s`/`3.0×@720s`, `pacing.rampSeconds 480→720`, `yokaiWoven.envelopeSeconds
>   360→600`. Verified offline to 16 min: RISE crest climbs 0.62→0.86 (never 1.0, no
>   flat-max wall); LULL stays a genuine dip throughout.
> - **Schedule** — extended by hand in [biomeSchedule.js](src/data/biomeSchedule.js) out
>   to ~16 min.
>
> - **Same-biome grove detours now fire** (engine change). `BiomeSystem.tick` edge-
>   triggers on the active entry's `atSec` (not on biome change), so a grove `via` runs
>   even when its biome equals the current one — a BONUS DETOUR through the short grove
>   tunnel that returns to the same biome (the grove IS the transition leg). A same-biome
>   CAVE entry stays a no-op (no detour requested). Previously these legs silently never
>   ran. Verified: a sakura→grove→sakura detour begins; a same-biome cave entry holds.
>
> **Decisions made (this pass):**
> - **Post-timeline = CLAMP** (not rotation). The schedule is authored explicitly out to
>   ~16 min; beyond the last entry the run holds on the final biome. (A `BIOME_LOOP`
>   rotation was considered and deliberately NOT wired.)
>
> **Caveat for schedule authoring:** the edge-trigger only fires in STEADY, so an entry
> that comes due WHILE a transition is still running gets skipped. Space entries farther
> apart than the connector leg they follow (the long cave especially), or the bonus/biome
> change won't land.

- **Hard set-pieces stop dwell-replaying:** make the dwell window distance-based (or mark diff≥3
  patterns one-pass) so a set-piece is an occasional moment, not repeated 2.5× at late speed
  ([RunDirector.js:388](src/systems/RunDirector.js#L388)).
- **Extend [biomeSchedule.js](src/data/biomeSchedule.js)** to author the full ~12-min timeline (and
  resolve the post-volcano question: a real rotation/loop instead of clamping on volcano). Sync the
  speed/pacing **runway** to the new length (or commit to a deliberate max-intensity endgame where
  variety comes from biome rotation, not escalation).
- **Checks:** a full 12-min run holds the flow channel end-to-end; no flat max wall; bosses/gate
  cadence (distance-gated) still reasonable over the longer distance.

---

## Phase 7 — Playtest gate (tune the two scales)

- With the overlay, tune over a **full 12-min run**: envelope shape (floor/ceiling bands), pulse
  period (the "slowly" — longer swells vs. ~30s), valley depth late, and the **duck floors** (how
  much of the off-layer remains when the other leads).
- **The three taste calls to lock here** (from the design chat): valley obstacle residual (true zero
  vs. light), where deep rest lives, and wave length. Set numbers in `config.json`; no code change.

---

## Cross-cutting invariants to honour (from CLAUDE.md)

- **No React in engine layers** — all of this is `RunDirector` / `patterns.js` / `config`. Audit:
  `grep -rE "useState|useRef|from 'react'" src/systems/ src/data/`.
- **Data vs config** — envelope/band/period tunables live in `config.json`; shape geometry in
  `yokaiShapes.js`; thresholds read via `GameConfig`/constants. Never re-hardcode a literal that
  also lives in data (this is the recurring trap).
- **Debug never leaks** — the overlay/phase readout stays in `src/debug/`, never inside the
  selection/spawn branches.
- **Keep `simulate()` honest** — extend it to model the unified phase (and ideally the yokai layer)
  so the offline curve check reflects what the player actually feels.

## Suggested commit slices

`feat: overlay master phase + envelope band` · `feat: yokai macro-envelope + floor` ·
`fix: honest difficulty cap + late-envelope reshape` · `feat: unify obstacle layer onto the yokai phase clock` ·
`refactor: patterns.js = threat only (single yokai path)` · `feat: teach openings once per run per biome` ·
`feat: one-pass set-pieces + 12-min biome schedule`.
