import test from 'node:test';
import assert from 'node:assert/strict';
import { Persistence, PersistenceInternals } from '../src/core/Persistence.js';
import { finalizeRun } from '../src/core/RunFinalizer.js';

const reset = () => { Persistence.data = PersistenceInternals.createDefaultData(); };

test('run finalization banks coins and distance exactly once', () => {
  reset();
  const run = { distance: 12349, coinsCollected: 7, maxCombo: 16, ended: false };
  const first = finalizeRun(run);
  const second = finalizeRun(run);

  assert.equal(first.distancePaces, 123);
  assert.equal(first.bankedCoins, 7);
  assert.equal(first.maxCombo, 16);
  assert.equal(second, null);
  assert.equal(Persistence.data.bestDistance, 123);
  assert.equal(Persistence.data.totalDistancePaces, 123);
  assert.equal(Persistence.data.walletCoins, 7);
  assert.equal(Persistence.data.gamesPlayed, 1);
});

test('v1 migration preserves safe history and resets polluted distance data', () => {
  const migrated = PersistenceInternals.migrateLegacy({
    highScore: 9000,
    totalPaces: 50000,
    gamesPlayed: 9,
    bossesDefeated: 3,
    achievements: ['first_blood', 'master_swordsman', 'marathon_runner'],
  });
  assert.equal(migrated.bestDistance, 0);
  assert.equal(migrated.totalDistancePaces, 0);
  assert.equal(migrated.gamesPlayed, 9);
  assert.equal(migrated.bossesDefeated, 3);
  assert.deepEqual(migrated.achievements, ['first_blood']);
});

test('cosmetics require funds, cannot be bought twice, and only owned items equip', () => {
  reset();
  assert.equal(Persistence.purchaseCosmetic('character', 'blossomwarden').reason, 'insufficient-funds');
  assert.equal(Persistence.equipCosmetic('character', 'blossomwarden').reason, 'not-owned');

  Persistence.data.walletCoins = 40;
  assert.equal(Persistence.purchaseCosmetic('character', 'blossomwarden').ok, true);
  assert.equal(Persistence.data.walletCoins, 0);
  assert.equal(Persistence.purchaseCosmetic('character', 'blossomwarden').reason, 'owned');
  assert.equal(Persistence.equipCosmetic('character', 'blossomwarden').ok, true);
  assert.equal(Persistence.data.equippedCharacterId, 'blossomwarden');
});
