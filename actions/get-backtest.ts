import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { BACKTEST } from "../server/engine/backtest.js";

export default defineAction({
  description:
    "Get the Hyundai/Kia Theta II engine-seizure backtest: when the first matching owner complaint arrived, when the early-warning rule (>=10 matching complaints and >=5x peer share) would have fired, when the recall came, the lead time in months, and the monthly series.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async () => BACKTEST,
});
