// Each experiment is ITS OWN file under `screens/`; registering it is a single
// entry appended here. Additive — never edit an existing experiment to make a
// new one; copy it or start a fresh file.
//
// Entry contract (see MockWorkbench.jsx for the full prop contract):
//   id            stable kebab id
//   title         sidebar + header label
//   description   sidebar subtitle
//   component     the mock; receives { presetId, resetToken, state, setState }
//   defaultPresetId?  preset selected when this screen opens
//   initialState?     seed for the per-screen toolbar `state`
//   controls?         optional toolbar slot: ({ state, setState, reset }) => ReactNode

import { GameplayMock } from './screens/GameplayMock.jsx';
import { RainyForestMock } from './screens/RainyForestMock.jsx';
import { MountainSakuraMock } from './screens/MountainSakuraMock.jsx';
import { SnowShackMock } from './screens/SnowShackMock.jsx';
import { SunsetFirefliesMock } from './screens/SunsetFirefliesMock.jsx';
import { VolcanicDangerMock } from './screens/VolcanicDangerMock.jsx';
import { RoadmapDashboard } from './screens/RoadmapDashboard.jsx';
import { FruitNinjaDemonsMock } from './screens/FruitNinjaDemonsMock.jsx';
import { EnemyGalleryMock } from './screens/EnemyGalleryMock.jsx';
import { ElementalSlashesMock } from './screens/ElementalSlashesMock.jsx';
import { PeacefulVillageMock } from './screens/PeacefulVillageMock.jsx';
import { CosmeticsMock } from './screens/CosmeticsMock.jsx';
import { StartScreenMock } from './screens/StartScreenMock.jsx';
import { WardrobeSlashesMock } from './screens/WardrobeSlashesMock.jsx';
import { DesignNotesMock } from './screens/DesignNotesMock.jsx';
import { PatternLabMock } from './screens/PatternLabMock.jsx';
import { DirectorLabMock } from './screens/DirectorLabMock.jsx';
import { WaterBiomeMock } from './screens/WaterBiomeMock.jsx';
import { CaveBiomeMock } from './screens/CaveBiomeMock.jsx';
import { CaveVisualBiomeMock } from './screens/CaveVisualBiomeMock.jsx';
import { CaveVisualBiomeMockV2 } from './screens/CaveVisualBiomeMockV2.jsx';
import { WaterVisualBiomeMock } from './screens/WaterVisualBiomeMock.jsx';
import { WaterVisualBiomeMockV2 } from './screens/WaterVisualBiomeMockV2.jsx';
import { AssetLibraryMock } from './screens/AssetLibraryMock.jsx';
import { IntroSequenceMock } from './screens/IntroSequenceMock.jsx';
import { BackgroundMusicMock } from './screens/BackgroundMusicMock.jsx';

