import { formatBrief } from "../domain/brief";
import { classifyError, type ErrorCode } from "../domain/errors";
import { actualReason, routeDocument } from "../domain/route";
import { MAX_INPUT_CHARS, documentFitsOnDevice, estimateTokens } from "../domain/tokens";
import type { OutputPreference, ReasonCode, ReplyIntent, UiLang, UserMode } from "../domain/types";
import { reasonCopyKey, t, type CopyKey } from "../i18n";
import { samples } from "../samples";
import type { SpeechPort } from "../speech/browser-speech";
import type { KeyValue } from "../storage/kv";
import type { HistoryStore, QueueStore, QueuedJob, StoredReading } from "../storage/types";
import type { ExplainResult, Explainer } from "../engine/types";
import { shell } from "./markup";

export interface AppCheckView {
  ready: boolean;
  provider: "enterprise" | "v3" | "debug" | "missing";
  ignoredDebugToken: boolean;
}

export interface AppDeps {
  explainer: Explainer;
  history: HistoryStore;
  queue: QueueStore;
  speech: SpeechPort;
  settings: KeyValue;
  session: KeyValue;
  online(): boolean;
  practice: boolean;
  appCheck: AppCheckView;
  onPracticeToggle?(next: boolean): void;
}

const BLOCK_KEY: Partial<Record<ReasonCode, CopyKey>> = {
  empty: "errorEmpty",
  blocked_arabic_offline: "errorBlockedArabicOffline",
  blocked_script_offline: "errorBlockedScriptOffline",
  blocked_arabic_device: "errorBlockedArabicDevice",
  blocked_script_device: "errorBlockedScriptDevice",
  blocked_cloud_offline: "errorBlockedCloudOffline",
};

const ERROR_KEY: Record<ErrorCode, CopyKey> = {
  empty: "errorEmpty",
  too_long: "errorTooLong",
  quota: "errorQuota",
  app_check: "errorAppCheck",
  nano: "errorNano",
  offline: "errorOffline",
  safety: "errorSafety",
  parse: "errorParse",
  unknown: "errorUnknown",
};

function id(): string {
  return crypto.randomUUID();
}

function preview(text: string): string {
  const line = text.trim().split("\n").find((item) => item.trim()) ?? text.trim();
  return line.replace(/\s+/g, " ").slice(0, 96);
}

function asLang(value: string | null): UiLang {
  return value === "ar" ? "ar" : "en";
}

function asMode(value: string | null): UserMode {
  return value === "on_device" || value === "cloud" ? value : "auto";
}

function asOutput(value: string | null): OutputPreference {
  return value === "ar" || value === "both" ? value : "en";
}

function asIntent(value: string | null): ReplyIntent {
  return value === "question" || value === "decline" ? value : "acknowledge";
}

