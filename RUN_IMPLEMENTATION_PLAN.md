# Bamboo Slicer — Run Design Implementation Plan

> The actionable execution layer under [RUN_DESIGN.md](RUN_DESIGN.md). RUN_DESIGN is *what*
> and *why*; this is *how*, *in what order*, *which files*, and *what can break*. Locked
> decisions live in RUN_DESIGN §8 and the "Decisions" section below. Update this file as steps
> land (check the boxes). Mirror any design changes back to RUN_DESIGN and the Design Notes mock.

Phase: **PROTOTYPE — mechanics first.** Placeholder shapes only; no art/juice/audio/meta.
Per [CLAUDE.md](CLAUDE.md) we follow the prototype reality (single `useRef` in `GameScreen.jsx`,
systems mutate state + call `handleGameOver` directly). We do **not** refactor toward the
bus/state-machine invariants mid-prototype.

---

## 1. Why this change

In a one-verb game the unit to budget is the **player's RESPONSE, not the obstacle**
(RUN_DESIGN §1). The prototype carries a **16-spec roster** for a player who only ever slices —
content bloat, not depth. We collapse it to **5 slice reads + 1 don't-slice + 1 pressure enemy**,
re-skinned per biome.

The conductor engine is **sound and kept** (RUN_DESIGN §6): `RunDirector` (tension curve),
`PatternRunner` (grid/field DSL), biome pools, dwell, openings already produce the desired
highs/lows. The work is: **cut the dead roster, re-author the library, build the 3 things the
conductor doesn't cover** (samurai pursuit, don't-slice arrows, lethal TNT cave-gate), then re-tune.

## 2. Decisions (locked)

| # | Decision | Source |
|---|---|---|
| D1 | Death = **exactly two sources**: solid blockers (gap/gate) + the samurai. No UI meter — the samurai is the diegetic meter. | RUN_DESIGN §3 |
| D2 | **Evolve the existing ronin into the escalating samurai**; **delete `PunisherSystem`**. Reuse the ronin's Z-axis dash + render. | this session |
| D3 | **The arrow-ball IS the don't-slice element.** Ignore it (let it pass) → safe. **Mis-slicing it → bursts the volley** (reuse `BossSystem` archer). **Arrow hits = a stumble** (feed the samurai), never instant death. Archer code is **kept & re-wired**, not retired. | this session |
| D4 | Keep: bamboo (thin/thick), spikes (+cave glow skin), stalactites (cave timing), yokai, **one** bridge, TNT (cave-gate), `sea_vine`, raft (yokai platform), boulder (set-dressing/wall only). | RUN_DESIGN §7 |
| D5 | Cut: `spikedboulder` (mine), `spikebarrel` (barrel), `net`, `fish`, `drawbridge`, `smallbridges`, `caveboulder`, boulder-as-dodge. | RUN_DESIGN §7 |
| D6 | Yokai **WOVEN** (independent `yokaiIntensity` track). Water = **breather** (vines + raft-yokai only; no spikes/arrows/blockers; only death is the samurai). Cave-gate **lethal every time**; frequency managed by a **generous slice window that tightens with the ramp**. | RUN_DESIGN §3/§4/§5 |

**Still tuning (yours, in playtest):** samurai de-escalation rate (RUN_DESIGN §8 open question);
cave-gate window generosity curve. Code seeds defaults in `data/config.json`.

## 3. Current wiring (ground truth)

`GameScreen.jsx` `gameLoop`, per frame:
`BiomeSystem.tick` (sets `playerBiome`/`spawnBiome`/`visualBiome`) → `SegmentSystem.tick`
(archer cadence + ronin at `stumble.count ≥ 3`) → `BossSystem.tick` → `CombatSystem.tick` →
monk move/fall → **if `!boss.active`**: `RunDirector.tick` → `PatternRunner.tick` →
`CoinReward.tick` → `SpawnSystem.tick` → `DemonSystem.tick` → `PunisherSystem.tick`.

