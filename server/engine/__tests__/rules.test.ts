import { describe, expect, it } from "vitest";

import { compileMode, DEFAULT_PEERS, matchesMode, SEED_MODES, SEED_SETTLEMENTS } from "../rules.js";

const mode = (id: string) => {
  const m = SEED_MODES.find((x) => x.id === id);
  if (!m) throw new Error(`missing mode ${id}`);
  return m;
};

describe("SEED_MODES", () => {
  it("has at least 20 modes with unique ids and complete fields", () => {
    expect(SEED_MODES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(SEED_MODES.map((m) => m.id)).size).toBe(SEED_MODES.length);
    for (const m of SEED_MODES) {
      expect(m.include.length).toBeGreaterThan(0);
      expect(m.coverageTerms.length).toBeGreaterThan(0);
      expect(m.componentHints.length).toBeGreaterThan(0);
      expect(m.hazard.length).toBeGreaterThan(20);
    }
  });

  it("every regex source compiles case-insensitively", () => {
    for (const m of SEED_MODES) {
      for (const src of [...m.include, ...m.exclude, ...m.coverageTerms]) {
        expect(() => new RegExp(src, "i"), `${m.id}: ${src}`).not.toThrow();
      }
    }
  });

  const cases: Record<string, { pos: string[]; neg: string[] }> = {
    "death-wobble": {
      pos: [
        "At 65 mph I hit a bump on the interstate and the front end started shaking violently until I slowed to 40.",
        "My 2021 Wrangler has the death wobel again, dealer replaced the steering damper.",
        "The steering wheel began to wobble uncontrollably after going over an expansion joint on the highway.",
        "Jeep went into DEATH WOBBLE on the bridge.",
      ],
      neg: [
        "The radio stopped working and the backup camera is black.",
        "Slight vibration in the steering wheel only when I apply the brakes, warped rotors were replaced.",
        "The vehicle shakes when sitting at a red light with the engine idling.",
      ],
    },
    "phantom-braking": {
      pos: [
        "While on autopilot the car slammed on the brakes for no reason with no cars ahead.",
        "Phantom braking happens almost every trip on the highway.",
        "Using adaptive cruise control the vehicle suddenly braked hard when nothing was in front of me; I was nearly rear-ended.",
      ],
      neg: [
        "The brake pedal went to the floor and the brakes failed at a stop sign.",
        "My cruise control would not engage on the highway.",
        "The car accelerated on its own in the parking lot.",
      ],
    },
    "engine-seizure": {
      pos: [
        "Driving at 70 mph the engine seized and I lost all power.",
        "Dealer said the connecting rod bearing failed and the engine needs to be replaced.",
        "Engine started knocking loudly and then the car stalled on the freeway and had to be towed.",
        "Mechanic said it threw a rod.",
      ],
      neg: [
        "The check engine light came on and the gas cap was loose.",
        "Infotainment screen reboots while driving.",
        "I am worried this could lead to engine failure someday.",
      ],
    },
    "iccu-12v-power-loss": {
      pos: [
        "The ICCU failed and the car lost power on the highway.",
        "Heard a loud pop and then lost all power while driving; dealer replaced the integrated charging control unit.",
        "The 12V battery died while driving and the car shut down and I was stranded.",
      ],
      neg: [
        "The charging port door will not open.",
        "Windshield cracked after a rock hit it.",
        "The radio volume is too loud.",
      ],
    },
    "vehicle-fire": {
      pos: [
        "The car caught fire in my garage while parked.",
        "Smoke was coming from under the hood and the engine compartment was on fire.",
        "The battery went into thermal runaway.",
      ],
      neg: [
        "The seat heater does not get warm.",
        "The fire department was not called because nothing happened.",
        "The headlights flicker at night.",
      ],
    },
  };

  for (const [id, { pos, neg }] of Object.entries(cases)) {
    describe(id, () => {
      const c = compileMode(mode(id));
      for (const p of pos) it(`matches: ${p.slice(0, 60)}`, () => expect(matchesMode(p, c)).toBe(true));
      for (const n of neg) it(`does not match: ${n.slice(0, 60)}`, () => expect(matchesMode(n, c)).toBe(false));
    });
  }

  it("coverage terms recognise recall wording for the same defect", () => {
    const cov = (id: string, text: string) => compileMode(mode(id)).coverage.some((r) => r.test(text));
    expect(cov("death-wobble", "Replace the steering damper to reduce front suspension oscillation")).toBe(true);
    expect(cov("engine-seizure", "Machining errors may cause premature connecting rod bearing wear")).toBe(true);
    expect(cov("phantom-braking", "The automatic emergency braking system may activate unexpectedly")).toBe(true);
    expect(cov("death-wobble", "Power steering pump may short circuit and cause a fire")).toBe(false);
  });
});

