# Yokai = Fruit — Design Doc

> **One-line thesis.** Take what makes *Fruit Ninja* feel great — readable thrown
> shapes and the "one swipe, many cuts" combo — and weave it into our side-scrolling
> runner **without** copying the things that fight a runner (3-strikes death, a static
> arena, ring shapes). Yokai are our **game-feel layer**; the other obstacles are the
> **environment** we hand-balance around them.
>
> Status: PROTOTYPE / design intent. Scope of *this* doc is the yokai-as-fruit system
> only. Bamboo / vines / TNT / bridges are parked as the environment layer. Special &
> bomb yokai are a later pass. Pairs with [DesignNotesMock.jsx](src/mocks/screens/DesignNotesMock.jsx).

---

## 1. Fruit Ninja vs Bamboo Slicer — axis by axis

| Axis | Fruit Ninja | Bamboo Slicer (today) | Our move (keep identity) |
|---|---|---|---|
| **Arena** | Static screen; fruit fly up and fall | Left-scrolling runner; monk fixed at `MONK_TARGET_X` | Keep the runner. Yokai are free **screen-space** entities crossing the lane (not scrolled with the world) |
| **Presentation** | Tossed in arcs from the bottom edges | 80% side-rush / 20% bottom-arc (`DEMON_CONFIG.sideWeight`) | **65% side / 35% bottom.** Never aimed at the monk — they cross the lane / float up and give you airtime |
| **Spawn trigger** | Countdown timer; *wave number* gates count & variety | Woven intensity track INTRO→LULL→RISE→PEAK→FALL + scripted type unlocks | Keep our director — it's already richer than FN's modulo-on-wave |
| **Arrangement** | A small library of **named throw shapes** (fan-of-5, ring-of-12, two-column) | Woven singles + density-filled swarms — **no named shapes** | **NEW: a yokai shape library** placed by a ballistic solver (§4–5) |
| **Spawn math** | Per-difficulty velocity/accel presets | Hand-set `vx`/`vy` ranges in `DEMON_CONFIG` | **target + arrival-time → solve velocity** (speed-invariant, §4) |
| **Combo** | **Per-swipe multi-cut** (3+ in one slice = "Combo!" ×N) | 1.6s rolling streak (`ComboSystem`) — climbs just by not stopping | **Per-swipe multi-cut is the headline combo.** Needs a stroke accumulator (§6) |
| **Cross-swipe escalation** | Blitz multipliers etc. | none | **Deferred to playtest. Capped/achievable when added** — no runaway-to-600 |
| **Fail model** | Miss fruit = lose a life (3 strikes); slice a bomb = death | Escaped yokai = free; contact = stumble (feeds ronin/samurai) | **Keep penalty-free.** Miss just forfeits points; contact = stumble. NOT 3-strikes |
| **Specials** | Freeze / Frenzy / Double bananas; bomb | `focus` time-stop exists (boss); TNT/arrow are inverse reads | Special + bomb **yokai** later; reuse `focus` machinery for a freeze-special |
| **Types** | Many fruit, purely cosmetic | 3 cosmetic yokai (oni / kitsune / noface) | Stay **cosmetic** for now |
| **Juice** | Splat, rising combo pitch, criticals, screen-clear burst | `hitPause` / `shake` / `flashHit` + particles | Add ×N popup + rising pitch + multi-cut burst — **after** the shapes prove out |
| **Between-wave pause** | Empty gap between waves (load-bearing reset) | Pattern gaps + REST phase + `gapSeconds` — **already integrated** | Yokai breathe in the existing rests; no new pacing needed |

---

## 2. Identity guardrails — what we will NOT copy

1. **No miss-death / 3-strikes.** We're endless. A yokai leaving the screen un-sliced is
   free; it only forfeits its points. The only stakes are **contact = stumble**.
2. **No static-arena shapes.** Skip the ring-of-12 — it needs a fixed center and reads as
   noise on a scrolling lane.
3. **Woven, never a minigame.** Yokai are *always lightly present*; intensity makes the
   shapes **tighten**, it does not switch a separate Fruit-Ninja mode on and off.
4. **One verb.** Everything resolves through SLICE. The only spatial nuance is HIGH vs LOW.

