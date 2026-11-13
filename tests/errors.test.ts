import { describe, expect, it } from "vitest";
import { classifyError } from "../src/domain/errors";
import { formatBrief } from "../src/domain/brief";
import { readingFromSample } from "../src/samples";
import { samples } from "../src/samples";

describe("classifyError", () => {
  it("recognizes quota, App Check, and Nano failures", () => {
    expect(classifyError(new Error("429 resource_exhausted"))).toBe("quota");
    expect(classifyError(new Error(
      "Error fetching from https://firebasevertexai.googleapis.com/v1beta/projects/fahim-hybridai/models/gemini-3.5-flash-lite:generateContent: [403 Forbidden] The Gemini API free tier is not available for this project.",
    ))).toBe("free_tier");
    expect(classifyError(new Error("App Check token is invalid"))).toBe("app_check");
    expect(classifyError(new Error("Local LanguageModel API not available in this environment."))).toBe("nano");
    expect(classifyError(new Error("Failed to fetch"))).toBe("offline");
  });
});

describe("formatBrief", () => {
  it("leads with Arabic when the UI is Arabic and Arabic exists", () => {
    const reading = readingFromSample(samples[0], "acknowledge", true);
    const brief = formatBrief(reading, "ar");
    expect(brief.startsWith("Fahim")).toBe(true);
    expect(brief.indexOf("رحلة")).toBeLessThan(brief.indexOf("Room 12"));
    expect(brief).toContain("$12");
  });
});
