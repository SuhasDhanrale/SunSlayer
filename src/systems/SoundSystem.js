import { bus } from '../core/bus.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import config from '../data/config.json';
import slashUrl from '../../Assets/Slash.mp3';

// Procedural SFX layer. The synth voices are ported verbatim from the Sound
// Effects Lab mock (SoundEffectsMock.jsx) — deep, woody, non-metallic textures —
// but routed through AudioEngine.sfxBus instead of straight to ctx.destination,
// so the Settings volume/mute applies and the master compressor glues them.
//
// Systems emit; this listens (bus discipline). No React, no asset preload.

const THROTTLE_MS = config.audio?.sfxThrottleMs ?? 30;

// --- Ported synth voices ---------------------------------------------------
// Each takes (ctx, dest) where dest is the sfxBus GainNode.

// 1. Yokai Pop: deep, resonant, hollow thwomp
function playYokaiPop(ctx, dest) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.05);
  osc.frequency.linearRampToValueAtTime(250, t + 0.1);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.6, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.2);
}

// 2. Arrow Pop: quick woody tock + fiery swoosh
function playArrowPop(ctx, dest) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
  gain.gain.setValueAtTime(0.6, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.1);

  const noise = ctx.createBufferSource();
  noise.buffer = AudioEngine.noiseBuffer(0.4);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, t);
  filter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
  filter.Q.setValueAtTime(1.5, t);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(t);
}

// 3. Bamboo Slice: deep woody thwack + low air swoosh
function playBambooSlice(ctx, dest) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
  oscGain.gain.setValueAtTime(0.6, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(oscGain);
  oscGain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.2);

  const noiseDuration = 0.25;
  const noise = ctx.createBufferSource();
  noise.buffer = AudioEngine.noiseBuffer(noiseDuration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, t);
  filter.frequency.exponentialRampToValueAtTime(200, t + noiseDuration);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDuration);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(t);
}

// 4. Yokai Slice: deep, juicy organic splat (FM squish)
function playYokaiSlice(ctx, dest) {
  const t = ctx.currentTime;
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();
  const mainGain = ctx.createGain();
  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(90, t);
  carrier.frequency.exponentialRampToValueAtTime(40, t + 0.2);
  modulator.type = 'sine';
  modulator.frequency.setValueAtTime(50, t);
  modGain.gain.setValueAtTime(300, t);
  modGain.gain.exponentialRampToValueAtTime(10, t + 0.2);
  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  mainGain.gain.setValueAtTime(0.6, t);
  mainGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  carrier.connect(mainGain);
  mainGain.connect(dest);
  carrier.start(t);
  modulator.start(t);
  carrier.stop(t + 0.3);
  modulator.stop(t + 0.3);
}

// 5. Rope Slice: low, thick thrum / snapping tension
function playRopeSlice(ctx, dest) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(70, t);
  osc.frequency.linearRampToValueAtTime(50, t + 0.3);
  gain.gain.setValueAtTime(1.0, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.5);
}

// 6. Spike Slice: heavy, dull thud of thick rock/bamboo (no metal)
function playSpikeSlice(ctx, dest) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
  oscGain.gain.setValueAtTime(1.0, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(oscGain);
  oscGain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.25);

  const noise = ctx.createBufferSource();
  noise.buffer = AudioEngine.noiseBuffer(0.15);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, t);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(t);
}

// 7. TNT Boom: massive explosion with sharp crack and deep tail
function playTNTBoom(ctx, dest) {
  const t = ctx.currentTime;
  const crackOsc = ctx.createOscillator();
  const crackGain = ctx.createGain();
  crackOsc.type = 'square';
  crackOsc.frequency.setValueAtTime(150, t);
  crackOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
  crackGain.gain.setValueAtTime(0.5, t);
  crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  crackOsc.connect(crackGain);
  crackGain.connect(dest);
  crackOsc.start(t);
  crackOsc.stop(t + 0.25);

  const boomOsc = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boomOsc.type = 'sine';
  boomOsc.frequency.setValueAtTime(60, t);
  boomOsc.frequency.exponentialRampToValueAtTime(20, t + 1.2);
  boomGain.gain.setValueAtTime(0.6, t);
  boomGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  boomOsc.connect(boomGain);
  boomGain.connect(dest);
  boomOsc.start(t);
  boomOsc.stop(t + 1.6);

  const noise = ctx.createBufferSource();
  noise.buffer = AudioEngine.noiseBuffer(1.4);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, t);
  filter.frequency.exponentialRampToValueAtTime(50, t + 1.4);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.5, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(t);
}

