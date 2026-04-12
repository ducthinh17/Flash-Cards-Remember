export function speakEnglish(text: string): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  
  // Try to find a good English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google')) 
    || voices.find(v => v.lang.startsWith('en-'));
    
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function speakMultipleTimes(text: string, times: number = 3, delayMs: number = 1000): void {
  if (!('speechSynthesis' in window)) return;
  
  stopSpeaking();
  
  let count = 0;
  
  const speak = () => {
    if (count >= times) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google')) 
      || voices.find(v => v.lang.startsWith('en-'));
      
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
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

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Pre-load voices
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
