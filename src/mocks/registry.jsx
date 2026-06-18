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

export const mockScreens = [
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
];
