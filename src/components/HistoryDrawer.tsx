import React from 'react';
import {
  X,
  History,
  Play,
  Download,
  Trash2,
  FileText,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { HistoryItem } from '../types';
import { formatAudioTime, triggerWavDownload } from '../utils/audioUtils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectPlay: (item: HistoryItem) => void;
  onLoadScript: (script: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectPlay,
  onLoadScript,
  onDeleteItem,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Generation History</h2>
              <p className="text-xs text-slate-400">Last 10 generated voiceovers in memory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <History className="w-10 h-10 stroke-1 mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">No voiceovers yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Generated voiceovers will appear here for fast replay and WAV downloads.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const sizeKb = Math.round(item.audioBlob.size / 1024);
              const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

              return (
                <div
                  key={item.id}
                  className="group p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-purple-500/40 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-200 group-hover:text-purple-300 transition truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        "{item.snippet}"
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300 font-medium">
                      {item.voicesUsed.join(', ')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {item.language}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                      {item.tonePreset}
                    </span>
                    {item.partsCount > 1 && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-800/40 text-purple-300 font-mono">
                        {item.partsCount} Parts
                      </span>
                    )}
                    <span className="font-mono text-slate-500">
                      {formatAudioTime(item.duration)} • {sizeStr}
                    </span>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPlay(item);
                          onClose();
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerWavDownload(item.audioBlob, `voiceforge-${item.id}.wav`)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
                        title="Download WAV"
                      >
                        <Download className="w-3 h-3 text-cyan-400" />
                        <span>WAV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onLoadScript(item.snippet);
                          onClose();
                        }}
                        className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition cursor-pointer"
                        title="Load script into editor"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {history.length} / 10 items saved
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-slate-400 hover:text-rose-400 transition"
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
