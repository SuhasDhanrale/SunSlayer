// A preset is a named bundle of GAME-STATE-SHAPED data fed to mocks. Seeded from
// the game's REAL initial-state factory so the shape matches live state — the
// closer the shape, the cleaner the promotion back into the game.
import { createInitialState } from '../core/GameState.js';

const base = () => structuredClone(createInitialState());

export const metaPresets = [
  {
    id: 'starter',
    label: 'Run start',
    note: 'Fresh run — monk just spawned, idle scenery, no boss.',
    create: () => {
      const s = base();
      s.run.phase = 'RUNNING';
      return s;
    },
  },
  {
    id: 'midrun',
    label: 'Mid run',
    note: 'Score climbing, some bamboo on screen, focus charged.',
    create: () => {
      const s = base();
      s.run.phase = 'RUNNING';
      s.run.score = 4200;
      s.run.distance = 1800;
      s.sim.focus.energy = 100;
      return s;
    },
  },
  {
    id: 'boss',
    label: 'Boss encounter',
    note: 'Ronin boss active, warning flashing — for tuning the boss UX.',
    create: () => {
      const s = base();
      s.run.phase = 'BOSS';
      s.run.distance = 5000;
      s.entities.boss = {
        ...s.entities.boss,
        active: true,
        type: 'ronin',
        phase: 'warning',
        warningTimer: 0,
        hp: 15,
        maxHp: 15,
      };
      return s;
    },
  },
];

export const getPreset = (presets, id) =>
  presets.find((preset) => preset.id === id) || presets[0];
