import React, { useState, useEffect, useRef } from 'react';

// --- MUSIC DATA SEQUENCES (Yokai Slicer Inspired, Unified Family) ---
const TRACKS = [
  {
    id: 'night-hunt-sprint',
    name: '🌙 Night Hunt Sprint',
    description: 'Original endless-runner chase music: urgent taiko pulses, a plucked D-minor ostinato, and a rising pentatonic hook built to loop without losing momentum.',
    baseBpm: 148,
    color: '#fb923c', // Ember orange
    filterFreq: 1450,
    percussion: {
      low: [0, 6, 8, 14, 16, 22, 24, 28, 30],
      high: [2, 4, 7, 10, 12, 15, 18, 20, 23, 26, 27, 29, 31],
      accent: [0, 16, 30]
    },
    notes: {
      bass: [
        { step: 0, pitch: 38, dur: 8 },  // D2
        { step: 8, pitch: 36, dur: 8 },  // C2
        { step: 16, pitch: 34, dur: 8 }, // Bb1
        { step: 24, pitch: 33, dur: 6 }, // A1
        { step: 30, pitch: 36, dur: 2 }  // C2 pickup
      ],
      mid: [
        // Tight shamisen-like ostinato; rests leave room for jumps, slices, and impacts.
        { step: 0, pitch: 50, dur: 1 }, { step: 2, pitch: 57, dur: 1 }, { step: 3, pitch: 53, dur: 1 }, { step: 5, pitch: 55, dur: 1 }, { step: 6, pitch: 57, dur: 1 },
        { step: 8, pitch: 48, dur: 1 }, { step: 10, pitch: 55, dur: 1 }, { step: 11, pitch: 52, dur: 1 }, { step: 13, pitch: 53, dur: 1 }, { step: 14, pitch: 55, dur: 1 },
        { step: 16, pitch: 46, dur: 1 }, { step: 18, pitch: 53, dur: 1 }, { step: 19, pitch: 50, dur: 1 }, { step: 21, pitch: 52, dur: 1 }, { step: 22, pitch: 53, dur: 1 },
        { step: 24, pitch: 45, dur: 1 }, { step: 26, pitch: 52, dur: 1 }, { step: 27, pitch: 50, dur: 1 }, { step: 28, pitch: 53, dur: 1 }, { step: 29, pitch: 55, dur: 1 }, { step: 30, pitch: 57, dur: 1 }, { step: 31, pitch: 60, dur: 1 }
      ],
      lead: [
        { step: 0, pitch: 62, dur: 3 },  // D4
        { step: 3, pitch: 65, dur: 2 },  // F4
        { step: 5, pitch: 67, dur: 3 },  // G4
        { step: 8, pitch: 69, dur: 4 },  // A4
        { step: 12, pitch: 67, dur: 2 }, // G4
        { step: 14, pitch: 65, dur: 2 }, // F4
        { step: 16, pitch: 62, dur: 3 }, // D4
        { step: 19, pitch: 65, dur: 2 }, // F4
        { step: 21, pitch: 69, dur: 3 }, // A4
        { step: 24, pitch: 72, dur: 4 }, // C5
        { step: 28, pitch: 69, dur: 2 }, // A4
        { step: 30, pitch: 74, dur: 2 }  // D5 turnaround
      ]
    }
  },
  {
    id: 'ember-rite',
    name: '🔥 Ember Rite',
    description: 'Tragic, dance-like driving rhythm representing family bonds, rising fire, and final resolve.',
    baseBpm: 120,
    color: '#ef4444', // Red
    filterFreq: 1000, // Warm, emotional tone
    notes: {
      bass: [
        { step: 0, pitch: 41, dur: 8 },  // F2
        { step: 8, pitch: 37, dur: 8 },  // Db2
        { step: 16, pitch: 39, dur: 8 }, // Eb2
        { step: 24, pitch: 36, dur: 8 }  // C2
      ],
      mid: [
        { step: 0, pitch: 53, dur: 2 },  // F3
        { step: 0, pitch: 56, dur: 2 },  // Ab3
        { step: 3, pitch: 53, dur: 2 },  // F3
        { step: 6, pitch: 60, dur: 2 },  // C4
        { step: 8, pitch: 49, dur: 2 },  // Db3
        { step: 8, pitch: 53, dur: 2 },  // F3
        { step: 11, pitch: 49, dur: 2 }, // Db3
        { step: 14, pitch: 56, dur: 2 }, // Ab3
        { step: 16, pitch: 51, dur: 2 }, // Eb3
        { step: 16, pitch: 55, dur: 2 }, // G3
        { step: 19, pitch: 51, dur: 2 }, // Eb3
        { step: 22, pitch: 58, dur: 2 }, // Bb3
        { step: 24, pitch: 48, dur: 2 }, // C3
        { step: 24, pitch: 52, dur: 2 }, // E3
        { step: 27, pitch: 48, dur: 2 }, // C3
        { step: 30, pitch: 55, dur: 2 }  // G3
      ],
      lead: [
        { step: 0, pitch: 72, dur: 4 },  // C5
        { step: 4, pitch: 73, dur: 4 },  // Db5
        { step: 6, pitch: 72, dur: 2 },  // C5
        { step: 8, pitch: 70, dur: 4 },  // Bb4
        { step: 12, pitch: 68, dur: 2 }, // Ab4
        { step: 14, pitch: 67, dur: 2 }, // G4
        { step: 16, pitch: 65, dur: 4 }, // F4
        { step: 20, pitch: 67, dur: 2 }, // G4
        { step: 22, pitch: 68, dur: 2 }, // Ab4
        { step: 24, pitch: 70, dur: 4 }, // Bb4
        { step: 28, pitch: 72, dur: 2 }, // C5
        { step: 30, pitch: 76, dur: 2 }  // E5
      ]
    }
  },
  {
    id: 'butterfly-dance',
    name: '🦋 Butterfly Dance',
    description: 'Fast, graceful, fluttering arpeggios that feel elegant but deadly. Inspired by the Insect Warden.',
    baseBpm: 135,
    color: '#a855f7', // Purple
    filterFreq: 1200, // Cohesive warm tone
    notes: {
      bass: [
        { step: 0, pitch: 40, dur: 8 },  // E2
        { step: 8, pitch: 36, dur: 8 },  // C2
        { step: 16, pitch: 38, dur: 8 }, // D2
        { step: 24, pitch: 35, dur: 8 }  // B1
      ],
      mid: [
        // Fast continuous fluttering arpeggios
        { step: 0, pitch: 52, dur: 1 }, { step: 1, pitch: 55, dur: 1 }, { step: 2, pitch: 59, dur: 1 }, { step: 3, pitch: 55, dur: 1 },
        { step: 4, pitch: 52, dur: 1 }, { step: 5, pitch: 55, dur: 1 }, { step: 6, pitch: 59, dur: 1 }, { step: 7, pitch: 55, dur: 1 },
        { step: 8, pitch: 48, dur: 1 }, { step: 9, pitch: 52, dur: 1 }, { step: 10, pitch: 55, dur: 1 }, { step: 11, pitch: 52, dur: 1 },
        { step: 12, pitch: 48, dur: 1 }, { step: 13, pitch: 52, dur: 1 }, { step: 14, pitch: 55, dur: 1 }, { step: 15, pitch: 52, dur: 1 },
        { step: 16, pitch: 50, dur: 1 }, { step: 17, pitch: 54, dur: 1 }, { step: 18, pitch: 57, dur: 1 }, { step: 19, pitch: 54, dur: 1 },
        { step: 20, pitch: 50, dur: 1 }, { step: 21, pitch: 54, dur: 1 }, { step: 22, pitch: 57, dur: 1 }, { step: 23, pitch: 54, dur: 1 },
        { step: 24, pitch: 47, dur: 1 }, { step: 25, pitch: 51, dur: 1 }, { step: 26, pitch: 54, dur: 1 }, { step: 27, pitch: 51, dur: 1 },
        { step: 28, pitch: 47, dur: 1 }, { step: 29, pitch: 51, dur: 1 }, { step: 30, pitch: 54, dur: 1 }, { step: 31, pitch: 51, dur: 1 }
      ],
      lead: [
        { step: 0, pitch: 76, dur: 6 },  // E5
        { step: 6, pitch: 79, dur: 2 },  // G5
        { step: 8, pitch: 76, dur: 4 },  // E5
        { step: 12, pitch: 71, dur: 4 }, // B4
        { step: 16, pitch: 74, dur: 6 }, // D5
        { step: 22, pitch: 76, dur: 2 }, // E5
        { step: 24, pitch: 71, dur: 8 }  // B4
      ]
    }
  },
  {
    id: 'upper-moon',
    name: '🌑 Upper Rank Presence',
    description: 'Deep, slow, terrifying, and atmospheric. Heavy low drones contrasting with eerie, sparse dissonant bells.',
    baseBpm: 90,
    color: '#10b981', // Emerald Dark
    filterFreq: 600,  // Very dark, muffled tone
    notes: {
      bass: [
        { step: 0, pitch: 36, dur: 16 }, // C2 (Deep drone)
        { step: 16, pitch: 32, dur: 16 } // Ab1 (Dark shift)
      ],
      mid: [
        { step: 0, pitch: 48, dur: 8 },  // C3
        { step: 0, pitch: 51, dur: 8 },  // Eb3
        { step: 8, pitch: 47, dur: 8 },  // B2 (Tension)
        { step: 16, pitch: 44, dur: 8 }, // Ab2
        { step: 16, pitch: 48, dur: 8 }, // C3
        { step: 24, pitch: 43, dur: 8 }  // G2
      ],
      lead: [
        { step: 4, pitch: 74, dur: 2 },  // D5 (Eerie dissonance)
        { step: 12, pitch: 75, dur: 4 }, // Eb5
        { step: 20, pitch: 71, dur: 2 }, // B4
        { step: 28, pitch: 72, dur: 4 }  // C5
      ]
    }
  },
  {
    id: 'spirit-shrine',
    name: '🌸 Spirit Shrine',
    description: 'Traditional Japanese ambiance. A very low, dark piano anchors a dense, soaring melody.',
    baseBpm: 75,
    color: '#f472b6', // Pink
    filterFreq: 800, // Very dark piano
    notes: {
      bass: [
        { step: 0, pitch: 26, dur: 16 }, // D1
        { step: 16, pitch: 21, dur: 16 } // A0 (Sub low)
      ],
      mid: [
        { step: 0, pitch: 45, dur: 8 },  // A2
        { step: 0, pitch: 50, dur: 8 },  // D3
        { step: 0, pitch: 52, dur: 8 },  // E3
        { step: 8, pitch: 53, dur: 8 },  // F3
        { step: 8, pitch: 57, dur: 8 },  // A3
        { step: 16, pitch: 38, dur: 8 }, // D2
        { step: 16, pitch: 40, dur: 8 }, // E2
        { step: 16, pitch: 45, dur: 8 }, // A2
        { step: 24, pitch: 46, dur: 8 }, // Bb2
        { step: 24, pitch: 50, dur: 8 }  // D3
      ],
      lead: [
        { step: 0, pitch: 69, dur: 4 },  // A4
        { step: 4, pitch: 70, dur: 2 },  // Bb4
        { step: 6, pitch: 69, dur: 2 },  // A4
        { step: 8, pitch: 65, dur: 8 },  // F4 
        { step: 16, pitch: 74, dur: 4 }, // D5
        { step: 20, pitch: 76, dur: 4 }, // E5
        { step: 24, pitch: 74, dur: 8 }  // D5
      ]
    }
  },
  {
    id: 'wisteria-rest',
    name: '🍵 Wisteria Rest',
    description: 'A simple, soothing, and warm music box melody. Perfect for safe zones, the shop, or the pause menu.',
    baseBpm: 85,
    color: '#fcd34d', // Amber
    filterFreq: 1200, // Very soft and warm
    notes: {
      bass: [
        { step: 0, pitch: 43, dur: 16 }, // G2
        { step: 16, pitch: 40, dur: 16 } // E2
      ],
      mid: [
        { step: 0, pitch: 50, dur: 4 },  // D3
        { step: 0, pitch: 55, dur: 4 },  // G3
        { step: 4, pitch: 57, dur: 4 },  // A3
        { step: 8, pitch: 59, dur: 4 },  // B3
        { step: 12, pitch: 55, dur: 4 }, // G3
        { step: 16, pitch: 47, dur: 4 }, // B2
        { step: 16, pitch: 52, dur: 4 }, // E3
        { step: 20, pitch: 55, dur: 4 }, // G3
        { step: 24, pitch: 57, dur: 4 }, // A3
        { step: 28, pitch: 52, dur: 4 }  // E3
      ],
      lead: [
        { step: 2, pitch: 74, dur: 4 },  // D5
        { step: 10, pitch: 71, dur: 4 }, // B4
        { step: 18, pitch: 79, dur: 4 }, // G5
        { step: 26, pitch: 76, dur: 4 }  // E5
      ]
    }
  }
];

