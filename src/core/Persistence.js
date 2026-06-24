import { CHARACTERS, DEFAULT_CHARACTER_ID } from '../data/characters.js';
import { SLASHES, DEFAULT_SLASH_ID } from '../data/slashes.js';
import { QUESTS, questProgress } from '../data/quests.js';

const STORAGE_KEY = 'samurai_blade_save_v2';
const LEGACY_STORAGE_KEY = 'samurai_blade_save_v1';
const DISTANCE_ACHIEVEMENTS = new Set(['master_swordsman', 'marathon_runner']);

const createDefaultData = () => ({
  bestScore: 0,
  bestDistance: 0,
  totalDistancePaces: 0,
  walletCoins: 0,
  lifetimeCoins: 0,
  bossesDefeated: 0,
  bestCombo: 0,
  achievements: [],
  // Quests (long-arc deeds). `completedQuests` is the durable record of which quest
  // ids have been earned; `unseenQuests` is the subset the player hasn't viewed in
  // the panel yet (drives the home notification badge). Both additive → safe via
  // merge-over-defaults; quest progress itself is derived from the lifetime stats.
  completedQuests: [],
  unseenQuests: [],
  gamesPlayed: 0,
  ownedCharacterIds: [DEFAULT_CHARACTER_ID],
  ownedSlashIds: [DEFAULT_SLASH_ID],
  equippedCharacterId: DEFAULT_CHARACTER_ID,
  equippedSlashId: DEFAULT_SLASH_ID,
  // Audio + accessibility settings. Additive fields → safe via merge-over-defaults
  // (no version bump). Volumes are 0–1; mutes/shake are booleans.
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  bgmMuted: false,
  sfxMuted: false,
  screenShake: true,
  // First-time user experience: false until the coached first run finishes, then
  // every later run skips the prologue. Additive → safe via merge-over-defaults.
  tutorialDone: false,
});

const localStore = () => (typeof localStorage === 'undefined' ? null : localStorage);
let activeStore = localStore();

const storage = () => activeStore;
const cleanCount = (value) => Math.max(0, Math.floor(Number(value) || 0));
const clamp01 = (value, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
};

function normalizeIds(ids, catalog, fallback) {
  const valid = new Set(catalog.map((item) => item.id));
  const normalized = [...new Set(Array.isArray(ids) ? ids.filter((id) => valid.has(id)) : [])];
  if (!normalized.includes(fallback)) normalized.unshift(fallback);
  return normalized;
}

function normalizeData(raw = {}) {
  const data = { ...createDefaultData(), ...raw };
  data.bestScore = cleanCount(data.bestScore);
  data.bestDistance = cleanCount(data.bestDistance);
  data.totalDistancePaces = cleanCount(data.totalDistancePaces);
  data.walletCoins = cleanCount(data.walletCoins);
  data.lifetimeCoins = cleanCount(data.lifetimeCoins);
  data.bossesDefeated = cleanCount(data.bossesDefeated);
  data.bestCombo = cleanCount(data.bestCombo);
  data.gamesPlayed = cleanCount(data.gamesPlayed);
  data.achievements = [...new Set(Array.isArray(data.achievements) ? data.achievements : [])];
  const questIds = new Set(QUESTS.map((q) => q.id));
  data.completedQuests = [...new Set(Array.isArray(data.completedQuests) ? data.completedQuests : [])].filter((id) => questIds.has(id));
  data.unseenQuests = [...new Set(Array.isArray(data.unseenQuests) ? data.unseenQuests : [])].filter((id) => data.completedQuests.includes(id));
  data.ownedCharacterIds = normalizeIds(data.ownedCharacterIds, CHARACTERS, DEFAULT_CHARACTER_ID);
  data.ownedSlashIds = normalizeIds(data.ownedSlashIds, SLASHES, DEFAULT_SLASH_ID);
  data.equippedCharacterId = data.ownedCharacterIds.includes(data.equippedCharacterId)
    ? data.equippedCharacterId
    : DEFAULT_CHARACTER_ID;
  data.equippedSlashId = data.ownedSlashIds.includes(data.equippedSlashId)
    ? data.equippedSlashId
    : DEFAULT_SLASH_ID;
  data.bgmVolume = clamp01(data.bgmVolume, 0.7);
  data.sfxVolume = clamp01(data.sfxVolume, 0.8);
  data.bgmMuted = !!data.bgmMuted;
  data.sfxMuted = !!data.sfxMuted;
  data.screenShake = data.screenShake !== false;
  data.tutorialDone = !!data.tutorialDone;
  return data;
}

