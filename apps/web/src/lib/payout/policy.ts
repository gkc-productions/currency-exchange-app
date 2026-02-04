export type PayoutStatus = "FAILED" | "COMPLETED" | "PROCESSING" | "READY";

export type PayoutNextAction = "RETRY_SAME_PROVIDER" | "FAILOVER_PROVIDER" | "STOP";

export type PayoutPolicyInput = {
  status: PayoutStatus;
  failureCode?: string | null;
  attempts: number;
  provider?: string | null;
};

const RETRYABLE_CODES = new Set([
  "NETWORK_ERROR",
  "TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "RATE_LIMITED",
]);

const FAILOVER_CODES = new Set([
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_DOWN",
]);

const MAX_RETRY_ATTEMPTS = 3;

export function decideNextAction({
  status,
  failureCode,
  attempts,
  provider,
}: PayoutPolicyInput): PayoutNextAction {
  if (status !== "FAILED") {
    return "STOP";
  }

  const normalizedCode = failureCode?.toUpperCase() ?? null;
  const normalizedAttempts = Number.isFinite(attempts) ? Math.max(0, attempts) : 0;
  const providerName = provider ?? "";

  if (normalizedCode && RETRYABLE_CODES.has(normalizedCode)) {
    if (normalizedAttempts < MAX_RETRY_ATTEMPTS) {
      return "RETRY_SAME_PROVIDER";
    }
    if (providerName && providerName !== "MockProvider") {
      return "FAILOVER_PROVIDER";
    }
    return "STOP";
  }

  if (normalizedCode && FAILOVER_CODES.has(normalizedCode)) {
    if (providerName && providerName !== "MockProvider") {
      return "FAILOVER_PROVIDER";
    }
  }

  return "STOP";
}
