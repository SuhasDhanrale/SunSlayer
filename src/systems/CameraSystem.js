import { CAMERA } from '../config/constants.js';

const DEG = Math.PI / 180;

// One camera vocabulary for the whole run. The renderer applies a single composited
// transform built from this object (mock parity):
//   translate(center + shake) → rotate(angle) → scale(zoom · punchIn) → translate(-center - offset)
// `x`/`y` are a focal offset in canvas pixels (focalCanvasX - centerX), so a point drawn
// at (centerX + x, centerY + y) lands at screen center. The system eases every field
// toward `target` each frame; shake/punchIn are transient pulses that decay home.
//
// Distinct from the run's time effects (currentTimeScale / hitPause / goldenSlowmo): this
// is purely SPATIAL. It also owns the shake/flash decay so it can keep animating during a
// hitPause freeze (the loop renders that frame; mock parity for "freeze → punch → return").
export function createCamera() {
  return {
    x: 0, y: 0, zoom: 1, angle: 0, letterbox: 0, punchIn: 1,
    target: { x: 0, y: 0, zoom: 1, angle: 0, letterbox: 0 },
  };
}

const NEUTRAL = { x: 0, y: 0, zoom: 1, angle: 0, letterbox: 0 };

// Frame two world entities (by their x) and return the focal offset + a distance-driven
// zoom that keeps the span within `frameFrac` of the screen — closer entities → more zoom,
// clamped to `zoomMax`. This is the "we have the actual distance, so the camera zooms in
// that much" behaviour for the samurai/ronin.
function frameTwo(ax, ay, bx, by, w, h, zoomMax, frameFrac) {
  const span = Math.abs(ax - bx);
  const zoom = Math.max(1, Math.min(zoomMax, (frameFrac * w) / Math.max(span, 1)));
  return { x: (ax + bx) / 2 - w / 2, y: (ay + by) / 2 - h / 2, zoom };
}

export const CameraSystem = {
  createCamera,

  // Choose where the camera should be framing right now, from the scene/phase — the same
  // conditions the loop's time-ramp already branches on. Priority: golden frenzy (the
  // "yokai" piñata) → ronin clash → samurai watching → neutral.
  pickTarget(s, w, h) {
    const t = s.camera.target;
    const cy = CAMERA.yokai, cs = CAMERA.samurai;

    // Golden treat: zoom onto wherever it was first struck (it hovers at a fixed x; bobs
    // in y), NO letterbox so a slash up top still lands. Active while it's armed/bursting.
    const golden = s.demons && s.demons.find((d) => d.golden && (d.armed || d.bursting));
    if (golden) {
      t.x = golden.x - w / 2;
      t.y = golden.y - h / 2;
      t.zoom = cy.zoom;
      t.angle = cy.tilt * DEG;
      t.letterbox = 0;
      return;
    }

    // Samurai ENGAGEMENT only — the ronin clash/duel (boss active). The samurai merely
    // appearing/watching at the edge does NOT move the camera; the move comes when the
    // engagement actually fires (mercy/execution duel). Frame monk + boss, zoom by their
    // distance (closer → more zoom, keeping both in frame), dutch tilt + letterbox (spawns
    // are paused during the clash, so cropping is safe).
    if (s.boss && s.boss.active && s.boss.type === 'ronin') {
      const f = frameTwo(s.monk.x, s.monk.y - 40, s.boss.x, s.boss.y - 40, w, h, cs.zoom, cs.frameFrac);
      t.x = f.x; t.y = f.y; t.zoom = f.zoom; t.angle = cs.tilt * DEG; t.letterbox = cs.letterbox;
      return;
    }

    // Neutral: glide back to default framing ("come back to the normal camera").
    t.x = NEUTRAL.x; t.y = NEUTRAL.y; t.zoom = NEUTRAL.zoom; t.angle = NEUTRAL.angle; t.letterbox = NEUTRAL.letterbox;
  },

  // Advance the camera one frame. Runs on UNSCALED dt (real time) so cinematics don't slow
  // with bullet-time, and EVERY frame — including a hitPause freeze — so a punch-in/shake
  // plays during the freeze. Also owns the shake/flash decay (moved off PhysicsSystem so it
  // still bleeds while the world is frozen).
  tick(s, dtUnscaled, w, h) {
    const cam = s.camera;
    if (!cam) return;
    this.pickTarget(s, w, h);

    const k = Math.min(1, CAMERA.lerpSpeed * dtUnscaled);
    const t = cam.target;
    cam.x += (t.x - cam.x) * k;
    cam.y += (t.y - cam.y) * k;
    cam.zoom += (t.zoom - cam.zoom) * k;
    cam.angle += (t.angle - cam.angle) * k;
    cam.letterbox += (t.letterbox - cam.letterbox) * k;

    // Punch-in pulse eases back to 1.0 (mock: punchIn += (1 - punchIn) * 0.1).
    if (Math.abs(cam.punchIn - 1) > 0.001) {
      cam.punchIn += (1 - cam.punchIn) * CAMERA.punchDecay;
    } else {
      cam.punchIn = 1;
    }

    // Shake + flash decay (formerly in PhysicsSystem). Flat decay matches the prior feel.
    if (s.shake > 0) {
      s.shake *= CAMERA.shakeDecay;
      if (s.shake < 0.5) s.shake = 0;
    }
    if (s.flashHit > 0) s.flashHit -= 0.05 * dtUnscaled;
  },

  // Map a canvas-pixel point back to WORLD space (the inverse of the render transform,
  // ignoring shake so slicing stays stable). Identity while the camera is neutral, so input
  // is unchanged during normal play. Used by the pointer handlers before any slice logic.
  toWorld(s, pt, w, h) {
    const cam = s.camera;
    if (!cam) return pt;
    const cx = w / 2, cy = h / 2;
    const zoom = cam.zoom * (cam.punchIn || 1);
    // undo translate(center)
    let px = pt.x - cx, py = pt.y - cy;
    // undo rotate(angle)
    const c = Math.cos(-cam.angle), sn = Math.sin(-cam.angle);
    let rx = px * c - py * sn;
    let ry = px * sn + py * c;
    // undo scale, then undo translate(-center - offset)
    return { x: rx / zoom + cx + cam.x, y: ry / zoom + cy + cam.y };
  },
};
