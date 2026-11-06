import { useParams } from "react-router";

import { ClusterDetail } from "@/components/unrecalled/ClusterDetail";

export default function ClusterRoute() {
  const { vehicleId = "", modeId = "" } = useParams();
  return (
    <ClusterDetail
      key={`${vehicleId}/${modeId}`}
      vehicleId={vehicleId}
      modeId={modeId}
    />
  );
}
