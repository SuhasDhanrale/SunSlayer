export let GameConfig = {};

export const ConfigLoader = {
  async load() {
    try {
      const configModule = await import('../data/config.json');
      GameConfig = configModule.default;
    } catch (e) {
      console.error("Failed to load GameConfig", e);
      GameConfig = {};
    }
  }
};
