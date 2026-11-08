import { defineAgentNativeConfig } from "@agent-native/core/config";

export default defineAgentNativeConfig({
  changelog: { enabled: false },
  harness: true,
  // Public hackathon demo: no sign-in on purpose (AUTH_DISABLED=1 on Render),
  // so the production config check must not flag it as an error.
  runtime: { auth: { enabled: false } },
});
