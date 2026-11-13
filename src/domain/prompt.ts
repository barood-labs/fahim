import type { OutputPreference, ReplyIntent } from "./types";

export interface PromptInput {
  text: string;
  truncated: boolean;
  allowArabic: boolean;
  output: OutputPreference;
  replyIntent: ReplyIntent;
}

const INTENT: Record<ReplyIntent, string> = {
  acknowledge: "The reply confirms they received the notice and will do the main thing it asks.",
  question: "The reply asks one specific question about the most important unclear point. Do not ask a list of questions.",
  decline: "The reply politely says they cannot do the main request and asks what the alternative is.",
};

export function buildPrompt(input: PromptInput): string {
  const arabic = input.allowArabic
    ? "Write summary_ar, what_you_may_need_to_do_ar, text_ar, label_ar, role_ar, reply_ar, and caveat_ar in clear Modern Standard Arabic that a parent can read aloud. Do not transliterate English idioms."
    : "Write English only. Do not write Arabic in any field. This request is for an on-device model whose official languages do not include Arabic.";

  const cut = input.truncated
    ? "The notice was cut to fit the on-device token limit. Do not invent anything that would have been in the missing ending. Say that the reading covers only the beginning."
    : "The full notice is below.";

  return [
    "You are Fahim, a careful life-admin helper. The reader pasted one real-world notice: a school email, a lease, a clinic message, a bill, or a workplace note.",
    "Use only facts written in the notice. If a date, amount, phone number, or name is not there, leave it out. Never invent a deadline.",
    "Short sentences. No legal, medical, or financial advice. Say what the notice appears to ask, and that the reader should confirm it with the sender.",
    "Copy dates and amounts as written.",
    INTENT[input.replyIntent],
    "The reply is first person, ready to edit, and signed [your name]. Do not add facts the reader did not provide.",
    arabic,
    cut,
    "Return only the JSON object described by the schema.",
    "",
    "NOTICE:",
    input.text,
  ].join("\n");
}

export const CLOUD_SYSTEM_INSTRUCTION = [
  "You are Fahim. Explain one notice as structured JSON.",
  "Never invent dates, amounts, or contacts.",
  "When Arabic is requested, write Modern Standard Arabic.",
  "When Arabic is not requested, leave Arabic fields as empty strings.",
  "This is a single turn. Do not ask the reader a follow-up question outside the reply draft.",
].join(" ");
