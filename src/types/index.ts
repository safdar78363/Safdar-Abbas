export type VoiceId = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Aoede' | 'Leda' | 'Orus';

export interface VoiceOption {
  id: VoiceId;
  name: string;
  gender: 'Feminine' | 'Masculine' | 'Neutral';
  tone: string;
  description: string;
  previewSample: string;
  bestFor: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  promptName: string;
  nativeName: string;
  flag: string;
  isRTL?: boolean;
}

export type TonePresetId = 'documentary' | 'storytelling' | 'energetic' | 'calm' | 'news' | 'custom';

export interface TonePreset {
  id: TonePresetId;
  label: string;
  instruction: string;
  iconName: string;
  badge: string;
}

export interface ScriptChunk {
  index: number;
  text: string;
  charCount: number;
  speaker?: string;
  voice?: VoiceId;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  retries: number;
  audioBase64?: string;
  audioBlob?: Blob;
  duration?: number;
  error?: string;
}

export interface GenerationProgress {
  isGenerating: boolean;
  totalChunks: number;
  currentChunkIndex: number;
  completedChunks: number;
  progressPercent: number;
  estimatedSecondsRemaining: number;
  statusMessage: string;
  hasFailedChunk: boolean;
  failedChunkIndex?: number;
}

export interface SpeakerConfig {
  name: string;
  voice: VoiceId;
  styleInstruction: string;
  color: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  snippet: string;
  timestamp: number;
  duration: number; // in seconds
  charCount: number;
  voicesUsed: string[];
  language: string;
  tonePreset: string;
  audioBlob: Blob;
  audioUrl: string;
  audioBase64: string;
  isMultiSpeaker: boolean;
  partsCount: number;
  parts?: {
    index: number;
    text: string;
    audioBlob: Blob;
    duration: number;
  }[];
}