- **Death today:** bridge pit (`monk.falling`→game over, `PhysicsSystem`), archer arrow hit
  (lethal), ronin reaches monk (lethal), `monk.x < 0`.
- **Stumble feeders today:** uncut bamboo/spike/mover contact, demon arc into monk, boulder trip,
  punisher contact. All bump `s.stumble.count` + `s.stumble.slowTimer`.
- **Renderer dispatch:** [GameRenderer.js:228](src/renderer/GameRenderer.js#L228) — any obstacle
  with a `specId` draws via `drawObstacle()` and returns early. **All of
  spike/vine(water)/stalactite/mine/net/raft/barrel/tnt/bridge/boulder carry specIds**, so their
  inline `b.type === …` branches (lines 234–379) are **dead code**. Only ground-vine and
  basic/thick bamboo use inline branches. ⇒ removing inline mine/net/barrel branches is safe.
- **Spec registry:** [src/obstacles/specs/index.js](src/obstacles/specs/index.js) imports 16
  specs; `attachObstacleSim` → `createObstacleSim` **throws `Unknown obstacle spec`** if a placer
  passes an id not in the registry. Deletion must be lockstep.
- **Cut specs are referenced ONLY** by: `specs/index.js`, the placers in `ElementDirector.js`,
  the symbols in `PatternRunner.js`, the patterns in `patterns.js`, and the read-only mock
  `AssetLibraryMock.jsx` (a gallery — safe to leave, or prune later; not in the run path).
  `data/PaternsOld` is a dead backup file — ignore.

---

## Phase A — Roster cut + library re-author  *(foundational, destructive)*

**Goal:** delete the dead roster, prune the runner, rewrite `patterns.js` to the 5-family
vocabulary, re-tune pacing. After this the run should load and play with only the new families.

### Steps
- [ ] **A1. Prune symbols** in [src/systems/PatternRunner.js](src/systems/PatternRunner.js)
  `emitCell`: remove `m` (mine), `n` (net), `B` (barrel), and `O` (boulder-as-dodge — boulder
  becomes gate-only set-dressing placed by the cave-gate, not a pattern cell). Keep `. i I v s =
  T K R x o`. Reserve **`a` = arrow-ball** (wired in Phase D). Update the legend comment (lines
  9–12) and the import line (drop `placeNet`; rename `placeMover`→`placeStalactite`, see A2).
- [ ] **A2. Prune placers** in [src/systems/ElementDirector.js](src/systems/ElementDirector.js):
  - Delete `placeNet`.
  - Replace `placeMover(s, kind, …)` with `placeStalactite(s, x, h)` — keep only the stalactite
    body (the `else` branch). It currently pushes with spec `'glowspikes'` as a placeholder skin;
    **keep that for Phase A** (works; a dedicated `stalactite` spec is a Phase B/cave refinement).
    Leave a `// TODO(stalactite spec)` marker.
  - Collapse `BRIDGE_VARIANTS` + `pickBridgeSpec` to the single `bridge` spec. `placeSetpiece`
    keeps `boulder` (still used by the future cave-gate) + `bridge` only.
- [ ] **A3. Delete cut spec files** and their imports in
  [src/obstacles/specs/index.js](src/obstacles/specs/index.js): remove `spikedboulder.js`,
  `spikebarrel.js`, `net.js`, `fish.js`, `drawbridge.js`, `smallbridges.js`, `caveboulder.js`.
  Keep: `spike`, `bridge`, `boulder`, `tnt`, `glowspikes`, `sea_vine`, `raft`, `bamboo_thin`,
  `bamboo_thick`.
- [ ] **A4. Rewrite** [src/data/patterns.js](src/data/patterns.js) to the 5-family library
  (delete every pattern using `O`-dodge / `m` / `n` / `B`). Target shape:
  - **ground/bamboo:** tempo (`i`/`I` fields), spike-low (`s`), yokai woven (`x`, incl. bursts),
    one bridge solve (`=`), arrow-ball don't-slice (`a`, Phase D), coin rests (`o`).
  - **cave:** stalactite-timing (`T`), glow-spike low (`s`), bamboo (`i`), yokai (`x`), TNT
    (`K`) — the entrance gate itself is a leg-begin trigger (Phase B), not a pool pattern.
  - **water:** vine tempo (`v`) + raft→yokai (`R`) only (fleshed out in Phase E).
  - Re-author `OPENINGS.{bamboo,cave,water}` to teach the new set (introduce → isolate →
    reinforce). **Every id listed must exist in `PATTERNS_BY_ID`.**
- [ ] **A5. Re-tune pacing**: `PACING` in [src/data/config.json](src/data/config.json) for 5
  families; fix `MAX_DIFFICULTY` in [src/systems/RunDirector.js](src/systems/RunDirector.js)
  (currently `3` while a pattern declares difficulty `4` → that pattern is uncapped/odd).
- [ ] **A6. Renderer cleanup**: delete the dead inline `mine`/`net`/`barrel` branches in
  [src/renderer/GameRenderer.js](src/renderer/GameRenderer.js) (≈ lines 321–379). Keep
  `stalactite`, `raft`, `tnt`, `spike`, `vine`, `bridge`, `boulder`, bamboo.

### Possible breakage (Phase A)
- **Dangling spec id → hard crash.** If any placer/symbol/pattern still names a deleted id
  (`spikedboulder`, `spikebarrel`, `net`, `fish`, …), `createObstacleSim` throws and the frame's
  try/catch paints the error on canvas. **Mitigation:** cut symbol + placer + pattern together;
  after editing, grep the whole `src/` for each id and for `placeNet`/`placeMover`.
- **Silent dead beats.** A surviving pattern that references a pruned symbol emits nothing (no
  throw) → empty stretches. **Mitigation:** rewrite `patterns.js` wholesale, not in place.
- **Broken opening.** An `OPENINGS` id missing from `PATTERNS_BY_ID` makes `selectNext` shift a
  `null` (guarded to `PATTERNS[0]` — wrong content, not a crash). **Mitigation:** cross-check ids.
- **`draw()` fallback in `RunDirector`** filters by `p.biomes.includes(biome)`; if a biome ends up
  with an empty category deck it falls back to `obstacle`, then any pattern. Ensure each biome has
  ≥1 pattern per category it will be asked for (rest/food/obstacle/combo/teach).

### Verify (Phase A)
Run (`/run` or `npm run dev`). No `Unknown obstacle spec` error on canvas; grep shows zero
references to cut ids outside `AssetLibraryMock.jsx`; ground/cave/water each spawn only the new
families; the opening teaches them in order; no empty stretches.

---

## Phase B — Unified blocker death (solve-or-die) + TNT cave-gate

**Goal:** one rule — *fail a visible blocker = death* — covering the bridge gap and the new
cave-gate, with a generous-then-tightening slice window.

### Steps
- [ ] **B1.** Confirm the **bridge-gap death** path still works end to end: `placeSetpiece`
  bridge → `spec.gap` read in [src/systems/PhysicsSystem.js](src/systems/PhysicsSystem.js) →
  `monk.falling` → drop + `handleGameOver` in `GameScreen`. This is the reference lethal path.
- [ ] **B2. Build the TNT cave-gate** set-piece: a boulder **wall** across the entrance + a TNT
  node. New `placeGate(s, x, h)` in `ElementDirector` (boulder wall is the only sanctioned
  `boulder` use now). Slicing the TNT → `CombatSystem.explode` (**already chain-clears boulders in
  radius**) → wall blows → safe pass.
- [ ] **B3. Lethal-on-fail:** if the wall reaches the monk un-cleared, route through the same
  game-over path as the bridge (a wall crash — *not* a stumble). Distinct from the boulder's
  current stumble-only contact in `PhysicsSystem`; gate-walls carry a flag (e.g. `b.gate = true`)
  so only the gate is lethal, never an ambient boulder.
- [ ] **B4. Trigger at every cave entrance** (not a random conductor pick): fire `placeGate` when
  a cave leg begins — hook off `BiomeSystem` `seq.caveReset` / leg-begin, consumed in
  `GameScreen` (same spot that resets the cave instance). Vary boulder arrangement per spawn.
- [ ] **B5. Window tunables** in `config.json`: gate lethal-contact band / TNT slice window starts
  wide, narrows with the run ramp (read via `getSpeedFactor`/elapsed). Default generous.

### Possible breakage (Phase B)
- **Cave must be a real sustained gameplay leg.** Verified the cave *is* live for a wide span
  (`BiomeSystem.gameplayAtScreenX` returns `'cave'` while the rock region — far wider than the
  screen — is on screen; `RunDirector.ensureInit` re-inits to the cave opening when `spawnBiome`
  flips to `'cave'`). **The new risk is the entrance trigger**: `seq.caveReset` fires once at
  leg-begin — ensure the gate spawns at the right world-x (ahead, off the right edge) and isn't
  double-spawned or eaten by the director re-init.
- **Accidental universal lethality.** If the lethal check keys off `b.type === 'boulder'` instead
  of the `gate` flag, every set-dressing boulder kills. Gate only.
- **Explosion chain reach.** `explode()` clears boulders within 230px; a wide wall may exceed
  that. Size the wall to the chain radius or widen the chain for gates.
- **Slow-window vs scroll.** If the tightening window outruns the scroll speed late-game the gate
  becomes unfair; clamp the minimum window.

### Verify (Phase B)
Un-cut bridge gap kills; every cave entrance shows the gate; slicing TNT clears the wall (safe);
failing the gate kills (not stumbles); early window feels generous; ambient boulders never kill.

---

## Phase C — Samurai (evolve ronin, delete punisher) — the spine

**Goal:** one persistent, escalating, appear-on-miss pursuer that is the only non-blocker death.

### Steps
- [ ] **C1. Delete `PunisherSystem`**: remove
  [src/systems/PunisherSystem.js](src/systems/PunisherSystem.js); its `GameScreen` tick call +
  state (`s.punishers`, `s.punisherLastStumble`); the punisher-slicing block in
  [src/systems/CombatSystem.js](src/systems/CombatSystem.js) (lines ~188–197); the punisher draw
  in `GameRenderer`; the `PUNISHERS` import where unused.
- [ ] **C2. Add `s.samurai` sub-object** in `GameScreen` initial state (distinct from `s.boss`):
  `{ tier: 0, x, y, scale, pose: 'absent'|'watching'|'drawn', coolMeter, … }`. Tier model:
  - **0 absent** — clean run, off screen, zero load.
  - **1 watching** — first stumble → appears, sheathed, stalking (warning only; run continues).
  - **2–3 drawn** — further stumbles → draws, closes distance → kill-duel → death at top tier.
  - **De-escalation** — a stumble-free distance/time window drops one tier (default in
    `config.json`; biome-aware in Phase E: water cools faster).
- [ ] **C3. Samurai system** — evolve `BossSystem` ronin logic (reuse Z-dash + render) into a
  `SamuraiSystem.tick` (or a `BossSystem.tickSamurai`) that:
  - escalates on `s.stumble.count` deltas, de-escalates on clean play,
  - drives proximity/pose so **watching vs drawn read at a glance** (placeholder poses now),
  - **only the kill-duel owns the screen** (boss-style takeover/slow-mo); tiers 1–2 run alongside
    normal gameplay.
- [ ] **C4. Rewire the trigger**: in [src/systems/SegmentSystem.js](src/systems/SegmentSystem.js)
  replace the one-shot `stumble.count ≥ 3 → BossSystem.startRonin` with feeding stumbles into the
  samurai tier model. Keep the run continuous (no one-off ambush reset).

### Possible breakage (Phase C)
- **Screen-ownership assumption.** `BossSystem.tick` + `GameScreen`'s time-ramp + the
  `if (!s.boss.active)` spawn gate assume a boss *freezes the run and clears arrays*
  (`startRonin` empties `s.bamboo/coins/demons`). A persistent stalking samurai must **not** do
  that in tiers 1–2 — only the final kill-duel. **Mitigation:** keep tiers 1–2 outside
  `boss.active`; only set the boss-style takeover for the duel.
- **Feedback gap during migration.** Deleting the punisher removes cave/water "you stumbled"
  feedback. Land the samurai (already global) **before** removing the punisher, or stumbles feel
  consequence-free mid-build.
- **Double death sources.** Ensure the old ronin lethal path and any archer lethality are gone
  (Phase D handles archer) so death is *only* blockers + samurai-kill-duel.
- **De-escalation runaway.** If clean-play cooling is faster than stumble accrual at high speed,
  the samurai never escalates; if slower, one bad patch snowballs to a kill. Expose both rates;
  default conservative.

### Verify (Phase C)
Clean run → no samurai on screen; first stumble → watching pose; more stumbles → draws and can
kill via the duel; a clean stretch re-sheathes him a tier; punisher fully gone (no spider/carp);
no soft-lock after the duel resolves; run resumes.

---

## Phase D — Don't-slice arrows + raft rework + woven yokai

### Steps
- [ ] **D1. Arrow-ball as don't-slice element (re-wire archer):**
  - Make the arrow-ball **conductor-spawnable** via symbol `a` (drift across the lane). Add a
    `placeArrowBall`/emit case. **Uncut → passes harmlessly.** Remove the
    auto-burst-when-it-reaches-the-monk behavior in
    [src/systems/SegmentSystem.js](src/systems/SegmentSystem.js) (withholding must be safe).
  - **Slicing it (the mis-slice) → burst the volley** via existing `BossSystem.startArcher`.
  - **Arrow hits → a stumble** (feed the samurai), NOT `handleGameOver`: change the lethal arrow
    hit in `BossSystem` archer `active` phase, and the crimson-arrow path in `GameScreen`
    `handlePointerUp`, to bump `s.stumble.count` + slow instead of game over.
  - Decide whether the volley keeps its slow-mo + screen-clear (default: keep — reads as a
    punishment) or becomes a lighter burst.
- [ ] **D2. Raft rework** (`ElementDirector` / `CombatSystem` / `PhysicsSystem` / `DemonSystem`):
  - **Slice raft → release the yokai burst** (move `DemonSystem.spawnWave` from placement to the
    slice event in `CombatSystem`; raft is currently `continue`/dressing there).
  - **Un-sliced raft rams the monk → a stumble** (feeds the samurai): add collision in
    `PhysicsSystem` (raft is currently dressing-only).
  - **Raft size telegraphs threat** (big = many yokai, small = few): encode count on the entity.
- [ ] **D3. Woven `yokaiIntensity` track** in
  [src/systems/RunDirector.js](src/systems/RunDirector.js): a light, independent ebb/flow over
  ground patterns that sprinkles yokai flurries (resolves design-notes "phase vs woven" → woven).
  In water it's expressed as raft size & frequency.

### Possible breakage (Phase D)
- **Symbol/row collision.** Grid row labels are `H A M L G`; use **lowercase `a`** for the
  arrow-ball so the parser doesn't confuse it with the `A` row.
- **Volley soft-lock.** The archer phase currently ends when all arrows are sliced/off-screen and
  hits cause game over. With hits now non-lethal, ensure the "all cleared / timed out" exit still
  fires so the volley always terminates.
- **Yokai overflow.** The woven track must respect the existing `cap` in `emitCell`
  (`Math.min(want, cap - s.demons.length)`) or swarms exceed the cap and tank readability/perf.
- **Raft double-spawn.** Moving the wave to on-slice means an ignored raft spawns *no* yokai (only
  the ram) — confirm that's intended (it is, per RUN_DESIGN §2 raft note) and that the old
  placement-time `spawnWave` is fully removed.

### Verify (Phase D)
Arrow-ball passes safely if ignored; slicing it bursts the volley; arrow hits register stumbles
(samurai reacts), never instant death; slicing a raft releases its yokai burst, ignoring it rams
(stumble); yokai flurries wax/wane independently of the main curve.

---

## Phase E — Water breather + biome macro intensity

### Steps
- [ ] **E1. Water roster:** finalize water patterns to **vines (tempo) + raft→yokai (adrenaline)
  only** — no spikes, no arrows, no blockers. Only death in water = the samurai.
- [ ] **E2. Biome macro tension:** cave **ratchets** the samurai; clean water play **cools** him
  faster (biome-aware de-escalation hook from C2). Light touch, tunable.
- [ ] **E3. `sea_vine` "grows toward you"** — water-vine = bamboo's water twin, a tempo slicer
  that grows toward the monk. Animation/sim change to the `sea_vine` spec. **Read is identical to
  bamboo tempo**, so this is polish-leaning and may be time-boxed/deferred within the phase; the
  static vine fills the slot first.

### Possible breakage (Phase E)
- **Schedule already valid.** `BIOME_SCHEDULE` lists `water`; all visual biomes (incl. `water`
  laneType `water`, `volcano`) exist in `VISUAL_BIOMES`. The ground↔swim lane-ramp is handled by
  `BiomeSystem` — **no change needed there**; don't re-implement it.
- **Empty water decks.** With most water specs cut, ensure water has ≥1 pattern per category the
  director requests, or `draw()` falls back to cross-biome/`PATTERNS[0]`.

---

## 4. What's on YOUR side (not code I decide)

- **Tuning in playtest:** samurai de-escalation rate (RUN_DESIGN §8 open question) and the
  cave-gate window generosity curve. Code seeds defaults in `config.json`; you dial the feel.
- **Acceptance = feel.** The only real test this phase is *does the run feel better to play*
  (CLAUDE.md): density-wave rhythm, samurai escalation legibility, water-as-relief.
- **Deferred to later (NOT this plan):** sprites/art, juice, audio, the meta hook, and final
  samurai watching-vs-drawn *art* (I provide readable placeholder poses now).
- **Doc sync:** when decisions settle, mirror them into the Design Notes mock
  ([src/mocks/screens/DesignNotesMock.jsx](src/mocks/screens/DesignNotesMock.jsx)) — the canonical
  design surface per CLAUDE.md. Say the word and I'll fold them in.

## 5. Sequencing

**A → B → C** are the load-bearing spine (roster, blocker-death, samurai). **D → E** layer the
inhibit read, raft, woven yokai, and the water breather on top. Each phase is independently
playable — stop and playtest-tune between them. Recommended: land **A + B + C** first (the new
skeleton + the two death sources), evaluate, then D/E.

## 6. Cross-cutting verification (after each batch — CLAUDE.md grep audits)

```bash
# No React in engine layers — must return empty
grep -rE "useState|useRef|useEffect|from 'react'" src/systems/ src/renderer/ src/obstacles/ src/config/

# No dangling references to cut specs/placers (run path only — AssetLibraryMock is a gallery)
grep -rnE "spikedboulder|spikebarrel|caveboulder|drawbridge|smallbridges|placeNet|placeMover|'net'" src/systems/ src/data/patterns.js src/obstacles/specs/index.js

# Loop deps must stay []
grep -n "}, \[\]);" src/hooks/useGameLoop.js
```
Plus: no literal in `src/systems/` duplicating a `data/config.json` value.
