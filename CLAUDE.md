# Bamboo Slicer — Project Status & Working Context

> **Read this first.** This top section is the live state of the project so a fresh chat
> can continue without re-explaining. The INVARIANTS below it are the *target* architecture
> contract — read them too, but see "How to treat the invariants" before assuming the code
> already matches them.

## The game

**Bamboo Slicer** — an endless one-verb runner. A monk auto-runs; the player controls **only
the blade**. Every interaction resolves through a **SLICE** (HIGH vs LOW is the only spatial
nuance). Variety comes from *what the slash does* and *how the world is arranged*, never from
harder gestures.

## Source of truth for gameplay design

The design decisions (pillars, difficulty model, outcome families, elements, threats,
retention, teaching curve, locked decisions, open questions) live in the **Design Notes mock**:
[src/mocks/screens/DesignNotesMock.jsx](src/mocks/screens/DesignNotesMock.jsx). That mock **is
the design doc** — when gameplay intent is unclear, read it there, and when a design decision
changes, update it there. It is reachable in the Mock Lab (`src/mocks/`).

## Current phase: PROTOTYPE (mechanics first)

We are **proving the gameplay feel** — the slice verb, run pacing, element variety, and
difficulty rhythm. We are **deliberately not** polishing visuals, juice, audio, or meta yet.
Entities are drawn as placeholder shapes. **Visuals, sprites, sound, and the meta/cosmetics
hook come later, after the core run is fun.** Don't get pulled into art/polish work during
this phase unless asked — judge changes by *does the run feel better to play*.

Build order we're following (from the teaching curve / retention stack in the design notes):
core slice run → element/pacing system → enemies woven in → combo/juice → meta hook.

## Where things actually live today (prototype reality)

- **Canonical run state**: a single `useRef` object inside
  [src/screens/GameScreen.jsx](src/screens/GameScreen.jsx) (not yet `App.jsx`/`createInitialState`).
  The rAF loop lives in [src/hooks/useGameLoop.js](src/hooks/useGameLoop.js).
- **Pacing**: `RunDirector` (conductor — advances the zone/intensity rhythm) →
  `ElementDirector` (executor — spawns one element per beat to the zone recipe). See
  [src/systems/RunDirector.js](src/systems/RunDirector.js),
  [src/systems/ElementDirector.js](src/systems/ElementDirector.js).
- **Other systems** in [src/systems/](src/systems/): Spawn, Physics, Combat, Segment, Demon,
  Boss, Coin. They read/mutate the state object directly and call `handleGameOver` directly —
  the mitt **bus is not wired into the run loop yet**.
- **Tunables**: [src/data/config.json](src/data/config.json); structural constants:
  [src/config/constants.js](src/config/constants.js).
- **Mock Lab**: [src/mocks/](src/mocks/) — design notes, biome/enemy/cosmetics mocks, roadmap.

## How to treat the invariants below

The INVARIANTS are the architecture we're migrating *toward*, not a description of the current
prototype. During this phase: **follow them for new code where it's cheap, but don't stop to
refactor the working prototype to satisfy them** (e.g. don't rip out direct state mutation to
introduce the bus mid-prototype) unless the user asks. When something in the prototype
contradicts an invariant, that's a known gap, not a bug to fix on sight.

---

# Phase 3 — INVARIANTS (target architecture contract)

> The durable contract that replaces "paste the anchor into every session." These describe the
> intended end-state architecture; see "How to treat the invariants" above for how strictly to
> apply them during the prototype phase.

---

## The three rules (the spine — never break these)

1. **One canonical state object** lives in `App.jsx`'s `stateRef.current` (from
   `createInitialState`). All systems read and mutate it directly. **Do not add
   top-level keys without good reason**; extend the owning sub-object instead.
2. **The game-loop hook has `[]` deps and must stay that way.** It reads everything
   through refs; React re-renders never restart it. Do not "fix" the deps array.
3. **Systems emit; React listens.** The `bus` (mitt) singleton: systems call
   `bus.emit(...)`; **only `useGameEvents` calls `setState`** in response. Never call
   `setState` from inside the rAF loop or a system.

## State contract

- Organized as **namespaced sub-objects** (`meta`, `run`, `sim`, player/`wheel`,
  `input`, `shop`, `visual`, …). To add state, extend the sub-object that owns it.
- **`state.meta`** persists across runs (localStorage via `Persistence.js`). Mutated
  only by `MetaSystem`, which saves after every change.
- **`state.run`** resets every run at game start. Per-run upgrades are applied here.
- A new **top-level** key requires a one-line justification in this file. Sub-object
  fields don't — the contract is alive, not frozen.

## Scene / phase / overlay (state machine — not a string + booleans)

