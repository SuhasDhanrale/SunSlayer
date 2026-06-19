import { COIN_CONFIG } from '../config/constants.js';

// Coin pickups are spawned by PatternRunner cells: authored `o` coins and one
// marker coin per spike. Collected by brushing the blade across them (see
// CombatSystem); moved by PhysicsSystem. Placeholder art.
export const CoinSystem = {
  add(s, x, y) {
    s.coins.push({ id: Math.random(), x, y, r: COIN_CONFIG.radius, bob: Math.random() * Math.PI * 2 });
  }
};
