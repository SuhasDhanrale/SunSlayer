# Yokai Woven-System Design

**Status:** agreed gameplay direction; numeric values remain playtest tunables  
**Scope:** Yokai introduction, intensity highs/lows, pattern integration, swarms, spawn routes, roster progression, and water exclusion  
**Authority:** supersedes older statements that allow direct or raft-delivered Yokai in water

## 1. Locked design

Yokai are the game's main reactive slicing activity. Existing obstacle patterns remain important; Yokai weave into their empty space at low-to-medium intensity, then occasionally take over the playfield in a dedicated Fruit Ninja-style swarm.

The system must satisfy these rules:

- Yokai appear within the first 5-8 seconds of normal control.
- Yokai have genuine highs and lows; pressure does not escalate continuously.
- During normal patterns, at most one Yokai may be injected into an eligible empty pattern column.
- Normal woven probability never exceeds 30% per eligible column.
- At a Yokai peak, the next beat is one Yokai-only swarm with no obstacle pattern underneath it.
- Only a Yokai that physically touches the monk causes a stumble.
- An unsliced Yokai that leaves the screen causes no penalty.
- There is no wave-clear percentage, encounter grade, or missed-wave punishment.
- Yokai never spawn in water, directly or from a raft.
- Oni, Kitsune, and No-Face begin mechanically identical and gain variety through introduction order, group size, route, and visual combination.
- Reuse `RunDirector`, `PatternRunner`, the existing `x` symbol, `DemonSystem`, and the current Yokai-only patterns. Do not create a second director architecture.

## 2. Player-facing rhythm

Normal play alternates between two expressions of Yokai:

### Woven Yokai

A mostly normal obstacle pattern is running. One Yokai sometimes occupies a safe empty space in a pattern column. It feels surprising, but it is still arranged by the pattern's available space rather than spawned blindly over another read.

### Yokai swarm

The current obstacle pattern completes. The playfield then runs one Yokai-only pattern: singles, pairs, or triples arrive in a short Fruit Ninja burst. When that pattern completes once, normal patterns resume and Yokai intensity falls.

The intended cycle is:

> LULL -> RISE -> one PEAK swarm -> FALL -> LULL

The swarm is the payoff of the curve, not the way Yokai are introduced and not a pattern that repeats indefinitely.

## 3. Keep the existing architecture

There should be one coordinated route from pacing decision to entity spawn:

```text
RunDirector yokaiIntensity / phase
        |
        +-- normal beat -> PatternRunner injects optional x into a safe blank slot
        |
        +-- peak pending -> PatternRunner plays one existing Yokai-only pattern
                               |
                               +-- x -> DemonSystem.spawn / spawnWave
```

Responsibilities:

- `RunDirector` owns the Yokai phase, `yokaiIntensity`, blank-slot probability, and the decision to schedule one swarm at a pattern boundary.
- `PatternRunner` remains the only normal production path that emits `x` cells.
- `DemonSystem` chooses side or bottom motion, creates the mask entity, updates physics, detects natural contact, and removes escaped entities.
- `CombatSystem` retains slice detection, score, combo, hit-stop, split pieces, shake, flash, and ink feedback.
- `patterns.js` retains authored introductions and Yokai-only swarm definitions.

The current `tickWovenYokai()` directly calls `DemonSystem.spawnWave()` independently of the pattern. That direct spawn path should be removed. Its intensity idea is retained inside `RunDirector`, but its output becomes blank-slot injection or an intentional swarm pattern.

This avoids two simultaneous spawn authorities: direct timer bursts and pattern `x` cells.

## 4. Intensity highs and lows

The current sine wave rises and falls, but its fixed period is mechanically regular. Replace it with four randomized phases stored in the existing director state.

| Phase | Duration | Intensity behavior | Pattern behavior |
|---|---:|---|---|
| LULL | 6-10 s | stays around 0.05-0.15 | almost no blank-space Yokai |
| RISE | 6-9 s | smoothly moves from the lull toward 0.85 | blank-space probability increases |
| PEAK | one pattern pass | intensity = 1.0 | play one Yokai-only swarm; no obstacles underneath |
| FALL | 5-8 s | smoothly moves from about 0.65 back toward 0.05 | decreasing blank-space probability |

