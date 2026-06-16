const STORAGE_KEY = 'samurai_blade_save_v1';

const defaultData = {
  highScore: 0,
  totalPaces: 0,
  bossesDefeated: 0,
  achievements: [],
  gamesPlayed: 0
};

export const Persistence = {
  data: { ...defaultData },

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = { ...defaultData, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Could not load save data", e);
    }
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Could not save data", e);
    }
  },

  updateScore(score) {
    let newHighScore = false;
    if (score > this.data.highScore) {
      this.data.highScore = score;
      newHighScore = true;
    }
    this.data.totalPaces += score;
    this.data.gamesPlayed += 1;
    this.checkAchievements();
    this.save();
    return newHighScore;
  },

  incrementBosses() {
    this.data.bossesDefeated += 1;
    this.checkAchievements();
    this.save();
  },

  checkAchievements() {
    const unlock = (id) => {
      if (!this.data.achievements.includes(id)) {
        this.data.achievements.push(id);
      }
    };

    if (this.data.totalPaces >= 10000) unlock('marathon_runner');
    if (this.data.bossesDefeated >= 1) unlock('first_blood');
    if (this.data.bossesDefeated >= 10) unlock('slayer');
    if (this.data.highScore >= 5000) unlock('master_swordsman');
  },
  
  getAchievementsList() {
    return [
      { id: 'first_blood', name: 'First Blood', description: 'Defeat your first boss.', unlocked: this.data.achievements.includes('first_blood') },
      { id: 'slayer', name: 'Demon Slayer', description: 'Defeat 10 bosses.', unlocked: this.data.achievements.includes('slayer') },
      { id: 'master_swordsman', name: 'Master Swordsman', description: 'Reach 5000 paces in a single run.', unlocked: this.data.achievements.includes('master_swordsman') },
      { id: 'marathon_runner', name: 'Endless Journey', description: 'Walk 10,000 total paces across all lifetimes.', unlocked: this.data.achievements.includes('marathon_runner') }
    ];
  }
};

Persistence.load();
