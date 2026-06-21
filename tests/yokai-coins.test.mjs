import test from 'node:test';
import assert from 'node:assert/strict';
import { CoinSystem } from '../src/systems/CoinSystem.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { DemonSystem } from '../src/systems/DemonSystem.js';
import { bus } from '../src/core/bus.js';

const makeState = () => ({
  monk: { x: 150 },
  cameraSpeed: 0,
  coins: [],
  coinsCollected: 0,
  coinHudCount: 0,
  yokaiCoinDrops: [],
  debris: [],
  combo: 0,
  comboTimer: 0,
  comboTier: 0,
  maxCombo: 0,
  stumble: { count: 0 },
  hitPause: 0,
  shake: 0,
  flashHit: 0,
});

test('shared Yokai slice path creates exactly one reward for every type', () => {
  for (const type of ['oni', 'kitsune', 'noface']) {
    const s = makeState();
    const demon = { x: 400, y: 220, vx: 0, vy: 0, radius: 35, rot: 0, type, sliced: false };
    const p1 = { x: 350, y: 220 };
    const p2 = { x: 450, y: 220 };

    assert.equal(CombatSystem.trySliceDemon(demon, s, p1, p2), true);
    assert.equal(CombatSystem.trySliceDemon(demon, s, p1, p2), false);
    assert.equal(s.yokaiCoinDrops.length, 1);
    assert.equal(s.coinsCollected, 0);
  }
});

test('escaped and monk-contact Yokai do not create rewards', () => {
  const escaped = makeState();
  escaped.demons = [{ x: -130, y: 100, vx: 0, vy: 0, gravity: 0, radius: 35, rot: 0, rv: 0, stumbled: false, sliced: false }];
  DemonSystem.tick(escaped, 1, 1, 800, 600);
  assert.equal(escaped.yokaiCoinDrops.length, 0);

  const contact = makeState();
  contact.monk.y = 220;
  contact.demons = [{ x: 150, y: 200, vx: 0, vy: 0, gravity: 0, radius: 35, rot: 0, rv: 0, stumbled: false, sliced: false }];
  DemonSystem.tick(contact, 1, 1, 800, 600);
  assert.equal(contact.yokaiCoinDrops.length, 0);
});

test('Yokai reward lands ahead, banks on crossing, and displays on HUD arrival', () => {
  const s = makeState();
  const coin = CoinSystem.dropFromYokai(s, 100, 200, () => 0.25);
  const hudTarget = { x: 45, y: 40 };

  CoinSystem.tick(s, 1, 30, 800, hudTarget);
  assert.equal(coin.phase, 'grounded');
  assert.ok(coin.x >= s.monk.x);
  assert.equal(coin.y, 686);

  s.cameraSpeed = coin.x - s.monk.x + 1;
  CoinSystem.tick(s, 1, 1, 800, hudTarget);
  assert.equal(coin.phase, 'flying');
  assert.equal(s.coinsCollected, 1);
  assert.equal(s.coinHudCount, 0);

  let events = 0;
  const onCoin = () => { events += 1; };
  bus.on('coin:collected', onCoin);
  CoinSystem.tick(s, 1, 30, 800, hudTarget);
  bus.off('coin:collected', onCoin);

  assert.equal(s.yokaiCoinDrops.length, 0);
  assert.equal(s.coinsCollected, 1);
  assert.equal(s.coinHudCount, 1);
  assert.equal(events, 1);
});

test('authored coins remain immediate and separate from Yokai rewards', () => {
  const s = makeState();
  CoinSystem.add(s, 300, 400);
  CoinSystem.collectImmediately(s);

  assert.equal(s.coins.length, 1);
  assert.equal(s.yokaiCoinDrops.length, 0);
  assert.equal(s.coinsCollected, 1);
  assert.equal(s.coinHudCount, 1);
});