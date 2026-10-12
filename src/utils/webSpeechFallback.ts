/**
 * Browser Web Speech API fallback for VoiceForge
 * Activates when Gemini API quota runs out (429) or when offline.
 */

export interface WebSpeechVoiceInfo {
  name: string;
  lang: string;
  default: boolean;
}

export function getBrowserVoices(langCode?: string): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  if (!langCode) return voices;

  const prefix = langCode.slice(0, 2).toLowerCase();
  return voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
}

export function findBestBrowserVoice(language: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();

  const langMap: Record<string, string> = {
    English: 'en',
    Urdu: 'ur',
    Hindi: 'hi',
    Arabic: 'ar',
    Spanish: 'es',
    French: 'fr',
    German: 'de',
    Italian: 'it',
    Portuguese: 'pt',
    Russian: 'ru',
    Turkish: 'tr',
    Japanese: 'ja',
    Korean: 'ko',
    Chinese: 'zh',
    Bengali: 'bn',
    Tamil: 'ta',
    Telugu: 'te',
    Marathi: 'mr',
    Indonesian: 'id',
    Vietnamese: 'vi',
    Thai: 'th',
    Polish: 'pl',
    Dutch: 'nl',
    Ukrainian: 'uk',
    Romanian: 'ro',
  };

  const code = langMap[language] || (language.length === 2 ? language.toLowerCase() : 'en');
  const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(code));
  if (matching.length > 0) {
    // Prefer Google or Natural voices if available
    const natural = matching.find(
      (v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Enhanced')
    );
    return natural || matching[0];
  }
  return voices[0] || null;
}

export class WebSpeechPlayer {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private onEndCallback?: () => void;
  private onProgressCallback?: (charIndex: number) => void;

  public speak(
    text: string,
    language: string,
    speed = 1.0,
    pitch = 1.0,
    onProgress?: (charIndex: number) => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onError?.(new Error('Web Speech API is not supported in this browser.'));
      return;
    }

    this.stop();
    this.onEndCallback = onEnd;
    this.onProgressCallback = onProgress;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = findBestBrowserVoice(language);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.rate = Math.max(0.5, Math.min(2.0, speed));
    utterance.pitch = pitch;

    utterance.onboundary = (e) => {
      this.onProgressCallback?.(e.charIndex);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.onEndCallback?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.isPaused = false;
      onError?.(e);
    };

    this.utterance = utterance;
    this.isSpeaking = true;
    this.isPaused = false;
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (this.isSpeaking && !this.isPaused) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  public resume() {
    if (this.isSpeaking && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
  }

  public getActiveState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
    };
  }
}

export const webSpeechManager = new WebSpeechPlayer();
