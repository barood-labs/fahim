import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { appCheckPublicConfig } from "../src/app-check-public";
import { appCheckFromEnv, mergeOverlay, resolveDebugToken, resolveFirebaseConfig, resolveProviderKind } from "../src/config";
import { firebasePublicConfig } from "../src/firebase-public-config";

describe("firebase config seam", () => {
  it("uses the committed fahim-hybridai web config", () => {
    const config = resolveFirebaseConfig({} as ImportMetaEnv);
    expect(config.projectId).toBe("fahim-hybridai");
    expect(config.appId).toBe(firebasePublicConfig.appId);
    expect(config.apiKey).toBe(firebasePublicConfig.apiKey);
  });

  it("lets env override a forked project without dropping the public default", () => {
    const config = resolveFirebaseConfig({ VITE_FIREBASE_PROJECT_ID: "other-project" } as ImportMetaEnv);
    expect(config.projectId).toBe("other-project");
    expect(config.apiKey).toBe(firebasePublicConfig.apiKey);
  });
});

describe("App Check", () => {
  it("reads a debug token only for dev, and true stays boolean", () => {
    expect(resolveDebugToken({ existing: undefined, dev: true, allowDebugInProd: false, envToken: "true" })).toBe(true);
    expect(resolveDebugToken({
      existing: undefined,
      dev: true,
      allowDebugInProd: false,
      envToken: "123a4567-b89c-12d3-e456-789012345678",
    })).toBe("123a4567-b89c-12d3-e456-789012345678");
    expect(resolveDebugToken({
      existing: undefined,
      dev: false,
      allowDebugInProd: false,
      envToken: "secret-token",
    })).toBeUndefined();
    expect(resolveDebugToken({
      existing: "already-set",
      dev: true,
      allowDebugInProd: false,
      envToken: "other",
    })).toBe("already-set");
  });

  it("uses the committed Enterprise site key when env is empty", () => {
    const settings = appCheckFromEnv({} as ImportMetaEnv);
    const published = JSON.parse(readFileSync(resolve("public/config.json"), "utf8")) as {
      appCheckSiteKey: string;
      appCheckProvider: string;
    };
    expect(settings.provider).toBe("enterprise");
    expect(settings.siteKey).toBe("6Lfizh0uAAAAADl3HIjSFT7MlSJiJmhgZ9LMUXm4");
    expect(settings.siteKey).toBe(appCheckPublicConfig.siteKey);
    expect(published.appCheckSiteKey).toBe(appCheckPublicConfig.siteKey);
    expect(published.appCheckProvider).toBe("enterprise");
    expect(settings.debugToken).toBeUndefined();
  });

  it("defaults the provider to enterprise and ignores debug tokens in config.json", () => {
    expect(resolveProviderKind(undefined)).toBe("enterprise");
    expect(resolveProviderKind("v3")).toBe("v3");
    const merged = mergeOverlay(
      { provider: "enterprise", siteKey: "", debugToken: undefined, ignoredDebugToken: false },
      { appCheckSiteKey: "6LcExampleSiteKey", appCheckDebugToken: "do-not-keep", geminiModel: "gemini-3.5-flash-lite" },
      "",
    );
    expect(merged.appCheck.siteKey).toBe("6LcExampleSiteKey");
    expect(merged.appCheck.debugToken).toBeUndefined();
    expect(merged.appCheck.ignoredDebugToken).toBe(true);
    expect(merged.model).toBe("gemini-3.5-flash-lite");
  });
});
