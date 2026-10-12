import React from 'react';
import { FileText, Trash2, Clock, AlignLeft, Layers, Users, Sparkles } from 'lucide-react';
import { SAMPLE_SCRIPTS } from '../constants/voices';

interface ScriptEditorProps {
  text: string;
  onChange: (newText: string) => void;
  isMultiSpeaker: boolean;
  onToggleMultiSpeaker: (enabled: boolean) => void;
  isRTL?: boolean;
  disabled?: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  text,
  onChange,
  isMultiSpeaker,
  onToggleMultiSpeaker,
  isRTL,
  disabled = false,
}) => {
  const isEffectiveRTL =
    isRTL !== undefined
      ? isRTL
      : /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text.slice(0, 1000));

  const MAX_CHARS = 60000;
  const charCount = text.length;
  const charPercent = (charCount / MAX_CHARS) * 100;

  // Words calculation
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  // Estimate reading time at average 150 words per minute
  const readingSeconds = Math.ceil((words / 150) * 60);
  const minutes = Math.floor(readingSeconds / 60);
  const seconds = readingSeconds % 60;
  const timeFormatted = `${minutes}m ${seconds}s`;

  // Color logic for character counter:
  // Orange at 80% (48,000+), Red at 100% (60,000)
  const getCounterStyle = () => {
    if (charCount >= MAX_CHARS) {
      return 'text-rose-400 bg-rose-500/10 border-rose-500/40 font-bold animate-pulse';
    }
    if (charCount >= MAX_CHARS * 0.8) {
      return 'text-amber-400 bg-amber-500/10 border-amber-500/40 font-semibold';
    }
    return 'text-slate-400 bg-slate-800/80 border-slate-700/80';
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (val.length > MAX_CHARS) {
      val = val.slice(0, MAX_CHARS);
    }
    onChange(val);
  };

  const loadPreset = (type: 'documentary' | 'energetic' | 'multispeaker' | 'longScript') => {
    if (type === 'multispeaker') {
      onToggleMultiSpeaker(true);
    }
    onChange(SAMPLE_SCRIPTS[type]);
  };

  return (
    <div className="flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-hidden shadow-xl">
      {/* Editor toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => onToggleMultiSpeaker(false)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                !isMultiSpeaker
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Single Voice</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleMultiSpeaker(true)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                isMultiSpeaker
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Multi-Speaker Dialogue</span>
            </button>
          </div>
        </div>

        {/* Load samples and actions */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] text-slate-400 hidden xl:inline">Load Sample:</span>
          <button
            type="button"
            onClick={() => loadPreset('documentary')}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-white transition cursor-pointer"
          >
            Mystery Doc
          </button>
          <button
            type="button"
            onClick={() => loadPreset('energetic')}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-white transition cursor-pointer"
          >
            Tech Short
          </button>
          <button
            type="button"
            onClick={() => loadPreset('multispeaker')}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-white transition cursor-pointer"
          >
            Podcast Dialogue
          </button>
          <button
            type="button"
            onClick={() => loadPreset('longScript')}
            className="px-2 py-1 rounded bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/40 text-[11px] font-medium text-purple-300 hover:text-white transition cursor-pointer"
            title="Load long multi-chapter script to test automatic sentence chunking"
          >
            Long Form (Multi-part)
          </button>

          {text.length > 0 && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 rounded text-slate-500 hover:text-rose-400 transition ml-1"
              title="Clear script"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative p-4">
        <textarea
          value={text}
          onChange={handleTextChange}
          maxLength={MAX_CHARS}
          disabled={disabled}
          dir={isEffectiveRTL ? 'rtl' : 'ltr'}
          placeholder={
            isMultiSpeaker
              ? 'Write or paste your dialogue here. Format each line with the speaker name followed by a colon:\n\nSpeaker 1: Welcome to the channel!\nSpeaker 2: Today we dive into the future of artificial intelligence.\nSpeaker 1: Don\'t forget to like and subscribe!'
              : isEffectiveRTL
              ? 'اپنا اسکرپٹ یہاں درج کریں... (60,000 حروف تک)\nأدخل النص هنا...'
              : 'Paste your YouTube voiceover script here... (Up to 60,000 characters).\n\nVoiceForge will automatically break long scripts into 3,000–4,000 character chunks at natural sentence endings, generate them sequentially to respect rate limits, and stitch them into a seamless WAV file with 300ms pause!'
          }
          rows={10}
          className={`w-full bg-slate-950/70 text-slate-100 placeholder:text-slate-600 rounded-xl p-4 border border-slate-800/90 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500 outline-none text-sm sm:text-base leading-relaxed resize-y min-h-[220px] transition ${
            isEffectiveRTL ? 'text-right font-sans' : 'text-left font-sans'
          }`}
        />

        {/* Progress bar line along bottom of textarea container */}
        <div className="absolute bottom-4 left-4 right-4 h-1 bg-slate-800/80 rounded-full overflow-hidden pointer-events-none">
          <div
            className={`h-full transition-all duration-300 ${
              charCount >= MAX_CHARS
                ? 'bg-rose-500'
                : charCount >= MAX_CHARS * 0.8
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-purple-500 to-indigo-400'
            }`}
            style={{ width: `${Math.min(100, charPercent)}%` }}
          />
        </div>
      </div>

      {/* Editor footer: Live Character Counter and Word Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 text-xs">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="flex items-center space-x-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>{words.toLocaleString()} words</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Est. ~{timeFormatted}</span>
          </div>
          {charCount > 3500 && (
            <div className="hidden sm:flex items-center space-x-1.5 text-purple-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Will chunk into ~{Math.ceil(charCount / 3400)} parts</span>
            </div>
          )}
        </div>

        {/* Live Counter badge and RTL Indicator */}
        <div className="flex items-center space-x-2">
          {isEffectiveRTL && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
              <span>✍️ RTL</span>
            </span>
          )}
          <div className={`px-2.5 py-1 rounded-full border text-xs tracking-wide transition ${getCounterStyle()}`}>
            <span>{charCount.toLocaleString()}</span>
            <span className="opacity-60"> / {MAX_CHARS.toLocaleString()} chars</span>
            {charCount >= MAX_CHARS && <span className="ml-1 font-bold">(Max Limit Reached)</span>}
            {charCount >= MAX_CHARS * 0.8 && charCount < MAX_CHARS && <span className="ml-1 font-medium">(80%+ reached)</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
