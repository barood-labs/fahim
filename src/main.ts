import "@fontsource/fraunces/latin-500.css";
import "@fontsource/fraunces/latin-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/latin-400.css";
import "@fontsource/noto-naskh-arabic/arabic-500.css";
import "@fontsource/noto-naskh-arabic/arabic-600.css";
import "@fontsource/source-sans-3/latin-400.css";
import "@fontsource/source-sans-3/latin-600.css";
import { createApp, type AppCheckView } from "./app/create-app";
import { appCheckFromEnv, loadOverlay, mergeOverlay, practiceRequested, resolveFirebaseConfig } from "./config";
import { createFirebaseExplainer } from "./engine/firebase-engine";
import { createPracticeExplainer } from "./engine/practice-engine";
import { createBrowserSpeech } from "./speech/browser-speech";
import { createIdbHistory, createIdbQueue } from "./storage/idb";
import { localKv, sessionKv } from "./storage/kv";
import "./styles.css";

function appCheckView(settings: ReturnType<typeof appCheckFromEnv>): AppCheckView {
  const debug = settings.debugToken === true || typeof settings.debugToken === "string";
  if (debug) return { ready: true, provider: "debug", ignoredDebugToken: settings.ignoredDebugToken };
  if (settings.siteKey && settings.provider === "v3") {
    return { ready: true, provider: "v3", ignoredDebugToken: settings.ignoredDebugToken };
  }
  if (settings.siteKey) return { ready: true, provider: "enterprise", ignoredDebugToken: settings.ignoredDebugToken };
  return { ready: false, provider: "missing", ignoredDebugToken: settings.ignoredDebugToken };
}

function setPractice(next: boolean): void {
  const url = new URL(window.location.href);
  if (next) url.searchParams.set("practice", "1");
  else url.searchParams.delete("practice");
  window.location.assign(url.toString());
}

async function boot(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) return;
  const overlay = await loadOverlay();
  const { appCheck, model } = mergeOverlay(appCheckFromEnv(), overlay, import.meta.env.VITE_GEMINI_MODEL ?? "");
  const practice = practiceRequested(import.meta.env, window.location.search);
  const view = appCheckView(appCheck);
  const explainer = practice
    ? createPracticeExplainer({ delayMs: 40 })
    : createFirebaseExplainer({
        firebase: resolveFirebaseConfig(),
        appCheck,
        model,
      });
  createApp(root, {
    explainer,
    history: createIdbHistory(),
    queue: createIdbQueue(),
    speech: createBrowserSpeech(),
    settings: localKv(),
    session: sessionKv(),
    online: () => navigator.onLine,
    practice,
    appCheck: view,
    onPracticeToggle: setPractice,
  });
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }
}

void boot();
