// The homepage. Signed-out visitors are sent to sign-in by the app's session
// gate (RequireSession in AppProviders) and come back here afterwards, because
// app.homePath is "/" (server/plugins/agent-native-email-branding.ts).
import { GapsHome } from "@/components/unrecalled/GapsHome";
import { APP_TITLE } from "@/lib/app-config";

const SEO_TITLE = `${APP_TITLE}: find the car defects nobody is fixing`;
const SEO_DESCRIPTION =
  "Owners report car problems to NHTSA every day. Unrecalled finds the ones no recall, investigation or settlement covers, and its agent drafts the petition asking NHTSA to investigate.";

export function meta() {
  return [
    { title: SEO_TITLE },
    { name: "description", content: SEO_DESCRIPTION },
    { property: "og:title", content: SEO_TITLE },
    { property: "og:description", content: SEO_DESCRIPTION },
    { name: "twitter:card", content: "summary" },
  ];
}

export default function IndexRoute() {
  return <GapsHome />;
}
