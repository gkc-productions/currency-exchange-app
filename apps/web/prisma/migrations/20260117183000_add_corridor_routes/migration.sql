-- Quote rate metadata
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "rateSource" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "rateTimestamp" TIMESTAMP(3);

UPDATE "Quote"
SET "rateSource" = COALESCE("rateSource", 'MockRateProvider'),
    "rateTimestamp" = COALESCE("rateTimestamp", "createdAt", CURRENT_TIMESTAMP);

ALTER TABLE "Quote" ALTER COLUMN "rateSource" SET DEFAULT 'MockRateProvider';
ALTER TABLE "Quote" ALTER COLUMN "rateTimestamp" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Quote" ALTER COLUMN "rateSource" SET NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "rateTimestamp" SET NOT NULL;

-- Corridor table
CREATE TABLE IF NOT EXISTS "Corridor" (
  "id" TEXT NOT NULL,
  "fromAssetId" TEXT NOT NULL,
  "toAssetId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Corridor_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Corridor_fromAssetId_fkey" FOREIGN KEY ("fromAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Corridor_toAssetId_fkey" FOREIGN KEY ("toAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Corridor_fromAssetId_toAssetId_key" ON "Corridor"("fromAssetId", "toAssetId");
CREATE INDEX IF NOT EXISTS "Corridor_fromAssetId_idx" ON "Corridor"("fromAssetId");
CREATE INDEX IF NOT EXISTS "Corridor_toAssetId_idx" ON "Corridor"("toAssetId");
CREATE INDEX IF NOT EXISTS "Corridor_isActive_idx" ON "Corridor"("isActive");

-- Route table
CREATE TABLE IF NOT EXISTS "Route" (
  "id" TEXT NOT NULL,
  "corridorId" TEXT NOT NULL,
  "rail" "PayoutRail" NOT NULL,
  "provider" TEXT NOT NULL,
  "feeFixed" DECIMAL(18,2) NOT NULL,
  "feePct" DECIMAL(5,2) NOT NULL,
  "fxMarginPct" DECIMAL(5,2) NOT NULL,
  "etaMinMinutes" INTEGER NOT NULL,
  "etaMaxMinutes" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Route_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Route_corridorId_fkey" FOREIGN KEY ("corridorId") REFERENCES "Corridor"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Route_corridorId_idx" ON "Route"("corridorId");
CREATE INDEX IF NOT EXISTS "Route_corridorId_rail_idx" ON "Route"("corridorId", "rail");
CREATE INDEX IF NOT EXISTS "Route_isActive_idx" ON "Route"("isActive");
