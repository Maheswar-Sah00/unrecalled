import { cn } from "@/lib/utils";

export type ScanMode = "model" | "vin";

export const VIN_LENGTH = 17;

/** Uppercases and drops spaces and dashes, capped at 17 characters. */
export function cleanVin(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, "").slice(0, VIN_LENGTH);
}

/** A plain sentence on what is wrong with the VIN, or null when it looks right. */
export function vinProblem(vin: string): string | null {
  if (/[IOQ]/.test(vin)) return "VINs never use the letters I, O or Q. Check for a 1 or a 0.";
  if (/[^A-Z0-9]/.test(vin)) return "A VIN only has letters and numbers.";
  if (vin.length !== VIN_LENGTH)
    return `A VIN has 17 characters. This one has ${vin.length}.`;
  return null;
}

/** "JEEP" / "WRANGLER" from vPIC → "Jeep" / "Wrangler"; keeps BMW, CR-V, F-150. */
export function prettyName(s: string): string {
  return s
    .trim()
    .split(" ")
    .map((w) =>
      w
        .split("-")
        .map((p) => (/^[A-Z]{4,}$/.test(p) ? p[0] + p.slice(1).toLowerCase() : p))
        .join("-"),
    )
    .join(" ");
}

const MODES: { id: ScanMode; label: string }[] = [
  { id: "model", label: "Make & model" },
  { id: "vin", label: "VIN" },
];

/** Two-option segmented control: a sliding paper thumb on a soft ink track. */
export function ModeSwitch({
  value,
  onChange,
  disabled,
}: {
  value: ScanMode;
  onChange: (m: ScanMode) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Scan by"
      className="relative grid shrink-0 grid-cols-2 rounded-[10px] bg-foreground/[0.06] p-[3px]"
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-[7px] border border-border bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.08)] dark:border-foreground/10 dark:bg-foreground/[0.12] dark:shadow-none transition-transform duration-200 ease-out motion-reduce:transition-none",
          value === "vin" && "translate-x-full",
        )}
      />
      {MODES.map((m) => {
        const on = m.id === value;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={cn(
              "relative z-10 h-7 whitespace-nowrap rounded-[7px] px-3 text-[12.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
