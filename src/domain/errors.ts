export type ErrorCode =
  | "empty"
  | "too_long"
  | "quota"
  | "app_check"
  | "nano"
  | "offline"
  | "safety"
  | "parse"
  | "unknown";

export function classifyError(error: unknown): ErrorCode {
  const message = errorText(error).toLowerCase();
  if (!message) return "unknown";
  if (message.includes("429") || message.includes("resource_exhausted") || message.includes("resource exhausted") || message.includes("quota") || message.includes("rate limit")) {
    return "quota";
  }
  if (
    message.includes("app check") ||
    message.includes("appcheck") ||
    message.includes("app-check") ||
    message.includes("recaptcha") ||
    message.includes("debug token") ||
    message.includes("attestation")
  ) {
    return "app_check";
  }
  if (
    message.includes("languagemodel") ||
    message.includes("language model") ||
    message.includes("only_on_device") ||
    message.includes("api_not_enabled") ||
    message.includes("not available in this environment") ||
    message.includes("gemini nano")
  ) {
    return "nano";
  }
  if (message.includes("safety") || message.includes("blocked") && message.includes("prompt")) {
    return "safety";
  }
  if (message.includes("failed to fetch") || message.includes("networkerror") || message.includes("network error") || message.includes("offline")) {
    return "offline";
  }
  if (message.includes("json") || message.includes("did not return")) return "parse";
  return "unknown";
}

export function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "";
  }
}
