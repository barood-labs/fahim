export type UiLang = "en" | "ar";

export type UserMode = "auto" | "on_device" | "cloud";

export type OutputPreference = "en" | "ar" | "both";

export type ReplyIntent = "acknowledge" | "question" | "decline";

export type SdkMode = "prefer_on_device" | "only_on_device" | "only_in_cloud";

export type ScriptKind = "empty" | "arabic" | "latin" | "mixed" | "kana" | "other";

export type InferenceSource = "on_device" | "in_cloud" | "unreported";

export type ReasonCode =
  | "prefer_device"
  | "offline_device"
  | "arabic_source_cloud"
  | "arabic_output_cloud"
  | "long_cloud"
  | "mixed_cloud"
  | "other_script_cloud"
  | "user_cloud"
  | "user_device"
  | "queued_arabic_offline"
  | "downgraded_device_arabic"
  | "fell_back_to_cloud"
  | "unexpected_device"
  | "source_unreported"
  | "blocked_arabic_offline"
  | "blocked_script_offline"
  | "blocked_arabic_device"
  | "blocked_script_device"
  | "blocked_cloud_offline"
  | "empty";

export interface ActionItem {
  id: string;
  textEn: string;
  textAr: string | null;
  due: string | null;
}

export interface Fact {
  labelEn: string;
  labelAr: string | null;
  value: string;
}

export interface Contact {
  name: string;
  roleEn: string | null;
  roleAr: string | null;
  phone: string | null;
  email: string | null;
}

export interface Reading {
  sourceLanguage: string;
  summaryEn: string;
  summaryAr: string | null;
  whatToDoEn: string;
  whatToDoAr: string | null;
  actions: ActionItem[];
  dates: Fact[];
  amounts: Fact[];
  contacts: Contact[];
  replyEn: string;
  replyAr: string | null;
  caveatEn: string;
  caveatAr: string | null;
}

export interface RouteDecision {
  outcome: "run" | "blocked";
  sdkMode: SdkMode;
  allowArabic: boolean;
  queueWhenOnline: boolean;
  textForModel: string;
  truncated: boolean;
  reasonCode: ReasonCode;
  script: ScriptKind;
  estimatedTokens: number;
}