export function createApp(root: HTMLElement, deps: AppDeps): { destroy(): void } {
  root.innerHTML = shell();
  const $ = <T extends HTMLElement>(selector: string) => {
    const node = root.querySelector(selector);
    if (!node) throw new Error(`Missing ${selector}`);
    return node as T;
  };

  const draft = $<HTMLTextAreaElement>("#draft");
  const explainBtn = $<HTMLButtonElement>("#explain");
  const modeHelp = $<HTMLParagraphElement>("#mode-help");
  const outputLimit = $<HTMLParagraphElement>("#output-limit");
  const tokenHint = $<HTMLParagraphElement>("#token-hint");
  const deviceStatus = $<HTMLParagraphElement>("#device-status");
  const progress = $<HTMLDivElement>("#progress");
  const progressBar = $<HTMLSpanElement>("#progress-bar");
  const resultEmpty = $<HTMLDivElement>("#result-empty");
  const resultError = $<HTMLDivElement>("#result-error");
  const resultBody = $<HTMLElement>("#result-body");
  const engineBand = $<HTMLElement>("#engine-band");
  const engineBadge = $<HTMLHeadingElement>("#engine-badge");
  const engineWhy = $<HTMLParagraphElement>("#engine-why");
  const engineRaw = $<HTMLElement>("#engine-raw");
  const engineExtra = $<HTMLParagraphElement>("#engine-extra");
  const resultFlags = $<HTMLParagraphElement>("#result-flags");
  const summaryEn = $<HTMLDivElement>("#summary-en");
  const summaryAr = $<HTMLDivElement>("#summary-ar");
  const actions = $<HTMLUListElement>("#actions");
  const dates = $<HTMLUListElement>("#dates");
  const amounts = $<HTMLUListElement>("#amounts");
  const contacts = $<HTMLUListElement>("#contacts");
  const replyEn = $<HTMLPreElement>("#reply-en");
  const replyAr = $<HTMLPreElement>("#reply-ar");
  const caveat = $<HTMLParagraphElement>("#caveat");
  const sourceView = $<HTMLPreElement>("#source-view");
  const live = $<HTMLParagraphElement>("#live-status");
  const historyDialog = $<HTMLDialogElement>("#history-dialog");
  const aboutDialog = $<HTMLDialogElement>("#about-dialog");
  const historyList = $<HTMLDivElement>("#history-list");
  let textRevision = 1;
  let appliedRevision = 0;
  let paintedKey = "";
  let prepareAbort: AbortController | null = null;
  let wasOnline = deps.online();

  const state = {
    lang: asLang(deps.settings.get("fahim.lang")),
    mode: asMode(deps.settings.get("fahim.mode")),
    output: asOutput(deps.settings.get("fahim.output")),
    intent: asIntent(deps.settings.get("fahim.intent")),
    dictation: deps.settings.get("fahim.dictation") === "ar-SA" ? "ar-SA" : "en-US",
    text: deps.session.get("fahim.draft") ?? "",
    phase: "idle" as "idle" | "running" | "done" | "error",
    errorKey: null as CopyKey | null,
    reason: null as ReasonCode | null,
    result: null as ExplainResult | null,
    truncated: false,
    queued: false,
    checked: new Set<string>(),
    savedId: null as string | null,
    device: "idle" as "idle" | "downloading" | "ready" | "missing" | "failed",
    progress: 0,
    history: [] as StoredReading[],
    queue: [] as QueuedJob[],
    listening: false,
    speaking: false,
    showSource: false,
    online: deps.online(),
    draining: false,
    queueDismissed: false,
  };

  function persist(): void {
    deps.settings.set("fahim.lang", state.lang);
    deps.settings.set("fahim.mode", state.mode);
    deps.settings.set("fahim.output", state.output);
    deps.settings.set("fahim.intent", state.intent);
    deps.settings.set("fahim.dictation", state.dictation);
    deps.session.set("fahim.draft", state.text);
  }

  function setText(next: string): void {
    state.text = next;
    textRevision += 1;
    persist();
  }

  function openDialog(dialog: HTMLDialogElement): void {
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function fillFacts(list: HTMLUListElement, rows: { label: string; value: string }[], emptyKey: CopyKey): void {
    list.replaceChildren();
    if (!rows.length) {
      const li = document.createElement("li");
      li.textContent = t(state.lang, emptyKey);
      list.append(li);
      return;
    }
    for (const row of rows) {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = row.label;
      li.append(strong, document.createTextNode(` ${row.value}`));
      list.append(li);
    }
  }

  function fillResult(): void {
    const result = state.result;
    if (!result) return;
    const reading = result.reading;
    summaryEn.textContent = reading.summaryEn;
    summaryAr.hidden = !reading.summaryAr;
    summaryAr.textContent = reading.summaryAr ?? "";
    if (state.lang === "ar" && reading.summaryAr) summaryEn.before(summaryAr);
    else summaryAr.before(summaryEn);
    replyEn.textContent = reading.replyEn;
    replyAr.hidden = !reading.replyAr;
    replyAr.textContent = reading.replyAr ?? "";
    if (state.lang === "ar" && reading.replyAr) replyEn.before(replyAr);
    else replyAr.before(replyEn);
    caveat.textContent = state.lang === "ar" && reading.caveatAr ? reading.caveatAr : reading.caveatEn;
    sourceView.textContent = state.text;
    actions.replaceChildren();
    if (!reading.actions.length) {
      const li = document.createElement("li");
      li.textContent = t(state.lang, "noActions");
      actions.append(li);
    }
    for (const action of reading.actions) {
      const li = document.createElement("li");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = state.checked.has(action.id);
      box.addEventListener("change", () => {
        if (box.checked) state.checked.add(action.id);
        else state.checked.delete(action.id);
        void syncChecks();
      });
      const body = document.createElement("div");
      const label = document.createElement("p");
      label.dir = "auto";
      label.textContent = state.lang === "ar" && action.textAr ? action.textAr : action.textEn;
      body.append(label);
      if (action.textAr && action.textEn && state.lang === "ar") {
        const alt = document.createElement("p");
        alt.className = "alt";
        alt.dir = "auto";
        alt.textContent = action.textEn;
        body.append(alt);
      } else if (action.textAr && state.lang === "en") {
        const alt = document.createElement("p");
        alt.className = "alt";
        alt.lang = "ar";
        alt.dir = "rtl";
        alt.textContent = action.textAr;
        body.append(alt);
      }
      if (action.due) {
        const due = document.createElement("p");
        due.className = "due";
        due.textContent = action.due;
        body.append(due);
      }
      li.append(box, body);
      actions.append(li);
    }
    const labelOf = (en: string, arLabel: string | null) => (state.lang === "ar" && arLabel ? arLabel : en);
    fillFacts(
      dates,
      reading.dates.map((item) => ({ label: labelOf(item.labelEn, item.labelAr), value: item.value })),
      "noDates",
    );
    fillFacts(
      amounts,
      reading.amounts.map((item) => ({ label: labelOf(item.labelEn, item.labelAr), value: item.value })),
      "noAmounts",
    );
    fillFacts(
      contacts,
      reading.contacts.map((item) => ({
        label: item.name,
        value: [state.lang === "ar" && item.roleAr ? item.roleAr : item.roleEn, item.phone, item.email].filter(Boolean).join(" · "),
      })),
      "noContacts",
    );
  }

  async function syncChecks(): Promise<void> {
    if (!state.savedId || !state.result) return;
    const current = state.history.find((item) => item.id === state.savedId);
    if (!current) return;
    current.checkedActionIds = [...state.checked];
    await deps.history.put(current);
  }

  function paint(): void {
    const lang = state.lang;
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n as CopyKey;
      node.textContent = t(lang, key);
    });
    $<HTMLButtonElement>("#lang-en").textContent = t(lang, "langNameEn");
    $<HTMLButtonElement>("#lang-ar").textContent = t(lang, "langNameAr");
    $<HTMLButtonElement>("#lang-en").setAttribute("aria-pressed", String(lang === "en"));
    $<HTMLButtonElement>("#lang-ar").setAttribute("aria-pressed", String(lang === "ar"));
    for (const button of root.querySelectorAll<HTMLButtonElement>("[data-mode]")) {
      const mode = button.dataset.mode as UserMode;
      button.textContent = t(lang, mode === "auto" ? "modeAuto" : mode === "cloud" ? "modeCloud" : "modeDevice");
      button.setAttribute("aria-pressed", String(state.mode === mode));
    }
    for (const button of root.querySelectorAll<HTMLButtonElement>("[data-output]")) {
      const output = button.dataset.output as OutputPreference;
      button.textContent = t(lang, output === "ar" ? "outputAr" : output === "both" ? "outputBoth" : "outputEn");
      button.setAttribute("aria-pressed", String(state.output === output));
      button.disabled = state.mode === "on_device" && output !== "en";
    }
    for (const button of root.querySelectorAll<HTMLButtonElement>("[data-intent]")) {
      const intent = button.dataset.intent as ReplyIntent;
      button.textContent = t(lang, intent === "question" ? "intentQuestion" : intent === "decline" ? "intentDecline" : "intentAck");
      button.setAttribute("aria-pressed", String(state.intent === intent));
    }
    modeHelp.textContent = t(lang, state.mode === "cloud" ? "modeHelpCloud" : state.mode === "on_device" ? "modeHelpDevice" : "modeHelpAuto");
    outputLimit.hidden = state.mode !== "on_device";
    outputLimit.textContent = t(lang, "outputDeviceLimit");
    draft.placeholder = t(lang, "draftPlaceholder");
    if (appliedRevision !== textRevision) {
      draft.value = state.text;
      appliedRevision = textRevision;
    }
    const tokens = estimateTokens(state.text);
    tokenHint.textContent = state.text.trim()
      ? t(lang, documentFitsOnDevice(state.text) ? "tokenFits" : "tokenLong", { n: tokens })
      : "";
    explainBtn.textContent = t(lang, state.phase === "running" ? "explaining" : "explain");
    explainBtn.disabled = state.phase === "running";
    $<HTMLButtonElement>("#mic").textContent = t(lang, state.listening ? "micStop" : "micStart");
    $<HTMLButtonElement>("#mic").disabled = !deps.speech.canListen;
    $<HTMLSelectElement>("#dictation-lang").value = state.dictation;
    const chip = $<HTMLParagraphElement>("#appcheck-chip");
    chip.dataset.state = deps.appCheck.provider;
    chip.textContent =
      deps.practice
        ? t(lang, "badgePractice")
        : t(
            lang,
            deps.appCheck.provider === "debug"
              ? "appCheckDebug"
              : deps.appCheck.provider === "v3"
                ? "appCheckV3"
                : deps.appCheck.provider === "enterprise"
                  ? "appCheckEnterprise"
                  : "appCheckMissing",
          );
    $<HTMLDivElement>("#practice-banner").hidden = !deps.practice;
    $<HTMLButtonElement>("#practice-toggle").textContent = t(lang, deps.practice ? "practiceExit" : "practiceEnter");
    $<HTMLDivElement>("#ignored-banner").hidden = !deps.appCheck.ignoredDebugToken;
    $<HTMLDivElement>("#offline-banner").hidden = state.online;
    const queueBanner = $<HTMLDivElement>("#queue-banner");
    queueBanner.hidden = state.queue.length === 0 || state.queueDismissed;
    $<HTMLParagraphElement>("#queue-text").textContent = state.draining ? t(lang, "connectionBack") : t(lang, "queueBanner");
    const deviceCopy =
      state.device === "ready"
        ? "deviceReady"
        : state.device === "downloading"
          ? "deviceDownloading"
          : state.device === "missing"
            ? "deviceMissing"
            : state.device === "failed"
              ? "deviceFailed"
              : "deviceIdle";
    deviceStatus.textContent =
      state.device === "downloading"
        ? `${t(lang, deviceCopy)} ${t(lang, "percent", { n: Math.round(state.progress * 100) })}`
        : t(lang, deviceCopy);
    progress.hidden = state.device !== "downloading";
    progressBar.style.width = `${Math.round(state.progress * 100)}%`;
    const showResult = state.phase === "done" && state.result;
    resultEmpty.hidden = state.phase === "done" || state.phase === "error";
    resultError.hidden = state.phase !== "error" || !state.errorKey;
    resultError.textContent = state.errorKey ? t(lang, state.errorKey) : "";
    resultBody.hidden = !showResult;
    if (showResult && state.result && state.reason) {
      const source = state.result.inferenceSource;
      engineBand.dataset.source = state.result.practice ? "practice" : source;
      engineBadge.textContent = state.result.practice
        ? t(lang, "badgePractice")
        : source === "on_device"
          ? t(lang, "badgeDevice")
          : source === "in_cloud"
            ? t(lang, "badgeCloud")
            : t(lang, "badgeUnknown");
      engineWhy.textContent = t(lang, reasonCopyKey(state.reason));
      engineRaw.textContent = state.result.practice ? "not-called" : source;
      engineExtra.textContent = state.result.practice
        ? t(lang, "enginePracticeDetail")
        : state.result.modelLabel;
      const flags = [
        state.truncated ? t(lang, "truncatedNote") : "",
        state.queued ? t(lang, "arabicQueuedNote") : "",
        state.result.inferenceSource === "on_device" && state.result.reading.summaryAr === null && state.output !== "en"
          ? t(lang, "arabicHiddenNote")
          : "",
        state.result.arabicLeak ? t(lang, "onDeviceArabicLeak") : "",
      ].filter(Boolean);
      resultFlags.textContent = flags.join(" ");
      const key = `${state.savedId}:${lang}:${[...state.checked].join(",")}:${state.showSource}`;
      if (key !== paintedKey) {
        paintedKey = key;
        fillResult();
      }
      sourceView.hidden = !state.showSource;
      $<HTMLButtonElement>("#toggle-source").textContent = t(lang, state.showSource ? "hideNotice" : "showNotice");
      $<HTMLButtonElement>("#speak-reply").textContent = t(lang, state.speaking ? "stopReading" : "readAloud");
    }
    live.textContent =
      state.phase === "running" ? t(lang, "statusRunning") : state.phase === "error" ? t(lang, "statusError") : state.phase === "done" ? t(lang, "statusDone") : "";
  }

  async function remember(result: ExplainResult, reason: ReasonCode, truncated: boolean): Promise<void> {
    const item: StoredReading = {
      id: id(),
      createdAt: Date.now(),
      preview: preview(state.text),
      sourceText: state.text,
      uiLang: state.lang,
      mode: state.mode,
      output: state.output,
      replyIntent: state.intent,
      practice: result.practice,
      inferenceSource: result.inferenceSource,
      reasonCode: reason,
      modelLabel: result.modelLabel,
      reading: result.reading,
      checkedActionIds: [],
      truncated,
      arabicLeak: result.arabicLeak,
    };
    await deps.history.put(item);
    state.history = await deps.history.list();
    state.savedId = item.id;
    state.checked = new Set();
  }

  async function enqueue(): Promise<void> {
    const exists = state.queue.some((job) => job.text === state.text);
    if (exists) return;
    const job: QueuedJob = {
      id: id(),
      createdAt: Date.now(),
      text: state.text,
      output: state.output === "en" ? "both" : state.output,
      replyIntent: state.intent,
      uiLang: state.lang,
    };
    await deps.queue.put(job);
    state.queue = await deps.queue.list();
    state.queueDismissed = false;
  }

  async function runJob(job: QueuedJob): Promise<void> {
    state.draining = true;
    setText(job.text);
    state.output = job.output;
    state.intent = job.replyIntent;
    state.mode = "cloud";
    state.online = true;
    paint();
    await explain();
    await deps.queue.delete(job.id);
    state.queue = await deps.queue.list();
    state.draining = false;
    paint();
  }

  async function explain(): Promise<void> {
    const text = state.text.trim();
    state.online = deps.online();
    if (!text) {
      state.phase = "error";
      state.errorKey = "errorEmpty";
      state.result = null;
      paint();
      return;
    }
    if (text.length > MAX_INPUT_CHARS) {
      state.phase = "error";
      state.errorKey = "errorTooLong";
      state.result = null;
      paint();
      return;
    }
    const decision = routeDocument({
      text,
      mode: state.mode,
      output: state.output,
      online: state.online,
    });
    if (decision.outcome === "blocked") {
      if (decision.queueWhenOnline) await enqueue();
      state.phase = "error";
      state.errorKey = BLOCK_KEY[decision.reasonCode] ?? "errorUnknown";
      state.result = null;
      state.reason = decision.reasonCode;
      paint();
      return;
    }
    if (deps.explainer.kind === "firebase" && !deps.appCheck.ready) {
      state.phase = "error";
      state.errorKey = "errorAppCheck";
      state.result = null;
      paint();
      return;
    }
    state.phase = "running";
    state.errorKey = null;
    paint();
    prepareAbort?.abort();
    const controller = new AbortController();
    prepareAbort = controller;
    const prepare =
      decision.sdkMode === "only_in_cloud"
        ? null
        : deps.explainer
            .prepareDevice((ratio) => {
              state.device = "downloading";
              state.progress = ratio;
              paint();
            }, controller.signal)
            .then(() => {
              state.device = "ready";
              state.progress = 1;
            });
    try {
      if (prepare && (decision.sdkMode === "only_on_device" || state.device === "ready")) await prepare;
      else prepare?.catch((error: unknown) => {
        state.device = classifyError(error) === "nano" ? "missing" : "failed";
        paint();
      });
      const result = await deps.explainer.explain({
        text: decision.textForModel,
        truncated: decision.truncated,
        allowArabic: decision.allowArabic,
        output: state.output,
        replyIntent: state.intent,
        sdkMode: decision.sdkMode,
        deviceReady: state.device === "ready",
        signal: controller.signal,
      });
      const reason = result.practice ? decision.reasonCode : actualReason(decision, result.inferenceSource);
      state.result = result;
      state.reason = reason;
      state.truncated = decision.truncated;
      state.queued = decision.queueWhenOnline;
      state.phase = "done";
      if (decision.queueWhenOnline) await enqueue();
      await remember(result, reason, decision.truncated);
      paintedKey = "";
    } catch (error) {
      state.phase = "error";
      state.errorKey = ERROR_KEY[classifyError(error)];
      if (decision.sdkMode === "only_on_device") {
        state.device = classifyError(error) === "nano" ? "missing" : "failed";
      }
    }
    paint();
  }

  async function prepareOnly(): Promise<void> {
    prepareAbort?.abort();
    const controller = new AbortController();
    prepareAbort = controller;
    state.device = "downloading";
    state.progress = 0;
    paint();
    try {
      await deps.explainer.prepareDevice((ratio) => {
        state.progress = ratio;
        paint();
      }, controller.signal);
      state.device = "ready";
      state.progress = 1;
    } catch (error) {
      state.device = classifyError(error) === "nano" ? "missing" : "failed";
    }
    paint();
  }

  function renderHistory(): void {
    historyList.replaceChildren();
    if (!state.history.length) {
      const p = document.createElement("p");
      p.textContent = t(state.lang, "historyEmpty");
      historyList.append(p);
      return;
    }
    for (const item of state.history) {
      const row = document.createElement("article");
      row.className = "history-row";
      const title = document.createElement("h3");
      title.textContent = item.preview;
      const meta = document.createElement("p");
      meta.textContent = `${new Date(item.createdAt).toLocaleString()} · ${item.practice ? "practice" : item.inferenceSource}`;
      const open = document.createElement("button");
      open.type = "button";
      open.className = "text-btn";
      open.textContent = t(state.lang, "historyOpen");
      open.addEventListener("click", () => {
        setText(item.sourceText);
        state.result = {
          reading: item.reading,
          inferenceSource: item.inferenceSource,
          practice: item.practice,
          modelLabel: item.modelLabel,
          arabicLeak: item.arabicLeak,
        };
        state.reason = item.reasonCode as ReasonCode;
        state.truncated = item.truncated;
        state.checked = new Set(item.checkedActionIds);
        state.savedId = item.id;
        state.phase = "done";
        state.mode = item.mode;
        state.output = item.output;
        state.intent = item.replyIntent;
        paintedKey = "";
        historyDialog.close?.();
        historyDialog.removeAttribute("open");
        paint();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-btn";
      remove.textContent = t(state.lang, "historyDelete");
      remove.addEventListener("click", () => {
        void deps.history.delete(item.id).then(async () => {
          state.history = await deps.history.list();
          renderHistory();
        });
      });
      row.append(title, meta, open, remove);
      historyList.append(row);
    }
  }

  async function copyText(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      root.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  }

  $<HTMLFormElement>("#composer-form").addEventListener("submit", (event) => {
    event.preventDefault();
    void explain();
  });
  draft.addEventListener("input", () => {
    state.text = draft.value;
    persist();
    paint();
  });
  draft.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void explain();
    }
  });
  root.querySelectorAll<HTMLButtonElement>("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      state.lang = button.dataset.lang === "ar" ? "ar" : "en";
      if (!deps.settings.get("fahim.dictation")) state.dictation = state.lang === "ar" ? "ar-SA" : "en-US";
      persist();
      paintedKey = "";
      paint();
    });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode as UserMode;
      if (state.mode === "on_device") state.output = "en";
      persist();
      paint();
    });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-output]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      state.output = button.dataset.output as OutputPreference;
      persist();
      paint();
    });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-intent]").forEach((button) => {
    button.addEventListener("click", () => {
      state.intent = button.dataset.intent as ReplyIntent;
      persist();
      paint();
    });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => {
      const sample = samples.find((item) => item.id === button.dataset.sample);
      if (!sample) return;
      setText(sample.text);
      state.phase = "idle";
      state.result = null;
      state.errorKey = null;
      paint();
    });
  });
  $<HTMLButtonElement>("#clear").addEventListener("click", () => {
    setText("");
    state.phase = "idle";
    state.result = null;
    state.errorKey = null;
    paint();
  });
  $<HTMLButtonElement>("#prepare").addEventListener("click", () => {
    void prepareOnly();
  });
  $<HTMLButtonElement>("#file-btn").addEventListener("click", () => $<HTMLInputElement>("#file-input").click());
  $<HTMLInputElement>("#file-input").addEventListener("change", () => {
    const file = $<HTMLInputElement>("#file-input").files?.[0];
    if (!file) return;
    if (!/\.(txt|md|text)$/i.test(file.name) && file.type && file.type !== "text/plain") {
      state.phase = "error";
      state.errorKey = "fileRejected";
      paint();
      return;
    }
    void file.text().then((text) => {
      setText(text);
      paint();
    }).catch(() => {
      state.phase = "error";
      state.errorKey = "fileFailed";
      paint();
    });
  });
  const form = $<HTMLFormElement>("#composer-form");
  form.addEventListener("dragover", (event) => {
    event.preventDefault();
    form.classList.add("dropping");
  });
  form.addEventListener("dragleave", () => form.classList.remove("dropping"));
  form.addEventListener("drop", (event) => {
    event.preventDefault();
    form.classList.remove("dropping");
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.type && file.type !== "text/plain" && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      state.phase = "error";
      state.errorKey = "fileRejected";
      paint();
      return;
    }
    void file.text().then((text) => {
      setText(text);
      paint();
    });
  });
  $<HTMLButtonElement>("#mic").addEventListener("click", () => {
    if (state.listening) {
      deps.speech.stopListening();
      state.listening = false;
      paint();
      return;
    }
    state.listening = true;
    paint();
    const base = state.text.trim();
    void deps.speech.listen(state.dictation, {
      onText: (spoken, final) => {
        const next = [base, spoken.trim()].filter(Boolean).join(base ? "\n" : "");
        if (final) setText(next);
        else {
          draft.value = next;
        }
      },
    }).catch(() => {
      state.phase = "error";
      state.errorKey = "micUnsupported";
    }).finally(() => {
      state.listening = false;
      paint();
    });
  });
  $<HTMLSelectElement>("#dictation-lang").addEventListener("change", () => {
    state.dictation = $<HTMLSelectElement>("#dictation-lang").value === "ar-SA" ? "ar-SA" : "en-US";
    persist();
  });
  $<HTMLButtonElement>("#copy-reply").addEventListener("click", () => {
    const reading = state.result?.reading;
    if (!reading) return;
    const value = state.lang === "ar" && reading.replyAr ? `${reading.replyAr}\n\n${reading.replyEn}` : reading.replyEn;
    void copyText(value);
  });
  $<HTMLButtonElement>("#copy-brief").addEventListener("click", () => {
    if (!state.result) return;
    void copyText(formatBrief(state.result.reading, state.lang));
  });
  $<HTMLButtonElement>("#speak-reply").addEventListener("click", () => {
    if (!deps.speech.canSpeak || !state.result) return;
    if (state.speaking) {
      deps.speech.stopSpeaking();
      state.speaking = false;
      paint();
      return;
    }
    const reading = state.result.reading;
    const text = state.lang === "ar" && reading.summaryAr ? reading.summaryAr : reading.summaryEn;
    state.speaking = true;
    deps.speech.speak(text, state.lang === "ar" && reading.summaryAr ? "ar" : "en");
    paint();
    window.setTimeout(() => {
      state.speaking = false;
      paint();
    }, 4000);
  });
  $<HTMLButtonElement>("#print").addEventListener("click", () => window.print());
  $<HTMLButtonElement>("#toggle-source").addEventListener("click", () => {
    state.showSource = !state.showSource;
    paintedKey = "";
    paint();
  });
  $<HTMLButtonElement>("#history-open").addEventListener("click", () => {
    renderHistory();
    openDialog(historyDialog);
  });
  $<HTMLButtonElement>("#about-open").addEventListener("click", () => openDialog(aboutDialog));
  $<HTMLButtonElement>("#history-clear").addEventListener("click", () => {
    void deps.history.clear().then(async () => {
      state.history = [];
      renderHistory();
    });
  });
  $<HTMLButtonElement>("#practice-toggle").addEventListener("click", () => {
    deps.onPracticeToggle?.(!deps.practice);
  });
  $<HTMLButtonElement>("#queue-run").addEventListener("click", () => {
    const job = state.queue[0];
    if (job) void runJob(job);
  });
  $<HTMLButtonElement>("#queue-dismiss").addEventListener("click", () => {
    state.queueDismissed = true;
    paint();
  });

  const onOnline = () => {
    const now = deps.online();
    const reconnected = !wasOnline && now;
    wasOnline = now;
    state.online = now;
    if (reconnected && state.queue[0]) void runJob(state.queue[0]);
    else paint();
  };
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOnline);

  void Promise.all([deps.history.list(), deps.queue.list()]).then(([history, queue]) => {
    state.history = history;
    state.queue = queue;
    state.online = deps.online();
    paint();
  });
  paint();

  return {
    destroy() {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
      prepareAbort?.abort();
      deps.speech.stopListening();
      deps.speech.stopSpeaking();
    },
  };
}
