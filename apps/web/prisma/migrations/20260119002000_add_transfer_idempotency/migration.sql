-- Add optional idempotency key to Transfer
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Transfer_idempotencyKey_key" ON "Transfer"("idempotencyKey");
