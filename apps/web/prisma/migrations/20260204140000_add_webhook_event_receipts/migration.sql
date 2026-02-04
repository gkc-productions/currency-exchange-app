CREATE TABLE IF NOT EXISTS "WebhookEventReceipt" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "payload" JSONB,
  "signature" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookEventReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEventReceipt_provider_eventId_key" ON "WebhookEventReceipt"("provider", "eventId");
