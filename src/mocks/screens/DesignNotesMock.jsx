import { useState } from 'react';

// A living reference of the gameplay-design decisions made while prototyping the
// base run. Dev-only notes — lives in the Mock Lab so it travels with the repo.
const SECTIONS = [
  {
    id: 'pillars',
    title: 'Core Pillars',
    accent: 'text-red-400 border-red-500/40 bg-red-950/20',
    items: [
      ['One verb: SLICE', 'Endless runner, the monk auto-runs. The player controls ONLY the blade — never the monk’s position. Every interaction resolves through a slash.'],
      ['Dumb-simple input', 'A forgiving swipe. The only spatial nuance is HIGH vs LOW. Difficulty NEVER scales through gesture precision (no vertical-chop / arc-sweep / tap requirements — they break at speed).'],
      ['Interest lives in the world, not the wrist', 'Same simple slash, different world reaction. Variety comes from what the slash DOES, not from harder motions.'],
    ],
  },
  {
    id: 'difficulty',
    title: 'Difficulty Model',
    accent: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
    items: [
      ['Speed = feel, not difficulty', 'Speed rises gently to a CAP (~1.7–1.8× base) over minutes. It must not be the difficulty engine (it was ramping far too fast).'],
      ['Density', 'Beat-gap between elements tightens with distance — more cuts per second.'],
      ['Arrangement = patterns', 'An element can be an authored micro-sequence (spike→vine→spike). Pools shift from singles → pairs → dense combos as the run progresses. THIS is the main difficulty engine.'],
      ['Mix shift', 'Weights tilt toward demanding elements over distance.'],
    ],
  },
  {
    id: 'outcomes',
    title: 'Outcome Families (what a slash does)',
    accent: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
    items: [
      ['CLEAR', 'Remove a blocker. Miss = stumble (slow + feeds the ronin trigger). e.g. bamboo, spikes, vines.'],
      ['BUILD / SOLVE', 'Slash a release point and the world reacts: cut a rope → bridge drops / gate lifts / boulder rolls away. The “slice to solve” rung.'],
      ['REWARD', 'Coins, placed to ride the slash you’re already doing (a coin line above a spike row = one low sweep takes both). Greed vs safety = the decision layer, zero extra motor load.'],
    ],
  },
  {
    id: 'elements',
    title: 'Element / Content System',
    accent: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20',
    items: [
      ['Authored by data, not by hand', 'ElementDirector picks one element per beat by WEIGHT (frequency), gated by minDist (the teaching curve), and some elements spawn a GROUP (things that come together).'],
      ['bamboo (mid)', 'Slash anywhere. The filler that keeps the combo alive.'],
      ['thick stalk', 'Multi-hit.'],
      ['spikes (low)', 'Slash low. Spawns WITH an aligned coin line.'],
      ['vine curtain (high)', 'PURPOSE: a dense curtain hanging into the path — sweep THROUGH all of them to keep momentum; uncut strands entangle/slow. A sustained-sweep beat (vs bamboo’s single chop). Can hide coins behind it.'],
      ['coins', 'Reward clusters: trail / zigzag / arc.'],
    ],
  },
  {
    id: 'threats',
    title: 'Enemies & Threats',
    accent: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-950/20',
    items: [
      ['Fruit-Ninja yokai', 'Demons flung up in arcs from a VARIED x — close to the monk out to the far right — so the blade roams the screen (anti-monotony) instead of camping at one edge. Sliced mid-air, combo scoring. Woven into the run in small bursts (“one-two”) with rarer swarm peaks.'],
      ['Shadow Ronin', 'A stumble-triggered ambush — un-sliced obstacles AND demons that hit the monk fill one shared stumble counter; at threshold the ronin charges. Avoid death by killing him; the run continues.'],
      ['Arrows', 'The biome transition, on a predictable ~2-min timer. When it’s time, a cut-to-transition ARROW-CLUSTER floats in (a bundle with a pulsing crimson “cut me” ring — deliberately NOT bomb language). Cut it → it bursts into the staggered volley you slash through → biome changes. Drifts to the monk uncut → auto-bursts, so progression never stalls.'],
    ],
  },
  {
    id: 'retention',
    title: 'Fun & Retention Stack (by value-per-effort)',
    accent: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20',
    items: [
      ['Combo / multiplier', 'Biggest, cheapest lever. Unbroken slices raise a score multiplier with rising flash/shake/pitch; one miss resets. Works across everything we already have.'],
      ['Juice', 'Hit-pause, slice-flash, debris, brief slow-mo on big combos. Make one cut feel incredible.'],
      ['Risk / reward', 'Coin placement that tempts greed near hazards — tension with no extra motor load.'],
      ['Meta hook', 'Coins → unlock the skins already designed in the cosmetics/wardrobe mocks. The cross-session “one more run”.'],
    ],
  },
  {
    id: 'teaching',
    title: 'Teaching Curve (no tutorial — by schedule)',
    accent: 'text-sky-400 border-sky-500/40 bg-sky-950/20',
    items: [
      ['Introduce → isolate → reinforce → combine', 'Each new toy first appears alone and slow, then folds into the mix.'],
      ['Verb deepens', 'CLEAR → slice ENEMIES → SOLVE (bridge) → (later) CREATE. Same verb, more meaning, more satisfying over time.'],
      ['Pace the intensity', 'Tension/release — calm filler stretches punctuated by bursts. A flat wall of challenge is as boring as a flat wall of nothing.'],
    ],
  },
  {
    id: 'decisions',
    title: 'Locked Decisions',
    accent: 'text-lime-400 border-lime-500/40 bg-lime-950/20',
    items: [
      ['Height: drop rolling hills', 'Biomes are fixed-horizon parallax with a ~100px ground band that already undulates in the art. Moving the playfield to match is cost without payoff and risks the visuals. Keep the playfield flat.'],
      ['Height: keep discrete GAPS', 'A gap is a hole in the flat band (contained to the bottom strip, horizon untouched) — reserved for the bridge/release set-pieces. The only “height” that earns its place.'],
      ['Biomes = obstacle ENVELOPES, not locomotion engines', 'Auto-locomotion means swimming/jumping are skins, not mechanics — the gameplay is 100% in the obstacles. Swimming (vertical envelope: above + below) is the ONE contrast mode worth doing — LATER, after the core is proven, budgeted with new art cost.'],
      ['Dropped: jumping / balance', 'With auto-locomotion it’s either cosmetic or it smuggles in a non-slice recovery action — which breaks the single-verb, low-load rule.'],
    ],
  },
  {
    id: 'open',
    title: 'Open Questions',
    accent: 'text-orange-400 border-orange-500/40 bg-orange-950/20',
    items: [
      ['Enemies: phase vs woven', 'Original model: separate BAMBOO / DEMONS phases, no overlap. New direction: weave enemy bursts INTO the base run as elements. Need to pick.'],
      ['Arrows — RESOLVED', 'Cut-to-transition arrow-cluster on a predictable ~2-min timer (see Threats). Auto-bursts if uncut, so pacing stays predictable and progression never stalls.'],
      ['Set-pieces', 'Gate / boulder / bridge (the “slash a release point” family) — design alongside discrete gaps, after the core run is fun.'],
    ],
  },
];

export const DesignNotesMock = () => {
  const [active, setActive] = useState(SECTIONS[0]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Left nav */}
      <div className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-wide text-slate-50">🧭 Game Design Notes</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Base-run gameplay decisions. Single verb: slice.</p>
        </div>
        <div className="flex lg:flex-col gap-1.5 flex-wrap">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className={`text-left px-3 py-2 rounded-lg border text-xs transition cursor-pointer ${
                active.id === s.id ? s.accent : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className={`inline-block text-xs font-mono uppercase tracking-widest px-2.5 py-1 rounded border mb-5 ${active.accent}`}>
          {active.title}
        </div>
        <ul className="space-y-4 max-w-3xl">
          {active.items.map((it, idx) => {
            const [label, desc] = Array.isArray(it) ? it : [it, null];
            return (
              <li key={idx} className="border-l-2 border-slate-800 pl-4">
                <div className="text-sm font-semibold text-slate-100">{label}</div>
                {desc && <div className="text-[13px] text-slate-400 leading-relaxed mt-1">{desc}</div>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
