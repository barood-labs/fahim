import { firebasePublicConfig } from "./firebase-public-config";

export const DEFAULT_CLOUD_MODEL = "gemini-3.5-flash-lite";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export type AppCheckProviderKind = "enterprise" | "v3";

export interface AppCheckSettings {
  provider: AppCheckProviderKind;
  siteKey: string;
  /** Value assigned to self.FIREBASE_APPCHECK_DEBUG_TOKEN, if debug mode should turn on. */
  debugToken: boolean | string | undefined;
  /** True when a debug token was present in a runtime JSON file and ignored. */
  ignoredDebugToken: boolean;
}

export interface RuntimeOverlay {
  appCheckSiteKey?: string;
  appCheckProvider?: string;
  geminiModel?: string;
  appCheckDebugToken?: string;
  debugToken?: string;
}

const PLACEHOLDER = /your[-_ ]|replace|todo|changeme/i;

export function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isPlaceholder(value: string): boolean {
  return !value || PLACEHOLDER.test(value);
}

export function resolveFirebaseConfig(env: ImportMetaEnv = import.meta.env): FirebaseWebConfig {
  const apiKey = clean(env.VITE_FIREBASE_API_KEY) || firebasePublicConfig.apiKey;
  const projectId = clean(env.VITE_FIREBASE_PROJECT_ID) || firebasePublicConfig.projectId;
  const appId = clean(env.VITE_FIREBASE_APP_ID) || firebasePublicConfig.appId;
  return {
    apiKey,
    authDomain: clean(env.VITE_FIREBASE_AUTH_DOMAIN) || firebasePublicConfig.authDomain,
    projectId,
    storageBucket: clean(env.VITE_FIREBASE_STORAGE_BUCKET) || firebasePublicConfig.storageBucket,
    messagingSenderId: clean(env.VITE_FIREBASE_MESSAGING_SENDER_ID) || firebasePublicConfig.messagingSenderId,
    appId,
  };
}

export function resolveProviderKind(value: string | undefined): AppCheckProviderKind {
  return value?.trim().toLowerCase() === "v3" ? "v3" : "enterprise";
}

/**
 * Debug tokens are secrets. A production build does not read VITE_APPCHECK_DEBUG_TOKEN
 * unless VITE_APPCHECK_ALLOW_DEBUG=true. An existing self.FIREBASE_APPCHECK_DEBUG_TOKEN
 * always wins, so a page can set it before the bundle runs.
 */
export function resolveDebugToken(options: {
  existing: boolean | string | undefined;
  dev: boolean;
  allowDebugInProd: boolean;
  envToken: string | undefined;
}): boolean | string | undefined {
  if (typeof options.existing === "string" && options.existing.trim()) return options.existing.trim();
  if (options.existing === true) return true;
  if (!options.dev && !options.allowDebugInProd) return undefined;
  const token = options.envToken?.trim();
  if (!token) return undefined;
  return token === "true" ? true : token;
}

export function appCheckFromEnv(env: ImportMetaEnv = import.meta.env): AppCheckSettings {
  const dev = Boolean(env.DEV);
  const allowDebugInProd = env.VITE_APPCHECK_ALLOW_DEBUG === "true";
  return {
    provider: resolveProviderKind(env.VITE_APPCHECK_PROVIDER),
    siteKey: clean(env.VITE_APPCHECK_SITE_KEY),
    debugToken: resolveDebugToken({
      existing: typeof window === "undefined" ? undefined : window.FIREBASE_APPCHECK_DEBUG_TOKEN,
      dev,
      allowDebugInProd,
      envToken: dev || allowDebugInProd ? env.VITE_APPCHECK_DEBUG_TOKEN : undefined,
    }),
    ignoredDebugToken: false,
  };
}

export function mergeOverlay(base: AppCheckSettings, overlay: RuntimeOverlay | null, modelFromEnv: string): {
  appCheck: AppCheckSettings;
  model: string;
} {
  if (!overlay) {
    return { appCheck: base, model: modelFromEnv || DEFAULT_CLOUD_MODEL };
  }
  const leaked = Boolean(clean(overlay.appCheckDebugToken) || clean(overlay.debugToken));
  const siteKey = base.siteKey || clean(overlay.appCheckSiteKey);
  const provider = base.siteKey ? base.provider : resolveProviderKind(overlay.appCheckProvider || base.provider);
  return {
    appCheck: {
      ...base,
      siteKey: isPlaceholder(siteKey) ? "" : siteKey,
      provider,
      ignoredDebugToken: base.ignoredDebugToken || leaked,
    },
    model: clean(overlay.geminiModel) || modelFromEnv || DEFAULT_CLOUD_MODEL,
  };
}

export function practiceRequested(env: ImportMetaEnv = import.meta.env, search = ""): boolean {
  if (env.VITE_FAHIM_PRACTICE === "true") return true;
  const params = new URLSearchParams(search);
  return params.get("practice") === "1";
}

export async function loadOverlay(fetchImpl: typeof fetch = fetch): Promise<RuntimeOverlay | null> {
  try {
    const response = await fetchImpl("/config.json", { cache: "no-store" });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) return null;
    const body = (await response.json()) as RuntimeOverlay;
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}
