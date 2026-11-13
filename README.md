# Fahim (فهم)

Fahim is a life-admin desk for people who receive school emails, lease notices, clinic texts, and bills in English and need them explained, including in Arabic. It summarizes the notice, lists what you may need to do, pulls out dates, amounts, and contacts, and drafts a reply you can edit.

It is not a chatbot and not an offline Arabic translator. Chrome’s on-device model does not officially support Arabic. Fahim is built around that fact.

Live readings go through the **Firebase AI Logic Web SDK** only. The app does not call the Gemini REST API, Chrome’s Prompt API, Translator API, Summarizer API, or any other model API.

## Hybrid inference

The mode control is the product:

| You choose | What the SDK is asked to do |
| --- | --- |
| **Auto** | `InferenceMode.PREFER_ON_DEVICE` for a short English notice when you asked for English. `ONLY_IN_CLOUD` when the notice is Arabic, mixed, in another script, or longer than the on-device budget. |
| **On this device** | `ONLY_ON_DEVICE`. English output only. Arabic notices are refused, with a plain explanation. |
| **Cloud** | `ONLY_IN_CLOUD`. |

The cloud model is pinned to **`gemini-3.5-flash-lite`** on the Gemini Developer API. Firebase’s model list marks it “billing not required,” and the Gemini Developer API pricing page lists free-tier input and output. The app does not enable grounding, tools, image output, TTS, or the Live API.

On-device calls use `expectedOutputs` of English only. Arabic is not listed. The official Chrome Prompt API languages are English, Japanese, Spanish, German, and French. Fahim does not add `ar`.

Each reading is one `generateContent` call. On-device Gemini Nano does not support multi-turn chat, so there is no conversation. The code lives in `src/engine/firebase-engine.ts` and `src/engine/hybrid-params.ts`:

1. `initializeApp` with the public web config.
2. `initializeAppCheck` before any model call.
3. `getAI(app, { backend: new GoogleAIBackend() })`.
4. `getGenerativeModel(ai, { mode, onDeviceParams, inCloudParams })`.
5. `initializeDeviceModel()` from a button click, with download progress.
6. `generateContent(prompt)`.
7. The badge reads `response.inferenceSource`, which is `on_device` or `in_cloud`.

`PREFER_ON_DEVICE` uses Nano only when Chrome reports the model as already available. If it is still downloading, the SDK answers from the cloud and the badge says so. Click **Prepare on-device model** and wait for “ready” before expecting an on-device answer. The first download can take several minutes, and Chrome requires that download to start from a user gesture.

The on-device context limit is **9,216 tokens**, including the prompt. Hybrid mode does not support a trustworthy `countTokens()`, so Fahim estimates about 3 characters per token and keeps the document near 4,000 tokens so the instruction and the JSON answer still fit. Longer notices go to the cloud in Auto mode. On-device-only mode reads the beginning and says it did.

If you ask for Arabic while offline, and the notice is English, Fahim keeps the English on-device reading and queues Arabic. It does not invent the Arabic. The queue runs when the browser comes back online, or when you press **Run it now**.

History is in IndexedDB (`fahim`). Nothing is uploaded except the notice you choose to explain, and that goes only to Firebase AI Logic.

Voice is `SpeechRecognition` / `webkitSpeechRecognition` and `speechSynthesis`. Audio is not sent to a model.

## Try it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Without an App Check debug token or a reCAPTCHA site key, the screen still loads. **Use practice mode** (the banner button, or `?practice=1`) walks through real sample notices with local readings so you can see the desk. Practice mode does not call Firebase. The badge says so, and `inferenceSource` shows `not-called`.

```bash
npm test
npm run build
npm run preview
```

## Firebase project

The web app is wired to the Spark project **`fahim-hybridai`**. The public web config is in `src/firebase-public-config.ts`. That `apiKey` is the Firebase client identifier, not a Gemini API key. Do not add a server key.

AI Logic must stay on the **Gemini Developer API**. Do not switch the provider to the Agent Platform / Vertex path. Do not link a Cloud Billing account. Do not upgrade to the Blaze plan. Do not request the hackathon’s Google Account Quota. Text inference on `gemini-3.5-flash-lite` is the free tier; going over the free-tier rate limit should show a pause in the app, not a bill.

