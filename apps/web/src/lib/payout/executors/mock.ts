import { randomUUID } from "crypto";
import type { PayoutExecutionResult, PayoutExecutor } from "@/src/lib/payout/types";

function shouldFail(referenceCode: string, memo: string | null) {
  if (referenceCode.endsWith("F")) {
    return true;
  }
  if (!memo) {
    return false;
  }
  return memo.toUpperCase().includes("FAIL");
}

export const mockExecutor: PayoutExecutor = {
  name: "mock",
  async execute({ referenceCode, memo }) {
    const providerPayoutId = `mock_${randomUUID()}`;
    const failed = shouldFail(referenceCode, memo);
    const status: PayoutExecutionResult["status"] = failed ? "FAILED" : "CREATED";
    const errorCode = failed ? "MOCK_FAILURE" : undefined;
    const errorMessage = failed ? "Simulated payout failed" : undefined;

    return {
      ok: !failed,
      status,
      provider: "MockProvider",
      providerPayoutId,
      providerRef: providerPayoutId,
      message: errorMessage,
      errorCode,
      errorMessage,
    };
  },
};
