CREATE TABLE IF NOT EXISTS "PayoutProviderState" (
  "id" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "isHealthy" BOOLEAN NOT NULL DEFAULT true,
  "lastCheckedAt" TIMESTAMP(3),
  "lastErrorAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayoutProviderState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PayoutProviderState_providerKey_key" ON "PayoutProviderState"("providerKey");