// 8. UI Click: soft, muffled tap
function playUIClick(ctx, dest) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.1);
}

// 9. Golden Yokai Spawn: glittery chime arpeggio
function playGoldenSpawn(ctx, dest) {
  const t = ctx.currentTime;
  const freqs = [800, 1000, 1200, 1500, 2000, 2400];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.04);
    gain.gain.setValueAtTime(0, t + i * 0.04);
    gain.gain.linearRampToValueAtTime(0.15, t + i * 0.04 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.4);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t + i * 0.04);
    osc.stop(t + i * 0.04 + 0.5);
  });
}

// 10. Golden Yokai Burst: deep echoing resonance + muffled whoosh
function playGoldenBurst(ctx, dest) {
  const t = ctx.currentTime;
  const freqs = [100, 150, 200, 250];
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.8);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 1.0);
  });

  const noise = ctx.createBufferSource();
  noise.buffer = AudioEngine.noiseBuffer(0.6);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, t);
  filter.Q.setValueAtTime(1.5, t);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(t);
}

// --- Event → SFX routing ---------------------------------------------------

// combo:hit carries `source` (the cut material) — route material sounds off
// that one event rather than scattering new emits.
const SLICE_BY_SOURCE = {
  bamboo: playBambooSlice,
  'thick-bamboo': playBambooSlice,
  vine: playRopeSlice,
  rope: playRopeSlice,
  yokai: playYokaiSlice,
  obstacle: playSpikeSlice,
  spike: playSpikeSlice,
  boulder: playSpikeSlice,
  ronin: playSpikeSlice,
};
// `golden` hits get their own scrub tone via golden:hit, and `tnt` gets a dedicated
// boom via trap:tnt (emitted in CombatSystem.explode) — don't double up here.
const SLICE_SKIP = new Set(['golden', 'tnt']);

