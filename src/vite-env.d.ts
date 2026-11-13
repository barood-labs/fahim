/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_APPCHECK_SITE_KEY?: string;
  readonly VITE_APPCHECK_PROVIDER?: string;
  readonly VITE_APPCHECK_DEBUG_TOKEN?: string;
  readonly VITE_APPCHECK_ALLOW_DEBUG?: string;
  readonly VITE_FAHIM_PRACTICE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
}
