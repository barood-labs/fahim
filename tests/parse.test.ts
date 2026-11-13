import { describe, expect, it } from "vitest";
import { extractJson, onDeviceArabicLeak, parseModelJson } from "../src/domain/parse";

describe("parseModelJson", () => {
  it("strips fences and drops Arabic when the route forbids it", () => {
    const raw = "```json\n" + JSON.stringify({
      source_language: "English",
      summary_en: "Bring twelve dollars.",
      summary_ar: "أحضِروا اثني عشر دولاراً.",
      what_you_may_need_to_do: "Pay the fee.",
      actions: [{ text_en: "Return the slip.", text_ar: "أعيدوا الورقة.", due: "Friday" }],
      dates: [],
      amounts: [{ label_en: "Fee", value: "$12" }],
      contacts: [],
      reply_en: "I will send it.",
      reply_ar: "سأرسلها.",
      caveat_en: "Not advice.",
    }) + "\n```";
    const reading = parseModelJson(raw, { allowArabic: false });
    expect(reading.summaryEn).toBe("Bring twelve dollars.");
    expect(reading.summaryAr).toBeNull();
    expect(reading.actions[0].textAr).toBeNull();
    expect(reading.actions[0].due).toBe("Friday");
    expect(reading.replyAr).toBeNull();
  });

  it("keeps Arabic on a cloud reading", () => {
    const reading = parseModelJson(JSON.stringify({
      summary_en: "The visit is Thursday.",
      summary_ar: "الزيارة يوم الخميس.",
      what_you_may_need_to_do: "Be home.",
      actions: [],
      dates: [],
      amounts: [],
      contacts: [],
      reply_en: "I will be home.",
      reply_ar: "سأكون في البيت.",
    }), { allowArabic: true });
    expect(reading.summaryAr).toContain("الخميس");
    expect(reading.replyAr).toContain("البيت");
  });

  it("flags an on-device answer that is mostly Arabic", () => {
    const reading = parseModelJson(JSON.stringify({
      summary_en: "صيانة سخان الماء في الشقة ستكون يوم الخميس بين العاشرة والثانية عشرة",
      what_you_may_need_to_do: "Stay home.",
      actions: [],
      dates: [],
      amounts: [],
      contacts: [],
      reply_en: "Ok.",
    }), { allowArabic: false });
    expect(onDeviceArabicLeak(reading)).toBe(true);
  });

  it("extracts an object wrapped in prose", () => {
    expect(extractJson('Here {"summary_en":"Hi"} thanks')).toMatchObject({ summary_en: "Hi" });
  });
});