- **Scenes** (`state.screen`) change **only** through the scene machine's `goto(state,
  next)`, which validates against a table of allowed transitions and runs `onEnter/onExit`.
  Never assign `state.screen` directly; never add another `if (screen === …)` branch when
  a transition or `onEnter` hook is the right home.
- **In-play sub-states are phases, not booleans.** Use one `state.run.phase` field
  (e.g. `SPAWNING|COMBAT|WAVECLEAR|DEAD`). Do **not** add `run.paused`/`run.dead`/
  `run.waveClearHold`-style flags — that's the boolean soup this rule exists to prevent.
- **Pause/modals are overlays**, not scenes: `state.run.overlay` (`null|PAUSE|LEVELUP`).
  An overlay freezes the frame and resumes in place; a scene replaces it.
- The machines live in `core/` as plain JS so the `[]`-deps loop and bus can drive them
  with zero React. See [state-machines-and-scenes.md](state-machines-and-scenes.md).
- **Entities stay data-oriented** (arrays of typed objects + systems). No ECS. A mini
  state machine is justified only for boss phases / genuinely stateful AI.

## Data vs config — the most-repeated bug

- **Tunable balance** (enemy/boss stats, waves, economy, drop rates, difficulty curves)
  lives in `src/data/*.jsonc`, loaded once at boot by `ConfigLoader` and exposed as
  `GameConfig`. **Read it from `GameConfig`. Never hardcode a literal that also lives in
  data** — there is a recurring trap where data values are silently ignored because code
  used a literal.
- **`src/config/*.js`** is only for non-tunable structural constants: canvas geometry,
  entity metadata, enum-like maps. Costs/stats/waves/curves do **not** belong here.
- When adding a tunable: define it in the right `data/*.jsonc` → seed any meta key in
  `GameState.js` → read it via `GameConfig` at the right lifecycle point.

## Viewport & coordinates

- Game logic runs in a **logical `W × LOGICAL_H`** space (`LOGICAL_H` grows to fill tall
  viewports). The loop writes `{scale, offX, offY, logicalH}` to a shared `vpRef`;
  pointer input reads the same `vpRef` to map DOM events back to logical coords.
- Clamp DPR (`min(dpr, 2)`); use a `ResizeObserver`. **No CSS-pixel math** and **no fixed
  canvas height** in systems or renderers.

## Loop, dt & tick matrix

- Every `tick(state, dt)` accepts and uses `dt`. `dt` is normalized to 60fps frame units
  and **clamped** on tab resume (`if (dtMs > 100) dtMs = 100`).
- The loop decides *what ticks when* from the **scene + phase**, not loose flags: each
  scene/phase declares which systems run (idle scenes = ambient only; freeze phases &
  overlays = juice only, no sim). Add behavior by adding a phase, not a boolean.
- The loop emits `UI_SYNC` **only when diffed HUD values change** — preserve that gate
  when adding HUD fields, or you reintroduce 60fps React re-renders.

## Renderer purity

- Every renderer takes `(ctx, state, …)` and imports **zero** React and **zero** refs.
- Manually-drawn entities carry a `// SPRITE-READY` comment marking the sprite-swap point.

## Pooling & arrays

- Particles / short-lived transients use an **object pool with a hard cap**; callers
  handle a `null` (pool exhausted) without throwing.
- Arrays mutated mid-tick are spliced **from the end** (`for (let i = a.length-1; i>=0; i--)`).

## Boot & assets

- The **first scene is BOOT**: load `data/*.jsonc`, preload sprites/audio/fonts, show a
  loading indicator, and gate every other scene until ready. No system ticks against
  half-loaded assets.

## Persistence

- `Persistence.js` is the only module that touches localStorage for save data. It
  versions its key, merges saved meta over defaults, and swallows quota errors silently.
- **Breaking meta-shape changes get a migration**, not just a merge — bump the version
  and transform old saves, or you corrupt existing players' progress. Additive fields
  are fine via merge-over-defaults.

## Dev tooling

- Debug affordances (scene-jumper, state inspector, god-mode, speed control, spawners)
  live in their own area (`editor/` / `debug/`), reachable via a single hook into the
  scene machine. They **never** leak conditionals into gameplay systems.

## Bus discipline

- Event names live in the code (and the plan's bus table), not in pasted snapshots.
- `useGameEvents` subscribes on mount and **`bus.off`s every handler on unmount**.
- React→system actions go through `bus.emit`; never reach into a system from a component.

## Audio / i18n / platform seams

- Gameplay systems **emit** sound events; a `SoundSystem` listens. No `new Audio()` in
  gameplay code.
- User-facing strings go through `t()`; entity/internal names can stay literal.
- Ads/SDK/analytics live behind one integration module; build-target flags never leak
  into gameplay logic.

## Error handling

- The loop wraps each frame in try/catch, emits `GAME_ERROR`, and stops the rAF; a
  recovery screen renders instead of a blank canvas. `console.error` still fires in dev.

## Grep audits (run after each batch of steps)

```bash
# No React in the engine layers — must return empty
grep -rE "useState|useRef|useEffect|from 'react'" src/systems/ src/renderer/ src/entities/ src/config/ src/core/

# Every bus.on must have a matching bus.off in useGameEvents
grep -rn "bus.on|bus.off" src/hooks/useGameEvents.*

# Spot-check: no literal duplicating a data/ value (review hits by hand)
grep -rn "<a magic number you know lives in data/>" src/systems/

# Loop deps must be []
grep -n "}, \[\]);" src/hooks/useGameLoop.*
```
