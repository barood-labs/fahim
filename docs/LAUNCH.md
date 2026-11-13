# Launch checklist — enforce App Check

Do this only after a real deploy of `main` is serving the site. AI Logic is **Unenforced** on purpose until that deploy answers a notice. Replay protection stays **off**. Do not link a billing account and do not upgrade to Blaze.

The production build already includes the reCAPTCHA Enterprise site key (`src/app-check-public.ts` and `public/config.json`).

## 1. Confirm the deploy

- [ ] GitHub → Settings → Secrets and variables → Actions has `FIREBASE_TOKEN` (see the README deploy section). The token comes from `npx firebase-tools@latest login:ci`. No billing account.
- [ ] A push to `main` finished the **Deploy Hosting** workflow in green.
- [ ] https://fahim-hybridai.web.app and https://fahim-hybridai.firebaseapp.com both open Fahim.
- [ ] The address bar is not `?practice=1`. The header chip reads **App Check · reCAPTCHA Enterprise**.

## 2. Confirm a live reading before enforcement

- [ ] Load the **School trip** sample and press **Explain this notice**.
- [ ] A reading comes back. `inferenceSource` is `in_cloud` or `on_device`. It is not `not-called`.
- [ ] There is no App Check error. If there is, stop. Check that both Hosting domains are on the Enterprise key, then try again. Do not enforce yet.

## 3. Enforce Firebase AI Logic

- [ ] Firebase console → **Security → App Check → APIs**.
- [ ] Open the **Firebase AI Logic** row. It should say **Unenforced**.
- [ ] Choose baseline protection **Enforced**.
- [ ] Leave **replay protection disabled**. This app sends ordinary App Check tokens. Replay protection would reject them.
- [ ] Save. Do not change the 1-day token TTL. Do not change the risk threshold unless real visitors are blocked; the Spark default is 0.5.

## 4. Confirm the hosted site still answers

- [ ] Hard-refresh https://fahim-hybridai.web.app.
- [ ] Explain the school sample again. The badge still shows `inferenceSource` from Firebase AI Logic.
- [ ] Explain the **Arabic note**. The badge should be cloud.
- [ ] If enforcement rejects the site, set Firebase AI Logic back to **Unenforced** and fix the site key domains before trying again.

## 5. Leave localhost on the debug token

- [ ] `npm run dev` still uses `VITE_APPCHECK_DEBUG_TOKEN` or `self.FIREBASE_APPCHECK_DEBUG_TOKEN`.
- [ ] That token is registered under **Manage debug tokens**, and it is not in the repo.
- [ ] `localhost` is not on the Enterprise key.
