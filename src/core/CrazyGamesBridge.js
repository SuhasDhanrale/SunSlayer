import { AudioEngine } from '../audio/AudioEngine.js';

const getSdk = () => {
  if (typeof window === 'undefined') return null;
  return window.CrazyGames?.SDK || null;
};

export const CrazyGamesBridge = {
  initPromise: null,
  initialized: false,
  disabled: false,
  loadingWanted: false,
  loadingSent: false,
  gameplayWanted: false,
  gameplaySent: false,
  settingsWanted: false,
  settingsListener: null,

  async init() {
    if (typeof window === 'undefined') return false;
    if (this.initialized) return true;
    if (this.disabled) return false;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const sdk = getSdk();
      if (!sdk) {
        this.disabled = true;
        return false;
      }

      if (sdk.environment === 'disabled') {
        this.disabled = true;
        return false;
      }

      try {
        await sdk.init?.();
      } catch (error) {
        this.disabled = true;
        console.warn('[CrazyGames] SDK init skipped:', error);
        return false;
      }

      if (sdk.environment === 'disabled') {
        this.disabled = true;
        return false;
      }

      this.initialized = true;
      this._syncLoading();
      this._syncGameplay();
      this._syncSettings();
      return true;
    })();

    return this.initPromise;
  },

  getEnvironment() {
    return getSdk()?.environment || (this.disabled ? 'disabled' : 'missing');
  },

  getDataStore() {
    return this._ready() ? getSdk()?.data || null : null;
  },

  loadingStart() {
    this.loadingWanted = true;
    void this.init().then(() => this._syncLoading());
  },

  loadingStop() {
    this.loadingWanted = false;
    void this.init().then(() => this._syncLoading());
  },

  gameplayStart() {
    this.gameplayWanted = true;
    void this.init().then(() => this._syncGameplay());
  },

  gameplayStop() {
    this.gameplayWanted = false;
    void this.init().then(() => this._syncGameplay());
  },

  applySdkSettings() {
    this.settingsWanted = true;
    void this.init().then(() => this._syncSettings());
    return () => {
      this.settingsWanted = false;
      this._removeSettingsListener();
      AudioEngine.applySdkSettings({ muteAudio: false });
    };
  },

  _ready() {
    const sdk = getSdk();
    return !!sdk && this.initialized && !this.disabled && sdk.environment !== 'disabled';
  },

  _game() {
    return this._ready() ? getSdk()?.game : null;
  },

  _syncLoading() {
    const game = this._game();
    if (!game) return;

    if (this.loadingWanted && !this.loadingSent) {
      if (this._call('loadingStart', () => game.loadingStart?.())) {
        this.loadingSent = true;
      }
      return;
    }

    if (!this.loadingWanted && this.loadingSent) {
      if (this._call('loadingStop', () => game.loadingStop?.())) {
        this.loadingSent = false;
      }
    }
  },

  _syncGameplay() {
    const game = this._game();
    if (!game) return;

    if (this.gameplayWanted && !this.gameplaySent) {
      if (this._call('gameplayStart', () => game.gameplayStart?.())) {
        this.gameplaySent = true;
      }
      return;
    }

    if (!this.gameplayWanted && this.gameplaySent) {
      if (this._call('gameplayStop', () => game.gameplayStop?.())) {
        this.gameplaySent = false;
      }
    }
  },

  _syncSettings() {
    const game = this._game();
    if (!game || !this.settingsWanted) return;

    const apply = (settings = game.settings || {}) => {
      AudioEngine.applySdkSettings({ muteAudio: !!settings.muteAudio });
    };

    apply(game.settings);

    if (!this.settingsListener && game.addSettingsChangeListener) {
      this.settingsListener = (settings) => apply(settings);
      this._call('addSettingsChangeListener', () => {
        game.addSettingsChangeListener(this.settingsListener);
      });
    }
  },

  _removeSettingsListener() {
    const game = this._game();
    if (game && this.settingsListener && game.removeSettingsChangeListener) {
      this._call('removeSettingsChangeListener', () => {
        game.removeSettingsChangeListener(this.settingsListener);
      });
    }
    this.settingsListener = null;
  },

  _call(name, action) {
    if (this.disabled) return false;
    try {
      action();
      return true;
    } catch (error) {
      console.warn(`[CrazyGames] ${name} skipped:`, error);
      return false;
    }
  },
};
