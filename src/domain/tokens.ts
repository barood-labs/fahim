/**
 * Chrome on-device requests through Firebase AI Logic are capped at 9,216
 * tokens, prompt and answer included. countTokens() is not reliable in hybrid
 * mode, so Fahim uses a conservative character estimate and keeps the document
 * well under the cap. About 3 characters per token over-estimates English.
 */
export const ON_DEVICE_CONTEXT_LIMIT = 9216;
export const ON_DEVICE_DOCUMENT_TOKENS = 4000;
export const CHARS_PER_TOKEN = 3;
export const MAX_INPUT_CHARS = 80_000;

export function estimateTokens(text: string): number {
  const length = text.trim().length;
  if (!length) return 0;
  return Math.ceil(length / CHARS_PER_TOKEN);
}

export function documentFitsOnDevice(text: string): boolean {
  return estimateTokens(text) <= ON_DEVICE_DOCUMENT_TOKENS;
}

export function truncateForDevice(text: string): { text: string; truncated: boolean } {
  const maxChars = ON_DEVICE_DOCUMENT_TOKENS * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: text.slice(0, maxChars), truncated: true };
}
