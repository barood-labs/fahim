import type { Reading, UiLang } from "./types";

function lines(title: string, body: string[]): string[] {
  if (!body.length) return [];
  return [title, ...body, ""];
}

export function formatBrief(reading: Reading, lang: UiLang): string {
  const arFirst = lang === "ar" && reading.summaryAr;
  const summary = arFirst
    ? [reading.summaryAr as string, "", reading.summaryEn]
    : [reading.summaryEn, reading.summaryAr ?? ""].filter(Boolean);
  const actions = reading.actions.map((item, index) => {
    const due = item.due ? ` (${item.due})` : "";
    const ar = arFirst && item.textAr ? item.textAr : item.textEn;
    const extra = arFirst && item.textAr ? `\n   ${item.textEn}` : item.textAr ? `\n   ${item.textAr}` : "";
    return `${index + 1}. ${ar}${due}${extra}`;
  });
  const facts = [
    ...reading.dates.map((item) => `${item.labelEn}: ${item.value}`),
    ...reading.amounts.map((item) => `${item.labelEn}: ${item.value}`),
    ...reading.contacts.map((item) =>
      [item.name, item.phone, item.email].filter(Boolean).join(" · "),
    ),
  ];
  const reply = arFirst && reading.replyAr ? [reading.replyAr, "", reading.replyEn] : [reading.replyEn, reading.replyAr ?? ""].filter(Boolean);

  return [
    "Fahim",
    "",
    ...lines(lang === "ar" ? "الملخص" : "Summary", summary),
    ...lines(lang === "ar" ? "المطلوب" : "What you may need to do", actions),
    ...lines(lang === "ar" ? "تواريخ ومبالغ" : "Dates and amounts", facts),
    ...lines(lang === "ar" ? "رد مقترح" : "Draft reply", reply),
    reading.caveatEn,
    reading.caveatAr ?? "",
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n")
    .trim();
}
