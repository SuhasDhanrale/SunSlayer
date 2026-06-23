# Sound Implementation Plan — Bamboo Slicer

> Integrate the two audio mocks (SFX + BGM) into the live game as real systems: rich
> procedural sound effects driven by the gameplay bus, and biome-specific background
> music that **cross-fades** as the run moves between biomes. Wire the existing
> Settings UI to actually control volume.

---

## 1. Key finding: the mocks are *code*, not assets

Both labs synthesize everything procedurally with the Web Audio API. **There are no
`.mp3`/`.wav`/`.ogg` files to import** (`Glob **/*.mp3` → none). "Importing the sounds"
means *porting the synthesis functions* out of the mock React components into engine
modules that the run loop and bus can drive — not loading audio files.

- **SFX** — [src/mocks/screens/SoundEffectsMock.jsx](src/mocks/screens/SoundEffectsMock.jsx):
  12 standalone `play*()` functions (Yokai Pop, Arrow Pop, Bamboo Slice, Yokai Slice,
  Rope Slice, Spike Slice, TNT Boom, UI Click, Golden Spawn/Burst/Idle, Arrow Idle).
  Each builds its own oscillator/noise graph straight to `ctx.destination`.
- **BGM** — [src/mocks/screens/BackgroundMusicMock.jsx](src/mocks/screens/BackgroundMusicMock.jsx):
  a 32-step look-ahead **sequencer** (`setInterval` scheduler, not rAF) playing one of
  6 `TRACKS`. Each track = `{ baseBpm, filterFreq, color, percussion, notes:{bass,mid,lead} }`
  of MIDI step data. A single shared synth voice (`playCleanNote`) + `playPercussion`
  render every track through one compressor → master gain so they sound cohesive.

The 6 tracks: **Night Hunt Sprint**, **Hinokami Kagura**, **Butterfly Dance**, **Upper
Rank Presence**, **Spirit Shrine**, **Wisteria Rest**. **4 are used** (Upper Rank,
Hinokami, Butterfly, Wisteria — see §6.2); Spirit Shrine and Night Hunt Sprint stay in
the data but are unmapped. **BGM is intentionally secondary** — the priority is SFX;
music is subtle, low-volume background.

## 2. What already exists in the game

