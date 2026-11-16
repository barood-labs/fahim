# Fahim video storyboard

Target about 2:20. Hard cap 3:00. English. Desktop Chrome. Do not publish a YouTube link until a live cloud reading works.

This is a storyboard, not a recording. Practice mode (`?practice=1`) stays out of the video. Its badge says `not-called`.

**Verified in this pass:** routing tests, the offline-queue card, and the free-tier error copy. **Not verified:** a real Gemini Nano download or an `inferenceSource: on_device` badge. This environment has no Nano-capable desktop Chrome.

## Before anyone presses record

1. Chrome 139 or newer (`chrome://settings/help`).
2. Flags, rechecked 16 November 2026. The Firebase hybrid web guide still says enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and restart. The contest FAQ says search `chrome://flags` for “Gemma 4 for Built-in AI.” Chrome’s Prompt API page says the API ships in Chrome 148 and does not name either flag. Try the Firebase flag first.
3. Open https://fahim-hybridai.web.app. No `?practice=1`.
4. Click **Prepare on-device model** and wait until it says ready. If it never does, do not pretend the next badge is on-device.

## Shots

| Time | Record? | On screen | Say |
| --- | --- | --- | --- |
| 0:00–0:20 | Yes, once the app is the live site | Empty desk, then the school-trip sample. Not a chatbot. | “An Arabic-speaking parent just got an English school email. The fee, the deadline, and who to call are buried in the message. Fahim is that desk. It is not another chat.” |
| 0:20–0:40 | Yes | Point at Auto. | “English paperwork tries Gemini Nano here, through Firebase AI Logic. Arabic uses cloud Gemini through the same SDK. The badge is the SDK field inferenceSource.” |
| 0:40–1:15 | Only if Nano is ready | School sample, output English, **Explain this notice**. Zoom a green badge until `inferenceSource: on_device` is readable. Show the Friday permission, $12, and the phone. Optional: DevTools offline only after the status says ready. | “This stayed on the device. Plain English. Nano’s official languages are English, Japanese, Spanish, German, and French. Arabic was not asked for.” |
| 0:40–1:15 alternate | If Nano is missing | The error card, not a fake badge. | “Nano is not on this Chrome. Auto asked for it, then tried the cloud. The cloud returned 403: the free tier is not available for this project. We are not linking billing, and we are not calling that an on-device answer.” |
| 1:15–1:55 | **Do not record** | Would have been Arabic or Both, badge `in_cloud`, side-by-side text. | Hold this shot. A live cloud reading does not succeed on fahim-hybridai. Do not stage it with practice mode. |
| 1:55–2:15 | Yes, this is the filmable second beat | DevTools offline. Output **Both**. Explain the English school note. Hold on the blue **Offline queue** card. No Arabic summary. | “Offline, the English reading can stay on the device. Arabic waits on this card. Fahim does not invent it. Nano does not officially support Arabic.” |
| 2:15–2:25 | Yes | Address bar https://fahim-hybridai.web.app, then the repo. | “Hosted on Firebase, Apache-2.0, public repo. Judges need desktop Chrome and the Nano flag. The badge is the proof, not the script.” |

Stop at 3:00 even if the held cloud shot is still empty. Do not upload the video until the cloud beat can be filmed for real.
