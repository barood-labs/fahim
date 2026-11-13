interface RecognitionResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}

interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResult>;
}

interface RecognitionErrorEvent {
  readonly error: string;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface SpeechPort {
  canListen: boolean;
  canSpeak: boolean;
  listen(lang: string, hooks: { onText: (text: string, final: boolean) => void }): Promise<void>;
  stopListening(): void;
  speak(text: string, lang: string): void;
  stopSpeaking(): void;
}

export function createBrowserSpeech(): SpeechPort {
  const Ctor = recognitionCtor();
  let active: Recognition | null = null;
  return {
    canListen: Boolean(Ctor),
    canSpeak: typeof window.speechSynthesis !== "undefined",
    listen(lang, hooks) {
      if (!Ctor) return Promise.reject(new Error("This browser has no speech recognition."));
      active?.abort();
      const recognition = new Ctor();
      active = recognition;
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.continuous = false;
      return new Promise((resolve, reject) => {
        recognition.onresult = (event) => {
          let text = "";
          let final = false;
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            text += event.results[i][0].transcript;
            if (event.results[i].isFinal) final = true;
          }
          hooks.onText(text, final);
        };
        recognition.onerror = (event) => {
          active = null;
          if (event.error === "aborted" || event.error === "no-speech") resolve();
          else reject(new Error(event.error));
        };
        recognition.onend = () => {
          active = null;
          resolve();
        };
        recognition.start();
      });
    },
    stopListening() {
      active?.stop();
      active = null;
    },
    speak(text, lang) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    },
    stopSpeaking() {
      window.speechSynthesis?.cancel();
    },
  };
}

export function createSilentSpeech(): SpeechPort {
  return {
    canListen: false,
    canSpeak: false,
    listen() {
      return Promise.reject(new Error("speech disabled"));
    },
    stopListening() {},
    speak() {},
    stopSpeaking() {},
  };
}
