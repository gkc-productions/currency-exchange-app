-- Create enums if they do not exist
DO $$
BEGIN
  CREATE TYPE "AssetKind" AS ENUM ('FIAT', 'CRYPTO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PayoutRail" AS ENUM ('BANK', 'MOBILE_MONEY', 'LIGHTNING');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "TransferStatus" AS ENUM (
    'DRAFT',
    'READY',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELED',
    'EXPIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "TransferStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "TransferStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "TransferStatus" ADD VALUE IF NOT EXISTS 'FAILED';
ALTER TYPE "TransferStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- Create Asset table if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Asset'
  ) THEN
    CREATE TABLE "Asset" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "symbol" TEXT,
      "decimals" INTEGER NOT NULL,
      "kind" "AssetKind" NOT NULL DEFAULT 'FIAT',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX "Asset_code_key" ON "Asset"("code");
  END IF;
END $$;

-- Ensure Asset columns exist for legacy tables
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "symbol" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- Backfill Asset rows
UPDATE "Asset"
SET "id" = COALESCE(
      "id",
      md5(random()::text || clock_timestamp()::text || "code")
    ),
    "kind" = COALESCE("kind", 'FIAT'),
    "isActive" = COALESCE("isActive", true),
    "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);

-- Enforce defaults and required fields
ALTER TABLE "Asset" ALTER COLUMN "kind" SET DEFAULT 'FIAT';
ALTER TABLE "Asset" ALTER COLUMN "isActive" SET DEFAULT true;
ALTER TABLE "Asset" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Asset" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Asset" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "Asset" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Asset" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Asset" ALTER COLUMN "decimals" SET NOT NULL;
ALTER TABLE "Asset" ALTER COLUMN "kind" SET NOT NULL;
ALTER TABLE "Asset" ALTER COLUMN "isActive" SET NOT NULL;
ALTER TABLE "Asset" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Asset" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Switch primary key to id and keep code unique
ALTER TABLE "Asset" DROP CONSTRAINT IF EXISTS "Asset_pkey";
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "Asset_code_key" ON "Asset"("code");

-- Quote: add new asset relation columns as nullable first
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "fromCode" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "toCode" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "fromAssetId" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "toAssetId" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "rail" "PayoutRail";

-- Backfill quote code snapshots
UPDATE "Quote"
SET "fromCode" = COALESCE("fromCode", "fromCurrency");

UPDATE "Quote"
SET "toCode" = COALESCE("toCode", "toCurrency");

-- Insert missing assets referenced by existing quotes
INSERT INTO "Asset" (
  "id",
  "code",
  "name",
  "decimals",
  "kind",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || q.code),
  q.code,
  q.code,
  2,
  'FIAT',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "fromCurrency" AS code FROM "Quote"
  UNION
  SELECT DISTINCT "toCurrency" AS code FROM "Quote"
) AS q
LEFT JOIN "Asset" a ON a.code = q.code
WHERE a.code IS NULL AND q.code IS NOT NULL;

-- Backfill asset ids from code references
UPDATE "Quote" q
SET "fromAssetId" = a.id
FROM "Asset" a
WHERE q."fromAssetId" IS NULL
  AND a.code = q."fromCode";

UPDATE "Quote" q
SET "toAssetId" = a.id
FROM "Asset" a
WHERE q."toAssetId" IS NULL
  AND a.code = q."toCode";

-- Backfill rail for existing quotes
UPDATE "Quote"
SET "rail" = COALESCE("rail", 'MOBILE_MONEY');

-- Enforce defaults and not-null constraints
ALTER TABLE "Quote" ALTER COLUMN "rail" SET DEFAULT 'MOBILE_MONEY';
ALTER TABLE "Quote" ALTER COLUMN "fromAssetId" SET NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "toAssetId" SET NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "rail" SET NOT NULL;

-- Drop legacy columns after backfill
ALTER TABLE "Quote" DROP COLUMN IF EXISTS "fromCurrency";
ALTER TABLE "Quote" DROP COLUMN IF EXISTS "toCurrency";
ALTER TABLE "Quote" DROP COLUMN IF EXISTS "fromAssetCode";
ALTER TABLE "Quote" DROP COLUMN IF EXISTS "toAssetCode";
ALTER TABLE "Quote" DROP COLUMN IF EXISTS "railCode";

-- Quote indexes and foreign keys
CREATE INDEX IF NOT EXISTS "Quote_expiresAt_idx" ON "Quote"("expiresAt");

ALTER TABLE "Quote"
  ADD CONSTRAINT "Quote_fromAssetId_fkey"
  FOREIGN KEY ("fromAssetId")
  REFERENCES "Asset"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Quote"
  ADD CONSTRAINT "Quote_toAssetId_fkey"
  FOREIGN KEY ("toAssetId")
  REFERENCES "Asset"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Transfer: add required columns and backfill
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "payoutRail" "PayoutRail";
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "recipientCountry" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "recipientBankName" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "recipientBankAccount" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "recipientMobileMoneyProvider" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "recipientMobileMoneyNumber" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "memo" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "Transfer"
SET "payoutRail" = COALESCE(
      "payoutRail",
      ("payoutMethod"::text)::"PayoutRail"
    );

UPDATE "Transfer"
SET "recipientCountry" = COALESCE("recipientCountry", 'GH');

UPDATE "Transfer"
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);

ALTER TABLE "Transfer" ALTER COLUMN "recipientPhone" DROP NOT NULL;

ALTER TABLE "Transfer" ALTER COLUMN "payoutRail" SET DEFAULT 'MOBILE_MONEY';
ALTER TABLE "Transfer" ALTER COLUMN "recipientCountry" SET DEFAULT 'GH';
ALTER TABLE "Transfer" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Transfer" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "Transfer" ALTER COLUMN "payoutRail" SET NOT NULL;
ALTER TABLE "Transfer" ALTER COLUMN "recipientCountry" SET NOT NULL;
ALTER TABLE "Transfer" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Transfer" DROP COLUMN IF EXISTS "senderUserId";
ALTER TABLE "Transfer" DROP COLUMN IF EXISTS "payoutMethod";

CREATE INDEX IF NOT EXISTS "Transfer_quoteId_idx" ON "Transfer"("quoteId");
CREATE INDEX IF NOT EXISTS "Transfer_status_idx" ON "Transfer"("status");
CREATE INDEX IF NOT EXISTS "Transfer_createdAt_idx" ON "Transfer"("createdAt");
