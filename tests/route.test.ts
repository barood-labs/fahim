import { describe, expect, it } from "vitest";
import { routeDocument } from "../src/domain/route";
import { samples } from "../src/samples";

const english = samples[0].text;
const arabic = samples[3].text;
const long = `${english}\n${"Please bring a labeled water bottle. ".repeat(800)}`;

describe("routeDocument", () => {
  it("prefers on-device for a short English notice", () => {
    const decision = routeDocument({ text: english, mode: "auto", output: "en", online: true });
    expect(decision.outcome).toBe("run");
    expect(decision.sdkMode).toBe("prefer_on_device");
    expect(decision.allowArabic).toBe(false);
    expect(decision.reasonCode).toBe("prefer_device");
  });

  it("sends Arabic output to the cloud", () => {
    const decision = routeDocument({ text: english, mode: "auto", output: "both", online: true });
    expect(decision.sdkMode).toBe("only_in_cloud");
    expect(decision.allowArabic).toBe(true);
    expect(decision.reasonCode).toBe("arabic_output_cloud");
  });

  it("never asks Nano for Arabic", () => {
    const cases = [
      { text: english, mode: "auto" as const, output: "en" as const, online: true },
      { text: english, mode: "auto" as const, output: "ar" as const, online: true },
      { text: arabic, mode: "auto" as const, output: "both" as const, online: true },
      { text: english, mode: "on_device" as const, output: "both" as const, online: false },
      { text: long, mode: "auto" as const, output: "en" as const, online: true },
      { text: arabic, mode: "cloud" as const, output: "ar" as const, online: true },
    ];
    for (const item of cases) {
      const decision = routeDocument(item);
      if (decision.sdkMode !== "only_in_cloud") expect(decision.allowArabic).toBe(false);
    }
  });

  it("blocks Arabic on-device mode", () => {
    const decision = routeDocument({ text: arabic, mode: "on_device", output: "en", online: true });
    expect(decision.outcome).toBe("blocked");
    expect(decision.reasonCode).toBe("blocked_arabic_device");
  });

  it("queues Arabic when offline instead of inventing it", () => {
    const decision = routeDocument({ text: arabic, mode: "auto", output: "both", online: false });
    expect(decision.outcome).toBe("blocked");
    expect(decision.queueWhenOnline).toBe(true);
    expect(decision.allowArabic).toBe(false);
  });

  it("keeps an English on-device reading when Arabic was requested offline", () => {
    const decision = routeDocument({ text: english, mode: "auto", output: "both", online: false });
    expect(decision.outcome).toBe("run");
    expect(decision.sdkMode).toBe("only_on_device");
    expect(decision.allowArabic).toBe(false);
    expect(decision.queueWhenOnline).toBe(true);
  });

  it("sends a long English notice to the cloud when online", () => {
    const decision = routeDocument({ text: long, mode: "auto", output: "en", online: true });
    expect(decision.sdkMode).toBe("only_in_cloud");
    expect(decision.reasonCode).toBe("long_cloud");
    expect(decision.truncated).toBe(false);
  });

  it("truncates only when the device must read a long notice", () => {
    const decision = routeDocument({ text: long, mode: "on_device", output: "en", online: false });
    expect(decision.outcome).toBe("run");
    expect(decision.truncated).toBe(true);
    expect(decision.textForModel.length).toBeLessThan(long.length);
  });

  it("does not silently switch an explicit cloud choice while offline", () => {
    const decision = routeDocument({ text: english, mode: "cloud", output: "en", online: false });
    expect(decision.outcome).toBe("blocked");
    expect(decision.reasonCode).toBe("blocked_cloud_offline");
  });
});
