-- Add receipt issuance fields to Transfer
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "receiptIssuedAt" TIMESTAMP(3);
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "receiptEmailSendingAt" TIMESTAMP(3);
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "receiptEmailSentAt" TIMESTAMP(3);