export const mockScreens = [
  {
    id: 'intro-sequence',
    title: '🎬 Cinematic Intro',
    description: "15-second opening cinematic featuring the shrine, rain, the demon's eyes, and the curse.",
    component: IntroSequenceMock,
  },
  {
    id: 'bgm-lab',
    title: '🎵 Background Music Lab',
    description: 'Prototyping speed-ramped piano background tracks with real-time tempo control using Web Audio synthesis.',
    component: BackgroundMusicMock,
  },
  {
    id: 'asset-library',
    title: '🏮 Interactive Asset Gallery',
    description: 'Inspect and slice all 14 biome obstacles (Spike, TNT, Raft with Lantern, Net, Fish, bridges, etc.) with custom calligraphy trails and split physics.',
    component: AssetLibraryMock,
  },
  {
    id: 'design-notes',
    title: '🧭 Game Design Notes',
    description: 'Living reference of the base-run gameplay decisions: pillars, difficulty model, elements, threats, and locked/open questions.',
    component: DesignNotesMock,
  },
  {
    id: 'pattern-lab',
    title: '🎼 Pattern Lab',
    description: 'Author & feel one slice-pattern at a time on a loop (grid + field), at real speed with the real engine. Swipe to slash.',
    component: PatternLabMock,
  },
  {
    id: 'director-lab',
    title: '📈 Director Lab',
    description: 'Shape the run\'s intensity curve and fast-forward the whole 20-min plan. Drag the pacing knobs; see which patterns the conductor picks.',
    component: DirectorLabMock,
  },
  {
    id: 'start-screen',
    title: '🎮 Game Start & Overlays',
    description: 'Start screen with animating rainy forest background, settings panel, and character selector.',
    component: StartScreenMock,
  },
  {
    id: 'wardrobe-slashes',
    title: '⚔️ Wardrobe & Slashes Gallery',
    description: 'Highly stylized anime showcase for selecting outfits and elemental slash effects.',
    component: WardrobeSlashesMock,
  },
  {
    id: 'gameplay',
    title: 'Gameplay Scene',
    description: 'Live GameRenderer at device viewports — biomes, monk, boss.',
    component: GameplayMock,
    defaultPresetId: 'starter',
  },
  {
    id: 'peaceful-village',
    title: 'Peaceful Village Biome',
    description: 'Tranquil village experiment with misty mountains, cherry blossoms, chimney smoke, and sky lanterns.',
    component: PeacefulVillageMock,
  },
  {
    id: 'cosmetics',
    title: '🏮 Character & Sister Cosmetics',
    description: 'Customize and preview 5 thematic variants of the Monk carrying his cursed sister.',
    component: CosmeticsMock,
  },
  {
    id: 'rainy-forest',
    title: 'Rainy Forest Biome',
    description: 'Parallax background experiment for a moody, rainy Japanese forest.',
    component: RainyForestMock,
  },
  {
    id: 'mountain-sakura',
    title: 'Mountain Sakura Biome',
    description: 'Classic grey mountains, a bright red sun, and falling sakura petals.',
    component: MountainSakuraMock,
  },
  {
    id: 'snow-shack',
    title: 'Snowy Shack Biome',
    description: 'Japanese wooden shacks covered in snow under a winter night with drifting snow.',
    component: SnowShackMock,
  },
  {
    id: 'sunset-fireflies',
    title: 'Sunset Fireflies Biome',
    description: 'Warm golden hour sunset, light shafts, swaying bamboo, and pulsing fireflies.',
    component: SunsetFirefliesMock,
  },
  {
    id: 'volcanic-danger',
    title: 'Volcanic Danger Biome',
    description: 'A perilous erupted zone with a glowing active volcano, cracked magma ground, and falling ash.',
    component: VolcanicDangerMock,
  },
  {
    id: 'feature-roadmap',
    title: '🗺️ Feature Roadmap',
    description: 'Interactive checklist and technical notes for implementing Project Bloodline.',
    component: RoadmapDashboard,
  },
  {
    id: 'yokai-slashing',
    title: '👺 Yokai Slashing (Fruit Ninja)',
    description: 'Interactive demo where you swipe to slice Yokai demon masks in half.',
    component: FruitNinjaDemonsMock,
  },
  {
    id: 'enemy-gallery',
    title: '🏮 Yokai Asset Gallery & Customizer',
    description: 'Browse, customize, slice, and create traditional Kabuki-style Yokai mask assets.',
    component: EnemyGalleryMock,
  },
  {
    id: 'elemental-slashes',
    title: '⚡ Breath Slashes Studio',
    description: 'Test and optimize stunning elemental sword slashes (Wind, Water, Thunder, Flame).',
    component: ElementalSlashesMock,
  },
  {
    id: 'cave-visual-v2',
    title: '🪨 Cave Biome V2 (Visual)',
    description: 'Physical cave transitions from high above, blue glowing ceiling lilies, wall shrines, and a completely clean interactive floor.',
    component: CaveVisualBiomeMockV2,
    initialState: {
      scrollSpeed: 1.5,
    },
    controls: ({ state, setState }) => (
      <div className="flex items-center gap-4 text-white text-[11px] font-black">
        <div className="flex items-center gap-1.5">
          <label htmlFor="ctrl-speed">SPEED:</label>
          <input
            id="ctrl-speed"
            type="range"
            min="0"
            max="4"
            step="0.2"
            value={state.scrollSpeed ?? 1.5}
            onChange={(e) => setState((prev) => ({ ...prev, scrollSpeed: parseFloat(e.target.value) }))}
            className="w-16 h-1 rounded bg-slate-700 appearance-none cursor-pointer"
          />
          <span>{(state.scrollSpeed ?? 1.5).toFixed(1)}x</span>
        </div>
      </div>
    ),
  },
  {
    id: 'cave-visual',
    title: '🪨 Cave Biome V1 (Legacy Visual)',
    description: 'Highly detailed rocky cavern with glowing crystals, water droplets, a rope bridge, ditches, and a leaping monk animation.',
    component: CaveVisualBiomeMock,
    initialState: {
      scrollSpeed: 1.5,
      forcePhase: 'auto',
      preludeLen: 800,
      entranceLen: 800,
      deepLen: 2800,
      exitLen: 800,
    },
    controls: ({ state, setState }) => (
      <div className="flex items-center gap-4 text-white text-[11px] font-black">
        <div className="flex items-center gap-1.5">
          <label htmlFor="ctrl-phase">PHASE:</label>
          <select
            id="ctrl-phase"
            value={state.forcePhase ?? 'auto'}
            onChange={(e) => setState((prev) => ({ ...prev, forcePhase: e.target.value }))}
            className="rounded border border-white/20 bg-slate-800 px-2 py-1 text-[10px] text-white outline-none"
          >
            <option value="auto">Auto (Scroll)</option>
            <option value="prelude">Prelude (Outdoor)</option>
            <option value="entrance">Entrance</option>
            <option value="deep">Deep Cave</option>
            <option value="exit">Exit</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor="ctrl-speed">SPEED:</label>
          <input
            id="ctrl-speed"
            type="range"
            min="0"
            max="4"
            step="0.2"
            value={state.scrollSpeed ?? 1.5}
            onChange={(e) => setState((prev) => ({ ...prev, scrollSpeed: parseFloat(e.target.value) }))}
            className="w-16 h-1 rounded bg-slate-700 appearance-none cursor-pointer"
          />
          <span>{(state.scrollSpeed ?? 1.5).toFixed(1)}x</span>
        </div>
      </div>
    ),
  },
  {
    id: 'water-visual-v2',
    title: '🌊 Water Biome V2 (Visual)',
    description: 'Luminous rainy night ocean with falling rain, ripples, floating paper lanterns (Toro Nagashi), submerged Torii gates, and lightning flashes.',
    component: WaterVisualBiomeMockV2,
    initialState: {
      scrollSpeed: 1.5,
      showRain: true,
      showKoi: true,
      showBubbles: true,
      showLanterns: true,
    },
    controls: ({ state, setState }) => (
      <div className="flex items-center gap-4 text-white text-[11px] font-black">
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showRain ?? true}
              onChange={(e) => setState((prev) => ({ ...prev, showRain: e.target.checked }))}
              className="rounded bg-slate-800 border-white/20"
            />
            RAIN
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showLanterns ?? true}
              onChange={(e) => setState((prev) => ({ ...prev, showLanterns: e.target.checked }))}
              className="rounded bg-slate-800 border-white/20"
            />
            LANTERNS
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showKoi ?? true}
              onChange={(e) => setState((prev) => ({ ...prev, showKoi: e.target.checked }))}
              className="rounded bg-slate-800 border-white/20"
            />
            KOI
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showBubbles ?? true}
              onChange={(e) => setState((prev) => ({ ...prev, showBubbles: e.target.checked }))}
              className="rounded bg-slate-800 border-white/20"
            />
            BUBBLES
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor="water-speed-v2">SPEED:</label>
          <input
            id="water-speed-v2"
            type="range"
            min="0"
            max="4"
            step="0.2"
            value={state.scrollSpeed ?? 1.5}
            onChange={(e) => setState((prev) => ({ ...prev, scrollSpeed: parseFloat(e.target.value) }))}
            className="w-16 h-1 rounded bg-slate-700 appearance-none cursor-pointer"
          />
          <span>{(state.scrollSpeed ?? 1.5).toFixed(1)}x</span>
        </div>
      </div>
    ),
  },
  {
    id: 'water-visual',
    title: '🌊 Water Biome (Visual)',
    description: 'Mystical night undersea view with silver moon rays, rising bubbles, schools of swimming Koi fish, swaying kelp, and a swimming monk.',
    component: WaterVisualBiomeMock,
    initialState: {
      scrollSpeed: 1.5,
      showRays: true,
      showKoi: true,
      showBubbles: true,
    },
    controls: ({ state, setState }) => (
      <div className="flex items-center gap-4 text-white text-[11px] font-black">
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showRays ?? true}
              onChange={(e) => setState((prev) => ({ ...prev, showRays: e.target.checked }))}
              className="rounded bg-slate-800 border-white/20"
            />
            MOONBEAMS
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showKoi ?? true}
              onChange={(e) => setState((prev) => ({ ...prev, showKoi: e.target.checked }))}
              className="rounded bg-slate-800 border-white/20"
            />
            KOI
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showBubbles ?? true}
              onChange={(e) => setState((prev) => ({ ...prev, showBubbles: e.target.checked }))}
              className="rounded bg-slate-800 border-white/20"
            />
            BUBBLES
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor="water-speed">SPEED:</label>
          <input
            id="water-speed"
            type="range"
            min="0"
            max="4"
            step="0.2"
            value={state.scrollSpeed ?? 1.5}
            onChange={(e) => setState((prev) => ({ ...prev, scrollSpeed: parseFloat(e.target.value) }))}
            className="w-16 h-1 rounded bg-slate-700 appearance-none cursor-pointer"
          />
          <span>{(state.scrollSpeed ?? 1.5).toFixed(1)}x</span>
        </div>
      </div>
    ),
  },
  {
    id: 'water-biome',
    title: '🌊 Water Biome (Playtest)',
    description: 'Auto-swimming locomotion with vines growing from below, slash mechanics, and speed ramping.',
    component: WaterBiomeMock,
  },
  {
    id: 'cave-biome',
    title: '🪨 Cave Biome (Playtest)',
    description: 'Uneven rocky terrain, jagged ceiling, and a TNT-blocked entry puzzle.',
    component: CaveBiomeMock,
  },
];
