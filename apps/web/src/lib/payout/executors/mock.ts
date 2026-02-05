import { randomUUID } from "crypto";
import type {
  PayoutExecutionResult,
  PayoutExecutor,
  PayoutProviderStatus,
  PayoutWebhookValidationInput,
  PayoutWebhookValidationResult,
} from "@/src/lib/payout/types";
import { verifyWebhookSignature } from "@/src/lib/payout/webhook-processor";

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
  providerName: "MockProvider",
  supportsNewPayoutOnRetry: true,
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
  async getStatus({ providerPayoutId }) {
    const normalized = providerPayoutId.toUpperCase();
    const status: PayoutProviderStatus = normalized.includes("UNKNOWN")
      ? "UNKNOWN"
      : normalized.includes("FAIL")
        ? "FAILED"
        : normalized.includes("PROCESS")
          ? "PROCESSING"
          : "COMPLETED";
    const failed = status === "FAILED";
    return {
      ok: !failed,
      status,
      provider: "MockProvider",
      providerPayoutId,
      message: failed ? "Simulated payout failed" : undefined,
      errorCode: failed ? "MOCK_STATUS_FAILED" : undefined,
      errorMessage: failed ? "Simulated payout failed" : undefined,
    };
  },
  async validateWebhook({
    secret,
    rawBody,
    signatureHeader,
    timestampHeader,
  }: PayoutWebhookValidationInput): Promise<PayoutWebhookValidationResult> {
    if (!signatureHeader || !timestampHeader) {
      return { ok: false, errorCode: "MISSING_HEADER" };
    }
    const ok = verifyWebhookSignature({
      secret,
      rawBody,
      signatureHeader,
      timestampHeader,
    });
    return ok ? { ok: true } : { ok: false, errorCode: "INVALID_SIGNATURE" };
  },
};