// Real NHTSA recall text (summary + consequence + remedy, abridged) and ODI investigation excerpts.
const REAL = {
  "21V846": "A communication error may cause false forward-collision warning (FCW) or unexpected activation of the automatic emergency brake (AEB) system.\nUnexpected activation of the AEB system may cause the car to stop suddenly, increasing the risk of a crash.\nTesla Service has released an over-the-air (OTA) software update, free of charge.",
  "22V317": "The fisheye and narrow camera cable terminals were incorrectly installed in the cable harness connector, resulting in swapped camera views.\nSwapped camera views can prevent the vehicle's cameras from detecting crossing objects and high-curvature lane lines, impairing the Autosteer and Automatic Emergency Braking (AEB) performance, and increasing the risk of a crash.\nTesla Service will correct the swapped terminals and recalibrate the cameras, free of charge.",
  "24V153": "A factory reset muted the Pedestrian Warning System (PWS) sounds. As such, these vehicles fail to comply with the requirements of Federal Motor Vehicle Safety Standard number 141, \"Minimum Sound Requirements for Hybrid and Electric Vehicles.\"\nPedestrians may be unaware of an approaching vehicle if the PWS sounds are muted, increasing the risk of a crash.\nTesla released an over-the-air (OTA) software update, release 2023.44.30.14, free of charge.",
  "18V675": "The front track bar brackets may be improperly welded, which can cause the bracket to separate from the frame, reducing steering capability.\nAn unexpected reduction in steering ability, can increase the risk of a crash.\nChrysler will notify owners, and dealers will inspect and repair the track bar bracket welds, as necessary, free of charge.",
  "24V868": "The Integrated Charging Control Unit (ICCU) may become damaged and stop charging the 12-volt battery, which can result in a loss of drive power.\nA loss of drive power increases the risk of a crash.\nDealers will inspect and replace the ICCU and its fuse, as necessary. In addition, dealers will update the ICCU software.",
  "17V224": "Machining errors during the engine manufacturing process may cause premature bearing wear within the engine.\nBearing wear may result in the engine seizing, increasing the risk of a crash.\nKia will notify owners, and dealers will inspect the engine assembly, and replace the engine if necessary, free of charge.",
  "15V568": "In the affected vehicles, metallic debris may not have been fully removed during manufacturing of the engine crankshaft. If the debris was not completely removed, oil flow may be restricted through the connecting rod bearings, causing connecting rod damage.\nEngine failure would result in a vehicle stall, increasing the risk of a crash.",
  "21V560": "The high voltage battery could catch fire when charged to full or nearly full capacity.\nA battery fire increases the risk of injury.\nDefective battery modules will be replaced by GM, free of charge.",
  PE19012:
    "Frame weld deficiencies\nDue to a previous steering related recall that was caused by a misaligned weld on the front track bar (NHTSA Recall No. 18V-675), ODI decided to include reports of steering shimmy or wobble, loose steering, and steering stiction (loss of power steering) as part of this investigation and parent petition (DP18-004).",
  PE22002:
    "Unexpected Brake Activation\nOn February 16, 2022, the Office of Defects Investigation (ODI) opened a Preliminary Evaluation (PE22002) to investigate reports of unexpected deceleration while driving with the adaptive cruise control system engaged in Model Year (MY) 2021 – 2022 Model 3 and Model Y vehicles manufactured by Tesla. These complaints have been colloquially referred to as “phantom braking”.",
};

