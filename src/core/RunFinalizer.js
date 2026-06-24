import { Persistence } from './Persistence.js';

export function finalizeRun(s, persistence = Persistence) {
  if (s.ended) return null;
  s.ended = true;
  const distancePaces = Math.max(0, Math.floor((Number(s.distance) || 0) / 100));
  const coinsCollected = Math.max(0, Math.floor(Number(s.coinsCollected) || 0));
  const score = Math.max(0, Math.floor(Number(s.score) || 0));
  return {
    distancePaces,
    coinsCollected,
    score,
    maxCombo: Math.max(0, Math.floor(Number(s.maxCombo) || 0)),
    ...persistence.completeRun({ distancePaces, coinsCollected, score }),
  };
}
