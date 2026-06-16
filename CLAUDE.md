# Phase 3 — INVARIANTS (seed for the new game's CLAUDE.md)

> Copy this into the new repo as `CLAUDE.md` on **day one**, before execution starts.
> It is the durable contract that replaces "paste the anchor into every session." Trim
> the game-specific examples and fill in your own; keep every rule.

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
