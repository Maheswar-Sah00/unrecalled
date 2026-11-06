import { useParams } from "react-router";

import { PetitionEditor } from "@/components/unrecalled/PetitionEditor";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `Petition · ${APP_TITLE}` }];
}

export default function PetitionRoute() {
  const { id = "" } = useParams();
  return <PetitionEditor key={id} id={id} />;
}
