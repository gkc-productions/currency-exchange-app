-- Create crypto payout enums if they do not exist
DO $$
BEGIN
  CREATE TYPE "CryptoNetwork" AS ENUM ('BTC_LIGHTNING', 'BTC_ONCHAIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CryptoPayoutStatus" AS ENUM (
    'CREATED',
    'REQUESTED',
    'PAID',
    'EXPIRED',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create CryptoPayout table if it does not exist
CREATE TABLE IF NOT EXISTS "CryptoPayout" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "network" "CryptoNetwork" NOT NULL,
    "invoice" TEXT,
    "paymentHash" TEXT,
    "address" TEXT,
    "amountSats" INTEGER NOT NULL,
    "status" "CryptoPayoutStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CryptoPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CryptoPayout_transferId_key" ON "CryptoPayout"("transferId");
CREATE INDEX IF NOT EXISTS "CryptoPayout_transferId_idx" ON "CryptoPayout"("transferId");
CREATE INDEX IF NOT EXISTS "CryptoPayout_status_idx" ON "CryptoPayout"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CryptoPayout_transferId_fkey'
  ) THEN
    ALTER TABLE "CryptoPayout"
      ADD CONSTRAINT "CryptoPayout_transferId_fkey"
      FOREIGN KEY ("transferId") REFERENCES "Transfer"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