---

## 3. Presentation & routes

- **Side route (65%)** — spawns just off the right edge, crosses the lane leftward. The
  long traversal is the slice window. This is the dominant, most readable presentation.
- **Bottom route (35%)** — launched up in an arc from below; the **apex** sits in the
  slice band (the classic FN "catch it at the top" beat).
- Neither route homes on the monk. Today's anti-aim guarantee in `DemonSystem` stays.
- `DEMON_CONFIG.sideWeight`: **0.80 → 0.65** (this is a tunable — see §8 on data vs config).

---

## 4. The spawn math (the important part — check this carefully)

### 4.1 Frame of reference

- Logical play space `W × LOGICAL_H`. The monk runs at a **fixed screen x** (`MONK_TARGET_X`).
- Yokai are **screen-space** entities: each tick `pos += vel*dt`, `vy += g*dt`. They are
  **not** scrolled with the camera.
- **Units are the engine's native per-frame units** (positions in px, time in **60 fps
  frames**, velocity px/frame, gravity px/frame²) so the output drops straight into
  `DemonSystem`. To convert from seconds: `T_frames = T_sec × 60`, `v_frame = v_sec/60`,
  `g_frame = g_sec/3600`.
- **Slice zone**: the point near the monk where a shape should be cleanly cuttable. Call
  its center `target = (xT, yT)`. A multi-member shape gives each member its own target
  `(xT + dxᵢ, yT + dyᵢ)` — *that offset set is the shape's geometry*.
- **Arrival time `T`** (frames): airtime from spawn to target. **This is the one feel knob**
  — the player's reaction window. Bigger `T` = more time to read & slice.

### 4.2 Side route — straight line

Spawn at the right edge `spawn = (x0, y0)`, `x0 = W + r`. We want the member at
`target = (xT, yT)` exactly at time `T`.

Horizontal (no gravity on x):

```
vx = (xT − x0) / T            // negative ⇒ leftward
```

Vertical, under the gentle side-gravity `gs` (use `gs = 0` for a flat cross):

```
y(t) = y0 + vy·t + ½·gs·t²
y(T) = yT   ⇒   vy = (yT − y0 − ½·gs·T²) / T
```

For a flat Train you simply spawn at the target height (`y0 = yT`, `gs = 0`) ⇒ `vy = 0`.

### 4.3 Bottom route — projectile arc, apex in the slice zone

Spawn below the screen `spawn = (x0, y0)`, `y0 = H + r`. Up is **negative** y; gravity
`g > 0` pulls down. We want the **apex** (vertical velocity = 0) to land **on the target**.

Apex time from launch:

```
vy + g·t = 0   ⇒   t_apex = −vy / g
```

Two constraints — apex happens at `T`, and apex height equals `yT`:

```
t_apex = T            ⇒   vy = −g·T
y(T) = y0 + vy·T + ½·g·T²
     = y0 − g·T² + ½·g·T²
     = y0 − ½·g·T²     ⇒  set = yT
```

Let the **rise** `R = y0 − yT` (how far it climbs; `R > 0`). Then:

```
R = ½·g·T²
```

**This couples three quantities — you may fix any two, the third is determined:**

- **Fix `g` (global feel) + choose `R` (which band the apex sits in)** → airtime falls out:
  ```
  T  = sqrt(2R / g)
  vy = −g·T
  vx = (xT − x0) / T
  ```
  *(Recommended default — one gravity for all yokai = consistent arc feel.)*
- **Fix `T` (reaction window) + choose `R`** → derive a per-shape gravity:
  ```
  g  = 2R / T²
  vy = −g·T = −2R / T
  vx = (xT − x0) / T
  ```

### 4.4 Where the **run speed** enters (screen- vs world-anchor)

Because yokai live in screen space, a **screen-anchored** shape (stays put on screen)
does **not** involve scroll speed at all → it reads identically at 1× and at the ~1.8×
speed cap. **Speed-invariant by construction.**

A **world-anchored** shape (e.g. a fountain that erupts from a ground spot scrolling left
at `s` px/frame) must land where that spot *will be* at arrival, `xT − s·T`. So scroll
speed enters **exactly once, as a subtractive term on `vx`:**

