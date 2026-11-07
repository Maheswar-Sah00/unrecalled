// The call to action: the real scan form, front and centre.
import { ScanForm } from "../ScanForm";
import { Rise } from "./shared";

export function ScanSection() {
  return (
    <section className="lp-section lp-scan" aria-labelledby="lp-scan-title">
      <div className="lp-container">
        <div className="mx-auto max-w-[920px] text-center">
          <Rise>
            <h2 id="lp-scan-title" className="lp-h2">
              Scan your car.
            </h2>
          </Rise>
          <Rise delay={80}>
            <p className="lp-body mx-auto mt-4 max-w-[34rem]">
              Pick a make, model and years. Unrecalled reads every complaint and shows you what nobody covers.
            </p>
          </Rise>
        </div>
        <Rise delay={140} className="mx-auto mt-10 max-w-[920px]">
          <div id="scan" className="lp-scancard scroll-mt-[200px]">
            <ScanForm />
          </div>
        </Rise>
      </div>
    </section>
  );
}
