import { detectScript } from "./detect";
import { documentFitsOnDevice, estimateTokens, truncateForDevice } from "./tokens";
import type { OutputPreference, RouteDecision, SdkMode, UserMode } from "./types";

export interface RouteInput {
  text: string;
  mode: UserMode;
  output: OutputPreference;
  online: boolean;
}

function decision(
  partial: Omit<RouteDecision, "estimatedTokens" | "script"> & {
    text: string;
  },
): RouteDecision {
  const script = detectScript(partial.text);
  return {
    outcome: partial.outcome,
    sdkMode: partial.sdkMode,
    allowArabic: partial.allowArabic,
    queueWhenOnline: partial.queueWhenOnline,
    textForModel: partial.textForModel,
    truncated: partial.truncated,
    reasonCode: partial.reasonCode,
    script,
    estimatedTokens: estimateTokens(partial.text),
  };
}

function wantsArabic(output: OutputPreference): boolean {
  return output === "ar" || output === "both";
}

/**
 * Hybrid routing is the product. Arabic is never requested from Gemini Nano.
 * allowArabic is true only for an in-cloud call.
 */
export function routeDocument(input: RouteInput): RouteDecision {
  const text = input.text.trim();
  const script = detectScript(text);
  const arabicOutput = wantsArabic(input.output);
  const fits = documentFitsOnDevice(text);
  const needsCloudScript = script === "arabic" || script === "mixed" || script === "kana" || script === "other";

  if (!text || script === "empty") {
    return decision({
      text,
      outcome: "blocked",
      sdkMode: "only_in_cloud",
      allowArabic: false,
      queueWhenOnline: false,
      textForModel: "",
      truncated: false,
      reasonCode: "empty",
    });
  }

  if (input.mode === "cloud") {
    if (!input.online) {
      return decision({
        text,
        outcome: "blocked",
        sdkMode: "only_in_cloud",
        allowArabic: false,
        queueWhenOnline: true,
        textForModel: text,
        truncated: false,
        reasonCode: "blocked_cloud_offline",
      });
    }
    return decision({
      text,
      outcome: "run",
      sdkMode: "only_in_cloud",
      allowArabic: arabicOutput,
      queueWhenOnline: false,
      textForModel: text,
      truncated: false,
      reasonCode: "user_cloud",
    });
  }

  if (input.mode === "on_device") {
    if (script === "arabic" || script === "mixed") {
      return decision({
        text,
        outcome: "blocked",
        sdkMode: "only_on_device",
        allowArabic: false,
        queueWhenOnline: false,
        textForModel: text,
        truncated: false,
        reasonCode: "blocked_arabic_device",
      });
    }
    if (script !== "latin") {
      return decision({
        text,
        outcome: "blocked",
        sdkMode: "only_on_device",
        allowArabic: false,
        queueWhenOnline: false,
        textForModel: text,
        truncated: false,
        reasonCode: "blocked_script_device",
      });
    }
    const sliced = truncateForDevice(text);
    return decision({
      text,
      outcome: "run",
      sdkMode: "only_on_device",
      allowArabic: false,
      queueWhenOnline: false,
      textForModel: sliced.text,
      truncated: sliced.truncated,
      reasonCode: arabicOutput ? "downgraded_device_arabic" : "user_device",
    });
  }

  // Auto.
  if (!input.online) {
    if (script === "arabic" || script === "mixed") {
      return decision({
        text,
        outcome: "blocked",
        sdkMode: "only_in_cloud",
        allowArabic: false,
        queueWhenOnline: true,
        textForModel: text,
        truncated: false,
        reasonCode: "blocked_arabic_offline",
      });
    }
    if (script !== "latin") {
      return decision({
        text,
        outcome: "blocked",
        sdkMode: "only_in_cloud",
        allowArabic: false,
        queueWhenOnline: true,
        textForModel: text,
        truncated: false,
        reasonCode: "blocked_script_offline",
      });
    }
    const sliced = truncateForDevice(text);
    return decision({
      text,
      outcome: "run",
      sdkMode: "only_on_device",
      allowArabic: false,
      queueWhenOnline: arabicOutput,
      textForModel: sliced.text,
      truncated: sliced.truncated,
      reasonCode: arabicOutput ? "queued_arabic_offline" : "offline_device",
    });
  }

  if (script === "arabic") {
    return cloud(text, arabicOutput, "arabic_source_cloud");
  }
  if (script === "mixed") {
    return cloud(text, arabicOutput, "mixed_cloud");
  }
  if (needsCloudScript) {
    return cloud(text, arabicOutput, "other_script_cloud");
  }
  if (!fits) {
    return cloud(text, arabicOutput, "long_cloud");
  }
  if (arabicOutput) {
    return cloud(text, true, "arabic_output_cloud");
  }

  return decision({
    text,
    outcome: "run",
    sdkMode: "prefer_on_device",
    allowArabic: false,
    queueWhenOnline: false,
    textForModel: text,
    truncated: false,
    reasonCode: "prefer_device",
  });
}

function cloud(text: string, allowArabic: boolean, reasonCode: RouteDecision["reasonCode"]): RouteDecision {
  return decision({
    text,
    outcome: "run",
    sdkMode: "only_in_cloud",
    allowArabic,
    queueWhenOnline: false,
    textForModel: text,
    truncated: false,
    reasonCode,
  });
}

export function actualReason(
  planned: RouteDecision,
  source: "on_device" | "in_cloud" | "unreported",
): RouteDecision["reasonCode"] {
  if (planned.outcome === "blocked") return planned.reasonCode;
  if (source === "unreported") return "source_unreported";
  if (planned.sdkMode !== "only_in_cloud" && source === "in_cloud" && planned.sdkMode !== "only_on_device") {
    return "fell_back_to_cloud";
  }
  if (planned.sdkMode === "only_on_device" && source === "in_cloud") {
    return "fell_back_to_cloud";
  }
  if (planned.sdkMode === "only_in_cloud" && source === "on_device") {
    return "unexpected_device";
  }
  return planned.reasonCode;
}

export function sdkModeLabel(mode: SdkMode): string {
  return mode;
}
