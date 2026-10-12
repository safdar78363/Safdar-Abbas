import React from 'react';
import {
  Loader2,
  StopCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import { ScriptChunk } from '../types';

interface GenerationProgressBarProps {
  isGenerating: boolean;
  totalChunks: number;
  currentChunkIndex: number;
  completedChunks: number;
  estimatedSecondsRemaining: number;
  statusMessage: string;
  hasFailedChunk: boolean;
  failedChunkIndex?: number;
  errorMessage?: string;
  chunks: ScriptChunk[];
  onCancel: () => void;
  onResume: () => void;
}

export const GenerationProgressBar: React.FC<GenerationProgressBarProps> = ({
  isGenerating,
  totalChunks,
  currentChunkIndex,
  completedChunks,
  estimatedSecondsRemaining,
  statusMessage,
  hasFailedChunk,
  failedChunkIndex,
  errorMessage,
  chunks,
  onCancel,
  onResume,
}) => {
  if (!isGenerating && !hasFailedChunk && completedChunks === 0) return null;

  const percent = totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-md shadow-2xl space-y-3.5 animate-in fade-in duration-200">
      {/* Top status & controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {isGenerating ? (
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : hasFailedChunk ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm sm:text-base">
                {statusMessage}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-purple-900/40 border border-purple-700/50 text-purple-300">
                {percent}%
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
              <span>Completed {completedChunks} of {totalChunks} parts</span>
              {isGenerating && estimatedSecondsRemaining > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center space-x-1 text-cyan-400">
                    <Clock className="w-3 h-3" />
                    <span>Est. ~{Math.ceil(estimatedSecondsRemaining)}s remaining</span>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {isGenerating && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold transition cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          {hasFailedChunk && !isGenerating && (
            <button
              type="button"
              onClick={onResume}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume from Part {(failedChunkIndex ?? 0) + 1}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main animated progress bar */}
      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            hasFailedChunk
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400'
          }`}
          style={{ width: `${Math.max(4, percent)}%` }}
        />
      </div>

      {/* Error message banner if retry failed */}
      {hasFailedChunk && errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-rose-300">Generation paused: </span>
            <span>{errorMessage}</span>
            <p className="text-[11px] text-rose-400/80 mt-1">
              Parts 1 to {completedChunks} are preserved in memory. Click "Resume" to retry without starting over.
            </p>
          </div>
        </div>
      )}

      {/* Chunks miniature visualizer bar */}
      {totalChunks > 1 && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center space-x-1">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>Script Parts Pipeline ({totalChunks} parts)</span>
            </span>
            <span>Rate-limit safe sequential processing</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
            {chunks.map((chk, idx) => {
              let bg = 'bg-slate-950 border-slate-800 text-slate-500';
              if (chk.status === 'completed') {
                bg = 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400';
              } else if (chk.status === 'generating') {
                bg = 'bg-purple-900/60 border-purple-500 text-purple-200 animate-pulse ring-1 ring-purple-500';
              } else if (chk.status === 'failed') {
                bg = 'bg-rose-950/60 border-rose-500/60 text-rose-400';
              }

              return (
                <div
                  key={chk.index}
                  className={`p-1.5 rounded-md border text-center font-mono text-[10px] transition ${bg}`}
                  title={`Part ${idx + 1} (${chk.charCount.toLocaleString()} chars)${
                    chk.speaker ? ` - ${chk.speaker}` : ''
                  }`}
                >
                  P{idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
