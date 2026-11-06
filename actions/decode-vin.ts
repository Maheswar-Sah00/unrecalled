import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { decodeVin } from "../server/lib/unrecalled.js";

export default defineAction({
  description:
    "Decode a 17-character VIN with NHTSA vPIC into make, model and model year, so an owner can scan their own vehicle.",
  schema: z.object({
    vin: z
      .string()
      .regex(/^[A-HJ-NPR-Z0-9]{17}$/i)
      .describe("17-character VIN"),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ vin }) => {
    const r = await decodeVin(vin.toUpperCase());
    if (!r?.make || !r?.model || !r?.modelYear)
      fail("NHTSA could not decode that VIN.", {
        statusCode: 404,
        errorCode: "vin_not_decoded",
      });
    return r;
  },
});
