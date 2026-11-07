import { redirect } from "react-router";

import { APP_TITLE } from "@/lib/app-config";

// The template's "/home" page is not part of Unrecalled; anything that still
// links here (the agent's navigate fallback, old bookmarks) lands on "/".
export function loader() {
  return redirect("/");
}

export function clientLoader() {
  return redirect("/");
}

export function meta() {
  return [{ title: `Ask the agent · ${APP_TITLE}` }];
}

export default function HomeRoute() {
  return null;
}
