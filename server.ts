import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '60mb' }));

// Initialize shared Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Convert PCM buffer to standard RIFF/WAV with header
function ensureWavBuffer(buffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  // Check if already starts with RIFF header
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF') {
    return buffer;
  }

  // Prepend 44-byte WAV header
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = buffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0, 4, 'ascii');
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8, 4, 'ascii');
  header.write('fmt ', 12, 4, 'ascii');
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 4, 'ascii');
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, buffer]);
}

// API Health / Config check
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    supportedModels: ['gemini-2.5-flash-preview-tts', 'gemini-3.8-flash-lite-tts'],
    voices: [
      { id: 'Kore', name: 'Kore', gender: 'Feminine', tone: 'Calm & Soothing', description: 'Gentle, warm, and natural for storytelling & meditation' },
      { id: 'Puck', name: 'Puck', gender: 'Masculine', tone: 'Energetic & Upbeat', description: 'Dynamic, lively, perfect for gaming & high-paced YouTube videos' },
      { id: 'Charon', name: 'Charon', gender: 'Masculine', tone: 'Deep & Resonant', description: 'Authoritative, deep cinematic baritone for documentaries' },
      { id: 'Fenrir', name: 'Fenrir', gender: 'Masculine', tone: 'Bold & Intense', description: 'Powerful, dramatic trailer voice with epic presence' },
      { id: 'Zephyr', name: 'Zephyr', gender: 'Neutral', tone: 'Warm & Conversational', description: 'Friendly, clear, relatable tone for tutorials & explainers' },
      { id: 'Aoede', name: 'Aoede', gender: 'Feminine', tone: 'Melodic & Expressive', description: 'Captivating, eloquent storytelling and essays' },
    ],
  });
});

// Single TTS Generation Endpoint
app.post('/api/tts/generate', async (req, res) => {
  try {
    const {
      text,
      voice = 'Puck',
      styleInstruction = '',
      language = 'English',
      speed = 1.0,
      model = 'gemini-2.5-flash-preview-tts',
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
        canFallbackToWebSpeech: true,
      });
    }

    // Build effective prompt with optional language and style instructions
    let formattedPrompt = text.trim();
    const cleanStyle = styleInstruction ? styleInstruction.trim() : '';
    const cleanLang = language && language !== 'auto' && language !== 'Auto-detect' ? language.trim() : '';

    const instructions: string[] = [];
    if (cleanStyle) {
      instructions.push(cleanStyle);
    }
    if (cleanLang) {
      instructions.push(`Speak in ${cleanLang}`);
    }

    if (instructions.length > 0) {
      formattedPrompt = `${instructions.join('. ')}: "${formattedPrompt}"`;
    }

    // List of candidate models to try in order
    const candidateModels = [
      model || 'gemini-2.5-flash-preview-tts',
      'gemini-3.8-flash-lite-tts',
      'gemini-3.8-flash-tts',
    ];

    let lastError: any = null;
    let audioBuffer: Buffer | null = null;
    let mimeType = 'audio/wav';

    for (const currentModel of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: formattedPrompt,
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice,
                },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
        if (part?.inlineData?.data) {
          const rawBuffer = Buffer.from(part.inlineData.data, 'base64');
          audioBuffer = ensureWavBuffer(rawBuffer);
          mimeType = part.inlineData.mimeType || 'audio/wav';
          break; // successfully generated!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`TTS attempt with model ${currentModel} failed:`, err?.message || err);
        // If it's a rate limit (429), or model not found, try next
        continue;
      }
    }

    if (!audioBuffer) {
      const errorMessage = lastError?.message || 'Could not synthesize speech.';
      const isQuota = errorMessage.toLowerCase().includes('quota') ||
                      errorMessage.includes('429') ||
                      lastError?.status === 429;

      return res.status(isQuota ? 429 : 500).json({
        error: errorMessage,
        canFallbackToWebSpeech: true,
        isQuotaExceeded: isQuota,
      });
    }

    const base64Wav = audioBuffer.toString('base64');
    return res.json({
      audioBase64: base64Wav,
      mimeType: 'audio/wav',
      size: audioBuffer.length,
      sampleRate: 24000,
      charCount: text.length,
      voice,
    });
  } catch (err: any) {
    console.error('Unhandled TTS error:', err);
    return res.status(500).json({
      error: err?.message || 'Internal server error while generating audio.',
      canFallbackToWebSpeech: true,
    });
  }
});

// Server-side merge endpoint (optional backup for client-side merge)
app.post('/api/tts/merge', async (req, res) => {
  try {
    const { chunks } = req.body; // array of base64 WAV chunks
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: 'Array of base64 chunks is required.' });
    }

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = (bitsPerSample / 8) * numChannels;

    // 300ms pause in bytes
    const pauseSamples = Math.floor(sampleRate * 0.3);
    const pauseBuffer = Buffer.alloc(pauseSamples * bytesPerSample, 0);

    const rawPcmParts: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkBuf = Buffer.from(chunks[i], 'base64');
      // Extract PCM payload from WAV or use buffer directly
      let pcmData = chunkBuf;
      if (chunkBuf.length >= 44 && chunkBuf.toString('ascii', 0, 4) === 'RIFF') {
        // Find 'data' chunk
        let offset = 12;
        let foundData = false;
        while (offset + 8 <= chunkBuf.length) {
          const subId = chunkBuf.toString('ascii', offset, offset + 4);
          const subSize = chunkBuf.readUInt32LE(offset + 4);
          if (subId === 'data') {
            pcmData = chunkBuf.subarray(offset + 8, offset + 8 + subSize);
            foundData = true;
            break;
          }
          offset += 8 + subSize;
        }
        if (!foundData) {
          pcmData = chunkBuf.subarray(44);
        }
      }

      rawPcmParts.push(pcmData);
      if (i < chunks.length - 1) {
        rawPcmParts.push(pauseBuffer);
      }
    }

    const combinedPcm = Buffer.concat(rawPcmParts);
    const mergedWav = ensureWavBuffer(combinedPcm, sampleRate, numChannels, bitsPerSample);

    res.json({
      mergedBase64: mergedWav.toString('base64'),
      mimeType: 'audio/wav',
      size: mergedWav.length,
    });
  } catch (err: any) {
    console.error('Error merging WAV chunks:', err);
    res.status(500).json({ error: 'Failed to merge audio chunks.' });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('Production build directory "dist" not found. Falling back to Vite dev mode.');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoiceForge server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
