import { bus } from '../core/bus.js';

// Small procedural feedback layer. It needs no asset preload and stays silent
// when Web Audio is unavailable or has not been unlocked by a user gesture.
export const SoundSystem = {
  attach() {
    if (typeof window === 'undefined') return () => {};
    let context = null;

    const ensureContext = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      if (!context) context = new AudioContext();
      if (context.state === 'suspended') context.resume().catch(() => {});
      return context;
    };

    const playTone = (frequency, duration, volume, type = 'triangle') => {
      const ctx = ensureContext();
      if (!ctx || ctx.state !== 'running') return;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    };

    const onHit = ({ tier = 1 }) => playTone(150 + tier * 45, 0.045 + tier * 0.008, 0.012 + tier * 0.004);
    const onTier = ({ tier = 1 }) => playTone(260 + tier * 90, 0.11, 0.018 + tier * 0.004, 'sine');
    const onCoin = () => playTone(620, 0.07, 0.018, 'sine');
    // Per-swipe multi-cut burst (DESIGN §6): one brighter tone whose pitch rises
    // with the cut count — distinct from the per-hit blip, fires once per swipe.
    const onMultiCut = ({ count = 2 }) => playTone(440 + Math.min(count, 6) * 75, 0.16, 0.024, 'sine');
    const unlock = () => ensureContext();

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    bus.on('combo:hit', onHit);
    bus.on('combo:tier', onTier);
    bus.on('coin:collected', onCoin);
    bus.on('combo:multicut', onMultiCut);

    return () => {
      bus.off('combo:hit', onHit);
      bus.off('combo:tier', onTier);
      bus.off('coin:collected', onCoin);
      bus.off('combo:multicut', onMultiCut);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      context?.close().catch(() => {});
    };
  },
};
