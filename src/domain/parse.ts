import { arabicShare } from "./detect";
import type { ActionItem, Contact, Fact, Reading } from "./types";

const CAVEAT_EN =
  "This is a reading aid, not legal, medical, or financial advice. Confirm dates and amounts on the original before you act.";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function orNull(value: string): string | null {
  return value ? value : null;
}

function list(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.map(asRecord).filter((item): item is Record<string, unknown> => item !== null);
}

export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(body.slice(start, end + 1));
    throw new Error("The model did not return JSON.");
  }
}

export interface ParseOptions {
  allowArabic: boolean;
}

export function parseModelJson(raw: string, options: ParseOptions): Reading {
  const parsed = asRecord(extractJson(raw));
  if (!parsed) throw new Error("The model did not return a JSON object.");

  const allow = options.allowArabic;
  const actions: ActionItem[] = list(parsed.actions).slice(0, 8).map((item, index) => ({
    id: `a${index + 1}`,
    textEn: str(item.text_en) || str(item.text) || str(item.action),
    textAr: allow ? orNull(str(item.text_ar)) : null,
    due: orNull(str(item.due)),
  })).filter((item) => item.textEn || item.textAr);

  const dates: Fact[] = list(parsed.dates).slice(0, 6).map((item) => ({
    labelEn: str(item.label_en) || str(item.label) || "Date",
    labelAr: allow ? orNull(str(item.label_ar)) : null,
    value: str(item.value),
  })).filter((item) => item.value);

  const amounts: Fact[] = list(parsed.amounts).slice(0, 6).map((item) => ({
    labelEn: str(item.label_en) || str(item.label) || "Amount",
    labelAr: allow ? orNull(str(item.label_ar)) : null,
    value: str(item.value),
  })).filter((item) => item.value);

  const contacts: Contact[] = list(parsed.contacts).slice(0, 4).map((item) => ({
    name: str(item.name),
    roleEn: orNull(str(item.role_en) || str(item.role)),
    roleAr: allow ? orNull(str(item.role_ar)) : null,
    phone: orNull(str(item.phone)),
    email: orNull(str(item.email)),
  })).filter((item) => item.name || item.phone || item.email);

  const summaryEn = str(parsed.summary_en) || str(parsed.summary);
  if (!summaryEn) throw new Error("The model returned no English summary.");

  return {
    sourceLanguage: str(parsed.source_language) || "unknown",
    summaryEn,
    summaryAr: allow ? orNull(str(parsed.summary_ar)) : null,
    whatToDoEn: str(parsed.what_you_may_need_to_do) || summaryEn,
    whatToDoAr: allow ? orNull(str(parsed.what_you_may_need_to_do_ar)) : null,
    actions,
    dates,
    amounts,
    contacts,
    replyEn: str(parsed.reply_en) || str(parsed.reply),
    replyAr: allow ? orNull(str(parsed.reply_ar)) : null,
    caveatEn: str(parsed.caveat_en) || CAVEAT_EN,
    caveatAr: allow ? orNull(str(parsed.caveat_ar)) : null,
  };
}

export function onDeviceArabicLeak(reading: Reading): boolean {
  const blob = [reading.summaryEn, reading.whatToDoEn, reading.replyEn, ...reading.actions.map((item) => item.textEn)].join("\n");
  return arabicShare(blob) > 0.3;
}
