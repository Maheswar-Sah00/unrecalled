import { Outlet } from "react-router";

import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `Car report · ${APP_TITLE}` }];
}

export default function GapsLayout() {
  return <Outlet />;
}