export const SoundSystem = {
  attach() {
    if (typeof window === 'undefined') return () => {};
    AudioEngine.init();
    // Preload the sword-slash sample so slices can play the real recording.
    AudioEngine.loadSample(slashUrl);

    // Per-voice throttle so a multi-cut swipe doesn't stack identical SFX into
    // clipping. Keyed by a logical sound name, not the source object.
    const lastPlayed = Object.create(null);
    const gate = (name) => {
      const now = AudioEngine.now() * 1000;
      if (lastPlayed[name] != null && now - lastPlayed[name] < THROTTLE_MS) return false;
      lastPlayed[name] = now;
      return true;
    };

    // play(name, fn) — throttle + readiness guard, then render the voice.
    const play = (name, fn) => {
      if (!AudioEngine.ready()) return;
      if (!gate(name)) return;
      fn(AudioEngine.ctx, AudioEngine.sfxBus);
    };

    // Synth voices with no ported equivalent — small retuned tones.
    const playTone = (frequency, duration, volume, type = 'triangle') => {
      const ctx = AudioEngine.ctx;
      const dest = AudioEngine.sfxBus;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + duration);
    };

    // --- Handlers ---
    // Slicing anything plays the real sword-slash recording (with a touch of
    // random pitch so repeats don't sound identical). Falls back to the ported
    // synth voice until the sample finishes decoding.
    const onHit = ({ source = 'slice' } = {}) => {
      if (SLICE_SKIP.has(source)) return;
      if (!AudioEngine.ready()) return;
      if (!gate(`slice:${source}`)) return;
      const buf = AudioEngine.getSample(slashUrl);
      if (buf) {
        AudioEngine.playBuffer(buf, AudioEngine.sfxBus, { gain: 0.9, rate: 0.94 + Math.random() * 0.12 });
      } else {
        (SLICE_BY_SOURCE[source] || playBambooSlice)(AudioEngine.ctx, AudioEngine.sfxBus);
      }
    };
    const onTier = ({ tier = 1 } = {}) =>
      play('tier', () => playTone(260 + tier * 90, 0.11, 0.05, 'sine'));
    const onMultiCut = ({ count = 2 } = {}) =>
      play('multicut', () => playTone(440 + Math.min(count, 6) * 75, 0.16, 0.06, 'sine'));
    const onCoin = () => play('coin', () => playTone(620, 0.07, 0.06, 'sine'));

    const onGoldenHit = () => play('golden-hit', playGoldenSpawn);
    const onGoldenBurst = () => play('golden-burst', playGoldenBurst);
    const onGoldenSpawn = () => play('golden-spawn', playGoldenSpawn);

    const onSamuraiAppear = () => play('sam-appear', () => playTone(120, 0.28, 0.12, 'sawtooth'));
    const onSamuraiMercy = () => play('sam-mercy', () => playTone(190, 0.35, 0.14, 'square'));
    const onSamuraiExecution = () => play('sam-exec', () => playTone(70, 0.7, 0.18, 'sawtooth'));
    const onSamuraiRepelled = () => play('sam-repel', () => playTone(520, 0.22, 0.1, 'triangle'));

    const onArrowTrapCut = () => play('arrow-cut', playArrowPop);
    const onArrowDeflect = () => play('arrow-deflect', () => playTone(760, 0.055, 0.09, 'square'));
    const onArrowHit = () => play('arrow-hit', () => playTone(82, 0.32, 0.16, 'sawtooth'));
    const onArrowCleared = () => play('arrow-clear', () => playTone(510, 0.14, 0.08, 'triangle'));

    const onMonkDeath = () => play('death', () => playTone(55, 0.6, 0.2, 'sawtooth'));
    const onUiClick = () => play('ui', playUIClick);
    const onTnt = () => play('tnt', playTNTBoom);

    bus.on('combo:hit', onHit);
    bus.on('combo:tier', onTier);
    bus.on('combo:multicut', onMultiCut);
    bus.on('coin:collected', onCoin);
    bus.on('golden:hit', onGoldenHit);
    bus.on('golden:burst', onGoldenBurst);
    bus.on('golden:spawn', onGoldenSpawn);
    bus.on('samurai:appear', onSamuraiAppear);
    bus.on('samurai:mercy', onSamuraiMercy);
    bus.on('samurai:execution', onSamuraiExecution);
    bus.on('samurai:repelled', onSamuraiRepelled);
    bus.on('arrow:trap-cut', onArrowTrapCut);
    bus.on('arrow:deflect', onArrowDeflect);
    bus.on('arrow:hit', onArrowHit);
    bus.on('arrow:burst-cleared', onArrowCleared);
    bus.on('monk:death', onMonkDeath);
    bus.on('ui:click', onUiClick);
    bus.on('trap:tnt', onTnt);

    return () => {
      bus.off('combo:hit', onHit);
      bus.off('combo:tier', onTier);
      bus.off('combo:multicut', onMultiCut);
      bus.off('coin:collected', onCoin);
      bus.off('golden:hit', onGoldenHit);
      bus.off('golden:burst', onGoldenBurst);
      bus.off('golden:spawn', onGoldenSpawn);
      bus.off('samurai:appear', onSamuraiAppear);
      bus.off('samurai:mercy', onSamuraiMercy);
      bus.off('samurai:execution', onSamuraiExecution);
      bus.off('samurai:repelled', onSamuraiRepelled);
      bus.off('arrow:trap-cut', onArrowTrapCut);
      bus.off('arrow:deflect', onArrowDeflect);
      bus.off('arrow:hit', onArrowHit);
      bus.off('arrow:burst-cleared', onArrowCleared);
      bus.off('monk:death', onMonkDeath);
      bus.off('ui:click', onUiClick);
      bus.off('trap:tnt', onTnt);
    };
  },
};
