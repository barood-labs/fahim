import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createIdbHistory, createIdbQueue } from "../src/storage/idb";
import type { StoredReading } from "../src/storage/types";

const reading: StoredReading = {
  id: "r1",
  createdAt: 10,
  preview: "Field trip",
  sourceText: "City Museum",
  uiLang: "en",
  mode: "auto",
  output: "en",
  replyIntent: "acknowledge",
  practice: true,
  inferenceSource: "on_device",
  reasonCode: "prefer_device",
  modelLabel: "Practice mode",
  reading: {
    sourceLanguage: "English",
    summaryEn: "A trip.",
    summaryAr: null,
    whatToDoEn: "Sign the slip.",
    whatToDoAr: null,
    actions: [],
    dates: [],
    amounts: [],
    contacts: [],
    replyEn: "I will.",
    replyAr: null,
    caveatEn: "Not advice.",
    caveatAr: null,
  },
  checkedActionIds: [],
  truncated: false,
  arabicLeak: false,
};

describe("IndexedDB", () => {
  it("stores a reading and a queued Arabic job on this device", async () => {
    const history = createIdbHistory();
    const queue = createIdbQueue();
    await history.put(reading);
    await history.put({ ...reading, id: "r2", createdAt: 20, preview: "Later" });
    const listed = await history.list();
    expect(listed.map((item) => item.id)).toEqual(["r2", "r1"]);
    await queue.put({
      id: "q1",
      createdAt: 1,
      text: "مرحبا",
      output: "both",
      replyIntent: "acknowledge",
      uiLang: "ar",
    });
    expect(await queue.list()).toHaveLength(1);
    await queue.delete("q1");
    expect(await queue.list()).toHaveLength(0);
    await history.clear();
    expect(await history.list()).toHaveLength(0);
  });
});
