# Devpost draft — Fahim

Paste this into the Devpost form. Re-read the Official Rules once more before submitting. Do not upload API keys, a debug token, or personal documents.

## Project name

Fahim

## Elevator pitch

Fahim reads the school email, the lease notice, or the clinic text and tells you what it is asking, in English and in Arabic, with the date, the amount, and a reply you can send.

## About the project

Arabic-speaking families in the US routinely receive the important paperwork in English: permission slips, rent increases, fasting instructions, workplace deadlines. The useful question is not “translate this page.” It is “what do I have to do, by when, and what do I write back?”

Fahim is that desk. You paste, drop, or dictate a notice. It returns a plain-language summary, a checklist, the dates, amounts, and contacts that were actually written down, and a short reply. You can copy a bilingual note for the family. History stays in the browser. There is no account.

The hybrid design is the product, and it is honest about Gemini Nano. Chrome’s on-device model officially supports English, Japanese, Spanish, German, and French. Arabic is not on that list. Fahim does not pretend otherwise.

- Short English notices, when you ask for English, are sent with Firebase AI Logic `PREFER_ON_DEVICE`. If Nano is ready, the answer is on-device and works offline.
- Arabic, mixed text, and long documents go to cloud Gemini through the same SDK, on the free-tier model `gemini-3.5-flash-lite`.
- If you ask for Arabic while offline, Fahim keeps the English on-device reading when it can, and queues Arabic until there is a connection. It does not invent the Arabic.
- The badge is the SDK field `inferenceSource` (`on_device` or `in_cloud`), plus a sentence that says why.

Every live reading is a single `generateContent` call. On-device Nano cannot hold a chat, so Fahim does not pretend to. Voice is the browser’s Web Speech API and `speechSynthesis`, not a paid voice model. No image model, no TTS model, no second provider.

## How we built it

- Vite and TypeScript.
- Firebase AI Logic Web SDK (`firebase` 12.19), `GoogleAIBackend`, hybrid `InferenceMode`.
- `initializeDeviceModel()` runs from a click, with a visible download progress, because the first Nano download can take minutes and must follow a user gesture.
- Structured JSON for the summary, actions, dates, amounts, contacts, and reply.
- Firebase App Check. Local judging uses a debug token from `VITE_APPCHECK_DEBUG_TOKEN` or `self.FIREBASE_APPCHECK_DEBUG_TOKEN`. The hosted app is meant to use a reCAPTCHA Enterprise site key. The debug token is not in the repo.
- Firebase Hosting config for the Spark plan. No Cloud Billing account, no Blaze plan, no Google Account Quota.
- IndexedDB for history. No login required to try it.

## Built with

Firebase AI Logic, Firebase App Check, Firebase Hosting, Gemini Nano, Gemini Developer API (`gemini-3.5-flash-lite`), Vite, TypeScript, IndexedDB, Web Speech API.

## The hard part

Making hybrid inference visible and truthful. A bilingual translator that silently called the cloud, or that claimed Nano speaks Arabic, would miss the point of the category. The router, the badge, and the offline queue are the same feature.

## What’s next

A hosted URL once the reCAPTCHA Enterprise site key is in place. No billing upgrade. An Android client only if the web demo is already the one we want judged.
