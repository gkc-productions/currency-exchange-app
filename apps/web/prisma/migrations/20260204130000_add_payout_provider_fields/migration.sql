ALTER TABLE "Transfer"
  ADD COLUMN IF NOT EXISTS "providerPayoutId" TEXT,
  ADD COLUMN IF NOT EXISTS "providerPayoutStatus" TEXT;

CREATE TABLE IF NOT EXISTS "PayoutWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerPayoutId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "transferId" TEXT NOT NULL,
  CONSTRAINT "PayoutWebhookEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PayoutWebhookEvent_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PayoutWebhookEvent_eventId_key" ON "PayoutWebhookEvent"("eventId");
CREATE INDEX IF NOT EXISTS "PayoutWebhookEvent_transferId_receivedAt_idx" ON "PayoutWebhookEvent"("transferId", "receivedAt");
CREATE INDEX IF NOT EXISTS "PayoutWebhookEvent_providerPayoutId_idx" ON "PayoutWebhookEvent"("providerPayoutId");