Optional env overrides are listed in `.env.example`. Copy it to `.env`. `.env` is gitignored.

You can also put a public site key in `public/config.json` (gitignored; see `public/config.example.json`). If that file contains `appCheckDebugToken` or `debugToken`, Fahim ignores it and shows a warning. Debug tokens do not belong in a file that Hosting would deploy.

## App Check

Firebase AI Logic requires App Check. This repo never contains a debug token.

### Localhost: debug token

1. Create `.env` from `.env.example`.
2. Set one of:
   - `VITE_APPCHECK_DEBUG_TOKEN=true` so the SDK creates a token and prints it, or
   - `VITE_APPCHECK_DEBUG_TOKEN=` plus a token you already registered.
3. You can instead set `self.FIREBASE_APPCHECK_DEBUG_TOKEN` to `true` or to the token string **before** App Check initializes. If that global is already set, Fahim does not overwrite it.
4. Restart `npm run dev`. In the browser console, copy the line `Firebase App Check debug token: ...`.
5. Firebase console → **Security → App Check → Apps** → the Fahim web app → **Manage debug tokens** → add that token.
6. Explain a notice. The header chip should read **App Check · debug token**.

Production builds ignore `VITE_APPCHECK_DEBUG_TOKEN` unless you also set `VITE_APPCHECK_ALLOW_DEBUG=true`. Do not set that for a public deploy. Firebase’s own docs say not to ship a debug token or a debug build.

### Hosted site: reCAPTCHA Enterprise (recommended)

Use **reCAPTCHA Enterprise**, not classic reCAPTCHA v3.

Firebase’s current App Check page lists **reCAPTCHA Enterprise** as the web provider. The v3 guide says to use Enterprise for new integrations and says classic v3 is the older path. The console warning you saw, asking for a secret key and saying classic reCAPTCHA is deprecated, is that older path. Skip it. Enterprise does not put a secret in the app. The client only receives a site key. The secret key classic v3 asked for would live in the Firebase console; you do not need that flow.

Enterprise on the **Spark** plan, from Firebase’s provider doc:

- No-cost for **10,000 assessments per month**. Above that, the docs say the project is charged. Do not link billing to “cover” that. Keep the token TTL at the default **1 day** so a demo cannot refresh tokens all afternoon. A judge session is nowhere near 10,000.
- Spark only exposes score levels 0.1, 0.3, 0.7, and 0.9. Leave the app risk threshold at the default **0.5**. Do not upgrade to Blaze to unlock the other scores.

Steps:

