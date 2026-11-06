import { Page, useCrumbs } from "./page";
import { ScanForm } from "./ScanForm";
import { VehicleList } from "./VehicleList";

export function GapsHome() {
  useCrumbs([{ label: "Gaps" }]);
  return (
    <Page>
      <h1 className="mb-4 max-w-2xl text-xl font-semibold leading-snug tracking-tight">
        Which defects are owners reporting that no recall, investigation or
        settlement covers?
      </h1>
      <ScanForm />
      <VehicleList />
    </Page>
  );
}
