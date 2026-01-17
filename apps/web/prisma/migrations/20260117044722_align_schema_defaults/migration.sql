-- AlterTable
ALTER TABLE "Asset" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Corridor" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "rail" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Route" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Transfer" ALTER COLUMN "payoutRail" DROP DEFAULT,
ALTER COLUMN "recipientCountry" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropEnum
DROP TYPE "PayoutMethod";
