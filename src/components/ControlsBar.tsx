import React from 'react';
import {
  Globe,
  Sliders,
  Sparkles,
  Zap,
  Film,
  BookOpen,
  Feather,
  Radio,
  RotateCcw,
  Volume2,
  Wand2,
} from 'lucide-react';
import { LanguageOption, TonePresetId } from '../types';
import { TONE_PRESETS } from '../constants/voices';
import { LanguageSelector } from './LanguageSelector';

interface ControlsBarProps {
  selectedLanguage: string;
  onSelectLanguage: (lang: LanguageOption) => void;
  selectedTonePreset: TonePresetId;
  onSelectTonePreset: (presetId: TonePresetId) => void;
  styleInstruction: string;
  onChangeStyleInstruction: (val: string) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
  charCount: number;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  selectedLanguage,
  onSelectLanguage,
  selectedTonePreset,
  onSelectTonePreset,
  styleInstruction,
  onChangeStyleInstruction,
  speed,
  onChangeSpeed,
  onGenerate,
  isGenerating,
  disabled,
  charCount,
}) => {
  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film':
        return <Film className="w-3.5 h-3.5" />;
      case 'BookOpen':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'Zap':
        return <Zap className="w-3.5 h-3.5" />;
      case 'Feather':
        return <Feather className="w-3.5 h-3.5" />;
      case 'Radio':
        return <Radio className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  const quickStyleSuggestions = [
    'Deep, cinematic documentary tone',
    'Upbeat, high energy YouTube vlog',
    'Calm, soothing meditation guide',
    'Urgent, fast-paced breaking news',
    'Whispery suspenseful horror story',
  ];

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 backdrop-blur-md shadow-xl space-y-4">
      {/* Top row: Language dropdown & Tone Presets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Language selector */}
        <div className="md:col-span-4 lg:col-span-3">
          <LanguageSelector
            selectedCode={selectedLanguage}
            onSelectLanguage={onSelectLanguage}
            disabled={disabled || isGenerating}
          />
        </div>

        {/* Tone presets pills */}
        <div className="md:col-span-8 lg:col-span-9">
          <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Voice Tone Presets</span>
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {TONE_PRESETS.map((preset) => {
              const isActive = selectedTonePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectTonePreset(preset.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    isActive
                      ? 'bg-purple-600/90 text-white border-purple-400 shadow-md shadow-purple-500/20 ring-1 ring-purple-400'
                      : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-purple-400'}>
                    {getPresetIcon(preset.iconName)}
                  </span>
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Middle row: Style Instruction input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Style Instruction (Custom Tone Prompt)</span>
          </label>
          <span className="text-[11px] text-slate-400">Prefixes model direction to audio</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={styleInstruction}
            onChange={(e) => onChangeStyleInstruction(e.target.value)}
            placeholder='e.g. "Say in a deep, cinematic documentary tone", "Say cheerfully and fast"'
            className="w-full bg-slate-950/90 text-slate-100 placeholder:text-slate-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
          />
        </div>
        {/* Quick insertion tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] text-slate-400 font-medium">Quick suggestions:</span>
          {quickStyleSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChangeStyleInstruction(item)}
              className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-200 border border-slate-700/60 transition cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: Speed slider & Generate Action Button */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2 border-t border-slate-800/80">
        {/* Speed Slider */}
        <div className="md:col-span-5 lg:col-span-4">
          <div className="flex items-center justify-between mb-1">
            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Speed Rate: <span className="text-cyan-300 font-mono">{speed.toFixed(2)}x</span></span>
            </label>
            {speed !== 1.0 && (
              <button
                type="button"
                onClick={() => onChangeSpeed(1.0)}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-0.5"
                title="Reset to 1.0x normal speed"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] text-slate-400 font-mono">0.5x</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-[10px] text-slate-400 font-mono">2.0x</span>
          </div>
        </div>

        {/* Generate button */}
        <div className="md:col-span-7 lg:col-span-8 flex justify-end">
          <button
            type="button"
            onClick={onGenerate}
            disabled={disabled || isGenerating || charCount === 0}
            className={`w-full sm:w-auto min-w-[200px] flex items-center justify-center space-x-2.5 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition shadow-lg cursor-pointer ${
              disabled || isGenerating || charCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Synthesizing Voice...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Generate Voice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
