import React, { useEffect, useRef, useState } from 'react';

// A mock screen to synthesize and tweak sound effects procedurally without loading assets.
// It uses the Web Audio API and focuses on deep, organic, non-metallic, low-pitched sounds.

export const SoundEffectsMock = () => {
  const audioCtxRef = useRef(null);
  const [status, setStatus] = useState('Click any button to initialize audio');

  const ensureContext = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
        setStatus('Audio Context Running');
      } else {
        setStatus('Web Audio API not supported');
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Helper to create a noise buffer
  const getNoiseBuffer = (ctx, duration) => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  // 1. Yokai Pop: Deep, resonant, hollow thwomp
  const playYokaiPop = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    // Pitch sweep: starts higher, dips, then pops slightly up for audibility
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.05);
    osc.frequency.linearRampToValueAtTime(250, t + 0.1);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.2);
  };

  // 2. Arrow Pop: Quick woody tock + fiery swoosh
  const playArrowPop = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // Tock
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);

    // Fiery swoosh
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx, 0.4);
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
    noiseGain.connect(ctx.destination);
    noise.start(t);
  };

  // 3. Bamboo Slice: Deep woody thwack + low air swoosh
  const playBambooSlice = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // Thwack (oscillator)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);

    // Swoosh (filtered noise)
    const noiseDuration = 0.25;
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx, noiseDuration);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + noiseDuration);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDuration);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  };

  // 4. Yokai Slice: Deep, juicy organic splat
  const playYokaiSlice = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // FM Synthesis for "squish"
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const mainGain = ctx.createGain();
    
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(90, t);
    carrier.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(50, t);
    
    modGain.gain.setValueAtTime(300, t); // Modulation depth
    modGain.gain.exponentialRampToValueAtTime(10, t + 0.2);
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    
    mainGain.gain.setValueAtTime(0.6, t);
    mainGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    
    carrier.connect(mainGain);
    mainGain.connect(ctx.destination);
    
    carrier.start(t);
    modulator.start(t);
    carrier.stop(t + 0.3);
    modulator.stop(t + 0.3);
  };

  // 5. Rope Slice: Low, thick thrum / snapping tension
  const playRopeSlice = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.3);
    
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.5);
  };

  // 6. Spike Slice: Heavy, dull thud of thick rock/bamboo (no metal)
  const playSpikeSlice = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // Thud component
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    oscGain.gain.setValueAtTime(1.0, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);

    // Crunch component (low-pass noise)
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx, 0.15);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  };

  // 7. TNT Boom: Massive explosion with sharp crack and deep tail
  const playTNTBoom = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // Sharp crack (initial impact)
    const crackOsc = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crackOsc.type = 'square';
    crackOsc.frequency.setValueAtTime(150, t);
    crackOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    crackGain.gain.setValueAtTime(0.5, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    crackOsc.connect(crackGain);
    crackGain.connect(ctx.destination);
    crackOsc.start(t);
    crackOsc.stop(t + 0.25);

    // Deep Boom Tail
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(60, t);
    boomOsc.frequency.exponentialRampToValueAtTime(20, t + 1.2);
    boomGain.gain.setValueAtTime(0.6, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    boomOsc.connect(boomGain);
    boomGain.connect(ctx.destination);
    boomOsc.start(t);
    boomOsc.stop(t + 1.6);

    // Muffled explosion noise
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx, 1.4);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 1.4);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  };

  // 8. UI Clicks: Soft, muffled tap
  const playUIClick = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);
    
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.1);
  };

  // 9. Golden Yokai Spawn: Glittery chimes sound
  const playGoldenSpawn = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // High pitched magical arpeggio (glittery chimes)
    const freqs = [800, 1000, 1200, 1500, 2000, 2400];
    
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);
      
      // Quick chime envelope
      gain.gain.setValueAtTime(0, t + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.5);
    });
  };

  // 10. Golden Yokai Burst: Deep echoing resonance
  const playGoldenBurst = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // A burst of warm frequencies spreading out
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
      gain.connect(ctx.destination);
      
      osc.start(t);
      osc.stop(t + 1.0);
    });

    // Muffled whoosh
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx, 0.6);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.Q.setValueAtTime(1.5, t);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  };

  // 11. Golden Yokai Idle: Subtle glittery chimes loop (approx 3 seconds)
  const playGoldenIdle = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // Play a sequence of very soft, high chimes
    const numChimes = 15;
    for (let i = 0; i < numChimes; i++) {
      const freq = 1200 + Math.random() * 1200; // 1200Hz to 2400Hz
      const delay = i * 0.2 + (Math.random() * 0.1); // spread over ~3 seconds
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);
      
      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.03, t + delay + 0.05); // very soft
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(t + delay);
      osc.stop(t + delay + 0.4);
    }
  };

  // 12. Fiery Arrow Idle: Continuous crackling fire (approx 3 seconds)
  const playArrowIdle = () => {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // Low roar (lowpass noise)
    const roar = ctx.createBufferSource();
    roar.buffer = getNoiseBuffer(ctx, 3.0);
    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(250, t); // lower frequency for softer sound
    
    const roarGain = ctx.createGain();
    roarGain.gain.setValueAtTime(0, t);
    roarGain.gain.linearRampToValueAtTime(0.08, t + 0.2); // much quieter roar
    roarGain.gain.setValueAtTime(0.08, t + 2.8);
    roarGain.gain.linearRampToValueAtTime(0.001, t + 3.0);
    
    roar.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(ctx.destination);
    roar.start(t);

    // Crackles (highpass noise modulated by LFO)
    const crackle = ctx.createBufferSource();
    crackle.buffer = getNoiseBuffer(ctx, 3.0);
    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.setValueAtTime(2000, t);
    
    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0, t);
    
    // Add an LFO to make the crackle flicker/sputter
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(8, t); // slower flicker (8 flickers per second instead of 12)
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.5, t);
    lfo.connect(lfoGain);
    lfoGain.connect(crackleGain.gain);
    lfo.start(t);
    lfo.stop(t + 3.0);

    // Envelope for crackle
    const masterCrackleGain = ctx.createGain();
    masterCrackleGain.gain.setValueAtTime(0, t);
    masterCrackleGain.gain.linearRampToValueAtTime(0.12, t + 0.2); // much quieter crackle
    masterCrackleGain.gain.setValueAtTime(0.12, t + 2.8);
    masterCrackleGain.gain.linearRampToValueAtTime(0.001, t + 3.0);
    
    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(masterCrackleGain);
    masterCrackleGain.connect(ctx.destination);
    crackle.start(t);
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const Button = ({ label, onClick }) => (
    <button
      onClick={onClick}
      className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded shadow-lg transition-colors border border-slate-600 active:bg-slate-500"
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-black mb-2 tracking-wider text-white">Sound Effects Lab</h1>
      <p className="text-slate-400 mb-8 text-center max-w-xl">
        Procedurally synthesized sound effects focusing on deep, woody, organic, and non-metallic textures. 
        Adjust system volume before testing.
      </p>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-8 text-sm font-mono text-emerald-400">
        Status: {status}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        <Button label="👹 Yokai Pop" onClick={playYokaiPop} />
        <Button label="🏹 Arrow Pop" onClick={playArrowPop} />
        <Button label="🎋 Bamboo Slice" onClick={playBambooSlice} />
        
        <Button label="👺 Yokai Slice" onClick={playYokaiSlice} />
        <Button label="〰️ Rope Slice" onClick={playRopeSlice} />
        <Button label="🪨 Spike Slice" onClick={playSpikeSlice} />
        
        <Button label="🧨 TNT Boom" onClick={playTNTBoom} />
        <Button label="👆 UI Click" onClick={playUIClick} />
        <div className="hidden lg:block"></div> {/* Spacer */}

        <Button label="✨ Golden Yokai Spawn" onClick={playGoldenSpawn} />
        <Button label="🌟 Golden Yokai Burst" onClick={playGoldenBurst} />
        <Button label="💫 Golden Yokai Idle" onClick={playGoldenIdle} />

        <Button label="🔥 Fiery Arrow Idle" onClick={playArrowIdle} />
        <div className="hidden lg:block"></div> {/* Spacer */}
        <div className="hidden lg:block"></div> {/* Spacer */}
      </div>
    </div>
  );
};
