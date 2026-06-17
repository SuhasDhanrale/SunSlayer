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

export const mockScreens = [
  {
    id: 'gameplay',
    title: 'Gameplay Scene',
    description: 'Live GameRenderer at device viewports — biomes, monk, boss.',
    component: GameplayMock,
    defaultPresetId: 'starter',
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
];
