export function shell(): string {
  return `
    <a class="skip" href="#draft">Skip to the notice</a>
    <header class="top">
      <div class="brand">
        <span class="seal" aria-hidden="true">ف</span>
        <div>
          <p class="kicker" data-i18n="kicker"></p>
          <p class="wordmark">Fahim <span lang="ar">فهم</span></p>
          <p class="tagline" data-i18n="tagline"></p>
        </div>
      </div>
      <div class="top-actions">
        <p id="appcheck-chip" class="chip"></p>
        <div class="segment" role="group" aria-label="Language">
          <button type="button" id="lang-en" data-lang="en"></button>
          <button type="button" id="lang-ar" data-lang="ar"></button>
        </div>
        <button type="button" class="text-btn" id="history-open" data-i18n="navHistory"></button>
        <button type="button" class="text-btn" id="about-open" data-i18n="navHow"></button>
      </div>
    </header>
    <div id="practice-banner" class="banner banner-practice" hidden>
      <p data-i18n="practiceBanner"></p>
      <button type="button" id="practice-toggle"></button>
    </div>
    <div id="ignored-banner" class="banner banner-warn" hidden>
      <p data-i18n="appCheckIgnored"></p>
    </div>
    <div id="offline-banner" class="banner" hidden>
      <p data-i18n="offlineBanner"></p>
    </div>
    <div id="queue-banner" class="banner banner-queue" hidden>
      <p id="queue-text"></p>
      <button type="button" id="queue-run" data-i18n="queueRun"></button>
      <button type="button" id="queue-dismiss" class="text-btn" data-i18n="dismiss"></button>
    </div>
    <main class="desk">
      <form class="sheet composer" id="composer-form">
        <fieldset class="modes">
          <legend data-i18n="modeLegend"></legend>
          <div class="segment" role="radiogroup" id="mode-group">
            <button type="button" data-mode="auto" aria-pressed="false"></button>
            <button type="button" data-mode="on_device" aria-pressed="false"></button>
            <button type="button" data-mode="cloud" aria-pressed="false"></button>
          </div>
          <p id="mode-help" class="help"></p>
        </fieldset>
        <fieldset>
          <legend data-i18n="outputLegend"></legend>
          <div class="segment" id="output-group">
            <button type="button" data-output="en"></button>
            <button type="button" data-output="ar"></button>
            <button type="button" data-output="both"></button>
          </div>
          <p id="output-limit" class="help" hidden></p>
        </fieldset>
        <fieldset>
          <legend data-i18n="intentLegend"></legend>
          <div class="segment" id="intent-group">
            <button type="button" data-intent="acknowledge"></button>
            <button type="button" data-intent="question"></button>
            <button type="button" data-intent="decline"></button>
          </div>
        </fieldset>
        <label class="draft-label" for="draft" data-i18n="draftLabel"></label>
        <textarea id="draft" name="draft" rows="12"></textarea>
        <p id="token-hint" class="hint"></p>
        <p class="samples-label" data-i18n="samplesLegend"></p>
        <div class="samples">
          <button type="button" class="sample" data-sample="school"><span data-i18n="sampleSchool"></span><small data-i18n="sampleSchoolNote"></small></button>
          <button type="button" class="sample" data-sample="lease"><span data-i18n="sampleLease"></span><small data-i18n="sampleLeaseNote"></small></button>
          <button type="button" class="sample" data-sample="clinic"><span data-i18n="sampleClinic"></span><small data-i18n="sampleClinicNote"></small></button>
          <button type="button" class="sample" data-sample="maintenance"><span data-i18n="sampleArabic"></span><small data-i18n="sampleArabicNote"></small></button>
        </div>
        <div class="tool-row">
          <button type="button" id="mic" class="text-btn"></button>
          <label class="dictation">
            <span data-i18n="dictationLabel"></span>
            <select id="dictation-lang">
              <option value="en-US">English</option>
              <option value="ar-SA">العربية</option>
            </select>
          </label>
          <button type="button" id="file-btn" class="text-btn" data-i18n="fileButton"></button>
          <input id="file-input" type="file" accept=".txt,.md,.text,text/plain" hidden />
          <button type="button" id="clear" class="text-btn" data-i18n="clear"></button>
        </div>
        <p id="drop-hint" class="hint" data-i18n="dropHint"></p>
        <button type="submit" id="explain" class="primary"></button>
        <p class="fine" data-i18n="singleTurnNote"></p>
        <div class="device" id="device-box">
          <button type="button" id="prepare" class="secondary" data-i18n="prepare"></button>
          <p id="device-status"></p>
          <div class="progress" id="progress" hidden><span id="progress-bar"></span></div>
        </div>
      </form>
      <section class="sheet result" id="result" aria-live="polite">
        <div id="result-empty" class="empty">
          <p class="empty-kicker">Fahim</p>
          <h1 data-i18n="emptyTitle"></h1>
          <p data-i18n="emptyBody"></p>
        </div>
        <div id="result-error" class="callout" hidden></div>
        <article id="result-body" hidden>
          <header class="engine" id="engine-band">
            <p class="engine-kicker" data-i18n="whyLabel"></p>
            <h2 id="engine-badge"></h2>
            <p id="engine-why"></p>
            <p class="sdk-line"><span data-i18n="sdkField"></span>: <code id="engine-raw"></code></p>
            <p id="engine-extra" class="fine"></p>
          </header>
          <p id="result-flags" class="flags"></p>
          <h3 data-i18n="summaryTitle"></h3>
          <div id="summary-en" class="prose" dir="auto"></div>
          <div id="summary-ar" class="prose arabic" lang="ar" dir="rtl" hidden></div>
          <h3 data-i18n="actionsTitle"></h3>
          <ul id="actions" class="actions"></ul>
          <div class="facts">
            <section><h3 data-i18n="datesTitle"></h3><ul id="dates"></ul></section>
            <section><h3 data-i18n="amountsTitle"></h3><ul id="amounts"></ul></section>
            <section><h3 data-i18n="contactsTitle"></h3><ul id="contacts"></ul></section>
          </div>
          <h3 data-i18n="replyTitle"></h3>
          <div class="reply">
            <pre id="reply-en" dir="auto"></pre>
            <pre id="reply-ar" lang="ar" dir="rtl" hidden></pre>
            <div class="tool-row">
              <button type="button" id="copy-reply" class="text-btn" data-i18n="copyReply"></button>
              <button type="button" id="copy-brief" class="text-btn" data-i18n="copyBrief"></button>
              <button type="button" id="speak-reply" class="text-btn" data-i18n="readAloud"></button>
              <button type="button" id="print" class="text-btn" data-i18n="print"></button>
              <button type="button" id="toggle-source" class="text-btn"></button>
            </div>
          </div>
          <pre id="source-view" class="source" hidden></pre>
          <h3 data-i18n="caveatTitle"></h3>
          <p id="caveat" class="caveat"></p>
          <p class="fine" data-i18n="savedNote"></p>
        </article>
      </section>
    </main>
    <footer class="foot">
      <p data-i18n="footerAdvice"></p>
      <p><span data-i18n="footerPrivacy"></span> <span data-i18n="footerLicense"></span></p>
    </footer>
    <dialog id="history-dialog">
      <form method="dialog">
        <header class="dialog-head">
          <h2 data-i18n="historyTitle"></h2>
          <button type="submit" class="text-btn" data-i18n="historyClose"></button>
        </header>
        <div id="history-list"></div>
        <button type="button" id="history-clear" class="text-btn" data-i18n="historyClear"></button>
      </form>
    </dialog>
    <dialog id="about-dialog">
      <form method="dialog">
        <header class="dialog-head">
          <h2 data-i18n="aboutTitle"></h2>
          <button type="submit" class="text-btn" data-i18n="historyClose"></button>
        </header>
        <div class="about">
          <p data-i18n="aboutP1"></p>
          <p data-i18n="aboutP2"></p>
          <p data-i18n="aboutP3"></p>
          <p data-i18n="aboutP4"></p>
          <p data-i18n="aboutP5"></p>
        </div>
      </form>
    </dialog>
    <p id="live-status" class="sr-only" aria-live="polite"></p>
  `;
}
