import { useState } from 'react';

const tasks = [
  {
    id: 'intro-scene',
    title: '1. Core Narrative Intro Scene',
    status: 'planned',
    badge: '📌 Planned',
    color: 'border-pink-500 bg-pink-950/20 text-pink-400',
    description: 'The narrative opening sequence setting up the Monk escaping with his cursed sister on his back.',
    details: [
      'Define the storyboard prompts for AI video generation or in-game asset rendering.',
      'Code the initial camera panning from the peaceful, infected shack interior to the escape.',
      'Implement a screen-shaking door explosion as the Yokai Warlord (Boss) attacks.',
      'Render the sister character model/asset physically bound to the Monk’s back during gameplay.'
    ],
    technicalNotes: 'Will require modifying the GameRenderer to draw the sister basket attachment, and writing an intro state machine that transitions to active gameplay once the Monk leaps out of the door.'
  },
  {
    id: 'demons-slashing',
    title: '2. Slashing Targets & Demon Enemies',
    status: 'completed',
    badge: '✅ Complete',
    color: 'border-red-500 bg-red-950/20 text-red-400',
    description: 'Active Yokai and shadow beasts that leap at the player, moving beyond static bamboo obstacles.',
    details: [
      'Code a dynamic spawning system for moving enemies (running shadow wolves, diving Tengu birds).',
      'Draw stylized, hand-drawn Ukiyo-e ink sprites for the Yokai beasts.',
      'Implement directional slashing boxes (player must swipe left/right/up to match the slash angle).',
      'Add knockback physics and debris particles when a demon is successfully cut.'
    ],
    technicalNotes: 'Extend the entity simulation loop to handle enemy movements, collision boxes, and hit detection, syncing with the player’s slash gesture vectors.'
  },
  {
    id: 'slash-effects',
    title: '3. Elemental Breath Slash Effects',
    status: 'completed',
    badge: '✅ Complete',
    color: 'border-cyan-500 bg-cyan-950/20 text-cyan-400',
    description: 'Dynamic canvas particles matching breathing styles (e.g., Water turns to Fire as the combo increases).',
    details: [
      'Create Fluid Water Slash particle curves (smooth blue/white waves following the mouse/touch path).',
      'Create Crackling Fire/Sun Slash particle bursts (fiery orange/yellow sparks that fade to embers).',
      'Develop the combo system: weapon attacks upgrade to higher elements at specific hit streaks.',
      'Add screen-freeze frame skips and high-contrast flashes on successful cuts for impact.'
    ],
    technicalNotes: 'Render custom canvas particles drawn along the user’s gesture path. Calculate velocity-based particle spreads and dynamic canvas composite operations (e.g., color-dodge).'
  },
  {
    id: 'biome-transitions',
    title: '4. Seamless Biome Transitions',
    status: 'completed',
    badge: '✅ Complete',
    color: 'border-emerald-500 bg-emerald-950/20 text-emerald-400',
    description: 'Biome transitions are owned by the continuous biome sequence, independent of combat encounters.',
    details: [
      'Keep scene and biome progression independent from the sealed-quiver Yokai trap.'
    ],
    technicalNotes: 'The legacy timed blackout was removed; biome sequencing remains continuous and the Samurai/Ronin is the only BossSystem encounter.'
  },
  {
    id: 'ending-scene',
    title: '5. The Dawn Shrine Ending',
    status: 'planned',
    badge: '📌 Planned',
    color: 'border-violet-500 bg-violet-950/20 text-violet-400',
    description: 'The grand finale at the mountaintop Shrine of Amaterasu where the sun rises and the sister is cured.',
    details: [
      'Render the massive Golden Sun Torii gate rising in the volcanic background.',
      'Trigger the victory sequence: the Warlord boss burns away into grey ash under the solar dawn.',
      'Create the cutscene of the sister collapsing off the Monk’s back as the dark veins dissolve.',
      'Animate the final credits overlay styled like an unfolding Japanese calligraphy scroll.'
    ],
    technicalNotes: 'Code a victory state trigger when the player reaches a specific distance milestone, locking player controls and fading out the volcanic danger layers into a bright, white-solar wash.'
  }
];

export const RoadmapDashboard = () => {
  const [selectedTask, setSelectedTask] = useState(tasks[0]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 font-sans p-6 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-2xl font-bold tracking-wide text-slate-50 uppercase">
          ⚔️ Project Bloodline: Feature Roadmap
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Interactive master plan for implementing the Demon Slayer curse-cure run. We will build these one by one.
        </p>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 h-auto min-h-0 flex-1">
        {/* Left List */}
        <div className="flex-1 flex flex-col gap-3">
          <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-1">
            Planned Features ({tasks.length})
          </h3>
          {tasks.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTask(t)}
              className={`text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                selectedTask.id === t.id
                  ? `${t.color} border-opacity-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]`
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-300'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-semibold text-base">{t.title}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 border border-slate-700">
                  {t.badge}
                </span>
              </div>
              <p className="text-xs mt-1 text-slate-400 line-clamp-1">
                {t.description}
              </p>
            </button>
          ))}
        </div>

        {/* Right Details */}
        <div className="w-full lg:w-1/2 flex flex-col border border-slate-800 bg-slate-900/40 rounded-xl p-6 shadow-2xl">
          <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
                Feature Specification
              </span>
              <h3 className="text-lg font-bold text-slate-50 mt-1">
                {selectedTask.title}
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
              {selectedTask.badge}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 mb-5 italic">
            "{selectedTask.description}"
          </p>

          {/* Checklist Details */}
          <div className="flex-1 overflow-y-auto mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Checklist / Implementation Steps
            </h4>
            <ul className="space-y-3">
              {selectedTask.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className={`${selectedTask.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'} mt-1`}>
                    {selectedTask.status === 'completed' ? '☑' : '☐'}
                  </span>
                  <span className={selectedTask.status === 'completed' ? 'line-through text-slate-500' : ''}>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Implementation notes */}
          <div className="border-t border-slate-800 pt-4 mt-auto">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              🛠️ Technical Engine Notes
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-900 font-mono">
              {selectedTask.technicalNotes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
