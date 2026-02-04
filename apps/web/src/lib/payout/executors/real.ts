import { randomUUID } from "crypto";
import type { PayoutExecutionResult, PayoutExecutor } from "@/src/lib/payout/types";

const requiredEnv = ["REAL_PAYOUT_API_KEY", "REAL_PAYOUT_ENDPOINT"] as const;

function missingEnv() {
  return requiredEnv.filter((key) => !process.env[key]);
}

export const realExecutor: PayoutExecutor = {
  name: "real",
  async execute() {
    const missing = missingEnv();
    const providerPayoutId = `real_${randomUUID()}`;
    if (missing.length > 0) {
      const errorMessage = `Missing config: ${missing.join(", ")}`;
      return {
        ok: false,
        status: "FAILED",
        provider: "RealProvider",
        providerPayoutId,
        providerRef: providerPayoutId,
        message: errorMessage,
        errorCode: "REAL_EXECUTOR_NOT_CONFIGURED",
        errorMessage,
      };
    }

    return {
      ok: true,
      status: "CREATED",
      provider: "RealProvider",
      providerPayoutId,
      providerRef: providerPayoutId,
    };
  },
};
