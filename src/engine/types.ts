import type { OutputPreference, Reading, ReplyIntent, SdkMode } from "../domain/types";

export interface ExplainRequest {
  text: string;
  truncated: boolean;
  allowArabic: boolean;
  output: OutputPreference;
  replyIntent: ReplyIntent;
  sdkMode: SdkMode;
  signal?: AbortSignal;
  /** True when Gemini Nano has already reported ready. Used only to decide a cloud retry. */
  deviceReady?: boolean;
}

export interface ExplainResult {
  reading: Reading;
  inferenceSource: "on_device" | "in_cloud" | "unreported";
  practice: boolean;
  modelLabel: string;
  arabicLeak: boolean;
}

export interface Explainer {
  kind: "firebase" | "practice";
  prepareDevice(onProgress: (ratio: number) => void, signal?: AbortSignal): Promise<void>;
  explain(request: ExplainRequest): Promise<ExplainResult>;
}
