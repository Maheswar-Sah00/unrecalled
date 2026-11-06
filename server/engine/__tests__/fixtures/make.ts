import type { Complaint, FailureMode, Investigation, Recall, Settlement } from "../../types.js";

let n = 1000;
export function complaint(p: Partial<Complaint> = {}): Complaint {
  n++;
  return {
    odiNumber: String(n),
    make: "JEEP",
    model: "WRANGLER",
    modelYear: 2021,
    dateReceived: "2021-06-15",
    dateIncident: null,
    components: "STEERING",
    summary: "",
    crash: false,
    fire: false,
    injuries: 0,
    deaths: 0,
    ...p,
  };
}

export const WOBBLE: FailureMode = {
  id: "death-wobble",
  name: "Death wobble",
  componentHints: ["STEERING", "SUSPENSION"],
  include: ["death\\s*wobble", "violent(ly)?\\s+(shak|wobbl|vibrat)", "front\\s*end\\s+(shake|shaking|wobble)"],
  exclude: ["tire\\s+balanc"],
  coverageTerms: ["wobble", "shimmy", "steering damper"],
  hazard: "Loss of steering control at highway speed.",
};

export const FUEL: FailureMode = {
  id: "fuel-pump",
  name: "Fuel pump failure",
  componentHints: ["FUEL"],
  include: ["fuel\\s+pump"],
  exclude: [],
  coverageTerms: ["fuel pump"],
  hazard: "Stall.",
};

export function recall(p: Partial<Recall> = {}): Recall {
  return {
    campaign: "21V000000",
    make: "JEEP",
    model: "WRANGLER",
    modelYear: 2021,
    component: "STEERING",
    summary: "",
    consequence: "",
    remedy: "",
    reportDate: "2021-01-28",
    ...p,
  };
}

export function investigation(p: Partial<Investigation> = {}): Investigation {
  return {
    actionNumber: "PE99001",
    type: "PE",
    make: "JEEP",
    model: "WRANGLER",
    yearFrom: 2018,
    yearTo: 2019,
    component: "STEERING",
    subject: "Steering wobble",
    summary: "",
    openDate: "2019-09-16",
    closeDate: null,
    status: "open",
    outcome: "unknown",
    url: null,
    ...p,
  };
}

export function settlement(p: Partial<Settlement> = {}): Settlement {
  return {
    id: "reynolds-v-fca",
    name: "Reynolds v. FCA (death wobble)",
    make: "JEEP",
    model: "WRANGLER",
    yearFrom: 2018,
    yearTo: 2020,
    failureModeId: "death-wobble",
    url: "https://example.org/reynolds",
    summary: "Extended steering damper warranty.",
    ...p,
  };
}