```
vx = (xT − x0)/T − s          // s = 0 for screen-anchored
```

That single `−s` is the whole answer to "what thrust for our run speed": for screen
shapes it's zero; for world shapes it's exactly compensated. Geometry + `T` remain the
only feel knobs either way.

### 4.5 Reference solver (drop-in, engine units)

```js
// All native units: px, FRAMES (60fps), px/frame, px/frame². `scroll` is the world
// scroll speed in px/frame — pass 0 for a screen-anchored shape, cameraSpeed for a
// world-anchored one. Returns velocity ready for DemonSystem.spawn().
function solveLaunch({ spawn, target, route, T, scroll = 0, gravity = DEMON_CONFIG.gravity }) {
  if (route === 'side') {
    const gs = DEMON_CONFIG.sideGravity ?? 0;            // gentle / zero
    return {
      vx: (target.x - spawn.x) / T - scroll,
      vy: (target.y - spawn.y - 0.5 * gs * T * T) / T,
      gravity: gs,
      T,
    };
  }
  // Bottom arc — apex on target. Fixing gravity DETERMINES airtime (T is derived).
  // (Alt: to honour a fixed T instead, use gravity = 2*rise/(T*T).)
  const rise  = spawn.y - target.y;                       // > 0: climbs from below
  const Tapex = Math.sqrt((2 * rise) / gravity);
  return {
    vx: (target.x - spawn.x) / Tapex - scroll,
    vy: -gravity * Tapex,                                  // negative = upward
    gravity,
    T: Tapex,
  };
}
```

### 4.6 Worked numbers (sanity check vs current `DEMON_CONFIG`)

Assume `W = 1280`, `H = 720`, monk at `xT = 360`, spawn margin `r = 40`.

**Side Train member** — `spawn = (1320, 300)`, `target = (360, 300)`, `T = 78` frames
(1.3 s), screen-anchored (`s = 0`), `gs = 0`:

```
vx = (360 − 1320) / 78        = −12.3 px/frame   (mock side speed is 7–12 ✓)
vy = (300 − 300) / 78         =   0   px/frame    (flat cross ✓)
```

**Bottom Fountain member** — `spawn = (700, 760)`, apex `target = (360, 250)`,
`g = 0.40` px/frame²:

```
rise = 760 − 250 = 510
T    = sqrt(2·510 / 0.40) = sqrt(2550) ≈ 50.5 frames  (≈ 0.84 s airtime)
vy   = −0.40 · 50.5       ≈ −20.2 px/frame  (up; mock launch is 12–19 ✓-ish)
vx   = (360 − 700) / 50.5 ≈  −6.7 px/frame  (drifts up-left toward the lane)
```

Both land in the same ballpark as the hand-tuned values today — which is the point:
the solver reproduces the current feel, then holds it steady as speed ramps.

---

## 5. The shape library (the arrangement vocabulary)

Authored as **data** (a yokai analogue of [patterns.js](src/data/patterns.js)) — each entry is a set of
target offsets `(dx, dy)` in the slice zone + arrival `T` + route + intensity tier. The
solver (§4) turns each member into a launch. Offsets: `dx` right-positive, `dy` down-positive.

| Shape | Route | Members | Geometry (slice-zone offsets) | Rewards | Tier |
|---|---|---|---|---|---|
| **Single** | side | 1 | one band | teach / filler | LULL |
| **Train** | side | 3–5 | same `dy`, staggered arrival → horizontal line | one flat sweep → ×N | LULL/RISE |
| **Stair** | side | 3–5 | stepped `dx` & `dy` → diagonal line | one diagonal arc | RISE |
| **Fan** | side | 3–5 | shared arrival, `dy` spread across bands | one long/vertical stroke (FN fan-of-5) | RISE/PEAK |
| **High–Low** | side | 2 | one `dy<0` (HIGH) + one `dy>0` (LOW), same arrival | **can't** take both in one short stroke = a decision | RISE |
| **Pop** | bottom | 1 | single arc | breather | LULL |
| **Fountain** | bottom | 3–5 | varied `x0`, apexes spread across the band | multi-cut at the apex | PEAK |
| **Geyser** | bottom | 3–5 | same `x0`, fanned `vx` → apexes spread | one sweep across the top | RISE/PEAK |
| **Pincer** | side + bottom | 4–6 | both edges at once | the "swarm from both sides" burst | PEAK only |