- A real [src/systems/SoundSystem.js](src/systems/SoundSystem.js) is **already wired**:
  `useEffect(() => SoundSystem.attach(), [])` in [GameScreen.jsx:643](src/screens/GameScreen.jsx#L643).
  It subscribes to bus events and plays crude single-oscillator *placeholder* tones.
  This is the integration seam — we upgrade it, we don't bolt on a parallel system.
- The **bus** ([src/core/bus.js](src/core/bus.js), `mitt`) already carries the events we
  need. Emitted today:
  - `combo:hit` `{ combo, tier, source }` — **`source` already distinguishes material**
    (`bamboo`, `thick-bamboo`, `vine`, `yokai`, `golden`, `tnt`, `obstacle`, …) via
    `ComboSystem.registerHit` → [ComboSystem.js:20](src/systems/ComboSystem.js#L20).
  - `combo:tier`, `combo:break`, `combo:multicut`
  - `coin:collected`, `monk:death`
  - `golden:hit`, `golden:burst`
  - `samurai:appear|mercy|execution|repelled`
  - `arrow:trap-cut|deflect|hit|burst-cleared`
- **Biome state** updates every frame on the run-state object:
  `s.visualBiome` ∈ {rain, sunset, village, sakura, snow, volcano, water} plus the cave
  transition; `BiomeSystem.visualLabel(seq)` is the canonical label. Sequenced by
  [biomeSchedule.js](src/data/biomeSchedule.js) through [BiomeSystem.js](src/systems/BiomeSystem.js).
  **No biome-change *event* is emitted yet** — we add one.
- **Settings UI** ([SettingsControls.jsx](src/components/SettingsControls.jsx)) has
  Music / Effects / Screen-Shake controls but is explicitly **"VISUAL ONLY"** — local
  state, not wired to audio, not persisted.
- Screen flow ([sumi_e_blade.jsx](sumi_e_blade.jsx)): `LOADING → INTRO → START →
  PLAYING → GAMEOVER` (+ WARDROBE/LEADERBOARDS/ACHIEVEMENTS). Only `GameScreen`
  currently attaches audio, so **menu music needs a higher mount point**.

## 3. Architecture decisions

1. **Two engine modules, one shared AudioContext.**
   - `AudioEngine` (new, `src/audio/AudioEngine.js`) — owns the single `AudioContext`,
     the master compressor, and two sub-buses: `sfxBus` and `musicBus` (each a
     `GainNode` for independent volume/mute). Handles the autoplay unlock gesture once.
   - `SoundSystem` (upgrade existing) — SFX. Ports the 12 synth functions, routes them
     through `AudioEngine.sfxBus`, subscribes to gameplay bus events.
   - `MusicSystem` (new, `src/audio/MusicSystem.js`) — the BGM sequencer ported from the
     mock, routed through `AudioEngine.musicBus`, with **crossfade** between tracks.
2. **Audio mounts at the app level, not inside GameScreen**, so music survives screen
   transitions (menu ↔ run ↔ game over) without restarting. Attach `SoundSystem` +
   `MusicSystem` once in `sumi_e_blade.jsx` (or a small `useAudio()` hook). GameScreen
   stops calling `SoundSystem.attach()`.
3. **Systems emit; audio listens** (the bus discipline invariant). Music reacts to
   *events*, never reaches into the run loop. We add exactly one new gameplay event:
   `biome:enter { visual, gameplay }`, emitted by `BiomeSystem` when `visualLabel`
   changes. Screen music is driven by a `screen:enter { name }` event emitted from the
   app shell.
4. **The BGM scheduler keeps its own `setInterval` look-ahead clock** (as in the mock) —
   it is independent of the `[]`-deps rAF loop and must not be folded into it.
5. **Track note-data lives as a structural module**, not balance config:
   `src/data/musicTracks.js` (mirrors how [yokaiShapes.js](src/data/yokaiShapes.js) and
   [biomeSchedule.js](src/data/biomeSchedule.js) hold authored content as `.js`). The
   **biome→track map + crossfade timings** are the tunable part → `src/data/config.json`
   under a new `audio` section, read via the existing config path.
6. **mp3-ready tracks.** The user plans to add `.mp3` files later. Each track entry
   carries an optional `src` (URL/path); `MusicSystem.play` checks it first — if present,
   it streams an `AudioBufferSourceNode`/`<audio>` through `musicBus` (looped) instead of
   running the synth sequencer. Same crossfade voices, same buses; synth is the fallback
   until a track has audio. (Files would live in `public/audio/` and preload at BOOT.)
7. **SFX-first.** Phases 1–2 (engine + SFX + settings) are the deliverable that matters;
   BGM (phases 3–4) is the subtle layer and should never compete with the slice feedback
   — default `bgmVolume` lower than `sfxVolume`, and music ducks nothing but its own gain.

## 4. Crossfade design (the core BGM mechanic)

A track is a *synth sequence*, not a streamed clip, so "crossfade" = run two sequencer
**voices** briefly and ramp their gains. Implementation:

- A `MusicVoice` encapsulates: the active track def, its scheduler step/time refs, and
  its own `GainNode` (child of `musicBus`).
- `MusicSystem.play(trackId, { fadeMs })`:
  - If a voice is already playing the *same* track → no-op.
  - Else spin up a new `MusicVoice` for `trackId` at gain 0; `linearRamp` it to target
    over `fadeMs` (default ~1500–2000ms, in `config.audio.crossfadeMs`).
  - Ramp the outgoing voice to 0 over the same window, then tear it down (stop its
    scheduler, disconnect) on a `setTimeout(fadeMs + tail)`.
  - Cap concurrent voices at 2; if a third change arrives mid-fade, snap-retire the
    oldest so fades never stack into a mush.
- Tempo (`speedMultiplier`) is fixed at 1.0 for now; the mock's speed ramp is out of
  scope (note as future: tie to run speed tier).

## 5. SFX integration

### 5.1 Port the synth functions
Move the 12 `play*` bodies from the mock into `SoundSystem`, swapping
`gain.connect(ctx.destination)` → `gain.connect(AudioEngine.sfxBus)`. Keep them pure
(take the shared ctx). Drop the mock's per-component `audioCtxRef`/`ensureContext`.

### 5.2 Event → SFX map
Most slices already flow through `combo:hit` carrying `source`, so we route material
sounds off that single event instead of scattering new emits:

| Bus event | `source` | SFX function |
|---|---|---|
| `combo:hit` | `bamboo` / `thick-bamboo` | Bamboo Slice |
| `combo:hit` | `vine` / `rope` | Rope Slice |
| `combo:hit` | `yokai` | Yokai Slice |
| `combo:hit` | `obstacle` / `spike` / boulder | Spike Slice |
| `combo:hit` | `tnt` | (handled by `detonateTnt`, see below) |
| `combo:tier` | — | ascending tier chime (keep, retune to mock voice) |
| `combo:multicut` | — | bright multi-cut sweep (pitch ↑ with count) |
| `coin:collected` | — | coin chime (replace placeholder w/ a soft pluck) |
| `golden:hit` | — | Golden Spawn arpeggio (per scrub tick, throttled) |
| `golden:burst` | — | Golden Burst |
| `samurai:appear/mercy/execution/repelled` | — | keep current mapping, retune |
| `arrow:trap-cut/deflect/hit/burst-cleared` | — | Arrow Pop / deflect / hit / cleared |
| `monk:death` | — | heavy low thud (keep) |

### 5.3 New emits to add (small, targeted)
- `ui:click` — fire from a shared click handler. `MenuButton` already centralizes the
  CTA buttons ([MenuButton.jsx](src/components/MenuButton.jsx)); add a `bus.emit('ui:click')`
  there (and in the pause/menu icon buttons) → UI Click SFX.
- `trap:tnt` — emit in `CombatSystem.detonateTnt` ([CombatSystem.js:86](src/systems/CombatSystem.js#L86))
  → TNT Boom (distinct from the generic slice).
- `golden:spawn` — emit in `DemonSystem.spawnGolden` → Golden Spawn (vs. the per-hit
  scrub tone). *(Optional: Golden Idle / Arrow Idle loops are ambience — defer.)*

### 5.4 Throttling
Slices can fire many per swipe (multi-cut). Add a per-sound min-interval guard in
`SoundSystem` (e.g. ≥30ms between identical SFX) so a 5-yokai swipe doesn't stack into
clipping — the `combo:multicut` sweep already gives the "big" payoff.

## 6. BGM integration

### 6.1 Track data
`src/data/musicTracks.js` exports the `TRACKS` array verbatim from the mock (note/
percussion data). Drop `color`/`description`/visualizer-only fields, or keep `color`
for a possible future HUD tie-in (cheap, harmless).

### 6.2 Biome → track map (tunable, `config.audio.biomeTracks`)
**Final** (per user direction). 5 tracks used; only Night Hunt Sprint stays in the data
unmapped. Values live in `config.audio.biomeTracks` so they stay tunable.

| Context | Track |
|---|---|
| Menus (START, GAMEOVER, WARDROBE, LEADERBOARDS, ACHIEVEMENTS) | Upper Rank Presence 🌑 |
| LOADING, INTRO | **silent** — these screens own their own internal music |
| `rain` (rainforest opener) | Upper Rank Presence 🌑 |
| `sunset` | Upper Rank Presence 🌑 |
| `sakura` | Hinokami Kagura 🔥 |
| `volcano` | Hinokami Kagura 🔥 |
| `village` | Spirit Shrine 🌸 |
| `snow` | Butterfly Dance 🦋 |
| `water` | Wisteria Rest 🍵 (calm swim) |
| cave / grove transition tunnel | **no swap** — hold whatever the adjacent biome is playing |

### 6.3 Trigger wiring
- `BiomeSystem.visualLabel` change → `bus.emit('biome:enter', { visual, gameplay })`.
  `MusicSystem` maps `visual` → trackId and calls `play(trackId, { fadeMs: crossfadeMs })`.
  **Ignore the TRANSITION phase entirely** (cave/grove tunnels emit no swap) so the track
  only changes once we settle into the destination biome — matches "transitions keep the
  adjacent biome's music." Because rain+sunset share Upper Rank (and sakura/volcano share
  Hinokami, village/snow share Butterfly), many schedule legs are also a no-op `play()`
  of the already-playing track — keeps actual crossfades sparse, which the user wants.
- **Samurai / boss = slow the *current* track, don't swap it.** On `samurai:appear` /
  boss warning, ramp the active voice's playback tempo down (the sequencer already derives
  step duration from `bpm`; expose a `tempoScale` the scheduler multiplies in, ramped via
  the run loop's existing slow-mo cue). Restore tempo on resolve. No dedicated combat
  track for now (placeholder for a future stinger).
- App shell emits `screen:enter { name }` on `gameState` change → menu track (Upper Rank)
  for START/GAMEOVER/WARDROBE/LEADERBOARDS/ACHIEVEMENTS. **LOADING and INTRO are silent**
  (they play their own internal music) — `MusicSystem` does not start until the user lands
  on START, so the first BGM the system plays is the menu track. Entering `PLAYING` lets
  the biome events take over (the opener `rain` is also Upper Rank, so START→run is a
  seamless continuation, not a crossfade).

### 6.4 Lifecycle
- Music cannot start before a user gesture (autoplay policy). `AudioEngine` resolves the
  unlock on the first `pointerdown`/`keydown` (the existing pattern in `SoundSystem`),
  then `MusicSystem` starts the queued track. Until then it stays silent (no errors).
- On `PLAYING → GAMEOVER`/`START`, crossfade back to Wisteria Rest. On tab blur, pause
  the scheduler (and `ctx.suspend()`); resume on focus.

## 7. Settings & persistence

- Extend `Persistence` defaults ([Persistence.js:8](src/core/Persistence.js#L8)) with:
  `bgmVolume` (0–1, default .7), `sfxVolume` (default .8), `bgmMuted`, `sfxMuted`,
  `screenShake` (bool). **Additive fields → safe via merge-over-defaults**, no version
  bump needed (per the persistence invariant). Add them to `normalizeData` clamping.
- Rewrite `SettingsControls` to read initial values from `Persistence`, and on change:
  `Persistence.save()` + `bus.emit('settings:audio', { bgmVolume, sfxVolume, bgmMuted,
  sfxMuted })`. `AudioEngine` listens and sets `sfxBus.gain` / `musicBus.gain` (with a
  short `setTargetAtTime` smoothing, as the mock does for master volume).
- Screen-shake toggle: route through state/config so renderers honor it (separate from
  audio; include here since the same modal owns it).

## 8. Files

**Create**
- `src/audio/AudioEngine.js` — shared ctx, compressor, sfx/music buses, unlock, volume.
- `src/audio/MusicSystem.js` — sequencer + crossfade voices.
- `src/data/musicTracks.js` — ported `TRACKS` note data.

**Modify**
- `src/systems/SoundSystem.js` — port the 12 SFX synths; route via AudioEngine; expand
  the event map + throttle.
- `src/systems/BiomeSystem.js` — emit `biome:enter` on visual-label change (debounced).
- `src/systems/CombatSystem.js` — `trap:tnt` emit in `detonateTnt`.
- `src/systems/DemonSystem.js` — `golden:spawn` emit in `spawnGolden`.
- `src/components/MenuButton.jsx` (+ pause/menu buttons) — `ui:click` emit.
- `src/components/SettingsControls.jsx` — wire to Persistence + `settings:audio` bus.
- `src/core/Persistence.js` — audio/shake fields in defaults + normalize.
- `sumi_e_blade.jsx` — mount audio once; emit `screen:enter` on `gameState` change.
- `src/screens/GameScreen.jsx` — remove the local `SoundSystem.attach()` (moved up).
- `src/data/config.json` — `audio` section (crossfadeMs, biomeTracks, default volumes).

## 9. Phased rollout

1. **Engine + SFX parity.** AudioEngine + ported SoundSystem behind the existing events;
   verify every current placeholder is replaced by the richer synth, no regressions.
   *(No new behavior — pure upgrade, easy to A/B.)*
2. **Settings wiring + persistence.** Volume/mute actually work and survive reload.
3. **BGM single-track.** MusicSystem plays one fixed track in-run + Wisteria on menus,
   with the unlock/lifecycle handling. No crossfade yet.
4. **Biome crossfade.** `biome:enter` event + the biome→track map + the 2-voice
   crossfade. Tune `crossfadeMs` and the map by playtest.
5. **New SFX emits + polish.** `ui:click`, `trap:tnt`, `golden:spawn`, throttling; optional
   idle ambiences (Golden Idle / Arrow Idle).

## 10. Invariant & audit compliance

- **No React in engine layers**: AudioEngine/MusicSystem/SoundSystem are plain JS in
  `src/audio/` & `src/systems/` — keep them out of the `grep -rE "useState|useRef..."`
  audit. The only React touch is mounting `.attach()` in the shell + the Settings UI.
- **Systems emit; React/audio listen**: audio subscribes to the bus; gameplay never
  calls into audio directly. New emits are one-liners at the source of truth.
- **`bus.off` symmetry**: every `bus.on` in `attach()` returns a teardown that `bus.off`s
  it (existing SoundSystem already does this — preserve the pattern in MusicSystem).
- **No `new Audio()` in gameplay code** — satisfied; all audio is Web Audio behind the
  systems.
- **Data vs config**: note content in `data/*.js`, tunables in `config.json`; no magic
  literals duplicated.

## 11. Resolved decisions

- **Track selection** — 5 tracks used (Upper Rank, Hinokami, Spirit Shrine, Butterfly,
  Wisteria). Only Night Hunt Sprint kept in data, unmapped.
- **Biome→track map** — finalized in §6.2 (menus + rain + sunset = Upper Rank; sakura +
  volcano = Hinokami; village = Spirit Shrine; snow = Butterfly; water = Wisteria).
- **Transitions** — simple crossfade only; cave/grove tunnels hold the adjacent biome's
  track (no mid-tunnel swap).
- **Samurai / boss** — slow the *current* track's tempo, no separate combat track (until a
  dedicated one is sourced).
- **mp3** — tracks support an optional audio `src` for future mp3 files (§3.6); synth is
  the fallback until then.
- **Priority** — SFX first (phases 1–2); BGM is subtle, secondary, low-volume.

- **LOADING / INTRO** — silent; these screens own their own internal music. The BGM
  system starts on START.
- Crossfade length defaults to ~1500ms in `config.audio.crossfadeMs` — tune by ear.
