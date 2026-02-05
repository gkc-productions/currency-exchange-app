import { prisma } from "@/src/lib/prisma";

export type ProviderState = {
  providerKey: string;
  isEnabled: boolean;
  isHealthy: boolean;
  lastCheckedAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

export async function ensureProviderStates(providerKeys: string[]) {
  const uniqueKeys = Array.from(new Set(providerKeys.filter(Boolean)));
  await Promise.all(
    uniqueKeys.map((providerKey) =>
      prisma.payoutProviderState.upsert({
        where: { providerKey },
        update: {},
        create: { providerKey },
      })
    )
  );
}

export async function getProviderStates(providerKeys: string[]) {
  await ensureProviderStates(providerKeys);
  const states = await prisma.payoutProviderState.findMany({
    where: { providerKey: { in: providerKeys } },
  });
  return new Map(states.map((state) => [state.providerKey, state]));
}

export async function updateProviderHealth(params: {
  providerKey: string;
  isHealthy: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
}) {
  const now = new Date();
  await prisma.payoutProviderState.upsert({
    where: { providerKey: params.providerKey },
    update: {
      isHealthy: params.isHealthy,
      lastCheckedAt: now,
      lastErrorAt: params.isHealthy ? null : now,
      lastErrorCode: params.isHealthy ? null : params.errorCode ?? null,
      lastErrorMessage: params.isHealthy ? null : params.errorMessage ?? null,
    },
    create: {
      providerKey: params.providerKey,
      isHealthy: params.isHealthy,
      lastCheckedAt: now,
      lastErrorAt: params.isHealthy ? null : now,
      lastErrorCode: params.isHealthy ? null : params.errorCode ?? null,
      lastErrorMessage: params.isHealthy ? null : params.errorMessage ?? null,
    },
  });
}