1. Stay on Spark. If a screen tells you to upgrade to Blaze or link a billing account, cancel.
2. Open the reCAPTCHA Enterprise key page for this project: [Google Cloud Fraud Defense / reCAPTCHA](https://console.cloud.google.com/security/recaptcha?project=fahim-hybridai). Confirm the project picker says `fahim-hybridai`.
3. If asked to enable the reCAPTCHA Enterprise API, enable it. If enabling it requires a billing account, stop. Use the debug provider for local judging instead. The contest accepts debug tokens. Do not add a card.
4. **Create key**. Display name: `Fahim web`. Application type: **Website**. Leave **Use checkbox challenge** off. App Check needs a score-based key, which stays invisible.
5. Leave domain verification on. Add the domains you will actually serve:
   - `fahim-hybridai.web.app`
   - `fahim-hybridai.firebaseapp.com`
   - a custom domain, if you have one
6. Do **not** add `localhost`. Localhost uses the debug token. Do not mark the key as a testing-only key if this is the public site.
7. Create the key and copy the **site key**.
8. Firebase console → **Security → App Check → Apps**. Register the existing web app (`appId` `1:852643874067:web:0dca5a4cf11e672fba46e6`) with provider **reCAPTCHA Enterprise**. Paste the site key. Leave TTL at 1 day.
9. **Security → App Check → APIs**. Firebase AI Logic should be **Enforced**. Leave **replay protection disabled**. This app uses ordinary App Check tokens, not limited-use tokens. Replay protection rejects those ordinary tokens.
10. Put the site key in `.env` as `VITE_APPCHECK_SITE_KEY`, or in `public/config.json` as `appCheckSiteKey`. Leave `VITE_APPCHECK_PROVIDER` as `enterprise` (the default). `v3` exists only if you already hold a classic key.
11. `npm run build`, then deploy. The header chip should read **App Check · reCAPTCHA Enterprise**.

The site key is public by design. It is safe to put it in `.env` at build time or in `config.json`. It is not a debug token and not a Gemini key.

## Judges: turn on Gemini Nano

Desktop Chrome **139 or newer**. Check `chrome://settings/help`.

The Firebase hybrid guide, fetched while this app was built, still says:

1. Open `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`.
2. Set it to **Enabled**.
3. Restart Chrome.

The contest FAQ on November 13, 2026 says to search `chrome://flags` for **“Gemma 4 for Built-in AI”** and enable that. If the first flag is missing in your Chrome build, use the FAQ flag. Restart either way.

Then, in Fahim:

1. Click **Prepare on-device model**.
2. Wait until the status says Gemini Nano is ready. You can also watch `chrome://on-device-internals` or the DevTools console.
3. Load the **School trip** sample, leave output on **English**, and explain. The badge should be green and `inferenceSource` should be `on_device`.
4. Switch output to **Both**, or load the **Arabic note**. The badge should be blue and `inferenceSource` should be `in_cloud`.

If Nano is missing, Auto still answers from the cloud and the badge says the SDK fell back. That is a successful hybrid outcome, not a failure of the page.

A hosted build with no site key yet will refuse live calls until App Check is configured. Practice mode (`?practice=1`) shows the desk without a model. Do not judge practice mode as the AI.

## Deploy (Spark, no billing)

```bash
npm run build
npx firebase-tools@latest deploy --only hosting --project fahim-hybridai
```

`firebase.json` publishes `dist/`. `.firebaserc` points at `fahim-hybridai`.

Before the first deploy, confirm in the Firebase console that the plan is Spark and that no Cloud Billing account is linked. Firebase Hosting’s product page lists 10 GB of stored content and up to 360 MB/day of transfer at no cost. The Hosting usage docs say a project that is not on Blaze cannot deploy once stored content passes the no-cost storage limit. This site is far under that. Recheck the pricing page before you deploy, and do not upgrade if a quota warning appears. Delete an old preview instead.

There is no Firestore, Auth, Functions, or Analytics in this app. Do not enable them for the demo.

## Samples

Four fictional notices are built in: a school field trip, a rent adjustment, a fasting blood test, and an Arabic maintenance note. They contain no personal data. Use them for the video.

## Repository layout

- `src/engine/firebase-engine.ts` — the only model call.
- `src/engine/hybrid-params.ts` — SDK mode, schema, Nano languages.
- `src/domain/route.ts` — which mode is requested, and why.
- `src/app/create-app.ts` — the desk UI.
- `docs/DEMO_SCRIPT.md` — a video script under three minutes.
- `docs/SUBMISSION.md` — Devpost text.

License: [Apache-2.0](LICENSE).

## Limits we will not paper over

- Arabic is not an official Gemini Nano language. Offline Arabic is queued, not generated.
- Many judges will only hit the cloud path. The cloud reading has to be the good one. The video has to show on-device.
- The Chrome flag name in the contest FAQ (“Gemma 4 for Built-in AI”) and the flag name in the Firebase hybrid guide (`#prompt-api-for-gemini-nano-multimodal-input`) did not match on November 13, 2026. Both are documented above. Official Rules and the Firebase guide should be rechecked before submission.
- Free-tier rate limits are real. The app surfaces a 429 as a pause. It does not request more quota.
- Arabic quality of `gemini-3.5-flash-lite` still has to be watched on the first live calls. The prompts ask for Modern Standard Arabic and forbid invented dates. If a live answer invents a deadline, that is a model failure and the caveat on the page still applies: check the original before you pay, sign, or skip a dose.
- Enabling the reCAPTCHA Enterprise API might, in some Cloud console states, ask for a billing account even though the published quota is no-cost. If it does, do not link one.
