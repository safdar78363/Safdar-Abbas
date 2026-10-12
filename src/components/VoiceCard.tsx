import React from 'react';
import { Play, Pause, Check, Mic2, Sparkles, Volume2 } from 'lucide-react';
import { VoiceOption, VoiceId } from '../types';

interface VoiceCardProps {
  voice: VoiceOption;
  isSelected: boolean;
  isPreviewing: boolean;
  onSelect: (voiceId: VoiceId) => void;
  onPreview: (voice: VoiceOption, e: React.MouseEvent) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  isSelected,
  isPreviewing,
  onSelect,
  onPreview,
}) => {
  // Voice avatar color palette
  const getGenderStyle = (gender: string) => {
    switch (gender) {
      case 'Feminine':
        return 'from-rose-500/20 to-pink-500/10 text-pink-400 border-pink-500/30';
      case 'Masculine':
        return 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div
      onClick={() => onSelect(voice.id)}
      className={`group relative rounded-xl p-3.5 sm:p-4 cursor-pointer transition-all duration-200 border text-left ${
        isSelected
          ? 'bg-slate-900/90 border-purple-500 shadow-lg shadow-purple-500/15 ring-1 ring-purple-500'
          : 'bg-slate-950/70 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm bg-gradient-to-br border ${getGenderStyle(
              voice.gender
            )}`}
          >
            {voice.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white text-sm group-hover:text-purple-300 transition">
                {voice.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                {voice.gender}
              </span>
            </div>
            <p className="text-[11px] font-medium text-purple-400/90 line-clamp-1">{voice.tone}</p>
          </div>
        </div>

        {/* Selected badge or Preview button */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={(e) => onPreview(voice, e)}
            className={`p-1.5 rounded-lg text-xs flex items-center space-x-1 transition cursor-pointer ${
              isPreviewing
                ? 'bg-purple-600 text-white animate-pulse'
                : 'bg-slate-800/90 hover:bg-purple-600/30 text-slate-300 hover:text-white border border-slate-700'
            }`}
            title="Preview voice"
          >
            {isPreviewing ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="text-[10px] font-semibold pr-0.5">Playing</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="text-[10px] font-medium pr-0.5">Sample</span>
              </>
            )}
          </button>

          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 shadow">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
        {voice.description}
      </p>

      {/* Best for tag */}
      <div className="flex items-center space-x-1 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
        <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
        <span className="truncate">Best for: <span className="text-slate-300">{voice.bestFor}</span></span>
      </div>
    </div>
  );
};
