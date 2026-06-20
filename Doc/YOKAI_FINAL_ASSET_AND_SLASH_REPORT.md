# Final Yokai Asset and Slash-Feel Report

## Decision

Ship exactly three yokai masks:

1. **Oni** — crimson, horned, broad, immediately dangerous.
2. **Kitsune** — bone-white, pointed, cyan-eyed, fast and supernatural.
3. **No-Face** — pale oval, minimal markings, quiet and uncanny.

The final visual source is the procedural mask art in `EnemyGalleryMock.jsx`. The final cut behavior should combine the gallery's swipe-angle split with the stronger impact feedback in `FruitNinjaDemonsMock.jsx`. Do not promote the real game's current red circle demon: it is explicitly placeholder art.

This is a code-native canvas asset system, not a PNG asset transfer. The clean implementation is to extract the three mask definitions and their shared drawing function into production modules, then use the same renderer for intact masks and both cut halves.

## What exists today

### Mock asset gallery

`src/mocks/screens/EnemyGalleryMock.jsx` contains all three approved drawings:

- Oni at line 17
- Kitsune at line 105
- No-Face at line 319

Each definition already includes a stable identity, base color, radius, rotation speed, and `drawShape(ctx, r)` function. The large preview also proves arbitrary-angle cutting with two clipped redraws, perpendicular separation, opposing spin, gravity, a bright cut seam, and ink particles.

### Strongest slash-feel reference

`src/mocks/screens/FruitNinjaDemonsMock.jsx` is the better interaction reference. It adds:

- swipe-to-circle segment collision;
- two persistent mask halves instead of disappearance;
- separation perpendicular to the player's real cut angle;
- opposing angular velocity;
- 22 black/color ink particles;
- screen shake starting at 15 and decaying by 0.85;
- a three-frame white flash;
- a tapered off-white calligraphy trail;
- readable side-rush and bottom-launch motion.

It only contains Oni, Tengu, and Kitsune, so No-Face must come from the gallery.

### Real game

The production systems are functionally ready but visually incomplete:

- `DemonSystem.js` already launches varied-size masks in arcs and handles misses.
- `CombatSystem.js` already uses accurate point-to-swipe-segment collision.
- A yokai hit already gives combo score, 3 frames of hit-stop, shake 8, white flash 0.5, and 10 ink particles.
- `GameRenderer.js` still draws one generic crimson circular horned face.
- On hit, `CombatSystem.sliceDemon` immediately removes the entity from `s.demons`.

The immediate removal is the main loss of satisfaction. The hit-stop freezes a frame in which the target has already vanished, so the player sees impact feedback without the essential visual proof that their exact gesture cut the object.

## Visual design direction

### Shared silhouette rules

- Preserve the gallery silhouettes exactly; silhouette recognition matters more than extra surface detail at gameplay scale.
- Use a near-black 3–4 px calligraphy outline at the current ~40 px base radius.
- Keep facial accent colors saturated enough to survive the bamboo, cave, and water backdrops.
- Add a restrained dark-violet smoke wisp behind intact masks only. It separates pale Kitsune and No-Face from bright backgrounds and signals danger without looking like slice debris.
- Do not add labels, health rings, or directional prompts. These are one-swipe targets and should remain readable by shape and motion.

### Per-mask character

| Mask | Primary read | Motion character | Cut accent |
|---|---|---|---|
| Oni | Heavy, broad, aggressive | Slowest idle spin; slightly larger apparent mass | Crimson fragments plus dominant black ink; stronger low-frequency shake |
| Kitsune | Sharp, agile, supernatural | Fastest idle spin; subtle cyan eye glow | White paper flecks, cyan sparks, and red marking chips mixed into black ink |
| No-Face | Quiet, uncanny, fragile | Very slow drift and minimal spin before contact | Pale ceramic/paper flecks, purple/red marking chips, then a delayed black-ink bloom |

These differences should remain visual only in the first implementation. Do not create different hitboxes or slash rules until playtesting proves a gameplay need.

## Recommended hit choreography

The reaction should be one short, legible sequence driven by the player's cut vector.

| Time after contact | Visual / motion event |
|---|---|
| 0 ms | Lock the cut angle and intersection point. Draw a 2–3 px white-hot seam through the mask. Trigger a short white flash and freeze the completed contact frame. |
| 0–50 ms | Hit-stop for 3 frames. The intact silhouette remains visible with a tiny 1–2 px pre-separation gap; trail head stays bright. |
| 50–130 ms | Release both halves at about 4.5 px/frame perpendicular to the swipe. Use opposing spin near ±0.09 rad/frame. Emit the dense directional ink burst. |
| 130–350 ms | Halves inherit roughly half the original velocity, fall under the same gravity, and rotate away. Flash is gone; shake decays quickly. |
| 350–650 ms | Halves and particles fade/cull after leaving the readable action area. The elemental slash trail remains visually above the halves for clean authorship. |

