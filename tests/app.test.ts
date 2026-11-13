import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app/create-app";
import { createPracticeExplainer } from "../src/engine/practice-engine";
import { createSilentSpeech } from "../src/speech/browser-speech";
import { memoryKv } from "../src/storage/kv";
import { createMemoryHistory, createMemoryQueue } from "../src/storage/types";
import { samples } from "../src/samples";

function mount(online = true) {
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.querySelector<HTMLElement>("#app")!;
  const handle = createApp(root, {
    explainer: createPracticeExplainer({ delayMs: 0 }),
    history: createMemoryHistory(),
    queue: createMemoryQueue(),
    speech: createSilentSpeech(),
    settings: memoryKv(),
    session: memoryKv(),
    online: () => online,
    practice: true,
    appCheck: { ready: false, provider: "missing", ignoredDebugToken: false },
  });
  return { root, handle };
}

describe("Fahim shell", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  });

  it("switches the page to Arabic RTL", () => {
    const { root } = mount();
    root.querySelector<HTMLButtonElement>("#lang-ar")!.click();
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
    expect(root.textContent).toContain("افهم الرسالة");
  });

  it("explains the school sample in practice mode without a model", async () => {
    const { root } = mount();
    root.querySelector<HTMLButtonElement>('[data-sample="school"]')!.click();
    expect(root.querySelector<HTMLTextAreaElement>("#draft")!.value).toContain("City Museum");
    root.querySelector<HTMLFormElement>("#composer-form")!.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(root.textContent).toContain("Practice");
    expect(root.textContent).toContain("permission");
    expect(root.textContent).toContain("not-called");
    expect(root.textContent).toContain("$12");
  });

  it("refuses an Arabic notice in on-device mode", async () => {
    const { root } = mount();
    root.querySelector<HTMLButtonElement>('[data-mode="on_device"]')!.click();
    root.querySelector<HTMLButtonElement>('[data-sample="maintenance"]')!.click();
    root.querySelector<HTMLFormElement>("#composer-form")!.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(root.querySelector("#result-error")?.textContent).toContain("cannot read Arabic");
    expect(root.querySelector("#result-body")?.hasAttribute("hidden")).toBe(true);
  });

  it("queues Arabic when the English sample is explained offline", async () => {
    const { root } = mount(false);
    root.querySelector<HTMLButtonElement>('[data-output="both"]')!.click();
    root.querySelector<HTMLTextAreaElement>("#draft")!.value = samples[0].text;
    root.querySelector<HTMLTextAreaElement>("#draft")!.dispatchEvent(new Event("input"));
    root.querySelector<HTMLFormElement>("#composer-form")!.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(root.textContent).toContain("queued");
    expect(root.querySelector("#summary-ar")?.hasAttribute("hidden")).toBe(true);
  });
});
