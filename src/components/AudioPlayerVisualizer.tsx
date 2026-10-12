import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileAudio,
} from 'lucide-react';
import {
  computeWaveformData,
  decodeAudioBlob,
  formatAudioTime,
  triggerWavDownload,
} from '../utils/audioUtils';

interface AudioPart {
  index: number;
  text: string;
  audioBlob: Blob;
  duration?: number;
  speaker?: string;
  voice?: string;
}

interface AudioPlayerVisualizerProps {
  audioBlob: Blob | null;
  title?: string;
  voicesUsed?: string[];
  language?: string;
  tonePreset?: string;
  parts?: AudioPart[];
}

export const AudioPlayerVisualizer: React.FC<AudioPlayerVisualizerProps> = ({
  audioBlob,
  title = 'Voiceover Audio',
  voicesUsed = ['Puck'],
  language = 'English',
  tonePreset = 'Documentary',
  parts = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showPartsDrawer, setShowPartsDrawer] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Compute waveform whenever audioBlob changes
  useEffect(() => {
    if (!audioBlob) {
      setAudioUrl(null);
      setWaveformBars([]);
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);

    // Decode audio for waveform bars
    decodeAudioBlob(audioBlob)
      .then((buf) => {
        setDuration(buf.duration);
        const bars = computeWaveformData(buf, 100);
        setWaveformBars(bars);
      })
      .catch((err) => {
        console.warn('Failed to compute waveform bars, fallback to simulated peaks:', err);
        // Fallback default pleasant peak pattern
        const mockBars = Array.from({ length: 90 }, (_, i) => {
          return 0.2 + 0.6 * Math.abs(Math.sin((i / 90) * Math.PI * 4) * Math.cos(i * 0.3));
        });
        setWaveformBars(mockBars);
      });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioBlob]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const skipTime = (offset: number) => {
    if (audioRef.current) {
      handleSeek(audioRef.current.currentTime + offset);
    }
  };

  // Canvas waveform rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformBars.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barCount = waveformBars.length;
    const spacing = 2;
    const totalSpacing = spacing * (barCount - 1);
    const barWidth = Math.max(2, (width - totalSpacing) / barCount);

    const progress = duration > 0 ? currentTime / duration : 0;

    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.max(4, waveformBars[i] * height * 0.88);
      const x = i * (barWidth + spacing);
      const y = (height - barHeight) / 2;
      const barProgress = i / barCount;

      ctx.beginPath();
      // Round corner bars
      const radius = Math.min(barWidth / 2, 2);
      ctx.roundRect(x, y, barWidth, barHeight, radius);

      if (barProgress <= progress) {
        // Played section: vibrant gradient cyan/purple
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#A855F7'); // purple-500
        gradient.addColorStop(1, '#06B6D4'); // cyan-500
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
        ctx.shadowBlur = 6;
      } else {
        // Unplayed section
        ctx.fillStyle = '#334155'; // slate-700
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }

    // Draw active playhead line
    const playheadX = progress * width;
    ctx.beginPath();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#06B6D4';
    ctx.shadowBlur = 8;
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [waveformBars, currentTime, duration]);

  // Click on canvas to seek
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    handleSeek(ratio * duration);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    setHoverProgress(ratio * duration);
  };

  const handleCanvasMouseLeave = () => {
    setHoverProgress(null);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1.0;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handlePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  if (!audioBlob) return null;

  // File size in MB/KB
  const sizeKb = Math.round(audioBlob.size / 1024);
  const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-purple-500/40 p-5 sm:p-6 backdrop-blur-xl shadow-2xl shadow-purple-950/40 space-y-4">
      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      {/* Top Track Info & Download Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50 uppercase font-mono tracking-wider">
                WAV 24kHz Lossless
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Voice: <strong className="text-slate-200">{voicesUsed.join(', ')}</strong></span>
            <span>•</span>
            <span>Language: <strong className="text-slate-200">{language}</strong></span>
            <span>•</span>
            <span>Preset: <strong className="text-purple-300">{tonePreset}</strong></span>
            <span>•</span>
            <span>Size: <strong className="text-slate-200">{sizeFormatted}</strong></span>
          </div>
        </div>

        {/* Master Download Button */}
        <div className="flex items-center space-x-2">
          {parts.length > 1 && (
            <button
              type="button"
              onClick={() => setShowPartsDrawer(!showPartsDrawer)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>{parts.length} Parts</span>
              {showPartsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => triggerWavDownload(audioBlob, `voiceforge-${title.toLowerCase().replace(/\s+/g, '-')}.wav`)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Master WAV</span>
          </button>
        </div>
      </div>

      {/* Interactive Waveform Canvas Container */}
      <div className="relative bg-slate-950/80 rounded-xl p-3 border border-slate-800/90 select-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={84}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          className="w-full h-20 sm:h-24 cursor-pointer rounded-lg"
        />

        {/* Hover timestamp tooltip */}
        {hoverProgress !== null && (
          <div
            className="absolute top-2 pointer-events-none px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300 shadow"
            style={{
              left: `${Math.min(92, Math.max(8, (hoverProgress / duration) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {formatAudioTime(hoverProgress)}
          </div>
        )}
      </div>

      {/* Playback Controls & Time */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Play/Pause & Skips */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => skipTime(-5)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Rewind 5s"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/25 transition transform hover:scale-105 active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipTime(5)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Forward 5s"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleSeek(0)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Current Time / Duration display */}
        <div className="font-mono text-sm sm:text-base text-slate-200 font-semibold tracking-wider">
          <span className="text-cyan-400">{formatAudioTime(currentTime)}</span>
          <span className="text-slate-500 mx-1.5">/</span>
          <span className="text-slate-400">{formatAudioTime(duration)}</span>
        </div>

        {/* Speed rate & Volume */}
        <div className="flex items-center space-x-3">
          {/* Rate selector */}
          <div className="flex items-center space-x-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handlePlaybackRate(rate)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Expandable Individual Parts Drawer */}
      {showPartsDrawer && parts.length > 1 && (
        <div className="pt-3 border-t border-slate-800 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Generated Script Chunks ({parts.length} parts)
            </span>
            <span>Download individual WAV segments</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {parts.map((p, idx) => (
              <div
                key={p.index}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-purple-900/30 text-purple-300 text-[10px] font-mono flex items-center justify-center shrink-0 border border-purple-700/40">
                    P{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-200 truncate font-medium">
                      {p.speaker ? `${p.speaker}: ` : ''}{p.text.slice(0, 45)}...
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {Math.round(p.audioBlob.size / 1024)} KB • WAV
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerWavDownload(p.audioBlob, `voiceforge-part-${idx + 1}.wav`)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition shrink-0 cursor-pointer"
                  title="Download this part as WAV"
                >
                  <Download className="w-3 h-3 text-purple-400" />
                  <span>Part {idx + 1}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
