/**
 * VoiceForge - Studio-grade AI YouTube Text-to-Speech Web App
 * 
 * Features:
 * - 60,000-character script support with sentence-boundary chunking
 * - Sequential rate-limit safe generation with retry, pause & resume
 * - Prebuilt Gemini TTS voices with instant previews
 * - Multi-speaker dialogue script parsing & voice assignment
 * - Tone presets & custom style instructions
 * - 24kHz Lossless WAV audio player with real Canvas waveform visualizer
 * - Quota fallback to browser Web Speech API
 * - In-memory & local storage synced 10-item generation history
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  Mic2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Info,
  Radio,
} from 'lucide-react';

import { Header } from './components/Header';
import { TipsDrawer } from './components/TipsDrawer';
import { VoiceCard } from './components/VoiceCard';
import { ScriptEditor } from './components/ScriptEditor';
import { MultiSpeakerSettings } from './components/MultiSpeakerSettings';
import { ControlsBar } from './components/ControlsBar';
import { GenerationProgressBar } from './components/GenerationProgressBar';
import { AudioPlayerVisualizer } from './components/AudioPlayerVisualizer';
import { HistoryDrawer } from './components/HistoryDrawer';

import { GEMINI_VOICES, SUPPORTED_LANGUAGES, TONE_PRESETS, SAMPLE_SCRIPTS } from './constants/voices';
import {
  VoiceId,
  VoiceOption,
  TonePresetId,
  ScriptChunk,
  HistoryItem,
  LanguageOption,
} from './types';
import {
  chunkSingleSpeakerScript,
  chunkMultiSpeakerScript,
  extractUniqueSpeakers,
} from './utils/scriptChunker';
import {
  base64ToUint8Array,
  createAudioBlob,
  mergeWavArrays,
  ensureWavUint8Array,
  triggerWavDownload,
} from './utils/audioUtils';
import { webSpeechManager } from './utils/webSpeechFallback';

export default function App() {
  // Script and mode state
  const [scriptText, setScriptText] = useState<string>(SAMPLE_SCRIPTS.documentary);
  const [isMultiSpeaker, setIsMultiSpeaker] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('Charon');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(
    SUPPORTED_LANGUAGES.find((l) => l.code === 'en-US') || SUPPORTED_LANGUAGES[0]
  );
  const [selectedTonePreset, setSelectedTonePreset] = useState<TonePresetId>('documentary');
  const [styleInstruction, setStyleInstruction] = useState<string>(
    'Say in a deep, cinematic documentary tone with measured pacing and serious pauses'
  );
  const [speed, setSpeed] = useState<number>(1.0);

  // Multi-speaker voice assignment map
  const [speakerVoiceMap, setSpeakerVoiceMap] = useState<Record<string, VoiceId>>({
    'Speaker 1': 'Charon',
    'Speaker 2': 'Kore',
    'Alex': 'Puck',
    'Sarah': 'Aoede',
  });
  const [detectedSpeakers, setDetectedSpeakers] = useState<string[]>([]);

  // Generation execution state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [chunks, setChunks] = useState<ScriptChunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [completedChunksCount, setCompletedChunksCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState<number>(0);
  const [hasFailedChunk, setHasFailedChunk] = useState<boolean>(false);
  const [failedChunkIndex, setFailedChunkIndex] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const cancelRequestedRef = useRef<boolean>(false);

  // Active audio player state
  const [activeAudioBlob, setActiveAudioBlob] = useState<Blob | null>(null);
  const [activeAudioTitle, setActiveAudioTitle] = useState<string>('Documentary Voiceover');
  const [activeAudioVoices, setActiveAudioVoices] = useState<string[]>(['Charon']);
  const [activeAudioParts, setActiveAudioParts] = useState<
    { index: number; text: string; audioBlob: Blob; speaker?: string; voice?: string }[]
  >([]);

  // History state (last 10 voiceovers in memory)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isTipsOpen, setIsTipsOpen] = useState<boolean>(false);

  // Quota & Fallback notice
  const [isQuotaFallbackActive, setIsQuotaFallbackActive] = useState<boolean>(false);
  const [quotaNoticeMessage, setQuotaNoticeMessage] = useState<string | null>(null);

  // Preview voice state & cache
  const [previewingVoiceId, setPreviewingVoiceId] = useState<VoiceId | null>(null);
  const previewAudioCacheRef = useRef<Record<string, Blob>>({});
  const activePreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Extract dialogue speakers whenever text or mode changes
  useEffect(() => {
    if (isMultiSpeaker) {
      const speakers = extractUniqueSpeakers(scriptText);
      setDetectedSpeakers(speakers);
      // Auto-assign voices to newly discovered speakers
      setSpeakerVoiceMap((prev) => {
        const next = { ...prev };
        speakers.forEach((spk, idx) => {
          if (!next[spk]) {
            next[spk] = GEMINI_VOICES[idx % GEMINI_VOICES.length].id;
          }
        });
        return next;
      });
    }
  }, [scriptText, isMultiSpeaker]);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem('voiceforge_history_meta');
      if (stored) {
        // We load metadata; audio base64 items stored in memory
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const restored: HistoryItem[] = parsed.map((item: any) => ({
            ...item,
            audioBlob: item.audioBase64
              ? createAudioBlob(base64ToUint8Array(item.audioBase64))
              : new Blob(),
          }));
          setHistory(restored);
        }
      }
    } catch (e) {
      console.warn('Failed to restore history from localStorage:', e);
    }
  }, []);

  // Save history to memory and keep latest 10
  const saveToHistory = (item: HistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.filter((h) => h.id !== item.id)].slice(0, 10);
      try {
        // Store minimal representation in localStorage (limit base64 size to prevent storage quota issues)
        const metaOnly = updated.map((h) => ({
          id: h.id,
          title: h.title,
          snippet: h.snippet.slice(0, 120),
          timestamp: h.timestamp,
          duration: h.duration,
          charCount: h.charCount,
          voicesUsed: h.voicesUsed,
          language: h.language,
          tonePreset: h.tonePreset,
          isMultiSpeaker: h.isMultiSpeaker,
          partsCount: h.partsCount,
          // store audioBase64 only for the top 3 items to preserve storage
          audioBase64: h.audioBase64.length < 3000000 ? h.audioBase64 : '',
        }));
        localStorage.setItem('voiceforge_history_meta', JSON.stringify(metaOnly));
      } catch (err) {
        console.warn('Could not persist history to localStorage:', err);
      }
      return updated;
    });
  };

  // Tone preset selection handler
  const handleSelectTonePreset = (presetId: TonePresetId) => {
    setSelectedTonePreset(presetId);
    const found = TONE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setStyleInstruction(found.instruction);
    }
  };

  // Voice preview player
  const handlePreviewVoice = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently playing this preview, stop it
    if (previewingVoiceId === voice.id) {
      if (activePreviewAudioRef.current) {
        activePreviewAudioRef.current.pause();
        activePreviewAudioRef.current = null;
      }
      webSpeechManager.stop();
      setPreviewingVoiceId(null);
      return;
    }

    // Stop any existing playback
    if (activePreviewAudioRef.current) {
      activePreviewAudioRef.current.pause();
      activePreviewAudioRef.current = null;
    }
    webSpeechManager.stop();

    setPreviewingVoiceId(voice.id);

    try {
      // Check cache first
      let blob = previewAudioCacheRef.current[voice.id];
      if (!blob) {
        // Request preview via API
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: voice.previewSample,
            voice: voice.id,
            styleInstruction: 'Speak naturally and warmly',
            language: selectedLanguage.code === 'auto' ? 'auto' : selectedLanguage.promptName,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const rawBytes = base64ToUint8Array(data.audioBase64);
            blob = createAudioBlob(rawBytes);
            previewAudioCacheRef.current[voice.id] = blob;
          }
        }
      }

      if (blob) {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        activePreviewAudioRef.current = audio;
        audio.onended = () => {
          setPreviewingVoiceId(null);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setPreviewingVoiceId(null);
        };
        await audio.play();
      } else {
        // Fallback to browser speech synthesis for preview
        webSpeechManager.speak(
          voice.previewSample,
          selectedLanguage.name,
          1.0,
          1.0,
          undefined,
          () => setPreviewingVoiceId(null),
          () => setPreviewingVoiceId(null)
        );
      }
    } catch (err) {
      console.warn('Voice preview error, fallback to WebSpeech:', err);
      webSpeechManager.speak(
        voice.previewSample,
        selectedLanguage.name,
        1.0,
        1.0,
        undefined,
        () => setPreviewingVoiceId(null),
        () => setPreviewingVoiceId(null)
      );
    }
  };

  /**
   * Generates a single chunk via API with automatic 3x retry
   */
  const generateChunkWithRetry = async (
    chunk: ScriptChunk,
    maxRetries = 3
  ): Promise<{ audioBytes: Uint8Array; base64: string } | null> => {
    let attempt = 0;
    while (attempt <= maxRetries) {
      if (cancelRequestedRef.current) return null;

      try {
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunk.text,
            voice: chunk.voice || selectedVoice,
            styleInstruction,
            language: selectedLanguage.code === 'auto' ? 'auto' : selectedLanguage.promptName,
            speed,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const rawBytes = base64ToUint8Array(data.audioBase64);
            const wavBytes = ensureWavUint8Array(rawBytes);
            return { audioBytes: wavBytes, base64: data.audioBase64 };
          }
        }

        const errData = await res.json().catch(() => ({}));
        const isQuota = res.status === 429 || errData.isQuotaExceeded;

        if (isQuota) {
          setIsQuotaFallbackActive(true);
          setQuotaNoticeMessage('Gemini API quota rate-limit encountered. Switched to browser Web Speech API.');
          throw new Error('API Quota Exceeded (429)');
        }

        throw new Error(errData.error || `HTTP ${res.status}`);
      } catch (err: any) {
        attempt++;
        if (cancelRequestedRef.current) return null;

        if (attempt <= maxRetries) {
          const delay = attempt * 1800; // 1.8s, 3.6s, 5.4s backoff
          setStatusMessage(`Part ${chunk.index + 1} retry ${attempt} of ${maxRetries} in ${(delay / 1000).toFixed(1)}s...`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }
    return null;
  };

  /**
   * Main sequential generation runner
   */
  const startGenerationFlow = async (startIndex = 0, existingChunks?: ScriptChunk[]) => {
    if (!scriptText.trim()) return;

    cancelRequestedRef.current = false;
    setIsGenerating(true);
    setHasFailedChunk(false);
    setErrorMessage('');

    // Prepare chunks
    let initialChunks: ScriptChunk[];
    if (existingChunks && existingChunks.length > 0) {
      initialChunks = existingChunks;
    } else {
      let prepared;
      if (isMultiSpeaker) {
        prepared = chunkMultiSpeakerScript(scriptText, speakerVoiceMap, 3600);
      } else {
        prepared = chunkSingleSpeakerScript(scriptText, 2800, 3800, selectedVoice);
      }
      initialChunks = prepared.map((p) => ({
        index: p.index,
        text: p.text,
        charCount: p.charCount,
        speaker: p.speaker,
        voice: p.voice || selectedVoice,
        status: 'pending',
        retries: 0,
      }));
    }

    setChunks(initialChunks);
    const total = initialChunks.length;

    const completedAudioBytes: Uint8Array[] = [];
    const completedPartsList: {
      index: number;
      text: string;
      audioBlob: Blob;
      speaker?: string;
      voice?: string;
    }[] = [];

    // Pre-populate previously completed chunks if resuming
    for (let i = 0; i < startIndex; i++) {
      if (initialChunks[i]?.audioBlob) {
        completedPartsList.push({
          index: i,
          text: initialChunks[i].text,
          audioBlob: initialChunks[i].audioBlob!,
          speaker: initialChunks[i].speaker,
          voice: initialChunks[i].voice,
        });
        if (initialChunks[i].audioBase64) {
          completedAudioBytes.push(base64ToUint8Array(initialChunks[i].audioBase64!));
        }
      }
    }

    const startTime = Date.now();

    for (let i = startIndex; i < total; i++) {
      if (cancelRequestedRef.current) {
        setStatusMessage('Generation cancelled by user.');
        setIsGenerating(false);
        return;
      }

      setCurrentChunkIndex(i);
      setStatusMessage(`Generating part ${i + 1} of ${total}...`);

      // Update chunk status to generating
      setChunks((prev) =>
        prev.map((c, idx) => (idx === i ? { ...c, status: 'generating' } : c))
      );

      // Estimate remaining time based on average speed
      if (i > startIndex) {
        const elapsed = (Date.now() - startTime) / 1000;
        const avgPerChunk = elapsed / (i - startIndex);
        const remaining = avgPerChunk * (total - i);
        setEstimatedSecondsRemaining(remaining);
      } else {
        setEstimatedSecondsRemaining((total - i) * 3.5);
      }

      const targetChunk = initialChunks[i];

      try {
        const result = await generateChunkWithRetry(targetChunk, 3);

        if (!result) {
          if (cancelRequestedRef.current) {
            setIsGenerating(false);
            return;
          }
          throw new Error('No audio returned for part.');
        }

        const partBlob = createAudioBlob(result.audioBytes);
        completedAudioBytes.push(result.audioBytes);
        completedPartsList.push({
          index: i,
          text: targetChunk.text,
          audioBlob: partBlob,
          speaker: targetChunk.speaker,
          voice: targetChunk.voice,
        });

        // Mark completed
        setChunks((prev) =>
          prev.map((c, idx) =>
            idx === i
              ? {
                  ...c,
                  status: 'completed',
                  audioBlob: partBlob,
                  audioBase64: result.base64,
                }
              : c
          )
        );

        setCompletedChunksCount(completedPartsList.length);

        // Friendly gentle pause between requests to respect rate limits
        if (i < total - 1 && !cancelRequestedRef.current) {
          await new Promise((r) => setTimeout(r, 600));
        }
      } catch (err: any) {
        console.error(`Chunk ${i + 1} failed:`, err);
        setChunks((prev) =>
          prev.map((c, idx) =>
            idx === i ? { ...c, status: 'failed', error: err?.message } : c
          )
        );
        setHasFailedChunk(true);
        setFailedChunkIndex(i);
        setErrorMessage(err?.message || `Part ${i + 1} generation failed.`);
        setIsGenerating(false);
        return;
      }
    }

    // All chunks finished successfully! Now merge into single master WAV
    setStatusMessage('Merging audio chunks into master 24kHz WAV...');

    try {
      const mergedWav = mergeWavArrays(completedAudioBytes, 300, 24000);
      const masterBlob = createAudioBlob(mergedWav);

      // Extract voices used
      const voicesUsed = isMultiSpeaker
        ? Array.from(new Set(initialChunks.map((c) => c.voice || selectedVoice)))
        : [selectedVoice];

      const snippet = scriptText.trim().slice(0, 150);
      const title = isMultiSpeaker
        ? `Dialogue (${voicesUsed.join(' & ')})`
        : `${selectedVoice} Voiceover`;

      setActiveAudioBlob(masterBlob);
      setActiveAudioTitle(title);
      setActiveAudioVoices(voicesUsed);
      setActiveAudioParts(completedPartsList);

      // Save to History
      const historyItem: HistoryItem = {
        id: `vf-${Date.now()}`,
        title,
        snippet,
        timestamp: Date.now(),
        duration: Math.round(scriptText.length / 15), // approximate seconds
        charCount: scriptText.length,
        voicesUsed,
        language: selectedLanguage.name,
        tonePreset: TONE_PRESETS.find((p) => p.id === selectedTonePreset)?.label || 'Custom',
        audioBlob: masterBlob,
        audioUrl: '',
        audioBase64: '',
        isMultiSpeaker,
        partsCount: total,
      };
      saveToHistory(historyItem);

      setStatusMessage(`Completed! Generated ${total} parts successfully.`);
    } catch (mergeErr) {
      console.error('Audio merging error:', mergeErr);
      if (completedPartsList.length > 0) {
        setActiveAudioBlob(completedPartsList[0].audioBlob);
        setActiveAudioParts(completedPartsList);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Cancel ongoing generation
  const handleCancelGeneration = () => {
    cancelRequestedRef.current = true;
    setIsGenerating(false);
    setStatusMessage('Generation stopped. Completed parts preserved.');
  };

  // Resume from failed chunk
  const handleResumeGeneration = () => {
    if (failedChunkIndex !== undefined) {
      startGenerationFlow(failedChunkIndex, chunks);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[650px] h-[650px] bg-purple-900/15 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[10%] w-[550px] h-[550px] bg-indigo-900/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <Header
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTips={() => setIsTipsOpen(true)}
        isQuotaFallbackActive={isQuotaFallbackActive}
      />

      {/* Main Studio Body */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Quota fallback alert notification if active */}
        {quotaNoticeMessage && (
          <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start space-x-3 shadow-lg shadow-amber-950/30 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-300">Notice: </span>
              <span>{quotaNoticeMessage}</span>
              <p className="text-[11px] text-amber-300/80 mt-1">
                You can still synthesize speech without interruption using the browser's built-in Web Speech voices.
              </p>
            </div>
            <button
              onClick={() => setQuotaNoticeMessage(null)}
              className="text-amber-400 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-amber-900/40"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Section Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-slate-950/80 border border-purple-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Built for High-Retention YouTube Channels</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Create Studio Voiceovers for YouTube in Seconds
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Paste up to 60,000 characters. VoiceForge splits your script at sentence boundaries, generates rate-limit safe audio, and exports clean, uncompressed 24kHz WAV files ready for Premiere, DaVinci, or CapCut.
            </p>
          </div>
        </div>

        {/* SECTION 1: Voice Selection (Single Mode) or Multi-Speaker Setup */}
        {!isMultiSpeaker ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-purple-400" />
                  <span>Select Voice Persona</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Powered by Gemini TTS with prebuilt expressive voices
                </p>
              </div>
              <span className="text-xs text-purple-400 font-mono hidden sm:inline">
                {GEMINI_VOICES.length} Voices Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {GEMINI_VOICES.map((v) => (
                <VoiceCard
                  key={v.id}
                  voice={v}
                  isSelected={selectedVoice === v.id}
                  isPreviewing={previewingVoiceId === v.id}
                  onSelect={(id) => setSelectedVoice(id)}
                  onPreview={handlePreviewVoice}
                />
              ))}
            </div>
          </div>
        ) : (
          <MultiSpeakerSettings
            speakerVoiceMap={speakerVoiceMap}
            onUpdateSpeakerVoice={(spk, vId) => {
              setSpeakerVoiceMap((prev) => ({ ...prev, [spk]: vId }));
            }}
            detectedSpeakers={detectedSpeakers}
            onAddCustomSpeaker={(name) => {
              setDetectedSpeakers((prev) => (prev.includes(name) ? prev : [...prev, name]));
              setSpeakerVoiceMap((prev) => ({
                ...prev,
                [name]: prev[name] || 'Puck',
              }));
            }}
            onPreviewVoice={handlePreviewVoice}
            previewingVoiceId={previewingVoiceId}
          />
        )}

        {/* SECTION 2: Script Editor (up to 60,000 characters) */}
        <ScriptEditor
          text={scriptText}
          onChange={setScriptText}
          isMultiSpeaker={isMultiSpeaker}
          onToggleMultiSpeaker={setIsMultiSpeaker}
          isRTL={selectedLanguage.code === 'auto' ? undefined : Boolean(selectedLanguage.isRTL)}
          disabled={isGenerating}
        />

        {/* SECTION 3: Controls Bar (Language, Tone Presets, Style, Speed, Generate) */}
        <ControlsBar
          selectedLanguage={selectedLanguage.code}
          onSelectLanguage={(lang) => setSelectedLanguage(lang)}
          selectedTonePreset={selectedTonePreset}
          onSelectTonePreset={handleSelectTonePreset}
          styleInstruction={styleInstruction}
          onChangeStyleInstruction={setStyleInstruction}
          speed={speed}
          onChangeSpeed={setSpeed}
          onGenerate={() => startGenerationFlow(0)}
          isGenerating={isGenerating}
          disabled={isGenerating || !scriptText.trim()}
          charCount={scriptText.length}
        />

        {/* SECTION 4: Live Generation Progress Bar & Queue */}
        <GenerationProgressBar
          isGenerating={isGenerating}
          totalChunks={chunks.length}
          currentChunkIndex={currentChunkIndex}
          completedChunks={completedChunksCount}
          estimatedSecondsRemaining={estimatedSecondsRemaining}
          statusMessage={statusMessage}
          hasFailedChunk={hasFailedChunk}
          failedChunkIndex={failedChunkIndex}
          errorMessage={errorMessage}
          chunks={chunks}
          onCancel={handleCancelGeneration}
          onResume={handleResumeGeneration}
        />

        {/* SECTION 5: Audio Player with Waveform Visualizer & WAV Download */}
        {activeAudioBlob && (
          <div className="pt-2">
            <AudioPlayerVisualizer
              audioBlob={activeAudioBlob}
              title={activeAudioTitle}
              voicesUsed={activeAudioVoices}
              language={selectedLanguage.name}
              tonePreset={TONE_PRESETS.find((p) => p.id === selectedTonePreset)?.label || 'Custom'}
              parts={activeAudioParts}
            />
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">60,000 Char Chunking</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Seamlessly handles hour-long YouTube scripts. Splits at punctuation boundaries without cutting words.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">300ms Natural Cadence</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Stitches chunks with professional 300ms silence padding for flawless pacing in video timelines.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Multi-Speaker Dialogue</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Write script dialogues and assign distinct voices to each speaker with automatic character recognition.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">VoiceForge</span>
            <span>•</span>
            <span>Free AI Text-to-Speech Studio for Creators</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>24kHz 16-bit Lossless WAV</span>
            <span>•</span>
            <span>Gemini TTS Engine</span>
            <span>•</span>
            <button
              onClick={() => setIsTipsOpen(true)}
              className="text-purple-400 hover:text-purple-300 transition cursor-pointer"
            >
              YouTube Voiceover Tips
            </button>
          </div>
        </div>
      </footer>

      {/* Drawers / Modals */}
      <TipsDrawer isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectPlay={(item) => {
          setActiveAudioBlob(item.audioBlob);
          setActiveAudioTitle(item.title);
          setActiveAudioVoices(item.voicesUsed);
        }}
        onLoadScript={(text) => {
          setScriptText(text);
        }}
        onDeleteItem={(id) => {
          setHistory((prev) => prev.filter((h) => h.id !== id));
        }}
        onClearAll={() => {
          setHistory([]);
          localStorage.removeItem('voiceforge_history_meta');
        }}
      />
    </div>
  );
}
