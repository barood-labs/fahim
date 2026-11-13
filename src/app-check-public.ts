/**
 * Public reCAPTCHA Enterprise site key for fahim-hybridai.
 *
 * A site key is meant to be in the client. It is not an App Check debug
 * token, not a reCAPTCHA secret, and not a Gemini API key. The production
 * build imports this module, so Hosting does not depend on a runtime fetch.
 */
export const appCheckPublicConfig = {
  provider: "enterprise" as const,
  siteKey: "6Lfizh0uAAAAADl3HIjSFT7MlSJiJmhgZ9LMUXm4",
};
