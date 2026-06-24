// Cut particle bursts ported 1:1 from the Slicing Juice mock
// (src/mocks/screens/SlicingJuiceMock.jsx, `triggerImpact`). This is ONLY the
// carefully-crafted particle visuals for the two cut families the mock authored —
// 🎋 bamboo (silver water + green leaves) and 👺 yokai (spirit ribbons + onibi
// wisps + dark puffs). The screen juice (shake, hitstop, flash, lens / world
// splats) is deliberately NOT imported: the game already owns its own screen feel.
//
// Particles live in the shared `s.debris` pool as dedicated types; PhysicsSystem
// advances them and GameRenderer draws them (search those files for the same type
// strings). The game's logical space is ~540 tall, matching the mock canvas, so the
// mock's forces / radii are used verbatim with no rescaling. SPRITE-READY.

// Master knobs mirrored from the mock's DEFAULT sliders — particleSize 1.5 and
// particleCount 0.6 — i.e. exactly the look the mock shows when it first loads.
// Lower COUNT for fewer particles (mobile), raise SIZE for bolder ones.
const SIZE = 1.5;
const COUNT = 0.6;

const angleOf = (p1, p2) => (p1 && p2) ? Math.atan2(p2.y - p1.y, p2.x - p1.x) : 0;

// 🎋 Bamboo cut: water droplets spray PERPENDICULAR to the swipe (so a clean cut
// throws sap to both sides), plus a few tumbling leaves. Silver-white water reads
// best on the dark biomes (the mock's recommended default).
export function spawnBambooCut(s, x, y, p1, p2) {
  const angle = angleOf(p1, p2);
  const perp1 = angle + Math.PI / 2;
  const perp2 = angle - Math.PI / 2;
  const rgb = '241, 245, 249'; // slate-100 silver water

  const dropCount = Math.max(3, Math.round(8 * COUNT));
  for (let i = 0; i < dropCount; i++) {
    const side = Math.random() > 0.5 ? perp1 : perp2;
    const spread = (Math.random() - 0.5) * 0.5;
    const force = Math.random() * 8 + 6;
    s.debris.push({
      type: 'waterDrop', x, y,
      vx: Math.cos(side + spread) * force,
      vy: Math.sin(side + spread) * force - Math.random() * 2, // initial upward kick
      radius: (Math.random() * 6 + 7) * SIZE,                  // bold 7–13px droplets
      life: 0.95, decay: Math.random() * 0.015 + 0.012,
      gravity: 0.35, rgb,
    });
  }

  const leafCount = Math.max(1, Math.round(3 * COUNT));
  for (let i = 0; i < leafCount; i++) {
    s.debris.push({
      type: 'bambooLeaf', x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: -(Math.random() * 3 + 2),
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      scale: (Math.random() * 0.4 + 0.8) * SIZE,
      life: 1, decay: 0.01,
    });
  }
}

// 👺 Yokai cut: a freed-soul flourish — elegant ribbons weaving upward (shedding
// embers as they rise, handled in PhysicsSystem), purple/cyan onibi wisps, and a
// short-lived dark-violet aura puff. Spread along the cut path like the mock.
export function spawnYokaiCut(s, x, y, p1, p2) {
  const ribbonCount = Math.max(2, Math.round(4 * COUNT));
  for (let i = 0; i < ribbonCount; i++) {
    s.debris.push({
      type: 'spiritRibbon',
      x: x + (Math.random() - 0.5) * 80,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 1.0,
      vy: -(Math.random() * 2.0 + 1.5), // rises
      radius: (Math.random() * 4 + 4) * SIZE,
      life: 0.95, decay: Math.random() * 0.008 + 0.006,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.06 + 0.04,
      swayAmp: Math.random() * 1.5 + 1.0,
      trail: [],
    });
  }

  const spiritCount = Math.max(1, Math.round(3 * COUNT));
  for (let i = 0; i < spiritCount; i++) {
    s.debris.push({
      type: 'onibi', x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: -(Math.random() * 4 + 3),
      radius: (Math.random() * 5 + 6) * SIZE,
      life: 0.9, decay: Math.random() * 0.012 + 0.008,
      color: Math.random() > 0.5 ? '#a855f7' : '#06b6d4', // purple or cyan
      trail: [], swayPhase: Math.random() * Math.PI * 2,
    });
  }

  const puffCount = Math.max(1, Math.round(4 * COUNT));
  for (let i = 0; i < puffCount; i++) {
    s.debris.push({
      type: 'darkPuff', x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      radius: (Math.random() * 10 + 10) * SIZE,
      life: 0.7, decay: 0.03,
    });
  }
}
