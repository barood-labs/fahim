import type { SchemaRequest } from "firebase/ai";

const str = (description: string): SchemaRequest => ({
  type: "string",
  description,
});

function arrayOf(description: string, item: SchemaRequest, maxItems: number): SchemaRequest {
  return {
    type: "array",
    description,
    items: item,
    maxItems,
  };
}

/** English-only JSON. This is what Gemini Nano is asked to fill. */
export function deviceSchema(): SchemaRequest {
  return {
    type: "object",
    properties: {
      source_language: str("Short language name of the notice, such as English."),
      summary_en: str("Plain-language English summary. Facts from the notice only."),
      what_you_may_need_to_do: str("One short English paragraph of the practical next step."),
      actions: arrayOf(
        "Concrete actions the reader may need to take.",
        {
          type: "object",
          properties: {
            text_en: str("One action in English."),
            due: str("Due date or time exactly as written, or an empty string."),
          },
          required: ["text_en", "due"],
        },
        8,
      ),
      dates: arrayOf(
        "Dates and times written in the notice.",
        {
          type: "object",
          properties: {
            label_en: str("What the date is for."),
            value: str("The date or time as written."),
          },
          required: ["label_en", "value"],
        },
        6,
      ),
      amounts: arrayOf(
        "Money or quantities written in the notice.",
        {
          type: "object",
          properties: {
            label_en: str("What the amount is for."),
            value: str("The amount as written, including currency."),
          },
          required: ["label_en", "value"],
        },
        6,
      ),
      contacts: arrayOf(
        "People or offices the reader may need to reach.",
        {
          type: "object",
          properties: {
            name: str("Person or office name."),
            role_en: str("Role, or an empty string."),
            phone: str("Phone as written, or an empty string."),
            email: str("Email as written, or an empty string."),
          },
          required: ["name", "role_en", "phone", "email"],
        },
        4,
      ),
      reply_en: str("A short reply the reader can edit and send. First person. Do not invent facts."),
      caveat_en: str("One sentence: this is a reading aid, not professional advice."),
    },
    required: [
      "source_language",
      "summary_en",
      "what_you_may_need_to_do",
      "actions",
      "dates",
      "amounts",
      "contacts",
      "reply_en",
      "caveat_en",
    ],
  };
}

/** Cloud JSON. Arabic fields stay empty when the route did not ask for Arabic. */
export function cloudSchema(): SchemaRequest {
  const base = deviceSchema();
  return {
    type: "object",
    properties: {
      ...base.properties,
      summary_ar: str("The same summary in Modern Standard Arabic, or an empty string."),
      what_you_may_need_to_do_ar: str("Arabic version of the practical next step, or an empty string."),
      actions: arrayOf(
        "Concrete actions. Include text_ar when Arabic was requested.",
        {
          type: "object",
          properties: {
            text_en: str("One action in English."),
            text_ar: str("The same action in Arabic, or an empty string."),
            due: str("Due date or time exactly as written, or an empty string."),
          },
          required: ["text_en", "text_ar", "due"],
        },
        8,
      ),
      dates: arrayOf(
        "Dates and times written in the notice.",
        {
          type: "object",
          properties: {
            label_en: str("What the date is for, in English."),
            label_ar: str("What the date is for, in Arabic, or an empty string."),
            value: str("The date or time as written."),
          },
          required: ["label_en", "label_ar", "value"],
        },
        6,
      ),
      amounts: arrayOf(
        "Money or quantities written in the notice.",
        {
          type: "object",
          properties: {
            label_en: str("What the amount is for, in English."),
            label_ar: str("What the amount is for, in Arabic, or an empty string."),
            value: str("The amount as written, including currency."),
          },
          required: ["label_en", "label_ar", "value"],
        },
        6,
      ),
      contacts: arrayOf(
        "People or offices the reader may need to reach.",
        {
          type: "object",
          properties: {
            name: str("Person or office name."),
            role_en: str("Role in English, or an empty string."),
            role_ar: str("Role in Arabic, or an empty string."),
            phone: str("Phone as written, or an empty string."),
            email: str("Email as written, or an empty string."),
          },
          required: ["name", "role_en", "role_ar", "phone", "email"],
        },
        4,
      ),
      reply_ar: str("Arabic reply matching reply_en, or an empty string."),
      caveat_ar: str("Arabic caveat, or an empty string."),
    },
    required: [
      "source_language",
      "summary_en",
      "summary_ar",
      "what_you_may_need_to_do",
      "what_you_may_need_to_do_ar",
      "actions",
      "dates",
      "amounts",
      "contacts",
      "reply_en",
      "reply_ar",
      "caveat_en",
      "caveat_ar",
    ],
  };
}

/**
 * JSON schema passed to Chrome through onDeviceParams.promptOptions.responseConstraint.
 * English only. Arabic is not an expected output language.
 */
export function deviceResponseConstraint(): object {
  return {
    type: "object",
    properties: {
      source_language: { type: "string" },
      summary_en: { type: "string" },
      what_you_may_need_to_do: { type: "string" },
      actions: {
        type: "array",
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            text_en: { type: "string" },
            due: { type: "string" },
          },
          required: ["text_en", "due"],
        },
      },
      dates: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            label_en: { type: "string" },
            value: { type: "string" },
          },
          required: ["label_en", "value"],
        },
      },
      amounts: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            label_en: { type: "string" },
            value: { type: "string" },
          },
          required: ["label_en", "value"],
        },
      },
      contacts: {
        type: "array",
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            role_en: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
          },
          required: ["name", "role_en", "phone", "email"],
        },
      },
      reply_en: { type: "string" },
      caveat_en: { type: "string" },
    },
    required: [
      "source_language",
      "summary_en",
      "what_you_may_need_to_do",
      "actions",
      "dates",
      "amounts",
      "contacts",
      "reply_en",
      "caveat_en",
    ],
  };
}
