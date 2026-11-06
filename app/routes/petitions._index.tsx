import { PetitionList } from "@/components/unrecalled/PetitionList";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `Petitions · ${APP_TITLE}` }];
}

export default function PetitionsRoute() {
  return <PetitionList />;
}
