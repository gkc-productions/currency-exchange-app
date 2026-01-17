-- Add referenceCode to Transfer with safe backfill.
ALTER TABLE "Transfer" ADD COLUMN "referenceCode" TEXT;

UPDATE "Transfer"
SET "referenceCode" = 'FX-' || SUBSTRING(UPPER(MD5("id")) FROM 1 FOR 6)
WHERE "referenceCode" IS NULL;

ALTER TABLE "Transfer" ALTER COLUMN "referenceCode" SET NOT NULL;

CREATE UNIQUE INDEX "Transfer_referenceCode_key" ON "Transfer"("referenceCode");

-- Create TransferEvent timeline table.
CREATE TABLE "TransferEvent" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TransferEvent_transferId_createdAt_idx" ON "TransferEvent"("transferId", "createdAt");

ALTER TABLE "TransferEvent" ADD CONSTRAINT "TransferEvent_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