Phase durations receive modest random variation so the player can feel the rhythm without predicting an exact timer. Intensity interpolates smoothly; it must not jump between targets.

### Blank-space probability

For normal patterns:

```js
yokaiSpawnChance = 0.30 * yokaiIntensity;
```

Examples:

| Intensity | Chance per eligible column |
|---:|---:|
| 0.10 | 3% |
| 0.30 | 9% |
| 0.50 | 15% |
| 0.75 | 22.5% |
| 1.00 | 30% |

Roll once per eligible column, not once per empty row. Rolling separately for five empty rows would multiply the real spawn rate beyond the intended 30%.

If the roll succeeds, choose one eligible empty row and add one `x`. Never inject more than one woven Yokai into the same column.

### Long-run difficulty

Long-run progression must not raise the lull floor. Even late in a run, the curve returns to almost no Yokai.

Progression changes the content available at the high points:

- early peaks favor singles and pairs;
- later peaks allow more pairs and triples;
- later peaks may use the larger swarm pattern;
- speed may receive limited tuning after group composition is proven readable.

The game becomes harder through stronger peaks and richer combinations, not by permanently filling every empty space.

## 5. Guaranteed first 30 seconds

Do not use probability to introduce the game's main target. Randomness can produce a 30-second run with no Yokai even when the average rate looks correct.

The opening is authored and deterministic:

| Time | Content | Purpose |
|---:|---|---|
| 0-4 s | two simple bamboo cuts | confirm the swipe without pressure |
| 5-8 s | one guaranteed slow Oni, isolated | introduce the main target |
| 10-14 s | a second Oni using the other spawn route | teach the second route |
| 16-21 s | normal bamboo with one guaranteed Oni in a blank slot | teach weaving |
| 23-28 s | two-Oni mini-swarm | preview the later swarm rhythm |
| 28 s onward | enter a lull, then start the dynamic phase cycle | hand control to the system |

Opening rules:

- the first 30 seconds use only Oni;
- the first Oni is not mixed with a spike, arrow, bridge, TNT, or cave drop;
- introduction `x` cells are explicit and guaranteed, not generated by the 30% roll;
- the normal woven phase timer does not need to create random spawns during this authored introduction;
- the opening must be short enough that `teach-yokai` cannot be delayed behind multiple eight-second lessons and pattern replays.

The current behavior suppresses direct woven spawning while `d.intro` is non-empty and places `teach-yokai` after earlier lessons. That combination is why the first Yokai can arrive much too late.

## 6. Pattern integration

### Eligible blank slots

A normal pattern column may receive a woven `x` only when:

- the gameplay biome is not water;
- the pattern is not already a Yokai-only swarm;
- at least one row in the column is empty;
- the chosen row does not visually overlap an existing target in that column;
- the column is not reserved for an exclusive solve or inhibit read such as an arrow-ball, bridge, TNT target, or cave gate;
- the active unsliced Yokai cap has room when the cell is emitted.

Normal bamboo, spike, and cave timing patterns may receive a Yokai in a genuinely open row. The point is to use their black space, not to replace the pattern.

This injection should happen when the pattern is compiled or prepared, because `PatternRunner` already understands its columns and rows. The result remains an ordinary `x` cell and uses the existing emission path.

### Existing Yokai patterns

The three existing patterns have distinct jobs:

| Existing pattern | Final role |
|---|---|
| `teach-yokai` | guaranteed authored introduction; initially Oni-only |
| `food-yokai-pop` | smaller one-pass swarm for early and medium peaks; singles/pairs |
| `combo-yokai-swarm` | larger one-pass swarm for later peaks; singles/pairs/triples |

Both swarm patterns must be selected intentionally by the Yokai PEAK state. They should not also be randomly drawn from the normal `food` or `combo` deck.

Both are Yokai-only: while one is active, an obstacle pattern does not run underneath it.

