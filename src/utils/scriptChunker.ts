import { VoiceId } from '../types';

export interface DialogueTurn {
  speaker: string;
  text: string;
  voice?: VoiceId;
}

export interface PreparedChunk {
  index: number;
  text: string;
  speaker?: string;
  voice?: VoiceId;
  charCount: number;
}

/**
 * Splits a text into clean sentences across multiple languages (English, Urdu, Arabic, Hindi, Spanish).
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];

  // Punctuation characters:
  // Latin: . ! ? ; \n
  // Arabic/Urdu: ۔ ؟ !
  // Hindi purna viram: । ॥
  // Ellipsis: …
  const regex = /([^.!?۔؟।॥;\n]+[.!?۔؟।॥;\n]+|[^.!?۔؟।॥;\n]+$)/gu;
  const matches = text.match(regex);

  if (!matches) {
    return [text];
  }

  return matches
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Splits long single-speaker text into chunks of approximately 3,000 to 4,000 characters,
 * strictly breaking at sentence boundaries.
 */
export function chunkSingleSpeakerScript(
  text: string,
  targetMinChars = 2800,
  targetMaxChars = 3900,
  defaultVoice: VoiceId = 'Puck'
): PreparedChunk[] {
  const cleanText = text.trim();
  if (!cleanText) return [];

  // If text is already under targetMaxChars, keep as single chunk
  if (cleanText.length <= targetMaxChars) {
    return [
      {
        index: 0,
        text: cleanText,
        voice: defaultVoice,
        charCount: cleanText.length,
      },
    ];
  }

  const sentences = splitIntoSentences(cleanText);
  const chunks: PreparedChunk[] = [];
  let currentChunkText = '';

  for (const sentence of sentences) {
    // If a single sentence is abnormally huge (e.g. > 4,000 chars without punctuation),
    // we split by clauses (commas, semicolons) or spaces
    if (sentence.length > targetMaxChars) {
      if (currentChunkText.trim().length > 0) {
        chunks.push({
          index: chunks.length,
          text: currentChunkText.trim(),
          voice: defaultVoice,
          charCount: currentChunkText.trim().length,
        });
        currentChunkText = '';
      }

      // Sub-divide the massive sentence
      const words = sentence.split(/\s+/);
      let subChunk = '';
      for (const word of words) {
        if ((subChunk + ' ' + word).length > targetMaxChars && subChunk.length > 0) {
          chunks.push({
            index: chunks.length,
            text: subChunk.trim(),
            voice: defaultVoice,
            charCount: subChunk.trim().length,
          });
          subChunk = word;
        } else {
          subChunk = subChunk ? `${subChunk} ${word}` : word;
        }
      }
      if (subChunk.trim().length > 0) {
        chunks.push({
          index: chunks.length,
          text: subChunk.trim(),
          voice: defaultVoice,
          charCount: subChunk.trim().length,
        });
      }
      continue;
    }

    const proposedLength = currentChunkText ? currentChunkText.length + 1 + sentence.length : sentence.length;

    if (proposedLength <= targetMaxChars) {
      currentChunkText = currentChunkText ? `${currentChunkText} ${sentence}` : sentence;
    } else {
      // Current chunk is full enough, push it
      if (currentChunkText.trim().length > 0) {
        chunks.push({
          index: chunks.length,
          text: currentChunkText.trim(),
          voice: defaultVoice,
          charCount: currentChunkText.trim().length,
        });
      }
      currentChunkText = sentence;
    }
  }

  if (currentChunkText.trim().length > 0) {
    chunks.push({
      index: chunks.length,
      text: currentChunkText.trim(),
      voice: defaultVoice,
      charCount: currentChunkText.trim().length,
    });
  }

  // Normalize indices
  return chunks.map((c, i) => ({ ...c, index: i }));
}

/**
 * Parses dialogue script format (e.g. "Speaker 1: Hello...\nSpeaker 2: Hi there...")
 */
export function parseDialogueTurns(text: string): DialogueTurn[] {
  const lines = text.split('\n');
  const turns: DialogueTurn[] = [];
  let currentSpeaker = 'Speaker 1';
  let currentSpeech = '';

  // Matches lines like:
  // "Host: ..." or "Speaker 1: ..." or "Narrator: ..." or "Alex - ..."
  const speakerRegex = /^([A-Za-z0-9_ -]+)\s*[:：-]\s*(.*)$/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(speakerRegex);
    if (match) {
      // New speaker detected
      if (currentSpeech.trim().length > 0) {
        turns.push({
          speaker: currentSpeaker,
          text: currentSpeech.trim(),
        });
        currentSpeech = '';
      }
      currentSpeaker = match[1].trim();
      currentSpeech = match[2].trim();
    } else {
      // Continuation of current speaker's text
      currentSpeech = currentSpeech ? `${currentSpeech} ${line}` : line;
    }
  }

  if (currentSpeech.trim().length > 0) {
    turns.push({
      speaker: currentSpeaker,
      text: currentSpeech.trim(),
    });
  }

  return turns;
}

/**
 * Extracts unique speaker names from dialogue text
 */
export function extractUniqueSpeakers(text: string): string[] {
  const turns = parseDialogueTurns(text);
  const speakers = new Set<string>();
  for (const turn of turns) {
    if (turn.speaker) speakers.add(turn.speaker);
  }
  return Array.from(speakers);
}

/**
 * Chunks multi-speaker dialogue, preserving speaker assignments and respecting ~3,500 char max limit
 */
export function chunkMultiSpeakerScript(
  text: string,
  speakerVoiceMap: Record<string, VoiceId>,
  targetMaxChars = 3800
): PreparedChunk[] {
  const turns = parseDialogueTurns(text);
  if (turns.length === 0) {
    return chunkSingleSpeakerScript(text, 2800, targetMaxChars);
  }

  const chunks: PreparedChunk[] = [];

  for (const turn of turns) {
    const voice = speakerVoiceMap[turn.speaker] || 'Puck';

    // If turn is within size limits, keep as one turn
    if (turn.text.length <= targetMaxChars) {
      chunks.push({
        index: chunks.length,
        text: turn.text,
        speaker: turn.speaker,
        voice,
        charCount: turn.text.length,
      });
    } else {
      // Split large turn at sentence boundaries
      const subChunks = chunkSingleSpeakerScript(turn.text, 2500, targetMaxChars, voice);
      for (const sc of subChunks) {
        chunks.push({
          index: chunks.length,
          text: sc.text,
          speaker: turn.speaker,
          voice,
          charCount: sc.charCount,
        });
      }
    }
  }

  return chunks.map((c, i) => ({ ...c, index: i }));
}