function migrateLegacy(raw = {}) {
  const migrated = createDefaultData();
  migrated.bossesDefeated = cleanCount(raw.bossesDefeated);
  migrated.gamesPlayed = cleanCount(raw.gamesPlayed);
  // v1 mixed combat bonuses into both distance fields. They cannot be repaired,
  // so only achievements unrelated to distance are safe to carry forward.
  migrated.achievements = (Array.isArray(raw.achievements) ? raw.achievements : [])
    .filter((id) => !DISTANCE_ACHIEVEMENTS.has(id));
  return normalizeData(migrated);
}

function catalogFor(kind) {
  if (kind === 'character') return { items: CHARACTERS, ownedKey: 'ownedCharacterIds', equippedKey: 'equippedCharacterId' };
  if (kind === 'slash') return { items: SLASHES, ownedKey: 'ownedSlashIds', equippedKey: 'equippedSlashId' };
  return null;
}

export const Persistence = {
  data: createDefaultData(),
  storageKind: 'localStorage',

  load() {
    const store = storage();
    if (!store) return;
    try {
      const stored = store.getItem(STORAGE_KEY);
      if (stored) {
        this.data = normalizeData(JSON.parse(stored));
        return;
      }
      const legacy = store.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        this.data = migrateLegacy(JSON.parse(legacy));
        this.save();
      }
    } catch (e) {
      console.warn('Could not load save data', e);
      this.data = createDefaultData();
    }
  },

  save() {
    try {
      storage()?.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save data', e);
    }
  },

  useCrazyGamesData(dataStore) {
    if (!dataStore) return false;

    try {
      const local = localStore();
      const cloudSave = dataStore.getItem(STORAGE_KEY);
      const localSave = local?.getItem(STORAGE_KEY);
      const cloudLegacy = dataStore.getItem(LEGACY_STORAGE_KEY);
      const localLegacy = local?.getItem(LEGACY_STORAGE_KEY);

      if (!cloudSave && localSave) {
        dataStore.setItem(STORAGE_KEY, localSave);
      } else if (!cloudSave && !cloudLegacy && localLegacy) {
        dataStore.setItem(LEGACY_STORAGE_KEY, localLegacy);
      }

      activeStore = dataStore;
      this.storageKind = 'crazygames-data';
      this.load();
      return true;
    } catch (e) {
      console.warn('Could not switch to CrazyGames Data save', e);
      activeStore = localStore();
      this.storageKind = 'localStorage';
      return false;
    }
  },

  completeRun({ distancePaces = 0, coinsCollected = 0, score = 0, maxCombo = 0 } = {}) {
    const distance = cleanCount(distancePaces);
    const coins = cleanCount(coinsCollected);
    const finalScore = cleanCount(score);
    const combo = cleanCount(maxCombo);
    // SCORE is the headline now, so "New Record" keys off the best score. Best
    // distance still tracks independently (the distance-based achievements read it).
    const isNewBest = finalScore > this.data.bestScore;
    if (isNewBest) this.data.bestScore = finalScore;
    if (distance > this.data.bestDistance) this.data.bestDistance = distance;
    if (combo > this.data.bestCombo) this.data.bestCombo = combo;
    this.data.totalDistancePaces += distance;
    this.data.walletCoins += coins;
    this.data.lifetimeCoins += coins;
    this.data.gamesPlayed += 1;
    this.checkAchievements();
    // Re-check all quests against the now-updated lifetime stats. Boss-count quests
    // resolve here too: bossesDefeated was banked mid-run by incrementBosses, so this
    // single end-of-run pass catches every quest type and surfaces one popup batch.
    const newlyCompletedQuests = this.checkQuests();
    this.save();
    return {
      isNewBest,
      bankedCoins: coins,
      walletCoins: this.data.walletCoins,
      bestScore: this.data.bestScore,
      bestDistance: this.data.bestDistance,
      newlyCompletedQuests,
    };
  },

  // Audio / accessibility settings. Persists a partial update, clamps, saves.
  updateSettings(partial = {}) {
    if (partial.bgmVolume != null) this.data.bgmVolume = clamp01(partial.bgmVolume, this.data.bgmVolume);
    if (partial.sfxVolume != null) this.data.sfxVolume = clamp01(partial.sfxVolume, this.data.sfxVolume);
    if (partial.bgmMuted != null) this.data.bgmMuted = !!partial.bgmMuted;
    if (partial.sfxMuted != null) this.data.sfxMuted = !!partial.sfxMuted;
    if (partial.screenShake != null) this.data.screenShake = !!partial.screenShake;
    this.save();
    return this.data;
  },

  purchaseCosmetic(kind, id) {
    const catalog = catalogFor(kind);
    if (!catalog) return { ok: false, reason: 'unknown-kind' };
    const item = catalog.items.find((entry) => entry.id === id);
    if (!item) return { ok: false, reason: 'unknown-id' };
    if (this.data[catalog.ownedKey].includes(id)) return { ok: false, reason: 'owned' };
    const cost = cleanCount(item.unlockCost);
    if (this.data.walletCoins < cost) return { ok: false, reason: 'insufficient-funds' };
    this.data.walletCoins -= cost;
    this.data[catalog.ownedKey].push(id);
    this.save();
    return { ok: true, reason: null, walletCoins: this.data.walletCoins };
  },

  equipCosmetic(kind, id) {
    const catalog = catalogFor(kind);
    if (!catalog) return { ok: false, reason: 'unknown-kind' };
    if (!catalog.items.some((entry) => entry.id === id)) return { ok: false, reason: 'unknown-id' };
    if (!this.data[catalog.ownedKey].includes(id)) return { ok: false, reason: 'not-owned' };
    this.data[catalog.equippedKey] = id;
    this.save();
    return { ok: true, reason: null };
  },

  incrementBosses() {
    this.data.bossesDefeated += 1;
    this.checkAchievements();
    this.save();
  },

  // Marks the coached first run complete so later runs skip the prologue. Called by
  // TutorialSystem when the last beat resolves. A debug reset flips it back for
  // re-testing the FTUE.
  completeTutorial() {
    this.data.tutorialDone = true;
    this.save();
  },

  resetTutorial() {
    this.data.tutorialDone = false;
    this.save();
  },

  checkAchievements() {
    const unlock = (id) => {
      if (!this.data.achievements.includes(id)) this.data.achievements.push(id);
    };
    if (this.data.totalDistancePaces >= 10000) unlock('marathon_runner');
    if (this.data.bossesDefeated >= 1) unlock('first_blood');
    if (this.data.bossesDefeated >= 10) unlock('slayer');
    if (this.data.bestDistance >= 5000) unlock('master_swordsman');
  },

  getAchievementsList() {
    return [
      { id: 'first_blood', name: 'First Blood', description: 'Defeat your first boss.', unlocked: this.data.achievements.includes('first_blood') },
      { id: 'slayer', name: 'Demon Slayer', description: 'Defeat 10 bosses.', unlocked: this.data.achievements.includes('slayer') },
      { id: 'master_swordsman', name: 'Master Swordsman', description: 'Reach 5000 paces in a single run.', unlocked: this.data.achievements.includes('master_swordsman') },
      { id: 'marathon_runner', name: 'Endless Journey', description: 'Walk 10,000 total paces across all lifetimes.', unlocked: this.data.achievements.includes('marathon_runner') },
    ];
  },

  // Earn any quest whose metric has reached its goal. Returns the quest objects newly
  // completed on this call (caller shows the in-game popup); they're also queued in
  // `unseenQuests` for the home notification until the panel is opened. Caller saves.
  checkQuests() {
    const newly = [];
    for (const quest of QUESTS) {
      if (this.data.completedQuests.includes(quest.id)) continue;
      if (questProgress(quest, this.data).completed) {
        this.data.completedQuests.push(quest.id);
        this.data.unseenQuests.push(quest.id);
        newly.push(quest);
      }
    }
    return newly;
  },

  // Live quest list for the panel: each quest plus its current progress + completion.
  getQuestsList() {
    return QUESTS.map((quest) => ({
      id: quest.id,
      name: quest.name,
      desc: quest.desc,
      unit: quest.unit,
      ...questProgress(quest, this.data),
    }));
  },

  // Home notification badge: true while any earned quest hasn't been viewed in the panel.
  hasUnseenQuests() {
    return this.data.unseenQuests.length > 0;
  },

  // Opening the quest panel clears the "new" notification.
  markQuestsSeen() {
    if (this.data.unseenQuests.length === 0) return;
    this.data.unseenQuests = [];
    this.save();
  },
};

export const PersistenceInternals = { createDefaultData, normalizeData, migrateLegacy };

Persistence.load();
