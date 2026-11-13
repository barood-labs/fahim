import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, type InferenceSource } from "firebase/ai";
import { appCheckReady, initAppCheck } from "./app-check";
import { buildHybridParams } from "./hybrid-params";
import type { ExplainRequest, ExplainResult, Explainer } from "./types";
import type { AppCheckSettings, FirebaseWebConfig } from "../config";
import { classifyError } from "../domain/errors";
import { onDeviceArabicLeak, parseModelJson } from "../domain/parse";
import { buildPrompt } from "../domain/prompt";

export interface FirebaseExplainerOptions {
  firebase: FirebaseWebConfig;
  appCheck: AppCheckSettings;
  model: string;
}

const APP_NAME = "fahim";

function firebaseApp(config: FirebaseWebConfig): FirebaseApp {
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) return existing;
  try {
    return initializeApp(config, APP_NAME);
  } catch {
    return getApp(APP_NAME);
  }
}

function readSource(value: InferenceSource | undefined): ExplainResult["inferenceSource"] {
  if (value === "on_device" || value === "in_cloud") return value;
  return "unreported";
}

/**
 * The only place Fahim calls a model. The call is Firebase AI Logic:
 * getAI(..., GoogleAIBackend) → getGenerativeModel(hybrid params) → generateContent.
 */
export function createFirebaseExplainer(options: FirebaseExplainerOptions): Explainer {
  let appCheckInstalled = false;

  function app(): FirebaseApp {
    const firebase = firebaseApp(options.firebase);
    if (!appCheckInstalled) {
      if (!appCheckReady(options.appCheck)) {
        throw new Error("App Check is not configured. Add a reCAPTCHA Enterprise site key or a debug token.");
      }
      initAppCheck(firebase, options.appCheck);
      appCheckInstalled = true;
    }
    return firebase;
  }

  async function run(request: ExplainRequest): Promise<ExplainResult> {
    const firebase = app();
    const ai = getAI(firebase, { backend: new GoogleAIBackend() });
    const params = buildHybridParams({
      sdkMode: request.sdkMode,
      model: options.model,
      allowArabic: request.allowArabic,
      signal: request.signal,
    });
    const model = getGenerativeModel(ai, params);
    const result = await model.generateContent(buildPrompt(request));
    const inferenceSource = readSource(result.response.inferenceSource);
    const allowArabic = request.allowArabic && inferenceSource !== "on_device";
    const reading = parseModelJson(result.response.text(), { allowArabic });
    return {
      reading,
      inferenceSource,
      practice: false,
      modelLabel: inferenceSource === "on_device" ? "Gemini Nano" : options.model,
      arabicLeak: inferenceSource === "on_device" && onDeviceArabicLeak(reading),
    };
  }

  return {
    kind: "firebase",
    prepareDevice(onProgress, signal) {
      const firebase = app();
      const ai = getAI(firebase, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(
        ai,
        buildHybridParams({
          sdkMode: "prefer_on_device",
          model: options.model,
          allowArabic: false,
          signal,
        }),
      );
      return model.initializeDeviceModel(onProgress);
    },
    async explain(request) {
      try {
        return await run(request);
      } catch (error) {
        const kind = classifyError(error);
        const deviceFailed =
          request.sdkMode === "prefer_on_device" &&
          request.deviceReady === true &&
          (kind === "nano" || kind === "parse" || kind === "unknown");
        if (!deviceFailed) throw error;
        return run({ ...request, sdkMode: "only_in_cloud", allowArabic: request.output !== "en" });
      }
    },
  };
}
