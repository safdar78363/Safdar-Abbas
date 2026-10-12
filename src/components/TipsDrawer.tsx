import React from 'react';
import { X, Sparkles, CheckCircle2, Flame, FastForward, PauseCircle, Users, Download } from 'lucide-react';

interface TipsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TipsDrawer: React.FC<TipsDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tips for YouTube Voiceovers</h2>
              <p className="text-xs text-slate-400">Tactics used by top faceless & documentary channels to maximize viewer retention</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/30 transition">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">1. The 3-Second Hook Rule</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Start your script with an intriguing fact or high-stakes question. Use the <strong className="text-purple-300">Energetic YouTuber</strong> or <strong className="text-purple-300">Storytelling</strong> preset and set the first sentence style to "Say with dramatic urgency".
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <FastForward className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">2. Optimal Word Pacing by Niche</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  • <strong>Documentaries & True Crime:</strong> 135–150 WPM (Speed slider: 0.95x - 1.0x with Charon or Fenrir).<br />
                  • <strong>Tech Reviews & Explainers:</strong> 160–175 WPM (Speed slider: 1.05x - 1.15x with Zephyr).<br />
                  • <strong>Shorts & TikToks:</strong> 180–200 WPM (Speed slider: 1.25x with Puck).
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                <PauseCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">3. Micro-Pauses with Punctuation</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Gemini TTS is exceptionally sensitive to punctuation! Use ellipses (<code className="text-cyan-300">...</code>) for suspenseful pauses, em-dashes (<code className="text-cyan-300">—</code>) for topic shifts, and short sentences to create punchy beats for your video editor.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/30 transition">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">4. Multi-Speaker Contrast</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  When creating simulated interviews or co-hosted videos, pair voices with distinct pitch and timbre (e.g. <strong>Charon</strong> for deep narration paired with <strong>Aoede</strong> or <strong>Puck</strong> for quotes and commentary).
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/30 transition">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">5. Lossless WAV Workflow in Premiere / DaVinci</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  VoiceForge exports pure 24kHz 16-bit uncompressed WAV files. This avoids the metallic compression artifacts common in low-bitrate MP3s, making it clean for EQ, compression, and sidechain ducking under background music.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
