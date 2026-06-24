// Quests — the long-arc objectives ("deeds") that frame the run loop with goals.
//
// This file is DECLARATIVE: each quest names a goal and the lifetime stat it reads
// from the save data (Persistence.data). The driving logic — detecting completion,
// queuing the in-game popup, and the home notification — lives in Persistence.js
// (checkQuests / getQuestsList). Keep copy and tuning here; keep mechanics there.
//
// Quest shape:
//   id      — stable key persisted in save data (never rename a shipped id)
//   name    — short title shown in the quest panel + completion popup
//   desc    — one-line objective copy
//   goal    — numeric target the metric must reach
//   metric  — (data) => current lifetime value for this quest's stat
//   unit    — optional short label for the progress readout ('paces', 'coins'…)
//
// Order = the intended difficulty ramp the panel renders top-to-bottom. The last
// three are the long-haul grinds (~30+ runs of play): play 30 runs, slay 30 ronin,
// and walk 50,000 total paces.
export const QUESTS = [
  {
    id: 'first_steps',
    name: 'First Steps',
    desc: 'Complete your very first run.',
    goal: 1,
    unit: 'run',
    metric: (d) => d.gamesPlayed,
  },
  {
    id: 'sharpened_edge',
    name: 'Sharpened Edge',
    desc: 'Reach a 10× combo in a single run.',
    goal: 10,
    unit: 'combo',
    metric: (d) => d.bestCombo,
  },
  {
    id: 'first_blood',
    name: 'First Blood',
    desc: 'Defeat your first ronin.',
    goal: 1,
    unit: 'ronin',
    metric: (d) => d.bossesDefeated,
  },
  {
    id: 'coin_purse',
    name: 'Coin Purse',
    desc: 'Collect 200 coins across all runs.',
    goal: 200,
    unit: 'coins',
    metric: (d) => d.lifetimeCoins,
  },
  {
    id: 'steady_hand',
    name: 'Steady Hand',
    desc: 'Score 5,000 points in a single run.',
    goal: 5000,
    unit: 'pts',
    metric: (d) => d.bestScore,
  },
  {
    id: 'long_strider',
    name: 'Long Strider',
    desc: 'Travel 2,000 paces in a single run.',
    goal: 2000,
    unit: 'paces',
    metric: (d) => d.bestDistance,
  },
  {
    id: 'blade_dancer',
    name: 'Blade Dancer',
    desc: 'Reach a 30× combo in a single run.',
    goal: 30,
    unit: 'combo',
    metric: (d) => d.bestCombo,
  },
  // --- Long-haul deeds (~30+ runs of play) ---
  {
    id: 'seasoned_wanderer',
    name: 'Seasoned Wanderer',
    desc: 'Complete 30 runs on your journey.',
    goal: 30,
    unit: 'runs',
    metric: (d) => d.gamesPlayed,
  },
  {
    id: 'demons_bane',
    name: "Ronin's Bane",
    desc: 'Defeat 30 ronin across all runs.',
    goal: 30,
    unit: 'ronin',
    metric: (d) => d.bossesDefeated,
  },
  {
    id: 'endless_journey',
    name: 'Endless Journey',
    desc: 'Walk 50,000 total paces across all runs.',
    goal: 50000,
    unit: 'paces',
    metric: (d) => d.totalDistancePaces,
  },
];

// Live progress for the panel: current value clamped to goal, completion flag, and
// a 0–1 ratio for the progress bar. `data` is Persistence.data.
export function questProgress(quest, data) {
  const raw = Math.max(0, Math.floor(Number(quest.metric(data)) || 0));
  const current = Math.min(raw, quest.goal);
  return {
    current,
    goal: quest.goal,
    ratio: quest.goal > 0 ? current / quest.goal : 1,
    completed: raw >= quest.goal,
  };
}
