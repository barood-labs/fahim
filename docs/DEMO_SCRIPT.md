# Fahim demo script

Target length: about 2:20. Stay under 3:00. Only the first three minutes are judged. Record in Chrome on the desktop, in English, with the app already open. Cut the voice beat if recognition hesitates.

Before you record:

1. Chrome 139 or newer, desktop. Check `chrome://settings/help`.
2. Enable on-device Gemini. The current Firebase hybrid guide says to set `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` to Enabled and restart. The contest FAQ on November 13, 2026 instead says to search `chrome://flags` for “Gemma 4 for Built-in AI.” If you do not see the first flag, enable the FAQ flag. Restart Chrome.
3. In Fahim, click **Prepare on-device model** and wait until the status says Gemini Nano is ready. The first download can take several minutes. Do this before the recording so the on-device path is not a silent wait.
4. Use the live Firebase build, not `?practice=1`. The badge must show a real `inferenceSource`.

| Time | On screen | Say |
| --- | --- | --- |
| 0:00–0:20 | The empty desk, then the school-trip sample in the composer. Do not open a chatbot window. | “An Arabic-speaking parent just got an English school email. The fee, the deadline, and who to call are buried in the message. Fahim is the desk where that notice gets explained. It is not another chat.” |
| 0:20–0:40 | Point at Auto, then at the line under it. | “English paperwork tries Gemini Nano on this computer, through Firebase AI Logic. Arabic, and computers without Nano, use cloud Gemini through the same SDK. The badge is the SDK’s own inferenceSource, not a guess.” |
| 0:40–1:15 | Paste or load the school sample. Output: English. Click **Explain this notice**. Zoom the green badge until `inferenceSource: on_device` is readable. Show the summary, the Friday permission, the $12, and the phone number. Optional: turn the network off in Chrome DevTools only if Nano is already ready, so the fallback cannot be doing the work. | “This stayed on the device. Plain English, the permission slip due Wednesday, twelve dollars, and the office number. Nano’s official languages are English, Japanese, Spanish, German, and French. Arabic was not asked for.” |
| 1:15–1:55 | Switch output to **Both**, or paste the Arabic maintenance note. Click explain. Zoom the blue badge: `inferenceSource: in_cloud`. Show Arabic and English side by side, then **Copy a note for the family**. | “Arabic cannot run on Nano, so this request went to the cloud. Same actions, both languages, and a reply you can edit. Still one Firebase AI Logic call. Not a second model.” |
| 1:55–2:10 | DevTools offline. Output: Both. Explain the English school note again. Show the queued line. Do not pretend an Arabic paragraph appeared. | “Offline, Fahim keeps the English on-device reading and queues Arabic. It will not invent an Arabic translation Nano cannot produce.” |
| 2:10–2:25 | The hosted URL in the address bar, then the repo, then the How Fahim decides dialog for one sentence. End on the badge. | “Hosted on Firebase, Apache-2.0, public repo. Judges: desktop Chrome, the Nano flag, then Prepare on-device model. The badge tells you which engine answered.” |

If Nano is still downloading when you reach 0:40, say that out loud and show the cloud badge. Do not relabel a cloud answer as on-device. A reliable cloud reading is better than a faked on-device one.
