import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";
import type { AppCheckSettings } from "../config";

/**
 * Sets self.FIREBASE_APPCHECK_DEBUG_TOKEN before initializeAppCheck.
 * The modular SDK reads that global at initialization, not at import time.
 * Returns the token that was applied, if any.
 */
export function installDebugToken(debugToken: boolean | string | undefined): boolean | string | undefined {
  if (debugToken === undefined) return currentDebugToken();
  if (typeof window === "undefined") return debugToken;
  const existing = window.FIREBASE_APPCHECK_DEBUG_TOKEN;
  if (existing === true || (typeof existing === "string" && existing.trim())) return existing;
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  return debugToken;
}

export function currentDebugToken(): boolean | string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.FIREBASE_APPCHECK_DEBUG_TOKEN;
}

export function appCheckReady(settings: AppCheckSettings): boolean {
  return Boolean(settings.siteKey) || settings.debugToken === true || typeof settings.debugToken === "string";
}

export function initAppCheck(app: FirebaseApp, settings: AppCheckSettings): AppCheck {
  installDebugToken(settings.debugToken);
  const debug = settings.debugToken === true || typeof settings.debugToken === "string";
  const siteKey = settings.siteKey || (debug ? "fahim-debug-placeholder" : "");
  if (!siteKey) {
    throw new Error("App Check is not configured. Add a reCAPTCHA Enterprise site key or a debug token.");
  }
  const provider =
    settings.provider === "v3" ? new ReCaptchaV3Provider(siteKey) : new ReCaptchaEnterpriseProvider(siteKey);
  return initializeAppCheck(app, {
    provider,
    isTokenAutoRefreshEnabled: true,
  });
}
