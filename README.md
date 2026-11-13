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

The reCAPTCHA Enterprise site key is committed in `src/app-check-public.ts` and `public/config.json`. The production bundle imports the TypeScript module, so a missing `config.json` fetch still uses Enterprise. If either file contains `appCheckDebugToken` or `debugToken`, Fahim ignores it and shows a warning.

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

### Hosted site: reCAPTCHA Enterprise

The web app is registered with reCAPTCHA Enterprise, a 1-day token TTL, and no billing account. The site key is in the repo. Firebase AI Logic is still **Unenforced**. Enforce it only after the hosted site answers a notice. The steps are in [docs/LAUNCH.md](docs/LAUNCH.md).

Leave replay protection off. This app sends ordinary App Check tokens. Spark stays on the no-cost Enterprise quota (10,000 assessments a month) and the default risk threshold of 0.5. Do not upgrade to Blaze for more score levels.

`localhost` is not on the Enterprise key. Local explaining still needs the debug token above. A production build does not turn debug mode on.

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

Practice mode (`?practice=1`) shows the desk without a model. Do not judge practice mode as the AI. The hosted site should show **App Check · reCAPTCHA Enterprise**.

## Deploy (Spark, no billing)

A push to `main` runs `.github/workflows/deploy-hosting.yml`. Pull requests do not run it, so PR checks stay green before the secret exists.

The secret to create is **`FIREBASE_TOKEN`**. It does not need a billing account or the Blaze plan.

1. On your machine, while signed in as an owner of `fahim-hybridai`:

   ```bash
   npx firebase-tools@latest login:ci
   ```

2. A browser opens. Sign in. If it asks you to link Cloud Billing or upgrade to Blaze, cancel. The command prints a refresh token in the terminal.
3. GitHub → **Settings → Secrets and variables → Actions → New repository secret**.
4. Name: `FIREBASE_TOKEN`. Value: that token. Do not commit it, and do not put it in `.env`.
5. Push to `main`, or re-run the **Deploy Hosting** workflow. It builds this repo and runs `firebase deploy --only hosting --project fahim-hybridai`.

`login:ci` is the Spark path. A service-account JSON also works, with no billing account, if you cannot use `login:ci`. Create a key only for a principal that already has **Firebase Hosting Admin** on `fahim-hybridai`, store the whole JSON as the repository secret `FIREBASE_SERVICE_ACCOUNT`, and refuse any screen that asks for a billing account. The workflow uses `FIREBASE_TOKEN` when it is set, and the service account only when the token secret is empty. Prefer the token. Google Cloud often blocks new service-account keys.

You can still deploy by hand:

```bash
npm run build
npx firebase-tools@latest deploy --only hosting --project fahim-hybridai
```

`firebase.json` publishes `dist/`. `.firebaserc` points at `fahim-hybridai`.

Before the first deploy, confirm in the Firebase console that the plan is Spark and that no Cloud Billing account is linked. Firebase Hosting’s product page lists 10 GB of stored content and up to 360 MB/day of transfer at no cost. The Hosting usage docs say a project that is not on Blaze cannot deploy once stored content passes the no-cost storage limit. This site is far under that. Recheck the pricing page before you deploy, and do not upgrade if a quota warning appears. Delete an old preview instead.

There is no Firestore, Auth, Functions, or Analytics in this app. Do not enable them for the demo. After the site answers a notice, follow [docs/LAUNCH.md](docs/LAUNCH.md) to enforce App Check for AI Logic.

## Samples

Four fictional notices are built in: a school field trip, a rent adjustment, a fasting blood test, and an Arabic maintenance note. They contain no personal data. Use them for the video.

## Repository layout

- `src/engine/firebase-engine.ts` — the only model call.
- `src/engine/hybrid-params.ts` — SDK mode, schema, Nano languages.
- `src/domain/route.ts` — which mode is requested, and why.
- `src/app/create-app.ts` — the desk UI.
- `src/app-check-public.ts` — the committed Enterprise site key.
- `docs/DEMO_SCRIPT.md` — a video script under three minutes.
- `docs/SUBMISSION.md` — Devpost text.
- `docs/LAUNCH.md` — enforce App Check after the hosted site works.

License: [Apache-2.0](LICENSE).

## Limits we will not paper over

- Arabic is not an official Gemini Nano language. Offline Arabic is queued, not generated.
- Many judges will only hit the cloud path. The cloud reading has to be the good one. The video has to show on-device.
- The Chrome flag name in the contest FAQ (“Gemma 4 for Built-in AI”) and the flag name in the Firebase hybrid guide (`#prompt-api-for-gemini-nano-multimodal-input`) did not match on November 13, 2026. Both are documented above. Official Rules and the Firebase guide should be rechecked before submission.
- Free-tier rate limits are real. The app surfaces a 429 as a pause. It does not request more quota.
- Arabic quality of `gemini-3.5-flash-lite` still has to be watched on the first live calls. The prompts ask for Modern Standard Arabic and forbid invented dates. If a live answer invents a deadline, that is a model failure and the caveat on the page still applies: check the original before you pay, sign, or skip a dose.
- Enabling the reCAPTCHA Enterprise API might, in some Cloud console states, ask for a billing account even though the published quota is no-cost. If it does, do not link one.
