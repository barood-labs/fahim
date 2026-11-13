import type { ScriptKind } from "./types";

const ARABIC =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LATIN = /[A-Za-z\u00C0-\u024F]/g;
const KANA = /[\u3040-\u30FF]/g;

export function countScript(text: string): { arabic: number; latin: number; kana: number } {
  return {
    arabic: text.match(ARABIC)?.length ?? 0,
    latin: text.match(LATIN)?.length ?? 0,
    kana: text.match(KANA)?.length ?? 0,
  };
}

/**
 * Arabic vs Latin is enough to choose a route. This is not a language ID model,
 * and it does not call one. A few Arabic letters inside an English email stay
 * "latin" so a name does not force the cloud.
 */
export function detectScript(text: string): ScriptKind {
  const trimmed = text.trim();
  if (!trimmed) return "empty";
  const { arabic, latin, kana } = countScript(trimmed);
  if (arabic + latin + kana === 0) return "other";
  const share = arabic / Math.max(1, arabic + latin);
  if (arabic >= 15 && latin >= 15 && share >= 0.2 && share <= 0.8) return "mixed";
  if (arabic >= 15 && share > 0.8) return "arabic";
  if (arabic >= 40 && arabic > latin) return "arabic";
  if (latin >= 8 && share < 0.2) return "latin";
  if (kana >= 4 && arabic < 15) return "kana";
  if (latin > arabic) return "latin";
  if (arabic > latin) return "arabic";
  return "other";
}

export function arabicShare(text: string): number {
  const { arabic, latin } = countScript(text);
  const letters = arabic + latin;
  if (!letters) return 0;
  return arabic / letters;
}
