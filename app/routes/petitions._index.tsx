import { PetitionList } from "@/components/unrecalled/PetitionList";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `My petitions · ${APP_TITLE}` }];
}

export default function PetitionsRoute() {
  return <PetitionList />;
}
