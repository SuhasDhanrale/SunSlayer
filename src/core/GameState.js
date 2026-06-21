export const stateRef = { current: null };

export function createInitialState() {
  const state = {
    meta: {
      bestDistance: 0,
      totalDistancePaces: 0,
      walletCoins: 0,
      lifetimeCoins: 0,
      unlockedAchievements: []
    },
    run: {
      distance: 0,
      distancePaces: 0,
      coinsCollected: 0,
      combo: 0,
      maxCombo: 0,
      ended: false,
      phase: 'IDLE', // IDLE, RUNNING, WARNING, BOSS, DEAD
      overlay: null // null, HIT_PAUSE, PAUSE
    },
    sim: {
      monk: { x: 150, y: 0, runCycle: 0 },
      sword: { x: 0, y: 0, trail: [], isSlashing: false },
      focus: { active: false, energy: 100, path: [] },
      hitPause: 0,
      shake: 0,
      flashHit: 0,
      flashColor: '255, 255, 255',
      currentTimeScale: 1.0,
      cameraSpeed: 5.5,
      spawnTimer: 0,
      fgTimer: 0
    },
    entities: {
      boss: { 
        active: false, type: 'archer', phase: 'hidden', 
        arrows: [], nextTrigger: 3000, nextType: 'archer', 
        warningTimer: 0, hp: 0, maxHp: 0, hitCooldown: 0,
        x: 0, y: 0, vx: 0, vy: 0, timer: 0, scale: 1
      },
      bamboo: [],
      debris: [],
      scenery: [],
      foreground: []
    },
    input: {
      pointer: { x: 0, y: 0 }
    }
  };
  stateRef.current = state;
  return state;
}
