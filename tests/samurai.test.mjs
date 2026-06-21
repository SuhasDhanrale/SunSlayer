import test from 'node:test';
import assert from 'node:assert/strict';
import { StumbleSystem } from '../src/systems/StumbleSystem.js';
import { SamuraiSystem } from '../src/systems/SamuraiSystem.js';
import { BossSystem } from '../src/systems/BossSystem.js';
import { SegmentSystem } from '../src/systems/SegmentSystem.js';
import { BOSS_CONFIG, SAMURAI, STUMBLE } from '../src/config/constants.js';

const makeState = () => ({
  monk: { x: 150, y: 700 },
  stumble: { count: 0, slowTimer: 0, incidentGraceTimer: 0 },
  samurai: {
    stage: 'absent', pose: 'absent', x: 0, y: 0, scale: 0.4,
    coolTimer: 0, graceTimer: 0, lastStumble: 0,
    pendingDuel: null, deferredIncident: false,
  },
  boss: {
    active: false, type: 'archer', phase: 'hidden', role: null,
    finishedRole: null, finishedMode: null, arrows: [], warningTimer: 0,
    hp: 0, maxHp: 0, hitCooldown: 0, x: 0, y: 0, vx: 0, vy: 0, timer: 0,
  },
  coins: [], bamboo: [], demons: [], debris: [], pendingBoss: null,
  focus: { active: false, energy: 100, path: [] },
  sword: { isSlashing: false, trail: [], x: 0, y: 0 },
  combo: 0, comboTimer: 0, comboTier: 0, comboLastStumble: 0, maxCombo: 0,
  shake: 0, flashHit: 0, flashColor: '', hitPause: 0,
  currentTimeScale: 1, segmentTime: 0, arrowCluster: null,
  playerBiome: 'bamboo', biome: 'bamboo', pattern: null,
});

function registerIncident(s, source = 'test') {
  StumbleSystem.tick(s, STUMBLE.incidentGrace || 90);
  assert.equal(StumbleSystem.register(s, { source }), true);
}

test('stumble incidents debounce overlapping contacts', () => {
  const s = makeState();
  assert.equal(StumbleSystem.register(s, { source: 'bamboo' }), true);
  assert.equal(StumbleSystem.register(s, { source: 'yokai' }), false);
  assert.equal(s.stumble.count, 1);
  StumbleSystem.tick(s, STUMBLE.incidentGrace || 90);
  assert.equal(StumbleSystem.register(s, { source: 'raft' }), true);
  assert.equal(s.stumble.count, 2);
});

test('first incident watches, second starts the eight-hit mercy duel', () => {
  const s = makeState();
  StumbleSystem.register(s, { source: 'bamboo' });
  SamuraiSystem.tick(s, 1, 1, 320);
  assert.equal(s.samurai.stage, 'watching');
  assert.ok(s.samurai.x <= 260, 'watching Samurai must remain inside a 320px canvas');

  registerIncident(s, 'yokai');
  SamuraiSystem.tick(s, 1, 1, 320);
  assert.equal(s.boss.active, true);
  assert.equal(s.boss.duelMode, 'mercy');
  assert.equal(s.boss.hp, 8);
  assert.ok(s.boss.x <= 260, 'duel must begin inside a 320px canvas');
});

test('mercy duel takes eight hits and victory enters post-mercy grace', () => {
  const s = makeState();
  BossSystem.startRonin(s, { mode: 'mercy', canvasWidth: 768, force: true });
  s.boss.phase = 'active';

  for (let hit = 0; hit < 8; hit++) {
    s.sword.isSlashing = true;
    s.sword.trail = [{ x: s.boss.x, y: s.boss.y }, { x: s.boss.x - 100, y: s.boss.y }];
    s.sword.x = s.boss.x + 100;
    s.sword.y = s.boss.y;
    BossSystem.tick(s, 1, 1, () => assert.fail('mercy duel ended too early'));
    s.sword.isSlashing = false;
    for (let frame = 0; frame < BOSS_CONFIG.ronin.hitCooldown; frame++) {
      BossSystem.tick(s, 1, 1, () => assert.fail('mercy duel ended too early'));
    }
  }

  assert.equal(s.boss.phase, 'defeated');
  BossSystem.tick(s, 1, 21, () => assert.fail('defeated Samurai cannot kill'));
  SegmentSystem.tick(s, 1, 1, 768, 720);
  assert.equal(s.samurai.stage, 'postMercy');
  assert.equal(s.samurai.graceTimer, SAMURAI.postMercyGrace);
});

test('third incident starts an undamageable execution and ends the run', () => {
  const s = makeState();
  s.samurai.stage = 'postMercy';
  registerIncident(s, 'raft');
  SamuraiSystem.tick(s, 1, 1, 768);
  assert.equal(s.boss.duelMode, 'execution');
  assert.equal(s.boss.hp, 0);

  s.boss.phase = 'active';
  s.sword.isSlashing = true;
  s.sword.trail = [{ x: s.boss.x, y: s.boss.y }, { x: s.boss.x - 100, y: s.boss.y }];
  s.sword.x = s.boss.x + 100;
  s.sword.y = s.boss.y;
  let gameOver = false;
  BossSystem.tick(s, 1, 1, () => { gameOver = true; });
  assert.equal(s.boss.hp, 0);
  assert.equal(s.boss.phase, 'active');
  BossSystem.tick(s, 1, BOSS_CONFIG.ronin.executionCharge, () => { gameOver = true; });
  assert.equal(gameOver, true);
});

test('clean play resets the full episode with biome-aware timing', () => {
  const watching = makeState();
  watching.samurai.stage = 'watching';
  SamuraiSystem.tick(watching, 1, SAMURAI.watchResetWindow, 768);
  assert.equal(watching.samurai.stage, 'absent');

  const water = makeState();
  water.playerBiome = 'water';
  water.samurai.stage = 'postMercy';
  SamuraiSystem.tick(water, 1, SAMURAI.postMercyResetWindow / 2, 768);
  assert.equal(water.samurai.stage, 'absent');

  const cave = makeState();
  cave.playerBiome = 'cave';
  cave.samurai.stage = 'watching';
  SamuraiSystem.tick(cave, 1, SAMURAI.watchResetWindow * 2, 768);
  assert.equal(cave.samurai.stage, 'watching');
});

test('archer contacts defer and coalesce one Samurai pressure step', () => {
  const s = makeState();
  s.boss.active = true;
  s.boss.type = 'archer';
  StumbleSystem.register(s, { source: 'arrow' });
  SamuraiSystem.tick(s, 1, 1, 768);
  registerIncident(s, 'arrow');
  SamuraiSystem.tick(s, 1, 1, 768);
  assert.equal(s.samurai.stage, 'absent');
  s.boss.active = false;
  SamuraiSystem.tick(s, 1, 1, 768);
  assert.equal(s.samurai.stage, 'watching');
});

test('coin-gated mercy duel preserves mode and responsive start position', () => {
  for (const width of [320, 768, 1920]) {
    const s = makeState();
    s.coins = [{ x: 400 }];
    assert.equal(BossSystem.startRonin(s, { mode: 'mercy', canvasWidth: width }), false);
    assert.equal(s.boss.pendingDuelMode, 'mercy');
    s.coins = [];
    assert.equal(BossSystem.tryStartPending(s), true);
    assert.equal(s.boss.duelMode, 'mercy');
    assert.ok(s.boss.x <= width - 60 || width < 290);
    assert.equal(BOSS_CONFIG.ronin.mercyCharge, 180);
  }
});
