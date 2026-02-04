ALTER TABLE "Transfer"
  ADD COLUMN IF NOT EXISTS "providerPayoutProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "providerPayoutUpdatedAt" TIMESTAMP(3);