describe("coverageTerms on real recall and investigation text", () => {
  const covers = (id: string, text: string) => compileMode(mode(id)).coverage.some((r) => r.test(text));
  const coveredBy = (text: string) => SEED_MODES.filter((m) => covers(m.id, text)).map((m) => m.id);

  it.each([
    ["21V846", "phantom-braking"],
    ["PE22002", "phantom-braking"],
    ["PE19012", "death-wobble"],
    ["17V224", "engine-seizure"],
    ["15V568", "engine-seizure"],
    ["24V868", "iccu-12v-power-loss"],
    ["21V560", "vehicle-fire"],
  ] as const)("%s covers %s", (ref, modeId) => {
    expect(covers(modeId, REAL[ref])).toBe(true);
  });

  it("22V317 (swapped camera views, mentions AEB performance) is not phantom braking", () => {
    expect(covers("phantom-braking", REAL["22V317"])).toBe(false);
  });
  it("24V153 (pedestrian warning sounds muted) is not phantom braking", () => {
    expect(covers("phantom-braking", REAL["24V153"])).toBe(false);
  });
  it("18V675 (track bar bracket welds) is not death wobble but is a suspension fracture", () => {
    expect(covers("death-wobble", REAL["18V675"])).toBe(false);
    expect(covers("suspension-break", REAL["18V675"])).toBe(true);
  });
  it("24V153 matches no failure mode at all", () => {
    expect(coveredBy(REAL["24V153"])).toEqual([]);
  });
  it("the ICCU recall is not mistaken for engine seizure or a fire", () => {
    expect(coveredBy(REAL["24V868"])).not.toContain("engine-seizure");
    expect(coveredBy(REAL["24V868"])).not.toContain("vehicle-fire");
  });
  it("bare system names do not count as coverage", () => {
    expect(covers("death-wobble", "Track bar")).toBe(false);
    expect(covers("phantom-braking", "FORWARD COLLISION AVOIDANCE")).toBe(false);
    expect(covers("seat-belt-failure", "The driver may be unaware that their seat belt is not fastened.")).toBe(false);
  });
});

describe("SEED_SETTLEMENTS", () => {
  it("includes Reynolds v. FCA for 2018–2020 Wrangler and 2020 Gladiator", () => {
    const w = SEED_SETTLEMENTS.find((s) => s.model === "WRANGLER");
    const g = SEED_SETTLEMENTS.find((s) => s.model === "GLADIATOR");
    expect(w).toMatchObject({ make: "JEEP", yearFrom: 2018, yearTo: 2020, failureModeId: "death-wobble" });
    expect(g).toMatchObject({ make: "JEEP", yearFrom: 2020, yearTo: 2020, failureModeId: "death-wobble" });
    for (const s of SEED_SETTLEMENTS) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(SEED_MODES.some((m) => m.id === s.failureModeId)).toBe(true);
    }
  });
});

describe("DEFAULT_PEERS", () => {
  it("maps demo vehicles to same-segment peers", () => {
    expect(DEFAULT_PEERS["JEEP|WRANGLER"]?.length).toBeGreaterThan(0);
    expect(DEFAULT_PEERS["TESLA|MODEL 3"]?.length).toBeGreaterThan(0);
    expect(DEFAULT_PEERS["HYUNDAI|SONATA"]).toContainEqual({ make: "TOYOTA", model: "CAMRY" });
    expect(DEFAULT_PEERS["NOPE|NOPE"]).toBeUndefined();
  });
});
