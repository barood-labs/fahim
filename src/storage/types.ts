import type { OutputPreference, Reading, ReplyIntent, UiLang, UserMode } from "../domain/types";

export interface StoredReading {
  id: string;
  createdAt: number;
  preview: string;
  sourceText: string;
  uiLang: UiLang;
  mode: UserMode;
  output: OutputPreference;
  replyIntent: ReplyIntent;
  practice: boolean;
  inferenceSource: "on_device" | "in_cloud" | "unreported";
  reasonCode: string;
  modelLabel: string;
  reading: Reading;
  checkedActionIds: string[];
  truncated: boolean;
  arabicLeak: boolean;
}

export interface QueuedJob {
  id: string;
  createdAt: number;
  text: string;
  output: OutputPreference;
  replyIntent: ReplyIntent;
  uiLang: UiLang;
}

export interface HistoryStore {
  list(): Promise<StoredReading[]>;
  put(item: StoredReading): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface QueueStore {
  list(): Promise<QueuedJob[]>;
  put(item: QueuedJob): Promise<void>;
  delete(id: string): Promise<void>;
}

export function createMemoryHistory(): HistoryStore {
  const items = new Map<string, StoredReading>();
  return {
    async list() {
      return [...items.values()].sort((a, b) => b.createdAt - a.createdAt);
    },
    async put(item) {
      items.set(item.id, item);
    },
    async delete(id) {
      items.delete(id);
    },
    async clear() {
      items.clear();
    },
  };
}

export function createMemoryQueue(): QueueStore {
  const items = new Map<string, QueuedJob>();
  return {
    async list() {
      return [...items.values()].sort((a, b) => a.createdAt - b.createdAt);
    },
    async put(item) {
      items.set(item.id, item);
    },
    async delete(id) {
      items.delete(id);
    },
  };
}
