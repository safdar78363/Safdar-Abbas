import React from 'react';
import { Users, UserPlus, Trash2, Mic, Volume2 } from 'lucide-react';
import { VoiceId, VoiceOption } from '../types';
import { GEMINI_VOICES } from '../constants/voices';

interface MultiSpeakerSettingsProps {
  speakerVoiceMap: Record<string, VoiceId>;
  onUpdateSpeakerVoice: (speaker: string, voiceId: VoiceId) => void;
  detectedSpeakers: string[];
  onAddCustomSpeaker: (speakerName: string) => void;
  onPreviewVoice: (voice: VoiceOption, e: React.MouseEvent) => void;
  previewingVoiceId: VoiceId | null;
}

export const MultiSpeakerSettings: React.FC<MultiSpeakerSettingsProps> = ({
  speakerVoiceMap,
  onUpdateSpeakerVoice,
  detectedSpeakers,
  onAddCustomSpeaker,
  onPreviewVoice,
  previewingVoiceId,
}) => {
  const [newSpeakerName, setNewSpeakerName] = React.useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeakerName.trim()) return;
    onAddCustomSpeaker(newSpeakerName.trim());
    setNewSpeakerName('');
  };

  // Ensure default speaker 1 and speaker 2 exist if detected list is empty
  const activeSpeakers = detectedSpeakers.length > 0 ? detectedSpeakers : ['Speaker 1', 'Speaker 2'];

  const speakerColors = [
    'border-purple-500/40 bg-purple-500/10 text-purple-300',
    'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    'border-amber-500/40 bg-amber-500/10 text-amber-300',
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    'border-rose-500/40 bg-rose-500/10 text-rose-300',
  ];

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Multi-Speaker Voice Assignment</h3>
            <p className="text-[11px] text-slate-400">
              Assign a unique Gemini TTS voice to each speaker in your dialogue
            </p>
          </div>
        </div>

        {/* Add custom speaker name */}
        <form onSubmit={handleAdd} className="flex items-center space-x-1.5">
          <input
            type="text"
            value={newSpeakerName}
            onChange={(e) => setNewSpeakerName(e.target.value)}
            placeholder="Add speaker (e.g. Alex)"
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-purple-500 outline-none w-36 sm:w-44"
          />
          <button
            type="submit"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Speaker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeSpeakers.map((speaker, index) => {
          const assignedVoiceId = speakerVoiceMap[speaker] || (index % 2 === 0 ? 'Puck' : 'Kore');
          const voiceObj = GEMINI_VOICES.find((v) => v.id === assignedVoiceId) || GEMINI_VOICES[0];
          const colorClass = speakerColors[index % speakerColors.length];

          return (
            <div
              key={speaker}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
                  {speaker}
                </span>
                <button
                  type="button"
                  onClick={(e) => onPreviewVoice(voiceObj, e)}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-purple-900/40 text-[10px] text-slate-300 hover:text-white transition cursor-pointer"
                  title="Preview assigned voice"
                >
                  <Volume2 className="w-3 h-3 text-purple-400" />
                  <span>{previewingVoiceId === assignedVoiceId ? 'Playing...' : 'Sample'}</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1">
                  Assigned Voice
                </label>
                <select
                  value={assignedVoiceId}
                  onChange={(e) => onUpdateSpeakerVoice(speaker, e.target.value as VoiceId)}
                  className="w-full bg-slate-900 text-slate-100 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-purple-500 outline-none cursor-pointer"
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender} • {v.tone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-slate-400 truncate">
                {voiceObj.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
