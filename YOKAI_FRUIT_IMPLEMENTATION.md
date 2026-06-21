# Yokai = Fruit — Implementation Plan

> Companion to [YOKAI_FRUIT_DESIGN.md](YOKAI_FRUIT_DESIGN.md). Sequenced so each phase is
> **independently testable**, lowest-risk first, and the two unproven things (shape
> *spacing* and multi-cut *feel*) get a **playtest gate** before anything depends on them.
>
> **Grounding (verified in code):**
> - Yokai spawn today: `RunDirector.beginPattern → compilePattern → PatternRunner.tick →
>   emitCell('x') → emitYokai → DemonSystem.spawnWave`. Velocities are picked **randomly
>   inside** [`DemonSystem.spawn`](src/systems/DemonSystem.js#L44) from `DEMON_CONFIG` ranges — **no geometry**.
> - Tunables already data-driven: [`DEMON_CONFIG = config.demons`](src/config/constants.js#L67) from
>   [data/config.json](src/data/config.json). `sideWeight` is a **value edit**, not a move.
> - Combo → HUD is a **state-diff sync** in [GameScreen.jsx:320](src/screens/GameScreen.jsx#L320) (`hud.combo !== s.combo →
>   setCombo`), rendered at [GameScreen.jsx:569](src/screens/GameScreen.jsx#L569). The **bus** (`combo:hit`/`combo:tier`)
>   only drives [SoundSystem](src/systems/SoundSystem.js#L41).
> - Debug overlay: [`PacingOverlay.draw`](src/debug/PacingOverlay.js) gated by `s.debugPacing` at [GameScreen.jsx:335](src/screens/GameScreen.jsx#L335).

---

## Phase table

| # | Phase | Risk | Depends on | The deliverable |
|---|---|---|---|---|
| 0 | Route mix → 65/35 | trivial | — | `sideWeight` 0.80→0.65 |
| 1 | `solveLaunch` (pure math) | low | — | the ballistic solver, self-checked |
| 2 | `DemonSystem.spawn` explicit-launch path | low | 1 | spawn a yokai at exact pos+vel |
| 3 | Shape library data + shape spawner | med | 1, 2 | shapes form geometry in the slice zone |
| 4 | Debug spawn + overlay label (tuning rig) | low | 3 | press-to-spawn any shape, labelled |
| 5 | Stroke accumulator + multi-cut combo | med | — (parallel) | "×N!" once per swipe |
| 6 | Director integration (woven) | med | 3, 4 | shapes escalate with intensity |
| 7 | **Playtest gate** → cross-swipe combo | — | 4, 5, 6 | decide the capped meta-combo |

Phases 1–4 build and **tune the shapes in isolation** behind a debug key. Phase 5 (combo)
is independent and can run in parallel. Only Phase 6 wires shapes into the live run, and
only after Phase 7's playtest do we commit a scoring curve.

---

## Phase 0 — Route mix (immediate)

- **Edit** [data/config.json](src/data/config.json) `demons.sideWeight` → `0.65`; update the fallback literal in
  [constants.js:70](src/config/constants.js#L70) to match (it's the default if config is absent).
- **Check:** over a 2-min run, `s.yokaiTrack.stats.routes` is ≈ 65/35 side/bottom.

---

## Phase 1 — The launch solver (pure, unit-checkable)

- **New module** `src/systems/yokaiLaunch.js` — exports `solveLaunch({ spawn, target, route,
  T, scroll, gravity })` exactly per [DESIGN §4.5](YOKAI_FRUIT_DESIGN.md). Engine units (px, 60fps **frames**,
  px/frame, px/frame²). Pure: no React, no refs, no state mutation.
- **Self-check:** a dev-only assertion (or a tiny entry in a mock) reproducing the two
  worked examples in [DESIGN §4.6](YOKAI_FRUIT_DESIGN.md) (side ≈ −12.3 px/frame; fountain T ≈ 50.5 frames,
  vy ≈ −20.2). If those don't match, the algebra is wrong — fix before proceeding.
- **Decision to lock here:** arcs use a **fixed global gravity** (`DEMON_CONFIG.gravity`)
  so airtime `T` is derived ([DESIGN §4.3](YOKAI_FRUIT_DESIGN.md), recommended default). Revisit only if arcs
  need a fixed reaction window.
- **Invariant audit:** `grep -E "react|useState|useRef" src/systems/yokaiLaunch.js` → empty.

---

## Phase 2 — `DemonSystem.spawn` accepts an explicit launch

- **Edit** [DemonSystem.spawn](src/systems/DemonSystem.js#L44): add an early branch — if `options.launch =
  {x, y, vx, vy, gravity}` is present, use those verbatim and **skip** the random
  route/position math. Still set `type/radius/source`, push to `s.demons`, `recordSpawn`.
- Keep the existing random path as the default (woven singles still use it).
- **Check:** `spawn(s, w, h, { launch:{x:900,y:300,vx:-8,vy:-4,gravity:0.4}, yokai })`
  places one yokai there moving exactly so.

---

## Phase 3 — Shape library + shape spawner

- **New data** `src/data/yokaiShapes.js` — the [DESIGN §5](YOKAI_FRUIT_DESIGN.md) table as pure data. Each shape:
  ```js
  { id:'fan', route:'side', tier:'RISE', anchor:'screen', T:78,
    members:[ {dx:0,dy:-180}, {dx:0,dy:-60}, {dx:0,dy:60}, {dx:0,dy:180} ] }
  ```
  (`dx/dy` = offsets from the slice-zone center; `T` in frames; `anchor` screen|world.)
- **New spawner** `DemonSystem.spawnShape(s, shapeId, w, h, opts)` (or a small
  `YokaiShapeDirector` module if it grows):
  1. Resolve the **slice-zone center** — a tunable anchor ahead of the monk
     (`config.demons.sliceZone` → default ~`{ xFrac:0.34, yFrac:0.5 }`; **not** literally
     `MONK_TARGET_X`, the monk sits far left at x≈150, we want shapes readable in front of him).
  2. Per member: spawn pos = right edge (`x=w+r`) for `side`, below (`y=h+r`) for `bottom`;
     `target = sliceCenter + (dx,dy)`; `scroll = anchor==='world' ? s.cameraSpeed : 0`.
  3. `const launch = solveLaunch({...})` → `DemonSystem.spawn(s, w, h, { launch, yokai, source:'shape', row })`.
  4. Respect the live cap: `Math.min(members.length, YOKAI_WOVEN.cap - countActiveYokai(s.demons))`.
- **New tunables → [data/config.json](src/data/config.json)** (`demons.sliceZone`, per-route default `T`); shape
  geometry lives in the data module. **No literals duplicating data** in the spawner.
- **Check:** spawn each shape (via Phase 4 rig) — members visibly **converge** into the
  intended geometry around the slice zone, sliceable together.

---

## Phase 4 — Debug spawner + overlay label (the tuning rig you asked for)

- **Input hook** (debug only, next to the existing `s.debugPacing`/`'b'`/`'n'` keys in
  GameScreen): a key to **spawn the selected shape on demand**, and a key to **cycle**
  the selection through `yokaiShapes`. Store `s.debugShapeIdx`.
- **Overlay:** extend [PacingOverlay.draw](src/debug/PacingOverlay.js) to print the active shape label —
  `FAN · side · RISE · 4` — reading a small `s.activeShape = { id, route, tier, members }`
  that `spawnShape` sets. (Debug layer only; never referenced by gameplay systems.)
- **This is the make-or-break harness:** playtest each shape and tune **member spacing +
  `T`** until one stroke genuinely catches the cluster. A Fan spread over a second of
  scroll is four singles — the overlay is how you catch that.
- **Check:** key spawns the labelled shape; overlay names it; cycling changes it.

---

## Phase 5 — Stroke accumulator + multi-cut combo (parallel track)

- **Edit** [CombatSystem.tick](src/systems/CombatSystem.js#L133): introduce a **stroke** — open `s.stroke =
  { active:true, count:0 }` on the rising edge of `s.sword.isSlashing`; increment
  `s.stroke.count` each time a **yokai** is sliced this frame; close on the falling edge
  (or a sharp direction reversal). On close with `count >= 2`:
  - set a transient `s.multiCut = { count, life: 0.9 }` (decays in the loop),
  - `bus.emit('combo:multicut', { count })`.
- **HUD popup** — extend the existing diff-sync: in [GameScreen.jsx](src/screens/GameScreen.jsx#L320) add
  `hud.multiCut`/`setMultiCut` alongside `combo`, and render a transient **"×N!"** burst
  (reuse the combo-tier colour scale). Loop emits the sync **only on change** (preserve
  the gate — don't sync every frame).
- **Sound** — `SoundSystem` subscribes `combo:multicut` for the burst + rising pitch;
  `bus.off` it on teardown (bus discipline).
- **Keep** the 1.6s streak under the hood for now (don't rip out `ComboSystem`), but the
  **headline visual is the per-swipe ×N**. It is self-bounding (~2–6 per stroke).
- **Checks:** one stroke through 3 yokai → exactly **one** "×3!" (not three popups);
  sound fires once; a slow drag that hits them across separate strokes does **not** multi-cut.

---

## Phase 6 — Director integration (woven)

- **Bind shapes to intensity.** In the yokai track ([RunDirector](src/systems/RunDirector.js#L227),
  `nextSwarmPattern`/swarm path), select a **shape** by `tier` from `yokaiShapes` keyed to
  the LULL→RISE→PEAK→FALL phase: LULL→`single`/`pop`, RISE→`train`/`stair`/`geyser`,
  PEAK→`fan`/`fountain`/`pincer`, FALL→`single`. Fire via `spawnShape`.
- **Keep woven singles lightly present** (the existing `injectWovenYokai` path stays) so
  yokai are continuous, not bolted-on bursts — shapes **tighten**, they don't switch on.
- The director stays **automated**; obstacle density remains your hand-balanced layer
  around it (the overlay shows you what the director is doing).
- **Checks:** over a run, shapes escalate with the intensity curve; yokai are present in
  the gaps; turning obstacle density up/down by hand still leaves room for the shapes.

---

## Phase 7 — Playtest gate → cross-swipe combo (deferred by design)

- **Playtest 5 + 6 together.** Only after the per-swipe feel is right do we add any
  **cross-swipe** escalation — and it must be **capped/achievable** (the reset-on-stumble
  runaway-to-600 model is rejected, [DESIGN §6](YOKAI_FRUIT_DESIGN.md)). Candidate: a small bounded multiplier
  that ticks on 2+ swipes and caps (e.g. ×1→×4), decaying on a dry spell or stumble.
- **Do not implement the curve until the playtest says what feels earned.**

---

## Cross-cutting invariants to honour (from CLAUDE.md)

- **No React in engine layers** — `solveLaunch`, shapes data, spawner, CombatSystem stay
  pure. Audit: `grep -rE "useState|useRef|from 'react'" src/systems/ src/data/yokaiShapes.js`.
- **Data vs config** — shape geometry + tunables (`sideWeight`, `sliceZone`, default `T`,
  per-tier weights) live in `data/` (`config.json` / `yokaiShapes.js`); read them, never
  re-hardcode a literal that also lives in data.
- **Systems emit; React listens** — `combo:multicut` goes through the bus; only the HUD
  diff-sync / `useGameEvents`-style listener calls `setState`. Never `setState` in a system.
- **Loop deps stay `[]`**; the UI_SYNC gate stays diff-only.
- **Debug never leaks** — the shape spawner key + overlay label live in the debug layer,
  never inside `DemonSystem`/`CombatSystem` gameplay branches.

## Suggested commit slices

`feat: 65/35 yokai route mix` · `feat: ballistic launch solver (yokaiLaunch)` ·
`feat: DemonSystem explicit-launch path` · `feat: yokai shape library + spawner` ·
`feat: debug shape spawner + overlay label` · `feat: multi-cut combo (stroke accumulator)` ·
`feat: wire shapes into the yokai director`.
