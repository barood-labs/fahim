import { onDeviceArabicLeak } from "../domain/parse";
import type { Reading, ReplyIntent } from "../domain/types";
import { matchSample, readingFromSample } from "../samples";
import type { Explainer } from "./types";

const CAVEAT_EN =
  "Practice mode did not call Firebase AI Logic. Connect the app and try again for a real reading.";

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("The on-device download was cancelled.", "AbortError"));
    });
  });
}

function scan(text: string, intent: ReplyIntent, allowArabic: boolean): Reading {
  const emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const phones = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) ?? [];
  const amounts = text.match(/\$\d[\d,]*(?:\.\d{2})?/g) ?? [];
  const preview = text.trim().replace(/\s+/g, " ").slice(0, 280);
  const replyEn =
    intent === "decline"
      ? "Hello,\n\nI cannot do what this notice asks. Please tell me the alternative.\n\n[your name]"
      : intent === "question"
        ? "Hello,\n\nI read the notice. Can you confirm the date and the amount before I act?\n\n[your name]"
        : "Hello,\n\nI received this notice and I will follow up.\n\n[your name]";
  return {
    sourceLanguage: "Unknown",
    summaryEn: `Practice mode did not call a model. This is only a surface scan: ${preview}`,
    summaryAr: allowArabic
      ? "وضع التدريب لم يستدعِ نموذجاً. هذا مسح سطحي للنص فقط. للحصول على شرح حقيقي، شغّلوا Firebase AI Logic."
      : null,
    whatToDoEn: "Add Firebase App Check, then explain this notice again.",
    whatToDoAr: allowArabic ? "أضيفوا App Check ثم اطلبوا الشرح مرة أخرى." : null,
    actions: emails.length || phones.length || amounts.length
      ? [
          {
            id: "a1",
            textEn: "Check the contacts and amounts below against the original.",
            textAr: allowArabic ? "راجعوا بيانات الاتصال والمبالغ في النص الأصلي." : null,
            due: null,
          },
        ]
      : [],
    dates: [],
    amounts: [...new Set(amounts)].slice(0, 6).map((value) => ({
      labelEn: "Amount found in the text",
      labelAr: allowArabic ? "مبلغ ورد في النص" : null,
      value,
    })),
    contacts: [...new Set([...emails, ...phones])].slice(0, 4).map((value) => ({
      name: value.includes("@") ? value : "Phone in the text",
      roleEn: null,
      roleAr: null,
      phone: value.includes("@") ? null : value.trim(),
      email: value.includes("@") ? value : null,
    })),
    replyEn,
    replyAr: allowArabic ? "السلام عليكم،\n\nاستلمت الرسالة وسأراجعها.\n\n[اسمكم]" : null,
    caveatEn: CAVEAT_EN,
    caveatAr: allowArabic ? "وضع التدريب لم يتصل بفايربيس." : null,
  };
}

export function createPracticeExplainer(options?: { delayMs?: number; failPrepare?: boolean }): Explainer {
  const delayMs = options?.delayMs ?? 350;
  return {
    kind: "practice",
    async prepareDevice(onProgress, signal) {
      if (options?.failPrepare) {
        throw new Error("Gemini Nano is not available in this environment.");
      }
      for (const step of [0.2, 0.55, 1]) {
        await wait(delayMs, signal);
        onProgress(step);
      }
    },
    async explain(request) {
      await wait(delayMs > 0 ? Math.min(delayMs, 250) : 0, request.signal);
      const sample = matchSample(request.text);
      const reading = sample
        ? readingFromSample(sample, request.replyIntent, request.allowArabic && request.sdkMode === "only_in_cloud")
        : scan(request.text, request.replyIntent, request.allowArabic && request.sdkMode === "only_in_cloud");
      const inferenceSource = request.sdkMode === "only_in_cloud" ? "in_cloud" : "on_device";
      return {
        reading,
        inferenceSource,
        practice: true,
        modelLabel: "Practice mode",
        arabicLeak: inferenceSource === "on_device" && onDeviceArabicLeak(reading),
      };
    },
  };
}
