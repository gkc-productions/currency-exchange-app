import type { PayoutExecutor } from "@/src/lib/payout/types";
import type { PayoutStatusResult } from "@/src/lib/payout/types";
import { mockExecutor } from "@/src/lib/payout/executors/mock";
import { realExecutor } from "@/src/lib/payout/executors/real";

const executorsByName: Record<string, PayoutExecutor> = {
  mock: mockExecutor,
  real: realExecutor,
};

export function getPayoutExecutor(): PayoutExecutor {
  const configured = (process.env.PAYOUT_EXECUTOR ?? "mock").toLowerCase();
  return executorsByName[configured] ?? mockExecutor;
}

export function getPayoutExecutorByName(name: string) {
  return executorsByName[name.toLowerCase()] ?? null;
}

export function getPayoutExecutorByProvider(provider: string | null) {
  if (!provider) {
    return null;
  }
  const normalized = provider.toLowerCase();
  return (
    Object.values(executorsByName).find(
      (executor) =>
        executor.name.toLowerCase() === normalized ||
        executor.providerName.toLowerCase() === normalized
    ) ?? null
  );
}

export async function getPayoutStatus(input: {
  provider: string;
  providerPayoutId: string;
}): Promise<PayoutStatusResult> {
  const executor = getPayoutExecutorByProvider(input.provider);
  if (!executor) {
    throw new Error("unknown_provider");
  }
  return executor.getStatus({ providerPayoutId: input.providerPayoutId });
}

export function getPayoutProviders(): PayoutExecutor[] {
  const configured = (process.env.PAYOUT_PROVIDERS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const names = configured.length > 0 ? configured : [getPayoutExecutor().name];
  const providers = names
    .map((name) => executorsByName[name])
    .filter((provider): provider is PayoutExecutor => Boolean(provider));
  return providers.length > 0 ? providers : [mockExecutor];
}
