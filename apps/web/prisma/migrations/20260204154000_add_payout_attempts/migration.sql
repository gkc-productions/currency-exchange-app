CREATE TABLE IF NOT EXISTS "PayoutAttempt" (
  "id" TEXT NOT NULL,
  "transferId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "providerPayoutId" TEXT,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "PayoutAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PayoutAttempt_transferId_attemptNumber_idx" ON "PayoutAttempt"("transferId", "attemptNumber");
CREATE INDEX IF NOT EXISTS "PayoutAttempt_transferId_startedAt_idx" ON "PayoutAttempt"("transferId", "startedAt");

ALTER TABLE "PayoutAttempt"
ADD CONSTRAINT "PayoutAttempt_transferId_fkey"
FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
