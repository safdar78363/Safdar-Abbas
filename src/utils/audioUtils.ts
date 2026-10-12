/**
 * Audio processing utilities for VoiceForge
 * Handles PCM/WAV conversions, multi-chunk concatenation, silence insertion, and waveform calculation.
 */

// Convert Base64 string to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert Uint8Array to Base64 string
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Ensure audio bytes have a valid RIFF/WAV header
export function ensureWavUint8Array(
  rawBytes: Uint8Array,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Uint8Array {
  // Check for 'RIFF' header
  if (
    rawBytes.length >= 12 &&
    rawBytes[0] === 0x52 && // R
    rawBytes[1] === 0x49 && // I
    rawBytes[2] === 0x46 && // F
    rawBytes[3] === 0x46    // F
  ) {
    return rawBytes;
  }

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = rawBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // "RIFF"
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');

  // "fmt "
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data"
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const out = new Uint8Array(buffer);
  out.set(rawBytes, 44);
  return out;
}

function writeAscii(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Extract raw PCM bytes from a WAV buffer
export function extractPcmFromWav(wavBytes: Uint8Array): {
  pcm: Uint8Array;
  sampleRate: number;
  channels: number;
} {
  if (
    wavBytes.length < 44 ||
    wavBytes[0] !== 0x52 || // R
    wavBytes[1] !== 0x49 || // I
    wavBytes[2] !== 0x46 || // F
    wavBytes[3] !== 0x46    // F
  ) {
    return { pcm: wavBytes, sampleRate: 24000, channels: 1 };
  }

  const view = new DataView(wavBytes.buffer, wavBytes.byteOffset, wavBytes.byteLength);
  const channels = view.getUint16(22, true) || 1;
  const sampleRate = view.getUint32(24, true) || 24000;

  // Search for 'data' chunk
  let offset = 12;
  while (offset + 8 <= wavBytes.length) {
    const chunkId = String.fromCharCode(
      wavBytes[offset],
      wavBytes[offset + 1],
      wavBytes[offset + 2],
      wavBytes[offset + 3]
    );
    const chunkSize = view.getUint32(offset + 4, true);
    if (chunkId === 'data') {
      const pcm = wavBytes.subarray(offset + 8, offset + 8 + chunkSize);
      return { pcm, sampleRate, channels };
    }
    offset += 8 + chunkSize;
  }

  // Fallback to standard 44-byte header offset
  return {
    pcm: wavBytes.subarray(44),
    sampleRate,
    channels,
  };
}

// Merge multiple WAV byte arrays into one single WAV file with 300ms pause
export function mergeWavArrays(
  wavList: Uint8Array[],
  pauseMs = 300,
  defaultSampleRate = 24000
): Uint8Array {
  if (wavList.length === 0) return new Uint8Array(0);
  if (wavList.length === 1) return ensureWavUint8Array(wavList[0], defaultSampleRate);

  const pcmList: Uint8Array[] = [];
  let sampleRate = defaultSampleRate;
  let channels = 1;

  for (let i = 0; i < wavList.length; i++) {
    const { pcm, sampleRate: sr, channels: ch } = extractPcmFromWav(wavList[i]);
    pcmList.push(pcm);
    if (sr) sampleRate = sr;
    if (ch) channels = ch;
  }

  // Calculate silence bytes for pauseMs
  // 16-bit mono = 2 bytes per sample
  const pauseSamples = Math.floor((sampleRate * pauseMs) / 1000);
  const bytesPerSample = 2 * channels;
  const pauseBytes = new Uint8Array(pauseSamples * bytesPerSample); // all zeros

  // Calculate total PCM length
  let totalPcmLen = 0;
  for (let i = 0; i < pcmList.length; i++) {
    totalPcmLen += pcmList[i].length;
    if (i < pcmList.length - 1) {
      totalPcmLen += pauseBytes.length;
    }
  }

  const mergedPcm = new Uint8Array(totalPcmLen);
  let writeOffset = 0;

  for (let i = 0; i < pcmList.length; i++) {
    mergedPcm.set(pcmList[i], writeOffset);
    writeOffset += pcmList[i].length;
    if (i < pcmList.length - 1) {
      mergedPcm.set(pauseBytes, writeOffset);
      writeOffset += pauseBytes.length;
    }
  }

  return ensureWavUint8Array(mergedPcm, sampleRate, channels, 16);
}

// Convert audio bytes to a browser playable Blob URL
export function createAudioBlob(wavBytes: Uint8Array): Blob {
  const readyWav = ensureWavUint8Array(wavBytes);
  return new Blob([readyWav.buffer as ArrayBuffer], { type: 'audio/wav' });
}

// Download blob as WAV file
export function triggerWavDownload(blob: Blob, filename = 'voiceforge-audio.wav') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

// Decode audio blob into AudioBuffer using Web Audio Context
let sharedAudioContext: AudioContext | null = null;
export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

// Generate normalized waveform bar heights (0.05 to 1.0)
export function computeWaveformData(audioBuffer: AudioBuffer, barCount = 100): number[] {
  const rawData = audioBuffer.getChannelData(0); // Left/Mono channel
  const sampleCount = rawData.length;
  const blockSize = Math.floor(sampleCount / barCount);
  const bars: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j] || 0);
    }
    const avg = sum / (blockSize || 1);
    // amplify small signals slightly with power curve for clean visual look
    const normalized = Math.min(1, Math.max(0.06, Math.pow(avg * 3.5, 0.75)));
    bars.push(normalized);
  }

  return bars;
}

// Format seconds into MM:SS or HH:MM:SS
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
