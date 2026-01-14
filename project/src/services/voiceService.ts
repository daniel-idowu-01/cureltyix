interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  
  start(): void;
  stop(): void;
  abort(): void;
  
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    const SpeechRecognitionConstructor = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;
      
      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError?.('Failed to start speech recognition');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: SpeechSynthesisVoice;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: any) => void;
    }
  ): void {
    if (!this.isSpeechSynthesisSupported()) {
      console.error('Speech synthesis is not supported');
      options?.onError?.('Speech synthesis is not supported in this browser');
      return;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;
    
    if (options?.voice) {
      utterance.voice = options.voice;
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.currentUtterance = null;
      options?.onError?.(event);
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  getPreferredVoice(): SpeechSynthesisVoice | undefined {
    const voices = this.getAvailableVoices();
    
    const englishVoices = voices.filter(voice => 
      voice.lang.startsWith('en')
    );

    const femaleVoice = englishVoices.find(voice => 
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('victoria') ||
      voice.name.toLowerCase().includes('zira')
    );

    if (femaleVoice) return femaleVoice;

    return englishVoices[0] || voices[0];
  }

  cleanup(): void {
    this.stopListening();
    this.stopSpeaking();
  }
}

let voiceServiceInstance: VoiceService | null = null;

export const getVoiceService = (): VoiceService => {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
};