# Mock Lab — agent recipe

> **Audience:** the AI agent building or promoting a mock in THIS game's `src/mocks/`.
> **Fill the `<FILL: …>` slots once** (the game's first Mock Lab task); after that,
> this file tells any future agent exactly what to do without re-deriving the system.

## What the Mock Lab is for

A dev-only sandbox to prototype a screen/system/flow in isolation, review it at a
real device viewport, then **promote it into the real game**. You build here on the
designer's instruction; the designer reviews; you iterate; you promote.

## The one rule

**Additive, never mutating.** Each experiment is its OWN new file under `screens/`.
Do not edit an existing experiment to make a different one — copy it or start a new
file. The designer curates which experiments survive.

## Fidelity is the point (read before building)

A mock must "know the game." Build every experiment from the game's **real building
blocks** — only the *composition* is new. That is what makes promotion a move, not
a rewrite.

This game's real building blocks (fill once):

- **Renderers / draw fns:** `src/renderer/GameRenderer.js` — `GameRenderer.render(ctx, s, canvas, time, gameState, biomeName)`, the same fn the live `GameScreen` draws with. NOTE: it is **responsive** (draws against `canvas.width/height`), not a fixed-logical-coords renderer — so canvas mocks manage their own rAF + raw canvas like `GameplayMock.jsx` rather than using `useCardCanvas` (which assumes a fixed logical box).
- **Reusable UI components:** `src/screens/*` (HomeScreen, GameOverScreen, LeaderboardScreen, AchievementScreen) — DOM/Tailwind chrome. Theme utility classes in `src/index.css` (`bg-washi`, `shadow-card`).
- **Theme tokens:** `src/index.css` `@theme` block (`--color-paper/ink/crimson`) + `PALETTE` in `src/config/constants.js`. Tunable balance lives in `src/data/config.json`.
- **State shape + factory:** `createInitialState()` in `src/core/GameState.js` (namespaced: `meta`, `run`, `sim`, `entities`, `input`). ⚠ The live renderer/systems still read a **flat** shape (`s.monk`, `s.boss`, `s.distance`); the namespace refactor is mid-flight. `presets.js` is seeded from the real factory; `screens/GameplayMock.jsx` has a `toRenderState` adapter that flattens it for the current renderer. Delete that adapter once the renderer reads namespaced state.
- **Logical coordinate space:** `LOGICAL_WIDTH 1920 × LOGICAL_HEIGHT 1080` (from `src/hooks/useGameLoop.js`), but the renderer itself is canvas-pixel/responsive — anchor ground at `canvas.height - GROUND_HEIGHT` (100).
- **Event bus + relevant events:** `bus` (mitt) in `src/core/bus.js`. Wire live behavior via `useMockBridge(bus, () => preset.create(), handlers)` mirroring the real systems.

## Recipe — add a new experiment

1. **New file:** `screens/<Name>Mock.jsx`. Export one plain React component:
   ```jsx
   export const <Name>Mock = ({ presetId, resetToken, state, setState }) => { … };
   ```
   - `presetId` — selected preset id. `resetToken` — changes on Reset / screen switch;
     key off it (or `useEffect` on it) to restart the experiment.
   - `state` / `setState` — per-screen toolbar state (only if you declare `controls`).
2. **Render from real parts.** For canvas screens, use `useCardCanvas(draw, { logicalW, logicalH })`
   and draw with this game's **real renderers** in its **real logical coords**. For DOM
   screens, use the game's real components + theme tokens. Do not reinvent art/styles
   that already exist in the game.
3. **Get data.** Read a preset (game-state-shaped) from `presets.js`. If the screen
   needs LIVE behavior, use `useMockBridge(bus, () => preset.create(), handlers)` and
   write `handlers` that mirror what the real systems do on those events.
4. **Register.** Append ONE entry to `registry.jsx`:
   ```js
   { id, title, description, component: <Name>Mock, defaultPresetId: 'starter' }
   ```
   Add `initialState` + `controls` only if the screen needs its own toolbar chrome.
5. **Run** `npm run dev:mocks`, open the screen, hand it to the designer.

## Recipe — promote an experiment into the game

When the designer signs off:

1. **Move the rendering**, not the plumbing. The screen body already speaks the
   real game's language (real renderers/components/state shape), so it drops into the
   real screen location: `src/screens/` (gameplay rendering lives in `src/screens/GameScreen.jsx`; renderer in `src/renderer/GameRenderer.js`).
2. **Swap the data source:** replace the `preset` / `useMockBridge` data with the
   real live state/props the real screen receives.
3. **Drop lab-only props:** `presetId`, `resetToken`, the toolbar `state`/`setState`,
   and the `useCardCanvas` rig if the real game already has its own loop/canvas.
4. **Delete or keep the mock?** Leave the experiment file in `screens/` unless the
   designer says otherwise — it stays as a sandbox for future iteration.
5. **Wire it** into the real game's screen routing / system order: the root app is
   `sumi_e_blade.jsx` (mounted by `src/main.tsx`), which switches between the
   `src/screens/*` components; the game loop runs in `src/hooks/useGameLoop.js`.

## Never

- Never edit `MockWorkbench.jsx` to add a screen (use the registry) or screen-specific
  chrome (use the entry's `controls` slot).
- Never import Mock Lab files from production code — it is dev-only.
- Never ship `mocks.html` / `main.jsx` in a production build.
