import { RulesEditor } from "@/components/unrecalled/RulesEditor";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `Rules · ${APP_TITLE}` }];
}

export default function RulesRoute() {
  return <RulesEditor />;
}