Both are one-pass. The current difficulty-based dwell can replay `combo-yokai-swarm` for a long window; that would turn a peak into constant density. A `once`/non-repeating pattern property is clearer than trying to tune the dwell to every run speed.

### Swarm counts and cap

The current `combo-yokai-swarm` uses `burst: [2, 4]` and `cap: 14`. That is inconsistent with the agreed single/pair/triple vocabulary and with the existing woven live cap.

Target behavior:

- small swarm cells emit one or two Yokai;
- large swarm cells emit one, two, or three Yokai;
- the shared active-unsliced cap remains the final safety limit;
- a group is skipped or reduced when there is insufficient room under the cap.

Exact density and live-cap values are tuning parameters, but the swarm must never bypass the normal readability cap.

## 7. Spawn routes and locations

The production motion should preserve the two routes demonstrated in `FruitNinjaDemonsMock.jsx`.

### Side rush -- primary route

The Mock Lab uses this for about 80% of its targets:

- enter just beyond the right edge;
- choose a height inside roughly the upper 15-65% of the playfield;
- move right-to-left with limited vertical drift;
- pattern row may select the general high/middle/low band;
- leave naturally through the left or lower boundary if unsliced.

### Bottom launch -- accent route

The Mock Lab uses this for about 20% of its targets:

- begin below the lower edge;
- launch from the central 25-75% of the screen width;
- rise in an arc, cross the playable area, and fall naturally;
- do not appear directly on top of the monk.

These percentages establish the initial identity; later tuning may modestly increase bottom launches during swarms. Side rush remains the majority route.

No special collision route needs to be authored. Existing motion and collision determine whether an intact Yokai reaches the monk.

## 8. Slice, escape, and stumble rules

Every Yokai resolves independently:

- sliced -> award the existing score/combo and play the current impact reaction;
- touches the monk intact -> apply one normal stumble through the existing collision rule;
- leaves the screen intact -> remove it with no score and no punishment.

There is no formation success threshold. There is no requirement to slice 60% of a wave. There is no Samurai pressure for an escaped Yokai. A swarm is a high-value slicing opportunity, not a separate pass/fail mode.

Do not add guaranteed collision paths solely to force punishment. If several Yokai naturally reach the monk close together, existing collision behavior applies; any future multi-hit grace period is a combat-tuning question, not part of this spawning design.

## 9. Roster introduction and variety

Oni, Kitsune, and No-Face share one mechanical rule set initially:

- one slice defeats them;
- the same collision rule applies;
- all may use side or bottom routes;
- visual radius and rotation variation may remain;
- none has a hidden health, directional-cut, or punishment rule.

Their variety comes from when they enter the run and how they combine.

Suggested introduction order:

| Time | Available composition |
|---:|---|
| 0-30 s | Oni singles, then an Oni pair |
| 35-50 s | introduce Kitsune alone, then allow Oni/Kitsune singles and pairs |
| 60-80 s | introduce No-Face alone |
| after all solo introductions | mixed singles, pairs, and triples from all unlocked types |

Each new mask appears alone before it enters a mixed group. Otherwise the player may not register that a new character has joined the roster.

Group-size variety follows intensity:

- low intensity: almost entirely singles;
- rising intensity: singles with occasional pairs;
- small swarm: singles and pairs;
- large swarm: singles, pairs, and triples.

The times are tuning targets, but the ordering is a design rule.

## 10. Water rule

Water contains zero Yokai:

- no blank-slot injection;
- no `teach-yokai`, `food-yokai-pop`, or `combo-yokai-swarm` selection;
- no water-local `x` cells;
- no raft riders;
- slicing a raft cannot release Yokai.

Therefore:

- shared Yokai patterns must be restricted to land/surface and cave gameplay pools;
- `combo-vine-yokai` cannot remain a water pattern;
- `teach-raft` and `combo-raft-yokai` cannot retain their current Yokai-delivery behavior.

Whether a raft remains later as a non-Yokai water obstacle is a separate water-design decision. Do not invent a replacement raft mechanic as part of the Yokai work.

