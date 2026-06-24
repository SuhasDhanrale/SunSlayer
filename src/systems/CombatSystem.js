import { PALETTE, SLASH_THRESHOLD, MAX_FOCUS, GOLDEN, CAMERA, GATE_CONFIG, SLICE_LINE } from '../config/constants.js';

import { trySliceObstacle } from '../obstacles/index.js';
import { getYokai } from '../data/yokai.js';
import { ComboSystem } from './ComboSystem.js';
import { spawnBambooCut, spawnYokaiCut } from './CutParticles.js';
import { CoinSystem } from './CoinSystem.js';
import { ArrowSystem } from './ArrowSystem.js';
import { FloatingTextSystem, CRITICAL_CHANCE } from './FloatingTextSystem.js';
import { bus } from '../core/bus.js';

// --- Helper Math ---
const distSq = (p1, p2) => (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
const dist = (p1, p2) => Math.sqrt(distSq(p1, p2));

const closestPointOnSegment = (p, v, w) => {
  const l2 = distSq(v, w);
  if (l2 === 0) return { x: v.x, y: v.y };
  const t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
  return { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
};

const distToSegmentSquared = (p, v, w) => distSq(p, closestPointOnSegment(p, v, w));

// A per-swipe multi-cut "×N!" burst lives this long (seconds) before the loop
// clears it (GameScreen decays s.multiCut.life). DESIGN §6 / IMPL Phase 5.
const MULTICUT_LIFE = 0.9;

const tntCenterY = (b) => b.y + (b.height || 0) / 2;
const isLiveTnt = (b) => b?.type === 'tnt' && b.explosive && !b.sim?.isCut;

function syncTntFuseVisual(b) {
  if (!b?.sim?.extra) return;
  b.sim.extra.chainArmed = Boolean(b.chainFuse);
  b.sim.extra.chainFuseRemaining = b.chainFuse?.remaining || 0;
  b.sim.extra.chainFuseDuration = b.chainFuse?.duration || 0;
}

export const CombatSystem = {
  // Spawn the lingering "afterimage" slice line at a confirmed cut (ported from the
  // Slicing Juice mock). It is a straight segment of fixed length centred on the cut
  // point and oriented along the SWIPE (p1→p2) — deliberately not the cursor trail,
  // so it reads as the blade's clean cut, appearing only when something is sliced.
  // Lives in the shared debris pool (type 'sliceLine'); PhysicsSystem decays it and
  // GameRenderer draws the three-pass dissolve. `vx` drifts it with the world so it
  // hangs over the cut like the blast ring, not pinned to screen space.
  addSliceLine(s, cx, cy, p1, p2) {
    const angle = (p1 && p2) ? Math.atan2(p2.y - p1.y, p2.x - p1.x) : 0;
    s.debris.push({
      type: 'sliceLine', x: cx, y: cy, angle,
      len: SLICE_LINE.length || 150,
      vx: -(s.cameraSpeed || 0), vy: 0,
      life: 1, maxLife: Math.max(1, Math.round((SLICE_LINE.lingerSec || 1.4) * 60)),
    });
  },

  sliceBamboo(b, i, s, cutY) {
    s.hitPause = b.type === 'thick' ? 4 : 2;
    s.shake = b.type === 'thick' ? 12 : 6;

    // Preserve the complete stalk as exactly two bamboo halves. The old effect
    // spawned one generic, ink-coloured rectangle, which became a white flipping
    // box in dark biomes and discarded most of the stalk.
    const stalkTop = b.y;
    const stalkBottom = b.y + b.height;
    const splitY = Math.max(stalkTop + 8, Math.min(stalkBottom - 8, cutY));
    const addHalf = (top, bottom, direction) => {
      const height = bottom - top;
      s.debris.push({
        x: b.x,
        y: top + height / 2,
        vx: direction * (1.5 + Math.random() * 1.5),
        vy: -1.5 - Math.random() * 2,
        rot: 0,
        rv: direction * (0.025 + Math.random() * 0.025),
        type: 'bambooPiece',
        width: b.width,
        height,
        nodeOffset: ((stalkTop + 40 - top) % 60 + 60) % 60,
        life: 2,
      });
    };
    addHalf(stalkTop, splitY, 1);
    addHalf(splitY, stalkBottom, -1);

    for(let p=0; p < (b.type === 'thick' ? 8 : 4); p++) {
       s.debris.push({ x: b.x, y: cutY, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1, type: 'ink', color: PALETTE.ink });
       if (Math.random() > 0.5) s.debris.push({ x: b.x, y: cutY, vx: (Math.random()-0.5)*5, vy: -2 - Math.random()*2, life: 1, type: 'leaf' });
    }

    s.bamboo.splice(i, 1);

  },

  armTntChain(b) {
    if (!isLiveTnt(b) || b.chainFuse) return false;
    const min = GATE_CONFIG.chainFuseSecMin ?? 2;
    const max = Math.max(min, GATE_CONFIG.chainFuseSecMax ?? 3);
    const duration = min + Math.random() * (max - min);
    b.chainFuse = { remaining: duration, duration };
    syncTntFuseVisual(b);
    return true;
  },

  detonateTnt(s, b) {
    if (!b || b.type !== 'tnt' || !b.explosive) return false;
    b.chainFuse = null;
    syncTntFuseVisual(b);

    if (b.specId && !b.sim?.isCut && b.worldBox) {
      const cy = tntCenterY(b);
      trySliceObstacle(b, { x: b.x - (b.width || 56), y: cy }, { x: b.x + (b.width || 56), y: cy });
    } else if (!b.specId || !b.worldBox) {
      b.resolved = true;
      b.explosive = false;
    }

    this.explode(s, b.x, tntCenterY(b), b.blastRadius || 230, b.gateId ?? null);
    return true;
  },

  tickTntChains(s, unscaledDt) {
    const seconds = Math.max(0, unscaledDt || 0) / 60;
    if (!seconds) return;
    for (let i = s.bamboo.length - 1; i >= 0; i--) {
      const b = s.bamboo[i];
      if (!b?.chainFuse) continue;
      if (!isLiveTnt(b)) {
        b.chainFuse = null;
        syncTntFuseVisual(b);
        continue;
      }
      b.chainFuse.remaining -= seconds;
      syncTntFuseVisual(b);
      if (b.chainFuse.remaining <= 0) {
        this.detonateTnt(s, b);
        break; // explosion mutates the obstacle array; resume next frame
      }
    }
  },

  // Detonate an explosive obstacle (TNT crate): clears every boulder within this
  // crate's blast RADIUS right now. Other live TNT crates caught in that blast do
  // not explode instantly; they light a 2-3s visible chain fuse, then detonate.
  // `gateId` is accepted for caller compatibility but no longer used.
  explode(s, x, y, radius = 230, gateId = null) {
    s.shake = Math.max(s.shake, 16); s.hitPause = 4; s.flashHit = 0.5; s.flashColor = '255, 255, 255';
    ComboSystem.registerHit(s, 'tnt');
    bus.emit('trap:tnt'); // dedicated TNT Boom SFX (combo:hit `tnt` is skipped by SoundSystem)
    // Shockwave ring — scroll it with the world so it stays over the pocket.
    s.debris.push({ x, y, r: 14, maxR: radius, life: 1, type: 'blast', vx: -(s.cameraSpeed || 0), vy: 0 });
    for (let p = 0; p < 12; p++) {
      s.debris.push({ x, y, vx: (Math.random()-0.5)*18, vy: (Math.random()-0.5)*18, life: 1, type: 'ink', color: Math.random() > 0.5 ? PALETTE.ink : PALETTE.fadedInk });
    }
    // Clear boulders inside the radius (measured from boulder centre) and light
    // nearby TNT for a delayed, readable chain reaction.
    for (let j = s.bamboo.length - 1; j >= 0; j--) {
      const o = s.bamboo[j];
      const oy = o.y + (o.height || 0) / 2;
      const inBlast = Math.hypot(o.x - x, oy - y) <= radius + (o.width || 0) / 2;
      if (!inBlast) continue;
      if (o.type === 'boulder') s.bamboo.splice(j, 1);
      else if (isLiveTnt(o)) this.armTntChain(o);
    }
  },

  trySliceDemon(d, s, p1, p2) {
    if (d.sliced || distToSegmentSquared({ x: d.x, y: d.y }, p1, p2) >= d.radius ** 2) return false;
    this.sliceDemon(d, s, p1, p2);
    // 15% of PLAYER yokai cuts crit (a "CRITICAL +10" pop). Rolled here, not in
    // sliceDemon, so the golden burst's mass-slice doesn't spray crits.
    if (Math.random() < CRITICAL_CHANCE) FloatingTextSystem.critical(s, d.x, d.y);
    return true;
  },

  // Golden treat (FN pomegranate): a slash that touches the hovering golden yokai
  // ARMS it (starting the frenzy window on the first hit) and tallies one rapid
  // hit. `hitCd` gates repeats so a continuous drag only scores every few frames —
  // you must scrub. This never sets `sliced`/drops a coin/closes a stroke; the
  // payoff is deferred to burstGolden when the frenzy ends. Returns true on a hit.
  tryHitGolden(d, s, p1, p2) {
    if (d.bursting || (d.hitCd || 0) > 0) return false;
    if (distToSegmentSquared({ x: d.x, y: d.y }, p1, p2) >= d.radius ** 2) return false;
    // First cut ARMS it: freeze the projectile in place (the loop drops time to ~zero
    // and the camera locks on) so the rest of the frenzy is a stationary scrub.
    if (!d.armed) { d.armed = true; d.frenzyT = GOLDEN.frenzyFrames; d.vx = 0; d.vy = 0; d.gravity = 0; }
    d.hits = (d.hits || 0) + 1;
    d.hitCd = GOLDEN.hitCdFrames;
    // Beam of light bursting OUT of the treat along the slash direction — a long,
    // bright additive shaft well past the mask so it clearly reads (SPRITE-READY).
    const rdx = p2.x - p1.x, rdy = p2.y - p1.y;
    s.debris.push({
      x: d.x, y: d.y, type: 'ray', life: 1,
      angle: Math.atan2(rdy, rdx), length: GOLDEN.beamLength ?? 1500,
      vx: 0, vy: 0,
    });
    // Camera "piñata" punch per hit (mock yokai values): a hard hitstop that the loop now
    // renders THROUGH, a punch-in zoom pulse, and a shake spike. CameraSystem.pickTarget
    // pans/zooms onto this armed treat; punchIn eases home between hits.
    s.hitPause = Math.max(s.hitPause || 0, CAMERA.yokai.hitstop);
    s.shake = Math.max(s.shake || 0, CAMERA.yokai.shake);
    if (s.camera) s.camera.punchIn = Math.max(s.camera.punchIn || 1, CAMERA.yokai.punchIn);
    s.flashHit = Math.max(s.flashHit || 0, 0.22);
    s.flashColor = '251, 191, 36';
    const gold = getYokai('golden').accentColors;
    for (let p = 0; p < 8; p++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 7;
      s.debris.push({
        x: d.x, y: d.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.7, type: 'ink', color: gold[Math.floor(Math.random() * gold.length)],
        size: 2 + Math.random() * 3,
      });
    }
    FloatingTextSystem.goldenHits(s, d.hits, d.x, d.y - (d.radius || 50) - 14); // climbing "N HITS" above its head
    bus.emit('golden:hit', { hits: d.hits });
    return true;
  },

  // The burst: WIPE THE FIELD — slice every other on-screen yokai AND every bamboo /
  // obstacle at once (each pops through its own cut path + drops coins), shower bonus
  // coins scaled to the frenzy hits, and fire the screen juice — a hard hitPause
  // "pause" plus a brief slow-mo the loop reads off `s.goldenSlowmo`. Called from
  // DemonSystem.tick when the frenzy window closes; the entity is removed there.
  burstGolden(s, d, canvasWidth, canvasHeight) {
    if (d.bursting) return 0;
    d.bursting = true;
    let cleared = 0;
    for (let i = s.demons.length - 1; i >= 0; i--) {
      const e = s.demons[i];
      if (e === d || e.golden || e.sliced) continue;
      this.sliceDemon(e, s, { x: e.x - 60, y: e.y }, { x: e.x + 60, y: e.y });
      cleared += 1;
    }
    // Flatten the lane: cut/clear every bamboo + obstacle so the bang wipes the whole
    // field, not just yokai. Spec obstacles take a horizontal sweep-cut through their
    // box; plain bamboo/vines slice; everything else (boulders, bridges, dressing) is
    // cleared outright with a puff of debris. No TNT chain (avoids mid-loop mutation).
    for (let i = s.bamboo.length - 1; i >= 0; i--) {
      const b = s.bamboo[i];
      if (b.specId && b.sim?.isCut) continue; // already resolved — nothing to clear
      if (b.specId && b.worldBox) {
        const box = b.worldBox, cy = box.y + box.height / 2;
        trySliceObstacle(b, { x: box.x - 30, y: cy }, { x: box.x + box.width + 30, y: cy });
      } else if (b.type === 'thick' || b.type === 'bamboo' || b.type === 'vine') {
        this.sliceBamboo(b, i, s, b.y + (b.height || 0) / 2);
      } else {
        for (let p = 0; p < 4; p++) s.debris.push({ x: b.x, y: b.y + (b.height || 0) / 2, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12, life: 1, type: 'ink', color: PALETTE.ink });
        s.bamboo.splice(i, 1);
      }
      cleared += 1;
    }
    // Sweep up the only thing the wipe leaves behind: authored coin pickups. The blast
    // collects each (awarding its value) with the same warm puff the blade gives, so the
    // field is truly empty after a golden — no orphaned coins sitting on a cleared lane.
    for (let i = s.coins.length - 1; i >= 0; i--) {
      const c = s.coins[i];
      CoinSystem.collectImmediately(s);
      for (let p = 0; p < 5; p++) s.debris.push({ x: c.x, y: c.y, vx: (Math.random() - 0.5) * 8, vy: -1 - Math.random() * 4, life: 0.8, type: 'ink', color: PALETTE.warmGlow });
      s.coins.splice(i, 1);
    }
    s.shake = Math.max(s.shake || 0, GOLDEN.burstShake ?? 40);
    s.hitPause = Math.max(s.hitPause || 0, GOLDEN.burstHitPause);
    // SLAM BACK: the explosion knocks the camera OUT (punchIn < 1 → zoom-out recoil)
    // then it eases home over the goldenSlowmo window ("come back to the normal camera").
    if (s.camera) s.camera.punchIn = GOLDEN.burstPunchOut ?? 0.72;
    s.flashHit = GOLDEN.burstFlash ?? 1;
    s.flashColor = '255, 240, 200';
    s.goldenSlowmo = GOLDEN.slowmoFrames;
    // Size the shockwave to the farthest screen corner (+margin) so it sweeps fully
    // OFF-SCREEN from wherever the treat sat — reads as "the blast cleared everything".
    const reach = Math.max(
      Math.hypot(d.x, d.y),
      Math.hypot(canvasWidth - d.x, d.y),
      Math.hypot(d.x, canvasHeight - d.y),
      Math.hypot(canvasWidth - d.x, canvasHeight - d.y),
    ) * 1.15 + 220;
    s.debris.push({ x: d.x, y: d.y, r: 16, maxR: reach, life: 1, type: 'blast', vx: 0, vy: 0 });
    s.debris.push({ x: d.x, y: d.y, r: 8, maxR: reach * 0.6, life: 1, type: 'blast', vx: 0, vy: 0 });
    const gold = getYokai('golden').accentColors;
    for (let p = 0; p < 30; p++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 12;
      s.debris.push({
        x: d.x, y: d.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, type: 'ink', color: gold[Math.floor(Math.random() * gold.length)],
        size: 2 + Math.random() * 5,
      });
    }
    const coins = Math.min(GOLDEN.maxCoins, Math.round((d.hits || 0) * GOLDEN.coinsPerHit) + cleared);
    for (let c = 0; c < coins; c++) {
      CoinSystem.dropFromYokai(s, d.x + (Math.random() - 0.5) * 140, d.y + (Math.random() - 0.5) * 90);
    }
    ComboSystem.registerHit(s, 'golden');
    bus.emit('golden:burst', { hits: d.hits || 0, cleared });
    return cleared;
  },

  sliceDemon(d, s, p1, p2) {
    const rawPoint = closestPointOnSegment({ x: d.x, y: d.y }, p1, p2);
    const rawDx = rawPoint.x - d.x;
    const rawDy = rawPoint.y - d.y;
    const rawDistance = Math.hypot(rawDx, rawDy);
    const maxOffset = d.radius * 0.25;
    const centerBias = rawDistance > maxOffset ? maxOffset / rawDistance : 1;
    const point = { x: rawDx * centerBias, y: rawDy * centerBias };
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const localAngle = angle - d.rot;
    const normalX = -Math.sin(angle);
    const normalY = Math.cos(angle);
    const alignedPointY = normalX * point.x + normalY * point.y;
    const inheritedVX = d.vx * 0.5;
    const inheritedVY = d.vy * 0.5;

    d.sliced = true;
    if (!d.coinDropped) {
      d.coinDropped = true;
      CoinSystem.dropFromYokai(s, d.x + point.x, d.y + point.y);
    }
    d.cut = {
      phase: 'contact', contactTicks: 0, age: 0,
      angle, localAngle, alignedPointY, baseRotation: d.rot, point,
      negative: { x: 0, y: 0, vx: inheritedVX - normalX * 4.5, vy: inheritedVY - normalY * 4.5, rot: 0, rv: -0.09 },
      positive: { x: 0, y: 0, vx: inheritedVX + normalX * 4.5, vy: inheritedVY + normalY * 4.5, rot: 0, rv: 0.09 },
    };

    ComboSystem.registerHit(s, 'yokai');
    s.hitPause = 3;
    s.shake = Math.max(s.shake, 12);
    s.flashHit = 0.5;
    s.flashColor = '255, 255, 255';

    const accents = getYokai(d.type).accentColors;
    const particleCount = 18 + Math.floor(Math.random() * 5);
    for (let p = 0; p < particleCount; p++) {
      const alongCut = Math.random() < 0.55;
      const direction = Math.random() < 0.5 ? -1 : 1;
      const particleAngle = angle + (alongCut ? (direction < 0 ? Math.PI : 0) : direction * Math.PI / 2) + (Math.random() - 0.5) * 0.65;
      const speed = 4 + Math.random() * 9;
      const color = Math.random() < 0.68 ? PALETTE.ink : accents[Math.floor(Math.random() * accents.length)];
      s.debris.push({
        x: d.x + point.x, y: d.y + point.y,
        vx: Math.cos(particleAngle) * speed, vy: Math.sin(particleAngle) * speed,
        life: 1, type: 'ink', color, size: 2 + Math.random() * 4,
      });
    }
  },

  // Raise a per-swipe multi-cut: a transient "×N!" the loop decays + a bus burst
  // for SoundSystem. The monotonic `id` lets the HUD diff-sync replay the popup
  // animation when a fresh multi-cut of the same count fires. DESIGN §6 / Phase 5.
  raiseMultiCut(s, count, x, y) {
    s.multiCutSeq = (s.multiCutSeq || 0) + 1;
    s.multiCut = { count, id: s.multiCutSeq, life: MULTICUT_LIFE };
    // The "N FRUIT COMBO +N" floating text pops at the cut point (when one is known —
    // closeStroke and the iaijutsu sweep both pass the last yokai they cut).
    if (x != null && y != null) FloatingTextSystem.combo(s, count, x, y);
    bus.emit('combo:multicut', { count });
  },

  // Close the current stroke (one continuous slash). N≥2 yokai cut in the same
  // stroke is the HEADLINE per-swipe combo — self-bounding because you can only
  // physically cluster a handful per swipe. The 1.6s ComboSystem streak still runs
  // underneath (per-hit registerHit); this is the FN-style "one slice, many cuts".
  closeStroke(s) {
    const stroke = s.stroke;
    if (!stroke || !stroke.active) return;
    stroke.active = false;
    if (stroke.count >= 2) this.raiseMultiCut(s, stroke.count, stroke.lastX, stroke.lastY);
  },

  tick(state, dt, unscaledDt, canvasWidth, canvasHeight) {
    const s = state;

    // Focus Mechanics (Regen)
    if (s.focus.active) {
      if (!s.boss.active) {
         s.focus.energy = Math.max(0, s.focus.energy - 0.5 * unscaledDt);
         if (s.focus.energy <= 0) s.focus.active = false;
      }
    } else {
      s.focus.energy = Math.min(MAX_FOCUS, s.focus.energy + 0.3 * unscaledDt);
    }

    this.tickTntChains(s, unscaledDt);

    // Sword Physics — FRAME-RATE INDEPENDENT. The blade follow and the slash
    // threshold must read the same swipe identically at 60 / 120 / 144 Hz, or
    // high-refresh players have to flick ~2.4× faster to register a cut (the
    // "slash isn't cutting" bug) and fall back to clicking the focus sweep.
    // The 0.5/frame lerp becomes an exponential decay over dt; the per-frame
    // movement threshold scales with the frame's share of a 60fps frame so the
    // comparison is on real swipe SPEED, not pixels-per-frame. At 60fps
    // (unscaledDt≈1) both reproduce the old, hand-tuned feel exactly.
    const oldSword = { x: s.sword.x, y: s.sword.y };
    const follow = 1 - Math.pow(0.5, unscaledDt);
    s.sword.x += (s.mouse.x - s.sword.x) * follow;
    s.sword.y += (s.mouse.y - s.sword.y) * follow;
    s.sword.isSlashing = dist(oldSword, s.sword) > SLASH_THRESHOLD * unscaledDt;

    if (!s.focus.active) {
      s.sword.trail.unshift({ x: s.sword.x, y: s.sword.y });
      if (s.sword.trail.length > 12) s.sword.trail.pop();
    }

    const canSlash = !s.focus.active && s.sword.isSlashing && s.sword.trail.length > 1;
    const p1 = canSlash ? s.sword.trail[1] : null;
    const p2 = canSlash ? s.sword : null;

    // Golden frenzy lockout: once a treat is armed, EVERY slash is captured by it
    // until it bursts. Surrounding yokai/obstacles are deliberately spared here so
    // the final flash-bang (golden:burst) is what clears them — the player just
    // scrubs the treat under the slow-mo + camera lock.
    const goldenArmed = s.demons.find((d) => d.golden && d.armed && !d.bursting);
    if (goldenArmed) {
      if (canSlash) this.tryHitGolden(goldenArmed, s, p1, p2);
      return;
    }

    // Stroke accumulator (DESIGN §6 / Phase 5): a "stroke" is ONE continuous slash.
    // Open it on the rising edge of a slash, close it on the falling edge; yokai cut
    // in between tally into the per-swipe multi-cut (closeStroke fires the ×N). A
    // slow drag never opens a stroke (isSlashing is false below SLASH_THRESHOLD), so
    // separate flicks across a cluster stay separate cuts, not a fake combo.
    if (canSlash && !s.stroke?.active) s.stroke = { active: true, count: 0 };
    else if (!canSlash && s.stroke?.active) this.closeStroke(s);

    // Bamboo collisions / slicing (any-direction)
    for (let i = s.bamboo.length - 1; i >= 0; i--) {
      const b = s.bamboo[i];

      if (b.specId) {
        if (b.gate && b.type === 'boulder') continue;
        if (b.sim?.isCut) continue;
        if (b.hitCooldown > 0) b.hitCooldown -= unscaledDt;
        if (canSlash && b.hitCooldown <= 0) {
          const result = trySliceObstacle(b, p1, p2);
          if (result.hit) {
            const cut = result.world || { x: b.x, y: b.y + b.height / 2 };
            this.addSliceLine(s, cut.x, cut.y, p1, p2);
            if (b.explosive) {
              this.detonateTnt(s, b);
              break; // array heavily mutated by the blast; resume next frame
            }
            s.hitPause = b.type === 'thick' ? 4 : 2;
            s.shake = b.type === 'thick' ? 12 : 6;
            ComboSystem.registerHit(s, b.type || b.specId || 'obstacle');
            for (let p = 0; p < 5; p++) {
              s.debris.push({
                x: cut.x,
                y: cut.y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 0.8,
                type: 'ink',
                color: PALETTE.ink,
              });
            }
          }
        }
        continue;
      }

      if (b.type === 'raft') continue; // dressing only

      // Set-pieces: cut the HIGH rope to resolve them (plank drops / boulder rolls).
      if (b.type === 'bridge' || b.type === 'boulder') {
        if (b.state === 'armed' && canSlash) {
          const ry = s.monk.y - b.ropeOffY;
          if (distToSegmentSquared({ x: b.x, y: ry }, p1, p2) < b.ropeR ** 2) {
            b.state = 'resolved';
            b.reactT = 0;
            this.addSliceLine(s, b.x, ry, p1, p2);
            s.shake = 14; s.hitPause = 3;
            ComboSystem.registerHit(s, b.type);
            for (let p = 0; p < 8; p++) s.debris.push({ x: b.x, y: ry, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 1, type: 'ink', color: PALETTE.paper });
          }
        }
        continue;
      }

      if (b.hitCooldown > 0) b.hitCooldown -= unscaledDt;

      if (canSlash && b.hitCooldown <= 0) {
        const isHit = distToSegmentSquared({x: b.x, y: (p1.y+p2.y)/2}, p1, p2) < (b.width * 2)**2 && p2.y > b.y && p2.y < b.y + b.height;

        if (isHit) {
          if (b.explosive) {            // TNT / barrel — detonate immediately if sliced
            this.detonateTnt(s, b);
            break;                      // array heavily mutated; resume next frame
          }
          if (b.type === 'thick') {
            b.hp -= 1; b.hitCooldown = 10; s.shake = 4; s.hitPause = 1;
            this.addSliceLine(s, b.x, p2.y, p1, p2);
            ComboSystem.registerHit(s, 'thick-bamboo');
            for(let p=0; p<5; p++) s.debris.push({ x: b.x, y: p2.y, vx: (Math.random()-0.5)*10, vy: -2 - Math.random()*5, life: 1, type: 'ink', color: PALETTE.ink });
            if (b.hp <= 0) { spawnBambooCut(s, b.x, p2.y, p1, p2); this.sliceBamboo(b, i, s, p2.y); }
            continue;
          }

          ComboSystem.registerHit(s, b.type === 'vine' ? 'vine' : 'bamboo');
          this.addSliceLine(s, b.x, p2.y, p1, p2);
          spawnBambooCut(s, b.x, p2.y, p1, p2);
          this.sliceBamboo(b, i, s, p2.y);
          continue;
        }
      }
    }

    // Demon (Fruit-Ninja) slicing — same swipe gesture, no directional matching.
    // Each cut tallies into the open stroke (guaranteed live above when canSlash).
    for (let i = s.demons.length - 1; i >= 0; i--) {
      const d = s.demons[i];
      // The golden treat is a multi-hit frenzy, not a one-cut yokai: route slashes
      // to the hit-tally (it never tallies into the per-swipe stroke combo).
      if (d.golden) { if (canSlash) this.tryHitGolden(d, s, p1, p2); continue; }
      if (canSlash && this.trySliceDemon(d, s, p1, p2)) { s.stroke.count += 1; s.stroke.lastX = d.x; s.stroke.lastY = d.y; this.addSliceLine(s, d.x, d.y, p1, p2); spawnYokaiCut(s, d.x, d.y, p1, p2); }
    }

    // Quiver mistakes and recovery arrows resolve after Yokai, so crossing a
    // forbidden seal leaves the stroke's final combo state broken.
    if (canSlash) ArrowSystem.tryCutSegment(s, p1, p2, canvasWidth, canvasHeight);

    // Coin pickups — collected by brushing the blade across them (no fast swipe
    // required), so a clean stroke sweeps up a whole trail.
    for (let i = s.coins.length - 1; i >= 0; i--) {
      const c = s.coins[i];
      if (distToSegmentSquared(c, oldSword, s.sword) < (c.r + 16) ** 2) {
        CoinSystem.collectImmediately(s);

        if (s.shake < 2) s.shake = 2;
        for (let p = 0; p < 5; p++) s.debris.push({ x: c.x, y: c.y, vx: (Math.random()-0.5)*8, vy: -1 - Math.random()*4, life: 0.8, type: 'ink', color: PALETTE.warmGlow });
        s.coins.splice(i, 1);
      }
    }
  }
};
