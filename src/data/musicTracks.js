// Authored BGM note/percussion data, ported verbatim from the Background Music
// Lab mock (BackgroundMusicMock.jsx). This is structural content (like
// yokaiShapes.js / biomeSchedule.js), not balance config — the biome→track map
// and crossfade timings live in data/config.json under `audio`.
//
// Each track is a 32-step loop of MIDI step data rendered by MusicSystem's single
// shared synth voice (playCleanNote) + playPercussion. `src` is an optional audio
// URL: when set, MusicSystem streams the looped file through musicBus instead of
// running the synth sequencer (same crossfade voices).

import darkPianoUrl from '../../Assets/mondamusic-dark-crime-piano-drama-529577.mp3';

export const TRACKS = [
  {
    // Real recording streamed for the run (test track). Has no note data — the
    // `src` makes MusicSystem loop the file instead of sequencing.
    id: 'dark-piano',
    name: '🎹 Dark Crime Piano',
    baseBpm: 90,
    color: '#64748b',
    filterFreq: 1000,
    src: darkPianoUrl,
    notes: { bass: [], mid: [], lead: [] },
  },
  {
    id: 'night-hunt-sprint',
    name: '🌙 Night Hunt Sprint',
    baseBpm: 148,
    color: '#fb923c',
    filterFreq: 1450,
    src: null,
    percussion: {
      low: [0, 6, 8, 14, 16, 22, 24, 28, 30],
      high: [2, 4, 7, 10, 12, 15, 18, 20, 23, 26, 27, 29, 31],
      accent: [0, 16, 30],
    },
    notes: {
      bass: [
        { step: 0, pitch: 38, dur: 8 },
        { step: 8, pitch: 36, dur: 8 },
        { step: 16, pitch: 34, dur: 8 },
        { step: 24, pitch: 33, dur: 6 },
        { step: 30, pitch: 36, dur: 2 },
      ],
      mid: [
        { step: 0, pitch: 50, dur: 1 }, { step: 2, pitch: 57, dur: 1 }, { step: 3, pitch: 53, dur: 1 }, { step: 5, pitch: 55, dur: 1 }, { step: 6, pitch: 57, dur: 1 },
        { step: 8, pitch: 48, dur: 1 }, { step: 10, pitch: 55, dur: 1 }, { step: 11, pitch: 52, dur: 1 }, { step: 13, pitch: 53, dur: 1 }, { step: 14, pitch: 55, dur: 1 },
        { step: 16, pitch: 46, dur: 1 }, { step: 18, pitch: 53, dur: 1 }, { step: 19, pitch: 50, dur: 1 }, { step: 21, pitch: 52, dur: 1 }, { step: 22, pitch: 53, dur: 1 },
        { step: 24, pitch: 45, dur: 1 }, { step: 26, pitch: 52, dur: 1 }, { step: 27, pitch: 50, dur: 1 }, { step: 28, pitch: 53, dur: 1 }, { step: 29, pitch: 55, dur: 1 }, { step: 30, pitch: 57, dur: 1 }, { step: 31, pitch: 60, dur: 1 },
      ],
      lead: [
        { step: 0, pitch: 62, dur: 3 },
        { step: 3, pitch: 65, dur: 2 },
        { step: 5, pitch: 67, dur: 3 },
        { step: 8, pitch: 69, dur: 4 },
        { step: 12, pitch: 67, dur: 2 },
        { step: 14, pitch: 65, dur: 2 },
        { step: 16, pitch: 62, dur: 3 },
        { step: 19, pitch: 65, dur: 2 },
        { step: 21, pitch: 69, dur: 3 },
        { step: 24, pitch: 72, dur: 4 },
        { step: 28, pitch: 69, dur: 2 },
        { step: 30, pitch: 74, dur: 2 },
      ],
    },
  },
  {
    id: 'hinokami-kagura',
    name: '🔥 Hinokami Kagura',
    baseBpm: 120,
    color: '#ef4444',
    filterFreq: 1000,
    src: null,
    notes: {
      bass: [
        { step: 0, pitch: 41, dur: 8 },
        { step: 8, pitch: 37, dur: 8 },
        { step: 16, pitch: 39, dur: 8 },
        { step: 24, pitch: 36, dur: 8 },
      ],
      mid: [
        { step: 0, pitch: 53, dur: 2 }, { step: 0, pitch: 56, dur: 2 }, { step: 3, pitch: 53, dur: 2 }, { step: 6, pitch: 60, dur: 2 },
        { step: 8, pitch: 49, dur: 2 }, { step: 8, pitch: 53, dur: 2 }, { step: 11, pitch: 49, dur: 2 }, { step: 14, pitch: 56, dur: 2 },
        { step: 16, pitch: 51, dur: 2 }, { step: 16, pitch: 55, dur: 2 }, { step: 19, pitch: 51, dur: 2 }, { step: 22, pitch: 58, dur: 2 },
        { step: 24, pitch: 48, dur: 2 }, { step: 24, pitch: 52, dur: 2 }, { step: 27, pitch: 48, dur: 2 }, { step: 30, pitch: 55, dur: 2 },
      ],
      lead: [
        { step: 0, pitch: 72, dur: 4 },
        { step: 4, pitch: 73, dur: 4 },
        { step: 6, pitch: 72, dur: 2 },
        { step: 8, pitch: 70, dur: 4 },
        { step: 12, pitch: 68, dur: 2 },
        { step: 14, pitch: 67, dur: 2 },
        { step: 16, pitch: 65, dur: 4 },
        { step: 20, pitch: 67, dur: 2 },
        { step: 22, pitch: 68, dur: 2 },
        { step: 24, pitch: 70, dur: 4 },
        { step: 28, pitch: 72, dur: 2 },
        { step: 30, pitch: 76, dur: 2 },
      ],
    },
  },
  {
    id: 'butterfly-dance',
    name: '🦋 Butterfly Dance',
    baseBpm: 135,
    color: '#a855f7',
    filterFreq: 1200,
    src: null,
    notes: {
      bass: [
        { step: 0, pitch: 40, dur: 8 },
        { step: 8, pitch: 36, dur: 8 },
        { step: 16, pitch: 38, dur: 8 },
        { step: 24, pitch: 35, dur: 8 },
      ],
      mid: [
        { step: 0, pitch: 52, dur: 1 }, { step: 1, pitch: 55, dur: 1 }, { step: 2, pitch: 59, dur: 1 }, { step: 3, pitch: 55, dur: 1 },
        { step: 4, pitch: 52, dur: 1 }, { step: 5, pitch: 55, dur: 1 }, { step: 6, pitch: 59, dur: 1 }, { step: 7, pitch: 55, dur: 1 },
        { step: 8, pitch: 48, dur: 1 }, { step: 9, pitch: 52, dur: 1 }, { step: 10, pitch: 55, dur: 1 }, { step: 11, pitch: 52, dur: 1 },
        { step: 12, pitch: 48, dur: 1 }, { step: 13, pitch: 52, dur: 1 }, { step: 14, pitch: 55, dur: 1 }, { step: 15, pitch: 52, dur: 1 },
        { step: 16, pitch: 50, dur: 1 }, { step: 17, pitch: 54, dur: 1 }, { step: 18, pitch: 57, dur: 1 }, { step: 19, pitch: 54, dur: 1 },
        { step: 20, pitch: 50, dur: 1 }, { step: 21, pitch: 54, dur: 1 }, { step: 22, pitch: 57, dur: 1 }, { step: 23, pitch: 54, dur: 1 },
        { step: 24, pitch: 47, dur: 1 }, { step: 25, pitch: 51, dur: 1 }, { step: 26, pitch: 54, dur: 1 }, { step: 27, pitch: 51, dur: 1 },
        { step: 28, pitch: 47, dur: 1 }, { step: 29, pitch: 51, dur: 1 }, { step: 30, pitch: 54, dur: 1 }, { step: 31, pitch: 51, dur: 1 },
      ],
      lead: [
        { step: 0, pitch: 76, dur: 6 },
        { step: 6, pitch: 79, dur: 2 },
        { step: 8, pitch: 76, dur: 4 },
        { step: 12, pitch: 71, dur: 4 },
        { step: 16, pitch: 74, dur: 6 },
        { step: 22, pitch: 76, dur: 2 },
        { step: 24, pitch: 71, dur: 8 },
      ],
    },
  },
  {
    id: 'upper-moon',
    name: '🌑 Upper Rank Presence',
    baseBpm: 90,
    color: '#10b981',
    filterFreq: 600,
    src: null,
    notes: {
      bass: [
        { step: 0, pitch: 36, dur: 16 },
        { step: 16, pitch: 32, dur: 16 },
      ],
      mid: [
        { step: 0, pitch: 48, dur: 8 }, { step: 0, pitch: 51, dur: 8 },
        { step: 8, pitch: 47, dur: 8 },
        { step: 16, pitch: 44, dur: 8 }, { step: 16, pitch: 48, dur: 8 },
        { step: 24, pitch: 43, dur: 8 },
      ],
      lead: [
        { step: 4, pitch: 74, dur: 2 },
        { step: 12, pitch: 75, dur: 4 },
        { step: 20, pitch: 71, dur: 2 },
        { step: 28, pitch: 72, dur: 4 },
      ],
    },
  },
  {
    id: 'spirit-shrine',
    name: '🌸 Spirit Shrine',
    baseBpm: 75,
    color: '#f472b6',
    filterFreq: 800,
    src: null,
    notes: {
      bass: [
        { step: 0, pitch: 26, dur: 16 },
        { step: 16, pitch: 21, dur: 16 },
      ],
      mid: [
        { step: 0, pitch: 45, dur: 8 }, { step: 0, pitch: 50, dur: 8 }, { step: 0, pitch: 52, dur: 8 },
        { step: 8, pitch: 53, dur: 8 }, { step: 8, pitch: 57, dur: 8 },
        { step: 16, pitch: 38, dur: 8 }, { step: 16, pitch: 40, dur: 8 }, { step: 16, pitch: 45, dur: 8 },
        { step: 24, pitch: 46, dur: 8 }, { step: 24, pitch: 50, dur: 8 },
      ],
      lead: [
        { step: 0, pitch: 69, dur: 4 },
        { step: 4, pitch: 70, dur: 2 },
        { step: 6, pitch: 69, dur: 2 },
        { step: 8, pitch: 65, dur: 8 },
        { step: 16, pitch: 74, dur: 4 },
        { step: 20, pitch: 76, dur: 4 },
        { step: 24, pitch: 74, dur: 8 },
      ],
    },
  },
  {
    id: 'wisteria-rest',
    name: '🍵 Wisteria Rest',
    baseBpm: 85,
    color: '#fcd34d',
    filterFreq: 1200,
    src: null,
    notes: {
      bass: [
        { step: 0, pitch: 43, dur: 16 },
        { step: 16, pitch: 40, dur: 16 },
      ],
      mid: [
        { step: 0, pitch: 50, dur: 4 }, { step: 0, pitch: 55, dur: 4 },
        { step: 4, pitch: 57, dur: 4 },
        { step: 8, pitch: 59, dur: 4 },
        { step: 12, pitch: 55, dur: 4 },
        { step: 16, pitch: 47, dur: 4 }, { step: 16, pitch: 52, dur: 4 },
        { step: 20, pitch: 55, dur: 4 },
        { step: 24, pitch: 57, dur: 4 },
        { step: 28, pitch: 52, dur: 4 },
      ],
      lead: [
        { step: 2, pitch: 74, dur: 4 },
        { step: 10, pitch: 71, dur: 4 },
        { step: 18, pitch: 79, dur: 4 },
        { step: 26, pitch: 76, dur: 4 },
      ],
    },
  },
];

export const TRACKS_BY_ID = TRACKS.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});
