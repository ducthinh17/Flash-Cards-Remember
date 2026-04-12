/**
 * Multilingual Speech Synthesis
 * Supports: English, Chinese (zh-CN), Japanese (ja-JP), Korean (ko-KR), Vietnamese (vi-VN)
 */

/** Detect language from Unicode character ranges */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'en-US';

  const cleaned = text.trim();

  // Chinese (CJK Unified Ideographs)
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  // Japanese (Hiragana + Katakana)
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
  // Korean (Hangul)
  const koreanRegex = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/;
  // Vietnamese diacritics (specific combining characters common in Vietnamese)
  const vietnameseRegex = /[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵ]/i;

  if (japaneseRegex.test(cleaned)) return 'ja-JP';
  if (koreanRegex.test(cleaned)) return 'ko-KR';
  if (chineseRegex.test(cleaned)) return 'zh-CN';
  if (vietnameseRegex.test(cleaned)) return 'vi-VN';

  return 'en-US';
}

/** Check if text is Chinese */
export function isChinese(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

/** Get best available voice for a given BCP-47 language code */
function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const langBase = lang.split('-')[0]; // e.g. 'zh' from 'zh-CN'

  // Priority 1: exact lang + Google voice
  let voice = voices.find(v => v.lang === lang && v.name.includes('Google'));
  if (voice) return voice;

  // Priority 2: exact lang match
  voice = voices.find(v => v.lang === lang);
  if (voice) return voice;

  // Priority 3: same language base (e.g. zh-TW fallback for zh-CN)
  voice = voices.find(v => v.lang.startsWith(langBase) && v.name.includes('Google'));
  if (voice) return voice;

  voice = voices.find(v => v.lang.startsWith(langBase));
  if (voice) return voice;

  return null;
}

/** Speak text with automatic language detection */
export function speakTerm(text: string): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  stopSpeaking();

  const lang = detectLanguage(text);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  // Adjust rate for Chinese/Japanese (slightly slower for clarity)
  if (lang === 'zh-CN' || lang === 'ja-JP') {
    utterance.rate = 0.85;
  }

  const voice = getBestVoice(lang);
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
}

/** Speak text multiple times with automatic language detection */
export function speakTermMultipleTimes(text: string, times: number = 3, delayMs: number = 1000): void {
  if (!('speechSynthesis' in window)) return;

  stopSpeaking();

  const lang = detectLanguage(text);
  let count = 0;

  const speak = () => {
    if (count >= times) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    if (lang === 'zh-CN' || lang === 'ja-JP') {
      utterance.rate = 0.85;
    }

    const voice = getBestVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      count++;
      if (count < times) {
        setTimeout(speak, delayMs);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  speak();
}

/** Legacy: speak as English (kept for backward compatibility) */
export function speakEnglish(text: string): void {
  speakTerm(text);
}

/** Legacy: speak multiple times as English (kept for backward compatibility) */
export function speakMultipleTimes(text: string, times: number = 3, delayMs: number = 1000): void {
  speakTermMultipleTimes(text, times, delayMs);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Pre-load voices on init
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices(); // trigger cache
  };
  // Also trigger immediately in case voices are already loaded
  window.speechSynthesis.getVoices();
}
