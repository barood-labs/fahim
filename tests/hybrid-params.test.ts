import { describe, expect, it } from "vitest";
import { buildHybridParams, NANO_INPUT_LANGUAGES } from "../src/engine/hybrid-params";

describe("buildHybridParams", () => {
  it("pins the free-tier cloud model and English-only Nano languages", () => {
    const params = buildHybridParams({ sdkMode: "prefer_on_device", allowArabic: false });
    expect(params.mode).toBe("prefer_on_device");
    expect(params.inCloudParams?.model).toBe("gemini-3.5-flash-lite");
    expect(params.onDeviceParams?.createOptions?.expectedInputs?.[0]).toMatchObject({
      type: "text",
      languages: ["en"],
    });
    expect(params.onDeviceParams?.createOptions?.expectedOutputs).toEqual([{ type: "text", languages: ["en"] }]);
    expect(NANO_INPUT_LANGUAGES).not.toContain("ar");
    const blob = JSON.stringify(params.onDeviceParams);
    expect(blob).not.toContain('"ar"');
    expect(params.inCloudParams?.generationConfig?.responseMimeType).toBe("application/json");
    expect(params.inCloudParams?.generationConfig?.speechConfig).toBeUndefined();
    expect(params.inCloudParams?.generationConfig?.responseModalities).toBeUndefined();
    expect(params.inCloudParams?.tools).toBeUndefined();
  });

  it("asks the cloud schema for Arabic only when the route allows it", () => {
    const english = buildHybridParams({ sdkMode: "only_on_device", allowArabic: false });
    const arabic = buildHybridParams({ sdkMode: "only_in_cloud", allowArabic: true });
    const englishRequired = english.inCloudParams?.generationConfig?.responseSchema;
    const arabicRequired = arabic.inCloudParams?.generationConfig?.responseSchema;
    expect(JSON.stringify(englishRequired)).not.toContain("summary_ar");
    expect(JSON.stringify(arabicRequired)).toContain("summary_ar");
    expect(arabic.mode).toBe("only_in_cloud");
  });
});
