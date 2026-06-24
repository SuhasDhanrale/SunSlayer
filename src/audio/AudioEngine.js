import config from '../data/config.json';
import { bus } from '../core/bus.js';
import { Persistence } from '../core/Persistence.js';

// AudioEngine — the single shared Web Audio graph for the whole app.
//
//   sources ──> sfxBus  ─┐
//                        ├──> master (compressor) ──> ctx.destination
//   sources ──> musicBus ┘
//
// It owns the one AudioContext, the master compressor, and the two volume
// sub-buses. It resolves the browser autoplay-unlock gesture once and applies
// volume/mute changes from the `settings:audio` bus event. SFX (SoundSystem)
// and BGM (MusicSystem) both route through it — nobody else creates a context.
const AudioContextClass =
  typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;

const AUDIO_CFG = config.audio || {};
const DEFAULT_SFX = AUDIO_CFG.defaultSfxVolume ?? 0.8;
const DEFAULT_BGM = AUDIO_CFG.defaultBgmVolume ?? 0.7;

export const AudioEngine = {
  ctx: null,
  master: null,
  sfxBus: null,
  musicBus: null,
  unlocked: false,

  // Volume/mute state, mirrored so a later settings change before init still applies.
  sfxVolume: DEFAULT_SFX,
  bgmVolume: DEFAULT_BGM,
  sfxMuted: false,
  bgmMuted: false,
  sdkMuteAudio: false,

  _unlock: null,
  _onSettings: null,
  _onUnlocked: null, // optional callback set by MusicSystem to start once unlocked

  // Build the graph. Idempotent — safe to call from every system's attach().
  init() {
    if (typeof window === 'undefined' || !AudioContextClass || this.ctx) return;

    // Seed volume/mute from the saved settings (falls back to config defaults).
    const saved = Persistence.data || {};
    this.sfxVolume = saved.sfxVolume ?? DEFAULT_SFX;
    this.bgmVolume = saved.bgmVolume ?? DEFAULT_BGM;
    this.sfxMuted = !!saved.sfxMuted;
    this.bgmMuted = !!saved.bgmMuted;

    this.ctx = new AudioContextClass();

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.connect(this.ctx.destination);
    this.master = compressor;

    this.sfxBus = this.ctx.createGain();
    this.musicBus = this.ctx.createGain();
    this.sfxBus.connect(compressor);
    this.musicBus.connect(compressor);
    this._applyGains(0); // snap to current volume state immediately

    this._unlock = () => this.unlock();
    window.addEventListener('pointerdown', this._unlock);
    window.addEventListener('keydown', this._unlock);
    window.addEventListener('touchstart', this._unlock);

    this._onSettings = (s) => this.applySettings(s);
    bus.on('settings:audio', this._onSettings);
  },

  // First user gesture: resume the context and let listeners (music) start.
  unlock() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (!this.unlocked) {
      this.unlocked = true;
      this._onUnlocked?.();
    }
  },

  // True only when a sound can actually be heard right now.
  ready() {
    return !!this.ctx && this.ctx.state === 'running';
  },

  now() {
    return this.ctx ? this.ctx.currentTime : 0;
  },

  // Apply a `settings:audio` payload (any subset of the four fields).
  applySettings({ sfxVolume, bgmVolume, sfxMuted, bgmMuted } = {}) {
    if (sfxVolume != null) this.sfxVolume = sfxVolume;
    if (bgmVolume != null) this.bgmVolume = bgmVolume;
    if (sfxMuted != null) this.sfxMuted = sfxMuted;
    if (bgmMuted != null) this.bgmMuted = bgmMuted;
    this._applyGains(0.05);
  },

  applySdkSettings({ muteAudio } = {}) {
    if (muteAudio != null) this.sdkMuteAudio = !!muteAudio;
    this._applyGains(0.05);
  },

  // Push the mirrored volume/mute state onto the bus gains, smoothed.
  _applyGains(timeConstant = 0.05) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const forceMuted = this.sdkMuteAudio;
    const sfx = forceMuted || this.sfxMuted ? 0 : this.sfxVolume;
    const bgm = forceMuted || this.bgmMuted ? 0 : this.bgmVolume;
    if (timeConstant > 0) {
      this.sfxBus.gain.setTargetAtTime(sfx, t, timeConstant);
      this.musicBus.gain.setTargetAtTime(bgm, t, timeConstant);
    } else {
      this.sfxBus.gain.setValueAtTime(sfx, t);
      this.musicBus.gain.setValueAtTime(bgm, t);
    }
  },

  // --- Audio file samples (mp3/wav/ogg) ---------------------------------
  // Decoded AudioBuffers cached by URL. Used for real one-shot SFX (e.g. the
  // sword slash) and for streamed music tracks that carry a `src`.
  samples: Object.create(null),

  // Fetch + decode a sample once; returns the cached AudioBuffer (or null on
  // failure). Decoding works on a suspended context, so this can run pre-unlock.
  async loadSample(url) {
    if (!url) return null;
    if (!this.ctx) this.init();
    if (!this.ctx) return null;
    if (this.samples[url]) return this.samples[url];
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.samples[url] = buf;
      return buf;
    } catch (e) {
      return null;
    }
  },

  getSample(url) {
    return this.samples[url] || null;
  },

  // Play a decoded buffer through `dest`. Returns the source node so loops can be
  // stopped; one-shots can be ignored (they free themselves).
  playBuffer(buffer, dest, { gain = 1, rate = 1, loop = false } = {}) {
    if (!this.ctx || !buffer) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = loop;
    src.playbackRate.value = rate;
    if (gain === 1) {
      src.connect(dest);
    } else {
      const g = this.ctx.createGain();
      g.gain.value = gain;
      src.connect(g);
      g.connect(dest);
    }
    src.start();
    return src;
  },

  // Shared white-noise buffer factory used by several SFX synths.
  noiseBuffer(duration) {
    const ctx = this.ctx;
    if (!ctx) return null;
    const size = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  },

  teardown() {
    if (this._unlock) {
      window.removeEventListener('pointerdown', this._unlock);
      window.removeEventListener('keydown', this._unlock);
      window.removeEventListener('touchstart', this._unlock);
      this._unlock = null;
    }
    if (this._onSettings) {
      bus.off('settings:audio', this._onSettings);
      this._onSettings = null;
    }
    // The context is intentionally kept alive for the app lifetime; we do not
    // close it on teardown so music/SFX survive screen remounts.
  },
};
