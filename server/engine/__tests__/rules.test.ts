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
