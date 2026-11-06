import { useParams } from "react-router";

import { GapBoard } from "@/components/unrecalled/GapBoard";

export default function GapBoardRoute() {
  const { vehicleId = "" } = useParams();
  return <GapBoard key={vehicleId} vehicleId={vehicleId} />;
}