Important: use the swipe/segment angle, not a randomized cut angle. The visual result must mirror the player's hand motion.

## Juice stack and priorities

Implement in this order:

1. **Persistent, correctly clipped halves.** This is the non-negotiable source of cut satisfaction.
2. **Contact-frame staging.** Mark the entity sliced, render the seam/intact contact pose, and defer separation until hit-stop releases. Never delete it in `sliceDemon`.
3. **Directional ink burst.** Start with 18–22 particles, mostly black with mask-specific accent fragments. Bias velocity along and away from the cut plane instead of using a uniform radial cloud.
4. **Impact tuning.** Raise yokai shake from 8 toward 12–15, retain the 3-frame hit-stop, and reduce the white flash if it obscures the contact silhouette. Tune at real mobile size.
5. **Mask-specific micro-accents.** Eye glow, fragment color, and slight mass differences only after the shared cut reads perfectly.
6. **Audio integration.** One dry blade transient at contact, a short ceramic/paper crack during release, and a soft ink/body fall. Pitch variation can distinguish masks without three unrelated sound families.

Avoid adding more particle types before the halves work. More flash and shake cannot replace visible cut geometry.

## Production architecture

Recommended modules:

```text
src/data/yokai.js                 approved roster and visual/motion metadata
src/renderer/yokai/masks.js       pure Oni, Kitsune, No-Face paths
src/renderer/yokai/render.js      intact, contact, and clipped-half rendering
src/systems/DemonSystem.js        spawn type and update intact/cut physics
src/systems/CombatSystem.js       record cut point/vector; score and feedback
src/renderer/GameRenderer.js      render every demon state and cut particles
```

Each spawned demon should gain `type`. On contact, retain the entity and add a cut state similar to:

```js
cut: {
  phase: 'contact',
  age: 0,
  angle,
  x: intersectionX,
  y: intersectionY,
  left:  { x: 0, y: 0, vx, vy, rot: 0, rv: -0.09 },
  right: { x: 0, y: 0, vx, vy, rot: 0, rv:  0.09 }
}
```

Use local-space clipping around the mask center, as the mocks do. Preserve the original mask rotation when composing the clip transform; otherwise the seam and painted features will appear to jump at contact.

## Risks found during investigation

- **Mock duplication:** Oni and Kitsune drawing code is duplicated between gallery and slash mock. Copying it again would create three sources of truth. Extract once.
- **Hit-stop ordering:** the main loop returns before simulation and rendering while hit-stop is active. A contact state must be rendered on the hit frame before those frozen frames begin.
- **Transform correctness:** clipped halves require a strict transform order: world position → original mask rotation → cut rotation → half offset/rotation → clip → draw mask. A wrong order makes the cut drift across the face.
- **Mutation while iterating:** current arrays are spliced during loops. Retaining cut demons removes the immediate splice but requires explicit lifetime/culling.
- **Mobile readability:** No-Face and Kitsune are pale. Their dark outer stroke and smoke separation cannot be optional on the paper biome.
- **Flash competition:** production elemental trails are much richer than the mock's white brush line. Full-screen flash must not wash out both the target and trail at once.
- **Cultural naming:** the current gallery uses “No-Face Mask (野箆坊)”. If this is intended as the Japanese faceless yokai, verify whether the shipped name should be **Noppera-bō (のっぺらぼう / 野箆坊)** rather than relying on the pop-culture label “No-Face.” This is a naming review, not an art blocker.

## Acceptance criteria

- Only Oni, Kitsune, and No-Face spawn in production.
- Their intact render matches the gallery at the same radius and rotation.
- Any-direction slash creates a seam aligned within a few degrees of the actual swipe.
- The target remains visible through the hit-stop and becomes two recognizable halves afterward.
- Both halves retain the correct painted features with no jump on the contact frame.
- One clean slash can still cut multiple targets; each gets its own cut vector and reaction.
- Cut halves no longer collide with the monk and are culled within about 0.65 seconds or safely off-screen.
- The reaction remains legible against bamboo, cave, and water backdrops at phone size.
- The elemental trail stays above debris and does not obscure the mask for more than the contact flash.
- Sustained yokai waves do not produce unbounded particles or retained entities.

## Final recommendation

Approve the three gallery masks as final geometry. Port them as shared procedural renderers, then port the Fruit-Ninja mock's swipe-driven half separation as the baseline reaction. Keep the real game's existing collision, combo, hit-stop, and elemental trails, but change the destruction model from **remove on hit** to **contact → split → fall/fade**. That single state change is the largest improvement available to the game's core slicing feel.
