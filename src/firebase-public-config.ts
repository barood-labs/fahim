/**
 * Public Firebase web config for fahim-hybridai.
 *
 * This apiKey is the client identifier from the Firebase console, not a
 * Gemini API key and not an App Check secret. Firebase AI Logic keeps the
 * Gemini credential on the server. App Check is what stops other sites from
 * reusing this config. Do not add a server key, a reCAPTCHA secret, or an
 * App Check debug token to this file.
 */
export const firebasePublicConfig = {
  apiKey: "AIzaSyBVKR-ufMSP3O3cCUeBOUfKGFdLUgkEBuo",
  authDomain: "fahim-hybridai.firebaseapp.com",
  projectId: "fahim-hybridai",
  storageBucket: "fahim-hybridai.firebasestorage.app",
  messagingSenderId: "852643874067",
  appId: "1:852643874067:web:0dca5a4cf11e672fba46e6",
} as const;