export const BackgroundMusicMock = () => {
  // --- UI STATES ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [volume, setVolume] = useState(0.65);
  
  // Audio state
  const [activeStep, setActiveStep] = useState(-1);
  const [currentBpm, setCurrentBpm] = useState(120);

  // --- AUDIO REFS ---
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const compressorRef = useRef(null);
  const analyserRef = useRef(null);

  // Timing/Scheduler Refs
  const nextNoteTimeRef = useRef(0.0);
  const currentStepRef = useRef(0);
  const schedulerTimerIdRef = useRef(null);
  const activeNotesRef = useRef([]); // Stores { pitch, time, duration, color }

  // Canvas Refs
  const notesCanvasRef = useRef(null);
  const waveCanvasRef = useRef(null);

  const activeTrack = TRACKS[currentTrackIndex];
  
  // Update dynamic BPM
  useEffect(() => {
    setCurrentBpm(Math.round(activeTrack.baseBpm * speedMultiplier));
  }, [currentTrackIndex, speedMultiplier, activeTrack.baseBpm]);

  // --- AUDIO SYNTH ENGINE INITIALIZATION ---
  const initAudio = () => {
    if (audioCtxRef.current) return;
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Master volume gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGainRef.current = masterGain;

    // Gentle, high-quality Dynamics Compressor.
    // This prevents ANY digital clipping and acts as a smooth glue for the mix.
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, ctx.currentTime); 
    compressor.knee.setValueAtTime(15, ctx.currentTime);       // Very soft knee
    compressor.ratio.setValueAtTime(2.5, ctx.currentTime);     // Transparent ratio
    compressor.attack.setValueAtTime(0.01, ctx.currentTime);   // 10ms
    compressor.release.setValueAtTime(0.2, ctx.currentTime);   // 200ms
    compressorRef.current = compressor;

    // Analyser node for visualizers
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Audio Routing (UNIFIED DRY MIX):
    // Voice Out -> Compressor -> Master Gain -> Analyser -> Speakers
    // NOTE: All delay/echo has been removed for a unified, intimate game sound.
    compressor.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
  };

  // Keep volume gain updated smoothly
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        volume,
        audioCtxRef.current.currentTime,
        0.1
      );
    }
  }, [volume]);

  // Translate MIDI note to frequency
  const midiToFreq = (midi) => {
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  // --- PURE, CRYSTAL-CLEAR UNIFIED SYNTHESIS VOICE ---
  // Every track uses this exact same instrument so they sound like one cohesive game.
  const playCleanNote = (pitch, time, duration, voice, trackDef) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const freq = midiToFreq(pitch);
    const noteGain = ctx.createGain();
    
    // Massive headroom to prevent clipping. 
    // Bass gets slightly more volume, mids get less.
    let peakVolume = 0.12; 
    if (voice === 'bass') peakVolume = 0.18;
    if (voice === 'mid') peakVolume = 0.08;

    // Create oscillators for a pure, warm, bell-like piano tone
    const osc1 = ctx.createOscillator(); // Fundamental
    const osc2 = ctx.createOscillator(); // 1st Harmonic (Octave)
    const osc3 = ctx.createOscillator(); // Perfect Harmonic ring

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, time); // Perfect harmonic, no harsh detune

    const g1 = ctx.createGain(); g1.gain.value = 0.6;
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    const g3 = ctx.createGain(); g3.gain.value = 0.1;

    osc1.connect(g1); osc2.connect(g2); osc3.connect(g3);
    g1.connect(noteGain); g2.connect(noteGain); g3.connect(noteGain);

    // Filter to warm up the sound based on track theme
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(trackDef.filterFreq, time);
    // Smooth, slow closing filter envelope for organic sound
    filter.frequency.exponentialRampToValueAtTime(300, time + duration + 0.5);

    noteGain.connect(filter);
    
    // Connect directly to the gentle compressor
    filter.connect(compressorRef.current);

    // --- FLAWLESS CLICK-FREE ADSR ENVELOPE ---
    const attack = 0.015; // 15ms linear attack completely removes front clicks
    const release = 0.2;  // 200ms linear release removes end clicks
    
    // Start exactly at 0
    noteGain.gain.setValueAtTime(0, time);
    // Smooth swell up
    noteGain.gain.linearRampToValueAtTime(peakVolume, time + attack);
    
    // Decay gently to a sustain level
    const sustainLevel = peakVolume * 0.4;
    noteGain.gain.exponentialRampToValueAtTime(sustainLevel, time + attack + 0.3);
    
    // Hold sustain until duration ends
    noteGain.gain.setValueAtTime(sustainLevel, time + duration);
    
    // Smooth linear fade out to absolute zero
    noteGain.gain.linearRampToValueAtTime(0.0001, time + duration + release);
    noteGain.gain.linearRampToValueAtTime(0, time + duration + release + 0.05);

    // Stop oscillators safely AFTER the volume has hit zero
    const stopTime = time + duration + release + 0.1;
    osc1.start(time); osc2.start(time); osc3.start(time);
    osc1.stop(stopTime); osc2.stop(stopTime); osc3.stop(stopTime);

    // Save for visualizer
    activeNotesRef.current.push({
      pitch,
      voice,
      startTime: time,
      duration: duration,
      endTime: time + duration,
      color: voice === 'lead' ? trackDef.color : (voice === 'mid' ? 'rgba(255,255,255,0.4)' : '#334155')
    });
  };

  // Short synthesized drum voices keep the runner pulse readable without audio files.
  const playPercussion = (kind, time, trackDef) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !compressorRef.current) return;

    const hitGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(kind === 'high' ? 2200 : 700, time);
    hitGain.connect(filter);
    filter.connect(compressorRef.current);

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
    for (let i = 0; i < noise.length; i += 1) {
      noise[i] = (Math.random() * 2 - 1) * (1 - i / noise.length);
    }
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.connect(hitGain);
    filter.type = kind === 'accent' ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(kind === 'accent' ? 950 : 1800, time);
    hitGain.gain.setValueAtTime(kind === 'accent' ? 0.13 : 0.055, time);
    hitGain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    source.start(time);
    source.stop(time + length);

    activeNotesRef.current.push({
      pitch: kind === 'accent' ? 82 : 80,
      voice: 'percussion',
      startTime: time,
      duration: length,
      endTime: time + length,
      color: trackDef.color
    });
  };

  // --- SCHEDULER ENGINE ---
  const scheduleAheadTime = 0.15;
  const lookaheadInterval = 35.0;

  const advanceStep = () => {
    const activeBpm = activeTrack.baseBpm * speedMultiplier;
    const stepDuration = 60.0 / activeBpm / 4.0;
    
    nextNoteTimeRef.current += stepDuration;
    currentStepRef.current = (currentStepRef.current + 1) % 32;
  };

  const scheduleStep = (step, time) => {
    const trackDef = activeTrack;

    if (trackDef.percussion) {
      ['low', 'high', 'accent'].forEach(kind => {
        if (trackDef.percussion[kind].includes(step)) {
          playPercussion(kind, time, trackDef);
        }
      });
    }

    // Bass
    const bassNotes = activeTrack.notes.bass.filter(n => n.step === step);
    bassNotes.forEach(note => {
      const activeBpm = activeTrack.baseBpm * speedMultiplier;
      const durSec = (note.dur * (60.0 / activeBpm / 4.0)) * 0.95;
      playCleanNote(note.pitch, time, durSec, 'bass', trackDef);
    });

    // Mid
    const midNotes = activeTrack.notes.mid.filter(n => n.step === step);
    midNotes.forEach(note => {
      const activeBpm = activeTrack.baseBpm * speedMultiplier;
      const durSec = (note.dur * (60.0 / activeBpm / 4.0)) * 0.95;
      playCleanNote(note.pitch, time, durSec, 'mid', trackDef);
    });

    // Lead
    const leadNotes = activeTrack.notes.lead.filter(n => n.step === step);
    leadNotes.forEach(note => {
      const activeBpm = activeTrack.baseBpm * speedMultiplier;
      const durSec = (note.dur * (60.0 / activeBpm / 4.0)) * 0.95;
      playCleanNote(note.pitch, time, durSec, 'lead', trackDef);
    });

    // Highlight beats in step grid
    setTimeout(() => {
      if (isPlaying) {
        setActiveStep(step);
      }
    }, Math.max(0, (time - audioCtxRef.current.currentTime) * 1000));
  };

  const runScheduler = () => {
    if (!isPlaying || !audioCtxRef.current) return;
    
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      scheduleStep(currentStepRef.current, nextNoteTimeRef.current);
      advanceStep();
    }
  };

  const handlePlayToggle = () => {
    initAudio();
    const ctx = audioCtxRef.current;

    if (isPlaying) {
      setIsPlaying(false);
      setActiveStep(-1);
      if (schedulerTimerIdRef.current) clearInterval(schedulerTimerIdRef.current);
    } else {
      if (ctx.state === 'suspended') ctx.resume();
      activeNotesRef.current = [];
      currentStepRef.current = 0;
      nextNoteTimeRef.current = ctx.currentTime + 0.05;
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      schedulerTimerIdRef.current = setInterval(runScheduler, lookaheadInterval);
    } else {
      if (schedulerTimerIdRef.current) clearInterval(schedulerTimerIdRef.current);
    }
    return () => {
      if (schedulerTimerIdRef.current) clearInterval(schedulerTimerIdRef.current);
    };
  }, [isPlaying, currentTrackIndex, speedMultiplier]);

  useEffect(() => {
    return () => {
      if (schedulerTimerIdRef.current) clearInterval(schedulerTimerIdRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // --- CANVAS NOTES VISUALIZER ---
  useEffect(() => {
    const canvas = notesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let animationId;
    const startMidi = 32;
    const endMidi = 84;
    const noteCount = endMidi - startMidi + 1;

    const isBlackKey = (midi) => {
      const pitch = midi % 12;
      return [1, 3, 6, 8, 10].includes(pitch);
    };

    const draw = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
      ctx.lineWidth = 1 * dpr;
      const keyWidth = W / noteCount;

      for (let i = 0; i <= noteCount; i++) {
        const x = i * keyWidth;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H - 45 * dpr); ctx.stroke();
      }

      const audioTime = audioCtxRef.current ? audioCtxRef.current.currentTime : 0;
      
      if (activeNotesRef.current.length > 250) {
        activeNotesRef.current = activeNotesRef.current.filter(n => n.endTime > audioTime - 3.0);
      }

      const scrollSpeed = 90 * dpr;
      const keyboardY = H - 50 * dpr;

      activeNotesRef.current.forEach(note => {
        const yBottom = keyboardY - (note.startTime - audioTime) * scrollSpeed;
        const yTop = keyboardY - (note.endTime - audioTime) * scrollSpeed;

        const noteIndex = note.pitch - startMidi;
        if (noteIndex < 0 || noteIndex >= noteCount) return;

        const x = noteIndex * keyWidth;

        ctx.fillStyle = note.color;
        if (note.voice === 'lead') {
          ctx.shadowBlur = 8 * dpr;
          ctx.shadowColor = note.color;
        }

        const rHeight = Math.max(3 * dpr, yBottom - yTop);
        const padX = 1.5 * dpr;
        
        ctx.beginPath();
        ctx.roundRect(x + padX, yTop, keyWidth - padX * 2, rHeight, 2 * dpr);
        ctx.fill();

        ctx.shadowBlur = 0;
      });

      const activePitches = activeNotesRef.current
        .filter(n => audioTime >= n.startTime && audioTime <= n.endTime)
        .map(n => n.pitch);

      for (let m = startMidi; m <= endMidi; m++) {
        if (isBlackKey(m)) continue;
        const noteIndex = m - startMidi;
        const x = noteIndex * keyWidth;
        const isActive = activePitches.includes(m);

        ctx.fillStyle = isActive ? activeTrack.color : '#e2e8f0';
        ctx.fillRect(x, keyboardY, keyWidth - 0.5 * dpr, H - keyboardY);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5 * dpr;
        ctx.strokeRect(x, keyboardY, keyWidth - 0.5 * dpr, H - keyboardY);
      }

      const blackKeyHeight = (H - keyboardY) * 0.62;
      for (let m = startMidi; m <= endMidi; m++) {
        if (!isBlackKey(m)) continue;
        const noteIndex = m - startMidi;
        const x = noteIndex * keyWidth;
        const isActive = activePitches.includes(m);

        ctx.fillStyle = isActive ? '#ef4444' : '#1e293b';
        ctx.fillRect(x - keyWidth * 0.25, keyboardY, keyWidth * 0.55, blackKeyHeight);
        
        ctx.strokeStyle = '#020617';
        ctx.strokeRect(x - keyWidth * 0.25, keyboardY, keyWidth * 0.55, blackKeyHeight);
      }

      if (isPlaying && speedMultiplier > 1.2) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(speedMultiplier - 1.0) * 0.1})`;
        for (let i = 0; i < 2; i++) {
          const px = Math.random() * W;
          const py = Math.random() * keyboardY;
          const pLen = (15 + Math.random() * 30) * speedMultiplier * dpr;
          const pThick = 0.8 * dpr;
          ctx.fillRect(px, py, pThick, pLen);
        }
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath(); ctx.moveTo(0, keyboardY); ctx.lineTo(W, keyboardY); ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [currentTrackIndex, speedMultiplier, isPlaying]);

  // --- WAVEFORM OSCILLOSCOPE ---
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let animationId;

    const drawWave = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 1.2 * dpr;
        ctx.strokeStyle = activeTrack.color;
        
        ctx.beginPath();
        const sliceWidth = W / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * H) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.lineTo(W, H / 2);
        ctx.stroke();
      } else {
        ctx.lineWidth = 1.0 * dpr;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      }

      animationId = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => cancelAnimationFrame(animationId);
  }, [currentTrackIndex, isPlaying]);

  return (
    <div className="flex h-full w-full flex-col bg-[#0b0f19] text-slate-200 overflow-y-auto">
      {/* HEADER */}
      <div className="border-b border-slate-900 bg-[#0e1321] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-md font-black tracking-widest text-white uppercase flex items-center gap-2">
            <span className="text-red-500 animate-pulse">●</span> Premium BGM Studio
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Unified "One Game" Soundtrack. Crystal-clear, cohesive audio synthesis.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePlayToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all duration-200 border ${
              isPlaying
                ? 'bg-red-950/80 text-red-400 border-red-500/40 hover:bg-red-900/90'
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/90'
            }`}
          >
            {isPlaying ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
                Stop BGM
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play Loop
              </>
            )}
          </button>
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 min-h-0">
        
        {/* LEFT COLUMN: SOUND CONTROLS & DESCRIPTION (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* TRACK SELECTOR */}
          <div className="rounded border border-slate-900 bg-[#0e1321]/60 p-4">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Select Theme Melody</span>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(1, minmax(120px, 1fr))' }}>
              {TRACKS.map((t, idx) => {
                const isSelected = idx === currentTrackIndex;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTrackIndex(idx);
                      if (isPlaying && audioCtxRef.current) {
                        currentStepRef.current = 0;
                        nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.02;
                      }
                    }}
                    style={{ borderColor: isSelected ? t.color : 'transparent' }}
                    className={`flex flex-col items-start p-3 rounded border text-left transition-all ${
                      isSelected
                        ? 'bg-[#151c30] text-white font-bold'
                        : 'bg-slate-950/55 text-slate-400 border-slate-900 hover:bg-[#151c30]/50'
                    }`}
                  >
                    <span className="text-xs font-black">{t.name}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 rounded bg-slate-950/70 p-3.5 border border-slate-900/60">
              <p className="text-[11px] leading-relaxed text-slate-400">
                <span className="font-bold uppercase text-[9px] tracking-wider block mb-1 text-slate-300">About this theme:</span>
                {activeTrack.description}
              </p>
            </div>
          </div>

          {/* RUNNER SPEED / TEMPO RAMPING */}
          <div className="rounded border border-slate-900 bg-[#0e1321]/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Speed Multiplier</span>
              <span className="text-xs font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                {currentBpm} BPM ({speedMultiplier.toFixed(1)}x)
              </span>
            </div>
            <div className="mt-3">
              <input
                id="speed-ramper"
                type="range"
                min="0.6"
                max="2.2"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* MASTER VOLUME */}
          <div className="rounded border border-slate-900 bg-[#0e1321]/60 p-4 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Master Volume</span>
              <span className="text-xs font-mono text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-slate-400 bg-slate-950 h-1.5 rounded cursor-pointer mt-3"
            />
          </div>

        </div>

        {/* RIGHT COLUMN: VISUALIZERS & STEP TRACKER (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* STEP PROGRESS GRID */}
          <div className="rounded border border-slate-900 bg-[#0e1321]/60 p-4">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Sequence Beat Position (32 Steps)</span>
            <div className="grid gap-1 mt-2.5" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
              {Array.from({ length: 32 }).map((_, stepIdx) => {
                const isActive = stepIdx === activeStep;
                const isBarStart = stepIdx % 8 === 0;
                const isQuarterNote = stepIdx % 4 === 0;

                let borderCol = 'border-slate-900';
                if (isActive) borderCol = 'border-white scale-110';
                else if (isBarStart) borderCol = 'border-slate-600';
                else if (isQuarterNote) borderCol = 'border-slate-800';

                let bgCol = 'bg-slate-950/70';
                if (isActive) bgCol = 'bg-white';
                
                const hasLeadNote = activeTrack.notes.lead.some(n => n.step === stepIdx);
                const hasMidNote = activeTrack.notes.mid.some(n => n.step === stepIdx);
                if (!isActive && hasLeadNote) bgCol = 'bg-[#151c30]';
                else if (!isActive && hasMidNote) bgCol = 'bg-slate-900';

                return (
                  <div
                    key={stepIdx}
                    title={`Step ${stepIdx + 1}`}
                    className={`aspect-square w-full rounded border flex items-center justify-center transition-all ${bgCol} ${borderCol}`}
                  >
                    {isActive ? (
                      <span className="w-1 h-1 rounded-full bg-slate-950 animate-ping" />
                    ) : isBarStart ? (
                      <span className="w-0.5 h-0.5 rounded-full bg-slate-500" />
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-slate-600 mt-1.5 font-mono px-0.5">
              <span>Bar 1</span>
              <span>Bar 2</span>
              <span>Bar 3</span>
              <span>Bar 4</span>
            </div>
          </div>

          {/* MIDI ROLL CANVAS */}
          <div className="flex-1 rounded bg-[#090d16] border border-slate-900 p-1 flex flex-col relative min-h-[300px]">
            <span className="absolute top-3 left-4 text-[9px] font-black uppercase text-white/30 tracking-widest pointer-events-none z-10">
              Interactive Piano Visualizer
            </span>
            {(!isPlaying) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090d16]/95 text-center p-6 z-10">
                <svg className="w-8 h-8 text-slate-700 animate-pulse mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 0L21 8.25M19.5 6V18a3 3 0 10-6 0v1.5a3 3 0 003 3H21A1.5 1.5 0 0022.5 21v-3.75a3 3 0 00-3-3zM9 9L4.5 10.5m0 0L1.5 12m3-1.5V18a3 3 0 10-6 0v1.5a3 3 0 003 3H9a1.5 1.5 0 001.5-1.5V15a3 3 0 00-3-3z" />
                </svg>
                <h4 className="text-xs font-bold text-slate-400">Audio Engine Standby</h4>
                <p className="text-[10px] text-slate-600 max-w-xs mt-1 leading-normal">
                  Click <strong>Play Loop</strong> to initialize the high-fidelity synth engine.
                </p>
              </div>
            )}
            <canvas ref={notesCanvasRef} className="w-full h-full rounded flex-1 cursor-crosshair" />
          </div>

          {/* LIVE WAVEFORM */}
          <div className="h-[75px] rounded bg-slate-950 border border-slate-900/60 p-1 flex flex-col relative">
            <span className="absolute top-1.5 left-3 text-[9px] font-black uppercase text-slate-600 tracking-widest pointer-events-none z-10">
              Waveform Oscilloscope
            </span>
            <canvas ref={waveCanvasRef} className="w-full h-full rounded border border-slate-900/30 flex-1" />
          </div>

        </div>

      </div>
    </div>
  );
};
