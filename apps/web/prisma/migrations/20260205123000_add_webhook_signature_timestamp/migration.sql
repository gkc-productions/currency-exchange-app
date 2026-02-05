ALTER TABLE "PayoutWebhookEvent" ADD COLUMN IF NOT EXISTS "signatureTimestamp" TIMESTAMP(3);