> ⚠️ **Tuning is make-or-break, not the code.** A shape only combos if its members
> overlap **tightly in time and space** in the slice zone. A "Fan" spread over a second
> of scroll is just four singles. The §8 debug overlay exists to catch exactly this.

---

## 6. Combo model

- **Headline = per-swipe multi-cut.** Count the yokai sliced in **one continuous stroke**;
  `N ≥ 2` fires a distinct event + ×N popup + escalating flash/shake/pitch.
- **Self-bounding by design.** You can only physically cluster ~2–6 per stroke, so the
  per-swipe number stays "nice and achievable" — this is *why* it's the primary, and why
  it replaces the rolling-window streak that climbed just by never stopping.
- **New: a stroke accumulator.** Today `CombatSystem` slices **per frame** (segment
  `trail[1]→sword`) with no concept of a "swipe", so multi-cut can't be detected as a
  unit yet. Open a tally when slashing begins, sum yokai cut until the stroke ends
  (direction reverses / speed drops / pointer releases), then `bus.emit('combo:multicut',
  { count })`. React (`useGameEvents`) listens — systems never `setState`.
- **Cross-swipe escalation = DEFERRED to playtest.** The "multiplier that only resets on
  stumble" idea is **rejected** (runs away to 600–700). When revisited it must be
  **capped**. Feel it first, decide the curve after.

---

## 7. Pacing & ownership

- The **yokai director is automated** — it reuses the woven intensity track
  ([RunDirector.js](src/systems/RunDirector.js)): LULL→RISE→PEAK→FALL. Intensity selects which shapes are
  eligible (small combos in the gaps at low intensity; dense bursts at PEAK), and
  **tightens** spacing as it rises. Yokai stay lightly present throughout (woven, §2.3).
- **You hand-balance the obstacles around it.** Obstacles are the environment; their
  density is tuned by hand to leave room for the automated yokai feel. The director
  surfaces its state (§8) so that balancing is informed, not guesswork.

---

## 8. Tooling, data/config, implementation touchpoints

**Debug overlay** (debug layer only — never leaks into gameplay systems; alongside
[PacingOverlay.js](src/debug/PacingOverlay.js)): print the live `shape · route · phase` (e.g. `FAN · side · RISE`)
plus member count, so playtests can correlate feel with what actually fired.

**Data vs config (per the invariants):**
- **New data** `src/data/yokaiShapes.js` — the shape library (§5). Pure data.
- **Tunables → `data/config.json` / `GameConfig`**: `sideWeight` (0.65), default `T` per
  route, global arc `gravity`, slice-zone geometry, per-tier shape weights. Do **not**
  hardcode these as literals in systems.
- **Structural only → `config/constants.js`**: slice-zone anchor relative to
  `MONK_TARGET_X`, band fractions.

**Code touchpoints:**
- `solveLaunch` — a **pure** function (no React, no refs). New module or folded into `DemonSystem`.
- `DemonSystem.spawnShape(s, shapeId, …)` — reads a shape, runs the solver per member,
  calls existing `spawn()`.
- `ComboSystem` — stroke accumulator + `combo:multicut` emit (§6).
- Debug overlay (above).
- Bus discipline: systems `emit`; only `useGameEvents` reacts.

---

## 9. Open questions / deferred

- **Combo feel in a runner** — proven only by playtest. Gates the cross-swipe curve (§6).
- **Per-shape anchor** — screen vs world (§4.4), decided per shape for grounded fountains.
- **Special & bomb yokai** — the banana/bomb analogues; reuse `focus` for a freeze. Later.
- **Type identity** — cosmetic (current) vs light behavioral variants (fast-small,
  slow-big, two-cut "pomegranate"). Revisit once shapes + specials land.
- **Fixed `g` vs fixed `T` for arcs** (§4.3) — start with fixed global `g`; revisit if
  arcs need a tighter reaction window at speed.
