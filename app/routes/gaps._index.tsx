import { redirect } from "react-router";

// The landing moved to "/". Old links to /gaps (breadcrumbs, the agent's
// navigate tool, bookmarks) land on the homepage; /gaps/<vehicleId> is untouched.
export function loader() {
  return redirect("/");
}

export function clientLoader() {
  return redirect("/");
}

export default function GapsIndexRoute() {
  return null;
}
