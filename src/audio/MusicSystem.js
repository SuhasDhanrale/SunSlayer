import { bus } from '../core/bus.js';
import { AudioEngine } from './AudioEngine.js';
import { TRACKS_BY_ID } from '../data/musicTracks.js';
import config from '../data/config.json';

// MusicSystem — the BGM sequencer ported from BackgroundMusicMock.jsx, routed
// through AudioEngine.musicBus. It keeps its own setInterval look-ahead clock
// (independent of the []-deps rAF loop, per the plan) and crossfades between
// tracks by running up to two scheduler "voices" and ramping their gains.
//
// Systems emit; this listens. It reacts to `screen:enter` (menu music),
// `biome:enter` (in-run track per biome), and the samurai events (slow the
// current track's tempo). It never reaches into the run loop.

const AUDIO_CFG = config.audio || {};
const MENU_TRACK = AUDIO_CFG.menuTrack || 'upper-moon';
const BIOME_TRACKS = AUDIO_CFG.biomeTracks || {};
const CROSSFADE_MS = AUDIO_CFG.crossfadeMs ?? 1500;

const SCHEDULE_AHEAD = 0.15; // seconds of notes to schedule in advance
const LOOKAHEAD_MS = 35; // scheduler tick interval
const STEPS = 32;
const MENU_SCREENS = new Set(['START', 'GAMEOVER', 'WARDROBE', 'LEADERBOARDS', 'ACHIEVEMENTS']);

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export const MusicSystem = {
  voices: [], // { track, gain, step, nextNoteTime, retiring }
  schedulerId: null,
  tempoScale: 1, // live tempo multiplier (samurai slow-mo ramps this)
  tempoTarget: 1,
  pendingTrackId: null, // requested before audio unlocked

  attach() {
    if (typeof window === 'undefined') return () => {};
    AudioEngine.init();

    // Start any track queued before the autoplay unlock.
    AudioEngine._onUnlocked = () => {
      if (this.pendingTrackId) {
        const id = this.pendingTrackId;
        this.pendingTrackId = null;
        this.play(id, { fadeMs: 400 });
      }
    };

    const onScreen = ({ name } = {}) => {
      if (MENU_SCREENS.has(name)) this.play(MENU_TRACK, { fadeMs: CROSSFADE_MS });
      // LOADING / INTRO: silent (own internal music). PLAYING: biome events drive it.
    };

    const onBiome = ({ visual } = {}) => {
      const trackId = BIOME_TRACKS[visual];
      if (trackId) this.play(trackId, { fadeMs: CROSSFADE_MS });
    };

    // Samurai / boss: slow the *current* track instead of swapping it.
    const slow = () => { this.tempoTarget = 0.6; };
    const restore = () => { this.tempoTarget = 1; };

    const onBlur = () => this._stopScheduler();
    const onFocus = () => { if (this.voices.length) this._startScheduler(); };

    bus.on('screen:enter', onScreen);
    bus.on('biome:enter', onBiome);
    bus.on('samurai:appear', slow);
    bus.on('samurai:mercy', restore);
    bus.on('samurai:execution', restore);
    bus.on('samurai:repelled', restore);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      bus.off('screen:enter', onScreen);
      bus.off('biome:enter', onBiome);
      bus.off('samurai:appear', slow);
      bus.off('samurai:mercy', restore);
      bus.off('samurai:execution', restore);
      bus.off('samurai:repelled', restore);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      AudioEngine._onUnlocked = null;
      this._teardownAll();
    };
  },

  // Crossfade to `trackId`. No-op if the newest non-retiring voice is already it.
  play(trackId, { fadeMs = CROSSFADE_MS } = {}) {
    const track = TRACKS_BY_ID[trackId];
    if (!track) return;

    if (!AudioEngine.ctx) {
      this.pendingTrackId = trackId;
      return;
    }
    // Until unlocked the context is silent; remember the request and start on unlock.
    if (!AudioEngine.ready()) {
      this.pendingTrackId = trackId;
      return;
    }

    const current = [...this.voices].reverse().find((v) => !v.retiring);
    if (current && current.track.id === trackId) return;

    const ctx = AudioEngine.ctx;
    const now = ctx.currentTime;

    // Spin up the incoming voice at gain 0 and ramp it in.
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + fadeMs / 1000);
    gain.connect(AudioEngine.musicBus);
    const voice = { track, gain, step: 0, nextNoteTime: now + 0.05, retiring: false, sampleSrc: null };

    // Ramp out everything currently playing.
    this.voices.forEach((v) => this._retire(v, fadeMs));

    this.voices.push(voice);

    // Cap concurrent voices at 2 — snap-retire the oldest so fades never stack.
    while (this.voices.length > 2) {
      const oldest = this.voices.shift();
      this._stopSample(oldest);
      try { oldest.gain.disconnect(); } catch {}
    }

    // A track with a `src` streams the looped file; otherwise run the sequencer.
    if (track.src) this._startSample(voice);
    this._syncScheduler();
  },

  // Stream a looped audio file for a `src` voice through its crossfade gain.
  async _startSample(voice) {
    const buf = await AudioEngine.loadSample(voice.track.src);
    // The voice may have been retired while the file was decoding.
    if (!buf || voice.retiring || !this.voices.includes(voice)) return;
    voice.sampleSrc = AudioEngine.playBuffer(buf, voice.gain, { loop: true });
  },

  _stopSample(voice) {
    if (voice.sampleSrc) {
      try { voice.sampleSrc.stop(); } catch {}
      voice.sampleSrc = null;
    }
  },

  // Run the look-ahead scheduler only while a synth (non-`src`) voice is alive.
  _syncScheduler() {
    if (this.voices.some((v) => !v.track.src)) this._startScheduler();
    else this._stopScheduler();
  },

  _retire(voice, fadeMs) {
    if (voice.retiring) return;
    voice.retiring = true;
    const ctx = AudioEngine.ctx;
    const now = ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
    setTimeout(() => {
      this.voices = this.voices.filter((v) => v !== voice);
      this._stopSample(voice);
      try { voice.gain.disconnect(); } catch {}
      this._syncScheduler();
    }, fadeMs + 300);
  },

  _startScheduler() {
    if (this.schedulerId != null) return;
    this.schedulerId = setInterval(() => this._tick(), LOOKAHEAD_MS);
  },

  _stopScheduler() {
    if (this.schedulerId != null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  },

  _tick() {
    const ctx = AudioEngine.ctx;
    if (!ctx || ctx.state !== 'running') return;

    // Ease the live tempo toward its target (smooth samurai slow-mo).
    this.tempoScale += (this.tempoTarget - this.tempoScale) * 0.08;

    const horizon = ctx.currentTime + SCHEDULE_AHEAD;
    for (const voice of this.voices) {
      if (voice.track.src) continue; // streamed file voices have no notes to schedule
      const stepDur = 60.0 / (voice.track.baseBpm * this.tempoScale) / 4.0;
      while (voice.nextNoteTime < horizon) {
        this._scheduleStep(voice, voice.step, voice.nextNoteTime);
        voice.nextNoteTime += stepDur;
        voice.step = (voice.step + 1) % STEPS;
      }
    }
  },

  _scheduleStep(voice, step, time) {
    const track = voice.track;
    const dest = voice.gain;

    if (track.percussion) {
      ['low', 'high', 'accent'].forEach((kind) => {
        if (track.percussion[kind] && track.percussion[kind].includes(step)) {
          this._playPercussion(dest, kind, time, track);
        }
      });
    }

    const stepDur = 60.0 / (voice.track.baseBpm * this.tempoScale) / 4.0;
    ['bass', 'mid', 'lead'].forEach((kind) => {
      track.notes[kind]
        .filter((n) => n.step === step)
        .forEach((note) => {
          const durSec = note.dur * stepDur * 0.95;
          this._playCleanNote(dest, note.pitch, time, durSec, kind, track);
        });
    });
  },

  // The single shared synth voice — every track uses this so they cohere.
  _playCleanNote(dest, pitch, time, duration, voice, trackDef) {
    const ctx = AudioEngine.ctx;
    const freq = midiToFreq(pitch);
    const noteGain = ctx.createGain();

    let peakVolume = 0.12;
    if (voice === 'bass') peakVolume = 0.18;
    if (voice === 'mid') peakVolume = 0.08;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, time);

    const g1 = ctx.createGain(); g1.gain.value = 0.6;
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    const g3 = ctx.createGain(); g3.gain.value = 0.1;
    osc1.connect(g1); osc2.connect(g2); osc3.connect(g3);
    g1.connect(noteGain); g2.connect(noteGain); g3.connect(noteGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(trackDef.filterFreq, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + duration + 0.5);
    noteGain.connect(filter);
    filter.connect(dest);

    const attack = 0.015;
    const release = 0.2;
    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(peakVolume, time + attack);
    const sustainLevel = peakVolume * 0.4;
    noteGain.gain.exponentialRampToValueAtTime(sustainLevel, time + attack + 0.3);
    noteGain.gain.setValueAtTime(sustainLevel, time + duration);
    noteGain.gain.linearRampToValueAtTime(0.0001, time + duration + release);
    noteGain.gain.linearRampToValueAtTime(0, time + duration + release + 0.05);

    const stopTime = time + duration + release + 0.1;
    osc1.start(time); osc2.start(time); osc3.start(time);
    osc1.stop(stopTime); osc2.stop(stopTime); osc3.stop(stopTime);
  },

  _playPercussion(dest, kind, time, trackDef) {
    const ctx = AudioEngine.ctx;
    const hitGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(kind === 'high' ? 2200 : 700, time);
    hitGain.connect(filter);
    filter.connect(dest);

    if (kind === 'low') {
      const body = ctx.createOscillator();
      body.type = 'sine';
      body.frequency.setValueAtTime(125, time);
      body.frequency.exponentialRampToValueAtTime(52, time + 0.16);
      body.connect(hitGain);
      hitGain.gain.setValueAtTime(0.22, time);
      hitGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
      body.start(time);
      body.stop(time + 0.3);
      return;
    }

    const length = kind === 'accent' ? 0.22 : 0.075;
    const noiseBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noise.length; i += 1) noise[i] = (Math.random() * 2 - 1) * (1 - i / noise.length);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.connect(hitGain);
    filter.type = kind === 'accent' ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(kind === 'accent' ? 950 : 1800, time);
    hitGain.gain.setValueAtTime(kind === 'accent' ? 0.13 : 0.055, time);
    hitGain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    source.start(time);
    source.stop(time + length);
  },

  _teardownAll() {
    this._stopScheduler();
    this.voices.forEach((v) => { this._stopSample(v); try { v.gain.disconnect(); } catch {} });
    this.voices = [];
    this.tempoScale = 1;
    this.tempoTarget = 1;
    this.pendingTrackId = null;
  },
};
