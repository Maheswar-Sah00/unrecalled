import { defineAppConfig } from "@agent-native/core/server";

export default defineAppConfig({
  app: {
    // This name appears in transactional emails. Change it to your product name.
    name: "Unrecalled",
    // The source template keeps a renamed app from inheriting first-party email branding.
    sourceTemplate: "chat",
    // The homepage ("/") is the authenticated entry; sign-in returns there.
    homePath: "/",
    // Optional: use your own absolute HTTPS logo URL in transactional emails.
    // logoUrl: "https://example.com/logo.png",
  },
});
