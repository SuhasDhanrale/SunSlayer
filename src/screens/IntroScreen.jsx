import React, { useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine.js';
import { getCharacter } from '../data/characters.js';
import { getFabricPattern } from '../renderer/characters/slayerBody.js';
import { Persistence } from '../core/Persistence.js';

// Cinematic intro ported faithfully from the "Cinematic Intro" mock
// (IntroSequenceMock.jsx): a ~20s authored canvas + fully-synthesized Web Audio opening —
// rainy bamboo shrine, the demon's red cat-slit eyes, the curse/strike on the sister, the
// despair beat and shrine-glow quest text ("Reach mountain Sagiri..."), sealing the sister
// into the box on the monk's back, then the fade to the volcanic Mountain Sagiri. Every
// sound (rain, thunder, horn, strike, despair music, volcano) is procedural — no audio
// files. It plays on boot after the loading screen, then hands off to the home screen.
//
// Shell changes vs the mock: the audio + timeline auto-start on mount (the mock gated them
// behind a "Play" button to satisfy the browser autoplay gesture); a one-time pointer/key
// listener resumes a suspended AudioContext so sound joins on first input if autoplay was
// blocked; a Skip button and the natural end both advance to the home screen.

export function IntroScreen({ setGameState }) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const rainGainRef = useRef(null);
  const volcanoGainRef = useRef(null);
  const loopingAudioNodesRef = useRef(new Set());

  // Advance to the home screen exactly once (Skip button or the natural end of the run).
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setGameState('START');
  };

  const audioTriggersRef = useRef({
    rain: false,
    horn: false,
    vacuum: false,
    strike: false,
    despairMusic: false,
    bgThunder1: false,
    bgThunder2: false,
    volcano: false
  });

  const trackLoopingAudioNode = (node) => {
    if (node) loopingAudioNodesRef.current.add(node);
    return node;
  };

  const cleanupIntroAudio = () => {
    for (const node of loopingAudioNodesRef.current) {
      try { node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    }
    loopingAudioNodesRef.current.clear();

    if (masterGainRef.current) {
      const ctx = audioCtxRef.current;
      try {
        if (ctx) {
          masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
          masterGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
        }
      } catch {}
      try { masterGainRef.current.disconnect(); } catch {}
    }

    masterGainRef.current = null;
    rainGainRef.current = null;
    volcanoGainRef.current = null;
    audioCtxRef.current = null;
  };

  // --- AUDIO SYNTHESIS FUNCTIONS ---
  const playRain = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const dest = masterGainRef.current;
    
    // Smooth brown/pink noise hybrid for realistic rain patter
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Compensate gain
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;
    
    // Filter to isolate the "patter" frequencies
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;
    
    // LFO for wind gusts
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Very slow gust
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.15; // Low intensity ambient
    lfoGain.connect(gainNode.gain); // Modulate gain
    
    noiseSrc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(dest);
    
    noiseSrc.start();
    lfo.start();
    trackLoopingAudioNode(noiseSrc);
    trackLoopingAudioNode(lfo);
    return gainNode;
  };

  const playThunder = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const dest = masterGainRef.current;
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-4 * i / bufferSize);
    const noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1000;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.7, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    noiseSrc.connect(filter); filter.connect(gainNode); gainNode.connect(dest);
    noiseSrc.start();
  };

  const playAlarmingHorn = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const dest = masterGainRef.current;
    const gainNode = ctx.createGain();
    
    // Slow swell in and out for a massive distant horn
    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.5); // Faster swell
    gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 4.0); // Completely faded out by the time the vacuum hits
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 1.5);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 4.0);
    
    // Delay for blending
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.5;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    
    // Thick detuned cluster
    [55, 55.4, 54.6, 110, 110.8].forEach(freq => {
        const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = freq;
        osc.connect(filter); osc.start(); osc.stop(ctx.currentTime + 4.5); // Stop oscillators sooner
    });
    
    filter.connect(gainNode);
    gainNode.connect(dest);
    
    // Echo routing
    gainNode.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(dest);
  };

  const playThunderStrike = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const dest = masterGainRef.current;
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-3 * i / ctx.sampleRate);
    const noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuffer;
    
    // Sub-bass drop (808 style)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(60, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.0);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(1.0, ctx.currentTime);
    subGain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    subOsc.connect(subGain); subGain.connect(dest);
    subOsc.start(); subOsc.stop(ctx.currentTime + 2.0);
    
    // Lowpass filter starting lower to avoid 'static' harshness
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(1500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.0);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime); // Balanced strike intensity
    gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 3.5);
    
    // Big Echo
    const delay = ctx.createDelay(); delay.delayTime.value = 0.35;
    const feedback = ctx.createGain(); feedback.gain.value = 0.5; // Longer feedback tail
    
    noiseSrc.connect(filter); filter.connect(gainNode); gainNode.connect(dest);
    gainNode.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(dest);
    noiseSrc.start();
  };

  const playBgThunder = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const dest = masterGainRef.current;
    
    // Function to create a distant, muffled thunder rumble
    const createCrack = (timeOffset, intensity, duration, filterStart) => {
        const bufferSize = ctx.sampleRate * Math.ceil(duration);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-2 * i / ctx.sampleRate);
        }
        const noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuffer;
        
        // Very low filter for distant thunder
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass'; 
        filter.frequency.setValueAtTime(filterStart, ctx.currentTime + timeOffset);
        filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + timeOffset + 1.5);
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime); 
        gainNode.gain.setValueAtTime(intensity, ctx.currentTime + timeOffset);
        gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + timeOffset + duration);
        
        noiseSrc.connect(filter); filter.connect(gainNode); gainNode.connect(dest);
        noiseSrc.start(ctx.currentTime + timeOffset);
    };
    
    // Distant rhythm: "ta-tad tad taaaad tad" (lower intensities)
    createCrack(0.0, 0.2, 2.0, 500);   // "ta"
    createCrack(0.2, 0.15, 2.0, 400);  // "-tad"
    createCrack(0.8, 0.1, 2.0, 300);   // "tad"
    createCrack(1.4, 0.25, 3.5, 600);  // "taaaad"
    createCrack(2.2, 0.08, 2.0, 200);  // "tad"
  };

  const playDespairMusic = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const dest = masterGainRef.current;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 3.0); // Slower, lower intensity swell
    gainNode.gain.setTargetAtTime(0.01, ctx.currentTime + 9.0, 3.0);
    
    // Triangle wave gives a softer, warmer, more acoustic tone than pure sine
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600;
    
    // Breathy noise layer for acoustic feel
    const breathSize = ctx.sampleRate * 2;
    const breathBuffer = ctx.createBuffer(1, breathSize, ctx.sampleRate);
    const breathData = breathBuffer.getChannelData(0);
    for (let i = 0; i < breathSize; i++) breathData[i] = Math.random() * 2 - 1;
    
    [293.66, 349.23, 440.0, 587.33].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
        const noteGain = ctx.createGain(); noteGain.gain.setValueAtTime(0.01, ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.5 + idx * 0.8);
        
        // Breath layer
        const breathSrc = ctx.createBufferSource(); breathSrc.buffer = breathBuffer; breathSrc.loop = true;
        const breathFilter = ctx.createBiquadFilter(); breathFilter.type = 'bandpass'; 
        breathFilter.frequency.value = freq * 2; breathFilter.Q.value = 2; // Harmonics
        const breathGain = ctx.createGain(); breathGain.gain.value = 0.15; // Low breath amount
        breathSrc.connect(breathFilter); breathFilter.connect(breathGain); breathGain.connect(noteGain);
        breathSrc.start(); breathSrc.stop(ctx.currentTime + 16.0);
        trackLoopingAudioNode(breathSrc);
        
        osc.connect(noteGain); noteGain.connect(filter); osc.start(); osc.stop(ctx.currentTime + 16.0);
    });
    
    // Blooming Reverb/Delay
    const delay = ctx.createDelay(); delay.delayTime.value = 0.5;
    const feedback = ctx.createGain(); 
    feedback.gain.setValueAtTime(0.1, ctx.currentTime);
    feedback.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 8.0); // Blooms over 8 seconds
    
    filter.connect(gainNode); gainNode.connect(dest);
    gainNode.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(dest);
  };

  const playVolcano = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const dest = masterGainRef.current;
    const bufferSize = ctx.sampleRate * 5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i]; output[i] *= 3.5;
    }
    const noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuffer; noiseSrc.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(400, ctx.currentTime + 2.0);
    const gainNode = ctx.createGain(); gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.0);
    noiseSrc.connect(filter); filter.connect(gainNode); gainNode.connect(dest);
    noiseSrc.start();
    trackLoopingAudioNode(noiseSrc);
    return gainNode;
  };

  const stateRef = useRef({
    time: 0,
    sisterY: 0,
    slayerY: 0,
    eyesAlpha: 0,
    glowAlpha: 0,
    fadeAlpha: 0,
    textProgress: 0,
    lightningAlpha: 0,
    lastLightning: 0,
    shake: 0,
    shrineGlow: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    audioTriggersRef.current = {
      rain: false,
      horn: false,
      vacuum: false,
      strike: false,
      despairMusic: false,
      bgThunder1: false,
      bgThunder2: false,
      volcano: false
    };

    // --- AUDIO BOOTSTRAP (auto-start; the mock did this behind a "Play" button) ---
    AudioEngine.init();
    const audioCtx = AudioEngine.ctx;
    audioCtxRef.current = audioCtx;

    if (audioCtx && AudioEngine.musicBus) {
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(AudioEngine.musicBus);
      masterGainRef.current = masterGain;
    }

    // Start immediately; if the browser blocks autoplay (no prior gesture) the context is
    // suspended — resume it on the first pointer/key input so the soundtrack joins in. The
    // visual timeline always runs regardless.
    if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
    const unlockAudio = () => AudioEngine.unlock();
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Recolor the bespoke narrative slayer to the equipped warden — its wagara
    // fabric, hair, and accent — so the intro shows the player's chosen character
    // instead of the old fixed green-checker look.
    const char = getCharacter(Persistence.data.equippedCharacterId);
    const fabricPattern = getFabricPattern(ctx, char.patternType);

    const resize = () => {
      canvas.width = Math.round((canvas.clientWidth || 800) * dpr);
      canvas.height = Math.round((canvas.clientHeight || 600) * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // --- PATTERNS ---
    const patterns = {};
    const p1 = document.createElement('canvas');
    p1.width = 12; p1.height = 12;
    const c1 = p1.getContext('2d');
    c1.fillStyle = '#065f46'; c1.fillRect(0,0,12,12);
    c1.fillStyle = '#f1f5f9'; c1.fillRect(0, 0, 6, 6); c1.fillRect(6, 6, 6, 6);
    patterns['checkered_green'] = ctx.createPattern(p1, 'repeat');

    // --- RAINY FOREST DATA ---
    const rainDrops = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * 3000 - 500,
      y: Math.random() * 1500 - 500,
      length: Math.random() * 30 + 20,
      speedX: Math.random() * 10 + 15,
      speedY: Math.random() * 20 + 25,
      opacity: Math.random() * 0.35 + 0.15
    }));

    const generateBamboo = (count, spacing, minW, maxW, speed) => {
      return Array.from({ length: count }).map((_, i) => ({
        x: i * spacing + Math.random() * (spacing * 0.4),
        w: Math.random() * (maxW - minW) + minW,
        speed: speed,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.03 + 0.01,
        leaves: Array.from({ length: 7 }).map(() => ({
          relY: Math.random() * 0.8 + 0.15,
          side: Math.random() > 0.5 ? 1 : -1,
          size: Math.random() * 14 + 10,
          angle: (Math.random() - 0.5) * 0.5
        }))
      }));
    };
    const layer3 = generateBamboo(25, 90, 4, 8, 0.8);
    const layer2 = generateBamboo(15, 150, 10, 18, 1.8);
    const layer1 = generateBamboo(8, 280, 24, 36, 3.5);

    const clouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 60 + i * 45,
      width: Math.random() * 180 + 130,
      height: 12,
      speed: 0.2 + Math.random() * 0.15
    }));

    // --- PARTICLE SYSTEM ---
    const particles = Array.from({ length: 100 }).map(() => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      color: '',
      alpha: 0,
      life: 0,
      maxLife: 0,
      type: ''
    }));

    const spawnParticle = (x, y, color, type) => {
      const p = particles.find(p => p.life <= 0);
      if (!p) return;
      p.x = x;
      p.y = y;
      p.type = type;
      if (type === 'water') {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1.5;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 1.0;
        p.size = Math.random() * 4 + 2;
        p.maxLife = Math.random() * 25 + 15;
      } else {
        p.vx = (Math.random() - 0.5) * 6;
        p.vy = (Math.random() - 0.5) * 6 - 2;
        p.size = Math.random() * 3 + 1.5;
        p.maxLife = Math.random() * 20 + 10;
      }
      p.color = color;
      p.alpha = 1;
      p.life = p.maxLife;
    };

    // --- VOLCANIC DANGER DATA ---
    const embers = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 1000 + 200,
      size: Math.random() * 3 + 1.5,
      speedX: -(Math.random() * 3 + 3),
      speedY: -(Math.random() * 2 + 1),
      opacity: Math.random() * 0.8 + 0.2,
      pulseOffset: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.1 + 0.05
    }));

    const ashFlakes = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * 2000 - 200,
      y: Math.random() * 1000 - 200,
      size: Math.random() * 4 + 2,
      speedX: -(Math.random() * 4 + 6),
      speedY: Math.random() * 2 + 1.5,
      opacity: Math.random() * 0.4 + 0.1,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.04 + 0.02
    }));

    const generateScorchedTrees = (count, spacing, speed, minH, varH) => {
      return Array.from({ length: count }).map((_, i) => ({
        worldX: i * spacing + Math.random() * (spacing * 0.4),
        height: Math.random() * varH + minH,
        scale: Math.random() * 0.2 + 0.85,
        speed
      }));
    };
    const treesFar = generateScorchedTrees(6, 300, 1.0, 260, 120);
    const treesNear = generateScorchedTrees(4, 500, 2.5, 380, 150);

    const ashClouds = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * 1600,
      y: 50 + i * 45,
      width: Math.random() * 200 + 150,
      height: 15,
      speed: 0.25 + Math.random() * 0.15
    }));

    const beastEyes = Array.from({ length: 4 }).map(() => ({
      x: Math.random() * 2000,
      y: Math.random() * 150 + 430,
      size: Math.random() * 0.8 + 1.2,
      color: '#f97316',
      opacity: 0.35,
      blinkState: 'open',
      blinkTimer: Math.random() * 400 + 300,
      closedTimer: 0,
      speed: 1.0
    }));

    let raf;
    let startTime = Date.now();

    // --- DRAWING HELPERS ---

    const drawBambooLayer = (layer, stalkColor, leafColor, heightFactor, time) => {
      const h = canvas.height;
      ctx.fillStyle = stalkColor;
      layer.forEach(b => {
        const windSway = Math.sin(b.swayOffset + time * b.swaySpeed) * 8;
        const maxSway = -35 + windSway; 
        const stalkHeight = h * heightFactor;
        const startY = h - stalkHeight;

        ctx.fillStyle = stalkColor;
        ctx.beginPath();
        ctx.moveTo(b.x, h);
        ctx.quadraticCurveTo(b.x - 10, h - stalkHeight * 0.5, b.x + maxSway, startY);
        ctx.lineTo(b.x + b.w + maxSway, startY);
        ctx.quadraticCurveTo(b.x + b.w - 10, h - stalkHeight * 0.5, b.x + b.w, h);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1.5;
        const jointSpacing = b.w * 3.2;
        let currentY = h;
        while (currentY > startY) {
          const t = (h - currentY) / stalkHeight;
          const currentX = b.x * (1 - t) * (1 - t) + 2 * (b.x - 10) * (1 - t) * t + (b.x + maxSway) * t * t;
          ctx.beginPath();
          ctx.moveTo(currentX - 1, currentY);
          ctx.lineTo(currentX + b.w + 1, currentY - 3);
          ctx.stroke();
          currentY -= jointSpacing;
        }

        ctx.fillStyle = leafColor;
        b.leaves.forEach(leaf => {
          const t = leaf.relY;
          const currentY = h - stalkHeight * t;
          const currentX = b.x * (1 - t) * (1 - t) + 2 * (b.x - 10) * (1 - t) * t + (b.x + maxSway) * t * t;
          ctx.save();
          ctx.translate(currentX + b.w / 2, currentY);
          const windAngle = -Math.PI * 0.65 + leaf.angle + (maxSway * 0.003);
          ctx.rotate(windAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(leaf.size * 0.5, -leaf.size * 0.4, leaf.size, -leaf.size * 0.25);
          ctx.quadraticCurveTo(leaf.size * 0.5, leaf.size * 0.1, 0, 0);
          ctx.fill();
          ctx.restore();
        });
      });
    };

    const drawBlueSpiderLily = (lx, ly, glowAlpha) => {
      ctx.save();
      // Stem: dark indigo/charcoal
      ctx.strokeStyle = '#0b1329';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(lx - 2, ly - 8, lx, ly - 18);
      ctx.stroke();

      const px = lx;
      const py = ly - 18;

      // Soft glow aura around the lily cluster
      const effGlow = Math.max(0.15, glowAlpha);
      if (effGlow > 0) {
        ctx.save();
        const radGlow = ctx.createRadialGradient(px, py, 1, px, py, 12);
        radGlow.addColorStop(0, `rgba(34, 211, 238, ${0.4 * effGlow})`);
        radGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Elegant, fine petals in Sumi-e style (thin, long, curved outward)
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.7 + 0.3 * effGlow})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const angle = -Math.PI * 0.85 + (i * Math.PI * 0.7) / 5;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(3, -6, 2, -12); // Long curved petal
        ctx.stroke();

        // Stamen filament (even thinner, curving out further)
        ctx.strokeStyle = `rgba(165, 243, 252, ${0.8 + 0.2 * effGlow})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(1.5, -9);
        ctx.quadraticCurveTo(4, -14, 1, -18);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };

    const drawBoulderShrine = (x, y, scale, glowAlpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      
      const effGlow = Math.max(0.2, glowAlpha);
      
      // Sacred Shrine Glow
      if (effGlow > 0) {
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 35 * effGlow;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * effGlow})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -10, 75, Math.PI, 0);
        ctx.stroke();

        const glowGrad = ctx.createRadialGradient(0, -35, 5, 0, -35, 120);
        glowGrad.addColorStop(0, `rgba(56, 189, 248, ${0.35 * effGlow})`);
        glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, -35, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- CONTACT SHADOW / GROUNDING BED (NO OUTLINES) ---
      ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 105, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Earth Mound base bed: flat dark slate-grey
      ctx.fillStyle = '#0b0f19'; 
      ctx.beginPath();
      ctx.ellipse(0, 8, 85, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Moss layer on top: flat dark slate-green
      ctx.fillStyle = '#0c251e';
      ctx.beginPath();
      ctx.ellipse(0, 5, 78, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- TORII GATE (NO OUTLINES) ---
      // Pillars: flat weathered vermillion-maroon
      ctx.fillStyle = '#2d1819';
      ctx.beginPath();
      ctx.rect(-94, -90, 8, 90);
      ctx.rect(86, -90, 8, 90);
      ctx.fill();

      // Stone bases (Daiishi): flat slate-black
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-98, -2, 16, 6, 2);
      ctx.roundRect(82, -2, 16, 6, 2);
      ctx.fill();

      // Secondary crossbar (Nuki)
      ctx.fillStyle = '#2d1819';
      ctx.fillRect(-98, -80, 196, 7);

      // Top Crossbar (Kasagi) with curved tips: flat near-black crimson
      ctx.fillStyle = '#1f0c0d';
      ctx.beginPath();
      ctx.moveTo(-110, -96);
      ctx.quadraticCurveTo(0, -92, 110, -96);
      ctx.lineTo(112, -102);
      ctx.quadraticCurveTo(0, -98, -112, -102);
      ctx.closePath();
      ctx.fill();

      // Support strut (Gakuzuka)
      ctx.fillStyle = '#1f0c0d';
      ctx.fillRect(-6, -88, 12, 8);
      
      // Muted bronze plate
      ctx.fillStyle = '#78350f'; 
      ctx.fillRect(-3, -86, 6, 5);

      // --- GIANT BOULDER (NO OUTLINES) ---
      // Boulder body: slightly lighter slate-blue to separate from deep navy forest
      ctx.fillStyle = '#27374d'; 
      ctx.beginPath();
      ctx.moveTo(-75, 4);
      ctx.quadraticCurveTo(-85, -35, -65, -60);
      ctx.quadraticCurveTo(-45, -78, 0, -80);
      ctx.quadraticCurveTo(45, -78, 68, -58);
      ctx.quadraticCurveTo(82, -35, 75, 4);
      ctx.closePath();
      ctx.fill();

      // Rock cracks: very thin, subtle dark fissures
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-60, -50);
      ctx.lineTo(-30, -35);
      ctx.lineTo(-40, -10);
      ctx.moveTo(10, -78);
      ctx.lineTo(25, -45);
      ctx.lineTo(45, -15);
      ctx.stroke();

      // Moss patches: flat dark green
      ctx.fillStyle = '#0a221a';
      const drawFlatMoss = (mx, my, r) => {
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();
      };
      drawFlatMoss(-45, -60, 14);
      drawFlatMoss(35, -65, 11);

      // --- SHIMENAWA SACRED ROPE (NO OUTLINES) ---
      // Draw base rope curve: flat weathered straw-grey
      ctx.fillStyle = '#444240'; 
      ctx.beginPath();
      ctx.moveTo(-68, -32);
      ctx.quadraticCurveTo(0, -18, 68, -32);
      ctx.lineTo(68, -25);
      ctx.quadraticCurveTo(0, -11, -68, -25);
      ctx.closePath();
      ctx.fill();

      // Soft cyan reflection on the wet rope when glowing
      if (effGlow > 0.25) {
        ctx.save();
        ctx.fillStyle = `rgba(34, 211, 238, ${0.18 * (effGlow - 0.25)})`;
        ctx.beginPath();
        ctx.moveTo(-68, -32);
        ctx.quadraticCurveTo(0, -18, 68, -32);
        ctx.lineTo(68, -25);
        ctx.quadraticCurveTo(0, -11, -68, -25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw twist lines: thin dark charcoal strokes
      ctx.strokeStyle = '#1e1b19';
      ctx.lineWidth = 1.2;
      for (let i = -60; i <= 60; i += 12) {
        const t = (i + 68) / 136;
        const ry = -28.5 + 10 * Math.sin(t * Math.PI) - 3.5 * t;
        ctx.beginPath();
        ctx.moveTo(i - 3, ry - 3);
        ctx.lineTo(i + 3, ry + 3);
        ctx.stroke();
      }

      // --- SHIDE PAPER STREAMS (NO OUTLINES) ---
      const drawFlatShide = (sx, sy) => {
        ctx.save();
        ctx.fillStyle = effGlow > 0.35 ? '#e0f2fe' : '#94a3b8';
        if (effGlow > 0.35) {
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 6 * effGlow;
        }
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 4, sy + 6);
        ctx.lineTo(sx + 1, sy + 6);
        ctx.lineTo(sx - 5, sy + 15);
        ctx.lineTo(sx, sy + 15);
        ctx.lineTo(sx - 4, sy + 22);
        ctx.lineTo(sx + 2, sy + 22);
        ctx.lineTo(sx - 1, sy + 28);
        ctx.lineTo(sx + 3, sy + 28);
        ctx.lineTo(sx + 1, sy + 21);
        ctx.lineTo(sx + 5, sy + 21);
        ctx.lineTo(sx + 1, sy + 13);
        ctx.lineTo(sx + 6, sy + 13);
        ctx.lineTo(sx + 2, sy + 5);
        ctx.lineTo(sx + 5, sy + 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      
      const drawFlatTassel = (tx, ty) => {
        ctx.save();
        ctx.fillStyle = '#582f0e'; // Muted burnt-umber
        ctx.beginPath();
        ctx.moveTo(tx - 2, ty);
        ctx.lineTo(tx + 2, ty);
        ctx.lineTo(tx + 4, ty + 15);
        ctx.lineTo(tx - 4, ty + 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      drawFlatTassel(-42, -26);
      drawFlatShide(-28, -25);
      drawFlatTassel(-10, -22);
      drawFlatShide(10, -22);
      drawFlatTassel(30, -24);
      drawFlatShide(45, -26);

      // --- SMALL WOODEN HOKORA SHRINE (NO OUTLINES) ---
      ctx.save();
      ctx.translate(0, 12);
      
      ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Base stone platform
      ctx.fillStyle = '#334155';
      ctx.fillRect(-22, 5, 44, 5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-20, 0, 40, 5);

      // Shrine wood box: weathered charcoal wood
      ctx.fillStyle = '#1a1816';
      ctx.fillRect(-15, -20, 30, 20);
      
      // Pillars: deep slate-blue
      ctx.fillStyle = '#0f1322';
      ctx.fillRect(-17, -20, 3, 20);
      ctx.fillRect(14, -20, 3, 20);
      
      // Doors divider
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Gold latch: muted bronze
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-2.5, -11, 5, 4);

      // Sloping wood roof
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-25, -20);
      ctx.lineTo(25, -20);
      ctx.lineTo(18, -30);
      ctx.lineTo(-18, -30);
      ctx.closePath();
      ctx.fill();
      
      // Roof trim ridge
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-18, -32, 36, 3);

      ctx.restore();
      
      // --- STONE LANTERN TORO (NO OUTLINES, GLOWING CYAN) ---
      ctx.save();
      ctx.translate(-112, 10);
      
      // Base (Kiso)
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(-10, -3, 20, 4);
      // Pedestal Column (Sao)
      ctx.fillStyle = '#090f1c';
      ctx.fillRect(-4, -24, 8, 21);
      // Center Platform (Chudai)
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(-11, -30, 22, 6);
      
      // Light Chamber (Hibukuro)
      ctx.fillStyle = '#020617';
      ctx.fillRect(-8, -44, 16, 14);
      
      if (effGlow > 0) {
        ctx.save();
        const lightGlow = ctx.createRadialGradient(0, -37, 2, 0, -37, 28);
        lightGlow.addColorStop(0, `rgba(34, 211, 238, ${0.85 * effGlow})`);
        lightGlow.addColorStop(0.4, `rgba(6, 182, 212, ${0.45 * effGlow})`);
        lightGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = lightGlow;
        ctx.beginPath();
        ctx.arc(0, -37, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Glowing window slits in cyan/white
        ctx.fillStyle = `rgba(165, 243, 252, ${0.9 * effGlow})`;
        ctx.fillRect(-4, -40, 2.5, 6);
        ctx.fillRect(1.5, -40, 2.5, 6);
      }
      
      // Sloped stone roof (Kasa)
      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.moveTo(-14, -44);
      ctx.lineTo(14, -44);
      ctx.lineTo(9, -52);
      ctx.lineTo(-9, -52);
      ctx.closePath();
      ctx.fill();

      // Top Jewel (Hobi)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -55, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      // --- BLUE SPIDER LILIES ---
      drawBlueSpiderLily(-108, 10, effGlow);
      drawBlueSpiderLily(-100, 10, effGlow);
      drawBlueSpiderLily(-84, 10, effGlow);
      drawBlueSpiderLily(-76, 10, effGlow);
      drawBlueSpiderLily(74, 10, effGlow);
      drawBlueSpiderLily(84, 10, effGlow);
      drawBlueSpiderLily(-40, 10, effGlow);
      drawBlueSpiderLily(38, 10, effGlow);

      // Blades of grass (stylized flat green curves, no outlines)
      const drawFlatGrass = (gx, gy, h) => {
        ctx.save();
        ctx.fillStyle = '#0c2822'; // Dark slate-green
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(gx - 3, gy - h, gx - 5, gy - h);
        ctx.quadraticCurveTo(gx - 2, gy - h * 0.4, gx + 2, gy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      
      drawFlatGrass(-78, 6, 8);
      drawFlatGrass(-50, 9, 6);
      drawFlatGrass(60, 7, 7);
      drawFlatGrass(72, 6, 9);
      drawFlatGrass(-90, 4, 10);
      drawFlatGrass(90, 4, 10);
      drawFlatGrass(-110, 8, 8);
      
      ctx.restore();
    };

    const drawTreeCanopy = (ctx, w, h, time) => {
      ctx.save();
      // Main branch starting from top-left (0, 0)
      ctx.fillStyle = '#0f172a'; // Dark slate/black wood silhouette
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;

      // Draw thick curved branch
      ctx.beginPath();
      ctx.moveTo(-20, -20);
      ctx.quadraticCurveTo(w * 0.2, h * 0.08, w * 0.35, h * 0.15);
      ctx.quadraticCurveTo(w * 0.2, h * 0.1, -20, h * 0.05);
      ctx.closePath();
      ctx.fill();

      // Sub-branches
      const drawSubBranch = (bx, by, tx, ty, widthVal) => {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = widthVal;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + (tx - bx) * 0.5, by + (ty - by) * 0.8, tx, ty);
        ctx.stroke();
      };
      
      drawSubBranch(w * 0.15, h * 0.06, w * 0.18, h * 0.2, 5);
      drawSubBranch(w * 0.28, h * 0.11, w * 0.32, h * 0.25, 3);

      // Draw cluster of pine needles/leaves around the branch tips
      const drawLeafCluster = (cx, cy, radius, count) => {
        ctx.fillStyle = '#020617'; // Shadow base
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        for (let i = 0; i < count; i++) {
          ctx.save();
          ctx.translate(cx + (Math.random() - 0.5) * radius * 1.4, cy + (Math.random() - 0.5) * radius * 1.4);
          ctx.rotate(Math.random() * Math.PI);
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      };

      drawLeafCluster(w * 0.18, h * 0.2, 22, 15);
      drawLeafCluster(w * 0.32, h * 0.25, 25, 20);
      drawLeafCluster(w * 0.35, h * 0.15, 18, 12);
      drawLeafCluster(w * 0.08, h * 0.1, 30, 25);
      
      ctx.restore();
    };

    const drawBox = (ctx, bx, by, scale) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(scale, scale);
      
      const boxW = 12;
      const boxH = 20;

      // Wooden body fill (Cedar wood)
      ctx.fillStyle = '#54321c';
      ctx.fillRect(-boxW/2, -boxH, boxW, boxH);

      // Dark shadow door slit
      ctx.fillStyle = '#18120e';
      const crackWidth = 2;
      ctx.fillRect(boxW/2 - 1.5 - crackWidth, -boxH + 2.5, crackWidth, boxH - 5);

      // Black iron straps (matching Cosmetics design)
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-boxW/2 - 0.5, -boxH, boxW + 1, 2.5); // top band
      ctx.fillRect(-boxW/2 - 0.5, -2.5, boxW + 1, 2.5);  // bottom band
      ctx.fillRect(-boxW/2 - 0.5, -boxH + 2.5, 1.8, boxH - 5); // left band
      ctx.fillRect(boxW/2 - 1.3, -boxH + 2.5, 1.8, boxH - 5);  // right band

      // Metal door latch
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(boxW/2 - 3.5, -boxH * 0.5 - 1.5, 2, 3);

      // Glowing demon eyes inside the box (indicates the cursed one is carried inside)
      if (Math.sin(Date.now() * 0.003) > -0.7) {
        ctx.save();
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(boxW/2 - 2.5, -boxH * 0.5 - 1.2, 0.6, 0, Math.PI * 2);
        ctx.arc(boxW/2 - 2.5, -boxH * 0.5 + 0.8, 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      ctx.restore();
    };

    const drawSlayerKyahan = (ctx, lx, ly) => {
      ctx.save();
      ctx.translate(lx, ly);
      
      // Kyahan wrap (tinted to the warden's accent)
      ctx.fillStyle = char.accentColor;
      ctx.fillRect(-3.5, -2, 7, 5);
      
      // White cross ties
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(-2.5, -1); ctx.lineTo(2.5, 2);
      ctx.moveTo(2.5, -1); ctx.lineTo(-2.5, 2);
      ctx.stroke();
      
      // Foot/sandal (little brown/beige line at the bottom)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-4, 3, 8, 1.8);
      
      ctx.restore();
    };

    const drawSlayer = (x, y, scale, elapsed) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const currentPattern = fabricPattern;

      if (elapsed < 5.0) {
        // --- SITTING/HUDDLING POSE ---
        ctx.translate(0, 10);
        
        // Folded legs
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(6, 8); ctx.stroke();

        // Chest
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(-7, 8); ctx.lineTo(7, 8);
        ctx.lineTo(5, -12); ctx.lineTo(-7, -12);
        ctx.closePath(); ctx.fill();

        // Haori
        ctx.fillStyle = currentPattern;
        ctx.fillRect(-7, -11, 14, 15);

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(-1, -17, 5, 0, Math.PI * 2); ctx.fill();

        // Spiky Hair (matching signature look)
        const hx = -1;
        const hy = -17;
        ctx.fillStyle = char.hairColor;
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy);
        ctx.lineTo(hx - 8, hy - 6);
        ctx.lineTo(hx - 4, hy - 4);
        ctx.lineTo(hx - 5, hy - 9);
        ctx.lineTo(hx, hy - 6);
        ctx.lineTo(hx + 4, hy - 9);
        ctx.lineTo(hx + 3, hy - 4);
        ctx.lineTo(hx + 7, hy - 3);
        ctx.lineTo(hx + 5, hy + 1);
        ctx.lineTo(hx - 1, hy - 1);
        ctx.fill();

        ctx.fillStyle = char.hairTips;
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 5, 1.8, 0, Math.PI * 2);
        ctx.arc(hx + 2, hy - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (elapsed < 6.2) {
        // --- PROTECTIVE DEFENDING STANCE ---
        // Lunging legs
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-12, 10);
        ctx.moveTo(0, 0); ctx.lineTo(14, 10);
        ctx.stroke();
        
        // Green leg wraps (Kyahan)
        drawSlayerKyahan(ctx, -12, 10);
        drawSlayerKyahan(ctx, 14, 10);

        // Torso lunging right
        ctx.fillStyle = '#1c1917';
        ctx.save();
        ctx.rotate(0.15);
        ctx.beginPath();
        ctx.moveTo(-8, 5); ctx.lineTo(8, 5);
        ctx.lineTo(6, -20); ctx.lineTo(-8, -20);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -17, 16, 20);
        ctx.restore();

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(3, -25, 5, 0, Math.PI * 2); ctx.fill();

        // Spiky Hair
        ctx.fillStyle = char.hairColor;
        ctx.beginPath();
        ctx.moveTo(3 - 6, -25);
        ctx.lineTo(3 - 8, -31);
        ctx.lineTo(3 - 4, -29);
        ctx.lineTo(3 - 5, -34);
        ctx.lineTo(3, -31);
        ctx.lineTo(3 + 4, -34);
        ctx.lineTo(3 + 3, -29);
        ctx.lineTo(3 + 7, -28);
        ctx.lineTo(3 + 5, -24);
        ctx.lineTo(3 - 1, -26);
        ctx.fill();

        ctx.fillStyle = char.hairTips;
        ctx.beginPath();
        ctx.arc(3 - 3, -25 - 5, 1.8, 0, Math.PI * 2);
        ctx.arc(3 + 2, -25 - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Black sword with glowing outline
        ctx.strokeStyle = '#22d3ee'; // Cyan glow
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(10, -15);
        ctx.lineTo(28, -31);
        ctx.stroke();

        ctx.strokeStyle = '#020617'; // Katana blade metal
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(10, -15);
        ctx.lineTo(27, -30);
        ctx.stroke();

        // Extending left hand back to shield Sister
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-6, -14);
        ctx.lineTo(-18, -8);
        ctx.stroke();

      } else if (elapsed < 7.2) {
        // --- REACHING/CATCHING POSE ---
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-10, 10);
        ctx.moveTo(0, 0); ctx.lineTo(15, 10);
        ctx.stroke();
        
        // Green leg wraps (Kyahan)
        drawSlayerKyahan(ctx, -10, 10);
        drawSlayerKyahan(ctx, 15, 10);

        ctx.fillStyle = '#1c1917';
        ctx.save();
        ctx.rotate(0.25);
        ctx.beginPath();
        ctx.moveTo(-8, 5); ctx.lineTo(8, 5);
        ctx.lineTo(6, -20); ctx.lineTo(-8, -20);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -17, 16, 20);
        ctx.restore();

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(6, -23, 5, 0, Math.PI * 2); ctx.fill();

        // Spiky Hair
        const hx = 6;
        const hy = -23;
        ctx.fillStyle = char.hairColor;
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy);
        ctx.lineTo(hx - 8, hy - 6);
        ctx.lineTo(hx - 4, hy - 4);
        ctx.lineTo(hx - 5, hy - 9);
        ctx.lineTo(hx, hy - 6);
        ctx.lineTo(hx + 4, hy - 9);
        ctx.lineTo(hx + 3, hy - 4);
        ctx.lineTo(hx + 7, hy - 3);
        ctx.lineTo(hx + 5, hy + 1);
        ctx.lineTo(hx - 1, hy - 1);
        ctx.fill();

        ctx.fillStyle = char.hairTips;
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 5, 1.8, 0, Math.PI * 2);
        ctx.arc(hx + 2, hy - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Arms reaching right
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(8, -12);
        ctx.quadraticCurveTo(20, -10, 24, -2);
        ctx.stroke();

      } else if (elapsed < 15.0) {
        // --- KNEELING AND CATCHING/HOLDING SISTER ---
        ctx.translate(0, 8);

        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-8, 5); ctx.lineTo(10, 5); ctx.stroke();
        
        // Green leg wraps (Kyahan)
        drawSlayerKyahan(ctx, -8, 5);
        drawSlayerKyahan(ctx, 10, 5);

        ctx.fillStyle = '#1c1917';
        ctx.save();
        ctx.rotate(0.25);
        ctx.beginPath();
        ctx.moveTo(-8, 3); ctx.lineTo(8, 3);
        ctx.lineTo(6, -22); ctx.lineTo(-8, -22);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -18, 16, 20);
        ctx.restore();

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(4, -20, 5, 0, Math.PI * 2); ctx.fill();

        // Spiky Hair
        const hx = 4;
        const hy = -20;
        ctx.fillStyle = char.hairColor;
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy);
        ctx.lineTo(hx - 8, hy - 6);
        ctx.lineTo(hx - 4, hy - 4);
        ctx.lineTo(hx - 5, hy - 9);
        ctx.lineTo(hx, hy - 6);
        ctx.lineTo(hx + 4, hy - 9);
        ctx.lineTo(hx + 3, hy - 4);
        ctx.lineTo(hx + 7, hy - 3);
        ctx.lineTo(hx + 5, hy + 1);
        ctx.lineTo(hx - 1, hy - 1);
        ctx.fill();

        ctx.fillStyle = char.hairTips;
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 5, 1.8, 0, Math.PI * 2);
        ctx.arc(hx + 2, hy - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Arm holding sister
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.quadraticCurveTo(10, -8, 12, -2);
        ctx.stroke();

      } else if (elapsed < 17.5) {
        // --- STANDING CARRYING THE BOX ---
        ctx.translate(0, 0);

        // Legs standing
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(-4, 11);
        ctx.moveTo(4, 0); ctx.lineTo(4, 11);
        ctx.stroke();
        
        // Green leg wraps (Kyahan)
        drawSlayerKyahan(ctx, -4, 11);
        drawSlayerKyahan(ctx, 4, 11);

        // Torso straight
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
        ctx.lineTo(6, -23); ctx.lineTo(-6, -23);
        ctx.closePath(); ctx.fill();

        // Haori
        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -20, 16, 20);

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -28, 5, 0, Math.PI * 2); ctx.fill();

        // Spiky Hair
        const hx = 0;
        const hy = -28;
        ctx.fillStyle = char.hairColor;
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy);
        ctx.lineTo(hx - 8, hy - 6);
        ctx.lineTo(hx - 4, hy - 4);
        ctx.lineTo(hx - 5, hy - 9);
        ctx.lineTo(hx, hy - 6);
        ctx.lineTo(hx + 4, hy - 9);
        ctx.lineTo(hx + 3, hy - 4);
        ctx.lineTo(hx + 7, hy - 3);
        ctx.lineTo(hx + 5, hy + 1);
        ctx.lineTo(hx - 1, hy - 1);
        ctx.fill();

        ctx.fillStyle = char.hairTips;
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 5, 1.8, 0, Math.PI * 2);
        ctx.arc(hx + 2, hy - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Wood box on back
        drawBox(ctx, -10, -8, 1.0);

      } else {
        // --- NORMAL COMBAT READY STANCE (START GAME) ---
        // Wide athletic legs
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-12, 10);
        ctx.moveTo(0, 0); ctx.lineTo(12, 10);
        ctx.stroke();
        
        // Green leg wraps (Kyahan)
        drawSlayerKyahan(ctx, -12, 10);
        drawSlayerKyahan(ctx, 12, 10);

        // Torso lunged forward
        ctx.fillStyle = '#1c1917';
        ctx.save();
        ctx.rotate(0.12);
        ctx.beginPath();
        ctx.moveTo(-8, 5); ctx.lineTo(8, 5);
        ctx.lineTo(6, -20); ctx.lineTo(-8, -20);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = currentPattern;
        ctx.fillRect(-8, -17, 16, 20);
        ctx.restore();

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(2, -25, 5, 0, Math.PI * 2); ctx.fill();

        // Spiky Hair
        const hx = 2;
        const hy = -25;
        ctx.fillStyle = char.hairColor;
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy);
        ctx.lineTo(hx - 8, hy - 6);
        ctx.lineTo(hx - 4, hy - 4);
        ctx.lineTo(hx - 5, hy - 9);
        ctx.lineTo(hx, hy - 6);
        ctx.lineTo(hx + 4, hy - 9);
        ctx.lineTo(hx + 3, hy - 4);
        ctx.lineTo(hx + 7, hy - 3);
        ctx.lineTo(hx + 5, hy + 1);
        ctx.lineTo(hx - 1, hy - 1);
        ctx.fill();

        ctx.fillStyle = char.hairTips;
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 5, 1.8, 0, Math.PI * 2);
        ctx.arc(hx + 2, hy - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Katana held forward
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(8, -15);
        ctx.lineTo(26, -22);
        ctx.stroke();

        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(8, -15);
        ctx.lineTo(25, -21);
        ctx.stroke();

        // Wood box on back
        drawBox(ctx, -11, -10, 1.0);
      }

      ctx.restore();
    };

    const drawSister = (x, y, scale, elapsed, stateY) => {
      ctx.save();

      if (elapsed < 5.0) {
        // --- SITTING SISTER ---
        // Offset matches the slayer's seated baseline (slayer uses translate(0,10) *after*
        // scale = 24px; this pre-scale offset must be 24px too) so the sister's head and
        // feet line up with the monk's instead of floating ~12px higher and looking taller.
        ctx.translate(x, y + 24);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#9333ea'; // Kimono purple
        ctx.beginPath();
        ctx.moveTo(-6, -15); ctx.lineTo(6, -15);
        ctx.lineTo(8, 8); ctx.lineTo(-8, 8);
        ctx.fill();

        ctx.fillStyle = '#dc2626'; // Obi
        ctx.fillRect(-7, -8, 14, 3.5);

        ctx.fillStyle = '#1c1917'; // Hair
        ctx.fillRect(-8, -18, 16, 20);

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -18, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#1c1917';
        ctx.beginPath(); ctx.arc(0, -20, 6, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ec4899'; // Hair tips
        ctx.fillRect(-8, 0, 16, 4);

      } else if (elapsed < 6.2) {
        // --- FLOATING/LIFTED SISTER (CURSED) ---
        ctx.translate(x, y + stateY);
        ctx.scale(scale, scale);

        // Red aura sphere
        const grad = ctx.createRadialGradient(0, -10, 0, 0, -10, 25);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
        grad.addColorStop(0.7, 'rgba(220, 38, 38, 0.3)');
        grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, -10, 25, 0, Math.PI * 2); ctx.fill();

        // Kimono hanging
        ctx.fillStyle = '#9333ea'; // purple
        ctx.beginPath();
        ctx.moveTo(-6, -18); ctx.lineTo(6, -18);
        ctx.lineTo(7, 10); ctx.lineTo(-7, 10);
        ctx.fill();

        ctx.fillStyle = '#dc2626'; // Obi
        ctx.fillRect(-6.5, -9, 13, 3);

        // Head tilted back
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -22, 5.5, 0, Math.PI * 2); ctx.fill();

        // Long wild hair
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.ellipse(0, -18, 7.5, 12, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-7.5, -12, 15, 20);

        ctx.fillStyle = '#ec4899';
        ctx.fillRect(-7.5, 6, 15, 5);

      } else if (elapsed < 7.2) {
        // --- FAINTING & FALLING FLAT ---
        ctx.translate(x + 10, y + stateY + 14);
        ctx.scale(scale, scale);
        ctx.rotate(Math.PI * 0.45); // Tilted flat

        ctx.fillStyle = '#9333ea'; // purple
        ctx.beginPath();
        ctx.moveTo(-6, -15); ctx.lineTo(6, -15);
        ctx.lineTo(7, 8); ctx.lineTo(-7, 8);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-6.5, -8, 13, 3);

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -19, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#1c1917';
        ctx.beginPath(); ctx.arc(0, -20, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-7, -15, 14, 20);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(-7, 3, 14, 4);

      } else if (elapsed < 15.0) {
        // --- LYING DOWN ON SLAYER'S LAP (CAUGHT) ---
        ctx.translate(x - 12, y + 15);
        ctx.scale(scale, scale);
        ctx.rotate(-Math.PI * 0.35);

        ctx.fillStyle = '#9333ea'; // purple
        ctx.beginPath();
        ctx.moveTo(-6, -15); ctx.lineTo(6, -15);
        ctx.lineTo(7, 8); ctx.lineTo(-7, 8);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-6.5, -8, 13, 3);

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(0, -19, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#1c1917';
        ctx.beginPath(); ctx.arc(0, -20, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-7, -15, 14, 20);

        ctx.fillStyle = '#ec4899';
        ctx.fillRect(-7, 3, 14, 4);
      }

      ctx.restore();
    };

    const drawDemonEyes = (cx, cy, w, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;

      const eyeW = w * 0.18;
      const eyeH = eyeW * 0.45;
      const eyeSpacing = w * 0.35;

      const drawEye = (x, y, isRight) => {
        // Red mist / smoke rising from the eye
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          const sx = x + (Math.random() - 0.5) * eyeW;
          const sy = y + (Math.random() - 0.5) * eyeH;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.bezierCurveTo(
            sx + (Math.random() - 0.5) * 30, sy - 15,
            sx + (Math.random() - 0.5) * 30, sy - 30,
            sx + (Math.random() - 0.5) * 60, sy - 50 - Math.random() * 30
          );
          ctx.stroke();
        }

        // 1. Red Glow Aura behind eye
        const glow = ctx.createRadialGradient(x, y, eyeW * 0.1, x, y, eyeW * 1.5);
        glow.addColorStop(0, 'rgba(239, 68, 68, 0.75)');
        glow.addColorStop(0.3, 'rgba(220, 38, 38, 0.35)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, eyeW * 1.5, 0, Math.PI * 2); ctx.fill();

        // 2. Eye shape outline / eyelids (sleek, slanted, demonic)
        ctx.fillStyle = '#090505';
        ctx.beginPath();
        if (!isRight) {
          ctx.moveTo(x - eyeW * 0.6, y + eyeH * 0.1);
          ctx.quadraticCurveTo(x - eyeW * 0.2, y - eyeH * 0.65, x + eyeW * 0.6, y - eyeH * 0.2);
          ctx.quadraticCurveTo(x + eyeW * 0.1, y + eyeH * 0.55, x - eyeW * 0.6, y + eyeH * 0.1);
        } else {
          ctx.moveTo(x - eyeW * 0.6, y - eyeH * 0.2);
          ctx.quadraticCurveTo(x + eyeW * 0.2, y - eyeH * 0.65, x + eyeW * 0.6, y + eyeH * 0.1);
          ctx.quadraticCurveTo(x - eyeW * 0.1, y + eyeH * 0.55, x - eyeW * 0.6, y - eyeH * 0.2);
        }
        ctx.closePath();
        ctx.fill();

        // 3. Eyeball / Sclera (Very dark blood red gradient)
        ctx.save();
        ctx.clip(); // Keep eyeball inside lids

        const scleraGrad = ctx.createRadialGradient(x, y, eyeW * 0.1, x, y, eyeW * 0.65);
        scleraGrad.addColorStop(0, '#ef4444');
        scleraGrad.addColorStop(0.5, '#7f1d1d');
        scleraGrad.addColorStop(1, '#1c0505');
        ctx.fillStyle = scleraGrad;
        ctx.fillRect(x - eyeW, y - eyeH, eyeW * 2, eyeH * 2);

        // 4. Iris & Pupil
        const irisR = eyeH * 0.42;
        const irisGrad = ctx.createRadialGradient(x, y, 0, x, y, irisR);
        irisGrad.addColorStop(0, '#fef08a'); // Yellow center
        irisGrad.addColorStop(0.5, '#f97316'); // Orange middle
        irisGrad.addColorStop(1, '#dc2626'); // Red outer
        ctx.fillStyle = irisGrad;
        ctx.beginPath(); ctx.arc(x, y, irisR, 0, Math.PI * 2); ctx.fill();

        // Dark radial texture lines in iris
        ctx.strokeStyle = 'rgba(127, 29, 29, 0.45)';
        ctx.lineWidth = 0.8;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(angle) * (irisR * 0.25), y + Math.sin(angle) * (irisR * 0.25));
          ctx.lineTo(x + Math.cos(angle) * irisR, y + Math.sin(angle) * irisR);
          ctx.stroke();
        }

        // 5. Cat Pupil (Vertical Slit)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x, y, irisR * 0.18, irisR * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing white core in pupil
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x, y, irisR * 0.04, irisR * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 6. Specular eyeball highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(x - irisR * 0.35, y - irisR * 0.35, irisR * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + irisR * 0.35, y + irisR * 0.25, irisR * 0.07, 0, Math.PI * 2); ctx.fill();

        // 7. Eyelid highlighting (Red/pink glow line on eyelid edges)
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        if (!isRight) {
          ctx.moveTo(x - eyeW * 0.6, y + eyeH * 0.1);
          ctx.quadraticCurveTo(x - eyeW * 0.2, y - eyeH * 0.65, x + eyeW * 0.6, y - eyeH * 0.2);
        } else {
          ctx.moveTo(x - eyeW * 0.6, y - eyeH * 0.2);
          ctx.quadraticCurveTo(x + eyeW * 0.2, y - eyeH * 0.65, x + eyeW * 0.6, y + eyeH * 0.1);
        }
        ctx.stroke();

        ctx.restore(); // Restore clip
      };

      drawEye(cx - eyeSpacing/2, cy, false);
      drawEye(cx + eyeSpacing/2, cy, true);

      ctx.restore();
    };

    const drawLightning = (ctx, startX, startY, endX, endY, color, width) => {
      let x = startX;
      let y = startY;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const t = (i + 1) / steps;
        const targetX = startX + (endX - startX) * t;
        const targetY = startY + (endY - startY) * t;
        
        if (i < steps - 1) {
          x = targetX + (Math.random() - 0.5) * 35;
          y = targetY + (Math.random() - 0.5) * 10;
        } else {
          x = endX;
          y = endY;
        }
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Draw a smaller branch
      if (width > 2.5 && Math.random() < 0.35) {
        const branchAngle = (Math.random() - 0.5) * Math.PI * 0.4;
        const branchLength = (endY - startY) * 0.45;
        const bx = x + Math.sin(branchAngle) * branchLength;
        const by = y + Math.cos(branchAngle) * branchLength;
        drawLightning(ctx, x, y, bx, by, color, width * 0.5);
      }
      ctx.restore();
    };

    const drawSubtitleText = (text, x, y, size, color, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Black outline (anime subtitles style)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4.5;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, x, y);
      
      // Main text color fill
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    // --- MAIN FRAME LOOP ---
    const frame = () => {
      const st = stateRef.current;
      st.time++;
      const elapsed = (Date.now() - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const groundY = h - 100;

      // --- AUDIO SEQUENCING ---
      const at = audioTriggersRef.current;
      if (!at.rain && elapsed > 0) { rainGainRef.current = playRain(); at.rain = true; }
      if (!at.horn && elapsed > 0) { playAlarmingHorn(); at.horn = true; }
      
      if (!at.bgThunder1 && elapsed >= 1.0) { playBgThunder(); at.bgThunder1 = true; }
      
      if (!at.vacuum && elapsed >= 4.0) { // Start dip earlier at 4.0s
         if (masterGainRef.current && audioCtxRef.current) {
            const mg = masterGainRef.current.gain;
            const now = audioCtxRef.current.currentTime;
            mg.cancelScheduledValues(now);
            mg.setValueAtTime(mg.value, now);
            mg.linearRampToValueAtTime(0.3, now + 0.9); // Smoothly drop to 0.3 right before 5.0s
            mg.setValueAtTime(0.3, now + 0.99);
            mg.linearRampToValueAtTime(0.8, now + 1.0); // Snap back to 0.8 at 5.0s
         }
         at.vacuum = true;
      }
      
      if (!at.strike && elapsed >= 5.0) { playThunderStrike(); at.strike = true; }
      if (!at.despairMusic && elapsed >= 6.5) { playDespairMusic(); at.despairMusic = true; }
      
      if (!at.bgThunder2 && elapsed >= 12.0) { playBgThunder(); at.bgThunder2 = true; }
      
      if (elapsed >= 17.5 && rainGainRef.current && audioCtxRef.current) {
         const now = audioCtxRef.current.currentTime;
         rainGainRef.current.gain.cancelScheduledValues(now);
         rainGainRef.current.gain.setValueAtTime(rainGainRef.current.gain.value, now);
         rainGainRef.current.gain.linearRampToValueAtTime(0, now + 1.5);
         rainGainRef.current = null;
      }
      
      if (!at.volcano && elapsed >= 19.0) { volcanoGainRef.current = playVolcano(); at.volcano = true; }

      // --- TIMELINE SEQUENCING ---
      if (elapsed < 3.0) {
        // Scene 1: Shelter & Eyes Appear (steady open)
        st.sisterY = 0;
        st.slayerY = 0;
        st.glowAlpha = 0;
        st.eyesAlpha = Math.min(1.0, elapsed / 2.0); // Eyes fade in over 2s
        st.shrineGlow = 0;
      } else if (elapsed < 5.0) {
        // Scene 2: Steady open gaze (blink removed)
        st.eyesAlpha = 1.0;
        st.glowAlpha = 0;
        st.sisterY = 0;
        st.slayerY = 0;
        st.shrineGlow = 0;
      } else if (elapsed < 6.2) {
        // Scene 3: The Strike & Float/Lift (Curse)
        st.eyesAlpha = 1.0;
        st.glowAlpha = Math.min(0.9, (elapsed - 5.0) * 1.5);
        
        // Sister floats up (lifted) from 5.2 to 6.2
        if (elapsed >= 5.2) {
          const t = (elapsed - 5.2) / 1.0;
          st.sisterY = -140 * Math.sin(t * Math.PI / 2); 
        }
      } else if (elapsed < 7.2) {
        // Scene 4: Faints & Falls flat, Slayer Catches
        st.eyesAlpha = 1.0;
        st.glowAlpha = Math.max(0, 0.9 - (elapsed - 6.2) * 1.2);
        
        // Sister falls flat
        const t = (elapsed - 6.2) / 0.8; // Falls down flat over 0.8s
        st.sisterY = -140 + 140 * Math.min(1.0, t);
      } else if (elapsed < 11.0) {
        // Scene 5: The Beat of Despair & Shrine Glow Starts at 8.5s
        st.eyesAlpha = Math.max(0, 1.0 - (elapsed - 7.5) * 2.0);
        st.glowAlpha = 0;
        st.sisterY = 0;
        st.slayerY = 0;
        
        if (elapsed >= 8.5) {
          // Shrine starts to glow (little pause before dialogue)
          const glowProgress = Math.min(1.0, (elapsed - 8.5) * 1.5);
          const pulse = Math.sin(Date.now() * 0.004) * 0.15 + 0.85;
          st.shrineGlow = glowProgress * pulse;
        } else {
          st.shrineGlow = 0;
        }
      } else if (elapsed < 15.0) {
        // Scene 6: Shrine Glow & Subtitle Guidance (Eyes fully faded)
        st.eyesAlpha = 0;
        st.glowAlpha = 0;
        st.sisterY = 0;
        st.slayerY = 0;
        
        const pulse = Math.sin(Date.now() * 0.004) * 0.15 + 0.85;
        st.shrineGlow = 1.0 * pulse;
      } else if (elapsed < 17.5) {
        // Scene 7: Putting Sister in the Box
        st.shrineGlow = Math.max(0, st.shrineGlow - 0.05);
        st.eyesAlpha = 0;
        st.glowAlpha = 0;

        // Swirling particles from Sister on ground to Slayer's back
        if (elapsed >= 15.0 && elapsed < 16.2) {
          const startX = w/2 + 33;
          const startY = groundY + 15;
          const endX = w/2 - 45;
          const endY = groundY - 8;
          const progress = (elapsed - 15.0) / 1.2;
          for (let k = 0; k < 2; k++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 20 * (1.0 - progress);
            const sx = startX + (endX - startX) * progress + Math.cos(angle) * r;
            const sy = startY + (endY - startY) * progress + Math.sin(angle) * r;
            spawnParticle(sx, sy, '#fbcfe8', 'water');
          }
        }
      } else {
        // Scene 8: Ready combat stance & final fade to Mountain Sagiri
        st.shrineGlow = 0;
        if (elapsed < 19.0) {
          const p = (elapsed - 17.5) / 1.5; // 1.5s to fade to black
          st.fadeAlpha = Math.min(1.0, Math.max(0, p));
          st.textProgress = 0;
        } else {
          // Scene 9: Mountain Sagiri reveal
          const p2 = (elapsed - 19.0) / 1.5; // 1.5s to fade Mountain Sagiri in
          st.fadeAlpha = Math.max(0, 1.0 - p2);
          st.textProgress = Math.min(1.0, Math.max(0, p2 * 1.2));
        }
      }

      // --- RENDER CAMERA SHAKE WRAPPER ---
      ctx.save();
      if (st.shake > 0.5) {
        const dx = (Math.random() - 0.5) * st.shake;
        const dy = (Math.random() - 0.5) * st.shake;
        ctx.translate(dx, dy);
        st.shake *= 0.9;
      }

      if (elapsed >= 19.0) {
        // --- DRAW MOUNTAIN SAGIRI (VOLCANIC DANGER) ---
        const getMidgroundY = (x, scrollOffset) => groundY - 15 + Math.sin((x + scrollOffset) * 0.005) * 15 + Math.cos((x + scrollOffset) * 0.01) * 5;
        const getForegroundY = (x, scrollOffset) => groundY + 12 + Math.sin((x + scrollOffset) * 0.004 + 2.0) * 18;

        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#0c0404');
        skyGrad.addColorStop(0.4, '#1c0a0a');
        skyGrad.addColorStop(0.7, '#3b1111');
        skyGrad.addColorStop(1, '#681c1c');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(15, 15, 20, 0.45)';
        ashClouds.forEach(c => {
          c.x -= c.speed;
          if (c.x < -c.width) c.x = w + 100;
          ctx.beginPath();
          ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
          ctx.roundRect(c.x + c.width * 0.2, c.y - c.height * 0.4, c.width * 0.5, c.height * 0.8, c.height / 2);
          ctx.fill();
        });

        const volSize = Math.min(w, h) * 0.6;
        const volX = w * 0.5;
        const volY = groundY - 10;
        ctx.fillStyle = '#140808';
        ctx.beginPath();
        ctx.moveTo(volX - volSize * 1.8, volY);
        ctx.quadraticCurveTo(volX - volSize * 0.7, volY - volSize * 0.15, volX - volSize * 0.25, volY - volSize * 0.9); 
        ctx.lineTo(volX + volSize * 0.25, volY - volSize * 0.9);
        ctx.quadraticCurveTo(volX + volSize * 0.7, volY - volSize * 0.15, volX + volSize * 1.8, volY);
        ctx.fill();
        ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 3;
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.ellipse(volX, volY - volSize * 0.9, volSize * 0.22, 6, 0, 0, Math.PI * 2); ctx.fill();
        
        const drawLavaVein = (sx, sy, ex, ey) => {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo((sx+ex)/2 + Math.sin(st.time*0.02)*10, (sy+ey)/2, ex, ey);
          ctx.stroke();
        };
        drawLavaVein(volX - volSize * 0.1, volY - volSize * 0.9, volX - volSize * 0.3, volY - volSize * 0.5);
        drawLavaVein(volX + volSize * 0.15, volY - volSize * 0.9, volX + volSize * 0.4, volY - volSize * 0.4);

        const haze = ctx.createLinearGradient(0, h * 0.4, 0, h);
        haze.addColorStop(0, 'rgba(104, 28, 28, 0)');
        haze.addColorStop(0.8, 'rgba(104, 28, 28, 0.45)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, h * 0.35, w, h * 0.5);

        beastEyes.forEach(eye => {
          eye.x -= eye.speed;
          if (eye.x < -100) { eye.x = w + 100 + Math.random() * 200; eye.y = Math.random() * 150 + 430; }
          if (eye.blinkState === 'open') { eye.blinkTimer--; if (eye.blinkTimer <= 0) eye.blinkState = 'closing'; }
          else if (eye.blinkState === 'closing') { eye.opacity -= 0.05; if (eye.opacity <= 0) { eye.opacity = 0; eye.blinkState = 'closed'; eye.closedTimer = Math.random() * 150 + 50; } }
          else if (eye.blinkState === 'closed') { eye.closedTimer--; if (eye.closedTimer <= 0) eye.blinkState = 'opening'; }
          else if (eye.blinkState === 'opening') { eye.opacity += 0.05; if (eye.opacity >= 1) { eye.opacity = 1; eye.blinkState = 'open'; eye.blinkTimer = Math.random() * 400 + 300; } }
          
          if (eye.opacity > 0) {
            ctx.save(); ctx.globalAlpha = eye.opacity * 0.35;
            const drawSlantedEye = (cx, cy, direction) => {
              ctx.save(); ctx.translate(cx, cy); ctx.rotate(direction * 0.3);
              const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, eye.size * 2.5);
              glow.addColorStop(0, 'rgba(249, 115, 22, 0.45)'); glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
              ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(0, 0, eye.size * 2.5, eye.size * 1.3, 0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = eye.color; ctx.beginPath(); ctx.ellipse(0, 0, eye.size * 1.5, eye.size * 0.65, 0, 0, Math.PI * 2); ctx.fill();
              ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.0; ctx.beginPath(); ctx.moveTo(0, -eye.size * 0.5); ctx.lineTo(0, eye.size * 0.5); ctx.stroke();
              ctx.restore();
            };
            drawSlantedEye(eye.x - eye.size * 2.5, eye.y, 1);
            drawSlantedEye(eye.x + eye.size * 2.5, eye.y, -1);
            ctx.restore();
          }
        });

        const drawScorchedTree = (tx, ty, height, scale, color) => {
          ctx.save();
          ctx.translate(tx, ty);
          ctx.scale(scale, scale);

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = color;
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-20, -height * 0.3, -8, -height * 0.6);
          ctx.quadraticCurveTo(15, -height * 0.8, 0, -height);
          ctx.stroke();

          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(-10, -height * 0.45);
          ctx.lineTo(-35, -height * 0.65);
          ctx.lineTo(-45, -height * 0.6);
          
          ctx.moveTo(6, -height * 0.68);
          ctx.lineTo(32, -height * 0.8);
          ctx.lineTo(42, -height * 0.75);

          ctx.moveTo(-4, -height * 0.85);
          ctx.lineTo(-20, -height * 0.98);
          ctx.stroke();

          ctx.restore();
        };

        treesFar.forEach(t => {
          const loopWidth = w + 400; let screenX = (t.worldX - st.time * t.speed) % loopWidth; if (screenX < -200) screenX += loopWidth;
          drawScorchedTree(screenX, getMidgroundY(screenX, st.time * t.speed) - 5, t.height, t.scale * 0.75, '#120505');
        });

        ctx.fillStyle = '#1a0a0a'; ctx.beginPath(); ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 10) ctx.lineTo(x, getMidgroundY(x, st.time * 1.8));
        ctx.lineTo(w, h); ctx.fill();
        ctx.strokeStyle = `rgba(239, 68, 68, ${Math.sin(st.time * 0.05) * 0.35 + 0.65})`; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let x = 0; x <= w; x += 30) { const gy = getMidgroundY(x, st.time * 1.8); if (x === 0) ctx.moveTo(x, gy + 5); else ctx.lineTo(x, gy + 5 + Math.sin(x * 0.02 + st.time * 0.04) * 4); } ctx.stroke();

        treesNear.forEach(t => {
          const loopWidth = w + 500; let screenX = (t.worldX - st.time * t.speed) % loopWidth; if (screenX < -200) screenX += loopWidth;
          drawScorchedTree(screenX, getForegroundY(screenX, st.time * t.speed) - 5, t.height, t.scale * 1.1, '#0a0202');
        });

        ctx.fillStyle = '#080101'; ctx.beginPath(); ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 10) ctx.lineTo(x, getForegroundY(x, st.time * 3.0));
        ctx.lineTo(w, h); ctx.fill();

        ctx.strokeStyle = `rgba(249, 115, 22, ${Math.sin(st.time * 0.08) * 0.3 + 0.7})`; ctx.lineWidth = 3.5; ctx.beginPath();
        for (let x = 0; x <= w; x += 20) { const gy = getForegroundY(x, st.time * 3.0); if (x === 0) ctx.moveTo(x, gy + 8); else ctx.lineTo(x, gy + 8 + (x % 40 === 0 ? 6 : -4)); } ctx.stroke();

        embers.forEach(e => {
          e.x += e.speedX; e.y += e.speedY;
          if (e.x < -50 || e.y < -50) { e.x = w + 100 + Math.random() * 200; e.y = h - Math.random() * 300; }
          const pulse = Math.sin(st.time * e.pulseSpeed + e.pulseOffset) * 0.4 + 0.6;
          ctx.save();
          const glow = ctx.createRadialGradient(e.x, e.y, 0.5, e.x, e.y, e.size * 3.5 * pulse);
          glow.addColorStop(0, 'rgba(253, 224, 71, 0.95)'); glow.addColorStop(0.3, 'rgba(249, 115, 22, 0.7)'); glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 3.5 * pulse, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        });

        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ashFlakes.forEach(a => {
          a.sway += a.swaySpeed; a.x += a.speedX + Math.sin(a.sway) * 1.5; a.y += a.speedY;
          if (a.x < -50 || a.y > h + 50) { a.x = w + 100 + Math.random() * 200; a.y = -50 + Math.random() * (h * 0.5); }
          ctx.save(); ctx.translate(a.x, a.y); ctx.beginPath(); ctx.arc(0, 0, a.size * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        });

        const vignette = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.75);
        vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(0.7, 'rgba(120, 10, 10, 0.2)'); vignette.addColorStop(1, 'rgba(40, 2, 2, 0.75)');
        ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);

      } else {
        // --- DRAW RAINY FOREST SCENES ---
        // 1. SKY GRADIENT
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#020617');
        skyGrad.addColorStop(0.5, '#0f172a');
        skyGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // 2. AMBIENT LIGHTNING FLASH
        if (Math.random() < 0.003 && st.time - st.lastLightning > 180) {
          st.lastLightning = st.time;
          st.lightningAlpha = Math.random() * 0.6 + 0.35;
          playThunder();
        }
        if (st.lightningAlpha > 0) {
          ctx.fillStyle = `rgba(186, 230, 253, ${st.lightningAlpha})`;
          ctx.fillRect(0, 0, w, h);
          st.lightningAlpha -= 0.04;
        }

        // 3. CLOUDS
        ctx.fillStyle = st.lightningAlpha > 0 ? `rgba(255,255,255,${0.12 + st.lightningAlpha * 0.4})` : 'rgba(255,255,255,0.04)';
        clouds.forEach(c => {
          c.x -= c.speed;
          if (c.x < -c.width) c.x = w + 100;
          ctx.beginPath();
          ctx.roundRect(c.x, c.y, c.width, c.height, c.height / 2);
          ctx.roundRect(c.x + c.width * 0.25, c.y - c.height * 0.5, c.width * 0.45, c.height * 0.8, c.height / 2);
          ctx.fill();
        });

        // 4. DEMON EYES
        if (st.eyesAlpha > 0) {
          drawDemonEyes(w/2, h * 0.3, w, st.eyesAlpha);
        }

        // 5. BAMBOO & GROUND PARALLAX LAYERS
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.quadraticCurveTo(w * 0.3, h - 180, w * 0.65, h - 130);
        ctx.quadraticCurveTo(w * 0.85, h - 110, w, h - 140);
        ctx.lineTo(w, h);
        ctx.fill();

        drawBambooLayer(layer3, '#0f172a', '#020617', 0.8, st.time);
        drawBambooLayer(layer2, '#1e293b', '#0f172a', 0.95, st.time);

        ctx.fillStyle = '#0b0f19';
        ctx.beginPath();
        ctx.moveTo(0, groundY - 15);
        ctx.quadraticCurveTo(w * 0.35, groundY - 25, w * 0.7, groundY + 5);
        ctx.quadraticCurveTo(w * 0.85, groundY + 15, w, groundY - 8);
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

        drawBambooLayer(layer1, '#334155', '#1e293b', 1.15, st.time);

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.moveTo(0, groundY + 8);
        ctx.quadraticCurveTo(w * 0.35, groundY - 5, w * 0.7, groundY + 20);
        ctx.quadraticCurveTo(w * 0.85, groundY + 30, w, groundY + 12);
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

        // 6. SACRED SHRINE (Toro & Blue Spider Lilies) - Scaled to 2.2 (Twice bigger!)
        drawBoulderShrine(w/2, groundY + 20, 2.2, st.shrineGlow);

        // 6.5 FOREGROUND TREE CANOPY
        drawTreeCanopy(ctx, w, h, st.time);

        // 6.8 MIST SEPARATION LAYER (prevents characters and dark shrine from merging)
        ctx.save();
        const mistGrad = ctx.createRadialGradient(w/2, groundY - 10, 10, w/2, groundY - 10, 100);
        mistGrad.addColorStop(0, 'rgba(148, 163, 184, 0.28)'); // soft light blue-grey mist
        mistGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.ellipse(w/2, groundY - 10, 120, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 7. CHARACTERS (Scaled up to 2.4 to prevent blending and give better presence)
        drawSister(w/2 + 45, groundY, 2.4, elapsed, st.sisterY);
        drawSlayer(w/2 - 35, groundY, 2.4, elapsed);

        // 8. EXPLICIT DEMONIC RED THUNDERSTRIKE (Adjusted for new Sister position)
        if (elapsed >= 5.0 && elapsed < 5.7) {
          // Sky red flash
          const flashAlpha = Math.max(0, 0.85 - (elapsed - 5.0) * 1.8);
          ctx.fillStyle = `rgba(239, 68, 68, ${flashAlpha})`;
          ctx.fillRect(0, 0, w, h);

          // Set screen shake
          st.shake = Math.max(st.shake, 22);

          // Draw lightning bolts from sky/eyes to Sister
          drawLightning(ctx, w/2, h * 0.35, w/2 + 45, groundY + st.sisterY - 20, '#ef4444', 8);
          drawLightning(ctx, w/2, h * 0.35, w/2 + 45, groundY + st.sisterY - 20, '#ffffff', 2.8); // White hot core

          // Spawn a burst of curse particles on strike
          if (Math.random() < 0.6) {
            for (let k = 0; k < 6; k++) {
              spawnParticle(w/2 + 45, groundY + st.sisterY - 20, '#f87171', 'curse');
            }
          }
        }

        // 9. ELEMENTAL SHIELD SWIRL (Shielding/Mitigating the curse)
        if (elapsed >= 5.2 && elapsed < 6.2) {
          const shieldPulse = Math.sin(Date.now() * 0.015) * 0.15 + 0.65;
          ctx.save();
          ctx.strokeStyle = `rgba(34, 211, 238, ${shieldPulse})`;
          ctx.lineWidth = 7;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          // Shield arc over Slayer protecting Sister
          ctx.arc(w/2 + 5, groundY - 25, 48, -Math.PI * 0.85, Math.PI * 0.15);
          ctx.stroke();

          ctx.strokeStyle = `rgba(255, 255, 255, ${shieldPulse + 0.25})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(w/2 + 5, groundY - 25, 48, -Math.PI * 0.85, Math.PI * 0.15);
          ctx.stroke();
          ctx.restore();
        }

        // 10. PARTICLE UPDATES AND DRAWING
        particles.forEach(p => {
          if (p.life <= 0) return;
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          p.alpha = p.life / p.maxLife;

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // 11. VIOLENT RAIN STREAKS
        ctx.lineCap = 'round';
        rainDrops.forEach(r => {
          r.x -= r.speedX; r.y += r.speedY;
          if (r.y > h || r.x < -200) { r.y = -Math.random() * 200 - 50; r.x = Math.random() * w * 1.6; }
          ctx.strokeStyle = `rgba(200, 230, 255, ${r.opacity})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - r.speedX * 0.45, r.y + r.speedY * 0.45);
          ctx.stroke();
        });
      }

      // Restore camera shake before overlays
      ctx.restore();

      // --- ANIME-STYLE FLOATING TEXT OVERLAYS ---
      
      // A: Slayer floating text above head (Offset slightly for larger Slayer scale and position)
      if (elapsed >= 5.0 && elapsed < 6.0) {
        // "Hold on!"
        const alpha = Math.min(1.0, (elapsed - 5.0) * 4.0) * Math.max(0, 1.0 - (elapsed - 5.8) * 5.0);
        drawSubtitleText("Hold on!", w/2 - 35, groundY - 80, 16, '#ffffff', alpha);
      }
      
      if (elapsed >= 6.5 && elapsed < 8.5) {
        // "Nooo!"
        const alpha = Math.min(1.0, (elapsed - 6.5) * 4.0) * Math.max(0, 1.0 - (elapsed - 8.0) * 2.0);
        drawSubtitleText("Nooo!", w/2 - 35, groundY - 65, 18, '#ffffff', alpha);
      }

      // B: Shrine floating guidance text above the shrine
      if (elapsed >= 11.2 && elapsed < 13.0) {
        // "Reach the mountain shrine before dawn..."
        const alpha = Math.min(1.0, (elapsed - 11.2) * 3.0) * Math.max(0, 1.0 - (elapsed - 12.5) * 2.0);
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        drawSubtitleText("Reach the mountain shrine before dawn...", w/2, groundY - 145, 18, '#ffffff', alpha);
        ctx.restore();
      }

      if (elapsed >= 13.1 && elapsed < 15.0) {
        // "...to save her."
        const alpha = Math.min(1.0, (elapsed - 13.1) * 3.0) * Math.max(0, 1.0 - (elapsed - 14.5) * 2.0);
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        drawSubtitleText("...to save her.", w/2, groundY - 145, 18, '#ffffff', alpha);
        ctx.restore();
      }

      // 12. FADE TO BLACK & QUEST TEXT OVERLAY
      if (st.fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${st.fadeAlpha})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (elapsed >= 19.0 && st.textProgress > 0) {
        const text = "Reach the mountain shrine before dawn to save her.";
        const charsToShow = Math.floor(text.length * st.textProgress);
        const currentText = text.substring(0, charsToShow);

        const scaleFactor = 1.0 + (elapsed - 19.0) * 0.03;
        
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(scaleFactor, scaleFactor);

        const fontSize = Math.min(32, w * 0.045);
        ctx.font = `bold ${fontSize}px "Cinzel", "Times New Roman", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const alpha = Math.min(1.0, st.textProgress * 2.0);
        ctx.globalAlpha = alpha;

        const textGrad = ctx.createLinearGradient(0, -fontSize, 0, fontSize);
        textGrad.addColorStop(0, '#ffffff');
        textGrad.addColorStop(0.5, '#fef08a');
        textGrad.addColorStop(1, '#ea580c');

        const pulseGlow = Math.sin(st.time * 0.05) * 5 + 15;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = pulseGlow;
        ctx.fillStyle = textGrad;
        ctx.fillText(currentText, 0, 0);

        ctx.shadowBlur = 0;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
        ctx.strokeText(currentText, 0, 0);

        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
        ctx.fillText(currentText, 0, 0);

        ctx.restore();
      }

      // Natural end: settle on the Mountain Sagiri quest title, then hand off to home.
      if (elapsed >= 23.0) finish();

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      cleanupIntroAudio();
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full object-cover shadow-2xl" />

      {/* Skip — the intro is always skippable straight to the home screen. */}
      <button
        onClick={finish}
        className="absolute bottom-6 right-6 z-20 px-5 py-2 bg-black/50 hover:bg-black/70 border border-white/25 text-slate-200 hover:text-white rounded font-bold tracking-[0.2em] uppercase text-xs backdrop-blur transition-all shadow-lg"
      >
        Skip ▸
      </button>
    </div>
  );
}
