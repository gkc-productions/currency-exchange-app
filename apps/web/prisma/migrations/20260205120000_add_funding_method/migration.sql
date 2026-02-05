-- Add FundingMethod enum and fundingMethod column on Transfer
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FundingMethod') THEN
    CREATE TYPE "FundingMethod" AS ENUM ('CARD', 'BANK', 'WALLET', 'CRYPTO');
  END IF;
END $$;

ALTER TABLE "Transfer"
  ADD COLUMN IF NOT EXISTS "fundingMethod" "FundingMethod" NOT NULL DEFAULT 'CARD';
