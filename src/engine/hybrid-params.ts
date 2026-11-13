import { InferenceMode, type HybridParams } from "firebase/ai";
import { CLOUD_SYSTEM_INSTRUCTION } from "../domain/prompt";
import { cloudSchema, deviceResponseConstraint, deviceSchema } from "../domain/schema";
import type { SdkMode } from "../domain/types";

/** Chrome Prompt API languages. Arabic is intentionally absent. */
export const NANO_INPUT_LANGUAGES = ["en"] as const;

export const CLOUD_MODEL_DEFAULT = "gemini-3.5-flash-lite";

export function inferenceMode(mode: SdkMode): (typeof InferenceMode)[keyof typeof InferenceMode] {
  if (mode === "only_on_device") return InferenceMode.ONLY_ON_DEVICE;
  if (mode === "only_in_cloud") return InferenceMode.ONLY_IN_CLOUD;
  return InferenceMode.PREFER_ON_DEVICE;
}

/**
 * Every live reading uses this object. There is no other model client.
 * On-device output is English. The cloud model is a free-tier text model.
 */
export function buildHybridParams(options: {
  sdkMode: SdkMode;
  model?: string;
  allowArabic: boolean;
  signal?: AbortSignal;
}): HybridParams {
  const model = options.model?.trim() || CLOUD_MODEL_DEFAULT;
  const schema = options.allowArabic ? cloudSchema() : deviceSchema();
  return {
    mode: inferenceMode(options.sdkMode),
    onDeviceParams: {
      createOptions: {
        expectedInputs: [{ type: "text", languages: [...NANO_INPUT_LANGUAGES] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
        initialPrompts: [
          {
            role: "system",
            content: [
              {
                type: "text",
                value: "You are Fahim. Explain one English notice as JSON. Do not write Arabic.",
              },
            ],
          },
        ],
        signal: options.signal,
      },
      promptOptions: {
        responseConstraint: deviceResponseConstraint(),
      },
    },
    inCloudParams: {
      model,
      systemInstruction: CLOUD_SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: options.allowArabic ? 2048 : 1280,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    },
  };
}
