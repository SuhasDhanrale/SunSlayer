import { GROUND_HEIGHT } from '../config/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// BIOME BACKDROPS — playtest environment skins, ported VERBATIM from the Mock Lab
// "Cave Biome (Playtest)" (CaveBiomeMock) and "Water Biome (Playtest)"
// (WaterBiomeMock). These reproduce ONLY each mock's ENVIRONMENT layer (sky /
// water / parallax / ceiling / floor). The mocks' own monk, obstacles, slashing
// and HUD are deliberately left out — the real game draws the monk + obstacles on
// top, and the obstacle set is being wired into the run systems separately.
//
// Each factory returns a stateful instance that owns its own scene arrays (like
// the mock's closure) and scrolls off the GAME's world distance (`s.distance`),
// so the backdrop moves in lock-step with gameplay. Pure canvas: no React, no
// refs. Switch to one of these with the debug 'b' key in GameScreen.
// ─────────────────────────────────────────────────────────────────────────────

// 🪨 CAVE — black cavern, drifting back-pillars, jagged ceiling, undulating floor.
// Ported from CaveBiomeMock's render (the floor/ceiling geometry generator). Gaps
// (a bridge-cutting OBSTACLE in the mock) are omitted so the floor stays a
// continuous run surface; they return when the cave obstacles are wired in.
export function createCaveBackdrop() {
  let floorPoints = [];
  let ceilingPoints = [];
  let nextGenX = 0;
  let seeded = false;
  let seedH = 0;

  // Floor undulation + ceiling jag, identical to CaveBiomeMock.generateSegment
  // (obstacle/gap spawns stripped out).
  const generateSegment = (worldX, h) => {
    const floorBaseY = h - GROUND_HEIGHT;
    const undulation = Math.sin(worldX * 0.003) * 25 + Math.sin(worldX * 0.015) * 10;
    floorPoints.push({ x: worldX, y: floorBaseY + undulation });
    ceilingPoints.push({ x: worldX, y: Math.random() * 80 + 20 });
  };

  // (Re)seed the scene around the current world distance — on first draw, after a
  // biome switch (reset), or when the canvas height changes.
  const ensure = (w, h, worldDistance) => {
    if (seeded && seedH === h) return;
    floorPoints = [];
    ceilingPoints = [];
    nextGenX = Math.floor((worldDistance - 100) / 50) * 50;
    while (nextGenX < worldDistance + w + 200) { generateSegment(nextGenX, h); nextGenX += 50; }
    seeded = true;
    seedH = h;
  };

  return {
    reset() { seeded = false; },
    render(ctx, w, h, worldDistance) {
      ensure(w, h, worldDistance);
      const distance = worldDistance;

      // Stream geometry in ahead of the camera, drop it once it's behind.
      while (floorPoints.length === 0 || floorPoints[floorPoints.length - 1].x < distance + w + 100) {
        generateSegment(nextGenX, h);
        nextGenX += 50;
      }
      while (floorPoints.length > 1 && floorPoints[0].x < distance - 100) {
        floorPoints.shift();
        ceilingPoints.shift();
      }

      // --- DRAW (verbatim from CaveBiomeMock) ---
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      for (let i = 0; i < w; i += 100) ctx.rect((i - distance * 0.2) % (w + 100), h * 0.2, 80, h * 0.6);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, h - GROUND_HEIGHT + 20, w, h);

      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ceilingPoints.forEach((p) => ctx.lineTo(p.x - distance, p.y));
      ctx.lineTo(w, 0);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, h);
      floorPoints.forEach((p) => ctx.lineTo(p.x - distance, p.y));
      ctx.lineTo(w, h);
      ctx.fill();
    }
  };
}

// 🌊 WATER — bright sky over a deep-blue body, caustic light rays, rising bubbles.
// Ported from WaterBiomeMock's render (background + bubble field). Surface sits at
// 40% height exactly as the mock; bubbles parallax off the per-frame world travel.
export function createWaterBackdrop() {
  let frame = 0;
  let lastDistance = 0;
  let bubbles = null;
  let seedW = 0;
  let seedH = 0;

  const ensureBubbles = (w, h) => {
    if (bubbles && seedW === w && seedH === h) return;
    bubbles = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 4 + 2,
      speedY: Math.random() * 1.5 + 0.5,
      wobbleOffset: Math.random() * Math.PI * 2
    }));
    seedW = w;
    seedH = h;
  };

  return {
    reset() { bubbles = null; },
    render(ctx, w, h, worldDistance) {
      ensureBubbles(w, h);
      frame++;
      const time = frame;
      const speed = worldDistance - lastDistance; // world px travelled this frame
      lastDistance = worldDistance;

      // --- DRAW (verbatim from WaterBiomeMock) ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
      skyGrad.addColorStop(0, '#bae6fd');
      skyGrad.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.4);

      // Water Surface Line
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, h * 0.4, w, 4);

      // Water Body
      const waterGrad = ctx.createLinearGradient(0, h * 0.4, 0, h);
      waterGrad.addColorStop(0, '#0284c7');
      waterGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, h * 0.4, w, h * 0.6);

      // Light rays (caustics effect in water)
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const rayX = (w * 0.2 * i) - (time * 0.5) % (w * 0.4) + w * 0.2;
        ctx.moveTo(rayX, h * 0.4);
        ctx.lineTo(rayX + 150, h * 0.4);
        ctx.lineTo(rayX + 50 - i * 20, h);
        ctx.lineTo(rayX - 50 - i * 20, h);
        ctx.fill();
      }
      ctx.restore();

      // Bubbles (rising, parallax against the run)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      bubbles.forEach((b) => {
        b.y -= b.speedY;
        b.x += Math.sin(b.wobbleOffset + time * 0.05) * 1.5;
        b.x -= speed * 0.2; // parallax
        if (b.y < -20 || b.x < -20) {
          b.y = h + 20;
          b.x = Math.random() * w + w * 0.2;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };
}

// Map a GAMEPLAY_BIOMES key → its backdrop factory. 'bamboo' has no skin (the
// default paper/sun GameRenderer background stays).
export const BIOME_BACKDROP_FACTORIES = {
  cave: createCaveBackdrop,
  water: createWaterBackdrop
};