When approaching water, stop scheduling new Yokai early enough for visible targets to leave or resolve naturally. Do not visibly delete masks at the biome boundary.

## 11. Current implementation mismatches

The current repository does not yet implement this final direction:

1. `tickWovenYokai()` spawns independently of pattern space and can stack with explicit `x` patterns.
2. Its fixed sine period creates regular waves rather than randomized LULL/RISE/PEAK/FALL durations.
3. It is disabled throughout the scripted opening, while `teach-yokai` comes after earlier lessons.
4. `DemonSystem.spawn()` currently implements ground/bottom arcs even though its comments describe both bottom and right-side routes.
5. Pattern rows are ignored by `DemonSystem.spawn()`, so an authored `x` row does not currently choose a visible band.
6. `food-yokai-pop` and `combo-yokai-swarm` are randomly eligible in normal pattern categories rather than explicitly scheduled peaks.
7. `combo-yokai-swarm` may replay for its long difficulty-based dwell.
8. Its `[2, 4]` burst and cap of 14 exceed the agreed single/pair/triple vocabulary and normal woven cap.
9. Shared `ALL_BIOMES` Yokai patterns, `combo-vine-yokai`, and raft release still create Yokai in water.
10. `randomYokai()` makes all three types available immediately instead of following the introduction order.

The existing collision-only stumble rule is already correct and should remain.

## 12. Implementation sequence

1. Re-author the first 30 seconds so the first Oni is guaranteed by 5-8 seconds and only Oni appears during that window.
2. Replace the sine/direct-spawn logic with LULL/RISE/PEAK/FALL state inside `RunDirector`.
3. Inject at most one `x` into an eligible blank row per normal pattern column using `0.30 * yokaiIntensity`.
4. Mark the existing small and large Yokai swarm patterns as intentional, one-pass, Yokai-only beats and remove them from random category draws.
5. Align swarm bursts with singles/pairs/triples and enforce the shared active cap.
6. Add the Mock Lab side-rush route while retaining bottom launches; make authored `x` rows influence route bands where applicable.
7. Add the Oni -> Kitsune -> No-Face availability progression without changing their combat rules.
8. Remove every water Yokai path, including shared patterns, water `x` cells, riders, and raft release.
9. Tune timings, probabilities, group weights, and route mix in the Mock Lab.

## 13. Acceptance criteria

- A guaranteed Oni appears between 5 and 8 seconds after normal control begins.
- The first 30 seconds contain only Oni and include at least one single and one pair.
- Kitsune and No-Face each appear alone before entering mixed groups.
- Normal patterns roll no more than once per column and never exceed 30% injection probability.
- A successful normal roll creates at most one woven `x` in that column.
- Lulls return near zero even late in the run.
- Every PEAK schedules exactly one one-pass Yokai-only swarm.
- No normal obstacle pattern runs underneath the dedicated swarm.
- Small swarms use singles/pairs; large swarms use singles/pairs/triples.
- Direct timed spawns cannot stack on top of pattern-emitted Yokai.
- Only physical contact with the monk causes a stumble.
- Escaped Yokai cause no punishment.
- A water simulation schedules and spawns zero Yokai, including from rafts.
- Side rushes and bottom launches both appear, with side rushes remaining the majority.
- Existing slice score, combo, hit-stop, split pieces, shake, flash, and ink feedback remain intact.

## 14. Mock Lab tuning readout

The Yokai Slash Lab should expose only the measurements needed to tune this design:

- phase: LULL / RISE / PEAK / FALL;
- current `yokaiIntensity` and calculated blank-slot probability;
- current pattern and whether it is normal or Yokai-only;
- injected `x` count and rejected rolls by reason;
- active unsliced count and cap;
- swarm pattern id and pass count;
- single/pair/triple distribution;
- Oni/Kitsune/No-Face availability;
- side/bottom route distribution;
- slice, natural escape, and monk-contact counts.

Tune empty-space probability first, swarm density second, and motion speed last. High difficulty should come from readable combinations at the peaks while the lows remain genuinely quiet.
