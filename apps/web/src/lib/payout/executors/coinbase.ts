import { randomUUID } from "crypto";
import type {
  PayoutExecutionResult,
  PayoutExecutor,
  PayoutProviderStatus,
  PayoutWebhookValidationInput,
  PayoutWebhookValidationResult,
} from "@/src/lib/payout/types";
import { verifyWebhookSignature } from "@/src/lib/payout/webhook-processor";

const requiredEnv = [
  "COINBASE_API_KEY",
  "COINBASE_ACCOUNT_ID",
  "COINBASE_WEBHOOK_SECRET",
] as const;

function missingEnv() {
  return requiredEnv.filter((key) => !process.env[key]);
}

export const coinbaseExecutor: PayoutExecutor = {
  name: "coinbase",
  providerName: "Coinbase",
  supportsNewPayoutOnRetry: true,
  async execute() {
    const providerPayoutId = `coinbase_${randomUUID()}`;
    const missing = missingEnv();
    if (missing.length > 0) {
      const errorMessage = `Missing config: ${missing.join(", ")}`;
      return {
        ok: false,
        status: "FAILED",
        provider: "Coinbase",
        providerPayoutId,
        providerRef: providerPayoutId,
        message: errorMessage,
        errorCode: "COINBASE_NOT_CONFIGURED",
        errorMessage,
      };
    }

    // TODO: Implement real Coinbase payout initiation.
    return {
      ok: false,
      status: "FAILED",
      provider: "Coinbase",
      providerPayoutId,
      providerRef: providerPayoutId,
      message: "Coinbase executor not implemented",
      errorCode: "COINBASE_NOT_IMPLEMENTED",
      errorMessage: "Coinbase executor not implemented",
    };
  },
  async getStatus({ providerPayoutId }) {
    const missing = missingEnv();
    if (missing.length > 0) {
      const errorMessage = `Missing config: ${missing.join(", ")}`;
      return {
        ok: false,
        status: "FAILED",
        provider: "Coinbase",
        providerPayoutId,
        message: errorMessage,
        errorCode: "COINBASE_NOT_CONFIGURED",
        errorMessage,
      };
    }

    const status: PayoutProviderStatus = "PROCESSING";
    return {
      ok: true,
      status,
      provider: "Coinbase",
      providerPayoutId,
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
