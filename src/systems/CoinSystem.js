import { COIN_CONFIG, GROUND_HEIGHT } from '../config/constants.js';
import { bus } from '../core/bus.js';

const POP_DURATION = 0.42;
const FLY_DURATION = 0.38;
const MIN_LANDING_LEAD = 180;
const FORWARD_POP = 80;
const POP_ARC_HEIGHT = 90;
const HUD_ARC_HEIGHT = 60;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (value) => Math.max(0, Math.min(1, value));

function ensureRewardState(s) {
  s.yokaiCoinDrops ||= [];
  if (!Number.isFinite(s.coinHudCount)) s.coinHudCount = Number(s.coinsCollected) || 0;
}

function emitCollection(s) {
  bus.emit('coin:collected', { runCoins: s.coinHudCount });
}

// Authored pickups stay in s.coins. Yokai rewards use an isolated lifecycle so
// blade collection and boss gating retain their existing behavior.
export const CoinSystem = {
  add(s, x, y) {
    s.coins.push({ id: Math.random(), x, y, r: COIN_CONFIG.radius, bob: Math.random() * Math.PI * 2 });
  },

  collectImmediately(s) {
    ensureRewardState(s);
    s.coinsCollected = (s.coinsCollected || 0) + 1;
    s.coinHudCount += 1;
    emitCollection(s);
  },

  dropFromYokai(s, x, y, random = Math.random) {
    ensureRewardState(s);
    const landingX = Math.max(x + FORWARD_POP, (s.monk?.x || 0) + MIN_LANDING_LEAD);
    const drop = {
      id: random(), phase: 'popping', age: 0, x, y,
      startX: x, startY: y, landingX,
      r: COIN_CONFIG.radius, bob: random() * Math.PI * 2, scale: 1,
    };
    s.yokaiCoinDrops.push(drop);
    return drop;
  },

  tick(s, dt, unscaledDt, canvasHeight, hudTarget) {
    ensureRewardState(s);
    const drops = s.yokaiCoinDrops;
    const groundY = canvasHeight - GROUND_HEIGHT - COIN_CONFIG.radius;
    const target = hudTarget || { x: 50, y: 50 };
    const elapsed = unscaledDt / 60;

    for (let i = drops.length - 1; i >= 0; i--) {
      const coin = drops[i];

      if (coin.phase === 'popping') {
        const scroll = (s.cameraSpeed || 0) * dt;
        coin.startX -= scroll;
        coin.landingX -= scroll;
        coin.age += elapsed;
        const t = clamp01(coin.age / POP_DURATION);
        const inv = 1 - t;
        const controlY = Math.min(coin.startY, groundY) - POP_ARC_HEIGHT;
        coin.x = lerp(coin.startX, coin.landingX, t);
        coin.y = inv * inv * coin.startY + 2 * inv * t * controlY + t * t * groundY;

        if (t >= 1) {
          coin.phase = 'grounded';
          coin.age = 0;
          coin.x = coin.landingX;
          coin.y = groundY;
        }
        continue;
      }

      if (coin.phase === 'grounded') {
        coin.x -= (s.cameraSpeed || 0) * dt;
        coin.y = groundY;
        const monkX = s.monk?.x || 0;
        if (coin.x <= monkX) {
          coin.phase = 'flying';
          coin.age = 0;
          coin.flightStartX = coin.x;
          coin.flightStartY = coin.y;
          s.coinsCollected = (s.coinsCollected || 0) + 1;
        }
        continue;
      }

      if (coin.phase === 'flying') {
        coin.age += elapsed;
        const t = clamp01(coin.age / FLY_DURATION);
        const eased = 1 - (1 - t) ** 3;
        coin.x = lerp(coin.flightStartX, target.x, eased);
        coin.y = lerp(coin.flightStartY, target.y, eased) - Math.sin(Math.PI * t) * HUD_ARC_HEIGHT;
        coin.scale = lerp(1, 0.45, eased);

        if (t >= 1) {
          s.coinHudCount += 1;
          emitCollection(s);
          drops.splice(i, 1);
        }
      }
    }
  },
};