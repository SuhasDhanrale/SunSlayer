# Camera System — Integration Plan

> Status: **IMPLEMENTED** (2026-06-22). Foundation + golden ("yokai") + samurai/ronin framing
> all landed; build + 50 tests green. Live pieces: `src/systems/CameraSystem.js`,
> `state.camera`, the composited transform in `GameRenderer`, `toWorld` input mapping in
> `GameScreen`, the render-through-hitPause loop change, and `camera` tunables in
> `data/config.json` (seeded with the mock's exact values). Two deviations from the mock per
> the brief: **yokai uses NO letterbox** (an upward slash must never be cropped) and pans to
> the treat's first-hit point; **samurai zoom is distance-driven** (monk↔boss span) rather
> than a fixed 1.4. The samurai camera engages **only on the actual duel/clash** (ronin boss
> active) — NOT when the samurai merely appears/watches at the edge.
>
> Original plan (below) — derived from a study of the Camera Juice Lab mock
> ([src/mocks/screens/CameraJuiceMock.jsx](src/mocks/screens/CameraJuiceMock.jsx)) and the
> live run's rendering/timing path. Goal: replace the scattered juice scalars with one
> coherent **camera vocabulary** the whole game can speak, and use it to give the golden
> treat (and later the samurai/ronin clash) a real "freeze → multi-hit → burst → return"
> cinematic instead of bare screen-shake.

---

## 1. What the mock teaches (the abstraction, not the effects)

The Camera Juice Lab's value is that it collapses every cinematic move into **one camera
object** and **one composited transform**.

```js
camera = { x, y, zoom, angle, letterbox, shakeX, shakeY }
```

Each frame it lerps the camera toward a **per-mode target** (`zoom / angle / letterbox / x`),
then the renderer applies the whole thing as a single transform stack
([CameraJuiceMock.jsx:196-200](src/mocks/screens/CameraJuiceMock.jsx#L196-L200)):

```
translate(center + shake) → rotate(angle) → scale(zoom * punchIn) → translate(-center - cameraOffset)
```

Layering rule that matters: the **world is drawn inside** the transform; the **letterbox bars
and the screen flash are drawn AFTER `ctx.restore()`** so they stay locked to the screen and
do not zoom/rotate with the world ([CameraJuiceMock.jsx:284-298](src/mocks/screens/CameraJuiceMock.jsx#L284-L298)).

### The "yokai piñata" flow = our golden treat
`triggerYokaiHit` ([CameraJuiceMock.jsx:65-86](src/mocks/screens/CameraJuiceMock.jsx#L65-L86))
is exactly the freeze → multi-hit → burst → return loop:

- **each hit** → `hitstopCounter` (a hard freeze: the logic update is skipped entirely while it
  counts down), `shakeIntensity = 1` (decays ×0.85/frame), `punchInAmount` (a momentary extra
  zoom that lerps back to 1.0 ×0.1/frame), + particles
- the **camera targets** (zoom-in, dutch tilt, letterbox, pan onto the yokai) are *held* the
  whole encounter and lerp back to neutral when the mode ends

The mock proves the *feel*; we already have most of the *timing* (see §3).

---

## 2. What the live game has today

### No camera transform exists
The renderer's only spatial move is a shake translate
([GameRenderer.js:137-140](src/renderer/GameRenderer.js#L137-L140)):

```js
if (s.shake > 0) ctx.translate((rand-0.5)*s.shake, (rand-0.5)*s.shake);
```

No zoom, no rotation, no letterbox, no focal pan. The "camera" is a single jitter scalar.

### The same intent lives as scattered scalars
- **Time**: `currentTimeScale` (lerped from boss/arrow/focus/golden conditions —
  [GameScreen.jsx:184-199](src/screens/GameScreen.jsx#L184-L199)), `hitPause` (hard freeze that
  early-returns the loop — [GameScreen.jsx:204-207](src/screens/GameScreen.jsx#L204-L207)),
  `goldenSlowmo` (countdown feeding the time scale).
- **Juice**: `s.shake`, `s.flashHit` / `s.flashColor` — **written from ~15 call sites**
  (CombatSystem, BossSystem, ArrowSystem, PhysicsSystem, SamuraiSystem, DemonSystem,
  ComboSystem) and **decayed in one place**: [PhysicsSystem.js:207-212](src/systems/PhysicsSystem.js#L207-L212).

### The golden treat already IS the piñata (minus the camera language)
[CombatSystem.tryHitGolden / burstGolden](src/systems/CombatSystem.js#L99-L163) +
[DemonSystem.tickGolden](src/systems/DemonSystem.js#L230-L251):

- arm on first slice → `frenzyT` window
- each frenzy hit: small `hitPause`, `shake`, gold `flashHit`, particles, `golden:hit`
- window closes (timeout or `hitCap`) → **burst**: big shake, `burstHitPause`, gold flash,
  `goldenSlowmo`, blast ring, coin shower, clears every other on-screen yokai

It has the **timing** of the mock's piñata but speaks **none of its spatial camera** — no
punch-in zoom, no dutch tilt, no letterbox, no pan-to-treat. Tunables already exist in
[constants.js `GOLDEN`](src/config/constants.js#L111-L115) / `data/config.json`.

**Conclusion:** the mock is a *superset camera layer*. The game has the timing primitives but
no spatial camera to express them through. Integration = build the camera layer and route the
existing intent through it.

---

## 3. The one real risk: pointer ↔ world coordinates

Input maps DOM → logical canvas coords **directly**, with no camera transform
([GameScreen.jsx:410-418](src/screens/GameScreen.jsx#L410-L418)). The instant the world is drawn
under zoom/rotate/pan, slices land in **screen space** while yokai live in **world space**, and
cutting silently breaks (off by the zoom factor, rotated by the dutch angle).

The mock sidesteps this by hit-testing in screen space (it recomputes `yokaiScreenX` from the
camera — [CameraJuiceMock.jsx:94-117](src/mocks/screens/CameraJuiceMock.jsx#L94-L117)). The real
game cuts via path segments against world-space entities, so we instead need the **inverse
transform** applied to every pointer sample before it enters slice logic.

This is the part that makes "just add zoom" non-trivial and is the main reason to land the
plumbing before any visible zoom.

---

## 4. Proposed architecture (respects the Phase-3 invariants)

### 4.1 State — extend a sub-object, don't add top-level keys
Add `state.camera` (the invariants allow extending sub-objects freely; a new *top-level* key
would need justification — this is one new sub-object that **absorbs** the existing `s.shake`,
so the surface stays small):

```js
camera: {
  x: 0, y: 0,          // world-space focal offset (0 = default framing)
  zoom: 1, angle: 0,   // base zoom + dutch tilt (radians)
  letterbox: 0,        // px height of each bar (0 = none)
  shake: 0,            // folds in the current s.shake
  punchIn: 1,          // transient multiplicative zoom pulse, decays → 1
  target: { x: 0, y: 0, zoom: 1, angle: 0, letterbox: 0 }, // lerp destination
}
```

Migration note: `s.shake` writes across the systems become `s.camera.shake` (mechanical
rename), or we keep `s.shake` as the shake channel and only *add* the new fields to minimise
churn. Decision deferred to implementation; renaming is cleaner long-term.

### 4.2 `CameraSystem` — a pure engine module (`src/systems/CameraSystem.js`)
- `pickTarget(s)` — chooses `camera.target` from **scene + phase**, reusing the exact
  conditions the time-ramp already branches on (boss warning/active, arrow telegraph, focus,
  golden frenzy/burst). One place owns "what should the camera be framing right now."
- `tick(s, dt)` — lerp `x/zoom/angle/letterbox` toward `target` (mock's `samuraiSpeed`-style
  factor), decay `punchIn → 1` and `shake → 0`. **This replaces the shake/flash decay currently
  buried in PhysicsSystem** ([PhysicsSystem.js:207-212](src/systems/PhysicsSystem.js#L207-L212)).
- No React, no refs — satisfies "renderer purity" and "systems emit/mutate state." Called from
  the loop alongside the other system ticks.

### 4.3 Renderer — apply one composited transform
In `GameRenderer.render`, replace the bare shake translate with the mock's stack, computed from
`state.camera`. World draws inside; **move letterbox + `flashHit` to after `ctx.restore()`** so
they're screen-locked. Almost everything else in the renderer is untouched (it just runs inside
the transform now).

### 4.4 Inverse mapping for input — `CameraSystem.toWorld(s, screenPt)`
Single helper that undoes `translate→rotate→scale→translate`. The pointer handlers
([GameScreen.jsx getMousePos](src/screens/GameScreen.jsx#L410-L418)) pass their canvas-logical
point through it before writing `s.mouse` / building the focus path, so slicing stays correct
under any zoom/tilt/pan. While `camera` is at neutral (zoom 1 / angle 0 / offset 0) this is the
identity — zero behavioural change until an effect actually engages.

### 4.5 Golden treat emits camera intent
The frenzy timing already exists; we route it through the camera instead of poking raw scalars:

- **first hit / arm**: set `camera.target` → pan toward `(d.x, d.y)`, modest zoom-in, slight
  dutch tilt, letterbox in. (Tunables go in `GOLDEN` in `data/config.json`, read via config —
  *never* hardcoded literals, per the data-vs-config invariant.)
- **each frenzy hit**: pulse `camera.punchIn` (the mock's punch-in), bump shake. The existing
  `hitPause` per hit already gives the staccato freeze.
- **burst**: snap shake/flash, then **release `camera.target` back to neutral** so the camera
  glides home over the `goldenSlowmo` window — the "and then we come back to the normal camera"
  beat.

---

## 5. Suggested build order (when we proceed)

1. **Plumbing, neutral**: add `state.camera`, `CameraSystem.tick` (fold in shake/flash decay),
   the composited renderer transform, and `toWorld` input mapping — all at neutral so the game
   looks and plays identically. Prove no regressions (slicing, shake, flash, letterbox-off).
2. **Golden cinematic**: wire the golden treat's arm/hit/burst to camera targets + punch-in.
   Tune via `GOLDEN` config; optionally add the knobs to a debug overlay or reuse the Camera
   Juice Lab sliders for values.
3. **Generalise**: migrate ronin clash / arrow telegraph / samurai execution to camera targets
   (they already set time scale + shake; give them framing too). Retire the remaining ad-hoc
   `s.shake` pokes in favour of camera channels.

## 6. What this might break (regression surface)

Ordered roughly by likelihood × blast radius. Most stay dormant while the camera is at
neutral (zoom 1 / angle 0 / offset 0); they only bite once an effect actually engages.

1. **Slicing accuracy under zoom/rotate/pan** — *high / breaks core verb.* If any pointer entry
   point skips the inverse map, slices miss. There are **multiple** entry points that all touch
   sword/mouse state and must be mapped *consistently* or the trail jumps:
   `getMousePos`, `recalibrate`, `handlePointerDown/Move/Up`, and the touch variants
   ([GameScreen.jsx:410-527](src/screens/GameScreen.jsx#L410-L527)). One missed call = a phantom
   slash. Mitigation: do the inverse in exactly one chokepoint (`getMousePos`) so everything
   downstream is already world-space.

2. **`hitPause` freezes rendering, not just logic** — *high / silent feature loss.* The loop
   `return`s **before the render block** during hitPause
   ([GameScreen.jsx:204-207](src/screens/GameScreen.jsx#L204-L207)), so the screen is literally
   not redrawn. The mock instead freezes *logic but keeps rendering*
   ([CameraJuiceMock.jsx:125-140](src/mocks/screens/CameraJuiceMock.jsx#L125-L140)). Consequence:
   a camera **punch-in / shake fired on a hitPause frame will not animate** — it'll only become
   visible after the pause ends, looking like a snap rather than a punch. To get the mock's feel
   we must let the loop **render during hitPause while skipping sim** (apply camera, draw, no
   entity updates). That's a loop-structure change, not just a new system.

3. **Double-decay of shake / flash** — *medium / wrong feel.* Decay currently lives in
   [PhysicsSystem.js:207-212](src/systems/PhysicsSystem.js#L207-L212). If `CameraSystem.tick`
   also decays them without removing the PhysicsSystem code, shake dies twice as fast. The two
   must not both run — move ownership, don't duplicate it.

4. **`ctx.save`/`ctx.restore` balance** — *medium / visual corruption.* The whole-scene transform
   replaces the existing shake `save`(L136)/`restore`(L682) pair, and letterbox + `flashHit` move
   to *after* the restore. An unbalanced pair leaks the transform into the HUD/overlay draws
   (biome text, focus bar, boss bars) or into the next frame. Needs careful audit of that
   save/restore span.

5. **Things deliberately drawn OUTSIDE the transform** — *medium.* Some draws are already
   screen-locked and assume raw canvas coords: HUD-bound flying coins
   ([GameRenderer.js:684-687](src/renderer/GameRenderer.js#L684-L687)), all the UI overlays
   ([GameRenderer.js:689-743](src/renderer/GameRenderer.js#L689-L743)), the debug `PacingOverlay`
   / `biomeFlash` drawn back in GameScreen after `render`
   ([GameScreen.jsx:376-387](src/screens/GameScreen.jsx#L376-L387)). These must **stay** outside
   the camera transform — if the new transform accidentally wraps them, the HUD zooms/tilts with
   the world. The coin-HUD fly target math
   ([GameScreen.jsx:329-336](src/screens/GameScreen.jsx#L329-L336)) is screen-space and must not
   be inverse-mapped.

6. **Backdrops / parallax under zoom** — *low / cosmetic.* BiomeSystem backdrops and FloorRenderer
   draw in world coords and will zoom with the world (correct for a focal zoom), but parallax tied
   to `s.distance` can look odd mid-zoom. Cosmetic only; watch during the golden moment.

7. **Letterbox crops vertical play space** — *low / fairness.* Bars can hide an obstacle the monk
   still must clear. Keep golden letterbox brief/small and verify no active threat hides behind a
   bar (see §6-old open question, now §7).

8. **Viewport/DPR double-apply** — *low.* The loop already manages `scale/offX/offY` via `vpRef`;
   camera zoom composes on top. Confirm resize doesn't compound the two.

## 7. Open questions for implementation
- Keep `s.shake` as-is and only add new camera fields (less churn), or fully rename shake into
  `camera.shake` (cleaner single owner)?
- Does any zoom-in during the golden frenzy risk pulling off-screen yokai out of frame right
  before the burst clears them? May want zoom kept subtle, or burst-clear to use world bounds
  not screen bounds.
- Letterbox during a fast runner: cinematic, but it crops vertical play space. Probably fine for
  a brief golden moment; verify it never hides an active obstacle the monk still has to clear.
- DPR / viewport: the transform is in logical space and the loop already manages
  `scale/offX/offY` separately, so camera zoom composes on top — confirm the two don't
  double-apply during resize.
